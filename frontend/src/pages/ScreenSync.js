import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Shuffle, Tv, Image as ImageIcon, Film, Type, Edit, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

export const ScreenSync = () => {
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
  const getFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/api/uploads') || url.startsWith('/uploads')) {
      const cleanUrl = url.startsWith('/api') ? url : `/api${url}`;
      return `${BACKEND_URL}${cleanUrl}`;
    }
    return `${BACKEND_URL}${url}`;
  };
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
  const [fitMode, setFitMode] = useState('cover'); // cover, contain
  const [manualOrder, setManualOrder] = useState(false);

  const [activeGroups, setActiveGroups] = useState([]);
  const [previewContent, setPreviewContent] = useState(null);

  // Edit State
  const [editingGroup, setEditingGroup] = useState(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editContentId, setEditContentId] = useState('');
  const [editSelectedScreens, setEditSelectedScreens] = useState([]);
  const [editFitMode, setEditFitMode] = useState('cover');
  const [deleteGroupId, setDeleteGroupId] = useState(null);

  // ... (keep createModalOpen)

  // ... (keep loadData logic)


  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Update preview when content changes
  useEffect(() => {
    if (selectedContentId) {
      const content = contents.find(c => c.id === selectedContentId);
      if (content) {
        // Construct URL assuming /uploads mount
        const url = content.type === 'video' && !content.thumbnail_url
          ? null
          : getFileUrl(content.thumbnail_url || content.file_url);
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
      toast.error('Selectează conținutul de afișat');
      return;
    }
    if (syncType === 'matrix') {
      const totalSlots = parseInt(gridCols) * parseInt(gridRows);
      if (selectedScreens.length !== totalSlots) {
        toast.error(`Matrix ${gridCols}x${gridRows} necesită exact ${totalSlots} ecrane. Ai selectat ${selectedScreens.length}.`);
        return;
      }
    }

    setSyncing(true);
    try {
      let orderedScreens = [...selectedScreens];

      const payload = {
        screen_ids: orderedScreens,
        sync_type: syncType,
        group_name: groupName || undefined,
        fit_mode: fitMode
      };

      if (selectedContentId) {
        payload.content_id = selectedContentId;
      }

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
    try {
      await api.delete(`/screen-sync/groups/${groupId}`);
      toast.success('Grup șters!');
      setDeleteGroupId(null);
      loadData();
    } catch (error) {
      toast.error('Eroare la ștergere');
    }
  };

  /* State for Edit Modal */
  const [editSyncType, setEditSyncType] = useState('simple');
  const [editGridCols, setEditGridCols] = useState(2);
  const [editGridRows, setEditGridRows] = useState(1);

  // Bulk Selection Helpers
  const bulkSelectLocation = (locationId, isEdit = false) => {
    const screensInLocation = screens
      .filter(s => s.location_id === locationId)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      .map(s => s.id);

    const currentSelected = isEdit ? editSelectedScreens : selectedScreens;
    const setFn = isEdit ? setEditSelectedScreens : setSelectedScreens;

    const allPresent = screensInLocation.every(id => currentSelected.includes(id));

    if (allPresent) {
      // Remove all of them
      setFn(currentSelected.filter(id => !screensInLocation.includes(id)));
    } else {
      // Add missing ones (preserving order of existing, appending new)
      const toAdd = screensInLocation.filter(id => !currentSelected.includes(id));
      setFn([...currentSelected, ...toAdd]);
    }
  };

  const selectAllScreens = (isEdit = false) => {
    const allScreenIds = screens
      .sort((a, b) => {
        const locA = locations.find(l => l.id === a.location_id)?.name || '';
        const locB = locations.find(l => l.id === b.location_id)?.name || '';
        if (locA !== locB) return locA.localeCompare(locB);
        return a.name.localeCompare(b.name, undefined, { numeric: true });
      })
      .map(s => s.id);

    const setFn = isEdit ? setEditSelectedScreens : setSelectedScreens;
    setFn(allScreenIds);
  };

  const openEditGroup = (group) => {
    setEditingGroup(group);
    setEditGroupName(group.name || '');
    setEditContentId('');

    // Parse Sync Type and Grid
    const typeStr = group.sync_type || 'simple';
    if (typeStr.startsWith('matrix:')) {
      setEditSyncType('matrix');
      const dims = typeStr.split(':')[1].split('x');
      setEditGridCols(parseInt(dims[0]) || 2);
      setEditGridRows(parseInt(dims[1]) || 1);
    } else {
      setEditSyncType(typeStr);
      setEditGridCols(2);
      setEditGridRows(1);
    }

    setEditFitMode(group.fit_mode || 'cover');

    // Initialize Ordered Screen List
    // We trust screen_ids if available for order.
    // If not, we fallback to names but that might lose order if names aren't sorted.
    // The backend now returns screen_ids, so we should rely on that.
    if (group.screen_ids && group.screen_ids.length > 0) {
      setEditSelectedScreens(group.screen_ids);
    } else {
      // Fallback: try to find ids from names (less reliable for order)
      const matchedIds = screens
        .filter(s => group.screen_names.includes(s.name))
        .map(s => s.id);
      setEditSelectedScreens(matchedIds);
    }
  };

  const toggleEditScreen = (screenId) => {
    // If exists, remove it
    if (editSelectedScreens.includes(screenId)) {
      setEditSelectedScreens(editSelectedScreens.filter(id => id !== screenId));
    } else {
      // If adding, append to END (preserving order of existing)
      setEditSelectedScreens([...editSelectedScreens, screenId]);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;

    // Validate Matrix
    if (editSyncType === 'matrix') {
      const totalSlots = editGridCols * editGridRows;
      if (editSelectedScreens.length !== totalSlots) {
        toast.error(`Matrix ${editGridCols}x${editGridRows} necesită exact ${totalSlots} ecrane. Ai selectat ${editSelectedScreens.length}.`);
        return;
      }
    }

    try {
      const payload = {
        group_name: editGroupName,
        content_id: editContentId || undefined,
        screen_ids: editSelectedScreens,
        sync_type: editSyncType,
        fit_mode: editFitMode
      };

      if (editSyncType === 'matrix') {
        payload.grid_cols = editGridCols;
        payload.grid_rows = editGridRows;
      }

      await api.put(`/screen-sync/groups/${editingGroup.id}`, payload);
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
  };

  const moveEditScreen = (index, direction) => {
    const newScreens = [...editSelectedScreens];
    if (direction === 'up' && index > 0) {
      [newScreens[index], newScreens[index - 1]] = [newScreens[index - 1], newScreens[index]];
    } else if (direction === 'down' && index < newScreens.length - 1) {
      [newScreens[index], newScreens[index + 1]] = [newScreens[index + 1], newScreens[index]];
    }
    setEditSelectedScreens(newScreens);
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
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Creat de</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Data</th>
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
                        <td className="py-3 px-4">
                          <span className="text-sm text-slate-700 font-medium">{group.created_by || '-'}</span>
                        </td>
                        <td className="py-3 px-4">
                          {group.created_at ? (
                            <div>
                              <div className="text-sm text-slate-700">{new Date(group.created_at).toLocaleDateString('ro-RO')}</div>
                              <div className="text-xs text-slate-400">{new Date(group.created_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          ) : <span className="text-slate-400">-</span>}
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
                              onClick={() => setDeleteGroupId(group.id)}
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
              {/* SECTION 1: Select Screens (Ordered) */}
              <div>
                <Label className="text-base font-semibold text-slate-800 mb-2 block border-b pb-2">1. Selectează Ecranele ({selectedScreens.length})</Label>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-500 italic">
                    Click pe ecran pentru a-l adăuga în ordine.
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="xs"
                      className="text-[10px] h-7 bg-white hover:bg-slate-100"
                      onClick={() => selectAllScreens(false)}
                    >
                      Selectează absolut toate ecranele
                    </Button>
                    {syncType === 'matrix' && (
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                        Necesar: {parseInt(gridCols) * parseInt(gridRows)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {locations.map(location => {
                    const locationScreens = screens.filter(s => s.location_id === location.id);
                    if (locationScreens.length === 0) return null;

                    return (
                      <div key={location.id} className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            {location.name}
                            <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-200">
                              {locationScreens.length} ecrane
                            </span>
                          </h3>
                          <Button
                            variant="outline"
                            size="xs"
                            className="text-[10px] h-6 px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            onClick={() => bulkSelectLocation(location.id, false)}
                          >
                            {locationScreens.every(s => selectedScreens.includes(s.id)) ? 'Deselectează locația' : 'Selectează locația'}
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                          {locationScreens.sort((a, b) => a.name.localeCompare(b.name)).map((screen) => {
                            const selectedIndex = selectedScreens.indexOf(screen.id);
                            const isSelected = selectedIndex !== -1;
                            const isInActiveGroup = activeGroups.some(g => g.screen_names.includes(screen.name));

                            return (
                              <div
                                key={screen.id}
                                onClick={() => toggleScreen(screen.id)}
                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                  ? 'border-indigo-500 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500/20'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                                  }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    {isSelected ? selectedIndex + 1 : <Tv className="w-3 h-3" />}
                                  </div>
                                  <div>
                                    <p className={`font-medium text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{screen.name}</p>
                                    {isInActiveGroup && <span className="text-[10px] text-amber-600 font-medium">Deja sincronizat</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${screen.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                </div>
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
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-1.5 block">2. Nume Grup (Opțional)</Label>
                  <Input
                    placeholder="ex: Video Wall Recepție"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700 block">3. Tip sincronizare</Label>
                    <Select value={syncType} onValueChange={setSyncType}>
                      <SelectTrigger data-testid="sync-type-select" className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Sincronizare simplă</SelectItem>
                        <SelectItem value="cascade">Mod cascadă</SelectItem>
                        <SelectItem value="matrix">Matrix (Video Wall)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700 block">4. Mod Potrivire</Label>
                    <Select value={fitMode} onValueChange={setFitMode}>
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">Acoperă (Crop - Umple tot)</SelectItem>
                        <SelectItem value="contain">Conține (Întreg - Cu margini)</SelectItem>
                        <SelectItem value="fill">Întinde (Stretch - Tot conținutul)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 italic">
                  {syncType === 'simple'
                    ? 'Aceeași imagine pe toate ecranele.'
                    : syncType === 'cascade'
                      ? 'Redare secvențială (înșiruire) pe mai multe ecrane.'
                      : 'Imagine împărțită pe grilă (Video Wall).'}
                </p>
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

                <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-center">
                  <div className="w-full max-w-[400px]">
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
              </div>
            </div>

            {/* SECTION 5: Content Selection */}
            <div className="pt-2">
              <Label className="text-base font-semibold text-slate-800 mb-2 block border-b pb-2">5. Selectează Conținutul</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2 border border-slate-200 rounded-xl p-3 bg-slate-50/30">
                {contents.map(content => {
                  const isSelected = selectedContentId === content.id;
                  const imageUrl = content.thumbnail_url || content.file_url;
                  const fullUrl = getFileUrl(imageUrl);

                  return (
                    <div
                      key={content.id}
                      onClick={() => setSelectedContentId(content.id === selectedContentId ? '' : content.id)}
                      className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500' : 'border-slate-200 bg-white'}`}
                    >
                      <div className="w-14 h-9 flex-shrink-0 bg-slate-900 rounded overflow-hidden relative shadow-inner">
                        {content.type === 'video' && (
                          <Film className="absolute inset-0 m-auto w-3 h-3 text-white/40 z-10" />
                        )}
                        {fullUrl && <img src={fullUrl} className="w-full h-full object-cover opacity-80" alt="" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-[11px] font-bold truncate ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>{content.title || content.name}</h4>
                        <p className="text-[9px] text-slate-400 uppercase font-medium">{content.type}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>
                  );
                })}
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
          </DialogContent>
        </Dialog>

        {/* Edit Group Modal */}
        <Dialog open={!!editingGroup} onOpenChange={(open) => !open && setEditingGroup(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editează Grup Sincronizare</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">

              {/* 1. Name */}
              <div className="pt-2">
                <Label className="text-sm font-semibold text-slate-700 mb-1.5 block">1. Nume Grup</Label>
                <Input
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="bg-white border-slate-300 focus:border-indigo-500 shadow-sm"
                  placeholder="ex: Video Wall Recepție"
                />
              </div>

              {/* 2. Sync Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700 block text-xs uppercase tracking-wider">2. Tip Sincronizare</Label>
                  <Select value={editSyncType} onValueChange={setEditSyncType}>
                    <SelectTrigger className="bg-white border-slate-200 shadow-sm">
                      <SelectValue placeholder="Selectează tipul..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simplu (Oglindă)</SelectItem>
                      <SelectItem value="matrix">Matrix (Video Wall)</SelectItem>
                      <SelectItem value="cascade">Cascadă (Secvențial)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700 block text-xs uppercase tracking-wider">3. Mod Potrivire (Fit)</Label>
                  <Select value={editFitMode} onValueChange={setEditFitMode}>
                    <SelectTrigger className="bg-white border-slate-200 shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cover">Acoperă (Crop - Umple tot)</SelectItem>
                      <SelectItem value="contain">Conține (Întreg - Cu margini)</SelectItem>
                      <SelectItem value="fill">Întinde (Stretch - Tot conținutul)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 3. Matrix & Preview Preview Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="space-y-4">
                  <Label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Configurare Extra & Info</Label>

                  {editSyncType === 'matrix' && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase text-indigo-600 font-bold block">Coloane</Label>
                        <Input
                          type="number"
                          min="1"
                          value={editGridCols}
                          onChange={(e) => setEditGridCols(parseInt(e.target.value) || 1)}
                          className="h-9 bg-slate-50 border-slate-200 text-center font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase text-indigo-600 font-bold block">Rânduri</Label>
                        <Input
                          type="number"
                          min="1"
                          value={editGridRows}
                          onChange={(e) => setEditGridRows(parseInt(e.target.value) || 1)}
                          className="h-9 bg-slate-50 border-slate-200 text-center font-bold"
                        />
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500 uppercase font-bold text-[10px]">Ecrane selectate:</span>
                      <span className={`font-bold ${editSelectedScreens.length === (editSyncType === 'matrix' ? editGridCols * editGridRows : editSelectedScreens.length) ? 'text-emerald-600' : 'text-amber-500'}`}>
                        {editSelectedScreens.length} {editSyncType === 'matrix' && ` / ${editGridCols * editGridRows}`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${editSelectedScreens.length === (editSyncType === 'matrix' ? editGridCols * editGridRows : editSelectedScreens.length) ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, (editSelectedScreens.length / (editSyncType === 'matrix' ? editGridCols * editGridRows : editSelectedScreens.length || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Live Preview Wall */}
                <div className="bg-slate-900 rounded-2xl p-4 flex items-center justify-center min-h-[140px] shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-50"></div>
                  <div className="w-full max-w-[240px] relative z-10 transition-transform duration-500">
                    {editSyncType === 'matrix' ? (
                      (() => {
                        const cols = editGridCols || 1;
                        const rows = editGridRows || 1;
                        const previewCont = contents.find(c => c.id === editContentId) || contents.find(c => editingGroup && editingGroup.current_content_id === c.id);
                        const prevUrl = previewCont ? getFileUrl(previewCont.thumbnail_url || previewCont.file_url) : null;

                        return (
                          <div className="relative w-full aspect-video bg-black border border-slate-700 rounded shadow-2xl overflow-hidden flex items-center justify-center">
                            {previewCont?.type === 'image' && prevUrl && (
                              <img
                                src={prevUrl}
                                className="absolute inset-0 w-full h-full transition-all duration-300"
                                style={{ objectFit: editFitMode }}
                              />
                            )}
                            <div className="absolute inset-0 grid gap-0.5 pointer-events-none" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
                              {Array.from({ length: cols * rows }).map((_, idx) => (
                                <div key={idx} className={`border border-white/20 flex items-center justify-center ${idx < editSelectedScreens.length ? 'bg-indigo-500/20' : 'bg-slate-700/40'}`}>
                                  <span className="text-[7px] text-white/60 font-bold">{idx + 1}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="flex gap-1 overflow-x-auto pb-1 justify-center w-full">
                        {editSelectedScreens.length > 0 ? editSelectedScreens.map((id, idx) => {
                          const previewCont = contents.find(c => c.id === editContentId) || contents.find(c => editingGroup && editingGroup.current_content_id === c.id);
                          const prevUrl = previewCont ? getFileUrl(previewCont.thumbnail_url || previewCont.file_url) : null;
                          return (
                            <div key={id} className="relative flex-shrink-0 w-16 aspect-video bg-indigo-600 border border-indigo-400 rounded-sm flex items-center justify-center shadow-lg overflow-hidden">
                              {previewCont?.type === 'image' && prevUrl && (
                                <img src={prevUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                              )}
                              <span className="relative z-10 text-white text-[9px] font-bold">{idx + 1}</span>
                            </div>
                          );
                        }) : (
                          <div className="w-32 aspect-video bg-slate-800 border border-slate-700 border-dashed rounded flex items-center justify-center">
                            <span className="text-[10px] text-slate-500 italic">Previzualizare...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Screen Selection (Ordered) */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-semibold text-slate-700 block">4. Selectează Ecranele (În Ordine!)</Label>
                  <Button
                    variant="outline"
                    size="xs"
                    className="text-[10px] h-6 bg-white hover:bg-slate-50 text-indigo-600 border-indigo-100"
                    onClick={() => selectAllScreens(true)}
                  >
                    Selectează toate
                  </Button>
                </div>

                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 border border-slate-200 rounded-xl p-3 bg-slate-50/30">
                  {locations.map(location => {
                    const locScreens = screens.filter(s => s.location_id === location.id);
                    if (locScreens.length === 0) return null;

                    return (
                      <div key={location.id} className="mb-4 last:mb-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-slate-100">
                            {location.name}
                          </h4>
                          <Button
                            variant="ghost"
                            size="xs"
                            className="h-5 text-[9px] text-indigo-500 hover:text-indigo-700 p-0 px-2"
                            onClick={() => bulkSelectLocation(location.id, true)}
                          >
                            {locScreens.every(s => editSelectedScreens.includes(s.id)) ? 'Deselectează' : 'Selectează tot'}
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {locScreens.map(screen => {
                            const selectedIndex = editSelectedScreens.indexOf(screen.id);
                            const isSelected = selectedIndex !== -1;

                            return (
                              <div
                                key={screen.id}
                                onClick={() => toggleEditScreen(screen.id)}
                                className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all select-none ${isSelected ? 'bg-indigo-50 border-indigo-400 shadow-sm ring-1 ring-indigo-400/20' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {isSelected ? selectedIndex + 1 : <Tv className="w-3 h-3" />}
                                  </div>
                                  <span className={`text-[13px] ${isSelected ? 'font-bold text-indigo-900' : 'text-slate-600'}`}>{screen.name}</span>
                                </div>
                                {isSelected && (
                                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col">
                                      <button
                                        className="p-0.5 hover:bg-white rounded transition-colors disabled:opacity-30"
                                        onClick={() => moveEditScreen(selectedIndex, 'up')}
                                        disabled={selectedIndex === 0}
                                      >
                                        <ChevronUp className="w-3 h-3 text-indigo-600" />
                                      </button>
                                      <button
                                        className="p-0.5 hover:bg-white rounded transition-colors disabled:opacity-30"
                                        onClick={() => moveEditScreen(selectedIndex, 'down')}
                                        disabled={selectedIndex === editSelectedScreens.length - 1}
                                      >
                                        <ChevronDown className="w-3 h-3 text-indigo-600" />
                                      </button>
                                    </div>
                                    <div className="text-[9px] text-indigo-600 font-bold px-1.5 py-0.5 bg-indigo-100 rounded">
                                      POS {selectedIndex + 1}
                                    </div>
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

              {/* 5. Content Selection */}
              <div className="pt-2">
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">5. Schimbă Conținutul (Opțional)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2 border border-slate-200 rounded-xl p-3 bg-slate-50/30">
                  {contents.map(content => {
                    const isSelected = editContentId === content.id;
                    const imageUrl = content.thumbnail_url || content.file_url;
                    const fullUrl = getFileUrl(imageUrl);

                    return (
                      <div
                        key={content.id}
                        onClick={() => setEditContentId(content.id === editContentId ? '' : content.id)}
                        className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 bg-white'}`}
                      >
                        <div className="w-14 h-9 flex-shrink-0 bg-slate-900 rounded overflow-hidden relative shadow-inner">
                          {content.type === 'video' ? (
                            <Film className="absolute inset-0 m-auto w-3 h-3 text-white/40 z-10" />
                          ) : null}
                          <img src={fullUrl} className="w-full h-full object-cover opacity-80" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-[11px] font-bold truncate ${isSelected ? 'text-primary' : 'text-slate-700'}`}>{content.title || content.name}</h4>
                          <p className="text-[9px] text-slate-400 uppercase font-medium">{content.type}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6. Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingGroup(null)}
                  className="font-medium text-slate-600"
                >
                  Anulează
                </Button>
                <Button
                  onClick={handleUpdateGroup}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-indigo-200 shadow-lg"
                >
                  Salvează Modificările
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteGroupId} onOpenChange={() => setDeleteGroupId(null)}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-800">Confirmare Ștergere</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-slate-600">Sigur dorești să oprești sincronizarea pentru acest grup?</p>
              <p className="text-sm text-slate-400 mt-2">Ecranele vor fi decuplate și vor funcționa independent.</p>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={() => setDeleteGroupId(null)}>Anulează</Button>
              <Button
                onClick={() => handleUnsync(deleteGroupId)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Șterge Grupul
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div >
    </DashboardLayout >
  );
};

