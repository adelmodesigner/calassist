import { useState, useEffect } from 'react';
import { Home as HomeIcon, Camera, BarChart2, User } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import Home from './components/Home';
import Capture from './components/Capture';
import Reports from './components/Reports';
import Profile from './components/Profile';

const TABS = [
  { id: 'home',    label: 'Home',    icon: HomeIcon, component: Home },
  { id: 'capture', label: 'Capture', icon: Camera,   component: Capture },
  { id: 'reports', label: 'Reports', icon: BarChart2, component: Reports },
  { id: 'profile', label: 'Profile', icon: User,      component: Profile },
];

// ── Shared: bottom tab bar ────────────────────────────────────────────────────

function TabBar({ active, onSelect, withSafeArea = false }) {
  const { pending } = useApp();
  return (
    <div
      className="flex border-t border-gray-100 bg-white/95 backdrop-blur-sm shrink-0"
      style={withSafeArea ? { paddingBottom: 'env(safe-area-inset-bottom)' } : undefined}
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        const badge = id === 'home' && pending.length > 0;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5"
          >
            <div className="relative">
              <Icon
                size={22}
                className={isActive ? 'text-violet-600' : 'text-gray-400'}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              {badge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                  {pending.length}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-medium ${isActive ? 'text-violet-600' : 'text-gray-400'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Shared: Google sign-in gate ───────────────────────────────────────────────

function AuthGate({ children }) {
  const [authed, setAuthed] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tok = params.get('token');
    if (tok) {
      localStorage.setItem('auth_token', tok);
      window.history.replaceState({}, '', '/');
    }
    setAuthed(!!(tok || localStorage.getItem('auth_token')));
  }, []);

  if (authed === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin inline-block" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center text-3xl">📅</div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Connect your calendar</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Sign in with Google to sync your calendar and start capturing events.
          </p>
        </div>
        <a
          href="/api/auth/google"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm hover:shadow-md transition text-sm font-medium text-gray-800"
        >
          <GoogleLogo />
          Sign in with Google
        </a>
      </div>
    );
  }

  return <AppProvider>{children}</AppProvider>;
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

// ── Mobile: full-screen, respects notch + home bar ────────────────────────────

function MobileApp() {
  const [activeTab, setActiveTab] = useState('home');
  const Screen = TABS.find(t => t.id === activeTab).component;

  return (
    <div
      className="flex flex-col w-full bg-gray-50"
      style={{
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <AuthGate>
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Screen />
        </div>
        <TabBar active={activeTab} onSelect={setActiveTab} withSafeArea />
      </AuthGate>
    </div>
  );
}

// ── Desktop: centered phone-frame mockup ──────────────────────────────────────

function DesktopPreview() {
  const [activeTab, setActiveTab] = useState('home');
  const Screen = TABS.find(t => t.id === activeTab).component;

  return (
    <div
      className="relative bg-gray-50 rounded-[40px] overflow-hidden flex flex-col"
      style={{
        width: 390,
        height: 'min(844px, calc(100dvh - 32px))',
        boxShadow: '0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
      }}
    >
      {/* Fake status bar */}
      <div className="flex items-center justify-between px-7 pt-4 pb-1 shrink-0 bg-gray-50">
        <span className="text-xs font-semibold text-gray-900">9:41</span>
        <div className="flex items-center gap-1.5">
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <rect x="0" y="3" width="3" height="9" rx="1" fill="#111"/>
            <rect x="4.5" y="2" width="3" height="10" rx="1" fill="#111"/>
            <rect x="9" y="0" width="3" height="12" rx="1" fill="#111"/>
            <rect x="13.5" y="0" width="2.5" height="12" rx="1" fill="#111" opacity=".3"/>
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <path d="M8 2.5C10.5 2.5 12.7 3.6 14.2 5.3L15.5 4C13.6 1.9 11 .7 8 .7s-5.6 1.2-7.5 3.3L1.8 5.3C3.3 3.6 5.5 2.5 8 2.5z" fill="#111"/>
            <path d="M8 5.5c1.6 0 3 .7 4 1.8l1.3-1.3A7.3 7.3 0 008 3.7a7.3 7.3 0 00-5.3 2.3L4 7.3A5 5 0 018 5.5z" fill="#111"/>
            <circle cx="8" cy="11" r="1.5" fill="#111"/>
          </svg>
          <div className="w-5 h-2.5 border border-gray-800 rounded-sm relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-gray-900 rounded-sm" style={{ width: '80%' }}/>
          </div>
        </div>
      </div>

      {/* Dynamic island */}
      <div className="flex justify-center pb-2 shrink-0 bg-gray-50">
        <div className="w-28 h-7 bg-black rounded-full"/>
      </div>

      {/* Screen content */}
      <AuthGate>
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Screen />
        </div>
        <TabBar active={activeTab} onSelect={setActiveTab} />
      </AuthGate>

      {/* Home indicator */}
      <div className="flex justify-center pb-2 pt-1 bg-white shrink-0">
        <div className="w-32 h-1 bg-gray-900 rounded-full opacity-20"/>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth <= 480);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 480px)');
    const handler = e => setMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return mobile;
}

export default function App() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileApp /> : <DesktopPreview />;
}
