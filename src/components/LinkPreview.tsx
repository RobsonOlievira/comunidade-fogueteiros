import React, { useState, useEffect, useMemo } from 'react';
import { Play, ExternalLink, Loader2 } from 'lucide-react';

interface VideoMeta {
  url: string;
  type: 'youtube' | 'vimeo' | 'tiktok' | 'generic';
  videoId?: string;
  thumbUrl: string;
  title?: string;
  duration?: string;
  siteName?: string;
}

const YOUTUBE_ID_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const VIMEO_ID_RE = /vimeo\.com\/(?:video\/)?(\d+)/;
const TIKTOK_ID_RE = /tiktok\.com\/@[\w.]+\/video\/(\d+)/;

function extractVideoMeta(rawUrl: string): VideoMeta | null {
  const trimmed = rawUrl.trim();
  let match: RegExpMatchArray | null;

  // YouTube
  match = trimmed.match(YOUTUBE_ID_RE);
  if (match) {
    const id = match[1];
    return {
      url: trimmed,
      type: 'youtube',
      videoId: id,
      thumbUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      siteName: 'YouTube',
    };
  }

  // Vimeo
  match = trimmed.match(VIMEO_ID_RE);
  if (match) {
    const id = match[1];
    return {
      url: trimmed,
      type: 'vimeo',
      videoId: id,
      // thumb é pego via fetch (oEmbed)
      thumbUrl: '',
      siteName: 'Vimeo',
    };
  }

  // TikTok
  match = trimmed.match(TIKTOK_ID_RE);
  if (match) {
    return {
      url: trimmed,
      type: 'tiktok',
      videoId: match[1],
      thumbUrl: '',
      siteName: 'TikTok',
    };
  }

  // Links genéricos — tentamos OG
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return {
        url: trimmed,
        type: 'generic',
        thumbUrl: '',
        siteName: parsed.hostname.replace('www.', ''),
      };
    }
  } catch {
    return null;
  }

  return null;
}

function VimeoThumb({ videoId }: { videoId: string }) {
  const [thumb, setThumb] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}&width=480`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setThumb(data.thumbnail_url || '');
          setTitle(data.title || '');
        }
      })
      .catch(() => { if (!cancelled) setThumb(''); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [videoId]);

  if (loading) return <Loader2 className="w-5 h-5 animate-spin text-gray-500" />;
  if (!thumb) return null;
  return <img src={thumb} alt={title} className="w-full h-full object-cover" loading="lazy" />;
}

function TikTokThumb({ url }: { url: string }) {
  // TikTok não tem CORS público confiável via browser — mostramos placeholder
  return (
    <div className="w-full h-full bg-[#fe2c55] flex items-center justify-center">
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="white">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.5v-3.4a4.85 4.85 0 01-1-.14z" />
      </svg>
    </div>
  );
}

function getMaxResThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}

function getHqThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

interface LinkPreviewCardProps {
  meta: VideoMeta;
}

function LinkPreviewCard({ meta }: LinkPreviewCardProps) {
  const [ytFallback, setYtFallback] = useState(false);

  return (
    <a
      href={meta.url}
      target="_blank"
      rel="noopener noreferrer"
      className="link-preview-card"
    >
      <div className="link-preview-thumb">
        {meta.type === 'youtube' && !ytFallback && (
          <img
            src={getMaxResThumb(meta.videoId!)}
            alt="Thumbnail"
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setYtFallback(true)}
          />
        )}
        {meta.type === 'youtube' && ytFallback && (
          <img
            src={getHqThumb(meta.videoId!)}
            alt="Thumbnail"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        {meta.type === 'youtube' && (
          <div className="link-preview-play-badge">
            <Play className="w-6 h-6 fill-white text-white" />
          </div>
        )}
        {meta.type === 'vimeo' && <VimeoThumb videoId={meta.videoId!} />}
        {meta.type === 'tiktok' && <TikTokThumb url={meta.url} />}
        {meta.type === 'generic' && (
          <div className="w-full h-full bg-glass flex items-center justify-center">
            <ExternalLink className="w-8 h-8 text-gray-500" />
          </div>
        )}
      </div>
      <div className="link-preview-info">
        {meta.siteName && (
          <span className="link-preview-site">{meta.siteName}</span>
        )}
        {meta.title ? (
          <span className="link-preview-title">{meta.title}</span>
        ) : (
          <span className="link-preview-title">{meta.url}</span>
        )}
        <ExternalLink className="link-preview-icon w-4 h-4 flex-shrink-0" />
      </div>
    </a>
  );
}

const URL_RE = /https?:\/\/[^\s<>"]+/gi;

export function extractLinks(text: string): string[] {
  const matches = text.match(URL_RE);
  return matches ? [...new Set(matches)] : [];
}

interface LinkPreviewGroupProps {
  text: string;
}

export function LinkPreviewGroup({ text }: LinkPreviewGroupProps) {
  const links = useMemo(() => extractLinks(text), [text]);
  if (links.length === 0) return null;

  return (
    <div className="link-preview-group">
      {links.map((url, i) => {
        const meta = extractVideoMeta(url);
        if (!meta) return null;
        return <LinkPreviewCard key={`${url}-${i}`} meta={meta} />;
      })}
    </div>
  );
}
