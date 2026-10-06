import { useState, useRef } from 'react';
import { Paperclip, FileText, Image as ImageIcon, Video, Trash2, Plus, Link as LinkIcon } from 'lucide-react';
import Button from '../../../components/UI/button.jsx';
import toast from 'react-hot-toast';

export default function MediaAttachmentManager({ mediaFiles = [], onChange }) {
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlName, setUrlName] = useState('');
  const [urlType, setUrlType] = useState('image');
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newAttachments = files.map((file) => {
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      const fileType = isImg ? 'image' : isVid ? 'video' : 'document';

      return {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: file.name,
        type: fileType,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        url: URL.createObjectURL(file), // Local preview blob
      };
    });

    onChange([...mediaFiles, ...newAttachments]);
    toast.success(`Attached ${files.length} file(s)`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddUrl = () => {
    if (mediaFiles.length) {
      toast.error('Send one media URL per message');
      return;
    }
    if (!urlInput.trim().startsWith('https://')) {
      toast.error('Please enter a valid media URL');
      return;
    }
    const newMedia = {
      id: `url_${Date.now()}`,
      name: urlName.trim() || urlInput.split('/').pop() || 'Remote Attachment',
      type: urlType,
      size: 'Remote file',
      url: urlInput.trim(),
    };
    onChange([...mediaFiles, newMedia]);
    setUrlInput('');
    setUrlName('');
    setShowUrlModal(false);
    toast.success('Media URL attached');
  };

  const removeMedia = (index) => {
    onChange(mediaFiles.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <Paperclip className="h-4 w-4 text-primary-600" />
            <span>Public Media URL</span>
            {mediaFiles.length > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800">
                {mediaFiles.length} File{mediaFiles.length > 1 ? 's' : ''} Attached
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500">
            Send one public HTTPS image, video or document URL per message. Local uploads are not supported
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*,.pdf,.doc,.docx,.xlsx,.mp4"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled title="Use Add Media URL; local upload is not supported"
          >
            <Paperclip className="mr-1.5 h-3.5 w-3.5" />
            Upload Files
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowUrlModal(!showUrlModal)}
          >
            <LinkIcon className="mr-1.5 h-3.5 w-3.5" />
            Add Media URL
          </Button>
        </div>
      </div>

      {showUrlModal && (
        <div className="rounded-lg border border-primary-200 bg-primary-50/50 p-3 space-y-2 text-xs">
          <p className="font-semibold text-primary-900">Attach Public Media URL (Image, PDF, Video):</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Display Name (e.g. Brochure.pdf)"
              value={urlName}
              onChange={(e) => setUrlName(e.target.value)}
              className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs"
            />
            <input
              type="url"
              placeholder="https://example.com/catalog.pdf"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs"
            />
            <select
              value={urlType}
              onChange={(e) => setUrlType(e.target.value)}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
            >
              <option value="image">Image (JPEG/PNG)</option>
              <option value="document">Document (PDF/Catalog)</option>
              <option value="video">Video (MP4)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => setShowUrlModal(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddUrl}>
              Add Attachment
            </Button>
          </div>
        </div>
      )}

      {mediaFiles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {mediaFiles.map((file, idx) => (
            <div
              key={file.id || idx}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-2.5 shadow-xs"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  {file.type === 'image' ? (
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                  ) : file.type === 'video' ? (
                    <Video className="h-4 w-4 text-purple-600" />
                  ) : (
                    <FileText className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="truncate">
                  <p className="truncate text-xs font-medium text-gray-800" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[10px] text-gray-400 capitalize">
                    {file.type} {file.size ? `• ${file.size}` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeMedia(idx)}
                className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                title="Remove attachment"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">No files attached yet. You can attach multiple images, PDFs, or catalogs.</p>
      )}
    </div>
  );
}
