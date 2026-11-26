import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import zlib from 'zlib';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

const execFileAsync = promisify(execFile);

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '4mb' }));

const RENDERS_DIR = path.join(os.tmpdir(), 'storysprout-renders');
const QUEUE_FILE = path.resolve(__dirname, '.storysprout-queue.json');
fs.mkdirSync(RENDERS_DIR, { recursive: true });

export type QueueApprovalStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'published';

export interface StudioQueueItem {
  id: string;
  episodeId: number;
  title: string;
  trainName: string;
  formatMode: 'preview' | 'full5min' | 'short';
  filename: string;
  mimeType: string;
  sizeBytes: number;
  durationSec: number;
  status: QueueApprovalStatus;
  youtubeTitle: string;
  youtubeDescription: string;
  tags: string[];
  createdAt: string;
  approvedAt?: string;
  scheduledSlot?: string;
  publishedAt?: string;
  youtubeVideoId?: string;
  notes?: string;
}

export interface QueueCheckEntry {
  id: string;
  checkedAt: string;
  slotLabel: string;
  trigger: 'cron_30m' | 'manual_check' | 'startup';
  pendingCount: number;
  approvedReadyCount: number;
  publishedTodayCount: number;
  outcome: string;
}

interface QueueState {
  studioName: string;
  channelHandle: string;
  publishingMode: 'approval';
  cadenceMinutes: number;
  lastSlotKey: string | null;
  items: StudioQueueItem[];
  checkHistory: QueueCheckEntry[];
}

function defaultQueueState(): QueueState {
  return {
    studioName: 'StorySprout Studio',
    channelHandle: '@RadiantSparkGlobal',
    publishingMode: 'approval',
    cadenceMinutes: 30,
    lastSlotKey: null,
    items: [],
    checkHistory: [],
  };
}

function loadQueueState(): QueueState {
  try {
    if (!fs.existsSync(QUEUE_FILE)) {
      return defaultQueueState();
    }
    const raw = fs.readFileSync(QUEUE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<QueueState>;
    const validItems = (Array.isArray(parsed.items) ? parsed.items : []).filter((item) =>
      fs.existsSync(path.join(RENDERS_DIR, item.filename))
    );
    return {
      studioName: 'StorySprout Studio',
      channelHandle: '@RadiantSparkGlobal',
      publishingMode: 'approval',
      cadenceMinutes: 30,
      lastSlotKey: parsed.lastSlotKey ?? null,
      items: validItems,
      checkHistory: Array.isArray(parsed.checkHistory) ? parsed.checkHistory.slice(0, 20) : [],
    };
  } catch {
    return defaultQueueState();
  }
}

function saveQueueState(state: QueueState) {
  try {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist StorySprout queue:', err);
  }
}

function getCurrentHalfHourSlotKey(date = new Date()): string {
  const d = new Date(date);
  const mins = d.getMinutes() >= 30 ? 30 : 0;
  d.setMinutes(mins, 0, 0);
  return d.toISOString();
}

function getUpcomingHalfHourSlots(count = 6, from = new Date()): string[] {
  const slots: string[] = [];
  const base = new Date(from);
  const currentMins = base.getMinutes();
  base.setSeconds(0, 0);
  if (currentMins < 30) {
    base.setMinutes(30);
  } else {
    base.setHours(base.getHours() + 1);
    base.setMinutes(0);
  }
  for (let i = 0; i < count; i++) {
    slots.push(new Date(base.getTime() + i * 30 * 60 * 1000).toISOString());
  }
  return slots;
}

function runThirtyMinuteQueueCheck(trigger: 'cron_30m' | 'manual_check' | 'startup'): {
  state: QueueState;
  entry: QueueCheckEntry;
} {
  const state = loadQueueState();
  const now = new Date();
  const slotKey = getCurrentHalfHourSlotKey(now);
  const todayStr = now.toISOString().slice(0, 10);

  const pendingCount = state.items.filter((i) => i.status === 'pending_approval').length;
  const approvedItems = state.items.filter((i) => i.status === 'approved');
  const publishedTodayCount = state.items.filter(
    (i) => i.status === 'published' && (i.publishedAt || '').startsWith(todayStr)
  ).length;

  const upcomingSlots = getUpcomingHalfHourSlots(Math.max(approvedItems.length, 1), now);
  approvedItems.forEach((item, idx) => {
    if (!item.scheduledSlot) {
      item.scheduledSlot = upcomingSlots[idx] || upcomingSlots[0];
    }
  });

  let outcome = '';
  if (pendingCount === 0 && approvedItems.length === 0) {
    outcome =
      'Queue clear: 0 pending and 0 approved clips waiting. Create & render an episode to enter Pending Approval.';
  } else if (approvedItems.length > 0 && publishedTodayCount >= 6) {
    outcome = `${approvedItems.length} approved clip(s) held safely — daily YouTube Kids cap (6/day) reached for @RadiantSparkGlobal.`;
  } else if (approvedItems.length > 0) {
    const nextClip = approvedItems[0];
    outcome = `Approval verified: "${nextClip.title}" is approved & queued for @RadiantSparkGlobal (next slot ${new Date(
      nextClip.scheduledSlot || upcomingSlots[0]
    ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}). ${pendingCount} clip(s) held in Pending Approval.`;
  } else {
    outcome = `Approval Gate active: ${pendingCount} clip(s) awaiting human review before any @RadiantSparkGlobal upload.`;
  }

  const slotDate = new Date(slotKey);
  const slotLabel = slotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const entry: QueueCheckEntry = {
    id: crypto.randomUUID(),
    checkedAt: now.toISOString(),
    slotLabel,
    trigger,
    pendingCount,
    approvedReadyCount: approvedItems.length,
    publishedTodayCount,
    outcome,
  };

  state.lastSlotKey = slotKey;
  state.checkHistory = [entry, ...state.checkHistory].slice(0, 20);
  saveQueueState(state);

  return { state, entry };
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getElevenLabsKey(): string | null {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  if (!key || key === 'MY_ELEVENLABS_API_KEY') return null;
  return key;
}

function isOAuthConfigured(): boolean {
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) return false;
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Boolean(parsed.apiKey && parsed.authDomain && parsed.projectId);
  } catch {
    return false;
  }
}

