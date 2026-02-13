import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, Tv, ExternalLink, Settings, Link as LinkIcon, QrCode, LayoutGrid, List as ListIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useViewMode } from '../hooks/useViewMode';
import { ViewToggle } from '../components/ViewToggle';

export const Screens = () => {
  const { isAdmin } = useAuth();
  const [screens, setScreens] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingScreen, setEditingScreen] = useState(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedScreenForLink, setSelectedScreenForLink] = useState(null);
  const [shortUrl, setShortUrl] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [selectedScreens, setSelectedScreens] = useState([]);
  const [viewMode, setViewMode] = useViewMode('view_mode_screens', 'grid');
  const [formData, setFormData] = useState({
    location_id: '',
    name: '',
    slug: '',
    resolution: '1920x1080',
    orientation: 'landscape',
    template_id: 'fullscreen',
    brand: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [screensRes, locationsRes] = await Promise.all([
        api.get('/screens'),
        api.get('/locations')
      ]);
      setScreens(screensRes.data.sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, { numeric: true })
      ));
      setLocations(locationsRes.data);
    } catch (error) {
      toast.error('Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingScreen) {
        await api.put(`/screens/${editingScreen.id}`, formData);
        toast.success('Ecran actualizat!');
      } else {
        await api.post('/screens', formData);
        toast.success('Ecran creat!');
      }
      setShowDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Eroare la salvare');
    }
  };

  const handleEdit = (screen) => {
    setEditingScreen(screen);
    setFormData({
      location_id: screen.location_id,
      name: screen.name,
      slug: screen.slug,
      resolution: screen.resolution,
      orientation: screen.orientation,
      template_id: screen.template_id || 'fullscreen',
      brand: screen.brand || ''
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sigur dorești să ștergi acest ecran?')) return;
    try {
      await api.delete(`/screens/${id}`);
      toast.success('Ecran șters!');
      loadData();
    } catch (error) {
      toast.error('Eroare la ștergere');
    }
  };

  const resetForm = () => {
    setFormData({
      location_id: '',
      name: '',
      slug: '',
      resolution: '1920x1080',
      orientation: 'landscape',
      template_id: 'fullscreen',
      brand: ''
    });
    setEditingScreen(null);
  };

  const getLocation = (locationId) => {
    return locations.find(l => l.id === locationId);
  };

  const getLocationName = (locationId) => {
    return getLocation(locationId)?.name || 'Unknown';
  };

  // Get unique brands, cities, and locations for filters
  const brands = [...new Set(screens.map(s => s.brand).filter(Boolean))].sort();
  const cities = [...new Set(locations.map(l => l.city))].sort();
  const filteredLocations = cityFilter === 'all' ? locations : locations.filter(l => l.city === cityFilter);

  const filteredScreens = screens.filter(screen => {
    const location = getLocation(screen.location_id);
    const matchesBrand = brandFilter === 'all' || screen.brand === brandFilter;
    const matchesCity = cityFilter === 'all' || location?.city === cityFilter;
    const matchesLocation = locationFilter === 'all' || screen.location_id === locationFilter;
    return matchesBrand && matchesCity && matchesLocation;
  });

  const toggleSelectAll = () => {
    if (selectedScreens.length === filteredScreens.length) {
      setSelectedScreens([]);
    } else {
      setSelectedScreens(filteredScreens.map(s => s.id));
    }
  };

  const toggleSelectScreen = (id) => {
    if (selectedScreens.includes(id)) {
      setSelectedScreens(selectedScreens.filter(sid => sid !== id));
    } else {
      setSelectedScreens([...selectedScreens, id]);
    }
  };

  const displayUrl = window.location.origin;

  const handleShowLink = (screen) => {
    setSelectedScreenForLink(screen);
    // Use internal short link: origin + /s/ + slug
    setShortUrl(`${window.location.origin}/s/${screen.slug}`);
    setShowLinkDialog(true);
  };

  const getScreenUrl = (slug) => {
    return `${displayUrl}/display/${slug}`;
  };

  const copyToClipboard = (text) => {
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => {
          toast.success('Link copiat în clipboard!');
        })
        .catch(() => {
          // Fallback to old method
          copyToClipboardFallback(text);
        });
    } else {
      // Use fallback for non-secure contexts
      copyToClipboardFallback(text);
    }
  };

  const copyToClipboardFallback = (text) => {
    // Create temporary textarea
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      toast.success('Link copiat în clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Nu s-a putut copia. Selectează manual și copiază.');
    }

    document.body.removeChild(textArea);
  };

  const generateQRCode = (urlOrSlug) => {
    // ALWAYS use the direct full URL for QR codes to avoid redirects and issues
    // If it's already a URL, use it, otherwise build it
    const url = urlOrSlug.startsWith('http') ? urlOrSlug : getScreenUrl(urlOrSlug);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
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
      <div className="animate-in" data-testid="screens-page">
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">Ecrane</h1>
              <p className="text-slate-500">Gestionează ecranele digitale și conținutul lor</p>
            </div>
            {isAdmin() && (
              <Dialog open={showDialog} onOpenChange={(open) => {
                setShowDialog(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="btn-red px-6 py-2 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all h-[44px]">
                    <Plus className="w-5 h-5 mr-2" />
                    Adaugă ecran
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-panel">
                  <DialogHeader>
                    <DialogTitle>
                      {editingScreen ? 'Editează ecranul' : 'Adaugă ecran nou'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>Brand</Label>
                      <Input
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        placeholder="Ex: Sushi Master, MyBox, etc."
                        data-testid="screen-brand-input"
                      />
                    </div>
                    <div>
                      <Label>Locație</Label>
                      <Select
                        value={formData.location_id}
                        onValueChange={(value) => setFormData({ ...formData, location_id: value })}
                        required
                      >
                        <SelectTrigger data-testid="location-select">
                          <SelectValue placeholder="Selectează locația" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map(location => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.city} - {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Nume ecran</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ecran Principal"
                        required
                        data-testid="screen-name-input"
                      />
                    </div>
                    <div>
                      <Label>Slug (link scurt)</Label>
                      <Input
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        placeholder="c1"
                        required
                        data-testid="screen-slug-input"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        ⚡ Recomandare: Folosește 2-3 caractere (ex: c1, tv1, s2) pentru link foarte scurt pe TV
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Rezoluție</Label>
                        <Select
                          value={formData.resolution}
                          onValueChange={(value) => setFormData({ ...formData, resolution: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1920x1080">1920x1080 (FHD)</SelectItem>
                            <SelectItem value="3840x2160">3840x2160 (4K)</SelectItem>
                            <SelectItem value="1080x1920">1080x1920 (Portrait)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Orientare</Label>
                        <Select
                          value={formData.orientation}
                          onValueChange={(value) => setFormData({ ...formData, orientation: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="landscape">Landscape</SelectItem>
                            <SelectItem value="portrait">Portrait</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button type="submit" className="btn-primary flex-1" data-testid="save-screen-button">
                        {editingScreen ? 'Actualizează' : 'Creează'}
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
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-2">Brand:</span>
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="w-[160px] h-9 text-sm bg-slate-50 border-slate-100 rounded-xl">
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

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-2">Oraș:</span>
              <Select value={cityFilter} onValueChange={(val) => { setCityFilter(val); setLocationFilter('all'); }}>
                <SelectTrigger className="w-[160px] h-9 text-sm bg-slate-50 border-slate-100 rounded-xl">
                  <SelectValue placeholder="Toate orașele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate orașele</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Locație:</span>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-[180px] h-9 text-sm bg-slate-50 border-slate-100 rounded-xl">
                  <SelectValue placeholder="Toate locațiile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate locațiile</SelectItem>
                  {filteredLocations.map(location => (
                    <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1"></div>

            <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
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

        {filteredScreens.length === 0 ? (
          <div className="glass-card p-12 text-center" data-testid="no-screens">
            <Tv className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Niciun ecran găsit
            </h3>
            <p className="text-slate-500 mb-6">
              Încearcă să schimbi filtrele sau adaugă un ecran nou
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
                        checked={filteredScreens.length > 0 && selectedScreens.length === filteredScreens.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                    </th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Brand / Nume</th>
                    <th className="px-6 py-4">Oraș / Locație</th>
                    <th className="px-6 py-4">Creat de / Data</th>
                    <th className="px-6 py-4">URL / Slug</th>
                    <th className="px-6 py-4 text-right">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredScreens.map((screen) => {
                    const location = getLocation(screen.location_id);
                    return (
                      <tr key={screen.id} className={`hover:bg-slate-50/50 transition-colors ${selectedScreens.includes(screen.id) ? 'bg-red-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedScreens.includes(screen.id)}
                            onChange={() => toggleSelectScreen(screen.id)}
                            className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${screen.status === 'online' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${screen.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                            {screen.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            {screen.brand && <span className="text-[10px] font-bold text-red-600 uppercase mb-0.5">{screen.brand}</span>}
                            <span className="font-semibold text-slate-800">{screen.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col text-xs">
                            <span className="text-slate-700 font-medium">{location?.city || 'Oraș necunoscut'}</span>
                            <span className="text-slate-500">{location?.name || 'Locație necunoscută'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col text-xs">
                            <span className="text-slate-700 font-medium">{screen.created_by_name || 'System'}</span>
                            <span className="text-slate-400">
                              {screen.created_at ? new Date(screen.created_at).toLocaleDateString('ro-RO') : '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 text-[11px] font-mono">
                            /{screen.slug}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleShowLink(screen)}
                              className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all text-slate-500 hover:text-red-600 shadow-sm hover:shadow"
                              title="Link TV"
                            >
                              <LinkIcon className="w-4 h-4" />
                            </button>
                            {isAdmin() && (
                              <>
                                <Link
                                  to={`/screens/${screen.id}/design`}
                                  className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all text-slate-500 hover:text-red-600 shadow-sm hover:shadow"
                                  title="Design / Conținut"
                                >
                                  <Settings className="w-4 h-4" />
                                </Link>
                                <button
                                  onClick={() => handleEdit(screen)}
                                  className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all text-slate-500 hover:text-red-600 shadow-sm hover:shadow"
                                  title="Editează"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(screen.id)}
                                  className="p-2 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all text-slate-400 hover:text-rose-600"
                                  title="Șterge"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScreens.map((screen) => (
              <div key={screen.id} className="glass-card p-6 flex flex-col h-full" data-testid={`screen-card-${screen.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col">
                    {screen.brand && (
                      <span className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1 underline decoration-2 decoration-red-200 underline-offset-4">
                        {screen.brand}
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-slate-800 leading-tight">
                      {screen.name}
                    </h3>
                  </div>
                  <div className="flex gap-1.5">
                    {isAdmin() && (
                      <>
                        <Link
                          to={`/screens/${screen.id}/design`}
                          className="p-2 hover:bg-white/80 rounded-xl transition-all border border-transparent hover:border-slate-200 shadow-sm hover:shadow text-slate-600 hover:text-red-600"
                          title="Configurează conținut"
                        >
                          <Settings className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleEdit(screen)}
                          className="p-2 hover:bg-white/80 rounded-xl transition-all border border-transparent hover:border-slate-200 shadow-sm hover:shadow text-slate-600 hover:text-red-600"
                          title="Editează detalii"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden mb-5 border border-slate-200 shadow-inner group">
                  <iframe
                    src={`/display/${screen.slug}`}
                    title={screen.name}
                    className="absolute inset-0 w-full h-full border-0 pointer-events-none opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                    style={{ transform: 'scale(1)', transformOrigin: 'top left' }}
                  />
                  <div className="absolute inset-0 bg-transparent z-10 cursor-pointer" onClick={() => window.open(`/display/${screen.slug}`, '_blank')}></div>

                  <div className="absolute top-3 right-3 z-20">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md shadow-lg ${screen.status === 'online' ? 'bg-emerald-500/90 text-white' : 'bg-slate-800/80 text-white'} text-[9px] font-black uppercase tracking-widest`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${screen.status === 'online' ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></div>
                      {screen.status}
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Locație</p>
                      <p className="text-sm font-bold text-slate-700">{getLocationName(screen.location_id)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Short Link</span>
                      <span className="text-xs font-mono font-bold text-red-600">/{screen.slug}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase bg-white px-2 py-0.5 rounded-md border border-slate-100">
                      {screen.resolution}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleShowLink(screen)}
                    className="flex-1 flex items-center justify-center gap-2 text-sm bg-red-600 text-white hover:bg-red-700 px-4 py-3 rounded-xl transition-all shadow-md hover:shadow-lg font-bold"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Link TV
                  </button>
                  {isAdmin() && (
                    <button
                      onClick={() => handleDelete(screen.id)}
                      className="p-3 hover:bg-rose-50 rounded-xl transition-all text-slate-300 hover:text-rose-600 group"
                      title="Șterge ecran"
                    >
                      <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Link pentru TV - {selectedScreenForLink?.name}</DialogTitle>
          </DialogHeader>
          {selectedScreenForLink && (
            <div className="space-y-6">
              {/* Short URL - PROMINENT */}
              <div className="bg-gradient-to-br from-red-50 to-purple-50 rounded-2xl p-6 border-2 border-red-300">
                <Label className="text-lg font-bold text-red-900 mb-3 block flex items-center gap-2">
                  ⚡ Link Scurt pentru TV
                </Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={shortUrl}
                    readOnly
                    onClick={(e) => e.target.select()}
                    className="text-2xl font-bold text-center bg-white border-2 border-red-200 rounded-xl py-4 cursor-pointer"
                    data-testid="short-url-input"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => copyToClipboard(shortUrl)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-3"
                    data-testid="copy-short-url-button"
                  >
                    <LinkIcon className="w-5 h-5 mr-2" />
                    Copiază Link Scurt
                  </Button>
                  <a
                    href={shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary px-6"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
                <p className="text-sm text-red-700 mt-3 text-center font-medium">
                  👆 Scrie acest link pe TV - ACUM E SIMPLU! (Fără tinyurl)
                </p>
              </div>

              {/* Original URL - Secondary */}
              <details className="glass-card p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <span>🔗 Link Complet (alternativ)</span>
                </summary>
                <div className="mt-4 space-y-2">
                  <Input
                    value={getScreenUrl(selectedScreenForLink.slug)}
                    readOnly
                    onClick={(e) => e.target.select()}
                    className="glass-input font-mono text-xs cursor-pointer"
                    data-testid="screen-url-input"
                  />
                  <Button
                    onClick={() => copyToClipboard(getScreenUrl(selectedScreenForLink.slug))}
                    className="w-full btn-secondary text-sm"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Copiază Link Complet
                  </Button>
                </div>
              </details>

              <div className="bg-white/40 rounded-2xl p-6 text-center">
                <Label className="text-base font-semibold mb-4 block">📱 QR Code</Label>
                <div className="bg-white p-4 rounded-xl inline-block">
                  <img
                    src={generateQRCode(shortUrl || selectedScreenForLink.slug)}
                    alt="QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  Scanează cu telefonul → Trimite link la TV
                </p>
              </div>

              <div className="glass-card p-4">
                <h3 className="font-semibold text-slate-800 mb-3">📺 Instrucțiuni TV:</h3>
                <ol className="space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <span className="font-bold text-red-600">1.</span>
                    <span>Deschide browser-ul pe TV (Chrome, Firefox, Safari)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-red-600">2.</span>
                    <span>Introdu URL-ul de mai sus sau scanează QR code-ul</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-red-600">3.</span>
                    <span>Apasă F11 pentru fullscreen (sau butonul fullscreen din browser)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-red-600">4.</span>
                    <span>Conținutul va porni automat!</span>
                  </li>
                </ol>
              </div>

              <div className="flex gap-3">
                <a
                  href={getScreenUrl(selectedScreenForLink.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 btn-primary text-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2 inline" />
                  Deschide Preview
                </a>
                <Button
                  onClick={() => setShowLinkDialog(false)}
                  className="btn-secondary"
                >
                  Închide
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout >
  );
};
