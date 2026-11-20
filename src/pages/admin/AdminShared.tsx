import React, { useState } from 'react';
import { Upload, X, Check, AlertTriangle, FolderOpen } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { MediaAsset } from '../../types/cms';

export const ConfirmModal: React.FC<{
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, title, description, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#111115] border border-white/15 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium border border-white/15 text-neutral-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export const ImagePickerField: React.FC<{
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: MediaAsset['folder'];
}> = ({ label, value, onChange, folder = 'general' }) => {
  const { apiFetch } = useSite();
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', file.name);
      fd.append('folder', folder);
      const res = await apiFetch('/api/admin/media/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const asset = await res.json();
        onChange(asset.url);
      }
    } finally {
      setUploading(false);
    }
  };

  const openLibrary = async () => {
    setPickerOpen(true);
    const res = await apiFetch('/api/admin/media');
    if (res.ok) {
      setMediaList(await res.json());
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-neutral-300">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... or /uploads/..."
          className="flex-1 px-3 py-2 text-xs bg-black/50 border border-white/10 text-white"
        />
        <label className="px-3 py-2 text-xs font-medium border border-white/15 bg-white/5 hover:bg-white/10 text-white cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap">
          <Upload className="w-3.5 h-3.5" />
          <span>{uploading ? 'Uploading...' : 'Upload'}</span>
          <input
            type="file"
            accept="image/*,video/*,.svg,.ico"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f);
            }}
          />
        </label>
        <button
          type="button"
          onClick={openLibrary}
          className="px-3 py-2 text-xs font-medium border border-white/15 bg-white/5 hover:bg-white/10 text-white inline-flex items-center gap-1.5 whitespace-nowrap"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Library</span>
        </button>
      </div>
      {value && (
        <div className="h-16 w-28 border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center">
          <img src={value} alt={label} className="max-h-full max-w-full object-contain" />
        </div>
      )}

      {pickerOpen && (
        <div className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-sm p-6 flex items-center justify-center">
          <div className="max-w-3xl w-full bg-[#111115] border border-white/15 max-h-[80vh] flex flex-col">
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Select Asset From Media Library</span>
              <button type="button" onClick={() => setPickerOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
              {mediaList
                .filter((m) => m.mimeType.startsWith('image/') || m.url.endsWith('.jpg') || m.url.endsWith('.png') || m.url.startsWith('data:image'))
                .map((asset) => (
                  <button
                    key={asset._id}
                    type="button"
                    onClick={() => {
                      onChange(asset.url);
                      setPickerOpen(false);
                    }}
                    className="border border-white/10 hover:border-white/50 p-2 bg-black/40 text-left space-y-2"
                  >
                    <div className="aspect-video bg-black flex items-center justify-center overflow-hidden">
                      <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-[11px] text-neutral-300 truncate">{asset.title}</div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const SimpleRichEditor: React.FC<{
  value: string;
  onChange: (html: string) => void;
}> = ({ value, onChange }) => {
  const wrapSelection = (tag: string, closeTag?: string) => {
    const end = closeTag || tag;
    onChange(`${value}\n<${tag}>New ${tag} content</${end}>`);
  };

  return (
    <div className="border border-white/10 bg-black/40">
      <div className="px-3 py-2 border-b border-white/10 flex flex-wrap items-center gap-2 bg-white/5">
        <button type="button" onClick={() => wrapSelection('h3')} className="px-2 py-1 text-xs border border-white/15 text-neutral-200 hover:text-white">
          + Heading
        </button>
        <button type="button" onClick={() => wrapSelection('p')} className="px-2 py-1 text-xs border border-white/15 text-neutral-200 hover:text-white">
          + Paragraph
        </button>
        <button type="button" onClick={() => wrapSelection('strong')} className="px-2 py-1 text-xs border border-white/15 text-neutral-200 hover:text-white">
          + Bold
        </button>
        <button type="button" onClick={() => onChange(`${value}\n<ul><li>Key point</li></ul>`)} className="px-2 py-1 text-xs border border-white/15 text-neutral-200 hover:text-white">
          + Bullet List
        </button>
        <button type="button" onClick={() => onChange(`${value}\n<blockquote>Notable quote</blockquote>`)} className="px-2 py-1 text-xs border border-white/15 text-neutral-200 hover:text-white">
          + Quote
        </button>
      </div>
      <textarea
        rows={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 text-xs font-mono bg-transparent text-neutral-100 focus:outline-none"
        placeholder="<p>Write rich HTML article content...</p>"
      />
    </div>
  );
};

export const ToastBanner: React.FC<{ message: string; type?: 'success' | 'error' }> = ({
  message,
  type = 'success',
}) => {
  if (!message) return null;
  return (
    <div
      className={`fixed bottom-5 right-5 z-[95] px-4 py-3 border text-xs font-medium flex items-center gap-2 shadow-xl ${
        type === 'error'
          ? 'bg-red-950 border-red-700 text-red-100'
          : 'bg-[#111115] border-emerald-600/60 text-emerald-300'
      }`}
    >
      <Check className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
};
