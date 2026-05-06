import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  Activity,
  Clock,
  Calendar,
  DollarSign
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
  { path: '/activity-logs', icon: Activity, label: 'Jurnale Activitate' },
  { path: '/billing', icon: DollarSign, label: 'Facturare' },
];

export const DashboardLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isSuperAdmin } = useAuth();

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  // Generate initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (date) => {
    const days = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
    const months = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-[17rem]'} h-screen fixed left-0 top-0 z-50 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-200/80`} style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 50%, #e8edf5 100%)' }} data-testid="sidebar">
        <div className={`px-2 border-b border-slate-200/80 bg-white relative flex items-center ${isSidebarCollapsed ? 'justify-center' : ''} h-[72px] shrink-0`}>
          <Link to="/dashboard" className="flex items-center overflow-hidden w-full">
            {isSidebarCollapsed ? (
              <img
                src="/favicon.png"
                alt="Smart Displays Logo"
                className="w-10 h-10 object-contain shrink-0 mx-auto transition-all duration-300"
              />
            ) : (
              <div className="animate-in fade-in duration-300 flex items-center w-full">
                <div className="flex items-center justify-center w-full px-1 translate-x-3">
                  <img 
                    src="/getapp_smart_displays_black.png" 
                    alt="GET App Smart Displays" 
                    className="h-[52px] w-auto object-contain transition-all hover:scale-105"
                  />
                </div>
              </div>
            )}
          </Link>
          <button
             onClick={toggleSidebar}
             className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-300 rounded-full flex items-center justify-center shadow-md text-slate-500 hover:bg-[#00ced1] hover:border-[#00ced1] hover:text-white transition-colors z-[60]"
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
                <Icon className="w-5 h-5 shrink-0" />
                {!isSidebarCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
              </Link>
            );
          })}

          {/* Super Admin Menu Items */}
          {isSuperAdmin() && (
            <>
              <div className="pt-4 pb-2">
                <div className="flex items-center gap-2 px-3 text-xs font-semibold text-slate-400 uppercase">
                  <Shield className="w-3 h-3 text-slate-400" />
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
                    <Icon className="w-5 h-5 shrink-0" />
                    {!isSidebarCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-200/80">
          {!isSidebarCollapsed && (
            <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-200/80 p-4 mb-3 animate-in fade-in duration-300 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs text-slate-400">Autentificat ca</p>
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
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors duration-200 ${isSidebarCollapsed ? 'justify-center p-3' : 'gap-2 px-4 py-3'}`}
            data-testid="logout-button"
            title={isSidebarCollapsed ? "Deconectare" : ""}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span className="animate-in fade-in duration-300">Deconectare</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`${isSidebarCollapsed ? 'ml-20' : 'ml-[17rem]'} flex-1 min-h-screen transition-all duration-300 ease-in-out flex flex-col`}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 px-8 h-[72px] flex items-center border-b border-slate-200/80 shrink-0" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #eef2f7 100%)' }}>
          <div className="flex items-center justify-end gap-4 w-full">
            {/* Date & Time */}
            <div className="flex items-center gap-3 text-right">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(currentTime)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 justify-end">
                  <Clock className="w-3.5 h-3.5 text-red-400" />
                  <span className="tabular-nums">{formatTime(currentTime)}</span>
                </div>
              </div>
            </div>

            {/* Version / Build Date – only for Super Admin */}
            {isSuperAdmin() && (
              <div className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500">
                  v{process.env.REACT_APP_BUILD_DATE || 'DEV'}
                </span>
              </div>
            )}

            {/* Separator */}
            <div className="w-px h-8 bg-slate-200" />

            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-700 leading-tight">{user?.full_name}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  {isSuperAdmin() ? 'Admin' : user?.role === 'manager' ? 'Manager' : 'Admin'}
                </p>
              </div>
              {/* Avatar */}
              {user?.avatar_url ? (
                <img
                  src={
                    user.avatar_url.startsWith('http')
                      ? user.avatar_url
                      : `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}${user.avatar_url}`
                  }
                  alt={user?.full_name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 border-slate-200">
                  {getInitials(user?.full_name)}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8" data-testid="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};
