import React, { useEffect, useState } from 'react';
import { DatabaseService } from '@/src/services/database';
import { Download, ExternalLink, Play, FileDown, Youtube } from 'lucide-react';
import type { Download as DownloadType } from '@/types';

function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function DownloadsPage() {
  const [items, setItems] = useState<DownloadType[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    DatabaseService.getDownloads().then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const handleDeliverable = (item: DownloadType) => {
    if (!item.deliverable_url) return;
    if (item.deliverable_type === 'link') {
      window.open(item.deliverable_url, '_blank', 'noopener');
    } else {
      const a = document.createElement('a');
      a.href = item.deliverable_url;
      a.download = '';
      a.target = '_blank';
      a.rel = 'noopener';
      a.click();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-lilac" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Downloads</h1>
            <p className="text-gray-500 text-sm">Materiais de apoio das aulas</p>
          </div>
        </div>

        {items.length === 0 && (
          <div className="text-center py-16">
            <Download className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum material disponível ainda.</p>
          </div>
        )}

        <div className="space-y-6">
          {items.map(item => {
            const videoId = getYouTubeId(item.youtube_url);
            const isPlaying = playing === item.id;

            return (
              <div key={item.id} className="rounded-xl border border-glass-border bg-glass overflow-hidden">
                <div className="p-5">
                  <h2 className="font-display text-lg font-semibold text-white mb-1">{item.titulo}</h2>
                  {item.descricao && (
                    <p className="text-sm text-gray-400 mb-4">{item.descricao}</p>
                  )}

                  {videoId && (
                    <div className="mb-4">
                      {isPlaying ? (
                        <div className="relative rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                            title={item.titulo}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setPlaying(item.id)}
                          className="relative w-full rounded-lg overflow-hidden group cursor-pointer"
                          style={{ paddingBottom: '56.25%' }}
                        >
                          <img
                            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-all">
                            <div className="w-14 h-14 rounded-full bg-accent-lilac/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Play className="w-6 h-6 text-white ml-0.5" />
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  {item.deliverable_url && (
                    <button
                      onClick={() => handleDeliverable(item)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent-cyan text-white text-sm font-semibold hover:opacity-90 transition-all"
                    >
                      {item.deliverable_type === 'link' ? (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          Abrir no Google Drive
                        </>
                      ) : (
                        <>
                          <FileDown className="w-4 h-4" />
                          Baixar arquivo
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
