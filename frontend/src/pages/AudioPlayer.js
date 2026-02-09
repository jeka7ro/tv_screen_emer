import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Play, Pause, SkipForward, Volume2, Music, Radio } from 'lucide-react';

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

    // Playback Logic States
    const [musicIndex, setMusicIndex] = useState(0);
    const [adIndex, setAdIndex] = useState(0);
    const [songsSinceLastAd, setSongsSinceLastAd] = useState(0);

    const audioRef = useRef(null);
    const youtubePlayerRef = useRef(null);

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

            // Auto-start first track if possible (browsers block auto-audio usually)
            if (tracks.length > 0) {
                // Start with first music track
                const firstMusic = tracks.find(t => t.type === 'music');
                if (firstMusic) setCurrentTrack(firstMusic);
            }

            setLoading(false);
        } catch (err) {
            setError("Playlist not found or error loading.");
            setLoading(false);
        }
    };

    const handleNextTrack = () => {
        if (!playlist) return;

        // Check if we need to play an ad
        const adFreq = playlist.ad_frequency || 3;

        // Logic: If songs played >= frequency AND we have ads -> Play Ad
        if (songsSinceLastAd >= adFreq && adTracks.length > 0) {
            console.log("Playing Ad...");
            // Play Ad
            const nextAdIndex = (adIndex + 1) % adTracks.length;
            setAdIndex(nextAdIndex); // Prepare for NEXT ad
            // But use CURRENT adIndex for now
            // Actually let's just cycle through ads
            const adToPlay = adTracks[adIndex % adTracks.length];

            setCurrentTrack(adToPlay);
            setSongsSinceLastAd(0); // Reset counter
            setAdIndex(prev => (prev + 1) % adTracks.length); // Increment for next time
        } else {
            console.log("Playing Music...");
            // Play Next Song
            const nextMusicIndex = (musicIndex + 1) % musicTracks.length;
            const songToPlay = musicTracks[nextMusicIndex];

            setCurrentTrack(songToPlay);
            setMusicIndex(nextMusicIndex);
            setSongsSinceLastAd(prev => prev + 1);
        }
    };

    useEffect(() => {
        if (currentTrack && isPlaying) {
            if (currentTrack.source_type === 'file') {
                const audio = audioRef.current;
                if (audio) {
                    audio.src = currentTrack.url;
                    audio.load();
                    audio.play().catch(e => console.log("User interaction needed for playback"));
                }
            } else if (currentTrack.source_type === 'youtube') {
                // Handle YouTube logic (simplified for now, ideally needs iframe API)
                // For now, let's assume we only support uploaded files for stability
                // Or just open link? Youtube audio only is tricky without library.
                // We will skip YT for now in this v1 MVP to ensure stability.
                handleNextTrack();
            }
        }
    }, [currentTrack]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    if (loading) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading Player...</div>;
    if (error) return <div className="h-screen bg-black text-red-500 flex items-center justify-center">{error}</div>;

    return (
        <div className="h-screen bg-slate-900 text-white flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black opacity-80 z-0"></div>

            {/* Animated Visualizer (Fake CSS) */}
            <div className={`flex items-end gap-1 h-32 mb-12 opacity-50 transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-30'}`}>
                {[...Array(10)].map((_, i) => (
                    <div
                        key={i}
                        className="w-4 bg-red-500 rounded-t-md animate-pulse"
                        style={{
                            height: isPlaying ? `${Math.random() * 100}%` : '20%',
                            animationDuration: `${0.5 + Math.random()}s`
                        }}
                    ></div>
                ))}
            </div>

            {/* Player Card */}
            <div className="z-10 bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 w-full max-w-md text-center shadow-2xl">
                <div className="mb-6">
                    <div className="w-24 h-24 bg-gradient-to-tr from-red-500 to-orange-500 rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg shadow-red-500/30">
                        {currentTrack?.type === 'ad' ? <Radio size={40} /> : <Music size={40} />}
                    </div>
                    <h2 className="text-2xl font-bold mb-1 truncate">{currentTrack?.title || "Select Track"}</h2>
                    <p className="text-slate-400 text-sm uppercase tracking-wider">
                        {currentTrack?.type === 'ad' ? 'Reclamă Sponsorizată' : playlist?.name}
                    </p>
                </div>

                {/* Audio Element Hidden */}
                <audio
                    ref={audioRef}
                    onEnded={handleNextTrack}
                    onError={(e) => console.error("Audio Error", e)}
                />

                {/* Controls */}
                <div className="flex items-center justify-center gap-6">
                    <button
                        onClick={togglePlay}
                        className="w-16 h-16 bg-white rounded-full text-black flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
                    >
                        {isPlaying ? <Pause size={32} fill="black" /> : <Play size={32} fill="black" className="ml-1" />}
                    </button>

                    <button
                        onClick={handleNextTrack}
                        className="p-4 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <SkipForward size={24} />
                    </button>
                </div>

                <div className="mt-8 flex items-center gap-3 text-slate-400">
                    <Volume2 size={16} />
                    <input
                        type="range"
                        min="0" max="1" step="0.1"
                        value={volume}
                        onChange={(e) => {
                            setVolume(e.target.value);
                            if (audioRef.current) audioRef.current.volume = e.target.value;
                        }}
                        className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                    />
                </div>
            </div>

            <div className="absolute bottom-8 text-slate-500 text-xs text-center">
                <p>SushiMaster Audio Stream</p>
                <p>Playlist: {playlist?.name}</p>
            </div>
        </div>
    );
};

export default AudioPlayer;
