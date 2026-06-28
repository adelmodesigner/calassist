import { useState } from 'react';
import { Calendar, MessageSquare, Bell, ChevronRight, WifiOff, Wifi } from 'lucide-react';

function SettingsGroup({ title, children }) {
  return (
    <div className="mb-5">
      {title && (
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-1 mb-2">{title}</p>
      )}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-50">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ icon, label, children, subtext }) {
  return (
    <div className="flex items-center px-4 py-3.5 gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-violet-600' : 'bg-gray-200'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

export default function Profile() {
  const [whatsappConnected, setWhatsappConnected] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-5">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

        {/* Avatar row */}
        <div className="flex items-center gap-3 mt-4">
          <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xl">
            A
          </div>
          <div>
            <p className="font-semibold text-gray-900">Adelmo</p>
            <p className="text-xs text-gray-400">adelmocontato@gmail.com</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <SettingsGroup title="Integrations">
          <SettingsRow
            icon={<Calendar size={16} />}
            label="Google Calendar"
            subtext="adelmocontato@gmail.com"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-green-600">Connected</span>
            </div>
          </SettingsRow>

          <SettingsRow
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.528 5.845L0 24l6.335-1.508A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.812 9.812 0 01-5.003-1.37l-.36-.214-3.732.889.918-3.636-.235-.374A9.815 9.815 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z" />
              </svg>
            }
            label="WhatsApp Bridge"
            subtext={whatsappConnected ? 'Receiving messages' : 'Bridge offline'}
          >
            <button
              onClick={() => setWhatsappConnected(c => !c)}
              className="flex items-center gap-1.5"
            >
              {whatsappConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-medium text-green-600">Healthy</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-xs font-medium text-red-500">Disconnected</span>
                </>
              )}
              <ChevronRight size={14} className="text-gray-300 ml-0.5" />
            </button>
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="Preferences">
          <SettingsRow
            icon={<Bell size={16} />}
            label="Notifications"
            subtext={notificationsEnabled ? 'Drafts and approvals' : 'Off'}
          >
            <Toggle value={notificationsEnabled} onChange={setNotificationsEnabled} />
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="About">
          <SettingsRow
            icon={<span className="text-xs font-bold text-gray-400">v</span>}
            label="App version"
            subtext="Prototype build"
          >
            <span className="text-xs text-gray-400">0.1.0</span>
          </SettingsRow>
        </SettingsGroup>

        {/* WhatsApp status banner */}
        {!whatsappConnected && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3.5 flex items-start gap-3">
            <WifiOff size={16} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700">WhatsApp bridge offline</p>
              <p className="text-xs text-red-400 mt-0.5">Messages won't be captured until reconnected. Tap the bridge row above to toggle.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