async function isFfmpegReady(): Promise<{ available: boolean; version: string | null }> {
  try {
    const { stdout } = await execFileAsync('ffmpeg', ['-version']);
    return { available: true, version: stdout.split('\n')[0] || 'ffmpeg ready' };
  } catch {
    return { available: false, version: null };
  }
}

const ELEVENLABS_VOICE_MAP: Record<string, string> = {
  Narrator: '21m00Tcm4TlvDq8ikWAM',
  Mia: 'EXAVITQu4vr4xnSDxMaL',
  Benny: 'TxGEqnHWrfWFTfGW9XjX',
  Pip: 'MF3mGyEYCl7XYWbV9V6O',
};

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    studio: 'StorySprout Studio',
    channelHandle: '@RadiantSparkGlobal',
    publishingMode: 'approval',
    hasGeminiKey: Boolean(getGeminiClient()),
    hasElevenLabsKey: Boolean(getElevenLabsKey()),
  });
});

app.get('/api/youtube/oauth-config', (_req, res) => {
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    res.json({ configured: false, config: null });
    return;
  }
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    res.json({
      configured: Boolean(parsed.apiKey && parsed.authDomain && parsed.projectId),
      config: {
        apiKey: parsed.apiKey,
        authDomain: parsed.authDomain,
        projectId: parsed.projectId,
        appId: parsed.appId,
      },
    });
  } catch {
    res.json({ configured: false, config: null });
  }
});

app.get('/api/elevenlabs/status', (_req, res) => {
  res.json({
    configured: Boolean(getElevenLabsKey()),
    voices: ELEVENLABS_VOICE_MAP,
  });
});

app.post('/api/elevenlabs/tts', async (req, res) => {
  const apiKey = getElevenLabsKey();
  if (!apiKey) {
    res.status(400).json({
      error: 'ELEVENLABS_API_KEY is not configured in Settings > Secrets.',
    });
    return;
  }

  const { text, speaker, voiceId } = req.body as {
    text?: string;
    speaker?: string;
    voiceId?: string;
  };

  const cleanText = typeof text === 'string' ? text.trim().slice(0, 1200) : '';
  if (!cleanText) {
    res.status(400).json({ error: 'text is required.' });
    return;
  }

  const requestedId =
    typeof voiceId === 'string' && /^[a-zA-Z0-9]{10,40}$/.test(voiceId)
      ? voiceId
      : ELEVENLABS_VOICE_MAP[speaker || 'Narrator'] || ELEVENLABS_VOICE_MAP.Narrator;

  try {
    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(requestedId)}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.78,
            style: 0.35,
          },
        }),
      }
    );

    if (!upstream.ok) {
      const errText = await upstream.text();
      res.status(upstream.status).json({
        error: `ElevenLabs TTS error (${upstream.status}): ${errText.slice(0, 220)}`,
      });
      return;
    }

    const arrayBuf = await upstream.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuf).toString('base64');
    res.json({ audioBase64, mimeType: 'audio/mpeg' });
  } catch (err: unknown) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'ElevenLabs TTS request failed.',
    });
  }
});

