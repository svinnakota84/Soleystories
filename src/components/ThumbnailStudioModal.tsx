import React, { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import type { EpisodeData } from '../data/episodes';
import { CHARACTER_SHEETS } from '../data/episodes';

interface ThumbnailStudioModalProps {
  episode: EpisodeData | null;
  onClose: () => void;
}

export const ThumbnailStudioModal: React.FC<ThumbnailStudioModalProps> = ({
  episode,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!episode) return;
    setReady(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loadImg = (src: string) =>
      new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });

    void Promise.all([
      loadImg(CHARACTER_SHEETS[0].imagePath),
      loadImg(CHARACTER_SHEETS[1].imagePath),
      loadImg(CHARACTER_SHEETS[2].imagePath),
      loadImg(CHARACTER_SHEETS[3].imagePath),
    ]).then(([miaImg, bennyImg, pipImg, trainImg]) => {
      const w = 1280;
      const h = 720;

      // 1. High-CTR Sunburst gradient background
      const grad = ctx.createRadialGradient(w * 0.55, h * 0.5, 60, w * 0.55, h * 0.5, 820);
      grad.addColorStop(0, '#FEF08A');
      grad.addColorStop(0.55, episode.themeColor);
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Sunburst rays
      ctx.save();
      ctx.translate(w * 0.55, h * 0.52);
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      for (let i = 0; i < 14; i++) {
        ctx.rotate((Math.PI * 2) / 14);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-75, -900);
        ctx.lineTo(75, -900);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Grass horizon arc
      ctx.fillStyle = '#4ADE80';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h + 60, 820, 220, 0, Math.PI, Math.PI * 2);
      ctx.fill();

      // 2. Composite character & train crops in white framed cards
      const drawCutoutCard = (
        img: HTMLImageElement | null,
        sxRatio: number,
        swRatio: number,
        dx: number,
        dy: number,
        dw: number,
        dh: number,
        tiltRad: number
      ) => {
        if (!img) return;
        ctx.save();
        ctx.translate(dx + dw / 2, dy + dh / 2);
        ctx.rotate(tiltRad);
        ctx.shadowColor = 'rgba(15,23,42,0.38)';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(-dw / 2 - 10, -dh / 2 - 10, dw + 20, dh + 20, 24);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.roundRect(-dw / 2, -dh / 2, dw, dh, 18);
        ctx.clip();
        ctx.drawImage(
          img,
          img.width * sxRatio,
          0,
          img.width * swRatio,
          img.height * 0.9,
          -dw / 2,
          -dh / 2,
          dw,
          dh
        );
        ctx.restore();
      };

      drawCutoutCard(trainImg, 0.02, 0.95, 520, 260, 700, 410, 0.02);
      drawCutoutCard(miaImg, 0.34, 0.32, 46, 260, 225, 390, -0.04);
      drawCutoutCard(bennyImg, 0.66, 0.32, 235, 290, 200, 355, 0.03);
      drawCutoutCard(pipImg, 0.78, 0.22, 395, 375, 165, 295, -0.03);

      // 3. Episode Banner & Bold Outlined Kids Typography
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.roundRect(48, 36, 230, 52, 12);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 26px Outfit, sans-serif';
      ctx.fillText(`EPISODE ${String(episode.id).padStart(2, '0')}`, 78, 71);

      ctx.save();
      ctx.font = '800 84px Outfit, sans-serif';
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#0F172A';
      ctx.strokeText(episode.youtubeMeta.thumbnailHook, 48, 172);
      ctx.fillStyle = '#FACC15';
      ctx.fillText(episode.youtubeMeta.thumbnailHook, 48, 172);

      ctx.font = '700 40px Outfit, sans-serif';
      ctx.lineWidth = 9;
      ctx.strokeText(episode.youtubeMeta.thumbnailSubtext, 52, 228);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(episode.youtubeMeta.thumbnailSubtext, 52, 228);
      ctx.restore();

      setReady(true);
    });
  }, [episode]);

  if (!episode) return null;

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `ep${String(episode.id).padStart(2, '0')}_youtube_thumbnail_1280x720.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900">
              YouTube High-CTR Thumbnail — Episode {String(episode.id).padStart(2, '0')}
            </h3>
            <p className="text-xs text-slate-500">
              1280 × 720 PNG · Composited with Mia, Benny, Pip &amp; Train Reference Art
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close thumbnail preview"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="w-full h-auto block"
          />
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Upload this PNG directly to YouTube Studio under Thumbnail for maximum mobile CTR.
          </p>
          <button
            type="button"
            disabled={!ready}
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Download 1280×720 PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
