import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { List as ListIcon, Plus, Edit, Trash2, ArrowUp, ArrowDown, LayoutGrid, Film, ImageIcon, Clock, Copy } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useViewMode } from '../hooks/useViewMode';
import { ViewToggle } from '../components/ViewToggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    autoplay: true,
    loop: true,
    brand: ''
  });
  const [playlistItems, setPlaylistItems] = useState([]);
  const [viewMode, setViewMode] = useViewMode('view_mode_playlists', 'grid');
  const [brandFilter, setBrandFilter] = useState('all');
  const [selectedPlaylists, setSelectedPlaylists] = useState([]);
  const [editingPlaylist, setEditingPlaylist] = useState(null);

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
          order: index,
          duration: item.duration || 10
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
      loop: playlist.loop,
      brand: playlist.brand || ''
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

  const handleDuplicate = async (playlist) => {
    try {
      const duplicatedData = {
        name: `${playlist.name} (Copie)`,
        description: playlist.description || '',
        autoplay: playlist.autoplay,
        loop: playlist.loop,
        brand: playlist.brand || '',
        items: (playlist.items || []).map((item, index) => ({
          content_id: item.content_id,
          order: index,
          duration: item.duration || 10
        }))
      };

      await api.post('/playlists', duplicatedData);
      toast.success('Playlist duplicat cu succes!');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Eroare la duplicare');
    }
  };

  const addContentToPlaylist = (contentId) => {
    if (playlistItems.some(item => item.content_id === contentId)) {
      toast.error('Conținutul este deja în playlist');
      return;
    }
    setPlaylistItems([...playlistItems, {
      content_id: contentId,
      order: playlistItems.length,
      duration: 10
    }]);
  };

  const removeFromPlaylist = (index) => {
    setPlaylistItems(playlistItems.filter((_, i) => i !== index));
  };

  const updateItemDuration = (index, duration) => {
    const newItems = [...playlistItems];
    newItems[index] = { ...newItems[index], duration: parseInt(duration) || 0 };
    setPlaylistItems(newItems);
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
      loop: true,
      brand: ''
    });
    setPlaylistItems([]);
    setEditingPlaylist(null);
  };

  // Brands logic
  const brands = [...new Set(playlists.map(p => p.brand).filter(Boolean))].sort();
  const filteredPlaylists = brandFilter === 'all'
    ? playlists
    : playlists.filter(p => p.brand === brandFilter);

  const toggleSelectAll = () => {
    if (selectedPlaylists.length === filteredPlaylists.length) {
      setSelectedPlaylists([]);
    } else {
      setSelectedPlaylists(filteredPlaylists.map(p => p.id));
    }
  };

  const toggleSelectPlaylist = (id) => {
    if (selectedPlaylists.includes(id)) {
      setSelectedPlaylists(selectedPlaylists.filter(pid => pid !== id));
    } else {
      setSelectedPlaylists([...selectedPlaylists, id]);
    }
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
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">Playlist-uri</h1>
              <p className="text-slate-500">Creează și gestionează secvențe de conținut</p>
            </div>
            <div className="flex gap-3">
              <Dialog open={showDialog} onOpenChange={(open) => {
                setShowDialog(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="btn-red px-6 py-2 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all h-[44px]" data-testid="add-playlist-button">
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
                    <div className="grid grid-cols-2 gap-4">
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
                        <Label>Brand</Label>
                        <Input
                          value={formData.brand}
                          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                          placeholder="Ex: Sushi Master"
                          data-testid="playlist-brand-input"
                        />
                      </div>
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-base font-bold text-slate-700 flex items-center gap-2">
                          <Plus className="w-4 h-4 text-emerald-500" />
                          Conținut disponibil
                        </Label>
                        <div className="max-h-[500px] overflow-y-auto space-y-2 border border-slate-100 rounded-2xl p-4 bg-slate-50 shadow-inner">
                          {content.map(item => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all group"
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-16 h-12 rounded-lg border border-slate-100 overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center shadow-sm">
                                  {item.thumbnail_url || (item.type === 'image' && item.file_url) ? (
                                    <img src={item.thumbnail_url || item.file_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                      {item.type === 'video' ? <Film className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.title}</p>
                                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{item.type}</p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                onClick={() => addContentToPlaylist(item.id)}
                                className="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white transition-all text-xs font-bold px-4 py-2 h-9 rounded-xl border-none shadow-none"
                              >
                                Adaugă
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base font-bold text-slate-700 flex items-center gap-2">
                          <ListIcon className="w-4 h-4 text-indigo-500" />
                          Playlist ({playlistItems.length} elemente)
                        </Label>
                        <div className="max-h-[500px] overflow-y-auto space-y-3 border border-slate-100 rounded-2xl p-4 bg-slate-50 shadow-inner">
                          {playlistItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                              <Plus className="w-12 h-12 mb-4 opacity-10" />
                              <p className="font-medium">Adaugă elemente din stânga</p>
                            </div>
                          ) : (
                            playlistItems.map((item, index) => {
                              const contentItem = getContentById(item.content_id);
                              return (
                                <div
                                  key={index}
                                  className="bg-white border-2 border-indigo-100/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all relative group"
                                >
                                  <div className="flex items-center gap-4">
                                    {/* Order controls */}
                                    <div className="flex flex-col gap-1">
                                      <button
                                        type="button"
                                        onClick={() => moveItem(index, 'up')}
                                        disabled={index === 0}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors"
                                      >
                                        <ArrowUp className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => moveItem(index, 'down')}
                                        disabled={index === playlistItems.length - 1}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 transition-colors"
                                      >
                                        <ArrowDown className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {/* Thumbnail */}
                                    <div className="w-20 h-14 rounded-xl border-2 border-slate-50 overflow-hidden shrink-0 bg-slate-100 shadow-inner">
                                      {contentItem?.thumbnail_url || (contentItem?.type === 'image' && contentItem?.file_url) ? (
                                        <img src={contentItem.thumbnail_url || contentItem.file_url} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                          {contentItem?.type === 'video' ? <Film className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                                        </div>
                                      )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-black text-slate-800 line-clamp-1 flex items-center gap-2">
                                        <span className="text-indigo-500 font-black">#{index + 1}</span>
                                        {contentItem?.title || 'Unknown'}
                                      </p>

                                      {/* Duration / Timer Input */}
                                      <div className="mt-2 flex items-center gap-2">
                                        <div className="relative">
                                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Clock className="w-3.5 h-3.5" />
                                          </div>
                                          <Input
                                            type="number"
                                            min="1"
                                            value={item.duration || 10}
                                            onChange={(e) => updateItemDuration(index, e.target.value)}
                                            className="h-8 w-24 pl-8 text-xs font-bold rounded-lg border-slate-200"
                                            placeholder="Secunde"
                                          />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Secunde</span>
                                      </div>
                                    </div>

                                    {/* Delete button */}
                                    <button
                                      type="button"
                                      onClick={() => removeFromPlaylist(index)}
                                      className="p-2.5 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all shadow-sm"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" className="btn-primary flex-1 h-11 rounded-xl shadow-md hover:shadow-lg transition-all" data-testid="save-playlist-button">
                        {editingPlaylist ? 'Actualizează' : 'Creează'}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setShowDialog(false)}
                        className="btn-secondary h-11 rounded-xl"
                      >
                        Anulează
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-2">Brand:</span>
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="w-[200px] h-9 text-sm bg-slate-50 border-slate-100 rounded-xl">
                  <SelectValue placeholder="Toate brandurile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate brandurile</SelectItem>
                  {brands.map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1"></div>

            <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {filteredPlaylists.length === 0 ? (
          <div className="glass-card p-12 text-center" data-testid="no-playlists">
            <List className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Niciun playlist găsit
            </h3>
            <p className="text-slate-500 mb-6">
              Încearcă să schimbi filtrele sau adaugă un playlist nou
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-6 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={filteredPlaylists.length > 0 && selectedPlaylists.length === filteredPlaylists.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Brand / Nume</th>
                    <th className="px-6 py-4">Creat de / Data</th>
                    <th className="px-6 py-4">Elemente</th>
                    <th className="px-6 py-4">Configurări</th>
                    <th className="px-6 py-4 text-right">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPlaylists.map((playlist) => (
                    <tr key={playlist.id} className={`hover:bg-slate-50/50 transition-colors ${selectedPlaylists.includes(playlist.id) ? 'bg-indigo-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedPlaylists.includes(playlist.id)}
                          onChange={() => toggleSelectPlaylist(playlist.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${playlist.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${playlist.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                          {playlist.status === 'active' ? 'Activ' : 'Inactiv'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        <div className="flex flex-col">
                          {playlist.brand && <span className="text-[10px] font-bold text-indigo-600 uppercase mb-0.5">{playlist.brand}</span>}
                          <span>{playlist.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs">
                          <span className="text-slate-700 font-medium">{playlist.created_by_name || 'System'}</span>
                          <span className="text-slate-400">
                            {playlist.created_at ? new Date(playlist.created_at).toLocaleDateString('ro-RO') : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-tight">
                          {playlist.items?.length || 0} elemente
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5">
                          {playlist.loop && (
                            <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter">
                              Loop
                            </span>
                          )}
                          {playlist.autoplay && (
                            <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter">
                              Autoplay
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDuplicate(playlist)}
                            className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all text-slate-500 hover:text-indigo-600 shadow-sm hover:shadow"
                            title="Duplică"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(playlist)}
                            className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all text-slate-500 hover:text-indigo-600 shadow-sm hover:shadow"
                            title="Editează"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(playlist.id)}
                            className="p-2 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all text-slate-400 hover:text-rose-600"
                            title="Șterge"
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
            {filteredPlaylists.map((playlist) => (
              <div key={playlist.id} className="glass-card p-6 flex flex-col h-full hover:shadow-lg transition-all border-slate-200/60" data-testid={`playlist-card-${playlist.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col">
                    {playlist.brand && (
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1 underline decoration-2 decoration-indigo-200 underline-offset-4">
                        {playlist.brand}
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-slate-800 leading-tight">
                      {playlist.name}
                    </h3>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleDuplicate(playlist)}
                      className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all text-slate-500 hover:text-indigo-600 shadow-sm hover:shadow"
                      title="Duplică"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(playlist)}
                      className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all text-slate-500 hover:text-indigo-600 shadow-sm hover:shadow"
                      title="Editează"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(playlist.id)}
                      className="p-2 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all text-slate-400 hover:text-rose-600"
                      title="Șterge"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 mb-5 flex-1">
                  {playlist.description ? (
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 italic">"{playlist.description}"</p>
                  ) : (
                    <p className="text-xs text-slate-400 mb-4 italic">Fără descriere</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase">
                        {playlist.items?.length || 0} fișiere
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {playlist.loop && <div className="w-2 h-2 rounded-full bg-indigo-400" title="Loop activ"></div>}
                      {playlist.autoplay && <div className="w-2 h-2 rounded-full bg-emerald-400" title="Autoplay activ"></div>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${playlist.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {playlist.status === 'active' ? 'Filtrul Activ' : 'Inactiv'}
                  </div>
                  <button
                    onClick={() => handleEdit(playlist)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
                  >
                    Vezi detalii
                    <ArrowDown className="w-3 h-3 -rotate-90 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
