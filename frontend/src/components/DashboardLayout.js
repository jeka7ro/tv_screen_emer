import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Monitor,
  MapPin,
  Tv,
  FileImage,
  ShoppingBag,
  Menu,
  List,
  Shuffle,
  LayoutDashboard,
  LogOut,
  UserPlus,
  Users,
  Shield,
  Eye,
  Music,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/live-preview', icon: Eye, label: 'Live Preview' },
  { path: '/locations', icon: MapPin, label: 'Locații' },
  { path: '/screens', icon: Tv, label: 'Ecrane' },
  { path: '/content', icon: FileImage, label: 'Conținut' },
  { path: '/screen-sync', icon: Shuffle, label: 'Sincronizare' },
  { path: '/happy-hour', icon: ChevronRight, label: 'Happy Hour' },
  { path: '/playlists', icon: List, label: 'Playlist-uri' },
  { path: '/products', icon: ShoppingBag, label: 'Produse' },
  { path: '/digital-menus', icon: Menu, label: 'Meniuri Digitale' },
  { path: '/audio', icon: Music, label: 'Muzică & Reclame' },
  { path: '/brands', icon: List, label: 'Brandurile noastre' },
];

const adminMenuItems = [
  { path: '/users', icon: Users, label: 'Utilizatori' },
  { path: '/invitations', icon: UserPlus, label: 'Invitații' },
];

export const DashboardLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isSuperAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState.toString());
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} h-screen fixed left-0 top-0 glass-panel z-50 flex flex-col transition-all duration-300 ease-in-out`} data-testid="sidebar">
        <div className={`p-6 border-b border-white/40 relative flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <img
              src="/favicon.png"
              alt="Media Screens Logo"
              className={`${isSidebarCollapsed ? 'w-10 h-10' : 'w-20 h-20'} object-contain shrink-0 transition-all duration-300`}
            />
            {!isSidebarCollapsed && (
              <div className="animate-in fade-in duration-300">
                <h1 className="text-lg font-bold text-slate-800 whitespace-nowrap">Media Screens</h1>
                <p className="text-xs text-slate-500 whitespace-nowrap">Digital Signage System</p>
              </div>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md hover:text-red-600 transition-colors z-[60]"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto hide-scrollbar">
          {menuItems.filter(item => {
            if (user?.role === 'manager') {
              // Limited set for manager
              const managerPaths = ['/dashboard', '/live-preview', '/locations', '/screens'];
              return managerPaths.includes(item.path);
            }
            return true;
          }).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''} ${isSidebarCollapsed ? 'justify-center' : ''}`}
                data-testid={`nav-${item.path.substring(1)}`}
                title={isSidebarCollapsed ? item.label : ''}
              >
                <Icon className="w-5 h-5 shrink-0 text-red-600" />
                {!isSidebarCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
              </Link>
            );
          })}

          {/* Super Admin Menu Items */}
          {isSuperAdmin() && (
            <>
              <div className="pt-4 pb-2">
                <div className="flex items-center gap-2 px-3 text-xs font-semibold text-slate-400 uppercase">
                  <Shield className="w-3 h-3 text-red-600" />
                  Admin
                </div>
              </div>
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''} ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    data-testid={`nav-${item.path.substring(1)}`}
                    title={isSidebarCollapsed ? item.label : ''}
                  >
                    <Icon className="w-5 h-5 shrink-0 text-red-600" />
                    {!isSidebarCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/40">
          {!isSidebarCollapsed && (
            <div className="glass-card p-4 mb-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs text-slate-500">Autentificat ca</p>
                {isSuperAdmin() && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
                    Admin
                  </span>
                )}
                {user?.role === 'manager' && (
                  <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-medium rounded">
                    Manager
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-slate-800 truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded-xl text-slate-600 hover:bg-rose-100/50 hover:text-rose-600 transition-colors duration-200 ${isSidebarCollapsed ? 'justify-center p-3' : 'gap-2 px-4 py-3'}`}
            data-testid="logout-button"
            title={isSidebarCollapsed ? "Deconectare" : ""}
          >
            <LogOut className="w-5 h-5 shrink-0 text-red-600" />
            {!isSidebarCollapsed && <span className="animate-in fade-in duration-300">Deconectare</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`${isSidebarCollapsed ? 'ml-20' : 'ml-64'} flex-1 p-8 min-h-screen transition-all duration-300 ease-in-out`} data-testid="main-content">
        {children}
      </main>
    </div>
  );
};
