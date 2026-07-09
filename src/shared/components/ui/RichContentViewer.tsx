import { useState, useRef } from 'react';
import {
  Image, Video, Music, FileText,
  Maximize2, Minimize2,
  ChevronLeft, ChevronRight,
  Loader2
} from 'lucide-react';
import type { RichContent, RichContentBlock } from '../../../shared/types/media';

interface RichContentViewerProps {
  content: RichContent;
  className?: string;
  onMediaClick?: (block: RichContentBlock) => void;
}

export default function RichContentViewer({
  content,
  className = '',
  onMediaClick,
}: RichContentViewerProps) {
  const blocks = content.blocks || [];
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  if (!blocks.length) {
    return (
      <div className="text-center py-12 text-slate-400">
        <FileText size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium">لا يوجد محتوى</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {blocks.map((block, index) => (
        <div key={block.id} className="animate-fade-in">
          {block.type === 'heading' && (
            <div
              className={`font-extrabold text-slate-800 ${
                block.headingLevel === 1 ? 'text-2xl md:text-3xl' :
                block.headingLevel === 2 ? 'text-xl md:text-2xl' :
                block.headingLevel === 3 ? 'text-lg md:text-xl' : 'text-base md:text-lg'
              }`}
            >
              {block.content}
            </div>
          )}

          {block.type === 'text' && (
            <div className="text-sm md:text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
              {block.content}
            </div>
          )}

          {block.type === 'image' && (block.mediaFile || block.content) && (
            <ImageBlock
              block={block}
              onExpand={() => {
                setExpandedImage(block.id);
                setActiveImageIndex(index);
              }}
            />
          )}

          {block.type === 'video' && (block.mediaFile || block.content) && (
            <VideoBlock block={block} />
          )}

          {block.type === 'audio' && block.mediaFile && (
            <AudioBlock block={block} />
          )}

          {block.type === 'list' && (
            <ul className="space-y-1.5 pr-5">
              {(block.items || []).filter(i => i.trim()).map((item, i) => (
                <li key={i} className="text-sm md:text-base text-slate-700 flex items-start gap-2">
                  <span className="text-indigo-500 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}

          {block.type === 'table' && block.tableData && block.tableData.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full border-collapse">
                <tbody>
                  {block.tableData.map((row, i) => (
                    <tr key={i} className={i === 0 ? 'bg-indigo-50' : 'hover:bg-slate-50'}>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className={`px-4 py-2.5 text-sm border border-slate-200 ${
                            i === 0 ? 'font-bold text-slate-700' : 'text-slate-600'
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {/* Image Lightbox */}
      {expandedImage && (
        <ImageLightbox
          blocks={blocks.filter(b => b.type === 'image' && b.mediaFile)}
          activeIndex={activeImageIndex}
          onClose={() => setExpandedImage(null)}
          onNavigate={(idx) => setActiveImageIndex(idx)}
        />
      )}
    </div>
  );
}

// ── Image Block ──
function ImageBlock({ block, onExpand }: { block: RichContentBlock; onExpand: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const mediaFile = block.mediaFile;
  // استخدام الرابط من mediaFile أو من block.content مباشرة (لحالة لصق الرابط)
  const imageUrl = mediaFile?.url || block.content || '';

  if (!imageUrl) return null;

  return (
    <div className="group relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
      {!loaded && (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin text-indigo-500" />
        </div>
      )}
      <img
        src={imageUrl}
        alt={mediaFile?.alt || block.content || ''}
        className={`w-full max-h-[500px] object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0 absolute'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
      <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onExpand}
          className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm transition-all"
          title="عرض كامل"
        >
          <Maximize2 size={14} className="text-slate-600" />
        </button>
        {mediaFile?.description && (
          <div className="px-2 py-1.5 bg-white/90 rounded-lg text-xs text-slate-500 max-w-[200px]">
            {mediaFile.description}
          </div>
        )}
      </div>
      {mediaFile?.alt && (
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-100">
          <p className="text-xs text-slate-400">{mediaFile.alt}</p>
        </div>
      )}
    </div>
  );
}

// ── Video Block محسّن ──
function VideoBlock({ block }: { block: RichContentBlock }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [embedError, setEmbedError] = useState(false);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaFile = block.mediaFile;
  const mediaName = mediaFile?.name || 'محتوى تعليمي';
  const url = mediaFile?.url || block.content || '';

  // كشف روابط يوتيوب وإخفاء العلامات التجارية
  const getYoutubeEmbedUrl = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=0&rel=0&modestbranding=1&showinfo=0&controls=1&iv_load_policy=3`; // nocookie + modestbranding
    }
    return null;
  };

  const youtubeEmbedUrl = getYoutubeEmbedUrl(url);
  const isYoutube = !!youtubeEmbedUrl;

  // كشف روابط الفيديو المباشرة
  const isDirectVideo = url.match(/\.(mp4|webm|ogg|mov|avi)$/i);

  if (error || embedError) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-video flex items-center justify-center">
        <div className="text-center">
          <Video size={40} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm text-slate-500 font-medium">عذراً، لا يمكن تحميل هذا الفيديو</p>
          <p className="text-xs text-slate-400 mt-1">قد يكون الرابط غير صحيح أو أن الفيديو غير متاح</p>
        </div>
      </div>
    );
  }

  if (isYoutube) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-lg">
        <iframe
          src={youtubeEmbedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={mediaName}
          onError={() => setError(true)}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-3 pointer-events-none">
          <p className="text-white/80 text-xs font-medium">{mediaName}</p>
        </div>
      </div>
    );
  }

  if (isDirectVideo) {
    return (
      <div
        className="relative rounded-2xl overflow-hidden bg-black shadow-lg"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={url}
          controls
          className="w-full max-h-[500px]"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => setError(true)}
          poster={block.metadata?.poster || undefined}
        >
          <p>متصفحك لا يدعم تشغيل الفيديو</p>
        </video>
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-3 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-white/80 text-xs font-medium">{mediaName}</p>
        </div>
      </div>
    );
  }

  // رابط آخر - نحاول عرضه
  return (
    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-lg">
      <iframe
        src={url}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={mediaName}
        onError={() => setEmbedError(true)}
      />
      {embedError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white">
          <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-indigo-400">افتح الرابط مباشرة</a>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pointer-events-none">
        <p className="text-white text-xs font-medium">{mediaName}</p>
      </div>
    </div>
  );
}

// ── Audio Block ──
function AudioBlock({ block }: { block: RichContentBlock }) {
  const mediaFile = block.mediaFile;
  if (!mediaFile) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
          <Music size={24} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm">{mediaFile.name}</p>
          {mediaFile.description && (
            <p className="text-xs text-slate-500 mt-0.5">{mediaFile.description}</p>
          )}
        </div>
      </div>
      <div className="mt-4">
        <audio src={mediaFile.url} controls className="w-full h-10" />
      </div>
    </div>
  );
}

// ── Image Lightbox ──
function ImageLightbox({
  blocks,
  activeIndex,
  onClose,
  onNavigate,
}: {
  blocks: RichContentBlock[];
  activeIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const currentBlock = blocks[activeIndex];
  const mediaFile = currentBlock?.mediaFile;

  if (!mediaFile) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
      >
        <Minimize2 size={20} />
      </button>

      {blocks.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(activeIndex > 0 ? activeIndex - 1 : blocks.length - 1);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
          >
            <ChevronRight size={24} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(activeIndex < blocks.length - 1 ? activeIndex + 1 : 0);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
          >
            <ChevronLeft size={24} />
          </button>
        </>
      )}

      <div className="max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img
          src={mediaFile.url}
          alt={mediaFile.alt || ''}
          className="w-full h-full object-contain rounded-2xl"
        />
        <div className="text-center mt-4 text-white/80 text-sm">
          {mediaFile.alt && <p>{mediaFile.alt}</p>}
          <p className="text-white/50 text-xs mt-1">
            {activeIndex + 1} / {blocks.length}
          </p>
        </div>
      </div>
    </div>
  );
}