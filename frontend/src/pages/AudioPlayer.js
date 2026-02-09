import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Play, Pause, SkipForward, Volume2, Music, Radio } from 'lucide-react';
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
    const [isReady, setIsReady] = useState(false);

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
                // Find first music track
                const firstMusic = tracks.find(t => t.type === 'music');
                if (firstMusic) {
                    setCurrentTrack(firstMusic);
                    // Don't auto-play immediately to avoid browser policy blocks
                }
            }

            setLoading(false);
        } catch (err) {
            setError("Playlist not found or error loading.");
            setLoading(false);
        }
    };

    const handleNextTrack = () => {
        if (!playlist) return;

        const adFreq = playlist.ad_frequency || 3;

        // Logic: If songs played >= frequency AND we have ads -> Play Ad
        // BUT checking existing state might be lagging if we just played a song.
        // Actually, we increment AFTER playing.

        // Check if we JUST played a song and need an ad now
        // If current track was music, increment counter.
        let currentSongsCount = songsSinceLastAd;

        // Determine next track
        let nextTrack = null;

        if (currentTrack?.type === 'music') {
            currentSongsCount++;
            setSongsSinceLastAd(currentSongsCount);
        }

        if (currentSongsCount >= adFreq && adTracks.length > 0 && currentTrack?.type !== 'ad') {
            // Time for Ad
            console.log("Injecting Ad...");
            nextTrack = adTracks[adIndex % adTracks.length];
            setAdIndex(prev => prev + 1);
            setSongsSinceLastAd(0); // Reset for next cycle
        } else {
            // Next Music
            console.log("Next Music...");
            const nextMusicIndex = (musicIndex + 1) % musicTracks.length;
            nextTrack = musicTracks[nextMusicIndex];
            setMusicIndex(nextMusicIndex);
        }

        if (nextTrack) {
            setCurrentTrack(nextTrack);
            setIsPlaying(true); // Ensure next track plays
        }
    };

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const handlePlayerReady = () => {
        setIsReady(true);
        // Optional: setIsPlaying(true) but user click is better
    };

    const handlePlayerError = (e) => {
        console.error("Playback Error:", e);
        // Auto skip on error
        setTimeout(handleNextTrack, 2000);
    };

    if (loading) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading Player...</div>;
    if (error) return <div className="h-screen bg-black text-red-500 flex items-center justify-center">{error}</div>;

    return (
        <div className="h-screen bg-slate-900 text-white flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black opacity-80 z-0"></div>

            {/* React Player (Hidden Visuals) */}
            <div className="absolute top-0 left-0 opacity-0 pointer-events-none">
                <ReactPlayer
                    ref={playerRef}
                    url={currentTrack?.url}
                    playing={isPlaying}
                    volume={volume}
                    onEnded={handleNextTrack}
                    onError={handlePlayerError}
                    onReady={handlePlayerReady}
                    width="1px"
                    height="1px"
                    playsinline={true}
                    config={{
                        youtube: {
                            playerVars: { showinfo: 0, controls: 0, disablekb: 1 }
                        },
                        file: {
                            forceAudio: true
                        }
                    }}
                />
            </div>

            {/* Animated Visualizer */}
            <div className={`flex items-end gap-1 h-32 mb-12 opacity-50 transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-30'}`}>
                {[...Array(10)].map((_, i) => (
                    <div
                        key={i}
                        className="w-4 bg-red-600 rounded-t-md animate-pulse"
                        style={{
                            height: isPlaying ? `${20 + Math.random() * 80}%` : '20%',
                            animationDuration: `${0.4 + Math.random() * 0.5}s`,
                            animationDelay: `${i * 0.1}s`
                        }}
                    ></div>
                ))}
            </div>

            {/* Player Card */}
            <div className="z-10 bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 w-full max-w-md text-center shadow-2xl">
                <div className="mb-6">
                    <div className="w-24 h-24 bg-gradient-to-tr from-red-600 to-orange-500 rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg shadow-red-500/30 animate-pulse-slow">
                        {currentTrack?.type === 'ad' ? <Radio size={40} className="text-white" /> : <Music size={40} className="text-white" />}
                    </div>
                    <h2 className="text-2xl font-bold mb-2 truncate text-white">{currentTrack?.title || "Select Track"}</h2>

                    <div className="flex justify-center items-center gap-2">
                        <span className="text-xs font-bold px-2 py-1 rounded bg-black/30 text-slate-300">
                            {currentTrack?.source_type === 'youtube' ? 'YOUTUBE' : 'MP3'}
                        </span>
                        <p className="text-slate-300 text-sm uppercase tracking-wider">
                            {currentTrack?.type === 'ad' ? 'RECLAMĂ' : playlist?.name}
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6 mb-8">
                    <button
                        onClick={togglePlay}
                        className="w-20 h-20 bg-white rounded-full text-red-600 flex items-center justify-center hover:scale-105 transition-transform shadow-xl hover:shadow-red-500/20"
                    >
                        {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
                    </button>

                    <button
                        onClick={handleNextTrack}
                        className="p-4 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white hover:text-red-400"
                    >
                        <SkipForward size={28} />
                    </button>
                </div>

                <div className="flex items-center gap-4 text-slate-300">
                    <Volume2 size={20} />
                    <input
                        type="range"
                        min="0" max="1" step="0.05"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-red-500"
                    />
                </div>
            </div>

            <div className="absolute bottom-8 text-slate-500 text-xs text-center">
                <p className="font-bold text-slate-400">SushiMaster Audio Stream</p>
                <p>Playlist: {playlist?.name}</p>
            </div>

            <style>{`
        @keyframes pulse-slow {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
        }
        .animate-pulse-slow {
            animation: pulse-slow 3s infinite ease-in-out;
        }
      `}</style>
        </div>
    );
};

export default AudioPlayer;
