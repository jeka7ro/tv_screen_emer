import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Shuffle, Tv, Image as ImageIcon, Film, Type, Edit } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export const ScreenSync = () => {
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
  const [screens, setScreens] = useState([]);
  const [locations, setLocations] = useState([]);
  const [contents, setContents] = useState([]); // New state for content
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [selectedScreens, setSelectedScreens] = useState([]);
  // const [masterScreenId, setMasterScreenId] = useState(''); // Removed in favor of content selection
  const [selectedContentId, setSelectedContentId] = useState(''); // Replaces masterScreenId
  const [groupName, setGroupName] = useState(''); // New state for group name

  const [syncType, setSyncType] = useState('simple');
  const [gridCols, setGridCols] = useState(2);
  const [gridRows, setGridRows] = useState(1);
  const [manualOrder, setManualOrder] = useState(false);

  const [activeGroups, setActiveGroups] = useState([]);
  const [previewContent, setPreviewContent] = useState(null);

  // Edit State
  const [editingGroup, setEditingGroup] = useState(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editContentId, setEditContentId] = useState('');

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Update preview when content changes
  useEffect(() => {
    if (selectedContentId) {
      const content = contents.find(c => c.id === selectedContentId);
      if (content) {
        // Construct URL assuming /uploads mount
        const url = content.type === 'video' && !content.thumbnail_url
          ? null
          : `${BACKEND_URL}${content.thumbnail_url || content.file_url}`;
        setPreviewContent({ type: content.type, url, name: content.name });
      }
    } else {
      setPreviewContent(null);
    }
  }, [selectedContentId, contents]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [screensRes, locationsRes, groupsRes, contentRes] = await Promise.all([
        api.get('/screens'),
        api.get('/locations'),
        api.get('/screen-sync/groups'),
        api.get('/content') // Fetch content
      ]);
      setScreens(screensRes.data);
      setLocations(locationsRes.data);
      setActiveGroups(groupsRes.data);

      // Filter only image/video content for sync?
      setContents(contentRes.data.filter(c => c.type === 'image' || c.type === 'video'));
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
    if (!selectedContentId) {
      toast.error('Selectează conținutul');
      return;
    }

    // Require Group Name if wanted? Or optional. Let's make it optional but good UI practice to have it.
    // User said "sa pot edita. redenumi. etc." - implies managing names.

    setSyncing(true);
    try {
      // Use selectedScreens order directly to respect user choice
      let orderedScreens = [...selectedScreens];

      const payload = {
        screen_ids: orderedScreens,
        sync_type: syncType,
        content_id: selectedContentId,
        group_name: groupName || undefined
      };

      if (syncType === 'matrix') {
        payload.grid_cols = parseInt(gridCols);
        payload.grid_rows = parseInt(gridRows);
      }

      await api.post('/screen-sync', payload);
      toast.success('Ecrane sincronizate cu succes!');

      // Reset selections? Maybe keep them for tweaking?
      // Usually user wants to see result.
      setSelectedScreens([]);
      setSelectedContentId('');
      setGroupName('');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Eroare la sincronizare');
    } finally {
      setSyncing(false);
    }
  };

  const handleUnsync = async (groupId) => {
    if (!window.confirm('Sigur dorești să oprești sincronizarea pentru acest grup?')) return;
    try {
      await api.delete(`/screen-sync/groups/${groupId}`);
      toast.success('Grup șters!');
      loadData();
    } catch (error) {
      toast.error('Eroare la ștergere');
    }
  };

  const openEditGroup = (group) => {
    setEditingGroup(group);
    setEditGroupName(group.name || '');
    setEditContentId('');
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;

    try {
      await api.put(`/screen-sync/groups/${editingGroup.id}`, {
        group_name: editGroupName,
        content_id: editContentId || undefined
      });
      toast.success('Grup actualizat!');
      setEditingGroup(null);
      loadData();
    } catch (error) {
      toast.error('Eroare la actualizare');
    }
  };

  const toggleScreen = (screenId) => {
    if (selectedScreens.includes(screenId)) {
      setSelectedScreens(selectedScreens.filter(id => id !== screenId));
    } else {
      setSelectedScreens([...selectedScreens, screenId]);
    }
  };

  const handleSelectLocation = (locationId, isSelected) => {
    const screensInLocation = screens
      .filter(s => s.location_id === locationId)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const screenIdsInLocation = screensInLocation.map(s => s.id);

    let newSelected = [...selectedScreens];
    if (isSelected) {
      // Add all from location if not already present
      screenIdsInLocation.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
    } else {
      // Remove all from location
      newSelected = newSelected.filter(id => !screenIdsInLocation.includes(id));
    }
    setSelectedScreens(newSelected);
  };

  const moveScreen = (index, direction) => {
    const newScreens = [...selectedScreens];
    if (direction === 'up' && index > 0) {
      [newScreens[index], newScreens[index - 1]] = [newScreens[index - 1], newScreens[index]];
    } else if (direction === 'down' && index < newScreens.length - 1) {
      [newScreens[index], newScreens[index + 1]] = [newScreens[index + 1], newScreens[index]];
    }
    setSelectedScreens(newScreens);
    setSelectedScreens(newScreens);
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Sincronizare Ecrane</h1>
            <p className="text-slate-500">Selectează ecranele și creează un grup sincronizat</p>
          </div>
          <div>
            <Button
              onClick={() => {
                setCreateModalOpen(true);
                setSelectedScreens([]);
                setGroupName('');
                setSelectedContentId('');
              }}
              className="btn-primary"
            >
              <Shuffle className="w-5 h-5 mr-2" />
              Creează Grup Sincronizat
            </Button>
          </div>
        </div>

        <div className="space-y-6">

          {/* Active Groups List - Full Width Table */}
          {activeGroups.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Grupuri Active
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Nume Grup</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Tip</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Ecrane</th>
                      <th className="text-right py-3 px-4 font-medium text-slate-600">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeGroups.map(group => (
                      <tr key={group.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{group.name || '-'}</div>
                          <div className="text-xs text-slate-500">{group.screen_count} ecrane</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wide">
                            {group.sync_type === 'matrix' ? 'Video Wall' : group.sync_type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {group.screen_names.map((name, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs border border-slate-200">
                                <Tv className="w-3 h-3 mr-1 opacity-50" />
                                {name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditGroup(group)}
                              className="h-8 gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleUnsync(group.id)}
                              className="h-8 gap-1 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 shadow-sm"
                            >
                              Oprește
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* CREATE GROUP MODAL */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configurează Grupul de Sincronizare</DialogTitle>
              <div className="text-sm text-muted-foreground hidden">
                Selectează ecranele și conținutul pentru a crea un grup sincronizat.
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* SECTION 1: Select Screens (Moved from Main Page) */}
              <div>
                <Label className="text-base font-semibold text-slate-800 mb-3 block border-b pb-2">1. Selectează Ecranele ({selectedScreens.length})</Label>
                <div className="flex items-center gap-2 mb-4 text-sm text-slate-500 italic">
                  Ordinea selecției contează pentru Matrix (1 = Stânga/Sus). Poți reordona folosind săgețile.
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {locations.map(location => {
                    const locationScreens = screens.filter(s => s.location_id === location.id);
                    if (locationScreens.length === 0) return null;

                    const allSelected = locationScreens.every(s => selectedScreens.includes(s.id));
                    const someSelected = locationScreens.some(s => selectedScreens.includes(s.id));

                    return (
                      <div key={location.id} className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={input => { if (input) input.indeterminate = someSelected && !allSelected; }}
                              onChange={(e) => handleSelectLocation(location.id, e.target.checked)}
                              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <h3 className="text-base font-bold text-slate-800">{location.name}</h3>
                            <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-200">
                              {locationScreens.length} ecrane
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8">
                          {locationScreens.sort((a, b) => a.name.localeCompare(b.name)).map((screen) => {
                            const isSelected = selectedScreens.includes(screen.id);
                            const selectedIndex = selectedScreens.indexOf(screen.id);
                            const isInActiveGroup = activeGroups.some(g => g.screen_names.includes(screen.name));

                            return (
                              <div key={screen.id} className="relative group">
                                <label
                                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                    ? 'border-indigo-400 bg-indigo-50/50'
                                    : 'border-slate-200 bg-white hover:bg-slate-50'
                                    }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleScreen(screen.id)}
                                    className="mt-1 rounded"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Tv className={`w-3.5 h-3.5 ${isInActiveGroup ? 'text-indigo-500' : 'text-slate-600'}`} />
                                      <p className="font-medium text-slate-800 text-sm">{screen.name}</p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      {/* Simplified status for modal compact view */}
                                      <span className={`w-2 h-2 rounded-full ${screen.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>

                                      {isSelected && (
                                        <span className="text-xs font-bold bg-slate-200 text-slate-700 w-5 h-5 flex items-center justify-center rounded-full">
                                          {selectedIndex + 1}
                                        </span>
                                      )}
                                      {isInActiveGroup && (
                                        <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded border border-indigo-200 opacity-70">
                                          Sinc
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </label>
                                {/* Reordering controls inside modal */}
                                {isSelected && (
                                  <div className="absolute right-1 top-1 flex flex-col gap-0.5">
                                    <button
                                      onClick={(e) => { e.preventDefault(); moveScreen(selectedIndex, 'up'); }}
                                      disabled={selectedIndex === 0 || !isSelected}
                                      className="p-0.5 bg-white shadow rounded hover:bg-indigo-50 disabled:opacity-30 text-[10px]"
                                    >
                                      ▲
                                    </button>
                                    <button
                                      onClick={(e) => { e.preventDefault(); moveScreen(selectedIndex, 'down'); }}
                                      disabled={selectedIndex === selectedScreens.length - 1 || !isSelected}
                                      className="p-0.5 bg-white shadow rounded hover:bg-indigo-50 disabled:opacity-30 text-[10px]"
                                    >
                                      ▼
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: Name & Config */}
              <div className="grid grid-cols-1 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold text-slate-800 mb-2 block">2. Detalii Grup</Label>
                    <Label className="text-xs text-slate-500 mb-1 block">Nume Grup (Opțional)</Label>
                    <Input
                      placeholder="ex: Video Wall Recepție"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-semibold text-slate-800 mb-3 block mt-4">3. Alege Conținutul</Label>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                      {contents.length === 0 && (
                        <div className="text-center py-8 text-slate-500 text-sm">
                          Nu există conținut disponibil.
                        </div>
                      )}
                      {contents.map(content => {
                        const isSelected = selectedContentId === content.id;
                        const imageUrl = content.thumbnail_url || content.file_url;
                        const fullUrl = imageUrl ? `${BACKEND_URL}${imageUrl}` : null;

                        return (
                          <div
                            key={content.id}
                            onClick={() => setSelectedContentId(content.id)}
                            className={`relative flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all hover:shadow-sm group ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 hover:border-primary/50 bg-white'
                              }`}
                          >
                            {/* Thumbnail */}
                            <div className="w-20 h-12 flex-shrink-0 bg-slate-900 rounded overflow-hidden relative">
                              {content.type === 'video' ? (
                                <video
                                  src={fullUrl}
                                  className="w-full h-full object-cover"
                                  muted
                                  playsInline
                                  onMouseOver={e => e.target.play()}
                                  onMouseOut={e => { e.target.pause(); e.target.currentTime = 0; }}
                                />
                              ) : (
                                <img
                                  src={fullUrl}
                                  alt={content.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              )}
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                {content.type === 'video' && <Film className="w-4 h-4 text-white/70" />}
                              </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
                                {content.title || content.name}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="capitalize">{content.type}</span>
                                <span>•</span>
                                <span className="capitalize">{content.category}</span>
                              </div>
                            </div>

                            {/* Checkbox */}
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-slate-300'
                              }`}>
                              {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
                        <SelectItem value="matrix">Matrix (Video Wall)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 mt-1">
                      {syncType === 'simple'
                        ? 'Aceeași imagine pe toate ecranele'
                        : syncType === 'cascade'
                          ? 'Redare secvențială (înșiruire)'
                          : 'Imagine împărțită pe grilă (Video Wall)'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {syncType === 'matrix' && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                      <div>
                        <Label className="text-xs uppercase text-indigo-900 font-bold mb-1 block">Coloane</Label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={gridCols}
                          onChange={(e) => setGridCols(e.target.value)}
                          className="w-full p-2 rounded-md border border-indigo-200 text-center"
                        />
                      </div>
                      <div>
                        <Label className="text-xs uppercase text-indigo-900 font-bold mb-1 block">Rânduri</Label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={gridRows}
                          onChange={(e) => setGridRows(e.target.value)}
                          className="w-full p-2 rounded-md border border-indigo-200 text-center"
                        />
                      </div>
                      <p className="col-span-2 text-[10px] text-center text-indigo-700">
                        Total grid: {gridCols * gridRows} zone
                      </p>
                    </div>
                  )}

                  {/* Layout Preview in Modal */}
                  {selectedContentId && (
                    <div className="pt-2">
                      <Label className="mb-2 block">Preview</Label>
                      <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-center min-h-[160px] max-h-[200px]">
                        {syncType === 'matrix' ? (
                          (() => {
                            const userCols = parseInt(gridCols) || 1;
                            const userRows = parseInt(gridRows) || 1;
                            const cols = userCols;
                            const rows = userRows;

                            return (
                              <div className="relative w-full aspect-video bg-slate-800 border border-slate-700 overflow-hidden">
                                {previewContent?.type === 'image' && (
                                  <img
                                    src={previewContent.url}
                                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                                    alt="Preview"
                                  />
                                )}
                                {previewContent?.type === 'video' && (
                                  <video
                                    src={previewContent.url}
                                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                                    muted
                                    loop
                                    autoPlay
                                  />
                                )}

                                <div className="absolute inset-0 flex items-center justify-center text-slate-100/30 text-[10px] font-mono tracking-widest z-0 -rotate-12">
                                  {`VIDEO WALL (${cols}x${rows})`}
                                </div>
                                <div
                                  className="absolute inset-0 grid gap-0 overflow-hidden" // Removed gap to simulate seamless video wall
                                  style={{
                                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                                    gridTemplateRows: `repeat(${rows}, 1fr)`
                                  }}
                                >
                                  {Array.from({ length: cols * rows }).map((_, slotIdx) => {
                                    let displayOrder = [...selectedScreens];

                                    const screenId = displayOrder[slotIdx];
                                    const screen = screens.find(s => s.id === screenId);

                                    if (!screenId) {
                                      return (
                                        <div key={`empty-${slotIdx}`} className="bg-slate-800/50 border border-slate-700/30 flex items-center justify-center">
                                          <span className="text-[8px] text-slate-600">Emp</span>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div key={screenId} className="flex items-center justify-center relative backdrop-blur-[2px] bg-indigo-500/10 border-indigo-500/50 border">
                                        <div className="text-center">
                                          <span className="text-white font-bold text-shadow text-xs drop-shadow-md block leading-none">{slotIdx + 1}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="flex gap-2 overflow-x-auto pb-2 w-full justify-center">
                            {selectedScreens.map((id, idx) => (
                              <div key={id} className="flex-shrink-0 w-12 aspect-video bg-slate-800 border-2 border-slate-600 rounded flex items-center justify-center relative">
                                <span className="text-white text-xs font-bold">
                                  {idx + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
                  Anulează
                </Button>
                <Button
                  onClick={() => {
                    handleSync();
                    setCreateModalOpen(false);
                  }}
                  disabled={syncing || selectedScreens.length < 2 || !selectedContentId}
                  className="btn-primary"
                >
                  {syncing ? (
                    <div className="flex items-center gap-2">
                      <div className="spinner w-4 h-4"></div>
                      Se aplică...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Shuffle className="w-5 h-5" />
                      Aplică Sincronizarea
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Group Modal */}
        <Dialog open={!!editingGroup} onOpenChange={(open) => !open && setEditingGroup(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editează Grup Sincronizare</DialogTitle>
              <div className="text-sm text-muted-foreground hidden">
                Modifică numele grupului sau conținutul afișat.
              </div>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nume Grup</Label>
                <Input
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-3 block">Schimbă Conținutul (Opțional)</Label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                  {contents.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      Nu există conținut disponibil.
                    </div>
                  )}
                  {contents.map(content => {
                    const isSelected = editContentId === content.id;
                    const imageUrl = content.thumbnail_url || content.file_url;
                    const fullUrl = imageUrl ? `${BACKEND_URL}${imageUrl}` : null;

                    return (
                      <div
                        key={content.id}
                        onClick={() => setEditContentId(content.id === editContentId ? '' : content.id)}
                        className={`relative flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all hover:shadow-sm group ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 hover:border-primary/50 bg-white'
                          }`}
                      >
                        {/* Thumbnail */}
                        <div className="w-20 h-12 flex-shrink-0 bg-slate-900 rounded overflow-hidden relative">
                          {content.type === 'video' ? (
                            <video
                              src={fullUrl}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              onMouseOver={e => e.target.play()}
                              onMouseOut={e => { e.target.pause(); e.target.currentTime = 0; }}
                            />
                          ) : (
                            <img
                              src={fullUrl}
                              alt={content.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {content.type === 'video' && <Film className="w-4 h-4 text-white/70" />}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
                            {content.title || content.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="capitalize">{content.type}</span>
                            <span>•</span>
                            <span className="capitalize">{content.category}</span>
                          </div>
                        </div>

                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-slate-300'
                          }`}>
                          {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Selectează doar dacă vrei să schimbi ce se afișează.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingGroup(null)}>Anulează</Button>
                <Button onClick={handleUpdateGroup}>Salvează Modificările</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

