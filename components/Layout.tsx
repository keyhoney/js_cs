import React from 'react';
import { Home, Users, BarChart3, History, TrendingUp, BookOpen } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'dashboard', label: '홈 / 설정', icon: Home },
    { id: 'students', label: '학생 관리', icon: Users },
    { id: 'counseling', label: '상담 분석', icon: BarChart3 },
    { id: 'analytics', label: '통계 분석', icon: TrendingUp },
    { id: 'history', label: '상담 이력', icon: History },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-slate-300 flex flex-col shadow-strong z-20 border-r border-slate-700">
        <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
              <BookOpen className="text-white" size={20} />
            </div>
            <span>정시 상담</span>
            <span className="text-blue-400">2025</span>
          </h1>
          <p className="text-xs text-slate-400 mt-2 font-medium">Professional Counseling System</p>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/30 scale-[1.02]'
                  : 'hover:bg-slate-800/50 hover:text-white hover:translate-x-1'
              }`}
            >
              <item.icon 
                size={20} 
                className={`transition-transform ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} 
              />
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700/50 text-xs text-center text-slate-400 bg-slate-900/50">
          <p className="font-medium">&copy; 2025 Counseling Lab</p>
          <p className="text-slate-500 mt-1">Data stored locally</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
