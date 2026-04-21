import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  GraduationCap, 
  Bell, 
  Search,
  Settings,
  ChevronRight
} from 'lucide-react';
import { UserProfile } from '../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  user: UserProfile;
  currentPage: string;
  onNavigate: (page: 'dashboard' | 'users' | 'meeting') => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function Layout({ user, currentPage, onNavigate, onLogout, children }: LayoutProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Cuộc họp', icon: LayoutDashboard },
    ...(user.position === 'admin' ? [{ id: 'users', label: 'Thành viên', icon: Users }] : []),
  ];

  const getPositionLabel = (pos: string) => {
    switch (pos) {
      case 'admin': return 'QTV';
      case 'principal': return 'Hiệu trưởng';
      case 'vice_principal': return 'Phó hiệu trưởng';
      case 'teacher': return 'Giáo viên';
      case 'staff': return 'Nhân viên';
      default: return 'Khách';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'chairperson': return 'Chủ tọa';
      case 'secretary': return 'Thư ký';
      case 'member': return 'Thành viên';
      default: return 'Khác';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm z-20 no-print">
        <div className="p-8 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
            <GraduationCap size={28} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-slate-800 tracking-tight leading-tight">M-Meeting</h1>
              <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[8px] font-black uppercase tracking-tighter">V2.0</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Paperless System</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                currentPage === item.id 
                  ? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-100" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                currentPage === item.id ? "text-blue-600" : "text-slate-400"
              )} />
              {item.label}
              {currentPage === item.id && (
                <ChevronRight className="ml-auto h-4 w-4" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border-2 border-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">{getPositionLabel(user.position)}</span>
                  <span className="text-[9px] font-black bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase">{getRoleLabel(user.role)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-100 shadow-sm"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 print:p-0">
        <header className="h-20 bg-white/80 backdrop-blur-md border-bottom border-slate-200 flex items-center justify-between px-8 z-10 no-print">
          <div className="flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-2xl w-96 border border-slate-200/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <Search className="text-slate-400 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Tìm kiếm cuộc họp, hồ sơ..." 
              className="bg-transparent border-none outline-none text-sm w-full font-medium text-slate-600 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <Bell size={20} />
            </button>
            <button className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar print:overflow-visible print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
