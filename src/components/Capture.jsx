import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import { MessageSquare, Image, Mic, Send, Upload, Square, Check, AlertCircle } from 'lucide-react';

const TABS = [
  { id: 'text', label: 'Text', icon: <MessageSquare size={16} /> },
  { id: 'image', label: 'Image', icon: <Image size={16} /> },
  { id: 'audio', label: 'Audio', icon: <Mic size={16} /> },
];

export default function Capture() {
  const { fetchEvents } = useApp();
  const [tab, setTab] = useState('text');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [imageName, setImageName] = useState(null);
  const timerRef = useRef(null);
  const fileRef = useRef(null);

  function resetStatus() { setDone(false); setErr(null); }

  async function withLoading(fn) {
    setLoading(true); setErr(null); setDone(false);
    try {
      await fn();
      setDone(true);
      await fetchEvents();
      setTimeout(() => setDone(false), 2500);
    } catch (e) {
      setErr(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleTextSubmit() {
    if (!text.trim() || loading) return;
    await withLoading(async () => {
      await api.captureText(text);
      setText('');
    });
  }

  async function handleFileSelect(file) {
    if (!file || loading) return;
    setImageName(file.name);
    await withLoading(async () => {
      await api.captureImage(file);
      setImageName(null);
      if (fileRef.current) fileRef.current.value = '';
    });
  }

  function toggleRecord() {
    if (loading) return;
    if (recording) {
      clearInterval(timerRef.current);
      const secs = recordSeconds;
      setRecording(false);
      setRecordSeconds(0);
      const duration = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
      withLoading(() => api.captureAudio(duration));
    } else {
      setRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    }
  }

  const recordDisplay = `${Math.floor(recordSeconds / 60)}:${String(recordSeconds % 60).padStart(2, '0')}`;

  const statusNode = err ? (
    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">
      <AlertCircle size={14} /> {err}
    </div>
  ) : done ? (
    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-xl">
      <Check size={14} /> Draft created — check Home
    </div>
  ) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Capture</h1>
        <p className="text-sm text-gray-400 mt-0.5">Paste text, upload a flyer, or record a note</p>
      </div>

      {/* Tab switcher */}
      <div className="px-5 mb-5">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); resetStatus(); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 flex-1 flex flex-col gap-3">
        {/* Status banner */}
        {statusNode}

        {/* Text panel */}
        {tab === 'text' && (
          <div className="space-y-3 flex-1 flex flex-col">
            <textarea
              className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none leading-relaxed"
              placeholder="Paste an invite, event description, or any text with event details…"
              value={text}
              onChange={e => setText(e.target.value)}
              disabled={loading}
            />
            <button
              onClick={handleTextSubmit}
              disabled={!text.trim() || loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-violet-700 transition"
            >
              {loading
                ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Extracting…</>
                : <><Send size={16} /> Extract event</>}
            </button>
          </div>
        )}

        {/* Image panel */}
        {tab === 'image' && (
          <div
            className="border-2 border-dashed border-gray-200 bg-white rounded-2xl flex flex-col items-center justify-center text-center py-12 px-6 cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 transition flex-1"
            onDrop={e => { e.preventDefault(); handleFileSelect(e.dataTransfer.files?.[0]); }}
            onDragOver={e => e.preventDefault()}
            onClick={() => !loading && fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={e => handleFileSelect(e.target.files?.[0])}
            />
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <span className="animate-spin w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full inline-block" />
                <p className="text-sm font-medium text-violet-600">Reading image with Claude…</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                  <Upload size={22} className="text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  {imageName ?? 'Tap to upload or drop here'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Flyer, screenshot, or any event image</p>
              </>
            )}
          </div>
        )}

        {/* Audio panel */}
        {tab === 'audio' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <button
                onClick={toggleRecord}
                disabled={loading}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  recording ? 'bg-red-500 hover:bg-red-600 scale-110'
                  : loading ? 'bg-gray-200'
                  : 'bg-violet-600 hover:bg-violet-700'
                }`}
              >
                {loading
                  ? <span className="animate-spin w-7 h-7 border-2 border-white border-t-transparent rounded-full inline-block" />
                  : recording
                  ? <Square size={28} className="text-white fill-white" />
                  : <Mic size={32} className="text-white" />}
              </button>
              {recording && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />}
            </div>
            <div className="text-center">
              {loading ? (
                <p className="text-sm font-medium text-violet-600">Creating voice note draft…</p>
              ) : recording ? (
                <>
                  <p className="text-2xl font-mono font-bold text-gray-900">{recordDisplay}</p>
                  <p className="text-xs text-gray-400 mt-1">Recording… tap to stop</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">Tap to start recording</p>
                  <p className="text-xs text-gray-400 mt-0.5">Voice notes need manual review</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
