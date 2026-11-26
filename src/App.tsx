import { useEffect, useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { EPISODES, type EpisodeData } from './data/episodes';
import {
  Stage3DViewport,
  type RecordedClip,
  type VideoFormatMode,
} from './components/Stage3DViewport';
import { ApprovalAndArchitectureSection } from './components/ApprovalAndArchitectureSection';
import { EpisodeLibrary, type ExtensionStoryInput } from './components/EpisodeLibrary';
import { CharacterGallery } from './components/CharacterGallery';
import { YouTubeGrowthHub } from './components/YouTubeGrowthHub';
import { ThumbnailStudioModal } from './components/ThumbnailStudioModal';
import type { VoiceEngine } from './three/audioEngine';

const staticPreview = document.getElementById('root')?.hasAttribute('data-static-preview') ?? false;
const draftKey = 'soleystories.episode-drafts.v1';
const aiStudioUrl = 'https://aistudio.google.com/apps/ec156a6d-459e-42ae-9722-479df2d21eeb?showPreview=true&showAssistant=true&appParams=radiant-spark';

function loadEpisodes(): EpisodeData[] {
  if (!staticPreview) return EPISODES;
  try {
    const drafts = JSON.parse(localStorage.getItem(draftKey) ?? '[]');
    return Array.isArray(drafts) ? [...EPISODES, ...drafts] : EPISODES;
  } catch {
    return EPISODES;
  }
}

export default function App() {
  const [episodes, setEpisodes] = useState<EpisodeData[]>(loadEpisodes);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number>(1);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [voiceEngine, setVoiceEngine] = useState<VoiceEngine>(staticPreview ? 'browser' : 'elevenlabs');
  const [formatMode, setFormatMode] = useState<VideoFormatMode>('preview');
  const [recordRequestTick, setRecordRequestTick] = useState<number>(0);
  const [createOpenTick, setCreateOpenTick] = useState<number>(0);
  const [queueRefreshTick, setQueueRefreshTick] = useState<number>(0);
  const [uploadingVideo, setUploadingVideo] = useState<boolean>(false);
  const [thumbnailEpisode, setThumbnailEpisode] = useState<EpisodeData | null>(null);
  const [customBabyIntro, setCustomBabyIntro] = useState<string>('');

  const [recordedClip, setRecordedClip] = useState<{ url: string; filename: string } | null>(null);
  const [studioNotice, setStudioNotice] = useState('');
  useEffect(() => () => {
    if (recordedClip) URL.revokeObjectURL(recordedClip.url);
  }, [recordedClip]);

  const activeEpisode =
    episodes.find((ep) => ep.id === selectedEpisodeId) || episodes[0];

  const handleSelectEpisode = (episodeId: number, autoPlay = false) => {
    setSelectedEpisodeId(episodeId);
    setActiveSceneIndex(0);
    if (autoPlay) {
      setIsPlaying(true);
      document.getElementById('stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setIsPlaying(false);
    }
  };

  const handleTogglePlay = (forceState?: boolean) => {
    setIsPlaying((prev) => (typeof forceState === 'boolean' ? forceState : !prev));
  };

  const handleRecordedClipReady = async (clip: RecordedClip) => {
    if (staticPreview) {
      setRecordedClip({ url: URL.createObjectURL(clip.blob), filename: clip.filename });
      return;
    }
    setUploadingVideo(true);
    try {
      const params = new URLSearchParams({
        episodeId: String(clip.episode.id),
        title: clip.episode.title,
        trainName: clip.episode.trainName,
        formatMode: clip.formatMode,
        durationSec: String(clip.durationSec),
        youtubeTitle: clip.episode.youtubeMeta.title,
        youtubeDescription: clip.episode.youtubeMeta.description,
        tags: clip.episode.youtubeMeta.tags.join(','),
      });

      const response = await fetch(`/api/studio/queue/upload?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': clip.blob.type || 'video/webm' },
        body: clip.blob,
      });

      if (!response.ok) throw new Error('The recording could not be added to the approval queue.');
      setStudioNotice('');
      setQueueRefreshTick((t) => t + 1);
      document
        .getElementById('approval-queue')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      setStudioNotice(error instanceof Error ? error.message : 'The upload failed.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleRecordEpisode = (
    nextEpisodeId: number,
    mode: 'full5min' | 'short' | 'preview'
  ) => {
    setSelectedEpisodeId(nextEpisodeId);
    setFormatMode(mode);
    setActiveSceneIndex(0);
    document.getElementById('stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      setRecordRequestTick((t) => t + 1);
    }, 350);
  };

  const handleAddExtensionStory = (input: ExtensionStoryInput) => {
    const template = EPISODES.find((e) => e.id === input.trainVariant) || EPISODES[0];
    const nextId = Math.max(...episodes.map((e) => e.id)) + 1;
    const newEpisode: EpisodeData = {
      id: nextId,
      trainVariant: input.trainVariant,
      isExtension: true,
      title: input.title,
      trainName: template.trainName,
      trainVisualSummary: `${template.trainVisualSummary} (StorySprout Original #${nextId})`,
      themeColor: template.themeColor,
      accentColor: template.accentColor,
      skyTint: template.skyTint,
      durationLabel: '0:40 Preview · 5:00 Full Cut',
      targetAge: 'Ages 2–5',
      learningGoal: input.learningGoal,
      youtubeMeta: {
        title: `${input.title} 🚂✨ Mia, Benny & Pip | Soleystories Studio 3D`,
        thumbnailHook: input.title.toUpperCase().slice(0, 18),
        thumbnailSubtext: input.learningGoal,
        description: `${input.babyIntroLine}\n\n${input.adventureLine}\n\nSubscribe to @RadiantSparkGlobal for weekly Soleystories Studio 3D adventures!`,
        tags: [
          'storysprout studio',
          'radiantsparkglobal',
          'mia benny pip',
          'baby to big 3d kids',
        ],
        revenueStrategy:
          'Original Soleystories Studio episode queued for human approval and @RadiantSparkGlobal release.',
        estimatedWatchHook: '0–5s Baby Playground Whistle Reveal',
      },
      scenes: [
        {
          sceneNumber: 1,
          title: 'Baby Mia, Benny & Pip at the Rainbow Slide',
          durationSec: 10,
          cameraPreset: 'characters',
          trainSpeed: 1.25,
          characterAction: 'wave',
          speaker: 'Narrator',
          narration: input.babyIntroLine,
          onScreenPrompt: 'Wave hello at the Rainbow Slide!',
        },
        {
          sceneNumber: 2,
          title: 'Growing Big for Today’s Adventure Ride',
          durationSec: 10,
          cameraPreset: 'train',
          trainSpeed: 1.05,
          characterAction: 'hop',
          speaker: 'Mia',
          narration: input.adventureLine,
          onScreenPrompt: input.learningGoal,
        },
        {
          sceneNumber: 3,
          title: 'Benny & Pip Interactive Song',
          durationSec: 10,
          cameraPreset: 'characters',
          trainSpeed: 0.85,
          characterAction: 'clap',
          speaker: 'Benny',
          narration: `Clap with Pip and Mia! We love learning about ${input.learningGoal} on the ${template.trainName}!`,
          onScreenPrompt: 'Clap & sing along with Pip!',
        },
        {
          sceneNumber: 4,
          title: 'StorySprout Parade Finale',
          durationSec: 10,
          cameraPreset: 'orbit',
          trainSpeed: 1.4,
          characterAction: 'dance',
          speaker: 'Pip',
          narration:
            'Woof-woof hooray! Subscribe to RadiantSparkGlobal for our next Soleystories Studio episode!',
          onScreenPrompt: 'Subscribe · @RadiantSparkGlobal',
        },
      ],
    };

    const nextEpisodes = [...episodes, newEpisode];
    if (staticPreview) {
      try {
        localStorage.setItem(draftKey, JSON.stringify(nextEpisodes.filter(ep => ep.id > Math.max(...EPISODES.map(base => base.id)))));
        setStudioNotice('Episode saved in this browser.');
      } catch {
        setStudioNotice('This browser could not save the episode. It is available until you reload.');
      }
    }
    setEpisodes(nextEpisodes);
    setSelectedEpisodeId(nextId);
    setActiveSceneIndex(0);
    document.getElementById('stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (input.autoRecord) {
      window.setTimeout(() => {
        setRecordRequestTick((t) => t + 1);
      }, 380);
    } else {
      setIsPlaying(true);
    }
  };

  const openEpisodeCreator = () => {
    setCreateOpenTick((t) => t + 1);
    document.getElementById('episodes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:gap-6 sm:px-6">
          <a
            href="#stage"
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Soleystories Studio
          </a>

          <nav className="hidden lg:flex items-center gap-4 text-sm font-medium text-slate-600">
            <a
              href="#stage"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              3D Stage
            </a>
            {!staticPreview && <a
              href="#approval-queue"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Approval Queue
            </a>}
            <a
              href="#episodes"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {episodes.length} Stories
            </a>
            <a
              href={staticPreview ? "#production" : "#architecture"}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Architecture
            </a>
            <a
              href="#characters"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Characters
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={openEpisodeCreator}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-700 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Episode</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-12 px-4 py-6 sm:px-6">
        <section id="stage" className="scroll-mt-24 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                <span>Mia, Benny &amp; Pip</span>
                <span aria-hidden="true">·</span>
                <span>Cinematic 3D Animation</span>
                <span aria-hidden="true">·</span>
                <span>@RadiantSparkGlobal</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-teal-700">Publishing Mode: Approval</span>
              </div>
              <h1
                className="mt-1.5 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
                style={{ textWrap: 'balance' }}
              >
                {activeEpisode.title}
              </h1>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {activeEpisode.trainVisualSummary}
              </p>
            </div>

            <div className="text-right text-xs text-slate-500 tabular-nums">
              <div className="font-semibold text-slate-900">{activeEpisode.trainName}</div>
              <div className="mt-0.5">
                {formatMode === 'full5min'
                  ? '5:00 Full Video (16:9)'
                  : formatMode === 'short'
                  ? '0:40 Vertical Short (9:16)'
                  : '0:40 Quick Preview (16:9)'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5">
            {episodes.map((ep) => {
              const active = ep.id === selectedEpisodeId;
              return (
                <button
                  key={ep.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelectEpisode(ep.id, false)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium tabular-nums transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {ep.isExtension ? 'Orig' : 'Ep'} {String(ep.id).padStart(2, '0')} ·{' '}
                  {ep.trainName.replace(' Train', '').replace(' Express', '')}
                </button>
              );
            })}
          </div>

          <Stage3DViewport
            episode={activeEpisode}
            staticPreview={staticPreview}
            activeSceneIndex={activeSceneIndex}
            onSceneIndexChange={setActiveSceneIndex}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            voiceEngine={voiceEngine}
            onVoiceEngineChange={setVoiceEngine}
            formatMode={formatMode}
            onFormatModeChange={setFormatMode}
            customBabyIntro={customBabyIntro}
            recordRequestTick={recordRequestTick}
            onExportThumbnail={() => setThumbnailEpisode(activeEpisode)}
            onRecordedClipReady={handleRecordedClipReady}
          />
          {studioNotice && <p role="status" className="text-sm text-slate-700">{studioNotice}</p>}
          {recordedClip && (
            <div className="grid gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4">
              <h2 className="font-display text-lg font-semibold">Recorded preview</h2>
              <p className="text-sm text-slate-600">Built-in narration plays live. The download contains the stage and its mixed audio.</p>
              <video className="max-h-96 w-full rounded-lg bg-slate-900" src={recordedClip.url} controls playsInline />
              <a className="w-fit rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white" href={recordedClip.url} download={recordedClip.filename}>Download WebM</a>
            </div>
          )}
        </section>

        {staticPreview ? (
          <section id="production" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-display text-xl font-semibold">Production &amp; approval</h2>
            <p className="my-2 max-w-2xl text-sm text-slate-600">Create episodes and download WebM recordings here. Open the connected studio for server-side MP4 conversion and approvals. Production queue checks are planned for :00 and :30.</p>
            <a className="text-sm font-semibold text-teal-700 underline" href={aiStudioUrl}>Open Google AI Studio</a>
          </section>
        ) : <ApprovalAndArchitectureSection
          queueRefreshTick={queueRefreshTick}
          uploadingVideo={uploadingVideo}
          episodes={episodes}
          onRecordEpisode={handleRecordEpisode}
          onOpenThumbnail={(ep) => setThumbnailEpisode(ep)}
        />}

        <EpisodeLibrary
          staticPreview={staticPreview}
          episodes={episodes}
          selectedEpisodeId={selectedEpisodeId}
          createOpenTick={createOpenTick}
          onSelectEpisode={handleSelectEpisode}
          onRecordEpisode={(id) => handleRecordEpisode(id, formatMode)}
          onOpenThumbnail={(ep) => setThumbnailEpisode(ep)}
          onAddExtensionStory={handleAddExtensionStory}
        />

        <CharacterGallery
          customBabyIntro={customBabyIntro}
          onCustomBabyIntroChange={setCustomBabyIntro}
        />

        {!staticPreview && <YouTubeGrowthHub
          episode={activeEpisode}
          episodes={episodes}
          onOpenThumbnail={(ep) => setThumbnailEpisode(ep)}
        />}
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-slate-500">
          <span>
            Soleystories Studio · {episodes.length} Episodes · Independent of Business Website
          </span>
          <div className="flex flex-wrap items-center gap-4">
            {!staticPreview && <a
              href="/api/export/website-zip"
              download="storysprout-studio-website.zip"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-800 hover:bg-slate-100"
            >
              <Download className="h-3.5 w-3.5 text-teal-600" />
              <span>Download Studio (.zip)</span>
            </a>}
            <span>Channel: @RadiantSparkGlobal · Approval Mode</span>
          </div>
        </div>
      </footer>

      <ThumbnailStudioModal
        episode={thumbnailEpisode}
        onClose={() => setThumbnailEpisode(null)}
      />
    </div>
  );
}
