import React, { useEffect, useState } from 'react';
import { Film, Image, Loader2, Play, Plus, Sparkles, Train, Wand2 } from 'lucide-react';
import type { EpisodeData } from '../data/episodes';

export interface ExtensionStoryInput {
  title: string;
  learningGoal: string;
  babyIntroLine: string;
  adventureLine: string;
  trainVariant: number;
  autoRecord?: boolean;
}

interface EpisodeLibraryProps {
  episodes: EpisodeData[];
  selectedEpisodeId: number;
  createOpenTick?: number;
  onSelectEpisode: (episodeId: number, autoPlay?: boolean) => void;
  staticPreview?: boolean;
  onRecordEpisode: (episodeId: number) => void;
  onOpenThumbnail: (episode: EpisodeData) => void;
  onAddExtensionStory: (input: ExtensionStoryInput) => void;
}

const TRAIN_PRESETS = [
  { variant: 1, label: 'Choo-Choo Snack Train (Mint & Peach)' },
  { variant: 2, label: 'Rainbow Veggie Express (5 Rainbow Cars)' },
  { variant: 3, label: 'Shape-Shifter Train (Conductor Hat)' },
  { variant: 4, label: 'Smoothie Blender Train (Swirl Berry)' },
  { variant: 5, label: 'Sunny Picnic Train (Straw Hat)' },
  { variant: 6, label: 'Starlight Bedtime Train (Lullaby)' },
  { variant: 7, label: 'Birthday Cupcake Train (6 Candles)' },
  { variant: 8, label: 'Friendly T-Rex Dino Train (Stomp & Roar)' },
  { variant: 9, label: 'Cool Ice Pop Train (Ice Wheels)' },
  { variant: 10, label: 'Friendship Feast Train (Banquet Cars)' },
];