app.post('/api/elevenlabs/sfx', async (req, res) => {
  const apiKey = getElevenLabsKey();
  if (!apiKey) {
    res.status(400).json({
      error: 'ELEVENLABS_API_KEY is not configured in Settings > Secrets.',
    });
    return;
  }

  const { prompt, durationSeconds } = req.body as {
    prompt?: string;
    durationSeconds?: number;
  };

  const cleanPrompt = typeof prompt === 'string' ? prompt.trim().slice(0, 400) : '';
  if (!cleanPrompt) {
    res.status(400).json({ error: 'prompt is required.' });
    return;
  }

  const safeDuration = Math.min(Math.max(Number(durationSeconds) || 8, 1), 22);

  try {
    const upstream = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: cleanPrompt,
        duration_seconds: safeDuration,
        prompt_influence: 0.45,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      res.status(upstream.status).json({
        error: `ElevenLabs Sound API error (${upstream.status}): ${errText.slice(0, 220)}`,
      });
      return;
    }

    const arrayBuf = await upstream.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuf).toString('base64');
    res.json({ audioBase64, mimeType: 'audio/mpeg' });
  } catch (err: unknown) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'ElevenLabs sound generation failed.',
    });
  }
});

const BUILTIN_STORY_IDEAS = [
  {
    title: 'Butterfly Garden Counting Express!',
    learningGoal: 'Counting 1–5 & Gentle Nature Kindness',
    trainVariant: 5,
    babyIntroLine:
      'Baby Benny, Baby Mia, and fluffy Pip watch colorful butterflies flutter beside the Rainbow Slide before the magic whistle grows them big!',
    adventureLine:
      'Big Mia and Big Benny count five bright butterflies landing gently on sunny meadow flowers while Pip hops along the wooden train track!',
  },
  {
    title: 'Golden Whistle Bedtime Moon Ride',
    learningGoal: 'Calm Breathing, Stars & Gratitude',
    trainVariant: 6,
    babyIntroLine:
      'Soft twilight sparkles cover the Rainbow Slide as Baby Mia, Baby Benny, and Baby Pip listen to a gentle lullaby bell!',
    adventureLine:
      'Big Mia and Big Benny wave goodnight to every shining star while lavender steam floats above the cozy Bedtime Train!',
  },
  {
    title: 'Rainbow Bridge Teamwork Adventure!',
    learningGoal: 'Sharing Turns, Colors & Helping Friends',
    trainVariant: 2,
    babyIntroLine:
      'Look at the colorful puzzle blocks by the slide! Baby Mia, Baby Benny, and Pip team up when the Rainbow Express arrives!',
    adventureLine:
      'Big Mia and Big Benny match red, yellow, green, and blue bridge blocks together so every friend crosses safely!',
  },
  {
    title: 'Strawberry Smoothie Picnic Surprise!',
    learningGoal: 'Fruit Names, Mixing Colors & Manners',
    trainVariant: 4,
    babyIntroLine:
      'Yum! Baby Benny, Baby Mia, and Pip smell sweet strawberries near the playmat as the sparkly Smoothie Train rolls in!',
    adventureLine:
      'Big Mia, Big Benny, and Pip say please and thank you while mixing sweet berries and sunny bananas for everyone!',
  },
];

