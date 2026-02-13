import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { Save, ArrowLeft, Eye, Check, Sparkles, Layers, Wind, Image, Monitor, List as ListIcon } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import '../styles/effects.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

// Mini layout diagram for each template
const TemplateIcon = ({ template, isSelected }) => {
  const baseClass = `w-full h-full rounded transition-all`;
  const zones = template.zones || [];

  return (
    <div className={`relative w-14 h-9 rounded border-2 overflow-hidden ${isSelected ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-slate-50'}`}>
      {zones.map((zone, i) => {
        const colors = ['bg-indigo-400', 'bg-purple-400', 'bg-teal-400'];
        const selectedColors = ['bg-indigo-500', 'bg-purple-500', 'bg-teal-500'];
        return (
          <div
            key={zone.id}
            className={`absolute ${isSelected ? selectedColors[i % 3] : colors[i % 3]} opacity-60 rounded-[2px]`}
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.width}%`,
              height: `${zone.height}%`,
              margin: '1px'
            }}
          />
        );
      })}
    </div>
  );
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Helper function to get full URL for files
const getFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('/api/uploads')) {
    return `${BACKEND_URL}${url}`;
  }
  return url;
};

export const ScreenDesigner = () => {
  const { isAdmin } = useAuth();
  const { screenId } = useParams();
  const navigate = useNavigate();
  const [screen, setScreen] = useState(null);
  const [allScreens, setAllScreens] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [zoneConfigs, setZoneConfigs] = useState([]);
  const [digitalMenus, setDigitalMenus] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [brands, setBrands] = useState([]);
  const [groupScreenPreviews, setGroupScreenPreviews] = useState({}); // { screenId: previewUrl }

  // Visual effects state
  const [enableParallax, setEnableParallax] = useState(false);
  const [enableSteam, setEnableSteam] = useState(false);
  const [enableLogo, setEnableLogo] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [logoPosition, setLogoPosition] = useState('top-right');
  const [logoSize, setLogoSize] = useState('md');

  // Logo position classes
  const logoPositionMap = {
    'top-left': 'top-3 left-3',
    'top-center': 'top-3 left-1/2 -translate-x-1/2',
    'top-right': 'top-3 right-3',
    'center-left': 'top-1/2 -translate-y-1/2 left-3',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'center-right': 'top-1/2 -translate-y-1/2 right-3',
    'bottom-left': 'bottom-3 left-3',
    'bottom-center': 'bottom-3 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-3 right-3',
  };
  const logoSizeMap = { sm: 'w-10 h-10', md: 'w-16 h-16', lg: 'w-24 h-24', xl: 'w-32 h-32' };

  // Get brands that have logos
  const brandsWithLogo = brands.filter(b => b.logo_url);

  useEffect(() => {
    loadData();
  }, [screenId]);

  // Fetch each group screen's actual content for sync preview
  useEffect(() => {
    if (!showPreview || !screen?.sync_group || !allScreens.length || !content.length) return;

    const groupScreens = allScreens.filter(s => s.sync_group === screen.sync_group);

    const fetchPreviews = async () => {
      const previews = {};

      for (const s of groupScreens) {
        try {
          // For current screen, use local zoneConfigs
          if (s.id === screen.id) {
            const cfg = zoneConfigs.find(z => z.zone_id === 'zone-1' || z.zone_id === 'zone1') || zoneConfigs[0];
            if (cfg?.content_id) {
              const item = content.find(c => c.id === cfg.content_id);
              if (item) previews[s.id] = getFileUrl(item.file_url);
            } else if (cfg?.content_type === 'playlist' && cfg?.playlist_id) {
              const plId = typeof cfg.playlist_id === 'string' ? parseInt(cfg.playlist_id) : cfg.playlist_id;
              const pl = playlists.find(p => p.id === plId || p.id === cfg.playlist_id);
              if (pl?.items?.length > 0) {
                const contentItem = content.find(c => c.id === pl.items[0].content_id);
                if (contentItem) previews[s.id] = getFileUrl(contentItem.file_url);
              }
            }
          } else {
            // Fetch other screen's zone configs
            const zonesRes = await api.get(`/screen-zones/${s.id}`);
            const otherZones = zonesRes.data;
            const cfg = otherZones.find(z => z.zone_id === 'zone-1' || z.zone_id === 'zone1') || otherZones[0];
            if (cfg?.content_id) {
              const item = content.find(c => c.id === cfg.content_id);
              if (item) previews[s.id] = getFileUrl(item.file_url);
            } else if (cfg?.content_type === 'playlist' && cfg?.playlist_id) {
              const plId = typeof cfg.playlist_id === 'string' ? parseInt(cfg.playlist_id) : cfg.playlist_id;
              const pl = playlists.find(p => p.id === plId || p.id === cfg.playlist_id);
              if (pl?.items?.length > 0) {
                const contentItem = content.find(c => c.id === pl.items[0].content_id);
                if (contentItem) previews[s.id] = getFileUrl(contentItem.file_url);
              }
            }
          }
        } catch (err) {
          console.error(`Error fetching preview for screen ${s.id}:`, err);
        }
      }

      setGroupScreenPreviews(previews);
    };

    fetchPreviews();
  }, [showPreview, screen?.sync_group, allScreens, content, playlists]);

  const loadData = async () => {
    try {
      const [screenRes, screensRes, templatesRes, menusRes, playlistsRes, contentRes, zonesRes, brandsRes] = await Promise.all([
        api.get(`/screens/${screenId}`),
        api.get('/screens'),
        api.get('/screen-templates'),
        api.get('/digital-menus'),
        api.get('/playlists'),
        api.get('/content'),
        api.get(`/screen-zones/${screenId}`),
        api.get('/brands')
      ]);

      setScreen(screenRes.data);
      setAllScreens(screensRes.data);
      setTemplates(templatesRes.data);
      setDigitalMenus(menusRes.data);
      setPlaylists(playlistsRes.data);
      setContent(contentRes.data);
      setBrands(brandsRes.data || []);

      // Load saved effects
      setEnableParallax(!!screenRes.data.parallax_enabled);
      setEnableSteam(!!screenRes.data.steam_enabled);
      setEnableLogo(!!screenRes.data.logo_enabled);
      setSelectedBrandId(screenRes.data.logo_brand_id || null);
      setLogoPosition(screenRes.data.logo_position || 'top-right');
      setLogoSize(screenRes.data.logo_size || 'md');

      const template = templatesRes.data.find(t => t.id === screenRes.data.template_id);
      setSelectedTemplate(template || templatesRes.data[0]);

      // Initialize zone configs
      const currentZones = zonesRes.data;
      const templateToUse = template || templatesRes.data[0];
      const configs = templateToUse.zones.map(zone => {
        const existing = currentZones.find(z => z.zone_id === zone.id);
        return existing || {
          zone_id: zone.id,
          content_type: 'digital_menu',
          digital_menu_id: null,
          playlist_id: null,
          content_id: null
        };
      });
      setZoneConfigs(configs);
    } catch (error) {
      toast.error('Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template);
    // Reset zone configs for new template
    const configs = template.zones.map(zone => ({
      zone_id: zone.id,
      content_type: 'digital_menu',
      digital_menu_id: null,
      playlist_id: null,
      content_id: null
    }));
    setZoneConfigs(configs);
  };

  const updateZoneConfig = (zoneId, field, value) => {
    setZoneConfigs(configs =>
      configs.map(config =>
        config.zone_id === zoneId ? { ...config, [field]: value } : config
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update screen template + effects
      await api.put(`/screens/${screenId}`, {
        ...screen,
        template_id: selectedTemplate.id,
        parallax_enabled: enableParallax,
        steam_enabled: enableSteam,
        logo_enabled: enableLogo,
        logo_brand_id: selectedBrandId,
        logo_position: logoPosition,
        logo_size: logoSize
      });

      // Save zone configurations
      for (const config of zoneConfigs) {
        await api.post('/screen-zones', {
          screen_id: screenId,
          ...config
        });
      }

      toast.success('Configurare salvată!');
      navigate('/screens');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Eroare la salvare');
    } finally {
      setSaving(false);
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
      <div className="animate-in" data-testid="screen-designer-page">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/screens')}
              className="btn-ghost"
              data-testid="back-button"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                Design Ecran: {screen?.name}
              </h1>
              <p className="text-slate-500">Configurează template-ul și zonele</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowLivePreview(true)}
              className="btn-secondary"
              data-testid="live-preview-button"
            >
              <Eye className="w-5 h-5 mr-2" />
              Live Preview
            </Button>
            {screen?.sync_group && (
              <Button
                onClick={() => setShowPreview(true)}
                className="btn-secondary"
                data-testid="preview-button"
              >
                <Eye className="w-5 h-5 mr-2" />
                Preview Sync
              </Button>
            )}
            {isAdmin() && (
              <Button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
                data-testid="save-config-button"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="spinner w-4 h-4"></div>
                    Se salvează...
                  </div>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Salvează configurarea
                  </>
                )}
              </Button>
            )}
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Template Selector - Visual Cards */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-indigo-500" />
                Template Ecran
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {templates.map(template => {
                  const isSelected = selectedTemplate?.id === template.id;
                  return (
                    <button
                      key={template.id}
                      onClick={() => isAdmin() && handleTemplateChange(template.id)}
                      disabled={!isAdmin()}
                      className={`relative p-3 rounded-xl border-2 transition-all text-left group ${isSelected
                        ? 'border-indigo-400 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-md shadow-indigo-100/50 ring-2 ring-indigo-200/50'
                        : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-sm'
                        }`}
                    >
                      {/* Checkmark */}
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center shadow-md z-10">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                      {/* Mini Layout Diagram */}
                      <div className="flex justify-center mb-2">
                        <TemplateIcon template={template} isSelected={isSelected} />
                      </div>
                      <p className={`text-[11px] font-bold text-center leading-tight ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                        {template.name}
                      </p>
                      <p className={`text-[9px] text-center mt-0.5 leading-tight ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`}>
                        {template.zones.length} {template.zones.length === 1 ? 'zonă' : 'zone'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview */}
            <div className="glass-card p-6 flex-1">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-500" />
                Previzualizare
              </h2>
              <div className="bg-slate-100 rounded-2xl p-4 aspect-video relative overflow-hidden shadow-inner border-2 border-slate-200">
                {selectedTemplate?.zones.map(zone => {
                  const config = zoneConfigs.find(c => c.zone_id === zone.id);
                  let previewUrl = null;
                  let isVideo = false;
                  let isPlaylist = false;
                  let playlistInfo = null;

                  if (config?.content_type === 'playlist' && config?.playlist_id) {
                    const plId = typeof config.playlist_id === 'string' ? parseInt(config.playlist_id) : config.playlist_id;
                    const pl = playlists.find(p => p.id === plId || p.id === config.playlist_id);
                    if (pl && pl.items && pl.items.length > 0) {
                      isPlaylist = true;
                      playlistInfo = { name: pl.name, count: pl.items.length };
                      // Playlist items reference content via content_id
                      const firstItem = pl.items[0];
                      const contentItem = content.find(c => c.id === firstItem.content_id);
                      if (contentItem && contentItem.file_url) {
                        previewUrl = getFileUrl(contentItem.file_url);
                        isVideo = contentItem.type === 'video';
                      }
                    }
                  } else if (config?.content_id) {
                    const item = content.find(c => c.id === config.content_id);
                    if (item) {
                      previewUrl = getFileUrl(item.file_url);
                      isVideo = item.type === 'video';
                    }
                  }

                  return (
                    <div
                      key={zone.id}
                      className="absolute overflow-hidden shadow-lg border border-white/20"
                      style={{
                        left: `${zone.x}%`,
                        top: `${zone.y}%`,
                        width: `${zone.width}%`,
                        height: `${zone.height}%`,
                        zIndex: 1
                      }}
                    >
                      {previewUrl ? (
                        <div className={`relative w-full h-full bg-black ${enableParallax ? 'parallax-container' : ''}`}>
                          {/* TV Style Background */}
                          <div className="absolute inset-0 z-0">
                            {isVideo ? (
                              <video src={previewUrl} className={`w-full h-full object-cover opacity-50 blur-lg scale-110 ${enableParallax ? 'parallax-layer' : ''}`} muted loop autoPlay />
                            ) : (
                              <img src={previewUrl} className={`w-full h-full object-cover opacity-50 blur-lg scale-110 ${enableParallax ? 'parallax-layer' : ''}`} alt="" />
                            )}
                          </div>

                          {/* Main Content */}
                          <div className="absolute inset-0 z-10 flex items-center justify-center">
                            {isVideo ? (
                              <video
                                src={previewUrl}
                                className="max-w-full max-h-full"
                                style={{ objectFit: 'contain' }}
                                autoPlay loop muted
                              />
                            ) : (
                              <img
                                src={previewUrl}
                                className="max-w-full max-h-full shadow-lg"
                                style={{ objectFit: 'contain' }}
                                alt="Preview"
                              />
                            )}
                          </div>

                          {/* Steam Effect */}
                          {enableSteam && (
                            <div className="steam z-20">
                              {[...Array(12)].map((_, i) => (
                                <div key={i} className="steam-particle"></div>
                              ))}
                            </div>
                          )}

                        </div>
                      ) : isPlaylist && playlistInfo ? (
                        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-red-50 to-orange-50 border-2 border-dashed border-red-200">
                          <ListIcon className="w-6 h-6 text-red-400 mb-1" />
                          <span className="text-xs font-bold text-red-600 text-center px-1 truncate w-full">{playlistInfo.name}</span>
                          <span className="text-[9px] text-red-400 font-bold">{playlistInfo.count} elemente</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs font-bold text-indigo-400 bg-indigo-50/50 backdrop-blur-sm border-2 border-dashed border-indigo-200">
                          {zone.name}
                        </div>
                      )}
                      {/* Playlist badge */}
                      {isPlaylist && playlistInfo && previewUrl && (
                        <div className="absolute bottom-1 left-1 right-1 z-30 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-1">
                          <ListIcon className="w-3 h-3 text-white" />
                          <span className="text-[9px] text-white font-bold truncate">{playlistInfo.name}</span>
                          <span className="text-[8px] text-white/70 ml-auto">{playlistInfo.count}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Logo Overlay - screen level, over all zones */}
                {enableLogo && selectedBrandId && (() => {
                  const brand = brands.find(b => b.id === selectedBrandId);
                  if (!brand?.logo_url) return null;
                  const sizePixels = { sm: '40px', md: '64px', lg: '96px', xl: '128px' };
                  const posStyles = {
                    'top-left': { top: '12px', left: '12px' },
                    'top-center': { top: '12px', left: '50%', transform: 'translateX(-50%)' },
                    'top-right': { top: '12px', right: '12px' },
                    'center-left': { top: '50%', left: '12px', transform: 'translateY(-50%)' },
                    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
                    'center-right': { top: '50%', right: '12px', transform: 'translateY(-50%)' },
                    'bottom-left': { bottom: '12px', left: '12px' },
                    'bottom-center': { bottom: '12px', left: '50%', transform: 'translateX(-50%)' },
                    'bottom-right': { bottom: '12px', right: '12px' },
                  };
                  const dim = sizePixels[logoSize] || '64px';
                  return (
                    <div className="absolute z-40 pointer-events-none" style={{ ...posStyles[logoPosition], width: dim, height: dim }}>
                      <img src={getFileUrl(brand.logo_url)} className="w-full h-full object-contain" style={{ mixBlendMode: 'multiply', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }} alt={brand.name} />
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Effects Panel */}
            <div className="glass-card p-5">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Efecte Vizuale
              </h2>
              <div className="space-y-3">
                {/* Parallax Toggle */}
                <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${enableParallax ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}>
                  <div className={`w-9 h-5 rounded-full transition-all relative ${enableParallax ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${enableParallax ? 'left-[18px]' : 'left-0.5'}`} />
                  </div>
                  <Layers className={`w-4 h-4 ${enableParallax ? 'text-indigo-500' : 'text-slate-400'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">Parallax</p>
                    <p className="text-[10px] text-slate-400">Mișcare lentă de fundal</p>
                  </div>
                  <input type="checkbox" className="sr-only" checked={enableParallax} onChange={e => setEnableParallax(e.target.checked)} />
                </label>

                {/* Steam Toggle */}
                <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${enableSteam ? 'bg-teal-50 border-teal-200' : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}>
                  <div className={`w-9 h-5 rounded-full transition-all relative ${enableSteam ? 'bg-teal-500' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${enableSteam ? 'left-[18px]' : 'left-0.5'}`} />
                  </div>
                  <Wind className={`w-4 h-4 ${enableSteam ? 'text-teal-500' : 'text-slate-400'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">Steam</p>
                    <p className="text-[10px] text-slate-400">Efect de aburi dinamic</p>
                  </div>
                  <input type="checkbox" className="sr-only" checked={enableSteam} onChange={e => setEnableSteam(e.target.checked)} />
                </label>

                {/* Logo Overlay Toggle */}
                <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${enableLogo ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}>
                  <div className={`w-9 h-5 rounded-full transition-all relative ${enableLogo ? 'bg-amber-500' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${enableLogo ? 'left-[18px]' : 'left-0.5'}`} />
                  </div>
                  <Image className={`w-4 h-4 ${enableLogo ? 'text-amber-500' : 'text-slate-400'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">Logo Overlay</p>
                    <p className="text-[10px] text-slate-400">Suprapunere logo PNG</p>
                  </div>
                  <input type="checkbox" className="sr-only" checked={enableLogo} onChange={e => setEnableLogo(e.target.checked)} />
                </label>

                {/* Logo Picker (shown when enabled) */}
                {enableLogo && (
                  <div className="pl-3 border-l-2 border-amber-200 ml-1 space-y-3">
                    {/* Brand Selection */}
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1.5">Alege brand:</p>
                      <div className="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                        {brandsWithLogo.map(brand => (
                          <button
                            key={brand.id}
                            onClick={() => setSelectedBrandId(brand.id)}
                            className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all ${selectedBrandId === brand.id
                              ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-200 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/30'
                              }`}
                          >
                            <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 p-0.5">
                              <img src={getFileUrl(brand.logo_url)} className="w-full h-full object-contain" alt={brand.name} />
                            </div>
                            <span className={`text-xs font-medium flex-1 text-left truncate ${selectedBrandId === brand.id ? 'text-amber-700' : 'text-slate-600'}`}>
                              {brand.name}
                            </span>
                            {selectedBrandId === brand.id && (
                              <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" strokeWidth={3} />
                            )}
                          </button>
                        ))}
                        {brandsWithLogo.length === 0 && (
                          <p className="text-[10px] text-slate-400 text-center py-2">Niciun brand cu logo</p>
                        )}
                      </div>
                    </div>

                    {/* Position Grid */}
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1.5">Poziție:</p>
                      <div className="grid grid-cols-3 gap-1 w-20 mx-auto">
                        {['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'].map(pos => (
                          <button
                            key={pos}
                            onClick={() => setLogoPosition(pos)}
                            className={`w-6 h-5 rounded-sm border transition-all ${logoPosition === pos
                              ? 'bg-amber-400 border-amber-500 shadow-sm'
                              : 'bg-slate-100 border-slate-200 hover:bg-amber-100 hover:border-amber-300'
                              }`}
                            title={pos}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Size Selector */}
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1.5">Mărime:</p>
                      <div className="flex gap-1">
                        {[{ k: 'sm', l: 'S' }, { k: 'md', l: 'M' }, { k: 'lg', l: 'L' }, { k: 'xl', l: 'XL' }].map(s => (
                          <button
                            key={s.k}
                            onClick={() => setLogoSize(s.k)}
                            className={`flex-1 py-1 rounded-md text-[10px] font-bold border transition-all ${logoSize === s.k
                              ? 'bg-amber-400 text-white border-amber-500 shadow-sm'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-amber-50 hover:border-amber-300'
                              }`}
                          >
                            {s.l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Zone Configuration */}
            <div className="glass-card p-6 space-y-6 flex-1">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                Configurare Zone
              </h2>
              {selectedTemplate?.zones.map((zone, index) => {
                const config = zoneConfigs.find(c => c.zone_id === zone.id) || {};
                return (
                  <div key={zone.id} className="p-4 bg-white/40 rounded-xl space-y-3">
                    <h3 className="font-medium text-slate-800">{zone.name}</h3>
                    <div>
                      <Label>Tip conținut</Label>
                      <Select
                        value={config.content_type || 'digital_menu'}
                        onValueChange={(value) => updateZoneConfig(zone.id, 'content_type', value)}
                        disabled={!isAdmin()}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="digital_menu">Meniu Digital</SelectItem>
                          <SelectItem value="playlist">Playlist</SelectItem>
                          <SelectItem value="single_content">Conținut Static</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {config.content_type === 'digital_menu' && (
                      <div>
                        <Label>Meniu</Label>
                        <Select
                          value={config.digital_menu_id || ''}
                          onValueChange={(value) => updateZoneConfig(zone.id, 'digital_menu_id', value)}
                          disabled={!isAdmin()}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează meniu" />
                          </SelectTrigger>
                          <SelectContent>
                            {digitalMenus.map(menu => (
                              <SelectItem key={menu.id} value={menu.id}>
                                {menu.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {/* Preview for Digital Menu */}
                        {config.digital_menu_id && (() => {
                          const menu = digitalMenus.find(m => m.id === config.digital_menu_id);
                          if (!menu) return null;
                          return (
                            <div className="mt-2 p-3 bg-indigo-50/50 rounded-lg text-xs space-y-1 border border-indigo-100">
                              <div className="flex justify-between font-medium text-slate-700">
                                <span>Produse: {menu.selected_products?.length || 0}</span>
                                <span>Categorii: {menu.selected_categories?.length || 0}</span>
                              </div>
                              <div className="text-slate-500">
                                {menu.products_per_page} produse / pagină • {menu.page_duration}s
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {config.content_type === 'playlist' && (
                      <div>
                        <Label>Playlist</Label>
                        <Select
                          value={config.playlist_id || ''}
                          onValueChange={(value) => updateZoneConfig(zone.id, 'playlist_id', value)}
                          disabled={!isAdmin()}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează playlist" />
                          </SelectTrigger>
                          <SelectContent>
                            {playlists.map(playlist => (
                              <SelectItem key={playlist.id} value={playlist.id}>
                                {playlist.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {/* Preview for Playlist */}
                        {config.playlist_id && (() => {
                          const playlist = playlists.find(p => p.id === config.playlist_id);
                          if (!playlist) return null;
                          return (
                            <div className="mt-2 p-3 bg-indigo-50/50 rounded-lg text-xs space-y-2 border border-indigo-100">
                              <div className="font-medium text-slate-700">{playlist.items?.length || 0} elemente</div>
                              <div className="flex gap-1 overflow-hidden">
                                {playlist.items?.slice(0, 4).map((item, idx) => {
                                  const contentItem = content.find(c => c.id === item.content_id);
                                  if (!contentItem) return null;
                                  return (
                                    <div key={idx} className="w-8 h-8 rounded bg-slate-200 flex-shrink-0 overflow-hidden">
                                      {contentItem.type === 'image' ? (
                                        <img src={getFileUrl(contentItem.file_url)} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white text-[8px]">VID</div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {config.content_type === 'single_content' && (
                      <div>
                        <Label>Conținut</Label>
                        <Select
                          value={config.content_id || ''}
                          onValueChange={(value) => updateZoneConfig(zone.id, 'content_id', value)}
                          disabled={!isAdmin()}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează conținut" />
                          </SelectTrigger>
                          <SelectContent>
                            {content.map(item => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {/* Preview for Single Content */}
                        {config.content_id && (() => {
                          const item = content.find(c => c.id === config.content_id);
                          if (!item) return null;
                          return (
                            <div className="mt-2 text-xs">
                              <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 border-2 border-slate-200 group-hover:border-indigo-400 shadow-sm transition-all">
                                {item.type === 'image' ? (
                                  <img src={getFileUrl(item.file_url)} className="w-full h-full object-cover" alt={item.title} />
                                ) : (
                                  <video src={getFileUrl(item.file_url)} className="w-full h-full object-cover" />
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sync Preview Modal */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="glass-panel max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview Sincronizare ({screen?.sync_type})</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {(() => {
                if (!screen?.sync_group) return null;

                // Filter screens in same group and sort by cascade index
                const groupScreens = allScreens
                  .filter(s => s.sync_group === screen.sync_group)
                  .sort((a, b) => a.cascade_offset - b.cascade_offset);

                // Find master content (assuming Zone 1 of Master screen has distinct content)
                // For preview, we mostly care about visual aid. 
                // We'll use a placeholder or the actual content of the current screen's Zone 1 if available.
                const configZone1 = zoneConfigs.find(z =>
                  z.zone_id === 'zone-1' ||
                  z.zone_id === 'zone1' ||
                  z.zone_id?.toLowerCase() === 'main'
                ) || zoneConfigs[0];
                let previewImage = 'https://via.placeholder.com/800x450?text=No+Content';

                if (configZone1?.content_id) {
                  const item = content.find(c => c.id === configZone1.content_id);
                  if (item) previewImage = getFileUrl(item.file_url);
                } else if (configZone1?.content_type === 'digital_menu') {
                  previewImage = 'https://via.placeholder.com/800x450?text=Digital+Menu';
                }

                // Check for 3x1 configuration for storefront photo
                const isThreeByOne = groupScreens.length === 3 && (screen.sync_type?.startsWith('matrix') || screen.sync_type?.startsWith('cascade'));
                const useStorefront = isThreeByOne;
                const storefrontUrl = '/storefront.jpg';

                if (screen.sync_type?.startsWith('matrix')) {
                  // Calculate grid dimensions
                  const count = groupScreens.length;
                  const cols = count <= 2 ? 2 : Math.ceil(Math.sqrt(count));
                  const rows = Math.ceil(count / cols);

                  return (
                    <div className="flex flex-col items-center">
                      <div
                        className="relative bg-black rounded-lg overflow-hidden shadow-2xl border-4 border-slate-800"
                        style={{
                          width: '1000px',
                          maxWidth: '100%',
                          aspectRatio: '16/9',
                          backgroundImage: `url(${useStorefront ? storefrontUrl : 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000'})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center 15%',
                          backgroundRepeat: 'no-repeat'
                        }}
                      >
                        {/* Overlay Matrix/Cascade Slices */}
                        {useStorefront ? (
                          // Precise coordinates for storefront.jpg televisions (3 screens)
                          <>
                            {[
                              { left: '27.4%', top: '38.2%', width: '14.1%', height: '10.5%', idx: 0 },
                              { left: '42.4%', top: '38.4%', width: '14.0%', height: '10.3%', idx: 1 },
                              { left: '56.7%', top: '39.2%', width: '14.0%', height: '10.1%', idx: 2 }
                            ].map((pos, idx) => {
                              const s = groupScreens[idx];
                              if (!s) return null;
                              const screenPreview = groupScreenPreviews[s.id];
                              return (
                                <div
                                  key={s.id}
                                  className={`absolute border-2 overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-500 ${s.id === screen.id ? 'border-yellow-400 z-10 scale-[1.02]' : 'border-white/40'}`}
                                  style={{
                                    left: pos.left,
                                    top: pos.top,
                                    width: pos.width,
                                    height: pos.height,
                                  }}
                                >
                                  {screenPreview ? (
                                    <img
                                      src={screenPreview}
                                      alt={s.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                      <span className="text-[8px] text-slate-400 font-bold">{s.name}</span>
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                    <div className="text-center group-hover:opacity-100 transition-opacity">
                                      <p className="font-black text-white text-[10px] drop-shadow-md leading-none bg-black/40 px-1 rounded">{idx + 1}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        ) : (
                          // Standard Grid for other matrixes
                          <div
                            className="absolute inset-0 grid gap-1 p-4 bg-slate-900/60 backdrop-blur-sm"
                            style={{
                              gridTemplateColumns: `repeat(${cols}, 1fr)`,
                              gridTemplateRows: `repeat(${rows}, 1fr)`
                            }}
                          >
                            {Array.from({ length: cols * rows }).map((_, idx) => {
                              const s = groupScreens[idx];
                              if (!s) {
                                return <div key={idx} className="bg-slate-800/50 border border-slate-700/50 rounded-lg flex items-center justify-center text-slate-600 text-[10px] font-bold uppercase italic">Empty Slot</div>;
                              }
                              return (
                                <div
                                  key={s.id}
                                  className={`border-4 rounded-lg flex items-center justify-center relative overflow-hidden transition-all shadow-lg ${s.id === screen.id ? 'border-yellow-400 z-10 scale-[1.05]' : 'border-white/20 hover:border-white/40'}`}
                                  style={{
                                    backgroundImage: `url(${previewImage})`,
                                    backgroundSize: `${cols * 100}% ${rows * 100}%`,
                                    backgroundPosition: `${(idx % cols) / (cols - 1 || 1) * 100}% ${Math.floor(idx / cols) / (rows - 1 || 1) * 100}%`
                                  }}
                                >
                                  <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center">
                                    <span className="font-black text-white text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{idx + 1}</span>
                                    <span className="text-[10px] text-white/90 font-black uppercase tracking-tighter bg-black/50 px-2 py-0.5 rounded mt-1 border border-white/10">{s.name}</span>
                                    {s.id === screen.id && <span className="absolute top-2 right-2 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span></span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="mt-6 flex items-center gap-6 text-slate-100/60 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border-2 border-yellow-400 bg-yellow-400/20"></div>
                          <span className="text-xs font-bold uppercase tracking-widest text-white">Ecranul Curent</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border-2 border-white/40 bg-white/5"></div>
                          <span className="text-xs font-bold uppercase tracking-widest text-white">Alte Ecrane în Grup</span>
                        </div>
                        <div className="h-4 w-px bg-white/20 mx-2"></div>
                        <p className="text-xs font-bold text-white uppercase tracking-tighter italic shadow-sm">
                          {useStorefront ? "Vedere Reală Locație (Simulare 3 TV)" : `Matrice Sincronizată (${cols}x${rows})`}
                        </p>
                      </div>
                    </div>
                  );
                }

                // Simple or Cascade visualization
                return (
                  <div className="flex flex-wrap gap-4 justify-center">
                    {groupScreens.map((s, idx) => (
                      <div key={s.id} className={`w-64 aspect-video bg-slate-100 rounded-lg border-2 overflow-hidden relative ${s.id === screen.id ? 'border-yellow-400' : 'border-slate-200'}`}>
                        <img src={previewImage} className="w-full h-full object-cover opacity-80" alt="Preview" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <div className="text-white text-center">
                            <p className="font-bold">{s.name}</p>
                            <span className="text-xs px-2 py-1 bg-white/20 rounded-full">
                              {screen.sync_type === 'cascade' ? `Offset: ${s.cascade_offset}` : 'Synced'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );

              })()}
            </div>
          </DialogContent>
        </Dialog>

        {/* Live Preview Dialog with Effects */}
        <Dialog open={showLivePreview} onOpenChange={setShowLivePreview}>
          <DialogContent className="max-w-7xl w-full">
            <DialogHeader>
              <DialogTitle>Live Preview - {screen?.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Large Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden border border-slate-700 shadow-2xl" style={{ aspectRatio: '16/9' }}>
                <div className="w-full h-full">
                  {(() => {
                    // Smart Preview Logic: Improved detection
                    // 1. Try to find a zone with 'main' or 'zone-1' (case insensitive)
                    // 2. Fallback to the first zone that has any content/playlist/menu selected
                    // 3. Fallback to just the first zone
                    let mainZone = zoneConfigs.find(z =>
                      z.zone_id?.toLowerCase() === 'main' ||
                      z.zone_id?.toLowerCase() === 'zone-1'
                    );

                    if (!mainZone || (!mainZone.content_id && !mainZone.playlist_id && !mainZone.digital_menu_id)) {
                      mainZone = zoneConfigs.find(z => z.content_id || z.playlist_id || z.digital_menu_id) || zoneConfigs[0];
                    }

                    let previewUrl = null;
                    let isVideo = false;

                    // Handle Single Content
                    if (mainZone?.content_id) {
                      const item = content.find(c => c.id === mainZone.content_id);
                      if (item) {
                        previewUrl = getFileUrl(item.file_url);
                        isVideo = item.type === 'video';
                      }
                    }
                    // Handle Playlist Fallback (first item)
                    else if (mainZone?.playlist_id && playlists) {
                      const playlist = playlists.find(p => p.id === mainZone.playlist_id);
                      const firstItem = playlist?.content_items?.[0] || playlist?.items?.[0];
                      if (firstItem) {
                        const contentId = firstItem.content_id || firstItem.id;
                        const item = content.find(c => c.id === contentId);
                        if (item) {
                          previewUrl = getFileUrl(item.file_url);
                          isVideo = item.type === 'video';
                        }
                      }
                    }
                    // Handle Digital Menu Fallback (first product image if exists)
                    else if (mainZone?.digital_menu_id && digitalMenus) {
                      const menu = digitalMenus.find(m => m.id === mainZone.digital_menu_id);
                      const firstProduct = menu?.products?.[0];
                      if (firstProduct?.image_url) {
                        previewUrl = getFileUrl(firstProduct.image_url);
                      }
                    }

                    if (!previewUrl) {
                      return (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-900">
                          <div className="text-center">
                            <p className="text-xl font-bold mb-2">Niciun conținut selectat</p>
                            <p className="text-sm">Selectează o imagine sau video în Configurare Zone</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="relative w-full h-full overflow-hidden">
                        {/* Blurred Background similar to TV-Style */}
                        <div className="absolute inset-0 z-0">
                          {isVideo ? (
                            <video src={previewUrl} className="w-full h-full object-cover opacity-50 blur-xl scale-110" muted loop autoPlay />
                          ) : (
                            <img src={previewUrl} className="w-full h-full object-cover opacity-50 blur-xl scale-110" alt="" />
                          )}
                        </div>

                        {/* Foreground Content */}
                        <div className="absolute inset-0 z-10 flex items-center justify-center">
                          {isVideo ? (
                            <video
                              src={previewUrl}
                              className="max-w-full max-h-full shadow-2xl"
                              style={{ objectFit: 'contain' }}
                              autoPlay loop muted
                            />
                          ) : (
                            <img
                              src={previewUrl}
                              className="max-w-full max-h-full shadow-2xl"
                              style={{ objectFit: 'contain' }}
                              alt="Preview"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {enableSteam && (
                    <div className="steam z-20 pointer-events-none">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="steam-particle"></div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-500 text-center">
                * Aceasta este o simulare smart a conținutului selectat curent (fără a fi nevoie de salvare)
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div >
    </DashboardLayout >
  );
};
