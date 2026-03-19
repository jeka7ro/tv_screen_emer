import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, Tv, ExternalLink, Settings, Link as LinkIcon, QrCode, LayoutGrid, List as ListIcon, Monitor, RotateCw, MapPin } from 'lucide-react';
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
import { BrandSelector } from '../components/BrandSelector';
import { ScreenSimulation } from '../components/ScreenSimulation';

// Lightweight thumbnail component — renders a pre-fetched image or video, no API calls
const ScreenThumbnail = ({ screen, thumbData, thumbLoading }) => {
  const rot = parseInt(screen.orientation || '0', 10);
  const isVertical = rot === 90 || rot === 270;
  const thumbUrl = thumbData?.url;
  const thumbType = thumbData?.type || 'image';

  return (
    <div
      className={`relative bg-slate-900 rounded-xl overflow-hidden mb-2 group cursor-pointer ${isVertical ? 'mx-auto' : ''}`}
      style={{ aspectRatio: isVertical ? '9/16' : '16/9', width: isVertical ? '56.25%' : '100%' }}
      onClick={() => window.open(`/display/${screen.slug}`, '_blank')}
    >
      {thumbLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
        </div>
      ) : thumbUrl && thumbType === 'video' ? (
        <video
          src={thumbUrl}
          muted
          autoPlay
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : thumbUrl ? (
        <img
          src={thumbUrl}
          alt={screen.name}
          className="absolute inset-0 w-full h-full object-cover opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs">
          <Tv className="w-8 h-8" />
        </div>
      )}
    </div>
  );
};

