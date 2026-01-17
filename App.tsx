
import React, { useState, useEffect } from 'react';
import { MovieInfo, GeneratedRecap, AppStatus, User } from './types';
import { generateMovieRecap } from './services/geminiService';

/** 
 * MANAGEMENT SECTION:
 * To authorize a user for specific devices:
 * 1. Ask the user for their "Device ID" (shown on the login screen).
 * 2. Add the username, password, and an ARRAY of deviceIds here.
 * You can add as many IDs as you like for a single user.
 */
const AUTHORIZED_USERS: Record<string, { pass: string; deviceIds: string[] }> = {
  'admin': { 
    pass: '0000', 
    deviceIds: ['TW96aWxsYS81LjAg', 'REVCVUctREVWSUNFLTI='] // Add multiple IDs in this array
  },
  'demo-user': {
    pass: 'moviepass123',
    deviceIds: [] // Leave empty to force them to send you their ID first
  }
};

const TONES = ['Dramatic', 'Humorous', 'Analytical', 'Fast-paced', 'Suspenseful', 'Witty'];
const LENGTHS = [
  { id: 'short', label: 'Quick (2 min read)' },
  { id: 'medium', label: 'Balanced (5 min read)' },
  { id: 'detailed', label: 'Deep Dive (10 min read)' }
];

