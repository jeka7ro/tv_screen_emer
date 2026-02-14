import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import api from '../utils/api';

export const PlaylistSimulation = ({ playlistIds, playlists, onClose }) => {
    const [screens, setScreens] = useState([]);
    const [fullscreen, setFullscreen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadScreensForPlaylists();
    }, [playlistIds]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const loadScreensForPlaylists = async () => {
        try {
            // Get all screens
            const screensRes = await api.get('/screens');
            const allScreens = screensRes.data;

            // Filter screens that have any of the selected playlists
            const relevantScreens = [];
            for (const screen of allScreens) {
                try {
                    const zonesRes = await api.get(`/screen-zones/${screen.id}`);
                    const hasPlaylist = zonesRes.data.some(zone =>
                        zone.content_type === 'playlist' && playlistIds.includes(zone.playlist_id)
                    );
                    if (hasPlaylist) {
                        relevantScreens.push(screen);
                    }
                } catch (e) {
                    // Skip screens with zone errors
                    console.warn(`Failed to load zones for screen ${screen.id}:`, e);
                }
            }

            setScreens(relevantScreens);
        } catch (error) {
            console.error('Error loading screens:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFullscreen = () => {
        if (!fullscreen) {
            document.documentElement.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-900">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white/60 text-sm">Se încarcă simularea...</p>
                </div>
            </div>
        );
    }

    const gridCols = Math.ceil(Math.sqrt(screens.length));
    const gridRows = Math.ceil(screens.length / gridCols);

    return (
        <div className="relative w-full h-full bg-slate-900">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-white font-bold text-lg">
                            Simulare Live - {playlistIds.length} Playlist{playlistIds.length > 1 ? '-uri' : ''}
                        </h2>
                        <p className="text-white/60 text-sm">
                            {screens.length} ecran{screens.length !== 1 ? 'e' : ''} {screens.length > 0 && `(${gridCols}×${gridRows})`}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                            title={fullscreen ? "Ieși din fullscreen" : "Fullscreen"}
                        >
                            {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                            title="Închide"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid of screens */}
            <div className="w-full h-full p-8 pt-20">
                {screens.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/60 gap-3">
                        <div className="text-6xl">📺</div>
                        <p className="text-lg">Niciun ecran nu are aceste playlist-uri atribuite</p>
                        <p className="text-sm text-white/40">Atribuie playlist-urile la ecrane pentru a vedea simularea</p>
                    </div>
                ) : (
                    <div
                        className="grid gap-4 h-full"
                        style={{
                            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                            gridTemplateRows: `repeat(${gridRows}, 1fr)`
                        }}
                    >
                        {screens.map(screen => (
                            <div key={screen.id} className="relative bg-black rounded-lg overflow-hidden shadow-2xl border border-white/10">
                                <iframe
                                    src={`/display/${screen.slug}`}
                                    className="w-full h-full border-0"
                                    title={screen.name}
                                    allow="autoplay"
                                />
                                <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                    {screen.name}
                                </div>
                                <div className="absolute top-2 right-2">
                                    <div className={`w-2 h-2 rounded-full ${screen.status === 'online' ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