app.post('/api/ai/generate-story', async (req, res) => {
  const { themeHint, trainVariant } = req.body as {
    themeHint?: string;
    trainVariant?: number;
  };

  const ai = getGeminiClient();
  if (!ai) {
    const pick =
      BUILTIN_STORY_IDEAS[Math.floor(Math.random() * BUILTIN_STORY_IDEAS.length)];
    res.json({
      ...pick,
      trainVariant:
        typeof trainVariant === 'number' && trainVariant >= 1 && trainVariant <= 10
          ? trainVariant
          : pick.trainVariant,
      source: 'studio-preset',
    });
    return;
  }

  try {
    const prompt = `Create one original preschool 3D episode idea for StorySprout Studio (@RadiantSparkGlobal).
Continuity (MUST follow):
- Scene 1 starts with Baby Mia (orange pinafore), Baby Benny (green tee & blue shorts), and Pip the fluffy golden puppy at the Rainbow Slide playground (from reference FTGtiB-hXD4).
- Scenes 2-4 grow Mia & Benny big (Mia in yellow dungarees, Benny in green bear-ear hoodie) riding alongside a whimsical toy train in musical preschool style (inspired by nWRsPJkYAUw).
- Keep the story completely original and independent of any external website.
Theme Hint: ${themeHint?.trim() || 'Cheerful musical adventure with counting, colors, and sharing'}
Suggested Train Variant (1-10): ${trainVariant || 'choose best fit 1-10'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'Write warm, musical, joyful preschool stories for ages 2-5 featuring Mia, Benny, and Pip.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            learningGoal: { type: Type.STRING },
            trainVariant: { type: Type.INTEGER },
            babyIntroLine: { type: Type.STRING },
            adventureLine: { type: Type.STRING },
          },
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim()) as {
      title?: string;
      learningGoal?: string;
      trainVariant?: number;
      babyIntroLine?: string;
      adventureLine?: string;
    };

    const safeVariant =
      typeof parsed.trainVariant === 'number' &&
      parsed.trainVariant >= 1 &&
      parsed.trainVariant <= 10
        ? parsed.trainVariant
        : 1;

    res.json({
      title: parsed.title || BUILTIN_STORY_IDEAS[0].title,
      learningGoal: parsed.learningGoal || BUILTIN_STORY_IDEAS[0].learningGoal,
      trainVariant: safeVariant,
      babyIntroLine: parsed.babyIntroLine || BUILTIN_STORY_IDEAS[0].babyIntroLine,
      adventureLine: parsed.adventureLine || BUILTIN_STORY_IDEAS[0].adventureLine,
      source: 'gemini',
    });
  } catch {
    const pick =
      BUILTIN_STORY_IDEAS[Math.floor(Math.random() * BUILTIN_STORY_IDEAS.length)];
    res.json({
      ...pick,
      source: 'studio-preset',
    });
  }
});

app.post('/api/ai/enhance-episode', async (req, res) => {
  const ai = getGeminiClient();
  if (!ai) {
    res.status(400).json({
      error: 'Gemini API key is not configured in Settings > Secrets.',
    });
    return;
  }

  const { episodeTitle, trainName, targetLanguage, goal, currentLines } = req.body as {
    episodeTitle?: string;
    trainName?: string;
    targetLanguage?: string;
    goal?: string;
    currentLines?: string[];
  };

  if (!episodeTitle || !trainName) {
    res.status(400).json({ error: 'episodeTitle and trainName are required.' });
    return;
  }

  try {
    const prompt = `You are the StorySprout Studio preschool showrunner producing cinematic 3D kids episodes for YouTube channel @RadiantSparkGlobal.

Episode: "${episodeTitle}"
Train Variant: "${trainName}"
Characters: Baby-to-Big Mia (4yo), Baby-to-Big Benny (3yo), and Pip the fluffy golden puppy.
Requested Language: ${targetLanguage || 'English'}
Goal: ${goal || 'Maximize 30-second hook retention, interactive counting/singing, and safe YouTube Kids discovery for @RadiantSparkGlobal.'}
Current Scene Lines:
${(currentLines || []).map((l, i) => `Scene ${i + 1}: ${l}`).join('\n')}

Generate a refreshed, super catchy, warm preschool script and YouTube optimization pack in ${targetLanguage || 'English'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'Write joyful, safe, interactive preschool dialogue for ages 2-5 with clear repetition, train whistles, and musical warmth for @RadiantSparkGlobal.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            youtubeTitle: { type: Type.STRING },
            thumbnailHook: { type: Type.STRING },
            youtubeDescription: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            sceneLines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneNumber: { type: Type.INTEGER },
                  spokenLine: { type: Type.STRING },
                  kidsCallout: { type: Type.STRING },
                },
              },
            },
            monetizationNote: { type: Type.STRING },
          },
        },
      },
    });

    const jsonText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(jsonText);
    res.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate episode enhancement.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/ai/tts', async (req, res) => {
  const ai = getGeminiClient();
  if (!ai) {
    res.status(400).json({
      error: 'Gemini API key is not configured in Settings > Secrets.',
    });
    return;
  }

  const { text, voiceName, style } = req.body as {
    text?: string;
    voiceName?: string;
    style?: string;
  };

  if (!text || !text.trim()) {
    res.status(400).json({ error: 'text is required.' });
    return;
  }

  try {
    const allowedVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const selectedVoice = allowedVoices.includes(voiceName || '') ? voiceName! : 'Zephyr';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.trim().slice(0, 1200),
              speechMetadata: {
                style:
                  style ||
                  'Warm, cheerful, expressive preschool storyteller voice for children ages 2 to 5',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData?.data
    );
    const base64Audio = audioPart?.inlineData?.data;

    if (!base64Audio) {
      res.status(500).json({ error: 'No audio returned from TTS model.' });
      return;
    }

    res.json({
      audioBase64: base64Audio,
      mimeType: audioPart?.inlineData?.mimeType || 'audio/wav',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'TTS generation failed.';
    res.status(500).json({ error: message });
  }
});

