import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CalendarDays, MapPin, Clock, MessageSquare, Image, Mic, Check, X, Pencil,
} from 'lucide-react';

const SOURCE_ICONS = {
  text: <MessageSquare size={12} />,
  image: <Image size={12} />,
  audio: <Mic size={12} />,
  whatsapp: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.528 5.845L0 24l6.335-1.508A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.812 9.812 0 01-5.003-1.37l-.36-.214-3.732.889.918-3.636-.235-.374A9.815 9.815 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z" />
    </svg>
  ),
};

const SOURCE_LABEL = { text: 'Text', image: 'Image', audio: 'Audio', whatsapp: 'WhatsApp' };

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function EventModal({ event, onClose }) {
  const { approveEvent, rejectEvent, updateEvent } = useApp();
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState({
    title: event.title,
    date: event.date,
    time: event.time,
    location: event.location,
    description: event.description,
  });
  const [approving, setApproving] = useState(false);
  const [warning, setWarning] = useState(null);
  const [calLink, setCalLink] = useState(null);

  // Require at least a date before allowing approval
  const effectiveDate = editing ? fields.date : event.date;
  const canApprove = !!effectiveDate?.trim();
  const isPastDate = effectiveDate && new Date(`${effectiveDate}T00:00:00`) < new Date(new Date().toDateString());

  async function handleApprove() {
    if (!canApprove || approving) return;
    setApproving(true);
    setWarning(null);
    try {
      if (editing) await updateEvent(event.id, fields);
      const result = await approveEvent(event.id);
      if (result?.warning) {
        const isAuthErr = result.warning.includes('not_authenticated');
        setWarning(
          isAuthErr
            ? 'Saved locally, but not synced to Google Calendar — please sign in again.'
            : `Saved locally, but calendar sync failed: ${result.warning.replace('Calendar sync failed: ', '')}`
        );
      } else {
        if (result?.htmlLink) setCalLink(result.htmlLink);
        else onClose();
      }
    } catch (err) {
      setWarning('Approval failed: ' + (err.message || 'Unknown error'));
    } finally {
      setApproving(false);
    }
  }

  function handleReject() {
    rejectEvent(event.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div
        className="w-full max-w-sm bg-white rounded-t-2xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '90svh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            Needs review
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Source badge */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="text-gray-400">{SOURCE_ICONS[event.source]}</span>
            Source: {SOURCE_LABEL[event.source]}
          </div>

          {/* Audio-only path */}
          {event.source === 'audio' && !editing ? (
            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
              <Mic size={18} className="text-violet-500" />
              <div>
                <p className="text-sm font-medium text-gray-800">Voice note attached</p>
                <p className="text-xs text-gray-500">Duration: {event.voiceDuration} · No auto-transcription</p>
              </div>
            </div>
          ) : null}

          {/* Fields */}
          {editing ? (
            <div className="space-y-3">
              {[
                { label: 'Title', key: 'title', type: 'text' },
                { label: 'Date', key: 'date', type: 'date' },
                { label: 'Time', key: 'time', type: 'time' },
                { label: 'Location', key: 'location', type: 'text' },
                { label: 'Description', key: 'description', type: 'textarea' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                  {type === 'textarea' ? (
                    <textarea
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
                      rows={3}
                      value={fields[key]}
                      onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
                    />
                  ) : (
                    <input
                      type={type}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-300"
                      value={fields[key]}
                      onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              <h2 className="text-lg font-semibold text-gray-900 leading-snug">{event.title || '(No title)'}</h2>
              {event.date && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarDays size={14} className="text-gray-400" />
                  {formatDate(event.date)}{event.time ? ` · ${event.time}` : ''}
                </div>
              )}
              {isPastDate && !editing && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                  ⚠️ This date is in the past — check the year before approving. Tap Edit to fix it.
                </div>
              )}
              {event.location && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  {event.location}
                </div>
              )}
              {event.description && (
                <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
              )}
              {!event.title && !event.date && !event.description && (
                <p className="text-sm text-gray-400 italic">No fields extracted — manual entry needed.</p>
              )}
            </div>
          )}
        </div>

        {/* Calendar sync success */}
        {calLink && (
          <div className="mx-5 mb-3 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 leading-relaxed">
            ✅ Added to Google Calendar on {formatDate(event.date)}{event.time ? ` at ${event.time}` : ''}.
            <a href={calLink} target="_blank" rel="noreferrer" className="block mt-1.5 font-semibold text-violet-600 underline">
              Open in Google Calendar →
            </a>
            <button onClick={onClose} className="block mt-1.5 text-gray-500 underline">Close</button>
          </div>
        )}

        {/* Calendar sync warning */}
        {warning && (
          <div className="mx-5 mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
            ⚠️ {warning}
            {warning.includes('sign in') && (
              <a href="/api/auth/google" className="block mt-1.5 font-semibold text-violet-600 underline">
                Sign in with Google →
              </a>
            )}
            <button onClick={onClose} className="block mt-1.5 text-gray-500 underline">Close</button>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 pb-6 pt-2 flex gap-2">
          <button
            onClick={handleReject}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition"
          >
            <X size={15} /> Reject
          </button>
          <button
            onClick={() => setEditing(e => !e)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
          >
            <Pencil size={15} /> {editing ? 'Preview' : 'Edit'}
          </button>
          <button
            onClick={handleApprove}
            disabled={!canApprove || approving}
            title={!canApprove ? 'Edit the event to add a date first' : undefined}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {approving
              ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Syncing…</>
              : <><Check size={15} /> Approve</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function PendingCard({ event, onTap }) {
  return (
    <button
      onClick={onTap}
      className="w-full text-left bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-amber-100 flex items-start gap-3"
    >
      <div className="mt-0.5 w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
        <span className="text-amber-500">{SOURCE_ICONS[event.source]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
            Needs review
          </span>
          <span className="text-[10px] text-gray-400">{SOURCE_LABEL[event.source]}</span>
        </div>
        <p className="text-sm font-semibold text-gray-900 truncate">
          {event.title || (event.source === 'audio' ? '🎤 Voice note' : '(Untitled draft)')}
        </p>
        {event.date ? (
          <p className="text-xs text-gray-500 mt-0.5">{formatDate(event.date)}{event.time ? ` · ${event.time}` : ''}</p>
        ) : (
          <p className="text-xs text-gray-400 mt-0.5 italic">Date not extracted</p>
        )}
      </div>
      <div className="text-gray-300 text-lg mt-0.5">›</div>
    </button>
  );
}

function ApprovedCard({ event }) {
  const today = new Date('2026-06-27');
  const eventDate = new Date(`${event.date}T${event.time || '00:00'}`);
  const diffDays = Math.ceil((eventDate - today) / 86400000);
  const soon = diffDays >= 0 && diffDays <= 2;

  return (
    <div className="bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100 flex items-start gap-3">
      <div className="mt-0.5 shrink-0 flex flex-col items-center w-10">
        <span className="text-[10px] font-bold text-violet-500 uppercase leading-none">
          {new Date(`${event.date}T00:00:00`).toLocaleDateString('en-GB', { month: 'short' })}
        </span>
        <span className="text-xl font-bold text-gray-900 leading-none">
          {new Date(`${event.date}T00:00:00`).getDate()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {soon && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full">
              Soon
            </span>
          )}
          <span className="text-[10px] text-gray-400">{SOURCE_LABEL[event.source]}</span>
        </div>
        <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {event.time && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={10} /> {event.time}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1 text-xs text-gray-500 truncate">
              <MapPin size={10} /> {event.location.split(',')[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { pending, approved } = useApp();
  const [selectedDraft, setSelectedDraft] = useState(null);

  // Merge pending + approved into a single sorted list
  // Pending items sort by createdAt descending (newest first), approved by event date ascending
  const allItems = [
    ...pending.map(e => ({ ...e, _sortKey: new Date(e.createdAt).getTime() * -1 })),
    ...approved.map(e => ({ ...e, _sortKey: new Date(`${e.date}T${e.time || '00:00'}`).getTime() })),
  ].sort((a, b) => {
    // Pending always floats to top
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return 1;
    return a._sortKey - b._sortKey;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-3">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Saturday, 27 Jun</p>
        <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
      </div>

      {/* Summary chips */}
      {pending.length > 0 && (
        <div className="px-5 mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {pending.length} pending review
          </span>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2.5">
        {allItems.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            No events yet. Capture something!
          </div>
        )}
        {allItems.map(event =>
          event.status === 'pending' ? (
            <PendingCard key={event.id} event={event} onTap={() => setSelectedDraft(event)} />
          ) : (
            <ApprovedCard key={event.id} event={event} />
          )
        )}
      </div>

      {selectedDraft && (
        <EventModal event={selectedDraft} onClose={() => setSelectedDraft(null)} />
      )}
    </div>
  );
}
