import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Image,
  Loader2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { generateCompletePromptsTxt, type EpisodeData } from '../data/episodes';

interface YouTubeGrowthHubProps {
  episode: EpisodeData;
  episodes: EpisodeData[];
  onOpenThumbnail: (ep: EpisodeData) => void;
}

interface EnhancedPack {
  youtubeTitle?: string;
  thumbnailHook?: string;
  youtubeDescription?: string;
  tags?: string[];
  sceneLines?: { sceneNumber: number; spokenLine: string; kidsCallout: string }[];
  monetizationNote?: string;
}

export const YouTubeGrowthHub: React.FC<YouTubeGrowthHubProps> = ({
  episode,
  episodes,
  onOpenThumbnail,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState('Spanish');
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [enhancedPack, setEnhancedPack] = useState<EnhancedPack | null>(null);
  const [showPromptsPreview, setShowPromptsPreview] = useState(false);

  const completePromptsTxt = useMemo(() => generateCompletePromptsTxt(episodes), [episodes]);

  const downloadCompletePrompts = () => {
    const blob = new Blob([completePromptsTxt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ALL_EPISODES_COMPLETE_PROMPTS.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyText = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleGenerateLocalization = async () => {
    setEnhancing(true);
    setEnhanceError(null);
    try {
      const res = await fetch('/api/ai/enhance-episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeTitle: episode.title,
          trainName: episode.trainName,
          targetLanguage: targetLang,
          goal: `Adapt Episode ${episode.id} into ${targetLang} to capture international kids YouTube watch time and increase channel RPM.`,
          currentLines: episode.scenes.map((s) => `${s.speaker}: ${s.narration}`),
        }),
      });
      const data = (await res.json()) as EnhancedPack & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Optimization request failed.');
      }
      setEnhancedPack(data);
    } catch (err: unknown) {
      setEnhanceError(
        err instanceof Error ? err.message : 'Unable to optimize episode right now.'
      );
    } finally {
      setEnhancing(false);
    }
  };

  const displayTitle = enhancedPack?.youtubeTitle || episode.youtubeMeta.title;
  const displayDesc = enhancedPack?.youtubeDescription || episode.youtubeMeta.description;
  const displayTags = (enhancedPack?.tags || episode.youtubeMeta.tags).join(', ');

  return (
    <section id="youtube" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-semibold text-slate-900">
            @RadiantSparkGlobal Metadata &amp; Prompt Bible
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Export your 1080p MP4 episode, 1280×720 thumbnail, and the full 8-part{' '}
            <span className="font-mono text-xs text-slate-800">ALL_EPISODES_COMPLETE_PROMPTS.txt</span>{' '}
            pack (including {episodes.length * 3} Shorts Remix Plans).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={downloadCompletePrompts}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-teal-600" />
            <span>Download ALL_EPISODES_COMPLETE_PROMPTS.txt</span>
          </button>

          <a
            href="https://www.youtube.com/@RadiantSparkGlobal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700 whitespace-nowrap"
          >
            <span>Open @RadiantSparkGlobal</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Independent StorySprout Studio Distribution Playbook */}
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-3">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            1. Independent Studio Identity
          </div>
          <h3 className="font-display text-base font-semibold text-slate-900">
            Dedicated StorySprout Brand
          </h3>
          <p className="text-xs leading-relaxed text-slate-600">
            StorySprout Studio operates independently from your business website so preschool viewers, parents, and YouTube Kids algorithms see one cohesive children’s animation channel on @RadiantSparkGlobal.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            2. Human Approval Gate
          </div>
          <h3 className="font-display text-base font-semibold text-slate-900">
            Review Every Clip Before Release
          </h3>
          <p className="text-xs leading-relaxed text-slate-600">
            Every rendered 3D episode waits in Pending Approval until you inspect the MP4 preview, verify Baby-to-Big character continuity, and click Approve.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">
            3. 30-Min Check + Mega Compilations
          </div>
          <h3 className="font-display text-base font-semibold text-slate-900">
            Steady Cadence &amp; Watch Time
          </h3>
          <p className="text-xs leading-relaxed text-slate-600">
            Half-hour queue checks publish only approved episodes within safe daily limits, while 9:16 Shorts funnel families into full 5-minute episodes and compilations.
          </p>
        </div>
      </div>

      {/* Expandable ALL_EPISODES_COMPLETE_PROMPTS.txt Viewer */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-teal-600" />
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Complete Prompt &amp; Remix Bible (Parts 1–8 · {episodes.length} Stories · {episodes.length * 3} Shorts Remix Plans)
              </h3>
              <p className="text-xs text-slate-500">
                Includes Master Character Refs, Train Refs, All Scene Prompts + Audio Cues, Shorts Remix Plans, Workflow &amp; Style Lock.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyText('allPrompts', completePromptsTxt)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {copiedField === 'allPrompts' ? <Check className="h-3.5 w-3.5 text-teal-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedField === 'allPrompts' ? 'Copied All' : 'Copy All Parts'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPromptsPreview((v) => !v)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {showPromptsPreview ? 'Hide Text Preview' : 'Preview Parts 1–8'}
            </button>
          </div>
        </div>

        {showPromptsPreview && (
          <pre className="mt-4 max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-[11px] leading-relaxed text-slate-700 whitespace-pre-wrap">
            {completePromptsTxt}
          </pre>
        )}
      </div>

      {/* 4-column Revenue & Retention Playbook Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">0–5s Retention Hook</div>
          <div className="mt-1 font-display text-base font-semibold text-slate-900">
            {episode.youtubeMeta.estimatedWatchHook}
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Whistle + smiling train face stops kids from swiping away.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">35-Min Mega Compilation</div>
          <div className="mt-1 font-display text-base font-semibold text-slate-900 tabular-nums">
            Ep 01–{episodes.length} Stitch · 4× Watch Time
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Combine all episodes into one marathon video for stronger autoplay sessions.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">COPPA Audience Setting</div>
          <div className="mt-1 font-display text-base font-semibold text-slate-900">
            Yes, It&apos;s Made for Kids
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Unlocks YouTube Kids app distribution and high-volume parent search.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Episode Revenue Angle</div>
          <div className="mt-1 font-display text-base font-semibold text-slate-900">
            {episode.trainName}
          </div>
          <p className="mt-1 text-xs text-slate-600">
            {episode.youtubeMeta.revenueStrategy}
          </p>
        </div>
      </div>

      {/* Metadata & Multilingual AI Optimizer */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs font-medium text-slate-500 tabular-nums">
                Episode {String(episode.id).padStart(2, '0')} · Ready to Paste
              </div>
              <h3 className="font-display text-lg font-semibold text-slate-900">
                YouTube Metadata &amp; Chapters
              </h3>
            </div>

            <button
              type="button"
              onClick={() => onOpenThumbnail(episode)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Image className="h-3.5 w-3.5 text-teal-600" />
              <span>Download Thumbnail PNG</span>
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Video Title</label>
              <button
                type="button"
                onClick={() => copyText('title', displayTitle)}
                className="flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 cursor-pointer"
              >
                {copiedField === 'title' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedField === 'title' ? 'Copied' : 'Copy Title'}</span>
              </button>
            </div>
            <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-900">
              {displayTitle}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Description &amp; Chapters
              </label>
              <button
                type="button"
                onClick={() => copyText('desc', displayDesc)}
                className="flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 cursor-pointer"
              >
                {copiedField === 'desc' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedField === 'desc' ? 'Copied' : 'Copy Description'}</span>
              </button>
            </div>
            <pre className="mt-1.5 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3.5 font-sans text-xs leading-relaxed text-slate-700">
              {displayDesc}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Search Tags</label>
              <button
                type="button"
                onClick={() => copyText('tags', displayTags)}
                className="flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 cursor-pointer"
              >
                {copiedField === 'tags' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedField === 'tags' ? 'Copied' : 'Copy Tags'}</span>
              </button>
            </div>
            <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
              {displayTags}
            </div>
          </div>
        </div>

        {/* Multilingual Dubbing & Growth Multiplier */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-teal-600" />
              <h3 className="font-display text-lg font-semibold text-slate-900">
                Global Kids Dubbing &amp; Hook Boost
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              Top kids channels multiply revenue 3× by publishing Spanish, Hindi, Portuguese, and French audio tracks using the exact same 3D video.
            </p>

            <div>
              <label htmlFor="target-lang" className="block text-xs font-semibold text-slate-700">
                Target Channel Language
              </label>
              <select
                id="target-lang"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
              >
                <option value="English">English (US / Global)</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="Hindi">Hindi (हिन्दी)</option>
                <option value="Portuguese">Portuguese (Português)</option>
                <option value="French">French (Français)</option>
              </select>
            </div>

            <button
              type="button"
              disabled={enhancing}
              onClick={handleGenerateLocalization}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
            >
              {enhancing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Adapting Episode {episode.id}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate {targetLang} Pack</span>
                </>
              )}
            </button>

            {enhanceError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {enhanceError}
              </div>
            )}

            {enhancedPack && (
              <div className="space-y-2 rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 text-xs text-slate-800">
                <div className="flex items-center gap-1.5 font-semibold text-teal-900">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>{targetLang} Adaptation Ready</span>
                </div>
                {enhancedPack.monetizationNote && (
                  <p className="text-slate-700 leading-relaxed">{enhancedPack.monetizationNote}</p>
                )}
                {enhancedPack.sceneLines && enhancedPack.sceneLines.length > 0 && (
                  <div className="space-y-1.5 border-t border-teal-200/70 pt-2">
                    {enhancedPack.sceneLines.map((line) => (
                      <div key={line.sceneNumber}>
                        <span className="font-semibold">Sc {line.sceneNumber}:</span>{' '}
                        {line.spokenLine}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
            Step 1: Click <span className="font-medium text-slate-800">Record 3D Video</span> on the 3D stage. Step 2: Download PNG thumbnail. Step 3: Upload both to YouTube.
          </div>
        </div>
      </div>
    </section>
  );
};
