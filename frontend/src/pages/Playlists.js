import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { List as ListIcon, Plus, Edit, Trash2, ArrowUp, ArrowDown, LayoutGrid, Film, ImageIcon, Clock, Copy, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Folder, FolderOpen, Monitor, MapPin, Filter, Airplay, Eye } from 'lucide-react';
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
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, isSameWeek, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';
import { EventsCalendar } from '../components/EventsCalendar';
import { PlaylistSimulation } from '../components/PlaylistSimulation';

export const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [happyHours, setHappyHours] = useState([]);
  const [content, setContent] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    autoplay: true,
    loop: true,
    brand: '',
    color: '#EF4444',
    is_scheduled: false,
    start_at: '',
    end_at: ''
  });
  const [brands, setBrands] = useState([]);
  const [screens, setScreens] = useState([]);
  const [locations, setLocations] = useState([]);
  const [playlistItems, setPlaylistItems] = useState([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [viewMode, setViewMode] = useViewMode('view_mode_playlists', 'grid');

  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState('week');
  // Fix: Add missing state for selectedPlaylists
  const [selectedPlaylists, setSelectedPlaylists] = useState([]);
  const [showSimulation, setShowSimulation] = useState(false);
  const [filterWithScreens, setFilterWithScreens] = useState(true); // Default to true
  const [selectedLocationForScreens, setSelectedLocationForScreens] = useState(null);

  // Drag & Drop state
  const [draggedPlaylistId, setDraggedPlaylistId] = useState(null);
  const [droppingOnScreenId, setDroppingOnScreenId] = useState(null);
  const [showScreensPanel, setShowScreensPanel] = useState(true);
  const [screenAssignOpen, setScreenAssignOpen] = useState(null); // playlist id with open dropdown

  // Screen zones (active content per screen)
  const [screenZones, setScreenZones] = useState({});
  const [screenLocationFilter, setScreenLocationFilter] = useState('all');

  useEffect(() => {
    loadData();
    // Update current date every minute to keep the red line accurate
    const interval = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [playlistsRes, contentRes, brandsRes, screensRes, locationsRes, happyHoursRes, foldersRes] = await Promise.all([
        api.get(`/playlists?t=${new Date().getTime()}`),
        api.get('/content'),
        api.get('/brands'),
        api.get('/screens'),
        api.get('/locations'),
        api.get('/happy-hours'),
        api.get('/content/folders')
      ]);
      setPlaylists(playlistsRes.data);
      setContent(contentRes.data);
      setBrands(brandsRes.data);
      setScreens(screensRes.data);
      setLocations(locationsRes.data);
      setHappyHours(happyHoursRes.data);
      setFolders(foldersRes.data);

      // Load screen zones for all screens to show active content
      const zonesMap = {};
      await Promise.all(
        screensRes.data.map(async (screen) => {
          try {
            const zonesRes = await api.get(`/screen-zones/${screen.id}`);
            zonesMap[screen.id] = zonesRes.data;
          } catch (e) {
            zonesMap[screen.id] = [];
          }
        })
      );
      setScreenZones(zonesMap);
    } catch (error) {
      toast.error('Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        brand: formData.brand ? [formData.brand] : [],
        start_at: (formData.is_scheduled && formData.start_at) ? formData.start_at : null,
        end_at: (formData.is_scheduled && formData.end_at) ? formData.end_at : null,
        items: playlistItems.map((item, index) => ({
          content_id: item.content_id,
          order: index,
          duration: item.duration || 10
        })),
        screen_ids: formData.is_scheduled ? formData.screen_ids : []
      };

      let playlistId;
      if (editingPlaylist) {
        await api.put(`/playlists/${editingPlaylist.id}`, dataToSend);
        playlistId = editingPlaylist.id;
        toast.success('Playlist actualizat!');
      } else {
        const response = await api.post('/playlists', dataToSend);
        playlistId = response.data.id;
        toast.success('Playlist creat!');
      }

      // Sync screen zones with formData.screen_ids
      const selectedScreenIds = formData.screen_ids || [];
      console.log('Syncing screen zones for playlist:', playlistId);
      console.log('Selected screen IDs:', selectedScreenIds);

      // For each screen, check if it should have this playlist assigned
      for (const screen of screens) {
        const screenIdStr = String(screen.id);
        const zones = screenZones[screen.id] || [];
        const existingZone = zones.find(z => z.content_type === 'playlist' && z.playlist_id === playlistId);
        const shouldBeAssigned = selectedScreenIds.includes(screenIdStr);

        console.log(`Screen ${screen.name} (${screenIdStr}): shouldBeAssigned=${shouldBeAssigned}, existingZone=${!!existingZone}`);

        if (shouldBeAssigned && !existingZone) {
          // Add zone
          try {
            console.log(`Adding zone for screen ${screen.name}`);
            await api.post('/screen-zones', {
              screen_id: screen.id,
              zone_id: 'zone1',
              content_type: 'playlist',
              playlist_id: playlistId
            });
          } catch (e) {
            console.error('Error adding zone:', e);
          }
        } else if (!shouldBeAssigned && existingZone) {
          // Remove zone
          try {
            console.log(`Removing zone ${existingZone.id} for screen ${screen.name}`);
            await api.delete(`/screen-zones/${existingZone.id}`);
          } catch (e) {
            console.error('Error removing zone:', e);
          }
        }
      }

      console.log('Screen zones sync completed');

      // Reload screen zones to ensure UI is up to date
      const zonesMap = {};
      await Promise.all(
        screens.map(async (screen) => {
          try {
            const zonesRes = await api.get(`/screen-zones/${screen.id}`);
            zonesMap[screen.id] = zonesRes.data;
          } catch (e) {
            zonesMap[screen.id] = [];
          }
        })
      );
      setScreenZones(zonesMap);

      setShowDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Eroare la salvare');
    }
  };

  const handleEdit = (playlist) => {
    setEditingPlaylist(playlist);

    // Load screen IDs from screen zones instead of playlist.screen_ids
    // This ensures consistency with the Airplay dialog
    const screenIdsFromZones = screens
      .filter(screen => {
        const zones = screenZones[screen.id] || [];
        return zones.some(z => z.content_type === 'playlist' && z.playlist_id === playlist.id);
      })
      .map(screen => String(screen.id)); // Ensure IDs are strings

    console.log('Editing playlist:', playlist.id, playlist.name);
    console.log('Screen IDs from zones:', screenIdsFromZones);
    console.log('Total screens:', screens.length);
    console.log('Screen zones:', screenZones);
    console.log('Sample screen ID type:', typeof screens[0]?.id);

    // Auto-select the first location that has selected screens
    if (screenIdsFromZones.length > 0) {
      const firstSelectedScreen = screens.find(s => screenIdsFromZones.includes(String(s.id)));
      if (firstSelectedScreen) {
        setSelectedLocationForScreens(firstSelectedScreen.location_id);
      }
    }

    setFormData({
      name: playlist.name,
      autoplay: playlist.autoplay,
      loop: playlist.loop,
      brand: (Array.isArray(playlist.brand) ? playlist.brand[0] : playlist.brand) || '',
      color: playlist.color || '#EF4444',
      is_scheduled: playlist.is_scheduled || false,
      start_at: playlist.start_at || '',
      end_at: playlist.end_at || '',
      screen_ids: screenIdsFromZones
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
        brand: playlist.brand || [],
        items: (playlist.items || []).map((item, index) => ({
          content_id: item.content_id,
          order: index,
          duration: item.duration || 10
        })),
        is_scheduled: false,
        screen_ids: []
      };

      await api.post('/playlists', duplicatedData);
      toast.success('Playlist duplicat cu succes!');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Eroare la duplicare');
    }
  };

  const handleToggleStatus = async (playlist) => {
    try {
      const newStatus = playlist.status === 'active' ? 'inactive' : 'active';
      await api.put(`/playlists/${playlist.id}`, { ...playlist, status: newStatus });
      toast.success(`Playlist ${newStatus === 'active' ? 'activat' : 'dezactivat'}!`);
      loadData();
    } catch (error) {
      toast.error('Eroare la schimbarea statusului');
    }
  };

  const addContentToPlaylist = (contentId) => {
    const contentItem = getContentById(contentId);
    // Auto-detect duration from content metadata if available
    const defaultDuration = contentItem?.duration || 10;

    setPlaylistItems([...playlistItems, {
      content_id: contentId,
      order: playlistItems.length,
      duration: defaultDuration
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
      color: '#EF4444',
      is_scheduled: false,
      start_at: '',
      end_at: '',
      screen_ids: []
    });
    setPlaylistItems([]);
    setEditingPlaylist(null);
    setLocationSearch('');
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

  const calculateEffectiveHours = (playlist, dayDate) => {
    if (!playlist.is_scheduled || !playlist.start_at) return null;

    // Operating window: 10:00 - 22:00
    const startLimit = new Date(dayDate);
    startLimit.setHours(10, 0, 0, 0);
    const endLimit = new Date(dayDate);
    endLimit.setHours(22, 0, 0, 0);

    const pStart = new Date(playlist.start_at);
    const pEnd = playlist.end_at ? new Date(playlist.end_at) : endLimit;

    const effectiveStart = new Date(Math.max(pStart.getTime(), startLimit.getTime()));
    const effectiveEnd = new Date(Math.min(pEnd.getTime(), endLimit.getTime()));

    if (effectiveStart >= effectiveEnd) return null;

    const durationMs = effectiveEnd - effectiveStart;
    const hours = (durationMs / (1000 * 60 * 60)).toFixed(1);

    return {
      start: format(effectiveStart, 'HH:mm'),
      end: format(effectiveEnd, 'HH:mm'),
      hours: parseFloat(hours).toString() + 'h'
    };
  };

  // Drag & Drop: assign playlist to screen
  const handleDropOnScreen = async (screenId) => {
    if (!draggedPlaylistId) return;
    const playlist = playlists.find(p => p.id === draggedPlaylistId);
    const screen = screens.find(s => s.id === screenId);
    if (!playlist || !screen) return;

    try {
      // Assign to the first zone (zone1) with content_type 'playlist'
      await api.post('/screen-zones', {
        screen_id: screenId,
        zone_id: 'zone1',
        content_type: 'playlist',
        playlist_id: draggedPlaylistId
      });
      toast.success(`"${playlist.name}" atribuit lui "${screen.name}"`);
      // Refresh zones for this screen to update active content display
      try {
        const zonesRes = await api.get(`/screen-zones/${screenId}`);
        setScreenZones(prev => ({ ...prev, [screenId]: zonesRes.data }));
      } catch (e) { }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Eroare la atribuire');
    } finally {
      setDraggedPlaylistId(null);
      setDroppingOnScreenId(null);
    }
  };

  // Toggle screen assignment for a playlist (from card button)
  const handleToggleScreenAssign = async (playlistId, screenId) => {
    const zones = screenZones[screenId] || [];
    const existingZone = zones.find(z => z.content_type === 'playlist' && z.playlist_id === playlistId);

    try {
      if (existingZone) {
        // Unassign
        await api.delete(`/screen-zones/${existingZone.id}`);
        toast.success('Playlist dezatribuit de pe ecran');
      } else {
        // Assign
        await api.post('/screen-zones', {
          screen_id: screenId,
          zone_id: 'zone1',
          content_type: 'playlist',
          playlist_id: playlistId
        });
        const screen = screens.find(s => s.id === screenId);
        toast.success(`Playlist atribuit lui "${screen?.name}"`);
      }
      // Refresh zones for this screen
      const zonesRes = await api.get(`/screen-zones/${screenId}`);
      setScreenZones(prev => ({ ...prev, [screenId]: zonesRes.data }));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Eroare la atribuire');
    }
  };

  // Check if a playlist is assigned to a screen
  const isPlaylistOnScreen = (playlistId, screenId) => {
    const zones = screenZones[screenId] || [];
    return zones.some(z => z.content_type === 'playlist' && z.playlist_id === playlistId);
  };

  // Brands logic
  const [selectedBrands, setSelectedBrands] = useState([]);

  const filteredPlaylists = selectedBrands.length === 0
    ? playlists
    : playlists.filter(p => {
      const brand = Array.isArray(p.brand) ? p.brand[0] : p.brand;
      return selectedBrands.includes(brand);
    });

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

  // Group sorted playlists by location (via assigned screens)
  const getPlaylistLocationIds = (playlistId) => {
    const assignedScreens = screens.filter(s => isPlaylistOnScreen(playlistId, s.id));
    const locIds = [...new Set(assignedScreens.map(s => s.location_id).filter(Boolean))];
    return locIds.length > 0 ? locIds : [null]; // null = no location
  };

  const getLocationName = (locationId) => {
    if (!locationId) return 'Fără locație';
    return locations.find(l => l.id === locationId)?.name || 'Locație necunoscută';
  };

  const playlistsByLocation = {};
  sortedPlaylists.forEach(playlist => {
    const locIds = getPlaylistLocationIds(playlist.id);
    locIds.forEach(locId => {
      const key = locId || '__none__';
      if (!playlistsByLocation[key]) playlistsByLocation[key] = [];
      playlistsByLocation[key].push(playlist);
    });
  });

  const sortedPlaylistLocationGroups = Object.entries(playlistsByLocation).sort((a, b) => {
    if (a[0] === '__none__') return 1;
    if (b[0] === '__none__') return -1;
    return getLocationName(a[0]).localeCompare(getLocationName(b[0]));
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
    <>
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
                  <DialogContent className="glass-panel max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle>
                        {editingPlaylist ? 'Editează playlist-ul' : 'Creează playlist nou'}
                      </DialogTitle>
                      <DialogDescription className="hidden">
                        Detalii despre playlist-ul tău.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto pr-1" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-4 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 space-y-1.5">
                              <Label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nume playlist</Label>
                              <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="font-medium bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                placeholder="Ex: Campanie Primăvară 2024"
                              />
                            </div>

                            <div className="space-y-1.5 w-[160px]">
                              <Label htmlFor="brand" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Brand</Label>
                              <Select
                                value={formData.brand}
                                onValueChange={(value) => setFormData({ ...formData, brand: value })}
                              >
                                <SelectTrigger className="bg-slate-50 border-slate-200">
                                  <SelectValue placeholder="Brand" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unknown">Fără brand</SelectItem>
                                  {brands.map(brand => (
                                    <SelectItem key={brand.id} value={brand.name || "unknown"}>
                                      <div className="flex items-center gap-2">
                                        {brand.logo_url && (
                                          <img src={brand.logo_url} alt="" className="w-4 h-4 object-contain" />
                                        )}
                                        <span>{brand.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5 flex-1 max-w-[60px]">
                              <Label htmlFor="color" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Culoare</Label>
                              <div className="relative w-10 h-10 rounded-lg border border-slate-200 shadow-sm overflow-hidden shrink-0 cursor-pointer hover:scale-105 transition-transform" style={{ backgroundColor: formData.color }}>
                                <input
                                  type="color"
                                  id="color"
                                  value={formData.color}
                                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  title="Alege culoare"
                                />
                              </div>
                            </div>
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
                              onChange={(e) => {
                                const checked = e.target.checked;
                                // Calculate local ISO string for defaults
                                const now = new Date();
                                const toLocalISO = (date) => {
                                  const offsetMs = date.getTimezoneOffset() * 60000;
                                  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
                                };

                                const defaultStart = toLocalISO(now);
                                // Default end NO LONGER set automatically to allow infinite play

                                setFormData({
                                  ...formData,
                                  is_scheduled: checked,
                                  start_at: checked && !formData.start_at ? defaultStart : formData.start_at,
                                  end_at: checked ? formData.end_at : '' // Keep existing or reset if unchecked
                                });
                              }}
                              className="rounded text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm font-medium text-slate-700">Programează</span>
                          </label>
                        </div>

                        {formData.is_scheduled && (
                          <div className="grid grid-cols-2 gap-4 p-4 bg-red-50/50 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-2">
                              <Label htmlFor="start_at" className="text-xs font-bold text-red-700 uppercase tracking-wider">Începe la</Label>
                              <Input
                                id="start_at"
                                type="datetime-local"
                                value={formData.start_at ? formData.start_at.substring(0, 16) : ''}
                                onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                                className="bg-white border-red-200 focus:border-red-500 rounded-lg shadow-sm h-10"
                                required={formData.is_scheduled}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="end_at" className="text-xs font-bold text-red-700 uppercase tracking-wider">Se termină la (Opțional)</Label>
                              <Input
                                id="end_at"
                                type="datetime-local"
                                value={formData.end_at ? formData.end_at.substring(0, 16) : ''}
                                onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                                className="bg-white border-red-200 focus:border-red-500 rounded-lg shadow-sm h-10"
                              />
                              <p className="text-[10px] text-slate-500">Lasă gol pentru a rula până la oprire manuală</p>
                            </div>
                          </div>
                        )}

                        {/* Screen selection - always visible */}
                        <div className="space-y-2 mt-2 p-4 bg-slate-50/50 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Selectează Ecrane {formData.screen_ids?.length > 0 && <span className="ml-1 text-red-500 font-normal">({formData.screen_ids.length} selectate)</span>}
                            </Label>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-medium text-slate-600 hover:text-red-600">
                                <input
                                  type="checkbox"
                                  checked={filterWithScreens}
                                  onChange={(e) => setFilterWithScreens(e.target.checked)}
                                  className="rounded w-3 h-3 text-red-600 focus:ring-1 focus:ring-red-500 border-slate-300"
                                />
                                Doar locații cu ecrane
                              </label>
                            </div>
                          </div>

                          {/* Split layout: Locations (left) + Screens (right) */}
                          <div className="grid grid-cols-2 gap-0 bg-white rounded-xl border border-slate-200 overflow-hidden" style={{ minHeight: '180px' }}>
                            {/* Left: Locations */}
                            <div className="border-r border-slate-100">
                              <div className="p-2 border-b border-slate-100 bg-slate-50">
                                <input
                                  type="text"
                                  placeholder="🔍 Caută locație..."
                                  value={locationSearch}
                                  onChange={(e) => setLocationSearch(e.target.value)}
                                  className="w-full text-xs p-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-red-500 outline-none bg-white"
                                />
                              </div>
                              <div className="max-h-40 overflow-y-auto">
                                {/* Select All */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (screens.length > 0 && formData.screen_ids?.length === screens.length) {
                                      setFormData(prev => ({ ...prev, screen_ids: [] }));
                                    } else {
                                      setFormData(prev => ({ ...prev, screen_ids: screens.map(s => s.id) }));
                                    }
                                  }}
                                  className="w-full flex items-center gap-2 text-xs px-3 py-2 font-bold text-red-700 border-b border-red-100 hover:bg-red-50 transition-colors text-left"
                                >
                                  <input
                                    type="checkbox"
                                    checked={screens.length > 0 && formData.screen_ids?.length === screens.length}
                                    readOnly
                                    className="rounded text-red-600 focus:ring-red-500 w-3 h-3 pointer-events-none"
                                  />
                                  <span>Selectează Tot</span>
                                </button>

                                {locations
                                  .filter(loc => loc.name.toLowerCase().includes(locationSearch.toLowerCase()))
                                  .map(loc => {
                                    const locScreens = screens.filter(s => s.location_id === loc.id);
                                    if (filterWithScreens && locScreens.length === 0) return null;

                                    const allSelected = locScreens.length > 0 && locScreens.every(s => formData.screen_ids?.includes(s.id));
                                    const someSelected = locScreens.some(s => formData.screen_ids?.includes(s.id));
                                    const isActive = selectedLocationForScreens === loc.id;

                                    return (
                                      <button
                                        key={loc.id}
                                        type="button"
                                        onClick={() => setSelectedLocationForScreens(isActive ? null : loc.id)}
                                        className={`w-full flex items-center gap-2 text-xs px-3 py-2 transition-colors text-left border-b border-slate-50 last:border-0 ${isActive ? 'bg-red-50 border-l-2 border-l-red-500' : 'hover:bg-slate-50'
                                          }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={allSelected}
                                          ref={input => { if (input) input.indeterminate = someSelected && !allSelected; }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const checked = !allSelected;
                                            const screenIds = locScreens.map(s => s.id);
                                            setFormData(prev => {
                                              const current = new Set(prev.screen_ids || []);
                                              if (checked) {
                                                screenIds.forEach(id => current.add(id));
                                              } else {
                                                screenIds.forEach(id => current.delete(id));
                                              }
                                              return { ...prev, screen_ids: Array.from(current) };
                                            });
                                          }}
                                          readOnly
                                          className="rounded text-red-600 focus:ring-red-500 w-3 h-3 cursor-pointer"
                                        />
                                        <span className="font-medium text-slate-700 flex-1 truncate">{loc.name}</span>
                                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full shrink-0">{locScreens.length}</span>
                                      </button>
                                    );
                                  })
                                }
                              </div>
                            </div>

                            {/* Right: Screens for selected location */}
                            <div className="bg-slate-50/50">
                              <div className="p-2 border-b border-slate-100 bg-slate-50">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  {selectedLocationForScreens
                                    ? `Ecrane — ${locations.find(l => l.id === selectedLocationForScreens)?.name || ''}`
                                    : 'Selectează o locație ←'
                                  }
                                </span>
                              </div>
                              <div className="max-h-40 overflow-y-auto p-2">
                                {!selectedLocationForScreens ? (
                                  <div className="flex items-center justify-center h-28 text-xs text-slate-400">
                                    <span>Click pe o locație din stânga</span>
                                  </div>
                                ) : (
                                  <div className="space-y-1.5">
                                    {screens
                                      .filter(s => s.location_id === selectedLocationForScreens)
                                      .map(screen => {
                                        const screenIdStr = String(screen.id);
                                        const isChecked = formData.screen_ids?.includes(screenIdStr) || false;

                                        return (
                                          <label
                                            key={screen.id}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer transition-all border ${isChecked
                                              ? 'bg-red-100 border-red-300 text-red-700 font-bold shadow-sm'
                                              : 'bg-white border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-200'
                                              }`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={(e) => {
                                                const checked = e.target.checked;
                                                setFormData(prev => {
                                                  const currentIds = prev.screen_ids || [];
                                                  if (checked) {
                                                    return { ...prev, screen_ids: [...currentIds, screenIdStr] };
                                                  } else {
                                                    return { ...prev, screen_ids: currentIds.filter(id => id !== screenIdStr) };
                                                  }
                                                });
                                              }}
                                              className="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                                            />
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${isChecked ? 'bg-red-500' : 'bg-slate-300'}`} />
                                            {screen.name}
                                          </label>
                                        );
                                      })}
                                    {screens.filter(s => s.location_id === selectedLocationForScreens).length === 0 && (
                                      <div className="text-center py-4 text-xs text-slate-400 italic">
                                        Niciun ecran la această locație
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {screens.length === 0 && (
                            <div className="text-center py-4 text-xs text-slate-400 italic">
                              Nu există ecrane disponibile. Adaugă ecrane din meniul Ecrane.
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label className="text-base font-bold text-slate-700 flex items-center gap-2">
                              <Plus className="w-4 h-4 text-emerald-500" />
                              Conținut disponibil
                            </Label>
                            <div className="max-h-[500px] overflow-y-auto space-y-2 border border-slate-100 rounded-2xl p-4 bg-slate-50 shadow-inner">
                              {/* Named folder sections first */}
                              {folders.map(folder => {
                                const folderItems = content.filter(item => String(item.folder_id) === String(folder.id));
                                if (folderItems.length === 0) return null;

                                const isIconUrl = folder.icon && (folder.icon.startsWith('http') || folder.icon.startsWith('/') || folder.icon.startsWith('data:'));

                                return (
                                  <details key={folder.id} className="group/folder">
                                    <summary className="flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-lg cursor-pointer hover:bg-slate-50 transition-all mb-2">
                                      {isIconUrl ? (
                                        <div className="w-4 h-4 rounded overflow-hidden shrink-0 border border-slate-200/60 bg-white">
                                          <img src={folder.icon} alt={folder.name} className="w-full h-full object-cover" />
                                        </div>
                                      ) : (
                                        <Folder className="w-4 h-4 shrink-0" style={{ color: folder.color }} fill={folder.color} />
                                      )}
                                      <span className="text-sm font-bold text-slate-700 flex-1">{folder.name}</span>
                                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{folderItems.length}</span>
                                    </summary>
                                    <div className="ml-6 mt-2 space-y-2">
                                      {folderItems.map(item => (
                                        <div
                                          key={item.id}
                                          className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg hover:border-red-200 hover:shadow-sm transition-all group"
                                        >
                                          <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded border border-slate-100 overflow-hidden shrink-0 bg-black flex items-center justify-center shadow-sm relative group/thumb">
                                              {item.type === 'video' ? (
                                                item.thumbnail_url ? (
                                                  <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                    <Film className="w-4 h-4 text-slate-400" />
                                                  </div>
                                                )
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
                                            className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white transition-all text-xs font-bold px-3 py-1.5 h-7 rounded-lg border-none shadow-none"
                                          >
                                            Adaugă
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </details>
                                );
                              })}

                              {/* Root/unorganized items - collapsed by default */}
                              {(() => {
                                const rootItems = content.filter(item => !item.folder_id);
                                if (rootItems.length === 0) return null;
                                return (
                                  <details className="group/folder">
                                    <summary className="flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-lg cursor-pointer hover:bg-slate-50 transition-all mb-2">
                                      <FolderOpen className="w-4 h-4 text-slate-400 group-open/folder:text-indigo-600" />
                                      <span className="text-sm font-bold text-slate-700 flex-1">Fără folder</span>
                                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{rootItems.length}</span>
                                    </summary>
                                    <div className="ml-6 mt-2 space-y-2">
                                      {rootItems.map(item => (
                                        <div
                                          key={item.id}
                                          className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg hover:border-red-200 hover:shadow-sm transition-all group"
                                        >
                                          <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded border border-slate-100 overflow-hidden shrink-0 bg-black flex items-center justify-center shadow-sm relative group/thumb">
                                              {item.type === 'video' ? (
                                                item.thumbnail_url ? (
                                                  <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                    <Film className="w-4 h-4 text-slate-400" />
                                                  </div>
                                                )
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
                                            className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white transition-all text-xs font-bold px-3 py-1.5 h-7 rounded-lg border-none shadow-none"
                                          >
                                            Adaugă
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </details>
                                );
                              })()}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-base font-bold text-slate-700 flex items-center gap-2">
                              <ListIcon className="w-4 h-4 text-red-500" />
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
                                      className="bg-white border border-slate-100 rounded-lg p-2 shadow-sm hover:shadow-md transition-all relative group flex items-center gap-3"
                                    >
                                      {/* Order controls */}
                                      <div className="flex flex-col gap-0.5">
                                        <button
                                          type="button"
                                          onClick={() => moveItem(index, 'up')}
                                          disabled={index === 0}
                                          className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors"
                                        >
                                          <ArrowUp className="w-3 h-3 text-slate-400" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => moveItem(index, 'down')}
                                          disabled={index === playlistItems.length - 1}
                                          className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors"
                                        >
                                          <ArrowDown className="w-3 h-3 text-slate-400" />
                                        </button>
                                      </div>

                                      {/* Thumbnail */}
                                      <div className="w-12 h-8 rounded border border-slate-100 overflow-hidden shrink-0 bg-black flex items-center justify-center relative">
                                        {contentItem?.type === 'video' ? (
                                          contentItem?.thumbnail_url ? (
                                            <img src={contentItem.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                              <Film className="w-4 h-4 text-slate-400" />
                                            </div>
                                          )
                                        ) : (
                                          <img src={contentItem?.thumbnail_url || contentItem?.file_url} alt="" className="w-full h-full object-cover" />
                                        )}
                                      </div>

                                      {/* Info */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-black text-red-500">#{index + 1}</span>
                                          <p className="text-xs font-bold text-slate-700 truncate">{contentItem?.title || 'Unknown'}</p>
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5">
                                          <Clock className="w-2.5 h-2.5 text-slate-400" />
                                          <input
                                            type="number"
                                            min="1"
                                            value={item.duration || 10}
                                            onChange={(e) => updateItemDuration(index, e.target.value)}
                                            className="h-5 w-12 px-1 text-[10px] font-bold text-slate-600 bg-slate-50 border-none rounded focus:ring-1 focus:ring-red-500"
                                          />
                                          <span className="text-[9px] text-slate-400 uppercase">sec</span>
                                        </div>
                                      </div>

                                      {/* Delete button */}
                                      <button
                                        type="button"
                                        onClick={() => removeFromPlaylist(index)}
                                        className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-md transition-colors"
                                        title="Șterge"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
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
                    </div>
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
                        <div className={`w-8 h-8 flex items-center justify-center overflow-hidden transition-all rounded-md bg-white shadow-sm border ${selectedBrands.includes(brand.name) ? 'border-red-500' : 'border-slate-100'}`}>
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
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Horizontal Timeline Calendar (Reusable Component) */}
          <EventsCalendar
            playlists={playlists}
            happyHours={happyHours}
            loading={loading}
            onEventClick={(event) => {
              if (event.type === 'playlist') {
                handleEdit(event.original);
              } else {
                // Redirect to happy hour or just show info
                toast.info(`Happy Hour: ${event.original.name}`);
              }
            }}
          />

          {/* Main content: Screens LEFT, Playlists RIGHT */}
          <div className="flex gap-4">
            {/* LEFT: Screens Panel */}
            <div className="w-72 shrink-0">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-4">
                <div className="p-3 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-bold text-slate-700">Ecrane</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">{screens.length}</span>
                    </div>
                  </div>
                  {/* Location filter */}
                  <select
                    value={screenLocationFilter}
                    onChange={(e) => setScreenLocationFilter(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-600 font-medium mb-2"
                  >
                    <option value="all">Toate locațiile</option>
                    {locations
                      .filter(loc => screens.some(s => s.location_id === loc.id))
                      .map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                  </select>
                </div>
                <div className="p-2 max-h-[calc(100vh-280px)] overflow-y-auto space-y-3">
                  {(() => {
                    const filteredLocations = locations.filter(loc => {
                      if (!screens.some(s => s.location_id === loc.id)) return false;
                      if (screenLocationFilter !== 'all' && loc.id !== screenLocationFilter) return false;
                      return true;
                    });
                    if (filteredLocations.length === 0) {
                      return <p className="text-xs text-slate-400 text-center py-4">Nu există ecrane</p>;
                    }
                    return filteredLocations.map(location => {
                      const locationScreens = screens.filter(s => s.location_id === location.id);
                      if (locationScreens.length === 0) return null;
                      return (
                        <div key={location.id}>
                          <div className="flex items-center gap-1.5 px-2 mb-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{location.name}</span>
                          </div>
                          <div className="space-y-1">
                            {locationScreens.map(screen => {
                              const zones = screenZones[screen.id] || [];
                              const activeZone = zones.find(z => z.content_type === 'playlist' && z.playlist_id);
                              const activePlaylist = activeZone ? playlists.find(p => p.id === activeZone.playlist_id) : null;
                              const activeContentZone = zones.find(z => z.content_type === 'single_content' && z.content_id);
                              const activeContent = activeContentZone ? content.find(c => c.id === activeContentZone.content_id) : null;
                              const activeName = activePlaylist?.name || activeContent?.title || null;

                              return (
                                <div
                                  key={screen.id}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    setDroppingOnScreenId(screen.id);
                                  }}
                                  onDragLeave={() => setDroppingOnScreenId(null)}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    handleDropOnScreen(screen.id);
                                  }}
                                  className={`p-2.5 rounded-xl border-2 transition-all ${droppingOnScreenId === screen.id
                                    ? 'border-red-400 bg-red-50 scale-[1.02] shadow-lg'
                                    : draggedPlaylistId
                                      ? 'border-dashed border-slate-300 bg-slate-50 hover:border-red-300 hover:bg-red-50/50'
                                      : 'border-transparent bg-slate-50/50 hover:bg-slate-100/80'
                                    }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Monitor className={`w-5 h-5 shrink-0 ${droppingOnScreenId === screen.id ? 'text-red-500' : 'text-slate-400'
                                      }`} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-slate-700 truncate">{screen.name}</p>
                                      <div className="flex items-center gap-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${screen.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                        <span className="text-[9px] text-slate-400 uppercase font-bold">{screen.status || 'offline'}</span>
                                      </div>
                                    </div>
                                  </div>
                                  {activeName && (
                                    <div className="mt-1.5 ml-7">
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold truncate block"
                                        style={{
                                          backgroundColor: activePlaylist?.color ? `${activePlaylist.color}20` : '#f1f5f9',
                                          color: activePlaylist?.color || '#64748b',
                                          border: `1px solid ${activePlaylist?.color ? `${activePlaylist.color}40` : '#e2e8f0'}`
                                        }}
                                      >
                                        ▶ {activeName}
                                      </span>
                                    </div>
                                  )}
                                  {!activeName && zones.length === 0 && (
                                    <div className="mt-1.5 ml-7">
                                      <span className="text-[10px] text-slate-300 italic">Neatribuit</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* RIGHT: Playlists */}
            <div className="flex-1 min-w-0">
              {filteredPlaylists.length === 0 ? (
                <div className="glass-card p-12 text-center" data-testid="no-playlists">
                  <ListIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
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
                              className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
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
                          <tr key={playlist.id} className={`hover:bg-slate-50/50 transition-colors ${selectedPlaylists.includes(playlist.id) ? 'bg-red-50/30' : ''}`}>
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedPlaylists.includes(playlist.id)}
                                onChange={() => toggleSelectPlaylist(playlist.id)}
                                className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                              />
                            </td>
                            <td className="px-6 py-4">
                              {(() => {
                                const hasItems = playlist.items && playlist.items.length > 0;
                                const isAssignedToScreens = screens.some(s => isPlaylistOnScreen(playlist.id, s.id));
                                const isActive = hasItems && isAssignedToScreens && playlist.status === 'active';
                                return (
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                                    {isActive ? 'Activ' : 'Inactiv'}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-800">
                              <div className="flex items-center gap-3">
                                {playlist.brand && getBrandLogo(playlist.brand) && (
                                  <div className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center bg-white overflow-hidden shrink-0 shadow-sm">
                                    <img src={getBrandLogo(playlist.brand)} alt="" className="w-full h-full object-contain" />
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  {playlist.brand && <span className="text-[10px] font-bold text-red-600 uppercase mb-0.5">{playlist.brand}</span>}
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
                                  <div className="mt-1 flex items-center gap-1 text-red-600 font-bold">
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
                                  <span className="text-[10px] text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter flex items-center gap-1">
                                    <CalendarIcon className="w-2.5 h-2.5" />
                                    Programat
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="relative">
                                  <button
                                    onClick={() => setScreenAssignOpen(screenAssignOpen === playlist.id ? null : playlist.id)}
                                    className={`p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all shadow-sm hover:shadow ${screens.filter(s => isPlaylistOnScreen(playlist.id, s.id)).length > 0 ? 'text-red-500' : 'text-slate-500 hover:text-red-600'}`}
                                    title="Setare pe ecran"
                                  >
                                    <Airplay className="w-4 h-4" />
                                    {screens.filter(s => isPlaylistOnScreen(playlist.id, s.id)).length > 0 && (
                                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                                        {screens.filter(s => isPlaylistOnScreen(playlist.id, s.id)).length}
                                      </span>
                                    )}
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleToggleStatus(playlist)}
                                  className={`p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all shadow-sm hover:shadow ${playlist.status === 'active' ? 'text-rose-500 hover:text-rose-600' : 'text-emerald-500 hover:text-emerald-600'}`}
                                  title={playlist.status === 'active' ? 'Oprește' : 'Activează'}
                                >
                                  <div className={`w-3 h-3 ${playlist.status === 'active' ? 'bg-rose-500' : 'bg-emerald-500'} rounded-sm`}></div>
                                </button>
                                <button
                                  onClick={() => handleDuplicate(playlist)}
                                  className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all text-slate-500 hover:text-red-600 shadow-sm hover:shadow"
                                  title="Duplică"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEdit(playlist)}
                                  className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all text-slate-500 hover:text-red-600 shadow-sm hover:shadow"
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
                <div className="space-y-8">
                  {sortedPlaylistLocationGroups.map(([locationKey, groupPlaylists]) => (
                    <div key={locationKey}>
                      {/* Location Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                          <MapPin className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-bold text-slate-700">{getLocationName(locationKey === '__none__' ? null : locationKey)}</span>
                          <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">{groupPlaylists.length}</span>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupPlaylists.map((playlist) => {
                          // Check if playlist is truly active: has items AND is assigned to screens
                          const hasItems = playlist.items && playlist.items.length > 0;
                          const isAssignedToScreens = screens.some(s => isPlaylistOnScreen(playlist.id, s.id));
                          const isActive = hasItems && isAssignedToScreens && playlist.status === 'active';
                          const totalDuration = calculateTotalDuration(playlist.items);
                          const brandName = Array.isArray(playlist.brand) ? playlist.brand[0] : playlist.brand;
                          const brandLogo = getBrandLogo(brandName);

                          // Calculate duration/remaining time
                          let timeInfo = null;
                          if (playlist.is_scheduled && playlist.start_at) {
                            const start = new Date(playlist.start_at);
                            const end = playlist.end_at ? new Date(playlist.end_at) : null;
                            const now = new Date();

                            if (now < start) {
                              const diff = start - now;
                              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                              const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                              timeInfo = <span className="text-amber-600 font-bold">Începe în {days}z {hours}h</span>;
                            } else if (end && now > end) {
                              timeInfo = <span className="text-slate-400 font-bold">Finalizat</span>;
                            } else if (end) {
                              const diff = end - now;
                              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                              const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                              timeInfo = <span className="text-emerald-600 font-bold">Rămas: {days}z {hours}h</span>;
                            } else {
                              timeInfo = <span className="text-emerald-600 font-bold">Rulează continuu</span>;
                            }
                          }

                          return (
                            <div
                              key={playlist.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', playlist.id);
                                setDraggedPlaylistId(playlist.id);
                              }}
                              onDragEnd={() => {
                                setDraggedPlaylistId(null);
                                setDroppingOnScreenId(null);
                              }}
                              className={`bg-white rounded-xl border border-slate-200 transition-all hover:shadow-lg group flex flex-col relative overflow-hidden cursor-grab active:cursor-grabbing ${draggedPlaylistId === playlist.id ? 'opacity-50 scale-95' : ''} ${selectedPlaylists.includes(playlist.id) ? 'ring-2 ring-red-500 shadow-xl scale-[1.02]' : ''}`}
                              style={{
                                boxShadow: selectedPlaylists.includes(playlist.id) ? `0 15px 40px -10px ${(playlist.color || '#EF4444')}80` : 'none',
                                '--playlist-color': playlist.color || '#EF4444'
                              }}
                              data-testid={`playlist-card-${playlist.id}`}
                            >
                              {/* Colored Header Bar with Playlist Name */}
                              <div
                                className="w-full px-3 py-2.5 rounded-t-xl flex items-center gap-2 min-w-0"
                                style={{ background: `linear-gradient(135deg, ${playlist.color || '#EF4444'} 0%, ${playlist.color || '#EF4444'}cc 100%)` }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedPlaylists.includes(playlist.id)}
                                  onChange={() => toggleSelectPlaylist(playlist.id)}
                                  className="rounded text-white focus:ring-white/50 w-4 h-4 cursor-pointer shrink-0"
                                />
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${brandLogo ? 'bg-white/90' : 'bg-white/20'}`}>
                                  {brandLogo ? (
                                    <img src={brandLogo} alt={brandName} className="w-full h-full object-contain p-0.5" />
                                  ) : (
                                    <Film className="w-4 h-4 text-white/80" />
                                  )}
                                </div>
                                <span className="text-xs font-bold text-white line-clamp-1 flex-1 min-w-0 leading-tight drop-shadow-sm" title={playlist.name}>{playlist.name}</span>
                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isActive ? 'bg-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-white/30'}`} title={isActive ? 'Activ' : 'Inactiv'}></div>
                              </div>
                              <div className="p-4 flex-1">
                                <div className="flex items-start justify-between mb-3">

                                  <div className="flex gap-1 shrink-0">
                                    <button
                                      onClick={() => setScreenAssignOpen(screenAssignOpen === playlist.id ? null : playlist.id)}
                                      className={`relative h-7 w-7 p-1.5 rounded-lg transition-all ${screens.filter(s => isPlaylistOnScreen(playlist.id, s.id)).length > 0 ? 'text-red-500 hover:bg-red-100' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                                      title="Atribuie ecrane"
                                    >
                                      <Airplay className="w-4 h-4" />
                                      {screens.filter(s => isPlaylistOnScreen(playlist.id, s.id)).length > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                                          {screens.filter(s => isPlaylistOnScreen(playlist.id, s.id)).length}
                                        </span>
                                      )}
                                    </button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                      onClick={async () => {
                                        try {
                                          const screensRes = await api.get('/screens');
                                          const allScreens = screensRes.data;

                                          let hasScreens = false;
                                          for (const screen of allScreens) {
                                            try {
                                              const zonesRes = await api.get(`/screen-zones/${screen.id}`);
                                              const hasPlaylist = zonesRes.data.some(zone =>
                                                (zone.playlist_id && zone.playlist_id === playlist.id) ||
                                                (zone.content_type === 'playlist' && zone.content_id === playlist.id)
                                              );
                                              if (hasPlaylist) {
                                                hasScreens = true;
                                                break;
                                              }
                                            } catch (e) {
                                              // Skip screen
                                            }
                                          }

                                          if (!hasScreens) {
                                            toast.warning(`Playlist-ul "${playlist.name}" nu are niciun ecran atribuit`, {
                                              description: 'Atribuie acest playlist la un ecran pentru a vedea simularea'
                                            });
                                            return;
                                          }

                                          setSelectedPlaylists([playlist.id]);
                                          setShowSimulation(true);
                                        } catch (error) {
                                          console.error('Error checking screens:', error);
                                          toast.error('Eroare la verificarea ecranelor');
                                        }
                                      }}
                                      title="Previzualizare"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-amber-600 hover:bg-amber-50" onClick={() => handleEdit(playlist)} title="Editează">
                                      <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(playlist.id)} title="Șterge">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                                {/* Content Previews - Restored */}
                                <div className="grid grid-cols-4 gap-1 mb-3 h-12">
                                  {playlist.items?.slice(0, 4).map((playItem, idx) => {
                                    const contentItem = content.find(c => c.id === playItem.content_id);
                                    if (!contentItem) return <div key={idx} className="bg-slate-50 rounded"></div>;
                                    const resolveUrl = (url) => {
                                      if (!url) return '';
                                      if (url.startsWith('/api/uploads')) return `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}${url}`;
                                      return url;
                                    };
                                    return (
                                      <div key={idx} className="relative rounded overflow-hidden bg-black h-full border border-slate-100">
                                        {contentItem.type === 'video' ? (
                                          contentItem.thumbnail_url ? (
                                            <img src={resolveUrl(contentItem.thumbnail_url)} alt="" className="w-full h-full object-cover opacity-80" />
                                          ) : (
                                            <video src={resolveUrl(contentItem.file_url)} className="w-full h-full object-cover opacity-80" muted autoPlay loop playsInline preload="metadata" />
                                          )
                                        ) : (
                                          <img src={resolveUrl(contentItem.thumbnail_url || contentItem.file_url)} alt="" className="w-full h-full object-cover opacity-80" />
                                        )}
                                      </div>
                                    )
                                  })}
                                  {[...Array(Math.max(0, 4 - (playlist.items?.length || 0)))].map((_, idx) => (
                                    <div key={`empty-${idx}`} className="bg-slate-50 rounded border border-slate-100/50"></div>
                                  ))}
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Conținut</p>
                                    <div className="flex items-center gap-1.5 text-slate-700">
                                      <ListIcon className="w-3.5 h-3.5" />
                                      <span className="text-xs font-semibold">{playlist.items?.length || 0} elemente</span>
                                    </div>
                                  </div>
                                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Durată</p>
                                    <div className="flex items-center gap-1.5 text-slate-700">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span className="text-xs font-semibold">{formatDuration(totalDuration)}</span>
                                    </div>
                                  </div>
                                </div>

                                {playlist.is_scheduled && (
                                  <div className="flex flex-col gap-1.5 text-xs p-2.5 rounded-lg border transition-all"
                                    style={{
                                      backgroundColor: `${playlist.color || '#EF4444'}15`,
                                      borderColor: `${playlist.color || '#EF4444'}30`,
                                      color: playlist.color || '#1e1b4b'
                                    }}>
                                    <div className="flex items-center gap-2 font-black">
                                      <CalendarIcon className="w-3.5 h-3.5 opacity-80" />
                                      <span>
                                        {playlist.start_at ? format(new Date(playlist.start_at), 'dd MMM HH:mm', { locale: ro }) : 'Acum'}
                                        {' - '}
                                        {playlist.end_at ? format(new Date(playlist.end_at), 'dd MMM HH:mm', { locale: ro }) : '∞'}
                                      </span>
                                    </div>
                                    {timeInfo && <div className="text-[10px] pl-5 font-bold opacity-90">{timeInfo}</div>}
                                  </div>

                                )}
                              </div>

                              <div className="p-3 border-t flex items-center justify-end gap-2 rounded-b-xl"
                                style={{ backgroundColor: playlist.color || '#EF4444', borderColor: playlist.color || '#EF4444' }}
                              >
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleStatus(playlist)}
                                    className="h-8 px-3 text-xs font-bold text-white/90 hover:text-white hover:bg-white/20"
                                  >
                                    {isActive ? 'Stop' : 'Activează'}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDuplicate(playlist)}
                                    className="h-8 px-2 text-white/80 hover:text-white hover:bg-white/20 text-xs"
                                  >
                                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                                    Duplică
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>

      {/* Screen Assignment Dialog */}
      < Dialog open={!!screenAssignOpen
      } onOpenChange={(open) => { if (!open) setScreenAssignOpen(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Airplay className="w-5 h-5 text-red-500" />
              Selectați ecranele
            </DialogTitle>
            <DialogDescription>
              {(() => {
                const p = playlists.find(p => p.id === screenAssignOpen);
                return p ? `Atribuiți "${p.name}" pe ecranele dorite` : '';
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            {locations.filter(loc => screens.some(s => s.location_id === loc.id)).map(location => {
              const locationScreens = screens.filter(s => s.location_id === location.id);
              return (
                <div key={location.id} className="mb-4">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{location.name}</span>
                    <span className="text-xs text-slate-400">({locationScreens.length})</span>
                  </div>
                  <div className="space-y-1">
                    {locationScreens.map(screen => {
                      const assigned = isPlaylistOnScreen(screenAssignOpen, screen.id);
                      return (
                        <label
                          key={screen.id}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border-2 ${assigned
                            ? 'bg-red-50 border-red-200 shadow-sm'
                            : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={assigned}
                            onChange={() => handleToggleScreenAssign(screenAssignOpen, screen.id)}
                            className="rounded text-red-500 w-4 h-4"
                          />
                          <Monitor className={`w-5 h-5 ${assigned ? 'text-red-500' : 'text-slate-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold ${assigned ? 'text-red-700' : 'text-slate-700'}`}>{screen.name}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${screen.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span className={`text-xs font-bold uppercase ${screen.status === 'online' ? 'text-emerald-600' : 'text-slate-400'}`}>{screen.status || 'offline'}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog >

      {/* Simulation Modal */}
      {
        showSimulation && (
          <Dialog open={showSimulation} onOpenChange={setShowSimulation}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
              <DialogHeader className="sr-only">
                <DialogTitle>Simulare Live Playlist-uri</DialogTitle>
                <DialogDescription>Previzualizare live a ecranelor care afișează playlist-urile selectate</DialogDescription>
              </DialogHeader>
              <div className="relative w-full h-[90vh]">
                <PlaylistSimulation
                  playlistIds={selectedPlaylists}
                  playlists={playlists}
                  onClose={() => setShowSimulation(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        )
      }
    </>
  );
};
