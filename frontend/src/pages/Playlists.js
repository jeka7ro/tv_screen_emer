import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { List, Plus, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useViewMode } from '../hooks/useViewMode';
import { ViewToggle } from '../components/ViewToggle';

export const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    autoplay: true,
    loop: true
  });
  const [playlistItems, setPlaylistItems] = useState([]);
  const [viewMode, setViewMode] = useViewMode('view_mode_playlists', 'grid');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [playlistsRes, contentRes] = await Promise.all([
        api.get('/playlists'),
        api.get('/content')
      ]);
      setPlaylists(playlistsRes.data);
      setContent(contentRes.data);
    } catch (error) {
      toast.error('Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        items: playlistItems.map((item, index) => ({
          content_id: item.content_id,
          order: index
        }))
      };
      if (editingPlaylist) {
        await api.put(`/playlists/${editingPlaylist.id}`, submitData);
        toast.success('Playlist actualizat!');
      } else {
        await api.post('/playlists', submitData);
        toast.success('Playlist creat!');
      }
      setShowDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Eroare la salvare');
    }
  };

  const handleEdit = (playlist) => {
    setEditingPlaylist(playlist);
    setFormData({
      name: playlist.name,
      description: playlist.description || '',
      autoplay: playlist.autoplay,
      loop: playlist.loop
    });
    setPlaylistItems(playlist.items || []);
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sigur dorești să ștergi acest playlist?')) return;
    try {
      await api.delete(`/playlists/${id}`);
      toast.success('Playlist șters!');
      loadData();
    } catch (error) {
      toast.error('Eroare la ștergere');
    }
  };

  const addContentToPlaylist = (contentId) => {
    if (playlistItems.some(item => item.content_id === contentId)) {
      toast.error('Conținutul este deja în playlist');
      return;
    }
    setPlaylistItems([...playlistItems, { content_id: contentId, order: playlistItems.length }]);
  };

  const removeFromPlaylist = (index) => {
    setPlaylistItems(playlistItems.filter((_, i) => i !== index));
  };

  const moveItem = (index, direction) => {
    const newItems = [...playlistItems];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newItems.length) return;
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    setPlaylistItems(newItems);
  };

  const getContentById = (contentId) => {
    return content.find(c => c.id === contentId);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      autoplay: true,
      loop: true
    });
    setPlaylistItems([]);
    setEditingPlaylist(null);
  };

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
      <div className="animate-in" data-testid="playlists-page">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Playlist-uri</h1>
            <p className="text-slate-500">Creează secvențe de conținut</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={showDialog} onOpenChange={(open) => {
              setShowDialog(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="btn-primary" data-testid="add-playlist-button">
                  <Plus className="w-5 h-5 mr-2" />
                  Creează playlist
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-panel max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPlaylist ? 'Editează playlist-ul' : 'Creează playlist nou'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Nume playlist</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Promoții Vară"
                      required
                      data-testid="playlist-name-input"
                    />
                  </div>
                  <div>
                    <Label>Descriere (opțional)</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descriere playlist..."
                      rows={2}
                      data-testid="playlist-description-input"
                    />
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.autoplay}
                        onChange={(e) => setFormData({ ...formData, autoplay: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-700">Autoplay</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.loop}
                        onChange={(e) => setFormData({ ...formData, loop: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-700">Repetă playlist</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Conținut disponibil</Label>
                      <div className="mt-2 max-h-80 overflow-y-auto space-y-2 border border-white/60 rounded-xl p-4 bg-white/20">
                        {content.map(item => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-white/40 rounded-lg hover:bg-white/60 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">{item.title}</p>
                              <p className="text-xs text-slate-500">{item.type}</p>
                            </div>
                            <Button
                              type="button"
                              onClick={() => addContentToPlaylist(item.id)}
                              className="btn-secondary text-xs px-3 py-1"
                            >
                              Adaugă
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Playlist ({playlistItems.length} elemente)</Label>
                      <div className="mt-2 max-h-80 overflow-y-auto space-y-2 border border-white/60 rounded-xl p-4 bg-white/20">
                        {playlistItems.length === 0 ? (
                          <p className="text-sm text-slate-500 text-center py-8">
                            Adaugă conținut din lista stângă
                          </p>
                        ) : (
                          playlistItems.map((item, index) => {
                            const contentItem = getContentById(item.content_id);
                            return (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-3 bg-white/40 rounded-lg"
                              >
                                <div className="flex flex-col gap-1">
                                  <button
                                    type="button"
                                    onClick={() => moveItem(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1 hover:bg-white/50 rounded disabled:opacity-30"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveItem(index, 'down')}
                                    disabled={index === playlistItems.length - 1}
                                    className="p-1 hover:bg-white/50 rounded disabled:opacity-30"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-slate-800">
                                    {index + 1}. {contentItem?.title || 'Unknown'}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFromPlaylist(index)}
                                  className="p-1.5 hover:bg-rose-100/50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-600" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="btn-primary flex-1" data-testid="save-playlist-button">
                      {editingPlaylist ? 'Actualizează' : 'Creează'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowDialog(false)}
                      className="btn-secondary"
                    >
                      Anulează
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>

        {playlists.length === 0 ? (
          <div className="glass-card p-12 text-center" data-testid="no-playlists">
            <List className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Niciun playlist
            </h3>
            <p className="text-slate-500 mb-6">
              Creează primul playlist
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Playlist</th>
                    <th className="px-6 py-4">Descriere</th>
                    <th className="px-6 py-4">Elemente</th>
                    <th className="px-6 py-4">Config</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {playlists.map((playlist) => (
                    <tr key={playlist.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="bg-pink-100 p-2 rounded-lg">
                            <List className="w-4 h-4 text-pink-600" />
                          </div>
                          {playlist.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-500 truncate max-w-[200px] block">
                          {playlist.description || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-medium">
                          {playlist.items?.length || 0} elemente
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {playlist.loop && (
                            <span className="text-xs text-slate-500 bg-slate-100/50 px-1.5 py-0.5 rounded-full border border-slate-200">
                              Loop
                            </span>
                          )}
                          {playlist.autoplay && (
                            <span className="text-xs text-slate-500 bg-slate-100/50 px-1.5 py-0.5 rounded-full border border-slate-200">
                              Autoplay
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={playlist.status === 'active' ? 'status-active' : 'status-offline'}>
                            {playlist.status === 'active' ? 'Activ' : 'Inactiv'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(playlist)}
                            className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all text-slate-500 hover:text-indigo-600 shadow-sm hover:shadow"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(playlist.id)}
                            className="p-2 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all text-slate-500 hover:text-rose-600"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <div key={playlist.id} className="glass-card p-6" data-testid={`playlist-card-${playlist.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-pink-100 p-3 rounded-2xl">
                    <List className="w-6 h-6 text-pink-600" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(playlist)}
                      className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                      data-testid={`edit-playlist-${playlist.id}`}
                    >
                      <Edit className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(playlist.id)}
                      className="p-2 hover:bg-rose-100/50 rounded-lg transition-colors"
                      data-testid={`delete-playlist-${playlist.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {playlist.name}
                </h3>
                {playlist.description && (
                  <p className="text-sm text-slate-600 mb-3">{playlist.description}</p>
                )}
                <div className="text-sm text-slate-600 mb-3">
                  <p>{playlist.items?.length || 0} elemente</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={playlist.status === 'active' ? 'status-active' : 'status-offline'}>
                    {playlist.status === 'active' ? 'Activ' : 'Inactiv'}
                  </span>
                  {playlist.loop && (
                    <span className="text-xs text-slate-500 bg-slate-100/50 px-2 py-1 rounded-full">
                      Loop
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout >
  );
};
