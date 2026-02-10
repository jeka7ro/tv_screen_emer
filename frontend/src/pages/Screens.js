import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Plus, Edit, Trash2, Tv, ExternalLink, Settings, Link as LinkIcon, QrCode } from 'lucide-react';
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
  const [viewMode, setViewMode] = useViewMode('view_mode_screens', 'grid');
  const [formData, setFormData] = useState({
    location_id: '',
    name: '',
    slug: '',
    resolution: '1920x1080',
    orientation: 'landscape',
    template_id: 'fullscreen'
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
      template_id: screen.template_id || 'fullscreen'
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
      template_id: 'fullscreen'
    });
    setEditingScreen(null);
  };

  const getLocationName = (locationId) => {
    const location = locations.find(l => l.id === locationId);
    return location?.name || 'Unknown';
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Ecrane</h1>
            <p className="text-slate-500">Gestionează ecranele digitale</p>
          </div>
          {isAdmin() && (
            <Dialog open={showDialog} onOpenChange={(open) => {
              setShowDialog(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="btn-primary" data-testid="add-screen-button">
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
                            {location.name}
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
                        <SelectItem value="1920x1080">1920x1080 (Full HD)</SelectItem>
                        <SelectItem value="3840x2160">3840x2160 (4K)</SelectItem>
                        <SelectItem value="1280x720">1280x720 (HD)</SelectItem>
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

        {screens.length === 0 ? (
          <div className="glass-card p-12 text-center" data-testid="no-screens">
            <Tv className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Niciun ecran
            </h3>
            <p className="text-slate-500 mb-6">
              Adaugă primul ecran pentru a începe
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Previzualizare</th>
                    <th className="px-6 py-4">Nume / Locație</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Slug</th>
                    <th className="px-6 py-4 text-right">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {screens.map((screen) => (
                    <tr key={screen.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="relative w-32 aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-200 shadow-sm group">
                          <iframe
                            src={`/display/${screen.slug}`}
                            title={screen.name}
                            className="absolute inset-0 w-full h-full border-0 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity"
                            style={{ transform: 'scale(0.25)', transformOrigin: 'top left', width: '400%', height: '400%' }}
                          />
                          <div className="absolute inset-0 bg-transparent z-10"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Tv className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div>{screen.name}</div>
                            <div className="text-xs text-slate-400 font-normal">{getLocationName(screen.location_id)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${screen.status === 'online' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${screen.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                            }`}></div>
                          {screen.status === 'online' ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 text-xs font-mono">
                          /{screen.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {screen.resolution}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleShowLink(screen)}
                            className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all text-slate-500 hover:text-indigo-600 shadow-sm hover:shadow"
                            title="Generează Link TV"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </button>
                          {isAdmin() && (
                            <>
                              <Link
                                to={`/screens/${screen.id}/design`}
                                className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all text-slate-500 hover:text-indigo-600 shadow-sm hover:shadow"
                              >
                                <Settings className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleEdit(screen)}
                                className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all text-slate-500 hover:text-indigo-600 shadow-sm hover:shadow"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {isAdmin() && (
                            <button
                              onClick={() => handleDelete(screen.id)}
                              className="p-2 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all text-slate-500 hover:text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
            {screens.map((screen) => (
              <div key={screen.id} className="glass-card p-6" data-testid={`screen-card-${screen.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-2xl">
                    <Tv className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleShowLink(screen)}
                      className="p-2 hover:bg-white/50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                    >
                      <LinkIcon className="w-4 h-4 text-slate-600" />
                    </button>
                    {isAdmin() && (
                      <>
                        <Link
                          to={`/screens/${screen.id}/design`}
                          className="p-2 hover:bg-white/50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                          data-testid={`design-screen-${screen.id}`}
                        >
                          <Settings className="w-4 h-4 text-slate-600" />
                        </Link>
                        <button
                          onClick={() => handleEdit(screen)}
                          className="p-2 hover:bg-white/50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                          data-testid={`edit-screen-${screen.id}`}
                        >
                          <Edit className="w-4 h-4 text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(screen.id)}
                          className="p-2 hover:bg-rose-100/50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                          data-testid={`delete-screen-${screen.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-rose-600" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* LIVE PREVIEW CONTAINER */}
                <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden mb-4 border border-slate-200 shadow-inner group">
                  <iframe
                    src={`/display/${screen.slug}`}
                    title={screen.name}
                    className="absolute inset-0 w-full h-full border-0 pointer-events-none transition-transform group-hover:scale-105"
                    style={{ transform: 'scale(1)', transformOrigin: 'top left' }}
                  />
                  <div className="absolute inset-0 bg-transparent z-10 cursor-alias" onClick={() => window.open(`/display/${screen.slug}`, '_blank')}></div>

                  {/* Status Overlay */}
                  <div className="absolute bottom-2 left-2 z-20">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg backdrop-blur-md ${screen.status === 'online' ? 'bg-emerald-500/20 text-emerald-100' : 'bg-slate-500/20 text-slate-100'
                      } text-[10px] font-bold uppercase tracking-wider`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${screen.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></div>
                      {screen.status}
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {screen.name}
                </h3>
                <p className="text-sm text-slate-600 mb-1">{getLocationName(screen.location_id)}</p>
                <p className="text-xs text-slate-500 mb-3">/{screen.slug}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className={screen.status === 'online' ? 'status-online' : 'status-offline'}>
                    <div className="w-2 h-2 rounded-full bg-current"></div>
                    {screen.status === 'online' ? 'Online' : 'Offline'}
                  </span>
                  <span className="text-xs text-slate-500 bg-slate-100/50 px-2 py-1 rounded-full">
                    {screen.resolution}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleShowLink(screen)}
                    className="flex-1 flex items-center justify-center gap-2 text-sm bg-indigo-100/50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors font-medium"
                    data-testid={`show-link-${screen.id}`}
                  >
                    <LinkIcon className="w-4 h-4" />
                    Link TV
                  </button>
                  <a
                    href={`${displayUrl}/display/${screen.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-50/50 transition-colors"
                    data-testid={`open-screen-${screen.id}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
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
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-300">
                <Label className="text-lg font-bold text-indigo-900 mb-3 block flex items-center gap-2">
                  ⚡ Link Scurt pentru TV
                </Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={shortUrl}
                    readOnly
                    onClick={(e) => e.target.select()}
                    className="text-2xl font-bold text-center bg-white border-2 border-indigo-200 rounded-xl py-4 cursor-pointer"
                    data-testid="short-url-input"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => copyToClipboard(shortUrl)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3"
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
                <p className="text-sm text-indigo-700 mt-3 text-center font-medium">
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
                    <span className="font-bold text-indigo-600">1.</span>
                    <span>Deschide browser-ul pe TV (Chrome, Firefox, Safari)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-indigo-600">2.</span>
                    <span>Introdu URL-ul de mai sus sau scanează QR code-ul</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-indigo-600">3.</span>
                    <span>Apasă F11 pentru fullscreen (sau butonul fullscreen din browser)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-indigo-600">4.</span>
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
