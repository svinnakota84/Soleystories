import React, { useState } from 'react';
import { Check, Copy, ExternalLink, RotateCcw, User } from 'lucide-react';
import { CHARACTER_SHEETS } from '../data/episodes';

interface CharacterGalleryProps {
  customBabyIntro: string;
  onCustomBabyIntroChange: (value: string) => void;
}

export const CharacterGallery: React.FC<CharacterGalleryProps> = ({
  customBabyIntro,
  onCustomBabyIntroChange,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [continuityFailed, setContinuityFailed] = useState(false);

  const copyPrompt = async (id: string, prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // ignore clipboard permissions error
    }
  };

  return (
    <section id="characters" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-semibold text-slate-900">
            Pixar-Style 3D Character &amp; Hero Train Turnarounds
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Episodes open with Baby Mia, Baby Benny &amp; Baby Pip on the playmat, then transform into Big Mia &amp; Big Benny in Scene 2.
          </p>
        </div>
        <div className="text-xs font-medium text-slate-500">
          Baby → Big Continuity · 4 Master Reference Sheets
        </div>
      </div>

      {/* Posted Video (FTGtiB-hXD4) -> Big Characters Continuity Card */}
      <div className="grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 bg-white p-5 lg:grid-cols-12">
        <div className="lg:col-span-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <img
              src="https://i.ytimg.com/vi/FTGtiB-hXD4/hqdefault.jpg"
              alt="Posted YouTube video FTGtiB-hXD4 Rainbow Slide playground with Baby Benny, Baby Mia and Pip"
              referrerPolicy="no-referrer"
              className="h-44 w-full object-cover"
            />
            <div className="border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700">
              Scene 1 · Baby Cast &amp; Rainbow Slide (FTGtiB-hXD4)
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {!continuityFailed ? (
              <img
                src="/assets/aistudio/image_af1869e5.png"
                alt="Mia, Benny and Pip riding inside the scalloped cookie train car"
                onError={() => setContinuityFailed(true)}
                className="h-44 w-full object-cover"
              />
            ) : (
              <div className="flex h-44 flex-col items-center justify-center p-4 text-center text-xs text-slate-500">
                Mia, Benny &amp; Pip · Cookie Train Look
              </div>
            )}
            <div className="border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700">
              Scene 2+ · Riding Cookie Train (Target 3D Look)
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-500">
              <span>Matched to Your Reference · Baby Playground → Train Ride</span>
              <a
                href="https://www.youtube.com/watch?v=FTGtiB-hXD4"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:underline"
              >
                <span>Open Baby Video (FTGtiB-hXD4)</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <h3 className="font-display text-lg font-semibold text-slate-900">
              Rainbow Slide Playground → Mia, Benny &amp; Pip Riding the Train
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Scene 1 opens at the Rainbow Slide playground, then transitions into the 3D train ride with Mia (yellow dungarees, curly puffs with yellow ties), Benny (tousled honey-auburn hair, green &amp; white striped hoodie), and Pip (golden puppy with brown collar &amp; gold paw tag) riding inside the scalloped cookie car.
            </p>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="baby-origin-intro"
                className="text-xs font-semibold text-slate-800"
              >
                Custom Scene 1 Baby Opening Line (synced to 3D voiceover)
              </label>
              {customBabyIntro.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => onCustomBabyIntroChange('')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Default</span>
                </button>
              )}
            </div>
            <textarea
              id="baby-origin-intro"
              rows={2}
              value={customBabyIntro}
              onChange={(e) => onCustomBabyIntroChange(e.target.value)}
              placeholder="Optional: Paste exact Baby Mia, Baby Benny & Baby Pip opening story line from FTGtiB-hXD4 (leave blank to use each episode's built-in Baby intro)..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {CHARACTER_SHEETS.map((sheet) => {
          const isFailed = failedImages[sheet.id];
          return (
            <div
              key={sheet.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <div className="aspect-video w-full bg-slate-100 overflow-hidden border-b border-slate-200">
                {!isFailed ? (
                  <img
                    src={sheet.imagePath}
                    alt={`${sheet.name} 3D turnaround sheet`}
                    referrerPolicy="no-referrer"
                    onError={() => setFailedImages((prev) => ({ ...prev, [sheet.id]: true }))}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-teal-50 p-6 text-center">
                    <User className="h-10 w-10 text-teal-600" />
                    <p className="mt-2 font-display text-base font-semibold text-slate-800">
                      {sheet.name}
                    </p>
                    <p className="text-xs text-slate-500">{sheet.ageOrRole}</p>
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-medium text-slate-500">
                      {sheet.ageOrRole}
                    </div>
                    <h3 className="mt-0.5 font-display text-lg font-semibold text-slate-900">
                      {sheet.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    {sheet.palette.map((hex) => (
                      <span
                        key={hex}
                        className="h-4 w-4 rounded-full border border-slate-200"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                </div>

                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {sheet.summary}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-500">
                    Voice profile: <span className="font-medium text-slate-800">{sheet.voiceActor}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => copyPrompt(sheet.id, sheet.promptUsed)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
                  >
                    {copiedId === sheet.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-teal-600" />
                        <span>Prompt Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Sheet Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
