import { useRef, useState } from 'react';
import { Paperclip, X, Loader2, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const BUCKET = 'study-materials';
const ACCEPTED = '.pdf,.doc,.docx,.ppt,.pptx,.txt';

interface DocumentUploadProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  /** Folder inside the bucket, e.g. `courses/12` or `drafts/${user.id}`. */
  pathPrefix: string;
}

/**
 * "Choose Document" control for attaching study material (PDF, DOCX, etc.)
 * to a course, module, or lesson. Uploads straight to the `study-materials`
 * Storage bucket and hands back its public URL via onChange — the caller
 * is responsible for saving that URL into the relevant `document_url`
 * column (courses / modules / lessons all have one after running
 * migration_add_course_columns.sql).
 */
export default function DocumentUpload({
  label = 'Attach study material (PDF, etc.)',
  value,
  onChange,
  pathPrefix,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${pathPrefix}/${Date.now()}-${safeName}`;

      const { data, error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false });

      if (uploadError || !data) throw uploadError || new Error('Upload failed.');

      const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
      onChange(publicUrlData.publicUrl);
    } catch (err: any) {
      console.error('Document upload failed:', err);
      setError(err?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const fileName = value ? decodeURIComponent(value.split('/').pop() ?? '').replace(/^\d+-/, '') : '';

  return (
    <div>
      {label && <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">{label}</label>}

      {value ? (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm">
          <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <a href={value} target="_blank" rel="noreferrer" className="flex-1 truncate text-blue-600 hover:underline">
            {fileName || 'View document'}
          </a>
          <button type="button" onClick={() => onChange('')} className="p-1 text-slate-400 hover:text-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-dashed border-slate-300 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          {uploading ? 'Uploading...' : 'Choose Document'}
        </button>
      )}

      <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={handleFile} />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