// Helper to generate a hardware-based fingerprint
const getDeviceFingerprint = (): string => {
  const nav = window.navigator;
  const screen = window.screen;
  const idString = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!(window as any).chrome
  ].join('|');
  
  try {
    return btoa(idString).slice(0, 16);
  } catch (e) {
    return 'UNKNOWN-DEVICE';
  }
};

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState('');

  // App State
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [recap, setRecap] = useState<GeneratedRecap | null>(null);
  
  const [formData, setFormData] = useState<MovieInfo>({
    title: '',
    genre: '',
    director: '',
    keyPlotPoints: '',
    tone: 'Dramatic',
    includeSpoilers: false,
    length: 'medium'
  });

  // Check for device fingerprint and existing session
  useEffect(() => {
    const fingerprint = getDeviceFingerprint();
    setCurrentDeviceId(fingerprint);

    const savedUser = localStorage.getItem('cinerecap_user');
    if (savedUser) {
      const parsedUser: User = JSON.parse(savedUser);
      // Validate session matches current device
      if (parsedUser.deviceId === fingerprint) {
        setUser(parsedUser);
      } else {
        localStorage.removeItem('cinerecap_user');
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    const { username, password } = loginForm;
    const config = AUTHORIZED_USERS[username];
    
    if (!config || config.pass !== password) {
      setAuthError('Invalid username or password.');
      return;
    }

    // Check device lock - now checks if current ID is in the AUTHORIZED ARRAY
    if (!config.deviceIds.includes(currentDeviceId)) {
      setAuthError(`Unauthorized Device. Please provide this ID to the admin to add it to your account: ${currentDeviceId}`);
      return;
    }

    const newUser: User = { username, deviceId: currentDeviceId };
    setUser(newUser);
    localStorage.setItem('cinerecap_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    localStorage.removeItem('cinerecap_user');
    setUser(null);
    setRecap(null);
    setStatus(AppStatus.IDLE);
    setLoginForm({ username: '', password: '' });
  };

  const copyDeviceId = () => {
    navigator.clipboard.writeText(currentDeviceId);
    alert('Device ID copied! Send this to your administrator.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    setStatus(AppStatus.GENERATING);
    setError(null);

    try {
      const result = await generateMovieRecap(formData);
      setRecap(result);
      setStatus(AppStatus.COMPLETED);
    } catch (err: any) {
      setError(err.message || 'Failed to generate recap.');
      setStatus(AppStatus.ERROR);
    }
  };

  const resetForm = () => {
    setRecap(null);
    setStatus(AppStatus.IDLE);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full"></div>

        <div className="w-full max-w-md glass-panel rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 font-bold text-3xl mx-auto mb-4 shadow-lg shadow-amber-500/20">
              C
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">CineRecap AI</h1>
            <p className="text-slate-400">Multi-Device Access Control</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-medium leading-relaxed">
                {authError}
                {authError.includes('Unauthorized Device') && (
                   <button 
                    type="button"
                    onClick={copyDeviceId}
                    className="block mt-2 text-amber-500 font-bold underline hover:text-amber-400"
                   >
                     Copy Device ID
                   </button>
                )}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Username</label>
              <input 
                type="text"
                required
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-white"
                placeholder="Enter username"
                value={loginForm.username}
                onChange={e => setLoginForm({...loginForm, username: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Password</label>
              <input 
                type="password"
                required
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-white"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold py-4 rounded-xl transition-all shadow-lg shadow-amber-900/20 active:scale-[0.98]"
            >
              Verify Access
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col items-center gap-2">
            <span className="text-[10px] text-slate-600 uppercase tracking-widest">Current Device Identity</span>
            <code className="text-[10px] px-3 py-1 bg-slate-900 rounded-full text-slate-400 border border-slate-800 font-mono">
              {currentDeviceId}
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-amber-500/30 animate-in fade-in duration-700">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-slate-950 font-bold">C</div>
            <span className="text-xl font-display font-bold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">CineRecap AI</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pr-6 border-r border-slate-800">
               <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-xs font-bold text-slate-950 border border-amber-500/20">
                {user.username.charAt(0).toUpperCase()}
               </div>
               <span className="text-sm font-medium text-slate-300 hidden md:inline">{user.username}</span>
            </div>
            <button onClick={handleLogout} className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-red-400 transition-colors">Sign Out</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className={`lg:col-span-5 space-y-6 ${status === AppStatus.COMPLETED ? 'hidden lg:block opacity-50 pointer-events-none' : ''}`}>
            <div className="glass-panel rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-display font-bold mb-6 text-white">Movie Studio</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Movie Title</label>
                  <input type="text" required placeholder="e.g. Inception" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Genre" className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none" value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} />
                  <input type="text" placeholder="Director" className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none" value={formData.director} onChange={e => setFormData({...formData, director: e.target.value})} />
                </div>
                <textarea rows={4} placeholder="Plot points..." className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 resize-none focus:outline-none" value={formData.keyPlotPoints} onChange={e => setFormData({...formData, keyPlotPoints: e.target.value})} />
                <div className="flex items-center gap-4">
                    <select className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none appearance-none" value={formData.tone} onChange={e => setFormData({...formData, tone: e.target.value})}>
                        {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.includeSpoilers} onChange={e => setFormData({...formData, includeSpoilers: e.target.checked})} className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-amber-500" />
                        <span className="text-xs font-semibold">Spoilers</span>
                    </label>
                </div>
                <button type="submit" disabled={status === AppStatus.GENERATING} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold py-4 rounded-xl shadow-lg shadow-amber-900/20 active:scale-95 disabled:opacity-50">
                    {status === AppStatus.GENERATING ? 'Processing Film...' : 'Generate Recap'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7">
            {status === AppStatus.IDLE && (
              <div className="h-full flex flex-col items-center justify-center p-12 glass-panel rounded-2xl border-dashed border-slate-700">
                <p className="text-slate-500 text-center">Ready for your next review.<br/><span className="text-[10px] mt-2 block opacity-50">Active Session: {user.username}</span></p>
              </div>
            )}
            
            {status === AppStatus.COMPLETED && recap && (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <div className="space-y-4">
                    <h1 className="text-4xl font-display font-bold text-white underline decoration-amber-500/50">{formData.title}</h1>
                    <p className="text-2xl font-display italic text-slate-400 border-l-4 border-amber-500 pl-6 leading-relaxed">"{recap.tagline}"</p>
                 </div>
                 <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 text-slate-300 leading-relaxed text-lg whitespace-pre-wrap">
                    {recap.summary}
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-panel p-6 rounded-2xl">
                        <h4 className="font-bold text-amber-500 text-xs uppercase tracking-widest mb-4">Character Spotlight</h4>
                        <p className="text-sm text-slate-400">{recap.characterAnalysis}</p>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl">
                        <h4 className="font-bold text-amber-500 text-xs uppercase tracking-widest mb-4">Critical Verdict</h4>
                        <p className="text-sm text-white italic">{recap.verdict}</p>
                    </div>
                 </div>
                 <button onClick={resetForm} className="w-full py-4 border border-slate-800 rounded-xl hover:bg-slate-900 transition-colors text-sm font-bold uppercase tracking-widest">New Session</button>
               </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