export const EpisodeLibrary: React.FC<EpisodeLibraryProps> = ({
  episodes,
  selectedEpisodeId,
  createOpenTick = 0,
  onSelectEpisode,
  staticPreview = false,
  onRecordEpisode,
  onOpenThumbnail,
  onAddExtensionStory,
}) => {
  const [showCreator, setShowCreator] = useState(false);
  const [title, setTitle] = useState('');
  const [themeHint, setThemeHint] = useState('');
  const [learningGoal, setLearningGoal] = useState('Sharing, Counting & Musical Rhythm');
  const [babyIntroLine, setBabyIntroLine] = useState(
    'Baby Benny, Baby Mia, and Pip the golden puppy giggle by the Rainbow Slide as a magic whistle calls them to grow big!'
  );
  const [adventureLine, setAdventureLine] = useState(
    'Big Mia and Big Benny hop onto the playground track with Pip to sing, count, and share with friends!'
  );
  const [trainVariant, setTrainVariant] = useState<number>(5);
  const [generatingIdea, setGeneratingIdea] = useState(false);

  useEffect(() => {
    if (createOpenTick > 0) {
      setShowCreator(true);
    }
  }, [createOpenTick]);

  const handleSuggestIdea = async () => {
    setGeneratingIdea(true);
    try {
      const res = await fetch('/api/ai/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeHint, trainVariant }),
      });
      const data = (await res.json()) as {
        title?: string;
        learningGoal?: string;
        trainVariant?: number;
        babyIntroLine?: string;
        adventureLine?: string;
      };
      if (data.title) setTitle(data.title);
      if (data.learningGoal) setLearningGoal(data.learningGoal);
      if (typeof data.trainVariant === 'number') setTrainVariant(data.trainVariant);
      if (data.babyIntroLine) setBabyIntroLine(data.babyIntroLine);
      if (data.adventureLine) setAdventureLine(data.adventureLine);
    } finally {
      setGeneratingIdea(false);
    }
  };

  const submitStory = (autoRecord: boolean) => {
    const cleanTitle = title.trim() || 'Sunny Rainbow Slide Adventure!';
    onAddExtensionStory({
      title: cleanTitle,
      learningGoal: learningGoal.trim() || 'Teamwork & Musical Play',
      babyIntroLine: babyIntroLine.trim(),
      adventureLine: adventureLine.trim(),
      trainVariant,
      autoRecord,
    });
    setTitle('');
    setShowCreator(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitStory(false);
  };

  return (
    <section id="episodes" className="scroll-mt-24 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-semibold text-slate-900">
            Create &amp; Browse {episodes.length} Cinematic 3D Episodes
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Watch any story live on the 3D stage, or click <strong>Create Episode</strong> to compose a new Baby-to-Big Mia, Benny &amp; Pip video for the Approval Queue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 tabular-nums">
            {episodes.length} Stories · {episodes.length * 4} 3D Scenes
          </span>
          <button
            type="button"
            onClick={() => setShowCreator((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{showCreator ? 'Hide Episode Creator' : 'Create Episode'}</span>
          </button>
        </div>
      </div>

      {showCreator && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-teal-200 bg-white p-6 shadow-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-600" />
              <h3 className="font-display text-base font-semibold text-slate-900">
                Create Episode · Baby-to-Big Mia, Benny &amp; Pip (@RadiantSparkGlobal)
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!staticPreview && <>
              <input
                type="text"
                value={themeHint}
                onChange={(e) => setThemeHint(e.target.value)}
                placeholder="Optional story theme (e.g. counting stars)..."
                className="w-56 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
              />
              <button
                type="button"
                disabled={generatingIdea}
                onClick={handleSuggestIdea}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
              >
                {generatingIdea ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5 text-teal-600" />
                )}
                <span>Suggest Story Idea</span>
              </button></>}
              <button
                type="button"
                onClick={() => setShowCreator(false)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="ext-title" className="block text-xs font-semibold text-slate-700">
                Episode Title
              </label>
              <input
                id="ext-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Butterfly Garden Counting Express!"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="ext-goal" className="block text-xs font-semibold text-slate-700">
                Learning Goal
              </label>
              <input
                id="ext-goal"
                type="text"
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="ext-train" className="block text-xs font-semibold text-slate-700">
                3D Train World
              </label>
              <select
                id="ext-train"
                value={trainVariant}
                onChange={(e) => setTrainVariant(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
              >
                {TRAIN_PRESETS.map((t) => (
                  <option key={t.variant} value={t.variant}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="ext-baby" className="block text-xs font-semibold text-slate-700">
                Scene 1 Baby Playground Hook (Baby Benny, Baby Mia &amp; Pip)
              </label>
              <textarea
                id="ext-baby"
                rows={2}
                value={babyIntroLine}
                onChange={(e) => setBabyIntroLine(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="ext-big" className="block text-xs font-semibold text-slate-700">
                Scene 2–4 Big Mia &amp; Benny Adventure Narration
              </label>
              <textarea
                id="ext-big"
                rows={2}
                value={adventureLine}
                onChange={(e) => setAdventureLine(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => submitStory(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
            >
              <Film className="h-3.5 w-3.5" />
              <span>{staticPreview ? "Create & Record Preview" : "Create & Render MP4 for Approval"}</span>
            </button>
            <button
              type="submit"
              className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
            >
              Create &amp; Preview on 3D Stage
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {episodes.map((ep) => {
          const isSelected = ep.id === selectedEpisodeId;
          return (
            <div
              key={ep.id}
              className={`flex flex-col justify-between rounded-2xl border p-5 transition-colors ${
                isSelected
                  ? 'border-teal-500 bg-white shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 tabular-nums">
                    <span>
                      {ep.isExtension ? 'Original' : 'Episode'} {String(ep.id).padStart(2, '0')}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{ep.targetAge}</span>
                  </div>
                  <span
                    className="h-3 w-3 rounded-full shrink-0 border border-slate-200"
                    style={{ backgroundColor: ep.themeColor }}
                    title={ep.trainName}
                  />
                </div>

                <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">
                  {ep.title}
                </h3>

                <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-teal-700">
                  <Train className="h-3.5 w-3.5 shrink-0" />
                  <span>{ep.trainName}</span>
                </div>

                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {ep.trainVisualSummary}
                </p>

                <div className="mt-3 text-xs text-slate-500">
                  Learning focus: <span className="font-medium text-slate-700">{ep.learningGoal}</span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => onSelectEpisode(ep.id, true)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-teal-600 text-white hover:bg-teal-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Watch 3D Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => onRecordEpisode(ep.id)}
                  className="flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100 whitespace-nowrap cursor-pointer"
                >
                  <span>{staticPreview ? "Record" : "Render"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenThumbnail(ep)}
                  aria-label={`Open YouTube thumbnail for Episode ${ep.id}`}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
                >
                  <Image className="h-3.5 w-3.5 text-slate-600" />
                  <span>Thumb</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