app.get('/api/video/status', async (_req, res) => {
  const ff = await isFfmpegReady();
  res.json({ ffmpegAvailable: ff.available, version: ff.version });
});

app.post(
  '/api/video/transcode-mp4',
  express.raw({ type: ['video/webm', 'application/octet-stream'], limit: '160mb' }),
  async (req, res) => {
    const bodyBuf = req.body as Buffer;
    if (!Buffer.isBuffer(bodyBuf) || bodyBuf.length < 128) {
      res.status(400).json({ error: 'Valid .webm video payload is required.' });
      return;
    }

    const modeRaw = typeof req.query.mode === 'string' ? req.query.mode : 'preview';
    const isShort = modeRaw === 'short';
    const id = crypto.randomUUID();
    const inPath = path.join(os.tmpdir(), `storysprout_${id}.webm`);
    const outPath = path.join(os.tmpdir(), `storysprout_${id}.mp4`);

    const scaleFilter = isShort
      ? 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1'
      : 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,setsar=1';

    try {
      await fs.promises.writeFile(inPath, bodyBuf);

      await execFileAsync(
        'ffmpeg',
        [
          '-y',
          '-i',
          inPath,
          '-vf',
          scaleFilter,
          '-c:v',
          'libx264',
          '-preset',
          'fast',
          '-crf',
          '18',
          '-pix_fmt',
          'yuv420p',
          '-r',
          '30',
          '-c:a',
          'aac',
          '-b:a',
          '192k',
          '-ar',
          '48000',
          '-movflags',
          '+faststart',
          outPath,
        ],
        { timeout: 120000 }
      );

      const mp4Buf = await fs.promises.readFile(outPath);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Length', String(mp4Buf.length));
      res.send(mp4Buf);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'FFmpeg MP4 transcode failed.';
      res.status(500).json({ error: msg });
    } finally {
      fs.promises.unlink(inPath).catch(() => undefined);
      fs.promises.unlink(outPath).catch(() => undefined);
    }
  }
);

// === StorySprout Approval Queue & 30-Minute Queue Check Endpoints ===

app.get('/api/studio/queue', async (_req, res) => {
  const state = loadQueueState();
  const ff = await isFfmpegReady();
  const upcomingSlots = getUpcomingHalfHourSlots(6);
  res.json({
    ...state,
    nextCheckAt: upcomingSlots[0],
    upcomingSlots,
    ffmpegAvailable: ff.available,
    ffmpegVersion: ff.version,
    oauthConfigured: isOAuthConfigured(),
  });
});

