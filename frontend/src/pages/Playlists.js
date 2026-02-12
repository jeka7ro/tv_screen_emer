import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { List as ListIcon, Plus, Edit, Trash2, ArrowUp, ArrowDown, LayoutGrid, Film, ImageIcon, Clock, Copy, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useViewMode } from '../hooks/useViewMode';
import { ViewToggle } from '../components/ViewToggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';

export const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    autoplay: true,
    loop: true,
    brand: '',
    is_scheduled: false,
    start_at: '',
    end_at: ''
  });
  const [brands, setBrands] = useState([]);
  const [playlistItems, setPlaylistItems] = useState([]);
  const [viewMode, setViewMode] = useViewMode('view_mode_playlists', 'grid');

  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [playlistsRes, contentRes, brandsRes] = await Promise.all([
        api.get('/playlists'),
        api.get('/content'),
        api.get('/brands')
      ]);
      setPlaylists(playlistsRes.data);
      setContent(contentRes.data);
      setBrands(brandsRes.data);
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
        start_at: (formData.is_scheduled && formData.start_at) ? formData.start_at : null,
        end_at: (formData.is_scheduled && formData.end_at) ? formData.end_at : null,
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
      autoplay: playlist.autoplay,
      loop: playlist.loop,
      brand: (Array.isArray(playlist.brand) ? playlist.brand[0] : playlist.brand) || '',
      is_scheduled: playlist.is_scheduled || false,
      start_at: playlist.start_at || '',
      end_at: playlist.end_at || ''
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
      autoplay: true,
      loop: true,
      brand: '',
      is_scheduled: false,
      start_at: '',
      end_at: ''
    });
    setPlaylistItems([]);
    setEditingPlaylist(null);
  };

  const getBrandLogo = (brandName) => {
    const brand = brands.find(b => b.name === brandName);
    return brand?.logo_url;
  };

  const calculateTotalDuration = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((total, item) => {
      // Use item.duration if set, otherwise try to find content default duration
      const itemDuration = parseInt(item.duration) || 10;
      return total + itemDuration;
    }, 0);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Brands logic
  const [selectedBrands, setSelectedBrands] = useState([]);

  const filteredPlaylists = selectedBrands.length === 0
    ? playlists
    : playlists.filter(p => selectedBrands.includes(p.brand));

  const toggleBrandFilter = (brandName) => {
    if (selectedBrands.includes(brandName)) {
      setSelectedBrands(selectedBrands.filter(b => b !== brandName));
    } else {
      setSelectedBrands([...selectedBrands, brandName]);
    }
  };

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

  const sortedPlaylists = [...filteredPlaylists].sort((a, b) => {
    // If one is scheduled and other is not, scheduled comes first
    if (a.is_scheduled && !b.is_scheduled) return -1;
    if (!a.is_scheduled && b.is_scheduled) return 1;

    // If both scheduled, sort by start_at
    if (a.is_scheduled && b.is_scheduled) {
      if (!a.start_at) return 1;
      if (!b.start_at) return -1;
      return new Date(a.start_at) - new Date(b.start_at);
    }

    // Default: sort by created_at (desc)
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

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
                    <DialogDescription className="hidden">
                      Detalii despre playlist-ul tău.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nume playlist</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ex: Meniu Prânz"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="brand">Brand</Label>
                        <Select
                          value={formData.brand}
                          onValueChange={(value) => setFormData({ ...formData, brand: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează brand" />
                          </SelectTrigger>
                          <SelectContent>
                            {brands.map(brand => (
                              <SelectItem key={brand.id} value={brand.name || "unknown"}>{brand.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
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
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.is_scheduled}
                          onChange={(e) => setFormData({ ...formData, is_scheduled: e.target.checked })}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Programează</span>
                      </label>
                    </div>

                    {formData.is_scheduled && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                          <Label htmlFor="start_at" className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Începe la</Label>
                          <Input
                            id="start_at"
                            type="datetime-local"
                            value={formData.start_at ? formData.start_at.substring(0, 16) : ''}
                            onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                            className="bg-white border-indigo-200 focus:border-indigo-500 rounded-lg shadow-sm h-10"
                            required={formData.is_scheduled}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="end_at" className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Se termină la</Label>
                          <Input
                            id="end_at"
                            type="datetime-local"
                            value={formData.end_at ? formData.end_at.substring(0, 16) : ''}
                            onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                            className="bg-white border-indigo-200 focus:border-indigo-500 rounded-lg shadow-sm h-10"
                            required={formData.is_scheduled}
                          />
                        </div>
                      </div>
                    )}

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
                                <div className="w-20 h-14 rounded-lg border border-slate-100 overflow-hidden shrink-0 bg-black flex items-center justify-center shadow-sm relative group/thumb">
                                  {item.type === 'video' ? (
                                    <>
                                      {item.thumbnail_url ? (
                                        <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover group-hover:hidden" />
                                      ) : null}
                                      <video
                                        src={item.file_url}
                                        className={`w-full h-full object-cover ${item.thumbnail_url ? 'hidden group-hover:block' : ''}`}
                                        muted
                                        playsInline
                                        onMouseOver={(e) => e.target.play()}
                                        onMouseOut={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                                      />
                                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity">
                                        <Film className="w-4 h-4 text-white shadow-sm" />
                                      </div>
                                    </>
                                  ) : (
                                    <img src={item.thumbnail_url || item.file_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
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
                          Playlist ({playlistItems.length} elemente • {formatDuration(calculateTotalDuration(playlistItems))})
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

                                    <div className="w-24 h-16 rounded-xl border-2 border-slate-50 overflow-hidden shrink-0 bg-black flex items-center justify-center shadow-inner relative group/item-thumb">
                                      {contentItem?.type === 'video' ? (
                                        <>
                                          {contentItem.thumbnail_url ? (
                                            <img src={contentItem.thumbnail_url} alt="" className="w-full h-full object-cover group-hover/item-thumb:hidden" />
                                          ) : null}
                                          <video
                                            src={contentItem.file_url}
                                            className={`w-full h-full object-cover ${contentItem.thumbnail_url ? 'hidden group-hover/item-thumb:block' : ''}`}
                                            muted
                                            playsInline
                                            onMouseOver={(e) => e.target.play()}
                                            onMouseOut={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                                          />
                                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-100 group-hover/item-thumb:opacity-0 transition-opacity">
                                            <Film className="w-4 h-4 text-white shadow-sm" />
                                          </div>
                                        </>
                                      ) : contentItem?.thumbnail_url || (contentItem?.type === 'image' && contentItem?.file_url) ? (
                                        <img src={contentItem.thumbnail_url || contentItem.file_url} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                          <ImageIcon className="w-5 h-5" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 pr-8">
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

                                    {/* Delete button (Absolute) */}
                                    <button
                                      type="button"
                                      onClick={() => removeFromPlaylist(index)}
                                      className="absolute top-2 right-2 p-1.5 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-all shadow-sm"
                                      title="Șterge element"
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
            <div className="flex items-center gap-3 overflow-x-auto py-2 max-w-4xl scrollbar-hide">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-2 shrink-0">Filtrează:</span>
              <div className="flex gap-2">
                {brands.map(brand => {
                  const count = playlists.filter(p =>
                    p.items && p.items.some(i => i.brand === brand.name || (Array.isArray(i.brand) && i.brand.includes(brand.name)))
                  ).length;

                  return (
                    <button
                      key={brand.id}
                      onClick={() => toggleBrandFilter(brand.name)}
                      className={`relative group transition-all duration-200 ${selectedBrands.includes(brand.name) ? 'scale-110 opacity-100' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                      title={`${brand.name} (${count})`}
                    >
                      <div className={`w-8 h-8 flex items-center justify-center overflow-hidden transition-all rounded-md bg-white shadow-sm border ${selectedBrands.includes(brand.name) ? 'border-indigo-500' : 'border-slate-100'}`}>
                        {brand.logo_url ? (
                          <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain p-0.5" />
                        ) : (
                          <span className="text-[8px] font-bold text-slate-400">{brand.name?.substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      {selectedBrands.includes(brand.name) && (
                        <div className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-0.5 bg-red-600 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-white shadow-sm z-20 animate-in zoom-in duration-200">
                          {count}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedBrands.length > 0 && (
                <button
                  onClick={() => setSelectedBrands([])}
                  className="ml-2 px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors uppercase tracking-wider"
                >
                  Resetează
                </button>
              )}
            </div>

            <div className="flex-1"></div>

            <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200 shrink-0">
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
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Calendar"
              >
                <CalendarIcon className="w-4 h-4" />
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
                        <div className="flex items-center gap-3">
                          {playlist.brand && getBrandLogo(playlist.brand) && (
                            <div className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center bg-white overflow-hidden shrink-0 shadow-sm">
                              <img src={getBrandLogo(playlist.brand)} alt="" className="w-full h-full object-contain" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            {playlist.brand && <span className="text-[10px] font-bold text-indigo-600 uppercase mb-0.5">{playlist.brand}</span>}
                            <span>{playlist.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs">
                          <span className="text-slate-700 font-medium">{playlist.created_by_name || 'System'}</span>
                          <span className="text-slate-400">
                            {playlist.created_at ? new Date(playlist.created_at).toLocaleDateString('ro-RO') : '-'}
                          </span>
                          {playlist.is_scheduled && playlist.start_at && (
                            <div className="mt-1 flex items-center gap-1 text-indigo-600 font-bold">
                              <Clock className="w-3 h-3" />
                              <span>{format(new Date(playlist.start_at), 'dd.MM HH:mm', { locale: ro })}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-tight">
                          {playlist.items?.length || 0} elemente • {formatDuration(calculateTotalDuration(playlist.items))}
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
                          {playlist.is_scheduled && (
                            <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter flex items-center gap-1">
                              <CalendarIcon className="w-2.5 h-2.5" />
                              Programat
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
        ) : viewMode === 'calendar' ? (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden flex flex-col min-h-[700px]">
            {/* Calendar Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-2xl">
                  <CalendarIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 capitalize leading-tight">
                    {format(currentMonth, 'MMMM yyyy', { locale: ro })}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Calendar Programe</p>
                </div>
              </div>
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 hover:bg-white rounded-xl transition-all text-slate-600 hover:text-indigo-600 shadow-sm hover:shadow"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-px bg-slate-200 mx-1"></div>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 hover:bg-white rounded-xl transition-all text-slate-600 hover:text-indigo-600 shadow-sm hover:shadow"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto bg-slate-50/30 p-4">
              <div className="grid grid-cols-7 gap-3 h-full">
                {['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].map(day => (
                  <div key={day} className="py-3 text-center text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{day}</div>
                ))}

                {(() => {
                  const monthStart = startOfMonth(currentMonth);
                  const monthEnd = endOfMonth(monthStart);
                  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
                  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
                  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

                  return calendarDays.map((date, idx) => {
                    const dayPlaylists = sortedPlaylists.filter(p =>
                      p.is_scheduled && p.start_at && isSameDay(new Date(p.start_at), date)
                    );

                    return (
                      <div
                        key={idx}
                        className={`min-h-[140px] p-3 rounded-2xl border transition-all ${!isSameMonth(date, monthStart)
                          ? 'bg-slate-50/50 border-transparent opacity-30 select-none'
                          : isSameDay(date, new Date())
                            ? 'bg-white border-indigo-400 shadow-[0_8px_30px_rgb(79,70,229,0.12)] ring-1 ring-indigo-400 ring-offset-4'
                            : 'bg-white border-slate-100/80 hover:border-indigo-200 shadow-sm hover:shadow-md'
                          }`}
                      >
                        <div className="flex flex-col gap-2 h-full">
                          <span className={`text-sm font-black w-8 h-8 flex items-center justify-center rounded-xl transition-colors ${isSameDay(date, new Date())
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'text-slate-400 group-hover:text-indigo-600'
                            }`}>
                            {format(date, 'd')}
                          </span>

                          <div className="space-y-1.5 overflow-hidden flex-1">
                            {dayPlaylists.map(p => (
                              <div
                                key={p.id}
                                onClick={() => handleEdit(p)}
                                className="px-2 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] font-bold text-indigo-700 truncate hover:bg-indigo-600 hover:text-white transition-all cursor-pointer group shadow-sm flex items-center gap-1.5"
                                title={`${format(new Date(p.start_at), 'HH:mm')} - ${p.name}`}
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 group-hover:bg-white shrink-0"></div>
                                <span className="font-black text-[9px] opacity-70 italic">{format(new Date(p.start_at), 'HH:mm')}</span>
                                <span className="truncate">{p.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPlaylists.map((playlist) => (
              <div key={playlist.id} className="glass-card p-6 flex flex-col h-full hover:shadow-lg transition-all border-slate-200/60" data-testid={`playlist-card-${playlist.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col">
                    {playlist.brand && (
                      <div className="flex items-center gap-2 mb-1">
                        {getBrandLogo(playlist.brand) && (
                          <div className="w-6 h-6 rounded-md border border-slate-100 flex items-center justify-center bg-white overflow-hidden shrink-0">
                            <img src={getBrandLogo(playlist.brand)} alt="" className="w-full h-full object-contain" />
                          </div>
                        )}
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest underline decoration-2 decoration-indigo-200 underline-offset-4">
                          {playlist.brand}
                        </span>
                      </div>
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

                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 mb-5 flex-1 flex flex-col items-center justify-center min-h-[120px]">
                  <div className="text-center mb-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-black text-slate-700 tracking-tighter">
                        {formatDuration(calculateTotalDuration(playlist.items))}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Durată totală</p>
                  </div>

                  <div className="flex items-center justify-between w-full mt-auto">
                    <div className="flex -space-x-4 overflow-hidden py-1 pl-1">
                      {playlist.items?.slice(0, 3).map((item, idx) => {
                        const itemContent = content.find(c => c.id === item.content_id);
                        if (!itemContent) return null;
                        return (
                          <div key={idx} className="inline-block h-12 w-12 rounded-full ring-2 ring-white bg-slate-100 overflow-hidden relative shadow-sm">
                            {itemContent.type === 'video' ? (
                              <video src={itemContent.file_url} className="h-full w-full object-cover" muted />
                            ) : (itemContent.thumbnail_url || itemContent.file_url) ? (
                              <img src={itemContent.thumbnail_url || itemContent.file_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-slate-400">?</div>
                            )}
                          </div>
                        );
                      })}
                      {(playlist.items?.length || 0) > 3 && (
                        <div className="inline-block h-12 w-12 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm">
                          +{playlist.items.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mr-1">
                        {playlist.items?.length || 0} fișiere
                      </span>
                      {playlist.loop && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-white" title="Loop activ"></div>}
                      {playlist.autoplay && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" title="Autoplay activ"></div>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1.5">
                    <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${playlist.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {playlist.status === 'active' ? 'Filtrul Activ' : 'Inactiv'}
                    </div>
                    {playlist.is_scheduled && playlist.start_at && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-wider border border-indigo-100/50 shadow-sm">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        <span>{format(new Date(playlist.start_at), 'dd MMM HH:mm', { locale: ro })}</span>
                      </div>
                    )}
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
    </DashboardLayout >
  );
};
