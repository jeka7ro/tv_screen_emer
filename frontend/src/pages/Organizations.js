import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { toast } from 'sonner';
import {
  Building2,
  Plus,
  Tv,
  MapPin,
  Users,
  UserPlus,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Organizations = () => {
  const { user, isSuperAdmin, selectedOrgId, selectOrganization, refreshOrganizations } = useAuth();
  const navigate = useNavigate();

  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({ name: '', id: '' });
  const [creating, setCreating] = useState(false);

  const [editingOrg, setEditingOrg] = useState(null);
  const [editName, setEditName] = useState('');
  const [updating, setUpdating] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  // User creation for organization
  const [userOrgTarget, setUserOrgTarget] = useState(null);
  const [userData, setUserData] = useState({ full_name: '', email: '', password: '', role: 'admin' });
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/organizations');
      setOrgs(res.data);
      refreshOrganizations();
    } catch (err) {
      toast.error('Eroare la încărcarea organizațiilor');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createData.name.trim()) {
      toast.error('Numele organizației este obligatoriu');
      return;
    }
    setCreating(true);
    try {
      const res = await api.post('/organizations', {
        name: createData.name.trim(),
        id: createData.id.trim() || undefined
      });
      toast.success(`Organizația "${res.data.name}" a fost creată!`);
      setShowCreateModal(false);
      setCreateData({ name: '', id: '' });
      await loadOrganizations();
      // Auto-switch to newly created org
      selectOrganization(res.data.id);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Eroare la crearea organizației');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editingOrg) return;
    setUpdating(true);
    try {
      await api.put(`/organizations/${editingOrg.id}`, { name: editName.trim() });
      toast.success('Organizație actualizată cu succes');
      setEditingOrg(null);
      await loadOrganizations();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Eroare la actualizarea organizației');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userData.email.trim() || !userData.password || !userData.full_name.trim() || !userOrgTarget) {
      toast.error('Completează toate câmpurile obligatorii');
      return;
    }
    setCreatingUser(true);
    try {
      await api.post('/users', {
        email: userData.email.trim(),
        password: userData.password,
        full_name: userData.full_name.trim(),
        role: userData.role || 'admin',
        organization_id: userOrgTarget.id
      });
      toast.success(`Contul pentru ${userData.email} a fost creat pentru "${userOrgTarget.name}"!`);
      setUserOrgTarget(null);
      setUserData({ full_name: '', email: '', password: '', role: 'admin' });
      await loadOrganizations();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Eroare la crearea utilizatorului');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDelete = async (org) => {
    if (org.id === 'default_sushimaster') {
      toast.error('Nu se poate șterge organizația implicită!');
      return;
    }
    if (org.screens_count > 0) {
      toast.error(`Nu se poate șterge: organizația conține ${org.screens_count} ecrane.`);
      return;
    }
    if (!window.confirm(`Sigur doriți să ștergeți organizația "${org.name}"?`)) {
      return;
    }

    setDeletingId(org.id);
    try {
      await api.delete(`/organizations/${org.id}`);
      toast.success(`Organizația "${org.name}" a fost ștearsă.`);
      if (selectedOrgId === org.id) {
        selectOrganization('all');
      }
      await loadOrganizations();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Eroare la ștergerea organizației');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSwitch = (orgId) => {
    selectOrganization(orgId);
    toast.success(`Ai comutat pe organizația selectată!`);
  };

  const filteredOrgs = orgs.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalScreens = orgs.reduce((acc, o) => acc + (o.screens_count || 0), 0);
  const totalLocations = orgs.reduce((acc, o) => acc + (o.locations_count || 0), 0);
  const totalUsers = orgs.reduce((acc, o) => acc + (o.users_count || 0), 0);

  if (!isSuperAdmin()) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-slate-500">
          Acces restricționat. Doar Super-Adminul poate accesa această pagină.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Building2 className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Gestionare Organizații (Multi-Tenant)
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Administrează clienții, chiriașii (tenants) și comută între spațiile de lucru ale fiecărui brand.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadOrganizations}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              title="Reîmprospătează"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-colors shadow-indigo-200 dark:shadow-none"
            >
              <Plus className="w-4 h-4" />
              Adaugă Organizație
            </button>
          </div>
        </div>

        {/* Global Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Organizații</span>
              <Building2 className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-2">{orgs.length}</p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Ecrane</span>
              <Tv className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-2">{totalScreens}</p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Locații</span>
              <MapPin className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-2">{totalLocations}</p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Utilizatori</span>
              <Users className="w-4 h-4 text-sky-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-2">{totalUsers}</p>
          </div>
        </div>

        {/* Global Active Filter Banner */}
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-200/50 dark:border-indigo-800/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Filtru activ în Dashboard:
              </span>
              <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                {selectedOrgId === 'all'
                  ? '🌐 Toate Organizațiile (Privire Globală Agregată)'
                  : `🏢 ${orgs.find(o => o.id === selectedOrgId)?.name || selectedOrgId}`}
              </p>
            </div>
          </div>
          {selectedOrgId !== 'all' && (
            <button
              onClick={() => handleSwitch('all')}
              className="text-xs font-medium px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 text-slate-700 dark:text-slate-200 transition"
            >
              Comută pe Toate Organizațiile
            </button>
          )}
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Caută organizație după nume sau ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrgs.map((org) => {
            const isCurrentSelected = selectedOrgId === org.id;
            const isDefault = org.id === 'default_sushimaster';

            return (
              <div
                key={org.id}
                className={`relative bg-white dark:bg-slate-800/90 rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between ${
                  isCurrentSelected
                    ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'
                }`}
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                        {org.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                          {org.name}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                          {org.id}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isDefault && (
                        <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-semibold rounded-md border border-amber-200 dark:border-amber-800">
                          Implicit
                        </span>
                      )}
                      {isCurrentSelected && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold rounded-md border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Activ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 my-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl text-center">
                      <span className="text-[10px] font-medium text-slate-400 flex items-center justify-center gap-1">
                        <Tv className="w-3 h-3" /> Ecrane
                      </span>
                      <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {org.screens_count || 0}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl text-center">
                      <span className="text-[10px] font-medium text-slate-400 flex items-center justify-center gap-1">
                        <MapPin className="w-3 h-3" /> Locații
                      </span>
                      <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {org.locations_count || 0}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl text-center">
                      <span className="text-[10px] font-medium text-slate-400 flex items-center justify-center gap-1">
                        <Users className="w-3 h-3" /> Utilizatori
                      </span>
                      <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {org.users_count || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingOrg(org);
                        setEditName(org.name);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                      title="Redenumește"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setUserOrgTarget(org);
                        setUserData({ full_name: '', email: '', password: '', role: 'admin' });
                      }}
                      className="px-2 py-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition flex items-center gap-1 text-xs font-semibold"
                      title="Creează cont de acces client pentru această organizație"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Cont Client</span>
                    </button>
                    {!isDefault && (
                      <button
                        onClick={() => handleDelete(org)}
                        disabled={deletingId === org.id || org.screens_count > 0}
                        className={`p-1.5 rounded-lg transition ${
                          org.screens_count > 0
                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                            : 'text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        }`}
                        title={org.screens_count > 0 ? "Ștergeți ecranele înainte" : "Șterge organizația"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {isCurrentSelected ? (
                    <button
                      onClick={() => navigate('/screens')}
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Vezi ecrane <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSwitch(org.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 dark:bg-slate-700 dark:hover:bg-indigo-950 dark:text-slate-200 dark:hover:text-indigo-300 text-xs font-semibold rounded-xl transition"
                    >
                      Comută pe acest client
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty Search Result */}
        {filteredOrgs.length === 0 && !loading && (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
            <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-base font-medium text-slate-700 dark:text-slate-300">
              Nicio organizație găsită
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Nu am găsit rezultate pentru căutarea "{search}".
            </p>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Adaugă Organizație Nouă
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Nume Brand / Client *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Smash Me, Ikura Sushi, Bistro Paris..."
                  value={createData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoId = name.toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 24);
                    setCreateData({ name, id: createData.id ? createData.id : autoId });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  ID Unic (Slug / Opțional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: smash_me"
                  value={createData.id}
                  onChange={(e) => setCreateData({ ...createData, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Identificator intern folosit la separarea bazei de date și a fișierelor.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl disabled:opacity-50"
                >
                  {creating ? 'Se creează...' : 'Creează Organizația'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Editează Numele Organizației
              </h3>
              <button
                onClick={() => setEditingOrg(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Nume Organizație
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingOrg(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl disabled:opacity-50"
                >
                  {updating ? 'Se salvează...' : 'Salvează Modificările'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE USER FOR ORG MODAL */}
      {userOrgTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Cont Client Nou
                </h3>
              </div>
              <button
                onClick={() => setUserOrgTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-300">
              Utilizatorul va fi asociat strict organizației <strong>{userOrgTarget.name}</strong>. Nu va avea acces la datele altor clienți (inclusiv Sushi Master).
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Nume Complet
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Andrei Popescu"
                  value={userData.full_name}
                  onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Email de Autentificare
                </label>
                <input
                  type="email"
                  required
                  placeholder="client@companie.ro"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Parolă Inițială
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minim 6 caractere"
                  value={userData.password}
                  onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Rol în Organizație
                </label>
                <select
                  value={userData.role}
                  onChange={(e) => setUserData({ ...userData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="admin">Administrator Firmă (acces complet pe organizația sa)</option>
                  <option value="manager">Manager Locație (acces limitat)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUserOrgTarget(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl disabled:opacity-50"
                >
                  {creatingUser ? 'Se creează contul...' : 'Creează Contul'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
export default Organizations;
