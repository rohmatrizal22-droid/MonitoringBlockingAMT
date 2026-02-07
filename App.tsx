import React, { useState } from 'react';
import { ViewMode } from './components/ViewMode';
import { AdminPanel } from './components/AdminPanel';

function App() {
  const [appState, setAppState] = useState<'LANDING' | 'VIEW' | 'ADMIN'>('LANDING');
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'EPN' && (password === '12345' || password === '12345.')) {
      setAppState('ADMIN');
      setLoginError('');
    } else {
      setLoginError('Invalid Credentials');
    }
  };

  const handleLogout = () => {
    setAppState('LANDING');
    setUsername('');
    setPassword('');
    setLoginError('');
  };

  const handleGoHome = () => {
    setAppState('LANDING');
  };

  // --- LANDING PAGE COMPONENT ---
  if (appState === 'LANDING') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 font-sans relative bg-slate-900 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "url('./background.jpg')" 
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-slate-900/90 backdrop-blur-sm"></div>

        <div className="relative z-10 bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-w-5xl w-full min-h-[500px] md:min-h-[600px] border border-white/10">
          
          {/* LEFT SIDE: HERO & VIEW MODE */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col items-center justify-center text-center bg-slate-50 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-red-600 to-orange-500"></div>
            
            <div className="mb-6 md:mb-10 relative z-10">
               <div className="h-20 md:h-28 w-auto mb-4 md:mb-6 flex flex-col items-center justify-center">
                 <img 
                    src="./logo.png" 
                    alt="Logo Elnusa Petrofin" 
                    className="h-full w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                 />
                 {/* Fallback Text */}
                 <div className="text-2xl md:text-3xl font-bold text-slate-800 hidden peer-[:hidden]:block tracking-tight">
                   elnusa <span className="text-red-600">petrofin</span>
                 </div>
               </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-2 md:mb-3 tracking-tight">
              Sistem Monitoring AMT
            </h1>
            <p className="text-sm md:text-base text-slate-500 mb-8 md:mb-12 max-w-xs font-medium leading-relaxed">
              Platform terintegrasi untuk pemantauan pelanggaran, blokir, dan pembinaan Awak Mobil Tangki.
            </p>

            <button 
              onClick={() => setAppState('VIEW')}
              className="group relative w-full max-w-xs bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 md:py-4 px-8 rounded-xl shadow-xl transition-all transform hover:-translate-y-1 overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-3 text-sm md:text-base">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                AKSES DASHBOARD
              </span>
              <div className="absolute inset-0 h-full w-full scale-0 rounded-xl transition-all duration-300 group-hover:scale-100 group-hover:bg-blue-800/50"></div>
            </button>

            <div className="mt-auto pt-6 md:pt-10">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Secure System v1.0
                </div>
            </div>
          </div>

          {/* RIGHT SIDE: ADMIN LOGIN */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white relative">
            <div className="max-w-sm mx-auto w-full">
              <div className="mb-6 md:mb-8">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900">Login Administrator</h2>
                  <p className="text-xs md:text-sm text-slate-500 mt-1">Masuk untuk mengelola data pelanggaran.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4 md:space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username ID</label>
                  <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-10 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-blue-800 block p-3 md:p-3.5 transition-all outline-none"
                        placeholder="EPN-XXX"
                      />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                  <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </div>
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-800 focus:border-blue-800 block p-3 md:p-3.5 transition-all outline-none"
                        placeholder="••••••••"
                      />
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 text-xs md:text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg animate-shake flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {loginError}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-200 font-bold rounded-lg text-sm px-5 py-3 md:py-4 text-center transition-all shadow-lg transform hover:-translate-y-0.5 mt-4"
                >
                  MASUK SYSTEM
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP LAYOUT (VIEW OR ADMIN) ---
  return (
    <div className="min-h-screen font-sans bg-slate-50 flex flex-col">
      {/* Top Navigation - Corporate Style */}
      {appState === 'VIEW' && (
          <header className="bg-white shadow-sm border-b border-blue-900/10 sticky top-0 z-40">
            <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-14 md:h-18 flex justify-between items-center py-2 md:py-3">
              <div className="flex items-center cursor-pointer gap-3 md:gap-4 group" onClick={handleGoHome}>
                <div className="h-8 md:h-10 w-auto">
                    <img 
                        src="./logo.png" 
                        alt="Logo" 
                        className="h-full w-auto object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                    />
                    <div className="text-xl md:text-2xl font-bold text-slate-800 hidden peer-[:hidden]:block group-hover:scale-105 transition-transform">
                        elnusa <span className="text-red-600">petrofin</span>
                    </div>
                </div>
                <div className="hidden md:flex flex-col border-l border-slate-300 pl-4 h-8 justify-center">
                    <span className="font-bold text-sm text-slate-700 tracking-tight leading-none">MONITORING AMT</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest leading-none mt-1">Dashboard Publik</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 md:gap-4">
                  <button 
                    onClick={handleGoHome}
                    className="text-xs md:text-sm font-bold text-slate-500 hover:text-blue-800 transition-colors flex items-center gap-2 px-2 md:px-4 py-2 hover:bg-slate-50 rounded-lg"
                  >
                    <svg className="w-4 h-4 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    Home
                  </button>
                  <div className="h-6 md:h-8 w-[1px] bg-slate-200"></div>
                  <button onClick={() => setAppState('LANDING')} className="bg-blue-900 text-white text-xs md:text-sm font-bold px-3 py-1.5 md:px-5 md:py-2 rounded-lg hover:bg-blue-800 shadow-md transition-all">
                      Login Admin
                  </button>
              </div>
            </div>
          </header>
      )}

      {/* Main Body */}
      <main className="flex-1">
        {appState === 'VIEW' && <ViewMode />}
        {appState === 'ADMIN' && <AdminPanel />}
      </main>
    </div>
  );
}

export default App;