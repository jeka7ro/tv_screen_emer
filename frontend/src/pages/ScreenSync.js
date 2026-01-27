import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Shuffle, Tv } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export const ScreenSync = () => {
  const [screens, setScreens] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedScreens, setSelectedScreens] = useState([]);
  const [masterScreenId, setMasterScreenId] = useState('');
  const [syncType, setSyncType] = useState('simple');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [screensRes, locationsRes] = await Promise.all([
        api.get('/screens'),
        api.get('/locations')
      ]);
      setScreens(screensRes.data);
      setLocations(locationsRes.data);
    } catch (error) {
      toast.error('Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (selectedScreens.length < 2) {
      toast.error('Selectează cel puțin 2 ecrane');
      return;
    }
    if (!masterScreenId) {
      toast.error('Selectează ecranul master');
      return;
    }

    setSyncing(true);
    try {
      await api.post('/screen-sync', {
        screen_ids: selectedScreens,
        sync_type: syncType,
        master_screen_id: masterScreenId
      });
      toast.success('Ecrane sincronizate cu succes!');
      setSelectedScreens([]);
      setMasterScreenId('');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Eroare la sincronizare');
    } finally {
      setSyncing(false);
    }
  };

  const toggleScreen = (screenId) => {
    if (selectedScreens.includes(screenId)) {
      setSelectedScreens(selectedScreens.filter(id => id !== screenId));
      if (masterScreenId === screenId) {
        setMasterScreenId('');
      }
    } else {
      setSelectedScreens([...selectedScreens, screenId]);
      if (!masterScreenId) {
        setMasterScreenId(screenId);
      }
    }
  };

  const getLocationName = (locationId) => {
    const location = locations.find(l => l.id === locationId);
    return location?.name || 'Unknown';
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
      <div className="animate-in" data-testid="screen-sync-page">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Sincronizare Ecrane</h1>
          <p className="text-slate-500">Sincronizează conținutul pe mai multe ecrane</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Selectează ecrane ({selectedScreens.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {screens.map((screen) => (
                  <label
                    key={screen.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedScreens.includes(screen.id)
                        ? 'border-indigo-400 bg-indigo-50/50'
                        : 'border-white/60 bg-white/20 hover:bg-white/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedScreens.includes(screen.id)}
                      onChange={() => toggleScreen(screen.id)}
                      className="mt-1 rounded"
                      data-testid={`select-screen-${screen.id}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Tv className="w-4 h-4 text-slate-600" />
                        <p className="font-medium text-slate-800">{screen.name}</p>
                      </div>
                      <p className="text-xs text-slate-500">{getLocationName(screen.location_id)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={screen.status === 'online' ? 'status-online' : 'status-offline'}>
                          {screen.status}
                        </span>
                        {masterScreenId === screen.id && (
                          <span className="text-xs bg-indigo-100/50 text-indigo-700 px-2 py-1 rounded-full border border-indigo-200">
                            Master
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="glass-card p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Configurare sincronizare
              </h2>
              <div className="space-y-4">
                <div>
                  <Label>Ecran Master</Label>
                  <Select
                    value={masterScreenId}
                    onValueChange={setMasterScreenId}
                    disabled={selectedScreens.length === 0}
                  >
                    <SelectTrigger data-testid="master-screen-select">
                      <SelectValue placeholder="Selectează master" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedScreens.map(screenId => {
                        const screen = screens.find(s => s.id === screenId);
                        return (
                          <SelectItem key={screenId} value={screenId}>
                            {screen?.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-1">
                    Ecranul sursă pentru sincronizare
                  </p>
                </div>

                <div>
                  <Label>Tip sincronizare</Label>
                  <Select value={syncType} onValueChange={setSyncType}>
                    <SelectTrigger data-testid="sync-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Sincronizare simplă</SelectItem>
                      <SelectItem value="cascade">Mod cascadă</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-1">
                    {syncType === 'simple'
                      ? 'Toate ecranele afișează același conținut simultan'
                      : 'Fiecare ecran afișează o pagină diferită în secvență'}
                  </p>
                </div>

                <div className="pt-4 space-y-3">
                  <div className="p-4 bg-indigo-50/50 rounded-xl">
                    <p className="text-sm font-medium text-slate-800 mb-2">
                      Rezumat:
                    </p>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>• {selectedScreens.length} ecrane selectate</li>
                      <li>• Tip: {syncType === 'simple' ? 'Simplă' : 'Cascadă'}</li>
                      {masterScreenId && (
                        <li>• Master: {screens.find(s => s.id === masterScreenId)?.name}</li>
                      )}
                    </ul>
                  </div>

                  <Button
                    onClick={handleSync}
                    disabled={syncing || selectedScreens.length < 2 || !masterScreenId}
                    className="w-full btn-primary"
                    data-testid="sync-button"
                  >
                    {syncing ? (
                      <div className="flex items-center gap-2">
                        <div className="spinner w-4 h-4"></div>
                        Se sincronizează...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Shuffle className="w-5 h-5" />
                        Sincronizează ecranele
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
