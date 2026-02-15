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
  Trash2,
  Key,
  Ban,
  CheckCircle,
  Edit,
  Camera,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import api from '../utils/api';
import { useViewMode } from '../hooks/useViewMode';
import { ViewToggle } from '../components/ViewToggle';

export const Users = () => {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [viewMode, setViewMode] = useViewMode('view_mode_users', 'list');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [locations, setLocations] = useState([]);
  const [avatarUploadingId, setAvatarUploadingId] = useState(null);
  const avatarInputRef = React.useRef(null);
  const [avatarTargetUser, setAvatarTargetUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    role: 'admin',
    location_id: ''
  });

  useEffect(() => {
    loadUsers();
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await api.get('/locations');
      setLocations(response.data);
    } catch (error) {
      console.error('Error loading locations', error);
    }
  };

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

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Ești sigur că vrei să ștergi acest utilizator? Această acțiune este ireversibilă.')) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success('Utilizator șters cu succes');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Eroare la ștergere');
    }
  };

  const handleUpdateStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.patch(`/users/${userId}/status`, { status: newStatus });
      toast.success(`Utilizator ${newStatus === 'active' ? 'activat' : 'suspendat'}`);
      loadUsers();
    } catch (error) {
      toast.error('Eroare la actualizarea statusului');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Parola trebuie să aibă cel puțin 6 caractere');
      return;
    }
    setResetting(true);
    try {
      await api.post(`/users/${selectedUser.id}/reset-password`, { new_password: newPassword });
      toast.success('Parolă resetată cu succes');
      setShowPasswordDialog(false);
      setNewPassword('');
    } catch (error) {
      toast.error('Eroare la resetarea parolei');
    } finally {
      setResetting(false);
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditFormData({
      full_name: user.full_name || '',
      role: user.role || 'admin',
      location_id: user.location_id || ''
    });
    setShowEditDialog(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload = { ...editFormData };
      if (payload.location_id === 'none') payload.location_id = null;

      await api.patch(`/users/${selectedUser.id}`, payload);
      toast.success('Utilizator actualizat cu succes');
      setShowEditDialog(false);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Eroare la actualizarea utilizatorului');
    } finally {
      setUpdating(false);
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

  const handleAvatarClick = (user) => {
    setAvatarTargetUser(user);
    avatarInputRef.current?.click();
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !avatarTargetUser) return;

    setAvatarUploadingId(avatarTargetUser.id);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/users/${avatarTargetUser.id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Avatar actualizat!');
      loadUsers();
    } catch (error) {
      toast.error('Eroare la upload avatar');
    } finally {
      setAvatarUploadingId(null);
      setAvatarTargetUser(null);
      e.target.value = '';
    }
  };

  const renderAvatar = (user, size = 'md') => {
    const sizeClass = size === 'lg' ? 'w-20 h-20' : 'w-10 h-10';
    const iconSize = size === 'lg' ? 'w-10 h-10' : 'w-5 h-5';
    const cameraSize = size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
    const cameraIconSize = size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
    const isUploading = avatarUploadingId === user.id;

    // Fix avatar URL - if it starts with /api/, prepend backend URL
    const getAvatarUrl = (url) => {
      if (!url) return null;
      if (url.startsWith('http')) return url; // Already full URL (Supabase)
      if (url.startsWith('/api/')) {
        // Local storage - backend is on port 8000
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
        return `${backendUrl}${url}`;
      }
      return url;
    };

    const avatarUrl = getAvatarUrl(user.avatar_url);

    return (
      <div
        className={`${sizeClass} rounded-full relative group cursor-pointer flex-shrink-0`}
        onClick={() => handleAvatarClick(user)}
        title="Schimbă avatar"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user.full_name}
            className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-sm`}
            onError={(e) => {
              // Fallback to default avatar if image fails to load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={`${sizeClass} rounded-full bg-indigo-100 flex items-center justify-center border-2 border-white shadow-sm`}
          style={{ display: avatarUrl ? 'none' : 'flex' }}
        >
          <User className={`${iconSize} text-indigo-600`} />
        </div>
        <div className={`absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
          {isUploading ? (
            <div className="animate-spin rounded-full border-2 border-white border-t-transparent" style={{ width: size === 'lg' ? 20 : 14, height: size === 'lg' ? 20 : 14 }} />
          ) : (
            <Camera className={`${cameraIconSize} text-white`} />
          )}
        </div>
      </div>
    );
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

  // Hidden file input for avatar uploads
  const avatarFileInput = (
    <input
      ref={avatarInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={handleAvatarUpload}
    />
  );

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
      {avatarFileInput}
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
                      Status
                    </th>
                    <th className="text-right py-4 px-5 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                      Acțiuni
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
                          {renderAvatar(u, 'md')}
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
                        ) : u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                            <Shield className="w-3.5 h-3.5" />
                            Admin
                          </span>
                        ) : u.role === 'manager' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                            <User className="w-3.5 h-3.5" />
                            Manager
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
                      <td className="py-4 px-5">
                        {u.status === 'suspended' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            <Ban className="w-3 h-3" />
                            Suspendat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Activ
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowPasswordDialog(true);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-indigo-600"
                            title="Resetare parolă"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditClick(u)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-indigo-600"
                            title="Editează utilizator"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(u.id, u.status)}
                            className={`p-2 rounded-lg transition-colors ${u.status === 'active'
                              ? 'hover:bg-amber-50 text-slate-500 hover:text-amber-600'
                              : 'hover:bg-emerald-50 text-slate-500 hover:text-emerald-600'
                              }`}
                            title={u.status === 'active' ? 'Suspendă' : 'Activează'}
                          >
                            {u.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-500 hover:text-red-600"
                            title="Șterge utilizator"
                            disabled={u.is_super_admin && users.filter(usr => usr.is_super_admin).length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                <div className="mb-4">
                  {renderAvatar(u, 'lg')}
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
                  ) : u.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full border border-indigo-200">
                      <Shield className="w-3.5 h-3.5" />
                      Admin
                    </span>
                  ) : u.role === 'manager' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full border border-blue-200">
                      <User className="w-3.5 h-3.5" />
                      Manager
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

                <div className="w-full grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedUser(u);
                      setShowPasswordDialog(true);
                    }}
                    className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-500 hover:text-indigo-600"
                  >
                    <Key className="w-4 h-4" />
                    <span className="text-[10px] font-medium">Parolă</span>
                  </button>
                  <button
                    onClick={() => handleEditClick(u)}
                    className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-500 hover:text-indigo-600"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-[10px] font-medium">Editează</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(u.id, u.status)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${u.status === 'active'
                      ? 'hover:bg-amber-50 text-slate-500 hover:text-amber-600'
                      : 'hover:bg-emerald-50 text-slate-500 hover:text-emerald-600'
                      }`}
                  >
                    {u.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    <span className="text-[10px] font-medium">{u.status === 'active' ? 'Suspendă' : 'Activ'}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="flex flex-col items-center gap-1 p-2 hover:bg-red-50 rounded-xl transition-colors text-slate-500 hover:text-red-600"
                    disabled={u.is_super_admin && users.filter(usr => usr.is_super_admin).length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-[10px] font-medium">Șterge</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent className="glass-panel max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Resetare parolă pentru {selectedUser?.full_name}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-1" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              <form onSubmit={handleResetPassword} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Parolă nouă</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Introduceți parola nouă (min. 6 caractere)"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={resetting} className="flex-1 btn-primary">
                    {resetting ? 'Se resetează...' : 'Resetează parola'}
                  </Button>
                  <Button type="button" onClick={() => setShowPasswordDialog(false)} variant="outline">
                    Anulează
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="glass-panel max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Editează Utilizator: {selectedUser?.full_name}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-1" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              <form onSubmit={handleUpdateUser} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nume Complet</Label>
                  <Input
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                    placeholder="Nume Prenume"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select
                    value={editFormData.role}
                    onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin (Toate locațiile)</SelectItem>
                      <SelectItem value="manager">Manager (Locație specifică)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Locație</Label>
                  <Select
                    value={editFormData.location_id || 'none'}
                    onValueChange={(value) => setEditFormData({ ...editFormData, location_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectează locația" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nicio locație</SelectItem>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Managerii pot vedea doar ecranele din locația atribuită.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={updating} className="flex-1 btn-primary">
                    {updating ? 'Se salvează...' : 'Salvează modificările'}
                  </Button>
                  <Button type="button" onClick={() => setShowEditDialog(false)} variant="outline">
                    Anulează
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout >
  );
};