app.post(
  '/api/studio/queue/upload',
  express.raw({
    type: ['video/webm', 'video/mp4', 'application/octet-stream'],
    limit: '180mb',
  }),
  async (req, res) => {
    const bodyBuf = req.body as Buffer;
    if (!Buffer.isBuffer(bodyBuf) || bodyBuf.length < 128) {
      res.status(400).json({ error: 'Valid video payload is required.' });
      return;
    }

    const q = req.query as Record<string, string | undefined>;
    const episodeId = Math.max(1, Number(q.episodeId) || 1);
    const title = (q.title || `Episode ${episodeId}`).slice(0, 140);
    const trainName = (q.trainName || 'StorySprout Express').slice(0, 80);
    const formatMode =
      q.formatMode === 'short' || q.formatMode === 'full5min' ? q.formatMode : 'preview';
    const durationSec = Math.max(1, Number(q.durationSec) || 40);
    const youtubeTitle = (q.youtubeTitle || title).slice(0, 100);
    const youtubeDescription = (
      q.youtubeDescription || `${title}\n\nWatch more on @RadiantSparkGlobal!`
    ).slice(0, 4000);
    const tags = (q.tags || 'storysprout studio,radiantsparkglobal,mia benny pip')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 18);

    const id = crypto.randomUUID();
    const safeSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 36);
    const isShort = formatMode === 'short';
    const isAlreadyMp4 = req.headers['content-type']?.includes('mp4');

    const rawPath = path.join(RENDERS_DIR, `${id}_raw.webm`);
    const mp4Name = `ep${String(episodeId).padStart(2, '0')}_${safeSlug || 'story'}_${formatMode}_${id.slice(0, 6)}.mp4`;
    const mp4Path = path.join(RENDERS_DIR, mp4Name);

    let finalName = mp4Name;
    let finalMime = 'video/mp4';
    let finalSize = bodyBuf.length;

    try {
      if (isAlreadyMp4) {
        await fs.promises.writeFile(mp4Path, bodyBuf);
        finalSize = bodyBuf.length;
      } else {
        const ff = await isFfmpegReady();
        if (ff.available) {
          await fs.promises.writeFile(rawPath, bodyBuf);
          const scaleFilter = isShort
            ? 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1'
            : 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,setsar=1';
          await execFileAsync(
            'ffmpeg',
            [
              '-y',
              '-i',
              rawPath,
              '-vf',
              scaleFilter,
              '-c:v',
              'libx264',
              '-preset',
              'fast',
              '-crf',
              '18',
              '-pix_fmt',
              'yuv420p',
              '-r',
              '30',
              '-c:a',
              'aac',
              '-b:a',
              '192k',
              '-ar',
              '48000',
              '-movflags',
              '+faststart',
              mp4Path,
            ],
            { timeout: 120000 }
          );
          await fs.promises.unlink(rawPath).catch(() => undefined);
          const stat = await fs.promises.stat(mp4Path);
          finalSize = stat.size;
        } else {
          finalName = `ep${String(episodeId).padStart(2, '0')}_${safeSlug || 'story'}_${formatMode}_${id.slice(0, 6)}.webm`;
          finalMime = 'video/webm';
          await fs.promises.writeFile(path.join(RENDERS_DIR, finalName), bodyBuf);
          finalSize = bodyBuf.length;
        }
      }

      const state = loadQueueState();
      const item: StudioQueueItem = {
        id,
        episodeId,
        title,
        trainName,
        formatMode,
        filename: finalName,
        mimeType: finalMime,
        sizeBytes: finalSize,
        durationSec,
        status: 'pending_approval',
        youtubeTitle,
        youtubeDescription,
        tags,
        createdAt: new Date().toISOString(),
      };
      state.items = [item, ...state.items];
      saveQueueState(state);

      res.status(201).json({ item });
    } catch (err: unknown) {
      await fs.promises.unlink(rawPath).catch(() => undefined);
      await fs.promises.unlink(mp4Path).catch(() => undefined);
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to store video into approval queue.',
      });
    }
  }
);

