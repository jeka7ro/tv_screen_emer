import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import {
  Users as UsersIcon,
  User,
  Shield,
  Mail,
  Calendar,
  RefreshCw,
  XCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';
import { useViewMode } from '../hooks/useViewMode';
import { ViewToggle } from '../components/ViewToggle';

export const Users = () => {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [viewMode, setViewMode] = useViewMode('view_mode_users', 'list');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      if (error.response?.status !== 403) {
        toast.error('Eroare la încărcarea utilizatorilor');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isSuperAdmin()) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <XCircle className="w-16 h-16 text-red-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Acces restricționat</h2>
          <p className="text-slate-500">Doar Super Admin-ul poate vedea utilizatorii.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  const superAdminCount = users.filter((u) => u.is_super_admin).length;

  return (
    <DashboardLayout>
      <div className="animate-in" data-testid="users-page">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Utilizatori</h1>
            <p className="text-slate-500">
              Evidență utilizatori înregistrați în aplicație
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadUsers}
              className="btn-secondary flex items-center gap-2"
              data-testid="refresh-users-btn"
            >
              <RefreshCw className="w-4 h-4" />
              Reîncarcă
            </button>
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <UsersIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total utilizatori</p>
                <p className="text-2xl font-bold text-slate-800">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Super Admin</p>
                <p className="text-2xl font-bold text-slate-800">{superAdminCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        {users.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <UsersIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Niciun utilizator</h3>
            <p className="text-slate-500">
              Utilizatorii care se înregistrează vor apărea aici.
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200/60">
                    <th className="text-left py-4 px-5 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                      Utilizator
                    </th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                      Înregistrat
                    </th>
                    <th className="text-left py-4 px-5 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                      Ultima logare
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                      data-testid={`user-${u.email}`}
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-indigo-600" />
                          </div>
                          <span className="font-medium text-slate-800">{u.full_name || '—'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="w-4 h-4 text-slate-400" />
                          {u.email}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        {u.is_super_admin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                            <Shield className="w-3.5 h-3.5" />
                            Super Admin
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">Utilizator</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {formatDate(u.created_at)}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {formatDate(u.last_login)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {users.map((u) => (
              <div key={u.id} className="glass-card p-6 flex flex-col items-center text-center" data-testid={`user-card-${u.email}`}>
                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                  <User className="w-10 h-10 text-indigo-600" />
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  {u.full_name || '—'}
                </h3>

                <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
                  <Mail className="w-3.5 h-3.5" />
                  {u.email}
                </div>

                <div className="mb-6">
                  {u.is_super_admin ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full border border-amber-200">
                      <Shield className="w-3.5 h-3.5" />
                      Super Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-600 text-sm font-medium rounded-full border border-slate-200">
                      Utilizator
                    </span>
                  )}
                </div>

                <div className="w-full space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="w-4 h-4" />
                      <span>Înregistrat</span>
                    </div>
                    <span className="font-medium text-slate-700">{formatDate(u.created_at).split(',')[0]}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="w-4 h-4" />
                      <span>Ultima logare</span>
                    </div>
                    <span className="font-medium text-slate-700">{formatDate(u.last_login).split(',')[0]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout >
  );
};
