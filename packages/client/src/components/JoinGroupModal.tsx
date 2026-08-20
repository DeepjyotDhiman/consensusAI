import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinGroupModal({ isOpen, onClose }: JoinGroupModalProps) {
  const navigate = useNavigate();
  const [groupCode, setGroupCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = groupCode.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter a valid group code.');
      return;
    }

    console.log('[UI Click] Navigating directly to Join Group Code:', trimmed);
    setError(null);
    setGroupCode('');
    onClose();
    navigate(`/join/${trimmed}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white max-w-md w-full rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-5 relative text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-xs font-bold p-1 h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="space-y-1 border-b border-slate-100 pb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-extrabold uppercase tracking-wider">
            <span>⚡ Join Existing Project</span>
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">Enter Group Join Code</h3>
          <p className="text-xs text-slate-500 font-normal">
            Ask your teammate or project lead for the 6-character join code.
          </p>
        </div>

        {/* Validation Error */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Join Code Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
              Group Join Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              maxLength={12}
              className="enterprise-input font-mono text-center text-lg tracking-widest uppercase font-bold text-teal-900 placeholder:text-slate-400 placeholder:tracking-normal placeholder:text-xs"
              placeholder="Enter Code (e.g. HACK01)"
              value={groupCode}
              onChange={(e) => {
                setGroupCode(e.target.value);
                if (error) setError(null);
              }}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="enterprise-btn-secondary flex-1 py-2.5 text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="enterprise-btn-primary flex-1 py-2.5 text-xs font-bold cursor-pointer"
            >
              Join Project Group →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
