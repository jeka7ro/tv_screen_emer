import React from 'react';
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
  Eye
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/live-preview', icon: Eye, label: 'Live Preview' },
  { path: '/locations', icon: MapPin, label: 'Locații' },
  { path: '/screens', icon: Tv, label: 'Ecrane' },
  { path: '/content', icon: FileImage, label: 'Conținut' },
  { path: '/products', icon: ShoppingBag, label: 'Produse' },
  { path: '/digital-menus', icon: Menu, label: 'Meniuri Digitale' },
  { path: '/playlists', icon: List, label: 'Playlist-uri' },
  { path: '/screen-sync', icon: Shuffle, label: 'Sincronizare' },
];

const adminMenuItems = [
  { path: '/users', icon: Users, label: 'Utilizatori' },
  { path: '/invitations', icon: UserPlus, label: 'Invitații' },
];

export const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isSuperAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 h-screen fixed left-0 top-0 glass-panel z-50 flex flex-col" data-testid="sidebar">
        <div className="p-6 border-b border-white/40">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-xl">
              <Monitor className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">SushiMaster</h1>
              <p className="text-xs text-slate-500">Digital Menu System</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto hide-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                data-testid={`nav-${item.path.substring(1)}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Super Admin Menu Items */}
          {isSuperAdmin() && (
            <>
              <div className="pt-4 pb-2">
                <div className="flex items-center gap-2 px-3 text-xs font-semibold text-slate-400 uppercase">
                  <Shield className="w-3 h-3" />
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
                    className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                    data-testid={`nav-${item.path.substring(1)}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/40">
          <div className="glass-card p-4 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-slate-500">Autentificat ca</p>
              {isSuperAdmin() && (
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
                  Admin
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-800 truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-slate-600 hover:bg-rose-100/50 hover:text-rose-600 transition-colors duration-200"
            data-testid="logout-button"
          >
            <LogOut className="w-5 h-5" />
            <span>Deconectare</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8 min-h-screen" data-testid="main-content">
        {children}
      </main>
    </div>
  );
};
