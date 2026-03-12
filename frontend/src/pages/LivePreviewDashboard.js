import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import {
    Monitor,
    RefreshCw,
    Maximize2,
    Circle,
    MapPin,
    Clock,
    Image,
    Video,
    Menu,
    List,
    Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export const LivePreviewDashboard = () => {
    const [screens, setScreens] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedScreen, setSelectedScreen] = useState(null);
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [layoutMode, setLayoutMode] = useState('grid'); // 'grid' | 'seamless' | 'simulare'
    const [simulareScreenIds, setSimulareScreenIds] = useState([]);

    // Filters
    const [filterLocation, setFilterLocation] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSyncGroup, setFilterSyncGroup] = useState('all');

    // Auto-refresh
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    useEffect(() => {
        loadData();
    }, []);

    // Auto-refresh every 5 seconds
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            loadData(true);
        }, 5000);

        return () => clearInterval(interval);
    }, [autoRefresh]);

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);
        setRefreshing(true);

        try {
            const [screensRes, locationsRes] = await Promise.all([
                api.get('/screens'),
                api.get('/locations'),
            ]);

            // Fetch content for each screen
            const screensWithContent = await Promise.all(
                screensRes.data.map(async (screen) => {
                    try {
                        const zonesRes = await api.get(`/screen-zones/${screen.id}`);
                        const mainZone = zonesRes.data.find(z => z.zone_id === 'main');

                        let contentInfo = null;
                        if (mainZone) {
                            if (mainZone.content_id) {
                                const contentRes = await api.get(`/content/${mainZone.content_id}`);
                                contentInfo = {
                                    type: 'content',
                                    name: contentRes.data.title,
                                    contentType: contentRes.data.type,
                                    url: contentRes.data.file_url,
                                    thumbnail: contentRes.data.thumbnail_url || contentRes.data.file_url,
                                };
                            } else if (mainZone.digital_menu_id) {
                                const menuRes = await api.get(`/digital-menus/${mainZone.digital_menu_id}`);
                                contentInfo = {
                                    type: 'menu',
                                    name: menuRes.data.name,
                                    contentType: 'menu',
                                };
                            } else if (mainZone.playlist_id) {
                                const playlistRes = await api.get(`/playlists/${mainZone.playlist_id}`);
                                contentInfo = {
                                    type: 'playlist',
                                    name: playlistRes.data.name,
                                    contentType: 'playlist',
                                };
                            }
                        }

                        return {
                            ...screen,
                            currentContent: contentInfo,
                        };
                    } catch (error) {
                        return {
                            ...screen,
                            currentContent: null,
                        };
                    }
                })
            );

            setScreens(screensWithContent.sort((a, b) =>
                (a.name || '').localeCompare(b.name || '', undefined, { numeric: true })
            ));
            setLocations(locationsRes.data);
            setLastUpdate(new Date());
        } catch (error) {
            if (!silent) {
                toast.error('Eroare la încărcarea datelor');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getLocationName = (locationId) => {
        const location = locations.find(l => l.id === locationId);
        return location ? location.name : 'Unknown';
    };

    const getSyncGroupColor = (syncGroup) => {
        if (!syncGroup) return 'transparent';

        // Generate consistent color based on sync group string
        const hash = syncGroup.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0);
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 70%, 50%)`;
    };

    // Get unique sync groups
    const syncGroups = [...new Set(screens.filter(s => s.sync_group).map(s => s.sync_group))];

    // Filter screens
    const filteredScreens = screens.filter(screen => {
        if (filterLocation !== 'all' && screen.location_id !== filterLocation) return false;
        if (filterStatus !== 'all') {
            const isLive = screen.status === 'online' || screen.status === 'active';
            if (filterStatus === 'online' && !isLive) return false;
            if (filterStatus === 'offline' && isLive) return false;
        }
        if (filterSyncGroup !== 'all') {
            if (filterSyncGroup === 'none' && screen.sync_group) return false;
            if (filterSyncGroup !== 'none' && screen.sync_group !== filterSyncGroup) return false;
        }
        return true;
    });

    const getContentIcon = (content) => {
        if (!content) return <Monitor className="w-5 h-5 text-slate-400" />;

        switch (content.type) {
            case 'content':
                return content.contentType === 'video'
                    ? <Video className="w-5 h-5 text-purple-600" />
                    : <Image className="w-5 h-5 text-blue-600" />;
            case 'menu':
                return <Menu className="w-5 h-5 text-orange-600" />;
            case 'playlist':
                return <List className="w-5 h-5 text-green-600" />;
            default:
                return <Monitor className="w-5 h-5 text-slate-400" />;
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
            <div className="animate-in">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-800 mb-2">Live Preview</h1>
                        <p className="text-slate-500">
                            Monitorizare în timp real a tuturor ecranelor
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Clock className="w-4 h-4" />
                            <span>Actualizat: {lastUpdate.toLocaleTimeString('ro-RO')}</span>
                        </div>

                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${autoRefresh
                                ? 'bg-green-100 text-green-700 border-2 border-green-200'
                                : 'bg-slate-100 text-slate-600 border-2 border-slate-200'
                                }`}
                        >
                            {autoRefresh ? 'Auto ON' : 'Auto OFF'}
                        </button>

                        <button
                            onClick={() => loadData()}
                            disabled={refreshing}
                            className="btn-primary flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Reîncarcă
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-xl">
                                <Monitor className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Ecrane</p>
                                <p className="text-2xl font-bold text-slate-800">{screens.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-xl">
                                <Circle className="w-5 h-5 text-green-600 fill-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Online</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {screens.filter(s => s.status === 'online' || s.status === 'active').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-xl">
                                <Circle className="w-5 h-5 text-slate-400 fill-slate-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Offline</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {screens.filter(s => s.status !== 'online' && s.status !== 'active').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-xl">
                                <Monitor className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Grupuri Sync</p>
                                <p className="text-2xl font-bold text-slate-800">{syncGroups.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="glass-card p-4 mb-6">
                    <div className="flex items-center gap-4">
                        <Filter className="w-5 h-5 text-slate-400" />

                        <div className="flex-1">
                            <Select value={filterLocation} onValueChange={setFilterLocation}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Toate locațiile" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toate locațiile</SelectItem>
                                    {locations.map(loc => (
                                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1">
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Toate statusurile" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toate statusurile</SelectItem>
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="offline">Offline</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1">
                            <Select value={filterSyncGroup} onValueChange={setFilterSyncGroup}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Toate grupurile" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toate grupurile</SelectItem>
                                    <SelectItem value="none">Fără sincronizare</SelectItem>
                                    {syncGroups.map(group => {
                                        const groupName = screens.find(s => s.sync_group === group)?.sync_group_name;
                                        return (
                                            <SelectItem key={group} value={group}>
                                                {groupName || `Grup: ${group.substring(0, 8)}`}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {(filterLocation !== 'all' || filterStatus !== 'all' || filterSyncGroup !== 'all') && (
                            <button
                                onClick={() => {
                                    setFilterLocation('all');
                                    setFilterStatus('all');
                                    setFilterSyncGroup('all');
                                }}
                                className="text-sm text-slate-500 hover:text-slate-700 underline"
                            >
                                Resetează filtre
                            </button>
                        )}
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex justify-end mb-4">
                    <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1">
                        <button
                            onClick={() => setLayoutMode('grid')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${layoutMode === 'grid'
                                ? 'bg-white shadow text-slate-800'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Grid
                        </button>
                        <button
                            onClick={() => setLayoutMode('seamless')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${layoutMode === 'seamless'
                                ? 'bg-white shadow text-slate-800'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Video Wall
                        </button>
                        <button
                            onClick={() => {
                                setLayoutMode('simulare');
                                if (simulareScreenIds.length === 0) {
                                    setSimulareScreenIds(screens.slice(0, 3).map(s => s.id));
                                }
                            }}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${layoutMode === 'simulare'
                                ? 'bg-white shadow text-slate-800'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Simulare Live
                        </button>
                    </div>
                </div>

                {/* Screen Grid / Seamless Wall */}
                {layoutMode === 'simulare' ? (
                    /* Simulare Live - Storefront with Video Wall overlay on TV area */
                    <div className="flex flex-col items-center gap-4">
                        {/* Screen selector */}
                        <div className="w-full max-w-[1200px] flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <span className="text-sm font-semibold text-slate-600 mr-2">Ecrane afișate:</span>
                            {screens.map(s => {
                                const isSelected = simulareScreenIds.includes(s.id);
                                const count = simulareScreenIds.length;
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => {
                                            if (isSelected) {
                                                setSimulareScreenIds(prev => prev.filter(id => id !== s.id));
                                            } else if (count < 3) {
                                                setSimulareScreenIds(prev => [...prev, s.id]);
                                            }
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isSelected
                                            ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                                            : count >= 3
                                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                                : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                                            }`}
                                    >
                                        {s.name}
                                    </button>
                                );
                            })}
                            <span className="text-[11px] text-slate-400 ml-auto">{simulareScreenIds.length}/3 selectate</span>
                        </div>

                        <div
                            className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800"
                            style={{
                                width: '100%',
                                maxWidth: '1200px',
                                aspectRatio: '16/9',
                                backgroundImage: 'url(/storefront.jpg)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center 5%',
                                backgroundRepeat: 'no-repeat'
                            }}
                        >
                            {/* Video-wall container covering all 3 TVs */}
                            {(() => {
                                const selectedScreens = simulareScreenIds
                                    .map(id => screens.find(s => s.id === id))
                                    .filter(Boolean);
                                if (selectedScreens.length === 0) return (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-white/60 text-lg">Selectează ecrane pentru simulare</span>
                                    </div>
                                );

                                return (
                                    <div
                                        className="absolute flex"
                                        style={{
                                            left: '25.5%',
                                            top: '50%',
                                            width: '48%',
                                            height: '30%',
                                            gap: '0.6%',
                                        }}
                                    >
                                        {selectedScreens.slice(0, 3).map((s, idx) => (
                                            <div
                                                key={s.id}
                                                className="relative flex-1 overflow-hidden rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.8)]"
                                            >
                                                <iframe
                                                    src={`/display/${s.slug}?preview=true`}
                                                    title={s.name}
                                                    className="absolute inset-0 border-0 w-[1920px] h-[1080px]"
                                                    style={{
                                                        pointerEvents: 'none',
                                                        transformOrigin: 'top left',
                                                    }}
                                                    ref={el => {
                                                        if (el) {
                                                            const container = el.parentElement;
                                                            const scaleX = container.offsetWidth / 1920;
                                                            const scaleY = container.offsetHeight / 1080;
                                                            el.style.transform = `scale(${Math.min(scaleX, scaleY)})`;
                                                        }
                                                    }}
                                                />
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1 z-10">
                                                    <span className="text-[8px] font-bold text-white/90 uppercase tracking-wider">{s.name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}

                            {/* Legend overlay */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 z-20">
                                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Simulare Live — Vedere Reală Locație</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={
                        layoutMode === 'seamless'
                            ? "bg-slate-950 p-12 rounded-2xl overflow-y-auto space-y-12 min-h-[600px] border border-slate-800 shadow-2xl flex flex-col items-center"
                            : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    }>
                        {layoutMode === 'seamless' ? (
                            (() => {
                                const groups = {};
                                filteredScreens.forEach(s => {
                                    const gid = s.sync_group || 'un-synced';
                                    if (!groups[gid]) groups[gid] = [];
                                    groups[gid].push(s);
                                });

                                return Object.keys(groups).map(gid => {
                                    const groupScreens = groups[gid].sort((a, b) => (a.cascade_offset || 0) - (b.cascade_offset || 0));
                                    const sample = groupScreens[0];
                                    const isMatrix = sample.sync_type?.startsWith('matrix');

                                    let cols = groupScreens.length, rows = 1;
                                    if (isMatrix) {
                                        const dims = sample.sync_type.split(':')[1].split('x');
                                        cols = parseInt(dims[0]) || 2;
                                        rows = parseInt(dims[1]) || 1;
                                    }

                                    return (
                                        <div key={gid} className="flex flex-col items-center">
                                            <div className="mb-4 flex items-center gap-3">
                                                <div className="h-px w-12 bg-slate-700"></div>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                    {gid === 'un-synced' ? 'Ecrane Individuale' : `Grup: ${sample.sync_group_name || gid.substring(0, 8)}`}
                                                </span>
                                                <div className="h-px w-12 bg-slate-700"></div>
                                            </div>

                                            <div
                                                className="grid gap-1 bg-black p-1 rounded-lg shadow-2xl border border-slate-800"
                                                style={{
                                                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                                                    width: 'fit-content',
                                                    maxWidth: '100%'
                                                }}
                                            >
                                                {groupScreens.map(screen => {
                                                    return (
                                                        <div
                                                            key={screen.id}
                                                            className="relative aspect-video bg-black overflow-hidden group cursor-pointer border border-white/5"
                                                            style={{ width: isMatrix ? '260px' : '320px' }}
                                                            onClick={() => {
                                                                setSelectedScreen(screen);
                                                                setShowFullscreen(true);
                                                            }}
                                                        >
                                                            <iframe
                                                                src={`/display/${screen.slug}?preview=true`}
                                                                title={screen.name}
                                                                className="absolute inset-0 border-0 w-[1920px] h-[1080px]"
                                                                style={{
                                                                    pointerEvents: 'none',
                                                                    transform: `scale(${isMatrix ? 260 / 1920 : 320 / 1920})`,
                                                                    transformOrigin: 'top left'
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                                                            <div className="absolute bottom-1 left-1 z-20 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                <span className="text-[9px] font-bold text-white px-1 bg-black/60 rounded">
                                                                    {screen.name}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                });
                            })()
                        ) : filteredScreens.map((screen) => (
                            <div
                                key={screen.id}
                                className="glass-card p-4 cursor-pointer hover:shadow-xl transition-all"
                                style={{
                                    borderLeft: screen.sync_group ? `4px solid ${getSyncGroupColor(screen.sync_group)}` : 'none',
                                    aspectRatio: '16/9'
                                }}
                                onClick={() => {
                                    setSelectedScreen(screen);
                                    setShowFullscreen(true);
                                }}
                            >
                                {/* LIVE PREVIEW */}
                                <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden mb-3">
                                    <iframe
                                        src={`/display/${screen.slug}?preview=true`}
                                        title={screen.name}
                                        className="absolute inset-0 border-0 w-full h-full"
                                        style={{ pointerEvents: 'none' }}
                                    />
                                    <div className="absolute top-2 right-2 bg-black/70 p-1.5 rounded-lg z-20">
                                        <Maximize2 className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="absolute top-2 left-2 z-20">
                                        <span className={(screen.status === 'online' || screen.status === 'active') ? 'status-active' : 'status-offline'}>
                                            <Circle className="w-2 h-2 fill-current" />
                                            {(screen.status === 'online' || screen.status === 'active') ? 'online' : 'offline'}
                                        </span>
                                    </div>
                                </div>
                                {layoutMode === 'grid' && (
                                    <>
                                        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                            <Monitor className="w-4 h-4" />
                                            {screen.name}
                                        </h3>
                                        <div className="space-y-1.5 text-sm">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span>{getLocationName(screen.location_id)}</span>
                                            </div>
                                            {screen.currentContent && (
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    {getContentIcon(screen.currentContent)}
                                                    <span className="truncate">{screen.currentContent.name}</span>
                                                </div>
                                            )}
                                            {screen.sync_group && (
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: getSyncGroupColor(screen.sync_group) }}
                                                    />
                                                    <span className="text-xs text-slate-500">
                                                        Sync: {screen.sync_group.substring(0, 8)}...
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {filteredScreens.length === 0 && layoutMode !== 'simulare' && (
                    <div className="glass-card p-12 text-center">
                        <Monitor className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">
                            Niciun ecran găsit
                        </h3>
                        <p className="text-slate-500">
                            Ajustează filtrele pentru a vedea ecranele.
                        </p>
                    </div>
                )}
            </div>

            {/* Fullscreen Preview Dialog */}
            <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Monitor className="w-5 h-5" />
                            {selectedScreen?.name}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Previzualizare ecran fullscreen</DialogDescription>
                    </DialogHeader>

                    {selectedScreen && (
                        <div className="space-y-4">
                            {/* Large LIVE Preview */}
                            <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
                                <iframe
                                    src={`/display/${selectedScreen.slug}?preview=true`}
                                    title={selectedScreen.name}
                                    className="w-full h-full border-0"
                                    style={{
                                        transform: 'scale(1)',
                                        transformOrigin: 'top left',
                                    }}
                                />
                            </div>

                            {/* Screen Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="glass-card p-4">
                                    <p className="text-sm text-slate-500 mb-1">Locație</p>
                                    <p className="font-medium text-slate-800">
                                        {getLocationName(selectedScreen.location_id)}
                                    </p>
                                </div>

                                <div className="glass-card p-4">
                                    <p className="text-sm text-slate-500 mb-1">Status</p>
                                    <span className={(selectedScreen.status === 'online' || selectedScreen.status === 'active') ? 'status-active' : 'status-offline'}>
                                        {(selectedScreen.status === 'online' || selectedScreen.status === 'active') ? 'online' : 'offline'}
                                    </span>
                                </div>

                                {selectedScreen.currentContent && (
                                    <div className="glass-card p-4">
                                        <p className="text-sm text-slate-500 mb-1">Conținut Curent</p>
                                        <p className="font-medium text-slate-800 flex items-center gap-2">
                                            {getContentIcon(selectedScreen.currentContent)}
                                            {selectedScreen.currentContent.name}
                                        </p>
                                    </div>
                                )}

                                {selectedScreen.sync_group && (
                                    <div className="glass-card p-4">
                                        <p className="text-sm text-slate-500 mb-1">Grup Sincronizare</p>
                                        <p className="font-medium text-slate-800 flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: getSyncGroupColor(selectedScreen.sync_group) }}
                                            />
                                            {selectedScreen.sync_group}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </DashboardLayout >
    );
};
