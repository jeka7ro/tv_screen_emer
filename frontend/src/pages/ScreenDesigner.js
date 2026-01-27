import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { Save, ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export const ScreenDesigner = () => {
  const { screenId } = useParams();
  const navigate = useNavigate();
  const [screen, setScreen] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [zoneConfigs, setZoneConfigs] = useState([]);
  const [digitalMenus, setDigitalMenus] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [screenId]);

  const loadData = async () => {
    try {
      const [screenRes, templatesRes, menusRes, playlistsRes, contentRes, zonesRes] = await Promise.all([
        api.get(`/screens/${screenId}`),
        api.get('/screen-templates'),
        api.get('/digital-menus'),
        api.get('/playlists'),
        api.get('/content'),
        api.get(`/screen-zones/${screenId}`)
      ]);

      setScreen(screenRes.data);
      setTemplates(templatesRes.data);
      setDigitalMenus(menusRes.data);
      setPlaylists(playlistsRes.data);
      setContent(contentRes.data);

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
      // Update screen template
      await api.put(`/screens/${screenId}`, {
        ...screen,
        template_id: selectedTemplate.id
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Template Ecran</h2>
              <Select
                value={selectedTemplate?.id}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger data-testid="template-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mt-6 bg-slate-100 rounded-2xl p-4 aspect-video relative">
                {selectedTemplate?.zones.map(zone => (
                  <div
                    key={zone.id}
                    className="zone-preview"
                    style={{
                      left: `${zone.x}%`,
                      top: `${zone.y}%`,
                      width: `${zone.width}%`,
                      height: `${zone.height}%`
                    }}
                  >
                    <div className="flex items-center justify-center h-full text-xs font-medium text-indigo-700">
                      {zone.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="glass-card p-6 space-y-6">
              <h2 className="text-xl font-semibold text-slate-800">Configurare Zone</h2>
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
                      </div>
                    )}

                    {config.content_type === 'playlist' && (
                      <div>
                        <Label>Playlist</Label>
                        <Select
                          value={config.playlist_id || ''}
                          onValueChange={(value) => updateZoneConfig(zone.id, 'playlist_id', value)}
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
                      </div>
                    )}

                    {config.content_type === 'single_content' && (
                      <div>
                        <Label>Conținut</Label>
                        <Select
                          value={config.content_id || ''}
                          onValueChange={(value) => updateZoneConfig(zone.id, 'content_id', value)}
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
