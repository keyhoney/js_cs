import React from 'react';
import { Home, Users, BarChart3, Settings, BookOpen, Lock } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAuthenticated: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, isAuthenticated }) => {
  const menuItems = [
    { id: 'dashboard', label: '홈 / 설정', icon: Home, locked: false },
    { id: 'students', label: '학생 관리', icon: Users, locked: !isAuthenticated },
    { id: 'counseling', label: '상담 분석', icon: BarChart3, locked: !isAuthenticated },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="text-blue-500" />
            정시 상담 <span className="text-blue-500">2026</span>
          </h1>
          <p className="text-xs text-slate-500 mt-2">Last Updated: 2025.12.19.</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => !item.locked && onTabChange(item.id)}
              disabled={item.locked}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : item.locked 
                    ? 'text-slate-600 cursor-not-allowed bg-slate-800/30' 
                    : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.locked && <Lock size={14} className="text-slate-500" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 text-xs text-center text-slate-500">
          &copy; KeyHoney Counseling Lab<br/>
          Data stored locally
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;