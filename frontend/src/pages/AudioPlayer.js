import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Play, Pause, SkipForward, Volume2, Music, Radio, AlertCircle } from 'lucide-react';
import ReactPlayer from 'react-player';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const AudioPlayer = () => {
    const { playlistId } = useParams();
    const [playlist, setPlaylist] = useState(null);
    const [musicTracks, setMusicTracks] = useState([]);
    const [adTracks, setAdTracks] = useState([]);

    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.8);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasInteracted, setHasInteracted] = useState(false); // New state for autoplay policy

    // Playback Logic States
    const [musicIndex, setMusicIndex] = useState(0);
    const [adIndex, setAdIndex] = useState(0);
    const [songsSinceLastAd, setSongsSinceLastAd] = useState(0);

    const playerRef = useRef(null);

    useEffect(() => {
        fetchPlaylistData();
    }, [playlistId]);

    const fetchPlaylistData = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/public/audio-player/${playlistId}`);
            const pl = res.data.playlist;
            const tracks = res.data.tracks;

            setPlaylist(pl);
            setMusicTracks(tracks.filter(t => t.type === 'music'));
            setAdTracks(tracks.filter(t => t.type === 'ad'));

            if (tracks.length > 0) {
                const firstMusic = tracks.find(t => t.type === 'music');
                if (firstMusic) {
                    setCurrentTrack(firstMusic);
                }
            } else {
                setError("Playlist-ul este gol.");
            }

            setLoading(false);
        } catch (err) {
            setError("Playlist not found or error loading.");
            setLoading(false);
        }
    };

    const handleStartPlayback = () => {
        setHasInteracted(true);
        setIsPlaying(true);
    };

    const handleNextTrack = () => {
        if (!playlist) return;

        const adFreq = playlist.ad_frequency || 3;
        let currentSongsCount = songsSinceLastAd;
        let nextTrack = null;

        if (currentTrack?.type === 'music') {
            currentSongsCount++;
            setSongsSinceLastAd(currentSongsCount);
        }

        if (currentSongsCount >= adFreq && adTracks.length > 0 && currentTrack?.type !== 'ad') {
            // Ad Time
            console.log("Injecting Ad...");
            nextTrack = adTracks[adIndex % adTracks.length];
            setAdIndex(prev => prev + 1);
            setSongsSinceLastAd(0);
        } else {
            // Music Time
            console.log("Next Music...");
            if (musicTracks.length === 0) return;
            const nextMusicIndex = (musicIndex + 1) % musicTracks.length;
            nextTrack = musicTracks[nextMusicIndex];
            setMusicIndex(nextMusicIndex);
        }

        if (nextTrack) {
            setCurrentTrack(nextTrack);
            // Keep playing if already playing
            if (hasInteracted) setIsPlaying(true);
        }
    };

    const togglePlay = () => {
        if (!hasInteracted) {
            handleStartPlayback();
        } else {
            setIsPlaying(!isPlaying);
        }
    };

    const handlePlayerError = (e) => {
        console.error("Playback Error:", e);
        // Show visual feedback briefly or skip
        // toast.error("Eroare redare, se trece la următoarea...");
        setTimeout(handleNextTrack, 2000);
    };

    if (loading) return <div className="h-screen bg-slate-900 text-white flex items-center justify-center">Se încarcă Playerul...</div>;
    if (error) return <div className="h-screen bg-slate-900 text-red-500 flex flex-col gap-4 items-center justify-center"><AlertCircle size={48} /><p>{error}</p></div>;

    return (
        <div className="h-screen bg-slate-900 text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black opacity-80 z-0"></div>

            {/* React Player (Hidden off-screen but functional) */}
            <div className="fixed -left-[9999px] top-0" style={{ width: '640px', height: '360px' }}>
                <ReactPlayer
                    ref={playerRef}
                    url={currentTrack?.url}
                    playing={isPlaying}
                    volume={volume}
                    onEnded={handleNextTrack}
                    onError={handlePlayerError}
                    width="100%"
                    height="100%"
                    playsinline={true}
                    config={{
                        youtube: {
                            playerVars: { showinfo: 0, controls: 0, disablekb: 1, playsinline: 1 }
                        },
                        file: {
                            forceAudio: true
                        }
                    }}
                />
            </div>

            {/* OVERLAY for Autoplay Policy */}
            {!hasInteracted && !loading && !error && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <button
                        onClick={handleStartPlayback}
                        className="group relative flex items-center justify-center gap-4 bg-red-600 hover:bg-red-700 text-white px-12 py-6 rounded-2xl text-2xl font-bold transition-all transform hover:scale-105 shadow-2xl shadow-red-600/50"
                    >
                        <Play size={32} fill="white" className="animate-pulse" />
                        START RADIO
                        <div className="absolute inset-0 rounded-2xl ring-4 ring-white/20 group-hover:ring-white/40 transition-all"></div>
                    </button>
                    <p className="mt-6 text-slate-400 text-sm max-w-md text-center">
                        Browser-ul necesită permisiunea ta pentru a începe redarea audio.
                    </p>
                </div>
            )}

            {/* Visualizer */}
            <div className={`flex items-end gap-2 h-32 mb-12 transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-20'}`}>
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="w-3 md:w-4 bg-gradient-to-t from-red-600 to-orange-400 rounded-t-full shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                        style={{
                            height: isPlaying ? `${15 + Math.random() * 80}%` : '10%',
                            transition: 'height 0.2s ease',
                            animation: isPlaying ? `bounce ${0.4 + Math.random() * 0.4}s infinite alternate` : 'none'
                        }}
                    ></div>
                ))}
            </div>

            {/* Main Player Card */}
            <div className="z-10 bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/10 w-full max-w-md text-center shadow-2xl relative overflow-hidden group">
                {/* Glow behind */}
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600/20 to-indigo-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="relative z-10">
                    <div className="mb-8 relative">
                        <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6 shadow-2xl transition-all duration-700 ${isPlaying ? 'scale-100 shadow-red-500/40' : 'scale-95 shadow-none grayscale opacity-70'}`}>
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-red-600 to-orange-500 animate-spin-slow" style={{ animationDuration: '10s' }}></div>
                            <div className="absolute inset-1 rounded-full bg-slate-900 flex items-center justify-center">
                                {currentTrack?.type === 'ad' ?
                                    <Radio size={48} className="text-orange-500" /> :
                                    <Music size={48} className="text-red-500" />
                                }
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white truncate px-2 drop-shadow-md">
                                {currentTrack?.title || "Se încarcă..."}
                            </h2>
                            <div className="flex justify-center items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${currentTrack?.source_type === 'youtube' ? 'border-red-500 text-red-400 bg-red-500/10' : 'border-blue-500 text-blue-400 bg-blue-500/10'}`}>
                                    {currentTrack?.source_type === 'youtube' ? 'YOUTUBE' : 'MP3'}
                                </span>
                                <p className="text-slate-400 text-xs uppercase tracking-widest font-medium">
                                    {currentTrack?.type === 'ad' ? 'RECLAMĂ' : playlist?.name}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-8 mb-8">
                        <button
                            onClick={togglePlay}
                            className="w-20 h-20 bg-white rounded-full text-slate-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-white/20"
                        >
                            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </button>

                        <button
                            onClick={handleNextTrack}
                            className="p-4 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white hover:text-red-400 border border-white/5 hover:border-white/20"
                            title="Următoarea piesă"
                        >
                            <SkipForward size={24} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 text-slate-400 px-4">
                        <Volume2 size={18} />
                        <input
                            type="range"
                            min="0" max="1" step="0.05"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-red-500 hover:accent-red-400 transition-colors"
                        />
                    </div>
                </div>
            </div>

            <div className="absolute bottom-6 text-slate-600 text-[10px] text-center tracking-widest uppercase">
                <p>SushiMaster Audio Stream • {playlist?.name}</p>
            </div>

            <style>{`
        @keyframes bounce {
            0% { transform: scaleY(0.8); }
            100% { transform: scaleY(1.5); }
        }
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spin-slow 12s linear infinite;
        }
      `}</style>
        </div>
    );
};

export default AudioPlayer;
