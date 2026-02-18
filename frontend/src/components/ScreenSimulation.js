import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const ScreenSimulation = ({ screenIds, screens, onClose }) => {
    const [loading, setLoading] = useState(false);

    const selectedScreens = screens.filter(s => screenIds.includes(s.id));

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

    return (
        <div className="relative w-full h-full bg-slate-900 flex flex-col items-center justify-center p-8">
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Închide"
            >
                <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <div className="mb-6 text-center">
                <h2 className="text-white font-bold text-2xl mb-2">
                    Simulare Live - {selectedScreens.length} Ecran{selectedScreens.length !== 1 ? 'e' : ''}
                </h2>
                {selectedScreens.length > 0 && selectedScreens.length < 3 && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-200 px-4 py-2 rounded-lg text-xs">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Pentru acuratețe maximă, selectează 3 ecrane</span>
                    </div>
                )}
            </div>

            {selectedScreens.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/60 gap-3">
                    <div className="text-6xl">📺</div>
                    <p className="text-lg">Niciun ecran selectat</p>
                    <p className="text-sm text-white/40">Selectează ecrane pentru a vedea simularea</p>
                </div>
            ) : (
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
                    <div
                        className="absolute flex"
                        style={{
                            left: '25.5%',
                            top: '55%',
                            width: '48%',
                            height: '35%',
                            gap: '0.6%',
                        }}
                    >
                        {selectedScreens.slice(0, 3).map((screen, idx) => (
                            <div
                                key={screen.id}
                                className="relative flex-1 overflow-hidden rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.8)]"
                            >
                                <iframe
                                    src={`/display/${screen.slug}?preview=true`}
                                    title={screen.name}
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
                                    <span className="text-[8px] font-bold text-white/90 uppercase tracking-wider">{screen.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Legend overlay */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 z-20">
                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Simulare Live — Vedere Reală Locație</span>
                    </div>
                </div>
            )}
        </div>
    );
};
