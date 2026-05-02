import { logout } from '../firebase';

// SVG Icons
const HomeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>);
const ClipboardIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>);
const ChartIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>);
const SettingIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.754 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
const AcademicIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>);

const menuItems = [
  { name: 'Home', icon: <HomeIcon /> },
  { name: 'Assignment', icon: <ClipboardIcon /> },
  { name: 'Reporting', icon: <ChartIcon /> }
];

export default function MainLayout({ activeTab, setActiveTab, userName, currentRole, profileData, children }) {
  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar เมนูด้านซ้าย */}
      <aside className="w-64 bg-gradient-to-b from-white to-slate-50 shadow-xl flex flex-col z-20 border-r border-slate-200">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 font-bold text-xl text-slate-800 bg-gradient-to-r from-indigo-50 to-blue-50">
          <AcademicIcon /> <span className="ml-2">PerformTrack</span>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-2">
          {menuItems.map((item) => (
            <button key={item.name} onClick={() => setActiveTab(item.name)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 ${activeTab === item.name ? 'bg-white/70 border border-sky-200 text-slate-900 font-semibold shadow-sm' : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'}`}>
              {item.icon} {item.name}
            </button>
          ))}
        </nav>
        <div className="mt-auto p-4 border-t border-slate-200 bg-slate-50/50">
          <button onClick={() => setActiveTab('Settings')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 ${activeTab === 'Settings' ? 'bg-white/70 border border-sky-200 text-slate-900 font-semibold shadow-sm' : 'text-slate-600 hover:bg-white/40 hover:text-slate-900'}`}>
            <SettingIcon /> Settings
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full">
        {/* Header ด้านบน */}
        <header className="h-16 bg-white shadow-md flex items-center justify-between px-8 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">{activeTab}</h2>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{userName}</p>
              <p className="text-xs text-indigo-600 font-medium">{currentRole} {currentRole === 'STUDENT' ? ` - ${profileData.academicYear}` : ''}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center font-bold shadow-lg">{userName.charAt(0).toUpperCase()}</div>
            <button onClick={logout} className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors duration-200">Logout</button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