app.get('/api/studio/queue/:id/video', (req, res) => {
  const state = loadQueueState();
  const item = state.items.find((i) => i.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Queue item not found.' });
    return;
  }
  const filePath = path.join(RENDERS_DIR, item.filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Rendered video file no longer exists on disk.' });
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const downloadMode = req.query.download === '1';

  if (downloadMode) {
    res.setHeader('Content-Disposition', `attachment; filename="${item.filename}"`);
  }

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': item.mimeType,
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Accept-Ranges': 'bytes',
      'Content-Type': item.mimeType,
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

app.post('/api/studio/queue/:id/decision', (req, res) => {
  const { action, youtubeTitle, youtubeDescription, youtubeVideoId, notes } = req.body as {
    action?: 'approve' | 'reject' | 'reset_pending' | 'mark_published' | 'update_meta';
    youtubeTitle?: string;
    youtubeDescription?: string;
    youtubeVideoId?: string;
    notes?: string;
  };

  const state = loadQueueState();
  const item = state.items.find((i) => i.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Queue item not found.' });
    return;
  }

  if (typeof youtubeTitle === 'string' && youtubeTitle.trim()) {
    item.youtubeTitle = youtubeTitle.trim().slice(0, 100);
  }
  if (typeof youtubeDescription === 'string' && youtubeDescription.trim()) {
    item.youtubeDescription = youtubeDescription.trim().slice(0, 4000);
  }
  if (typeof notes === 'string') {
    item.notes = notes.trim().slice(0, 400);
  }

  if (action === 'approve') {
    item.status = 'approved';
    item.approvedAt = new Date().toISOString();
    item.scheduledSlot = getUpcomingHalfHourSlots(1)[0];
  } else if (action === 'reject') {
    item.status = 'rejected';
    item.scheduledSlot = undefined;
  } else if (action === 'reset_pending') {
    item.status = 'pending_approval';
    item.approvedAt = undefined;
    item.scheduledSlot = undefined;
  } else if (action === 'mark_published') {
    if (item.status !== 'approved' && item.status !== 'published') {
      res.status(400).json({
        error: 'Publishing Mode: Approval — clip must be approved before marking published.',
      });
      return;
    }
    item.status = 'published';
    item.publishedAt = new Date().toISOString();
    if (youtubeVideoId) item.youtubeVideoId = youtubeVideoId;
  }

  saveQueueState(state);
  res.json({ item });
});

app.delete('/api/studio/queue/:id', (req, res) => {
  const state = loadQueueState();
  const idx = state.items.findIndex((i) => i.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Queue item not found.' });
    return;
  }
  const [removed] = state.items.splice(idx, 1);
  saveQueueState(state);
  fs.promises.unlink(path.join(RENDERS_DIR, removed.filename)).catch(() => undefined);
  res.json({ ok: true });
});

app.post('/api/studio/queue/check-now', (_req, res) => {
  const { state, entry } = runThirtyMinuteQueueCheck('manual_check');
  res.json({
    entry,
    state,
    upcomingSlots: getUpcomingHalfHourSlots(6),
  });
});

app.get('/api/export/worker-script', (_req, res) => {
  const workerScript = `#!/usr/bin/env node
/**
 * StorySprout Studio — 30-Minute Queue Check & Approval Publishing Worker
 * Channel: @RadiantSparkGlobal
 * Publishing Mode: approval (strictly skips pending_approval or rejected items)
 *
 * Run continuously (checks every :00 and :30 boundary) or once via:
 *   STUDIO_URL="http://localhost:3000" YT_ACCESS_TOKEN="..." node storysprout-30min-worker.mjs --once
 */

const STUDIO_URL = process.env.STUDIO_URL || 'http://localhost:3000';
const YT_ACCESS_TOKEN = process.env.YT_ACCESS_TOKEN || '';
const DAILY_UPLOAD_CAP = 6;

async function runQueueCheck() {
  const now = new Date();
  console.log(\`[StorySprout 30m Worker] Queue check at \${now.toISOString()}\`);

  const res = await fetch(\`\${STUDIO_URL}/api/studio/queue\`);
  if (!res.ok) throw new Error(\`Queue API error: \${res.status}\`);
  const queue = await res.json();

  if (queue.publishingMode !== 'approval') {
    throw new Error('Unexpected publishing mode — aborting for safety.');
  }

  const today = now.toISOString().slice(0, 10);
  const publishedToday = queue.items.filter(
    (item) => item.status === 'published' && (item.publishedAt || '').startsWith(today)
  ).length;

  const approvedReady = queue.items.filter((item) => item.status === 'approved');
  const pendingCount = queue.items.filter((item) => item.status === 'pending_approval').length;

  console.log(
    \`[StorySprout 30m Worker] @RadiantSparkGlobal | Pending: \${pendingCount} | Approved: \${approvedReady.length} | Published today: \${publishedToday}/\${DAILY_UPLOAD_CAP}\`
  );

  await fetch(\`\${STUDIO_URL}/api/studio/queue/check-now\`, { method: 'POST' });

  if (approvedReady.length === 0) {
    console.log('[StorySprout 30m Worker] No approved clips ready. Waiting for human approval.');
    return;
  }

  if (publishedToday >= DAILY_UPLOAD_CAP) {
    console.log('[StorySprout 30m Worker] Daily YouTube cap reached. Next approved clip waits for tomorrow.');
    return;
  }

  const nextClip = approvedReady[0];
  if (!YT_ACCESS_TOKEN) {
    console.log(
      \`[StorySprout 30m Worker] Dry-run ready for "\${nextClip.youtubeTitle}". Set YT_ACCESS_TOKEN to upload to @RadiantSparkGlobal.\`
    );
    return;
  }

  const videoRes = await fetch(\`\${STUDIO_URL}/api/studio/queue/\${nextClip.id}/video\`);
  if (!videoRes.ok) throw new Error('Unable to read approved MP4 stream.');
  const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

  const metadata = {
    snippet: {
      title: nextClip.youtubeTitle.slice(0, 100),
      description: nextClip.youtubeDescription,
      tags: nextClip.tags,
      categoryId: '1',
    },
    status: {
      privacyStatus: 'public',
      selfDeclaredMadeForKids: true,
    },
  };

  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: \`Bearer \${YT_ACCESS_TOKEN}\`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Length': String(videoBuffer.length),
        'X-Upload-Content-Type': nextClip.mimeType || 'video/mp4',
      },
      body: JSON.stringify(metadata),
    }
  );
  if (!initRes.ok) throw new Error(\`YouTube upload init failed: \${initRes.status}\`);
  const uploadUrl = initRes.headers.get('location');
  if (!uploadUrl) throw new Error('Missing YouTube upload location header.');

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': nextClip.mimeType || 'video/mp4' },
    body: videoBuffer,
  });
  if (!uploadRes.ok) throw new Error(\`YouTube video PUT failed: \${uploadRes.status}\`);
  const uploaded = await uploadRes.json();

  await fetch(\`\${STUDIO_URL}/api/studio/queue/\${nextClip.id}/decision\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'mark_published', youtubeVideoId: uploaded.id }),
  });

  console.log(\`[StorySprout 30m Worker] Published \${uploaded.id} to @RadiantSparkGlobal!\`);
}

const runOnce = process.argv.includes('--once');
if (runOnce) {
  runQueueCheck().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  let lastSlot = '';
  setInterval(() => {
    const d = new Date();
    const min = d.getMinutes();
    if (min === 0 || min === 30) {
      const slotKey = \`\${d.toISOString().slice(0, 13)}:\${min}\`;
      if (slotKey !== lastSlot) {
        lastSlot = slotKey;
        runQueueCheck().catch(console.error);
      }
    }
  }, 20_000);
  runQueueCheck().catch(console.error);
}
`;
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="storysprout-30min-worker.mjs"');
  res.send(workerScript);
});

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC32_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function buildWebsiteZipBuffer(rootDir: string): Buffer {
  const excludedTopDirs = new Set(['node_modules', 'dist', '.git', '.aistudio']);
  const excludedFiles = new Set([
    '.env',
    'firebase-applet-config.json',
    'bun.lock',
    '.storysprout-queue.json',
  ]);

  const entries: { relPath: string; data: Buffer }[] = [];

  const walk = (dir: string, relBase: string) => {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const relPath = relBase ? `${relBase}/${item.name}` : item.name;
      if (item.isDirectory()) {
        if (relBase === '' && excludedTopDirs.has(item.name)) continue;
        walk(path.join(dir, item.name), relPath);
      } else if (item.isFile()) {
        if (excludedFiles.has(item.name) || item.name.endsWith('.zip')) continue;
        entries.push({
          relPath: relPath.replace(/\\/g, '/'),
          data: fs.readFileSync(path.join(dir, item.name)),
        });
      }
    }
  };

  walk(rootDir, '');

  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.relPath, 'utf8');
    const uncompressed = entry.data;
    const compressed = zlib.deflateRawSync(uncompressed, { level: 6 });
    const crc = crc32(uncompressed);

    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(uncompressed.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);
    nameBuf.copy(localHeader, 30);

    const centralHeader = Buffer.alloc(46 + nameBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(uncompressed.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    nameBuf.copy(centralHeader, 46);

    localParts.push(localHeader, compressed);
    centralParts.push(centralHeader);
    offset += localHeader.length + compressed.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, eocd]);
}

app.get('/api/export/website-zip', (_req, res) => {
  try {
    const zipBuffer = buildWebsiteZipBuffer(__dirname);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="storysprout-studio-website.zip"'
    );
    res.setHeader('Content-Length', String(zipBuffer.length));
    res.send(zipBuffer);
  } catch (err: unknown) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to build website zip archive.',
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StorySprout Studio running on http://localhost:${PORT}`);
    runThirtyMinuteQueueCheck('startup');
    setInterval(() => {
      const state = loadQueueState();
      const slotKey = getCurrentHalfHourSlotKey();
      if (state.lastSlotKey !== slotKey) {
        runThirtyMinuteQueueCheck('cron_30m');
      }
    }, 60_000);
  });
}

startServer();
