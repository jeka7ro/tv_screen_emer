import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import {
  UserPlus, Link2, Copy, Trash2, Clock, Users,
  CheckCircle, XCircle, Plus, Calendar, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';

export const Invitations = () => {
  const { isSuperAdmin } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newInvitation, setNewInvitation] = useState({
    expires_in_days: 7,
    max_uses: 1,
    role: 'admin',
    location_id: ''
  });
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    loadInvitations();
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await api.get('/locations');
      setLocations(response.data);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadInvitations = async () => {
    try {
      const response = await api.get('/invitations');
      setInvitations(response.data);
    } catch (error) {
      if (error.response?.status !== 403) {
        toast.error('Eroare la încărcarea invitațiilor');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async () => {
    setCreating(true);
    try {
      const response = await api.post('/invitations', newInvitation);
      setInvitations([response.data, ...invitations]);
      setShowCreateDialog(false);
      setNewInvitation({ expires_in_days: 7, max_uses: 1, role: 'admin', location_id: '' });
      toast.success('Invitație creată cu succes!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Eroare la crearea invitației');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteInvitation = async (id) => {
    try {
      await api.delete(`/invitations/${id}`);
      setInvitations(invitations.map(inv =>
        inv.id === id ? { ...inv, is_active: false } : inv
      ));
      toast.success('Invitație dezactivată');
    } catch (error) {
      toast.error('Eroare la dezactivarea invitației');
    }
  };

  const copyInvitationLink = (code) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/login?invite=${code}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link)
        .then(() => toast.success('Link copiat în clipboard!'))
        .catch(() => fallbackCopy(link));
    } else {
      fallbackCopy(link);
    }
  };

  const fallbackCopy = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      toast.success('Link copiat în clipboard!');
    } catch (err) {
      toast.error('Nu s-a putut copia link-ul');
    }
    document.body.removeChild(textarea);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (dateStr) => {
    return new Date(dateStr) < new Date();
  };

  if (!isSuperAdmin()) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <XCircle className="w-16 h-16 text-red-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Acces restricționat</h2>
          <p className="text-slate-500">Doar Super Admin-ul poate gestiona invitațiile.</p>
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

  return (
    <DashboardLayout>
      <div className="animate-in" data-testid="invitations-page">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              Invitații
            </h1>
            <p className="text-slate-500">
              Gestionează link-urile de invitație pentru utilizatori noi
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadInvitations}
              className="btn-secondary flex items-center gap-2"
              data-testid="refresh-invitations-btn"
            >
              <RefreshCw className="w-4 h-4" />
              Reîncarcă
            </button>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="btn-primary flex items-center gap-2"
              data-testid="create-invitation-btn"
            >
              <Plus className="w-4 h-4" />
              Crează Invitație
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <Link2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total invitații</p>
                <p className="text-2xl font-bold text-slate-800">{invitations.length}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Active</p>
                <p className="text-2xl font-bold text-slate-800">
                  {invitations.filter(i => i.is_active && !isExpired(i.expires_at)).length}
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Utilizate</p>
                <p className="text-2xl font-bold text-slate-800">
                  {invitations.reduce((sum, i) => sum + (i.uses || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Invitations List */}
        {invitations.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <UserPlus className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              Nicio invitație
            </h3>
            <p className="text-slate-500 mb-6">
              Creează o invitație pentru a permite altor utilizatori să se înregistreze
            </p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Crează prima invitație
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => {
              const expired = isExpired(invitation.expires_at);
              const exhausted = invitation.uses >= invitation.max_uses;
              const inactive = !invitation.is_active;
              const status = inactive ? 'inactive' : expired ? 'expired' : exhausted ? 'exhausted' : 'active';

              return (
                <div
                  key={invitation.id}
                  className={`glass-card p-5 ${status !== 'active' ? 'opacity-60' : ''}`}
                  data-testid={`invitation-${invitation.code}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="text-lg font-mono font-bold text-red-600 bg-red-50 px-3 py-1 rounded-lg">
                          {invitation.code}
                        </code>
                        {status === 'active' && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Activ
                          </span>
                        )}
                        {status === 'expired' && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                            Expirat
                          </span>
                        )}
                        {status === 'exhausted' && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            Utilizări epuizate
                          </span>
                        )}
                        {status === 'inactive' && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                            Dezactivat
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Expiră: {formatDate(invitation.expires_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>Utilizări: {invitation.uses} / {invitation.max_uses}</span>
                        </div>
                        {invitation.created_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Creat: {formatDate(invitation.created_at)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <UserPlus className="w-4 h-4" />
                          <span className="capitalize">Rol: {invitation.role || 'Admin'}</span>
                        </div>
                        {invitation.location_id && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Locație: {locations.find(l => l.id === invitation.location_id)?.name || 'Anumită locație'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status === 'active' && (
                        <button
                          onClick={() => copyInvitationLink(invitation.code)}
                          className="btn-secondary flex items-center gap-2"
                          data-testid={`copy-invitation-${invitation.code}`}
                        >
                          <Copy className="w-4 h-4" />
                          Copiază link
                        </button>
                      )}
                      {invitation.is_active && (
                        <button
                          onClick={() => handleDeleteInvitation(invitation.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Dezactivează"
                          data-testid={`delete-invitation-${invitation.code}`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Invitation Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="glass-panel max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Crează Invitație Nouă</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-1" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Valabilitate (zile)
                  </label>
                  <select
                    value={newInvitation.expires_in_days}
                    onChange={(e) => setNewInvitation({ ...newInvitation, expires_in_days: parseInt(e.target.value) })}
                    className="w-full glass-input px-4 py-3"
                    data-testid="expires-in-days-select"
                  >
                    <option value={1}>1 zi</option>
                    <option value={3}>3 zile</option>
                    <option value={7}>7 zile</option>
                    <option value={14}>14 zile</option>
                    <option value={30}>30 zile</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Număr maxim de utilizări
                  </label>
                  <select
                    value={newInvitation.max_uses}
                    onChange={(e) => setNewInvitation({ ...newInvitation, max_uses: parseInt(e.target.value) })}
                    className="w-full glass-input px-4 py-3"
                    data-testid="max-uses-select"
                  >
                    <option value={1}>1 utilizare (un singur cont)</option>
                    <option value={5}>5 utilizări</option>
                    <option value={10}>10 utilizări</option>
                    <option value={25}>25 utilizări</option>
                    <option value={50}>50 utilizări</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rol Utilizator
                  </label>
                  <select
                    value={newInvitation.role}
                    onChange={(e) => setNewInvitation({ ...newInvitation, role: e.target.value })}
                    className="w-full glass-input px-4 py-3"
                  >
                    <option value="admin">Admin (Acces Total)</option>
                    <option value="manager">Manager (Limitat la Locație)</option>
                  </select>
                </div>

                {newInvitation.role === 'manager' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Locație Atribuită
                    </label>
                    <select
                      value={newInvitation.location_id}
                      onChange={(e) => setNewInvitation({ ...newInvitation, location_id: e.target.value })}
                      className="w-full glass-input px-4 py-3"
                      required={newInvitation.role === 'manager'}
                    >
                      <option value="">Selectează locația...</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name} - {loc.city}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-600">
                    Link-ul generat va fi valid timp de <strong>{newInvitation.expires_in_days} zile</strong> și
                    poate fi folosit de <strong>{newInvitation.max_uses} {newInvitation.max_uses === 1 ? 'persoană' : 'persoane'}</strong>.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="btn-secondary"
                >
                  Anulează
                </button>
                <button
                  onClick={handleCreateInvitation}
                  disabled={creating}
                  className="btn-primary flex items-center gap-2"
                  data-testid="confirm-create-invitation-btn"
                >
                  {creating ? (
                    <>
                      <div className="spinner w-4 h-4"></div>
                      Se creează...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Crează
                    </>
                  )}
                </button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};
