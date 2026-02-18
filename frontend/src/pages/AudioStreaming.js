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
    Youtube,
    Settings
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

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editPlaylistData, setEditPlaylistData] = useState({ name: '', ad_frequency: 3, location_id: '' });

    // Audio Player State
    const [playingTrackId, setPlayingTrackId] = useState(null);
    const audioRef = React.useRef(null);

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

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/api/audio/playlists/${activePlaylist.id}`, {
                name: editPlaylistData.name,
                location_id: editPlaylistData.location_id || null,
                ad_frequency: parseInt(editPlaylistData.ad_frequency),
                description: ""
            }, { headers: { Authorization: `Bearer ${token}` } });

            setShowEditModal(false);
            //alert("Playlist actualizat!");
            openPlaylist(activePlaylist.id); // Refresh detail
            fetchPlaylists(); // Refresh list
        } catch (err) {
            alert("Eroare la actualizare.");
        }
    };

    const openEditModalHandler = () => {
        setEditPlaylistData({
            name: activePlaylist.name,
            ad_frequency: activePlaylist.ad_frequency,
            location_id: activePlaylist.location_id || ''
        });
        setShowEditModal(true);
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

    const handlePlayTrack = (track) => {
        if (playingTrackId === track.id) {
            // Stop playing
            if (audioRef.current) {
                audioRef.current.pause();
            }
            setPlayingTrackId(null);
        } else {
            // Start playing
            setPlayingTrackId(track.id);
            if (audioRef.current) {
                audioRef.current.src = `${API_URL}${track.file_url}`;
                audioRef.current.play().catch(err => {
                    console.error('Audio play error:', err);
                    alert('Eroare la redare audio. Verifică fișierul.');
                });
            }
        }
    };

    if (loading && view === 'list') return (
        <DashboardLayout>
            <div className="p-8 text-slate-800">Se încarcă...</div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Audio Streaming & Ads</h1>
                        <p className="text-slate-600">Gestionează muzica ambientală și reclamele audio</p>
                    </div>
                    {view === 'list' && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
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
                                className="bg-white/80 backdrop-blur-md border border-white/40 p-6 rounded-xl cursor-pointer hover:shadow-lg hover:border-red-200 transition-all group relative shadow-sm"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-red-50 rounded-lg text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                        <Music size={24} />
                                    </div>
                                    <button
                                        onClick={(e) => handleDeletePlaylist(pl.id, e)}
                                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1">{pl.name}</h3>
                                <p className="text-slate-500 text-sm mb-4">
                                    {pl.location_name || "Fără locație"}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 p-2 rounded-lg w-fit font-medium">
                                    <Radio size={14} className="text-slate-500" />
                                    <span>Reclame: 1 la {pl.ad_frequency} piese</span>
                                </div>
                            </div>
                        ))}

                        {playlists.length === 0 && (
                            <div className="col-span-full text-center py-12 text-slate-500 bg-white/50 rounded-xl border border-dashed border-slate-300">
                                <Music size={48} className="mx-auto mb-4 opacity-30 text-slate-400" />
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
                                className="p-2 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{activePlaylist?.name}</h2>
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <span>{activePlaylist?.location_name}</span>
                                    <span>•</span>
                                    <span>Frecvență Reclame: {activePlaylist?.ad_frequency}</span>
                                </div>
                            </div>
                            <div className="ml-auto flex gap-3">
                                <button
                                    onClick={openEditModalHandler}
                                    className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                                >
                                    <Settings size={18} />
                                    Setări
                                </button>
                                <button
                                    onClick={copyPlayerLink}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                                >
                                    <Copy size={18} />
                                    Copiază Link Player
                                </button>
                                <a
                                    href={`/play-audio/${activePlaylist?.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
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
                                <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-white/40 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <Music className="text-blue-500" size={20} /> Muzică
                                    </h3>
                                    <div className="space-y-2">
                                        {activePlaylist?.tracks?.filter(t => t.type === 'music').map((track, i) => (
                                            <div key={track.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group border border-slate-100">
                                                <span className="text-slate-400 font-mono w-6 font-bold">{i + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-slate-900 font-medium truncate">{track.title}</p>
                                                    <p className="text-xs text-slate-500 uppercase font-semibold">{track.source_type}</p>
                                                </div>
                                                <button
                                                    onClick={() => handlePlayTrack(track)}
                                                    className={`p-2 rounded-lg transition-all ${playingTrackId === track.id ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50'}`}
                                                    title="Play"
                                                >
                                                    <Play size={18} fill={playingTrackId === track.id ? 'white' : 'none'} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTrack(track.id)}
                                                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                        {activePlaylist?.tracks?.filter(t => t.type === 'music').length === 0 && (
                                            <p className="text-slate-400 text-center py-8 bg-slate-50 rounded-lg text-sm font-medium">Nicio piesă muzicală.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Ads Section */}
                                <div className="bg-orange-50/80 backdrop-blur-md p-6 rounded-xl border border-orange-200/50 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <Radio className="text-orange-500" size={20} /> Reclame / Promoții
                                    </h3>
                                    <p className="text-sm text-slate-500 mb-4 font-medium">
                                        Acestea vor rula automat la fiecare {activePlaylist?.ad_frequency} piese muzicale.
                                    </p>
                                    <div className="space-y-2">
                                        {activePlaylist?.tracks?.filter(t => t.type === 'ad').map((track, i) => (
                                            <div key={track.id} className="flex items-center gap-3 p-3 bg-white/60 rounded-lg hover:bg-white transition-colors group border border-orange-100">
                                                <span className="text-orange-500 font-mono w-6 font-bold text-xs">AD</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-slate-900 font-medium truncate">{track.title}</p>
                                                    <p className="text-xs text-slate-500 uppercase font-semibold">{track.source_type}</p>
                                                </div>
                                                <button
                                                    onClick={() => handlePlayTrack(track)}
                                                    className={`p-2 rounded-lg transition-all ${playingTrackId === track.id ? 'bg-orange-600 text-white' : 'text-orange-600 hover:bg-orange-50'}`}
                                                    title="Play"
                                                >
                                                    <Play size={18} fill={playingTrackId === track.id ? 'white' : 'none'} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTrack(track.id)}
                                                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                        {activePlaylist?.tracks?.filter(t => t.type === 'ad').length === 0 && (
                                            <p className="text-slate-400 text-center py-6 bg-white/40 rounded-lg text-sm font-medium">Nicio reclamă adăugată.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Add Content */}
                            <div className="bg-white/90 backdrop-blur-md p-6 rounded-xl h-fit border border-white/40 shadow-md">
                                <h3 className="text-lg font-bold text-slate-900 mb-6">Adaugă Conținut</h3>

                                <form onSubmit={handleAddTrack} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Tip Conținut</label>
                                        <div className="flex bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                                            <button
                                                type="button"
                                                onClick={() => setUploadType('music')}
                                                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all shadow-sm ${uploadType === 'music' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                                            >
                                                Muzică
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setUploadType('ad')}
                                                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all shadow-sm ${uploadType === 'ad' ? 'bg-orange-500 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                                            >
                                                Reclamă
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Titlu Piesă</label>
                                        <input
                                            type="text"
                                            value={trackTitle}
                                            onChange={e => setTrackTitle(e.target.value)}
                                            required
                                            placeholder="Ex: Summer Vibes sau Promo 50%"
                                            className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 shadow-sm"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <div className="flex gap-4 mb-3 border-b border-slate-200 pb-2">
                                            <button
                                                type="button"
                                                onClick={() => { setYoutubeUrl(''); setUploadFile(null); }}
                                                className={`text-xs uppercase font-bold px-2 py-1 ${!youtubeUrl ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                Upload MP3
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setYoutubeUrl('https://'); setUploadFile(null); }}
                                                className={`text-xs uppercase font-bold px-2 py-1 ${youtubeUrl ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-400 hover:text-slate-600'}`}
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
                                                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-red-500 text-sm shadow-sm"
                                            />
                                        ) : (
                                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer bg-slate-50">
                                                <input
                                                    type="file"
                                                    accept="audio/*"
                                                    onChange={e => setUploadFile(e.target.files[0])}
                                                    className="hidden"
                                                    id="audio-upload"
                                                />
                                                <label htmlFor="audio-upload" className="cursor-pointer block w-full h-full">
                                                    <Upload className="mx-auto text-slate-400 mb-3" size={32} />
                                                    <span className="text-sm font-medium text-slate-600 block">
                                                        {uploadFile ? <span className="text-blue-600 font-bold">{uploadFile.name}</span> : "Click pentru upload MP3"}
                                                    </span>
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-md mt-4"
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
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl border border-white/20">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Playlist Nou</h2>
                            <form onSubmit={handleCreatePlaylist} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nume Playlist</label>
                                    <input
                                        type="text"
                                        required
                                        value={newPlaylistName}
                                        onChange={e => setNewPlaylistName(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-red-500 shadow-sm"
                                        placeholder="Ex: Restaurant Centru"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Locație</label>
                                    <select
                                        value={selectedLocation}
                                        onChange={e => setSelectedLocation(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-red-500 shadow-sm"
                                    >
                                        <option value="">Fără locație (Playlist General)</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Frecvență Reclame (la câte piese):
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={adFrequency}
                                        onChange={e => setAdFrequency(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-red-500 shadow-sm"
                                    />
                                    <p className="text-xs text-slate-500 mt-1 ml-1">Ex: 3 înseamnă o reclamă după fiecare 3 melodii.</p>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg font-bold transition-colors"
                                    >
                                        Anulează
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-colors shadow-md"
                                    >
                                        Creează
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* EDIT MODAL */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl border border-white/20">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Editare Playlist</h2>
                            <form onSubmit={handleUpdate} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nume Playlist</label>
                                    <input
                                        type="text"
                                        required
                                        value={editPlaylistData.name}
                                        onChange={e => setEditPlaylistData({ ...editPlaylistData, name: e.target.value })}
                                        className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-red-500 shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Locație</label>
                                    <select
                                        value={editPlaylistData.location_id}
                                        onChange={e => setEditPlaylistData({ ...editPlaylistData, location_id: e.target.value })}
                                        className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-red-500 shadow-sm"
                                    >
                                        <option value="">Fără locație (Playlist General)</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Frecvență Reclame (la câte piese):
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={editPlaylistData.ad_frequency}
                                        onChange={e => setEditPlaylistData({ ...editPlaylistData, ad_frequency: e.target.value })}
                                        className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-red-500 shadow-sm"
                                    />
                                    <p className="text-xs text-slate-500 mt-1 ml-1">Ex: 3 înseamnă o reclamă după fiecare 3 melodii.</p>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg font-bold transition-colors"
                                    >
                                        Anulează
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-colors shadow-md"
                                    >
                                        Salvează
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Hidden Audio Player */}
                <audio
                    ref={audioRef}
                    onEnded={() => setPlayingTrackId(null)}
                    onError={(e) => {
                        console.error('Audio error:', e);
                        setPlayingTrackId(null);
                        alert('Eroare la redare audio');
                    }}
                />
            </div>
        </DashboardLayout>
    );
};

export default AudioStreaming;
