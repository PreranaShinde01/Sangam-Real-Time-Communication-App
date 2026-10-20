import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, Lock, ShieldCheck, X, Check, Loader2 } from 'lucide-react';
import { useRoomStore } from '../../store/useRoomStore';
import { ClientCrypto } from '../../lib/crypto';
import { SharedFileMetadata } from '@sangam/shared';

interface FilesPanelProps {
  onAnnounceFile: (metadata: SharedFileMetadata) => void;
  onClose: () => void;
}

export const FilesPanel: React.FC<FilesPanelProps> = ({ onAnnounceFile, onClose }) => {
  const { sharedFiles, roomId, roomCode, myParticipant } = useRoomStore();
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [decryptingFileId, setDecryptingFileId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !roomId || !roomCode) return;

    try {
      setIsEncrypting(true);
      setUploadProgress(10);

      // 1. Client-Side AES-256-GCM Encryption
      const { encryptedBlob, iv } = await ClientCrypto.encryptFile(file, roomCode);
      setUploadProgress(50);

      // 2. Upload Encrypted Ciphertext
      const formData = new FormData();
      formData.append('file', encryptedBlob, `${file.name}.enc`);
      formData.append('roomId', roomId);
      formData.append('iv', iv);
      formData.append('originalName', file.name);
      formData.append('mimeType', file.type);

      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('sangam_token') || ''}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      setUploadProgress(90);
      const fileRecord = await res.json();

      // 3. Broadcast Announcement over Socket.io
      onAnnounceFile(fileRecord);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 1000);
    } catch (err: any) {
      alert(`File upload failed: ${err.message}`);
    } finally {
      setIsEncrypting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadAndDecrypt = async (file: SharedFileMetadata) => {
    if (!roomCode) return;

    try {
      setDecryptingFileId(file.id);

      // 1. Fetch Encrypted Ciphertext
      const res = await fetch(file.downloadUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('sangam_token') || ''}`,
        },
      });

      if (!res.ok) throw new Error('Failed to download encrypted file');

      const encryptedBlob = await res.blob();
      const iv = res.headers.get('X-File-IV') || file.iv;

      // 2. Client-Side AES-256-GCM Decryption
      const decryptedBlob = await ClientCrypto.decryptFile(
        encryptedBlob,
        iv,
        roomCode,
        file.mimeType
      );

      // 3. Trigger Browser Save
      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err: any) {
      alert(`Decryption failed: ${err.message}`);
    } finally {
      setDecryptingFileId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-80 sm:w-96 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-30 shrink-0">
      {/* Header */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-bold text-slate-100 text-sm">Encrypted Files</h3>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Client-Side AES-256-GCM
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Upload Dropzone */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          disabled={isEncrypting}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isEncrypting}
          className="w-full py-4 px-3 border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-white transition-all group"
        >
          {isEncrypting ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-6 h-6 text-brand-400 animate-spin mb-2" />
              <span className="text-xs font-semibold text-slate-200">
                Encrypting with AES-256...
              </span>
              {uploadProgress !== null && (
                <div className="w-32 bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-brand-500 h-1.5 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 group-hover:scale-110 transition-transform mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Click to share an encrypted file
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                Files are encrypted before leaving your browser
              </span>
            </>
          )}
        </button>
      </div>

      {/* Shared Files List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {sharedFiles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
            <ShieldCheck className="w-8 h-8 mb-2 opacity-40 text-emerald-400" />
            <p>No files shared in this meeting yet.</p>
            <p className="mt-1">Files are securely destroyed when the meeting ends.</p>
          </div>
        ) : (
          sharedFiles.map((file) => {
            const isDownloading = decryptingFileId === file.id;
            return (
              <div
                key={file.id}
                className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-slate-200 truncate block">
                    {file.name}
                  </span>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{file.uploaderName}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadAndDecrypt(file)}
                  disabled={isDownloading}
                  title="Decrypt and Download"
                  className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white shrink-0 transition-colors"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
