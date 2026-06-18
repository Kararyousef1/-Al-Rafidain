import { useState, useCallback, useRef } from 'react';
import {
  Type, Heading1, Image, Video, FileText,
  List, Table, Plus, X, Trash2, MoveUp, MoveDown,
  Upload, Loader2, Music
} from 'lucide-react';
import type { RichContent, RichContentBlock, MediaFile } from '../../types/media';
import { getMediaTypeLabel } from '../../types/media';

// ── Utils ──
const generateId = () => `block_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

interface RichContentEditorProps {
  value: RichContent;
  onChange: (content: RichContent) => void;
  maxHeight?: string;
  placeholder?: string;
}

export default function RichContentEditor({
  value,
  onChange,
  maxHeight = '600px',
  placeholder = 'ابدأ بكتابة المحتوى هنا...'
}: RichContentEditorProps) {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState(false);

  const blocks = value.blocks || [];
  const mediaFiles = value.mediaFiles || [];

  const updateBlocks = useCallback((newBlocks: RichContentBlock[]) => {
    onChange({ ...value, blocks: newBlocks });
  }, [value, onChange]);

  const addBlock = useCallback((type: RichContentBlock['type']) => {
    const newBlock: RichContentBlock = {
      id: generateId(),
      type,
      content: '',
      order: blocks.length,
    };
    if (type === 'heading') {
      newBlock.headingLevel = 2;
      newBlock.content = 'عنوان جديد';
    }
    if (type === 'list') {
      newBlock.items = ['عنصر جديد'];
    }
    if (type === 'table') {
      newBlock.tableData = [['خلية 1', 'خلية 2'], ['خلية 3', 'خلية 4']];
    }
    const newBlocks = [...blocks, newBlock];
    updateBlocks(newBlocks);
    setActiveBlockId(newBlock.id);
    setShowBlockMenu(false);
  }, [blocks, updateBlocks]);

  const removeBlock = useCallback((blockId: string) => {
    const newBlocks = blocks.filter(b => b.id !== blockId).map((b, i) => ({ ...b, order: i }));
    updateBlocks(newBlocks);
  }, [blocks, updateBlocks]);

  const moveBlock = useCallback((index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    updateBlocks(newBlocks.map((b, i) => ({ ...b, order: i })));
  }, [blocks, updateBlocks]);

  const updateBlockContent = useCallback((blockId: string, content: string) => {
    const newBlocks = blocks.map(b => b.id === blockId ? { ...b, content } : b);
    updateBlocks(newBlocks);
  }, [blocks, updateBlocks]);

  const updateBlockItems = useCallback((blockId: string, items: string[]) => {
    const newBlocks = blocks.map(b => b.id === blockId ? { ...b, items } : b);
    updateBlocks(newBlocks);
  }, [blocks, updateBlocks]);

  const updateBlockTable = useCallback((blockId: string, tableData: string[][]) => {
    const newBlocks = blocks.map(b => b.id === blockId ? { ...b, tableData } : b);
    updateBlocks(newBlocks);
  }, [blocks, updateBlocks]);

  const addMediaToBlock = useCallback(async (blockId: string, file: File) => {
    setUploadingBlockId(blockId);
    try {
      // Simulate upload - in production, upload to Supabase storage
      const url = URL.createObjectURL(file);
      const mediaFile: MediaFile = {
        id: generateId(),
        name: file.name,
        url,
        type: file.type.startsWith('image/') ? 'image' :
              file.type.startsWith('video/') ? 'video' :
              file.type.startsWith('audio/') ? 'audio' : 'document',
        mimeType: file.type,
        size: file.size,
        createdAt: new Date().toISOString(),
      };

      const newBlocks = blocks.map(b => {
        if (b.id === blockId) {
          return { ...b, mediaFile, content: url };
        }
        return b;
      });
      updateBlocks(newBlocks);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploadingBlockId(null);
    }
  }, [blocks, updateBlocks]);

  return (
    <div className="border-2 border-slate-200 rounded-2xl bg-white overflow-hidden" dir="rtl">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 flex-wrap">
        <button onClick={() => addBlock('text')}
          className="p-2 hover:bg-indigo-100 rounded-lg text-slate-600 hover:text-indigo-600 transition-all"
          title="نص">
          <Type size={16} />
        </button>
        <div className="relative group">
          <button onClick={() => addBlock('heading')}
            className="p-2 hover:bg-indigo-100 rounded-lg text-slate-600 hover:text-indigo-600 transition-all"
            title="عنوان">
            <Heading1 size={16} />
          </button>
          <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-1 hidden group-hover:block z-10 min-w-[120px]">
            {[1, 2, 3, 4].map(level => (
              <button key={level} onClick={() => {
                const b = {
                  id: generateId(),
                  type: 'heading' as const,
                  content: `عنوان مستوى ${level}`,
                  headingLevel: level as 1 | 2 | 3 | 4,
                  order: blocks.length,
                };
                updateBlocks([...blocks, b]);
                setActiveBlockId(b.id);
              }}
              className="block w-full text-right px-3 py-1.5 text-sm hover:bg-indigo-50 rounded-lg text-slate-700">
                عنوان {level}
              </button>
            ))}
          </div>
        </div>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <button onClick={() => addBlock('image')}
          className="p-2 hover:bg-indigo-100 rounded-lg text-slate-600 hover:text-indigo-600 transition-all"
          title="صورة">
          <Image size={16} />
        </button>
        <button onClick={() => addBlock('video')}
          className="p-2 hover:bg-indigo-100 rounded-lg text-slate-600 hover:text-indigo-600 transition-all"
          title="فيديو">
          <Video size={16} />
        </button>
        <button onClick={() => addBlock('audio')}
          className="p-2 hover:bg-indigo-100 rounded-lg text-slate-600 hover:text-indigo-600 transition-all"
          title="صوت">
          <Music size={16} />
        </button>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <button onClick={() => addBlock('list')}
          className="p-2 hover:bg-indigo-100 rounded-lg text-slate-600 hover:text-indigo-600 transition-all"
          title="قائمة">
          <List size={16} />
        </button>
        <button onClick={() => addBlock('table')}
          className="p-2 hover:bg-indigo-100 rounded-lg text-slate-600 hover:text-indigo-600 transition-all"
          title="جدول">
          <Table size={16} />
        </button>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <button onClick={() => setShowBlockMenu(!showBlockMenu)}
          className="p-2 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-all"
          title="إضافة محتوى">
          <Plus size={16} />
        </button>
      </div>

      {/* Blocks Area */}
      <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight }}>
        {blocks.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">أضف محتوى باستخدام الأزرار أعلاه</p>
            <p className="text-xs mt-1">{placeholder}</p>
          </div>
        )}

        {blocks.map((block, index) => (
          <div
            key={block.id}
            className={`group relative border-2 rounded-xl transition-all ${
              activeBlockId === block.id
                ? 'border-indigo-400 bg-indigo-50/30 shadow-sm'
                : 'border-slate-100 hover:border-slate-200 bg-white'
            }`}
            onClick={() => setActiveBlockId(block.id)}
          >
            {/* Block Controls */}
            <div className={`absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${activeBlockId === block.id ? 'opacity-100' : ''}`}>
              <button onClick={(e) => { e.stopPropagation(); moveBlock(index, 'up'); }}
                className="p-1 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-300 shadow-sm transition-all"
                disabled={index === 0}>
                <MoveUp size={12} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); moveBlock(index, 'down'); }}
                className="p-1 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-300 shadow-sm transition-all"
                disabled={index === blocks.length - 1}>
                <MoveDown size={12} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                className="p-1 bg-white border border-red-200 rounded-lg text-red-400 hover:text-red-600 hover:border-red-300 shadow-sm transition-all">
                <Trash2 size={12} />
              </button>
            </div>

            {/* Block Type Badge */}
            <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-full">
              {blockTypeLabel(block.type)}
            </div>

            {/* Block Content */}
            <div className="p-4 pt-5">
              {block.type === 'text' && (
                <textarea
                  value={block.content}
                  onChange={(e) => updateBlockContent(block.id, e.target.value)}
                  className="w-full bg-transparent border-none outline-none resize-none text-sm text-slate-700 min-h-[60px] font-medium leading-relaxed"
                  placeholder="اكتب المحتوى هنا..."
                />
              )}

              {block.type === 'heading' && (
                <input
                  value={block.content}
                  onChange={(e) => updateBlockContent(block.id, e.target.value)}
                  className={`w-full bg-transparent border-none outline-none font-extrabold text-slate-800 ${
                    block.headingLevel === 1 ? 'text-2xl' :
                    block.headingLevel === 2 ? 'text-xl' :
                    block.headingLevel === 3 ? 'text-lg' : 'text-base'
                  }`}
                  placeholder="عنوان..."
                />
              )}

              {block.type === 'image' && (
                <div className="space-y-2">
                  {block.mediaFile ? (
                    <div className="relative group/image">
                      <img
                        src={block.mediaFile.url}
                        alt={block.mediaFile.alt || ''}
                        className="w-full max-h-[400px] object-contain rounded-xl bg-slate-50"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/30 transition-all rounded-xl flex items-center justify-center gap-3 opacity-0 group-hover/image:opacity-100">
                        <label className="p-2 bg-white/90 rounded-lg cursor-pointer hover:bg-white transition-all shadow-lg">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) addMediaToBlock(block.id, file);
                            }}
                          />
                          <Upload size={16} className="text-slate-700" />
                        </label>
                        <input
                          value={block.mediaFile.alt || ''}
                          onChange={(e) => {
                            const newBlocks = blocks.map(b =>
                              b.id === block.id && b.mediaFile
                                ? { ...b, mediaFile: { ...b.mediaFile, alt: e.target.value } }
                                : b
                            );
                            updateBlocks(newBlocks);
                          }}
                          placeholder="نص بديل للصورة..."
                          className="px-3 py-1.5 rounded-lg text-sm bg-white/90 border-none outline-none text-slate-700 w-40"
                        />
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) addMediaToBlock(block.id, file);
                        }}
                      />
                      {uploadingBlockId === block.id ? (
                        <Loader2 size={24} className="animate-spin text-indigo-500" />
                      ) : (
                        <>
                          <Image size={24} className="text-slate-300 mb-2" />
                          <span className="text-xs text-slate-400 font-medium">اضغط لرفع صورة</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
              )}

              {block.type === 'video' && (
                <div className="space-y-2">
                  {block.mediaFile ? (
                    <div className="relative group/video rounded-xl overflow-hidden bg-black">
                      <video
                        src={block.mediaFile.url}
                        controls
                        className="w-full max-h-[400px]"
                      />
                      <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover/video:opacity-100 transition-opacity">
                        <label className="p-1.5 bg-white/90 rounded-lg cursor-pointer hover:bg-white transition-all">
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) addMediaToBlock(block.id, file);
                            }}
                          />
                          <Upload size={14} className="text-slate-700" />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <label className="flex-1 flex flex-col items-center justify-center h-36 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) addMediaToBlock(block.id, file);
                          }}
                        />
                        {uploadingBlockId === block.id ? (
                          <Loader2 size={24} className="animate-spin text-indigo-500" />
                        ) : (
                          <>
                            <Video size={24} className="text-slate-300 mb-2" />
                            <span className="text-xs text-slate-400 font-medium">رفع فيديو</span>
                          </>
                        )}
                      </label>
                      <div className="flex-1 flex flex-col gap-1">
                        <input
                          value={block.content.startsWith('blob:') ? '' : block.content}
                          onChange={(e) => updateBlockContent(block.id, e.target.value)}
                          placeholder="أو粘贴 رابط فيديو (YouTube)..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:border-indigo-300 transition-all"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {block.type === 'audio' && (
                <div className="space-y-2">
                  {block.mediaFile ? (
                    <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
                      <audio src={block.mediaFile.url} controls className="flex-1 h-10" />
                      <label className="p-1.5 rounded-lg cursor-pointer hover:bg-slate-200 transition-all">
                        <input
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) addMediaToBlock(block.id, file);
                          }}
                        />
                        <Upload size={14} className="text-slate-500" />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) addMediaToBlock(block.id, file);
                        }}
                      />
                      {uploadingBlockId === block.id ? (
                        <Loader2 size={24} className="animate-spin text-indigo-500" />
                      ) : (
                        <>
                          <Music size={24} className="text-slate-300 mb-1" />
                          <span className="text-xs text-slate-400 font-medium">رفع ملف صوتي</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
              )}

              {block.type === 'list' && (
                <div className="space-y-1">
                  {(block.items || ['']).map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs">•</span>
                      <input
                        value={item}
                        onChange={(e) => {
                          const newItems = [...(block.items || [])];
                          newItems[i] = e.target.value;
                          updateBlockItems(block.id, newItems);
                        }}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700"
                        placeholder="عنصر القائمة..."
                      />
                      <button
                        onClick={() => {
                          const newItems = block.items?.filter((_, idx) => idx !== i) || [];
                          updateBlockItems(block.id, newItems.length ? newItems : ['']);
                        }}
                        className="p-1 text-slate-300 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => updateBlockItems(block.id, [...(block.items || []), ''])}
                    className="text-xs text-indigo-500 hover:text-indigo-700 font-medium mt-1"
                  >
                    + إضافة عنصر
                  </button>
                </div>
              )}

              {block.type === 'table' && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <tbody>
                      {(block.tableData || [['']]).map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j} className="border border-slate-200 p-0">
                              <input
                                value={cell}
                                onChange={(e) => {
                                  const newData = [...(block.tableData || [['']])];
                                  newData[i][j] = e.target.value;
                                  updateBlockTable(block.id, newData);
                                }}
                                className="w-full px-2 py-1.5 bg-transparent border-none outline-none text-sm text-slate-700 text-center"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        const newData = [...(block.tableData || [['']])];
                        const newRow = newData[0].map(() => '');
                        newData.push(newRow);
                        updateBlockTable(block.id, newData);
                      }}
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                    >
                      + إضافة صف
                    </button>
                    <button
                      onClick={() => {
                        const newData = [...(block.tableData || [['']])];
                        newData.forEach(row => row.push(''));
                        updateBlockTable(block.id, newData);
                      }}
                      className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                    >
                      + إضافة عمود
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Hidden file input for media uploads */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={() => {}}
      />

      {/* Summary */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>الكتل: {blocks.length}</span>
          {blocks.filter(b => b.type === 'image' || b.type === 'video').length > 0 && (
            <span>وسائط: {blocks.filter(b => b.type === 'image' || b.type === 'video').length}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function blockTypeLabel(type: RichContentBlock['type']): string {
  const labels: Record<string, string> = {
    text: 'نص',
    heading: 'عنوان',
    image: 'صورة',
    video: 'فيديو',
    audio: 'صوت',
    document: 'مستند',
    list: 'قائمة',
    table: 'جدول',
  };
  return labels[type] || type;
}