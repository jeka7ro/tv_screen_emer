import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { MapPin, Tv, FileImage, ShoppingBag, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { toast } from 'sonner';
import { EventsCalendar } from '../components/EventsCalendar';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [happyHours, setHappyHours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();

    // Poll for updates every 15 seconds
    const interval = setInterval(() => {
      loadStats();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const [statsRes, playlistsRes, happyHoursRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/playlists'),
        api.get('/happy-hours')
      ]);
      setStats(statsRes.data);
      setPlaylists(playlistsRes.data);
      setHappyHours(happyHoursRes.data);
    } catch (error) {
      toast.error('Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Locații',
      value: stats?.locations || 0,
      icon: MapPin,
      color: 'red',
      testId: 'stat-locations',
      link: '/locations'
    },
    {
      label: 'Ecrane',
      value: stats?.screens || 0,
      icon: Tv,
      color: 'red',
      testId: 'stat-screens',
      link: '/screens'
    },
    {
      label: 'Ecrane Online',
      value: stats?.online_screens || 0,
      icon: TrendingUp,
      color: 'emerald',
      testId: 'stat-online-screens',
      link: '/screens'
    },
    {
      label: 'Produse',
      value: stats?.products || 0,
      icon: ShoppingBag,
      color: 'purple',
      testId: 'stat-products',
      link: '/products'
    },
    {
      label: 'Fișiere Media',
      value: stats?.content || 0,
      icon: FileImage,
      color: 'pink',
      testId: 'stat-content',
      link: '/content'
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-in" data-testid="dashboard-page">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-2">
            Bine ai venit, {user?.full_name}
          </h1>
          <p className="text-slate-500 text-lg">
            Aici este prezentarea generală a sistemului Screen Media
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const bgColor = `bg-${stat.color}-100`;
            const textColor = `text-${stat.color}-600`;

            return (
              <div
                key={stat.label}
                className="glass-card p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-105 active:scale-100"
                data-testid={stat.testId}
                onClick={() => navigate(stat.link)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium mb-1">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-slate-800">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-2xl ${bgColor}`}>
                    <Icon className={`w-6 h-6 ${textColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-red-600" />
            Calendar Evenimente & Programe
          </h2>
          <EventsCalendar
            playlists={playlists}
            happyHours={happyHours}
            defaultView="month"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              Ghid rapid de utilizare
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Creează o locație</p>
                  <p className="text-xs text-slate-500">Adaugă restaurantul sau punctul de vânzare</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Adaugă produse</p>
                  <p className="text-xs text-slate-500">Creează meniul cu produse și prețuri</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Configurează ecranele</p>
                  <p className="text-xs text-slate-500">Creează ecrane și asociază conținut</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Deschide pe TV</p>
                  <p className="text-xs text-slate-500">Accesează link-ul scurt pe ecranele TV</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              Funcționalități cheie
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm text-slate-700">Management multi-locații</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm text-slate-700">Template-uri personalizabile</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm text-slate-700">Sincronizare ecrane</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm text-slate-700">Upload imagini și video-uri</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm text-slate-700">Proteție cu cod de securitate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
