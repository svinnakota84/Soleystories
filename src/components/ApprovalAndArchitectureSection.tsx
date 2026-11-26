import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  Film,
  Image,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import type { EpisodeData } from '../data/episodes';

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

export interface StudioQueueResponse {
  studioName: string;
  channelHandle: string;
  publishingMode: 'approval';
  cadenceMinutes: number;
  nextCheckAt: string;
  upcomingSlots: string[];
  ffmpegAvailable: boolean;
  ffmpegVersion: string | null;
  oauthConfigured: boolean;
  items: StudioQueueItem[];
  checkHistory: QueueCheckEntry[];
}

interface ApprovalAndArchitectureSectionProps {
  queueRefreshTick: number;
  uploadingVideo: boolean;
  episodes: EpisodeData[];
  onRecordEpisode: (episodeId: number, mode: 'full5min' | 'short' | 'preview') => void;
  onOpenThumbnail: (episode: EpisodeData) => void;
}

const STATUS_LABELS: Record<QueueApprovalStatus, string> = {
  pending_approval: 'Pending Approval',
  approved: 'Approved · Queued',
  rejected: 'Needs Revision',
  published: 'Published',
};

export const ApprovalAndArchitectureSection: React.FC<ApprovalAndArchitectureSectionProps> = ({
  queueRefreshTick,
  uploadingVideo,
  episodes,
  onRecordEpisode,
  onOpenThumbnail,
}) => {
  const [queueData, setQueueData] = useState<StudioQueueResponse | null>(null);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [checkingNow, setCheckingNow] = useState(false);
  const [batchIds, setBatchIds] = useState<number[]>([]);
  const [ytToken, setYtToken] = useState<string | null>(null);
  const [ytChannelName, setYtChannelName] = useState<string | null>(null);
  const [connectingYt, setConnectingYt] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadQueue = async () => {
    try {
      const res = await fetch('/api/studio/queue');
      if (!res.ok) return;
      const data = (await res.json()) as StudioQueueResponse;
      setQueueData(data);
      if (data.items.length > 0 && !previewItemId) {
        setPreviewItemId(data.items[0].id);
      }
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    void loadQueue();
  }, [queueRefreshTick]);

  // Progress batch rendering sequentially whenever a newly uploaded clip lands
  const prevCountRef = React.useRef<number>(0);
  useEffect(() => {
    const count = queueData?.items.length ?? 0;
    if (count > prevCountRef.current && batchIds.length > 0) {
      const [nextEpId, ...rest] = batchIds;
      setBatchIds(rest);
      window.setTimeout(() => {
        onRecordEpisode(nextEpId, 'preview');
      }, 650);
    }
    prevCountRef.current = count;
  }, [queueData?.items.length, batchIds, onRecordEpisode]);

  const [publishingAll, setPublishingAll] = useState(false);

  const startBatchQueue = () => {
    if (batchIds.length > 0) {
      setBatchIds([]);
      return;
    }
    if (episodes.length === 0) return;
    const originals = episodes.filter((e) => e.id >= 11);
    const targetList = originals.length > 0 ? originals : episodes.slice(0, 3);
    const [first, ...rest] = targetList.map((e) => e.id);
    setBatchIds(rest);
    onRecordEpisode(first, 'preview');
  };

  const handleDecision = async (
    id: string,
    action: 'approve' | 'reject' | 'reset_pending' | 'update_meta',
    extra?: { youtubeTitle?: string; youtubeDescription?: string }
  ) => {
    setStatusMessage(null);
    const res = await fetch(`/api/studio/queue/${encodeURIComponent(id)}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    });
    if (res.ok) {
      setEditingId(null);
      await loadQueue();
      if (action === 'approve') {
        setStatusMessage(
          'Clip approved and queued for the next 30-minute check on @RadiantSparkGlobal.'
        );
      } else if (action === 'reject') {
        setStatusMessage('Clip moved to Needs Revision. It will not publish.');
      }
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/studio/queue/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      if (previewItemId === id) setPreviewItemId(null);
      await loadQueue();
    }
  };

  const handleRunQueueCheckNow = async () => {
    setCheckingNow(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/studio/queue/check-now', { method: 'POST' });
      const data = (await res.json()) as {
        entry?: QueueCheckEntry;
        state?: StudioQueueResponse;
      };
      if (res.ok) {
        await loadQueue();
        if (data.entry?.outcome) {
          setStatusMessage(data.entry.outcome);
        }
      }
    } finally {
      setCheckingNow(false);
    }
  };

  const connectYouTubeOAuth = async () => {
    setConnectingYt(true);
    setStatusMessage(null);
    try {
      const cfgRes = await fetch('/api/youtube/oauth-config');
      const cfgData = (await cfgRes.json()) as {
        configured: boolean;
        config: Record<string, string> | null;
      };
      if (!cfgData.configured || !cfgData.config) {
        throw new Error('YouTube OAuth config is not enabled in this workspace.');
      }
      const app = getApps().length ? getApps()[0] : initializeApp(cfgData.config);
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/youtube.upload');
      provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      if (!accessToken) {
        throw new Error('Google sign-in completed, but no YouTube access token was returned.');
      }
      setYtToken(accessToken);

      try {
        const chRes = await fetch(
          'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (chRes.ok) {
          const chJson = (await chRes.json()) as {
            items?: { snippet?: { title?: string; customUrl?: string } }[];
          };
          const ch = chJson.items?.[0]?.snippet;
          setYtChannelName(ch?.customUrl || ch?.title || '@RadiantSparkGlobal');
        }
      } catch {
        setYtChannelName('@RadiantSparkGlobal');
      }
      setStatusMessage(
        'Connected YouTube account for approval-gated uploads to @RadiantSparkGlobal.'
      );
    } catch (err: unknown) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Unable to connect YouTube account.'
      );
    } finally {
      setConnectingYt(false);
    }
  };

  const publishApprovedItem = async (item: StudioQueueItem) => {
    if (item.status !== 'approved') return;
    if (!ytToken) {
      setStatusMessage('Sign in with YouTube (@RadiantSparkGlobal) first to upload approved clips.');
      return;
    }
    setPublishingId(item.id);
    setStatusMessage(null);
    try {
      const videoRes = await fetch(`/api/studio/queue/${encodeURIComponent(item.id)}/video`);
      if (!videoRes.ok) throw new Error('Unable to read MP4 stream for upload.');
      const videoBlob = await videoRes.blob();

      const metadata = {
        snippet: {
          title: item.youtubeTitle.slice(0, 100),
          description: item.youtubeDescription,
          tags: item.tags,
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
            Authorization: `Bearer ${ytToken}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Length': String(videoBlob.size),
            'X-Upload-Content-Type': item.mimeType || 'video/mp4',
          },
          body: JSON.stringify(metadata),
        }
      );
      if (!initRes.ok) {
        throw new Error(`YouTube upload initialization failed (${initRes.status}).`);
      }
      const uploadUrl = initRes.headers.get('location');
      if (!uploadUrl) throw new Error('YouTube did not return an upload URL.');

      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': item.mimeType || 'video/mp4' },
        body: videoBlob,
      });
      if (!putRes.ok) throw new Error(`YouTube video upload failed (${putRes.status}).`);
      const uploaded = (await putRes.json()) as { id?: string };

      await fetch(`/api/studio/queue/${encodeURIComponent(item.id)}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_published',
          youtubeVideoId: uploaded.id,
        }),
      });
      await loadQueue();
      setStatusMessage(
        `Published approved episode "${item.youtubeTitle}" to @RadiantSparkGlobal (${uploaded.id || 'uploaded'}).`
      );
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : 'YouTube upload failed.');
    } finally {
      setPublishingId(null);
    }
  };

  const publishAllApproved = async () => {
    const approvedList = (queueData?.items ?? []).filter((i) => i.status === 'approved');
    if (approvedList.length === 0) {
      setStatusMessage('Approve at least one rendered episode before publishing to @RadiantSparkGlobal.');
      return;
    }
    if (!ytToken) {
      setStatusMessage('Click Connect @RadiantSparkGlobal first to authorize YouTube uploads.');
      return;
    }
    setPublishingAll(true);
    try {
      for (const item of approvedList.slice(0, 6)) {
        await publishApprovedItem(item);
      }
    } finally {
      setPublishingAll(false);
    }
  };

  const items = queueData?.items ?? [];
  const pendingCount = items.filter((i) => i.status === 'pending_approval').length;
  const approvedCount = items.filter((i) => i.status === 'approved').length;
  const publishedCount = items.filter((i) => i.status === 'published').length;
  const previewItem = items.find((i) => i.id === previewItemId) || null;

  return (
    <div className="space-y-12">
      {/* SECTION 1: APPROVAL QUEUE */}
      <section
        id="approval-queue"
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
              <span className="font-semibold text-teal-700">Publishing Mode: Approval</span>
              <span aria-hidden="true">·</span>
              <span>Target: @RadiantSparkGlobal</span>
              <span aria-hidden="true">·</span>
              <span>
                {queueData?.ffmpegAvailable ? 'FFmpeg 1080p MP4 Active' : 'WebM Capture Active'}
              </span>
            </div>
            <h2 className="mt-1 font-display text-xl font-semibold text-slate-900">
              Video Preview &amp; Approval Queue
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Every rendered 3D episode lands here in <strong>Pending Approval</strong>. Watch the MP4 preview, edit title/description, and approve before any 30-minute queue slot publishes it.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={startBatchQueue}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                batchIds.length > 0
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              <span>
                {batchIds.length > 0
                  ? `Stop Batch (${batchIds.length} left)`
                  : 'Render Original Stories (Ep 11–14)'}
              </span>
            </button>

            {approvedCount > 0 && (
              <button
                type="button"
                disabled={publishingAll}
                onClick={publishAllApproved}
                className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50 cursor-pointer"
              >
                {publishingAll ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                <span>Publish Approved ({approvedCount})</span>
              </button>
            )}

            <button
              type="button"
              disabled={connectingYt}
              onClick={connectYouTubeOAuth}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                ytToken
                  ? 'border border-teal-200 bg-teal-50 text-teal-800'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {connectingYt ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              <span>
                {ytToken
                  ? `Connected: ${ytChannelName || '@RadiantSparkGlobal'}`
                  : 'Connect @RadiantSparkGlobal'}
              </span>
            </button>
          </div>
        </div>

        {/* Clean numeric approval counts without pill clutter */}
        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 tabular-nums">
          <div>
            Pending Approval:{' '}
            <span className="font-semibold text-amber-700">{pendingCount}</span>
          </div>
          <div>
            Approved for Queue Check:{' '}
            <span className="font-semibold text-teal-700">{approvedCount}</span>
          </div>
          <div>
            Published:{' '}
            <span className="font-semibold text-slate-900">{publishedCount}</span>
          </div>
          {uploadingVideo && (
            <div className="flex items-center gap-1.5 font-semibold text-teal-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Encoding 1080p MP4 &amp; adding to Pending Approval...</span>
            </div>
          )}
        </div>

        {statusMessage && (
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-xs font-medium text-teal-900">
            {statusMessage}
          </div>
        )}

        {previewItem && (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-950 p-4 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-teal-300">
                Preview Player · {previewItem.filename} ({STATUS_LABELS[previewItem.status]})
              </span>
              <button
                type="button"
                onClick={() => setPreviewItemId(null)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                Close Player
              </button>
            </div>
            <video
              key={previewItem.id}
              src={`/api/studio/queue/${encodeURIComponent(previewItem.id)}/video`}
              controls
              playsInline
              className="mx-auto max-h-[420px] w-full rounded-lg bg-black"
            />
          </div>
        )}

        {loadingQueue ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Loading StorySprout Studio Approval Queue...
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No videos in the approval queue yet. Click <strong>Record</strong> on the 3D stage or{' '}
            <strong>Render Original Stories (Ep 11–14)</strong> above to create your first 1080p MP4 for review.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => {
              const epMatch =
                episodes.find((e) => e.id === item.episodeId) || episodes[0];
              const isEditing = editingId === item.id;
              return (
                <div key={item.id} className="space-y-3 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                        <span
                          className={`font-semibold ${
                            item.status === 'approved'
                              ? 'text-teal-700'
                              : item.status === 'pending_approval'
                              ? 'text-amber-700'
                              : item.status === 'rejected'
                              ? 'text-rose-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {STATUS_LABELS[item.status]}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Ep {String(item.episodeId).padStart(2, '0')}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {item.formatMode === 'short'
                            ? '9:16 Short'
                            : item.formatMode === 'full5min'
                            ? '16:9 5m Cut'
                            : '16:9 Preview'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{(item.sizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.durationSec}s</span>
                        {item.scheduledSlot && item.status === 'approved' && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium text-teal-700">
                              Slot{' '}
                              {new Date(item.scheduledSlot).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="font-display text-base font-semibold text-slate-900">
                        {item.youtubeTitle}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {item.filename} · {item.trainName}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewItemId(previewItemId === item.id ? null : item.id)
                        }
                        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                          previewItemId === item.id
                            ? 'border-teal-600 bg-teal-50 text-teal-800'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>{previewItemId === item.id ? 'Hide' : 'Preview'}</span>
                      </button>

                      {item.status !== 'approved' && item.status !== 'published' && (
                        <button
                          type="button"
                          onClick={() => handleDecision(item.id, 'approve')}
                          className="flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      {item.status !== 'rejected' && item.status !== 'published' && (
                        <button
                          type="button"
                          onClick={() => handleDecision(item.id, 'reject')}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <XCircle className="h-3.5 w-3.5 text-rose-600" />
                          <span>Revise</span>
                        </button>
                      )}

                      {item.status === 'rejected' && (
                        <button
                          type="button"
                          onClick={() => handleDecision(item.id, 'reset_pending')}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Pending</span>
                        </button>
                      )}

                      {item.status === 'approved' && (
                        <button
                          type="button"
                          disabled={publishingId === item.id}
                          onClick={() => publishApprovedItem(item)}
                          className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                        >
                          {publishingId === item.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          <span>Publish Approved</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            setEditingId(null);
                          } else {
                            setEditingId(item.id);
                            setEditTitle(item.youtubeTitle);
                            setEditDesc(item.youtubeDescription);
                          }
                        }}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        {isEditing ? 'Cancel' : 'Edit Meta'}
                      </button>

                      {epMatch && (
                        <button
                          type="button"
                          onClick={() => onOpenThumbnail(epMatch)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <Image className="h-3.5 w-3.5" />
                          <span>Thumb</span>
                        </button>
                      )}

                      <a
                        href={`/api/studio/queue/${encodeURIComponent(item.id)}/video?download=1`}
                        download={item.filename}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>MP4</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        aria-label={`Remove ${item.filename}`}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">
                          YouTube Title (@RadiantSparkGlobal)
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">
                          Description &amp; Chapters
                        </label>
                        <textarea
                          rows={3}
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            handleDecision(item.id, 'update_meta', {
                              youtubeTitle: editTitle,
                              youtubeDescription: editDesc,
                            })
                          }
                          className="flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Save Metadata</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: PRODUCTION ARCHITECTURE & 30-MINUTE QUEUE CHECKS */}
      <section id="architecture" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-semibold text-slate-900">
              Production Architecture &amp; 30-Minute Queue Check Plan
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Independent StorySprout Studio pipeline for <strong>@RadiantSparkGlobal</strong>: Baby-to-Big character lock, cinematic 3D + audio rendering, FFmpeg 1080p MP4 encoding, and human-approved 30-minute queue checks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={checkingNow}
              onClick={handleRunQueueCheckNow}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              {checkingNow ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 text-teal-600" />
              )}
              <span>Run 30-Min Check Now</span>
            </button>

            <a
              href="/api/export/worker-script"
              download="storysprout-30min-worker.mjs"
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download 30-Min Worker (.mjs)</span>
            </a>
          </div>
        </div>

        {/* 4-Stage Architecture Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
            <div className="text-xs font-semibold text-teal-700 tabular-nums">
              01 · Story &amp; Continuity
            </div>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Baby-to-Big Story Engine
            </h3>
            <p className="text-xs leading-relaxed text-slate-600">
              Create Episode composes original musical stories anchored to Baby Mia, Baby Benny &amp; Pip (Scene 1) transitioning to Big Mia &amp; Benny (Scenes 2–4).
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
            <div className="text-xs font-semibold text-teal-700 tabular-nums">
              02 · Cinematic 3D Render
            </div>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Three.js + Filmic Bloom
            </h3>
            <p className="text-xs leading-relaxed text-slate-600">
              Golden-hour three-point + rim lighting, floating dust motes, EffectComposer bloom + ACES tone mapping, and synced Web Audio / ElevenLabs / Gemini voice mix.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
            <div className="text-xs font-semibold text-teal-700 tabular-nums">
              03 · Media Transcode
            </div>
            <h3 className="font-display text-base font-semibold text-slate-900">
              FFmpeg 1080p MP4 Vault
            </h3>
            <p className="text-xs leading-relaxed text-slate-600">
              Server FFmpeg converts captured 16:9 and 9:16 streams into YouTube-ready H.264 MP4 (+faststart) persisted in the local render queue for preview &amp; download.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
            <div className="text-xs font-semibold text-teal-700 tabular-nums">
              04 · Approval Publishing
            </div>
            <h3 className="font-display text-base font-semibold text-slate-900">
              30-Min Check Worker
            </h3>
            <p className="text-xs leading-relaxed text-slate-600">
              Every :00 and :30 check inspects the queue, ignores Pending Approval clips, and routes only human-approved episodes to @RadiantSparkGlobal within YouTube’s 6/day safety limit.
            </p>
          </div>
        </div>

        {/* 30-Min Schedule + Check History */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-600" />
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Upcoming 30-Minute Check Windows
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-500 tabular-nums">:00 / :30</span>
            </div>

            <div className="space-y-2">
              {(queueData?.upcomingSlots ?? []).map((iso, idx) => {
                const dt = new Date(iso);
                const approvedInSlot = items.filter((i) => i.status === 'approved')[idx];
                return (
                  <div
                    key={iso}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2 text-xs tabular-nums"
                  >
                    <span className="font-semibold text-slate-900">
                      {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="truncate text-slate-600">
                      {approvedInSlot
                        ? `Approved: ${approvedInSlot.title}`
                        : 'Check queue · hold unapproved clips'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
              <span>
                YouTube Data API daily quota safely supports up to ~6 uploads/day (~10,000 units/day). The 30-minute check inspects readiness every half hour and paces uploads automatically once approved.
              </span>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-7">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="font-display text-base font-semibold text-slate-900">
                30-Minute Queue Check Log
              </h3>
              <a
                href="https://www.youtube.com/@RadiantSparkGlobal"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
              >
                <span>@RadiantSparkGlobal</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {(queueData?.checkHistory ?? []).length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">
                  No queue checks logged yet. Click <strong>Run 30-Min Check Now</strong> to verify.
                </p>
              ) : (
                (queueData?.checkHistory ?? []).map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-slate-500 tabular-nums">
                      <span className="font-semibold text-slate-900">
                        Slot {entry.slotLabel} ·{' '}
                        {entry.trigger === 'cron_30m'
                          ? '30-Min Auto Check'
                          : entry.trigger === 'manual_check'
                          ? 'Manual Queue Check'
                          : 'Studio Startup'}
                      </span>
                      <span>
                        Pending {entry.pendingCount} · Approved {entry.approvedReadyCount} ·
                        Published {entry.publishedTodayCount}/6
                      </span>
                    </div>
                    <p className="mt-1 text-slate-700 leading-relaxed">{entry.outcome}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* GitHub Repo & Zoho soleystories Domain Hosting Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                GitHub Repository &amp; Zoho Domain (soleystories) Deployment
              </h3>
              <p className="mt-0.5 text-xs text-slate-600">
                Download the GitHub-ready codebase archive (includes <span className="font-mono">.gitignore</span> and <span className="font-mono">README.md</span>), push to your new GitHub repo, and point your Zoho <span className="font-semibold text-slate-800">soleystories</span> DNS CNAME/A record to your Node host.
              </p>
            </div>
            <a
              href="/api/export/website-zip"
              download="storysprout-studio-website.zip"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
            >
              <Download className="h-3.5 w-3.5 text-teal-600" />
              <span>Download GitHub-Ready ZIP</span>
            </a>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-[11px] leading-relaxed text-slate-700">
{`git init && git add . && git commit -m "Initial StorySprout Studio"
git branch -M main && git remote add origin https://github.com/<your-username>/storysprout-studio.git
git push -u origin main`}
          </pre>
        </div>
      </section>
    </div>
  );
};