export const Screens = () => {
  const { isAdmin } = useAuth();
  const [screens, setScreens] = useState([]);
  const [locations, setLocations] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [thumbnails, setThumbnails] = useState({});
  const [thumbnailsLoading, setThumbnailsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingScreen, setEditingScreen] = useState(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedScreenForLink, setSelectedScreenForLink] = useState(null);
  const [shortUrl, setShortUrl] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [selectedScreens, setSelectedScreens] = useState([]);
  const [showSimulation, setShowSimulation] = useState(false);
  const [rotationFilter, setRotationFilter] = useState('all');
  const [viewMode, setViewMode] = useViewMode('view_mode_screens', 'grid');
  const [gridSize, setGridSize] = useState(() => localStorage.getItem('screens_grid_size') || 'sm');
  const [formCityFilter, setFormCityFilter] = useState('all');
  const [formData, setFormData] = useState({
    location_id: '',
    name: '',
    slug: '',
    resolution: '1920x1080',
    orientation: '0',
    template_id: 'fullscreen',
    logo_brand_id: ''  // Changed from 'brand' to 'logo_brand_id'
  });

  useEffect(() => {
    loadData();

    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      loadData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [screensRes, locationsRes, brandsRes] = await Promise.all([
        api.get('/screens'),
        api.get('/locations'),
        api.get('/brands')
      ]);
      setScreens(screensRes.data.sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, { numeric: true })
      ));
      setLocations(locationsRes.data);
      setBrands(brandsRes.data);

      // Fetch all thumbnails in a single batch request (replaces 25 individual calls)
      api.get('/screens/thumbnails')
        .then(res => { setThumbnails(res.data); setThumbnailsLoading(false); })
        .catch(() => setThumbnailsLoading(false));
    } catch (error) {
      toast.error('Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Clean up formData - convert empty strings to null for optional fields
      const cleanedData = {
        ...formData,
        logo_brand_id: formData.logo_brand_id || null
      };

      if (editingScreen) {
        await api.put(`/screens/${editingScreen.id}`, cleanedData);
        toast.success('Ecran actualizat!');
      } else {
        await api.post('/screens', cleanedData);
        toast.success('Ecran creat!');
      }
      setShowDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving screen:', error);
      toast.error(error.response?.data?.detail || 'Eroare la salvare');
    }
  };

  const handleEdit = (screen) => {
    setEditingScreen(screen);
    // Pre-set city filter to the screen's location city
    const loc = locations.find(l => l.id === screen.location_id);
    setFormCityFilter(loc?.city || 'all');
    setFormData({
      location_id: screen.location_id,
      name: screen.name,
      slug: screen.slug,
      resolution: screen.resolution,
      orientation: screen.orientation || '0',
      template_id: screen.template_id || 'fullscreen',
      logo_brand_id: screen.logo_brand_id || ''
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
      orientation: '0',
      template_id: 'fullscreen',
      logo_brand_id: ''
    });
    setFormCityFilter('all');
    setEditingScreen(null);
  };

  const getLocation = (locationId) => {
    return locations.find(l => l.id === locationId);
  };

  const getLocationName = (locationId) => {
    return getLocation(locationId)?.name || 'Unknown';
  };

  // Get unique brands, cities, and locations for filters
  const cities = [...new Set(locations.map(l => l.city))].sort();
  const filteredLocations = cityFilter === 'all' ? locations : locations.filter(l => l.city === cityFilter);

  // Helper function to get brand name from ID
  const getBrandName = (brandId) => {
    if (!brandId) return null;
    const brand = brands.find(b => b.id === brandId);
    return brand?.name || null;
  };

  // Helper function to get brand object from ID
  const getBrand = (brandId) => {
    if (!brandId) return null;
    return brands.find(b => b.id === brandId) || null;
  };

  const filteredScreens = screens.filter(screen => {
    const location = getLocation(screen.location_id);
    const matchesBrand = brandFilter === 'all' || screen.logo_brand_id === brandFilter;
    const matchesCity = cityFilter === 'all' || location?.city === cityFilter;
    const matchesLocation = locationFilter === 'all' || screen.location_id === locationFilter;
    const matchesRotation = rotationFilter === 'all' || (screen.orientation || '0') === rotationFilter;
    return matchesBrand && matchesCity && matchesLocation && matchesRotation;
  });

  // Group filtered screens by location
  const screensByLocation = filteredScreens.reduce((acc, screen) => {
    const locId = screen.location_id;
    if (!acc[locId]) acc[locId] = [];
    acc[locId].push(screen);
    return acc;
  }, {});

  // Sort location groups by name
  const sortedLocationGroups = Object.entries(screensByLocation).sort((a, b) => {
    const nameA = getLocationName(a[0]);
    const nameB = getLocationName(b[0]);
    return nameA.localeCompare(nameB);
  });

  const rotationLabels = { '0': '0°', '90': '90°', '180': '180°', '270': '270°' };

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
    // Use the full display URL for the TV link
    setShortUrl(getScreenUrl(screen.slug));
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
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                Ecrane
                <span className="ml-3 inline-flex items-center justify-center min-w-[36px] h-9 px-3 rounded-full bg-red-600 text-white text-lg font-bold align-middle">{screens.length}</span>
              </h1>
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
                <DialogContent className="max-h-[90vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>
                      {editingScreen ? 'Editează ecranul' : 'Adaugă ecran nou'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto pr-1" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label>Brand</Label>
                        <BrandSelector
                          brands={brands}
                          value={formData.logo_brand_id}
                          onValueChange={(value) => setFormData({ ...formData, logo_brand_id: value === 'none' ? '' : value })}
                          placeholder="Selectează brand"
                          style={formData.logo_brand_id ? { borderColor: '#ef4444', borderWidth: '2px', borderStyle: 'solid' } : {}}
                        />
                      </div>
                      <div>
                        <Label>Oraș</Label>
                        <Select
                          value={formCityFilter}
                          onValueChange={(value) => {
                            setFormCityFilter(value);
                            setFormData({ ...formData, location_id: '' });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Toate orașele" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toate orașele</SelectItem>
                            {[...new Set(locations.map(l => l.city).filter(Boolean))].sort().map(city => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                            {locations
                              .filter(l => formCityFilter === 'all' || l.city === formCityFilter)
                              .map(location => (
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
                          <Label>Rotație ecran</Label>
                          <Select
                            value={formData.orientation}
                            onValueChange={(value) => setFormData({ ...formData, orientation: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0° — Normal</SelectItem>
                              <SelectItem value="90">90° — Rotit dreapta</SelectItem>
                              <SelectItem value="180">180° — Inversat</SelectItem>
                              <SelectItem value="270">270° — Rotit stânga</SelectItem>
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
                          className="bg-white text-slate-700 border border-slate-300 rounded-full px-6 py-2.5 font-medium hover:bg-slate-50 transition-colors"
                        >
                          Anulează
                        </Button>
                      </div>
                    </form>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 ml-2">Brand:</span>
              <div className="flex gap-2">
                {brands.map(brand => {
                  const count = screens.filter(s => s.logo_brand_id === brand.id).length;
                  const isActive = brandFilter === brand.id;
                  return (
                    <button
                      key={brand.id}
                      onClick={() => setBrandFilter(isActive ? 'all' : brand.id)}
                      className={`relative group transition-all duration-200 ${isActive ? 'scale-110 opacity-100' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                      title={`${brand.name} (${count})`}
                    >
                      <div className={`w-8 h-8 flex items-center justify-center overflow-hidden transition-all rounded-md bg-white shadow-sm border ${isActive ? 'border-red-500' : 'border-slate-100'}`}>
                        {brand.logo_url ? (
                          <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain p-0.5" />
                        ) : (
                          <span className="text-[8px] font-bold text-slate-400">{brand.name?.substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      {isActive && (
                        <div className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-0.5 bg-red-600 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-white shadow-sm z-20 animate-in zoom-in duration-200">
                          {count}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {brandFilter !== 'all' && (
                <button
                  onClick={() => setBrandFilter('all')}
                  className="px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors uppercase tracking-wider"
                >
                  ✕
                </button>
              )}
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

            <div className="flex items-center gap-2 border-l border-slate-100 pl-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <RotateCw className="w-3.5 h-3.5 inline mr-1" />
                Rotație:
              </span>
              <Select value={rotationFilter} onValueChange={setRotationFilter}>
                <SelectTrigger className="w-[130px] h-9 text-sm bg-slate-50 border-slate-100 rounded-xl">
                  <SelectValue placeholder="Toate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate</SelectItem>
                  <SelectItem value="0">0° — Normal</SelectItem>
                  <SelectItem value="90">90° — Dreapta</SelectItem>
                  <SelectItem value="180">180° — Inversat</SelectItem>
                  <SelectItem value="270">270° — Stânga</SelectItem>
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
            {viewMode === 'grid' && (
              <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200 gap-0.5">
                {[['sm', 'S'], ['md', 'M'], ['lg', 'L']].map(([size, label]) => (
                  <button
                    key={size}
                    onClick={() => { setGridSize(size); localStorage.setItem('screens_grid_size', size); }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${gridSize === size ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
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
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${screen.status === 'online' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`} style={screen.status === 'online' ? { boxShadow: '0 0 8px 2px rgba(16, 185, 129, 0.4)' } : { boxShadow: '0 0 8px 2px rgba(239, 68, 68, 0.4)' }}>
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${screen.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                            {screen.status === 'online' ? 'ONLINE' : 'OFFLINE'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            {getBrand(screen.logo_brand_id) && (
                              <div className="flex items-center gap-1.5 mb-0.5">
                                {getBrand(screen.logo_brand_id).logo_url && (
                                  <img src={getBrand(screen.logo_brand_id).logo_url} alt="" className="w-4 h-4 object-contain" />
                                )}
                                <span className="text-[10px] font-bold text-red-600 uppercase">{getBrand(screen.logo_brand_id).name}</span>
                              </div>
                            )}
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
                              onClick={() => {
                                // If screens are already selected via checkboxes, use those
                                // Otherwise, select just this screen
                                if (selectedScreens.length === 0) {
                                  setSelectedScreens([screen.id]);
                                }
                                setShowSimulation(true);
                              }}
                              className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all text-slate-500 hover:text-blue-600 shadow-sm hover:shadow"
                              title="Simulare"
                            >
                              <Monitor className="w-4 h-4" />
                            </button>
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
          <div className="space-y-8">
            {sortedLocationGroups.map(([locationId, locationScreens]) => (
              <div key={locationId}>
                {/* Location Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-bold text-slate-700">{getLocationName(locationId)}</span>
                    <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">{locationScreens.length}</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
                </div>
                <div className={`grid gap-4 ${gridSize === 'sm' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' : gridSize === 'md' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                  {locationScreens.map((screen) => (
                    <div key={screen.id} className={`glass-card p-3 flex flex-col h-full transition-all rounded-xl ${selectedScreens.includes(screen.id) ? 'ring-2 ring-blue-500 bg-blue-50/30' : ''}`} data-testid={`screen-card-${screen.id}`} style={{ border: screen.status === 'online' ? '2px solid #10b981' : '2px solid #ef4444', boxShadow: screen.status === 'online' ? '0 0 8px 2px rgba(16, 185, 129, 0.25)' : '0 0 8px 2px rgba(239, 68, 68, 0.25)' }}>
                      {/* Header: checkbox + brand + name + actions */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedScreens.includes(screen.id)}
                            onChange={() => toggleSelectScreen(screen.id)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                          />
                          {getBrand(screen.logo_brand_id) && getBrand(screen.logo_brand_id).logo_url && (
                            <img src={getBrand(screen.logo_brand_id).logo_url} alt={getBrand(screen.logo_brand_id).name} title={getBrand(screen.logo_brand_id).name} className="w-5 h-5 object-contain shrink-0" />
                          )}
                          <h3 className="text-sm font-semibold text-slate-800 truncate" title={screen.name}>{screen.name}</h3>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {isAdmin() && (
                            <>
                              <Link to={`/screens/${screen.id}/design`} className="p-1.5 hover:bg-white/80 rounded-lg text-slate-400 hover:text-red-600" title="Configurează">
                                <Settings className="w-3.5 h-3.5" />
                              </Link>
                              <button onClick={() => handleEdit(screen)} className="p-1.5 hover:bg-white/80 rounded-lg text-slate-400 hover:text-red-600" title="Editează">
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Preview thumbnail — lightweight, no iframe */}
                      <ScreenThumbnail screen={screen} thumbData={thumbnails[screen.slug]} thumbLoading={thumbnailsLoading} />

                      {/* Info bar: status · location · slug · rotation · resolution */}
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 mb-2 px-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-black uppercase tracking-wider ${screen.status === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`} style={screen.status === 'online' ? { boxShadow: '0 0 6px 1px rgba(16, 185, 129, 0.3)' } : { boxShadow: '0 0 6px 1px rgba(239, 68, 68, 0.3)' }}>
                          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${screen.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                          {screen.status === 'online' ? 'ONLINE' : 'OFFLINE'}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-red-400" />
                          {getLocationName(screen.location_id)}
                        </span>
                        <span className="font-mono font-bold text-red-600">/{screen.slug}</span>
                        {parseInt(screen.orientation || '0', 10) !== 0 && (
                          <span className="flex items-center gap-0.5 font-bold text-indigo-500">
                            <RotateCw className="w-2.5 h-2.5" />
                            {screen.orientation}°
                          </span>
                        )}
                        <span className="font-medium text-slate-400">{screen.resolution}</span>
                      </div>

                      {/* Action buttons — compact */}
                      <div className="flex gap-1.5 mt-auto">
                        <button
                          onClick={() => {
                            if (selectedScreens.length === 0) setSelectedScreens([screen.id]);
                            setShowSimulation(true);
                          }}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-500 border border-blue-200"
                          title="Simulare"
                        >
                          <Monitor className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleShowLink(screen)}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-red-600 text-white hover:bg-red-700 px-3 py-2 rounded-lg font-bold shadow-sm"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          Link TV
                        </button>
                        {isAdmin() && (
                          <button
                            onClick={() => handleDelete(screen.id)}
                            className="p-2 hover:bg-rose-50 rounded-lg text-slate-300 hover:text-rose-600"
                            title="Șterge"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  👆 Scrie acest link pe TV
                </p>
              </div>

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

      {/* Simulation Modal */}
      {showSimulation && (
        <Dialog open={showSimulation} onOpenChange={setShowSimulation}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
            <div className="relative w-full h-[90vh]">
              <ScreenSimulation
                screenIds={selectedScreens}
                screens={screens}
                onClose={() => setShowSimulation(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout >
  );
};
