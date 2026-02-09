import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Music,
    Radio,
    Plus,
    Trash2,
    Play,
    Upload,
    ExternalLink,
    Copy,
    ArrowLeft,
    Save,
    Youtube
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const AudioStreaming = () => {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // list, detail
    const [activePlaylist, setActivePlaylist] = useState(null);
    const [locations, setLocations] = useState([]);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [adFrequency, setAdFrequency] = useState(3);

    // Upload/Add Track states
    const [uploadType, setUploadType] = useState('music'); // music, ad
    const [uploadFile, setUploadFile] = useState(null);
    const [trackTitle, setTrackTitle] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchPlaylists();
        fetchLocations();
    }, []);

    const fetchPlaylists = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/audio/playlists`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPlaylists(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchLocations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/locations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLocations(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreatePlaylist = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/audio/playlists`, {
                name: newPlaylistName,
                location_id: selectedLocation || null,
                ad_frequency: parseInt(adFrequency)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowCreateModal(false);
            setNewPlaylistName('');
            fetchPlaylists();
        } catch (err) {
            alert("Eroare la creare playlist");
        }
    };

    const handleDeletePlaylist = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Sigur ștergi acest playlist?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/audio/playlists/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPlaylists();
            if (activePlaylist?.id === id) setView('list');
        } catch (err) {
            alert("Eroare la ștergere");
        }
    };

    const openPlaylist = async (id) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/audio/playlists/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setActivePlaylist(res.data);
            setView('detail');
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleAddTrack = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('playlist_id', activePlaylist.id);
            formData.append('title', trackTitle);
            formData.append('type', uploadType);

            if (youtubeUrl) {
                formData.append('youtube_url', youtubeUrl);
            } else if (uploadFile) {
                formData.append('file', uploadFile);
            } else {
                alert("Selectează un fișier sau introdu un link YouTube");
                setUploading(false);
                return;
            }

            await axios.post(`${API_URL}/api/audio/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Refresh playlist
            openPlaylist(activePlaylist.id);
            setTrackTitle('');
            setUploadFile(null);
            setYoutubeUrl('');
            setUploading(false);
        } catch (err) {
            console.error(err);
            alert("Eroare la upload");
            setUploading(false);
        }
    };

    const handleDeleteTrack = async (trackId) => {
        if (!window.confirm("Ștergi piesa?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/audio/tracks/${trackId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            openPlaylist(activePlaylist.id);
        } catch (err) {
            console.error(err);
        }
    };

    const copyPlayerLink = () => {
        const url = `${window.location.origin}/play-audio/${activePlaylist.id}`;
        navigator.clipboard.writeText(url);
        alert("Link copiat! Deschide-l pe dispozitivul din restaurant.");
    };

    if (loading && view === 'list') return (
        <DashboardLayout>
            <div className="p-8 text-white">Se încarcă...</div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">Audio Streaming & Ads</h1>
                        <p className="text-slate-400">Gestionează muzica ambientală și reclamele audio</p>
                    </div>
                    {view === 'list' && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-red-900/20"
                        >
                            <Plus size={20} />
                            Playlist Nou
                        </button>
                    )}
                </div>

                {view === 'list' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {playlists.map(pl => (
                            <div
                                key={pl.id}
                                onClick={() => openPlaylist(pl.id)}
                                className="glass-panel p-6 rounded-xl cursor-pointer hover:border-red-500/50 transition-all group relative"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-red-500/10 rounded-lg text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                        <Music size={24} />
                                    </div>
                                    <button
                                        onClick={(e) => handleDeletePlaylist(pl.id, e)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">{pl.name}</h3>
                                <p className="text-slate-400 text-sm mb-4">
                                    {pl.location_name || "Fără locație"}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-slate-500 bg-black/20 p-2 rounded-lg w-fit">
                                    <Radio size={14} />
                                    <span>Reclame: 1 la {pl.ad_frequency} piese</span>
                                </div>
                            </div>
                        ))}

                        {playlists.length === 0 && (
                            <div className="col-span-full text-center py-12 text-slate-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                                <Music size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Nu există playlist-uri. Creează unul pentru a începe.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* DETAIL VIEW */
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-6">
                            <button
                                onClick={() => setView('list')}
                                className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{activePlaylist?.name}</h2>
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <span>{activePlaylist?.location_name}</span>
                                    <span>•</span>
                                    <span>Frecvență Reclame: {activePlaylist?.ad_frequency}</span>
                                </div>
                            </div>
                            <div className="ml-auto flex gap-3">
                                <button
                                    onClick={copyPlayerLink}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    <Copy size={18} />
                                    Copiază Link Player
                                </button>
                                <a
                                    href={`/play-audio/${activePlaylist?.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    <ExternalLink size={18} />
                                    Deschide Player
                                </a>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* LEFT: Tracks List */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Music Section */}
                                <div className="glass-panel p-6 rounded-xl">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <Music className="text-blue-400" size={20} /> Muzică
                                    </h3>
                                    <div className="space-y-2">
                                        {activePlaylist?.tracks?.filter(t => t.type === 'music').map((track, i) => (
                                            <div key={track.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group">
                                                <span className="text-slate-500 font-mono w-6">{i + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium truncate">{track.title}</p>
                                                    <p className="text-xs text-slate-500 uppercase">{track.source_type}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteTrack(track.id)}
                                                    className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {activePlaylist?.tracks?.filter(t => t.type === 'music').length === 0 && (
                                            <p className="text-slate-500 text-center py-4">Nicio piesă muzicală.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Ads Section */}
                                <div className="glass-panel p-6 rounded-xl border border-orange-500/20">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <Radio className="text-orange-400" size={20} /> Reclame / Promoții
                                    </h3>
                                    <p className="text-sm text-slate-400 mb-4">
                                        Acestea vor rula automat la fiecare {activePlaylist?.ad_frequency} piese muzicale.
                                    </p>
                                    <div className="space-y-2">
                                        {activePlaylist?.tracks?.filter(t => t.type === 'ad').map((track, i) => (
                                            <div key={track.id} className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-lg hover:bg-orange-500/20 transition-colors group">
                                                <span className="text-orange-500 font-mono w-6">AD</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium truncate">{track.title}</p>
                                                    <p className="text-xs text-slate-500 uppercase">{track.source_type}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteTrack(track.id)}
                                                    className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {activePlaylist?.tracks?.filter(t => t.type === 'ad').length === 0 && (
                                            <p className="text-slate-500 text-center py-4">Nicio reclamă adăugată.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Add Content */}
                            <div className="glass-panel p-6 rounded-xl h-fit">
                                <h3 className="text-lg font-bold text-white mb-6">Adaugă Conținut</h3>

                                <form onSubmit={handleAddTrack} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Tip Conținut</label>
                                        <div className="flex bg-black/40 p-1 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => setUploadType('music')}
                                                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${uploadType === 'music' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                Muzică
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setUploadType('ad')}
                                                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${uploadType === 'ad' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                Reclamă
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Titlu Piesă</label>
                                        <input
                                            type="text"
                                            value={trackTitle}
                                            onChange={e => setTrackTitle(e.target.value)}
                                            required
                                            placeholder="Ex: Summer Vibes sau Promo 50%"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-red-500"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <div className="flex gap-4 mb-2">
                                            <button
                                                type="button"
                                                onClick={() => { setYoutubeUrl(''); setUploadFile(null); }}
                                                className={`text-xs uppercase font-bold ${!youtubeUrl ? 'text-white' : 'text-slate-500'}`}
                                            >
                                                Upload MP3
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setYoutubeUrl('https://'); setUploadFile(null); }}
                                                className={`text-xs uppercase font-bold ${youtubeUrl ? 'text-white' : 'text-slate-500'}`}
                                            >
                                                YouTube Link
                                            </button>
                                        </div>

                                        {youtubeUrl !== '' ? (
                                            <input
                                                type="url"
                                                value={youtubeUrl}
                                                onChange={e => setYoutubeUrl(e.target.value)}
                                                placeholder="https://youtube.com/watch?v=..."
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-red-500 text-sm"
                                            />
                                        ) : (
                                            <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-white/30 transition-colors">
                                                <input
                                                    type="file"
                                                    accept="audio/*"
                                                    onChange={e => setUploadFile(e.target.files[0])}
                                                    className="hidden"
                                                    id="audio-upload"
                                                />
                                                <label htmlFor="audio-upload" className="cursor-pointer block">
                                                    <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                                                    <span className="text-sm text-slate-400">
                                                        {uploadFile ? uploadFile.name : "Click pentru upload MP3"}
                                                    </span>
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                    >
                                        {uploading ? 'Se încarcă...' : (
                                            <>
                                                <Plus size={18} /> Adaugă în Playlist
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* CREATE MODAL */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="glass-panel p-6 rounded-xl w-full max-w-md">
                            <h2 className="text-xl font-bold text-white mb-6">Playlist Nou</h2>
                            <form onSubmit={handleCreatePlaylist} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Nume Playlist</label>
                                    <input
                                        type="text"
                                        required
                                        value={newPlaylistName}
                                        onChange={e => setNewPlaylistName(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-red-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Locație</label>
                                    <select
                                        value={selectedLocation}
                                        onChange={e => setSelectedLocation(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-red-500"
                                    >
                                        <option value="">Fără locație (Playlist General)</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">
                                        Frecvență Reclame (la câte piese):
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={adFrequency}
                                        onChange={e => setAdFrequency(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-red-500"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-colors"
                                    >
                                        Anulează
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold transition-colors"
                                    >
                                        Creează
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AudioStreaming;
