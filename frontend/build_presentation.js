const fs = require('fs');
const path = require('path');

const brainDir = '/Users/eugeniucazmal/.gemini/antigravity/brain/0a4c4941-fa8a-4cf0-9ceb-63f5a116cc1f';
// Fallback if logo doesn't exist just in case, but it does
let logoB64 = '';
try {
    logoB64 = fs.readFileSync(path.join(brainDir, 'media__1772022047420.png')).toString('base64');
} catch (e) { }

const html = `<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <title>Screen Media - Prezentare</title>
    <style>
        @page { size: A4; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #cbd5e1; background: #0f172a; }
        .page { width: 210mm; height: 297mm; padding: 0; margin: 0 auto; background: #0f172a; position: relative; overflow: hidden; page-break-after: always; }
        .page:last-child { page-break-after: avoid; }
        .footer { position: absolute; bottom: 8mm; left: 14mm; right: 14mm; display: flex; justify-content: space-between; font-size: 10px; color: rgba(255,255,255,0.4); border-top: 1px solid rgba(255,255,255,0.1); padding-top: 5px; }

        /* ===== PAGE 1: HERO + GALLERY ===== */
        .hero-strip {
            padding: 22mm 18mm 14mm; color: white; position: relative;
        }
        .hero-strip::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
            background-size: 20px 20px;
        }
        .hero-inner { position: relative; z-index: 2; display: flex; gap: 20px; align-items: center; }
        .hero-left { flex-shrink: 0; text-align: center; }
        .hero-logo { width: 80px; height: 80px; border-radius: 20px; filter: drop-shadow(0 6px 20px rgba(0,0,0,0.3)); }
        .hero-right { flex: 1; }
        .hero-title { font-size: 32px; font-weight: 900; letter-spacing: -1.5px; margin-bottom: 3px; }
        .hero-sub { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.5); letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px; }
        .hero-desc { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.8); margin-bottom: 12px; }
        .hero-pills { display: flex; gap: 6px; flex-wrap: wrap; }
        .hero-pill { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 30px; padding: 5px 14px; font-size: 10px; color: rgba(255,255,255,0.75); font-weight: 600; }

        /* Gallery section */
        .gallery-section { padding: 6mm 14mm 8mm; }
        .gallery-title { font-size: 18px; font-weight: 800; color: white; margin-bottom: 3px; }
        .gallery-sub { font-size: 11px; color: #cbd5e1; margin-bottom: 12px; }
        .gallery-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .gallery-card { background: #1e293b; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 8px 20px rgba(0,0,0,0.2); display: flex; flex-direction: column; }
        
        /* CSS TV COMPOSITE */
        .gallery-tv-container { position: relative; height: 130px; overflow: hidden; background: #e2e8f0; flex-shrink: 0; }
        .gallery-tv-bg { position: absolute; inset: -15px; background-size: cover; background-position: center; filter: blur(3px) brightness(0.55); }
        .gallery-tv-frame { position: absolute; top: 18px; left: 22px; right: 22px; bottom: 18px; background: #000; border: 3px solid #222; border-radius: 6px; box-shadow: 0 8px 20px rgba(0,0,0,0.6); padding: 1px; display: flex; flex-direction: column; }
        .gallery-tv-frame img { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 2px; }
        .gallery-tv-stand { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); width: 30px; height: 10px; background: #333; border-radius: 2px; }
        
        .gallery-card-text { padding: 8px; flex: 1; background: transparent; }
        .gallery-card-title { font-size: 10px; font-weight: 800; color: white; margin-bottom: 3px; }
        .gallery-card-desc { font-size: 8px; color: #cbd5e1; line-height: 1.4; }

        /* ===== PAGE 2: MOCKUP + FEATURES SCALED UP ===== */
        .p2-header { display: flex; align-items: center; gap: 12px; padding: 18mm 14mm 0; margin-bottom: 10px; }
        .p2-logo { width: 44px; height: 44px; border-radius: 12px; }
        .p2-brand { font-size: 22px; font-weight: 800; color: white; margin-bottom: 2px; }
        .p2-sub { font-size: 11px; color: #cbd5e1; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
        .p2-accent { width: 60px; height: 4px; background: linear-gradient(90deg, #6366f1, #ec4899); border-radius: 2px; margin: 0 14mm 16px; }

        /* Bigger Mockup */
        .app-mockup {
            margin: 0 14mm 20px; border: 1.5px solid #cbd5e1; border-radius: 12px; overflow: hidden;
            box-shadow: 0 8px 25px rgba(0,0,0,0.08); height: 350px; display: flex;
        }
        .mock-sidebar {
            width: 170px; background: linear-gradient(180deg, #0f172a, #1e293b);
            color: rgba(255,255,255,0.7); padding: 12px 0; flex-shrink: 0;
        }
        .mock-sidebar-brand { display: flex; align-items: center; gap: 8px; padding: 4px 15px 15px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 8px; }
        .mock-sidebar-brand img { width: 24px; height: 24px; border-radius: 6px; }
        .mock-sidebar-brand span { font-size: 12px; font-weight: 700; color: white; }
        .mock-nav-item { padding: 6px 15px; font-size: 10px; display: flex; align-items: center; gap: 8px; }
        .mock-nav-item.active { background: rgba(239,68,68,0.15); color: white; border-left: 3px solid #ef4444; font-weight: 700; }
        .mock-nav-dot { width: 4px; height: 4px; border-radius: 50%; background: currentColor; opacity: 0.4; }
        .mock-main { flex: 1; background: #0f172a; padding: 18px; overflow: hidden; display: flex; flex-direction: column; border-left: 1px solid rgba(255,255,255,0.06); }
        .mock-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .mock-title { font-size: 18px; font-weight: 800; color: white; }
        .mock-title-badge { background: #10b981; color: white; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 10px; margin-left: 6px; vertical-align: middle; }
        .mock-btn { background: #ef4444; color: white; font-size: 10px; font-weight: 700; padding: 6px 14px; border-radius: 6px; border: none; }
        .mock-filters { display: flex; gap: 6px; margin-bottom: 15px; }
        .mock-filter { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 4px 10px; font-size: 9px; color: #cbd5e1; font-weight: 600; }
        .mock-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; flex: 1;}
        .mock-card { background: #1e293b; border-radius: 8px; border: 2px solid #10b981; overflow: hidden; display: flex; flex-direction: column;}
        .mock-card:nth-child(3), .mock-card:nth-child(6) { border-color: #ef4444; }
        .mock-card-header { padding: 6px 8px; display: flex; align-items: center; gap: 5px; }
        .mock-card-icon { width: 12px; height: 12px; background: #ef4444; border-radius: 3px; }
        .mock-card-name { font-size: 8.5px; font-weight: 700; color: white; }
        .mock-card-preview { flex: 1; margin: 0 4px; border-radius: 4px; overflow: hidden; }
        .mock-card-preview img { width: 100%; height: 100%; object-fit: cover; }
        .mock-card-footer { padding: 6px 8px; display: flex; justify-content: space-between; align-items: center; }
        .mock-badge { font-size: 7px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
        .mock-badge-on { background: rgba(22,163,74,0.2); color: #4ade80; }
        .mock-badge-off { background: rgba(220,38,38,0.2); color: #f87171; }
        .mock-card-btn { font-size: 7px; background: #ef4444; color: white; padding: 3px 8px; border-radius: 4px; border: none; font-weight: 600; }

        /* Scaled Features grid */
        .feat-section { padding: 0 14mm; }
        .feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
        .feat { background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 14px 14px; }
        .feat-title { font-size: 13px; font-weight: 800; color: white; margin-bottom: 5px; }
        .feat-desc { font-size: 10px; color: #cbd5e1; line-height: 1.5; }
        .section-title { font-size: 18px; font-weight: 800; color: white; margin-bottom: 12px; padding: 0 14mm; }
        .cta { margin: 10px 14mm 0; background: linear-gradient(90deg, #6366f1, #ec4899); border-radius: 8px; padding: 18px 24px; color: white; }
        .cta-title { font-size: 16px; font-weight: 800; margin-bottom: 3px; }
        .cta-sub { font-size: 11px; opacity: 0.9; }
    </style>
</head>
<body>

<!-- ========== PAGE 1: HERO + UNDE FUNCȚIONEAZĂ ========== -->
<div class="page">
    <div class="hero-strip">
        <div class="hero-inner">
            <div class="hero-left">
                <img src="data:image/png;base64,${logoB64}" class="hero-logo" />
            </div>
            <div class="hero-right">
                <div class="hero-title">SCREEN MEDIA</div>
                <div class="hero-sub">Digital Signage System</div>
                <p class="hero-desc">
                    Platforma completă pentru controlul de la distanță al ecranelor TV din toate locațiile dumneavoastră. Schimbați instantaneu conținut, meniuri, prețuri și oferte — fără USB, fără deplasări.
                </p>
                <div class="hero-pills">
                    <span class="hero-pill">Control Multi-Ecran</span>
                    <span class="hero-pill">Actualizare Instant</span>
                    <span class="hero-pill">Split-Zone</span>
                    <span class="hero-pill">Playlist Automat</span>
                    <span class="hero-pill">Video Wall</span>
                    <span class="hero-pill">Programare Calendar</span>
                    <span class="hero-pill">Offline Mode</span>
                    <span class="hero-pill">Multi-Brand</span>
                </div>
            </div>
        </div>
    </div>

    <div class="gallery-section">
        <div class="gallery-title">Unde funcționează Screen Media?</div>
        <div class="gallery-sub">Sistemul nostru poate fi afișat pe orice ecran pentru a rula imagini, promoții, prețuri și reclame specifice locației.</div>
        <div class="gallery-grid">
            
            <!-- Fast Food -->
            <div class="gallery-card">
                <div class="gallery-tv-container">
                    <div class="gallery-tv-bg" style="background-image: url('https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=250&fit=crop')"></div>
                    <div class="gallery-tv-stand"></div>
                    <div class="gallery-tv-frame">
                        <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=250&fit=crop" />
                    </div>
                </div>
                <div class="gallery-card-text">
                    <div class="gallery-card-title">Fast-Food & Restaurante</div>
                    <div class="gallery-card-desc">Ecrane cu meniuri digitale, prețuri, imagini cu burgeri/sushi, oferte combo deasupra caselor.</div>
                </div>
            </div>

            <!-- Mall -->
            <div class="gallery-card">
                <div class="gallery-tv-container">
                    <div class="gallery-tv-bg" style="background-image: url('https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=400&h=250&fit=crop')"></div>
                    <div class="gallery-tv-stand"></div>
                    <div class="gallery-tv-frame">
                        <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop" />
                    </div>
                </div>
                <div class="gallery-card-text">
                    <div class="gallery-card-title">Centre Comerciale</div>
                    <div class="gallery-card-desc">Panouri publicitare digitale rulate pe holurile mall-urilor, directoare și promoții la magazine.</div>
                </div>
            </div>

            <!-- Showroom -->
            <div class="gallery-card">
                <div class="gallery-tv-container">
                    <div class="gallery-tv-bg" style="background-image: url('https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=250&fit=crop')"></div>
                    <div class="gallery-tv-stand"></div>
                    <div class="gallery-tv-frame">
                        <img src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=250&fit=crop" />
                    </div>
                </div>
                <div class="gallery-card-text">
                    <div class="gallery-card-title">Showroom-uri Auto</div>
                    <div class="gallery-card-desc">Televizoare de lângă exponate afișând prețul, specificațiile mașinii, videoclipuri de prezentare.</div>
                </div>
            </div>

            <!-- Peco -->
            <div class="gallery-card">
                <div class="gallery-tv-container">
                    <div class="gallery-tv-bg" style="background-image: url('https://images.unsplash.com/photo-1545262810-77515befe149?w=400&h=250&fit=crop')"></div>
                    <div class="gallery-tv-stand"></div>
                    <div class="gallery-tv-frame">
                        <img src="https://images.unsplash.com/photo-1505576391880-b3f9d713dc4f?w=400&h=250&fit=crop" />
                    </div>
                </div>
                <div class="gallery-card-text">
                    <div class="gallery-card-title">Benzinării & Peco</div>
                    <div class="gallery-card-desc">Reclame la cafea și produse din shop rulate pe ecranele din interior sau la casele de marcat.</div>
                </div>
            </div>

            <!-- Farmacii -->
            <div class="gallery-card">
                <div class="gallery-tv-container">
                    <div class="gallery-tv-bg" style="background-image: url('https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&h=250&fit=crop')"></div>
                    <div class="gallery-tv-stand"></div>
                    <div class="gallery-tv-frame">
                        <img src="https://loremflickr.com/400/250/vitamins,pills" />
                    </div>
                </div>
                <div class="gallery-card-text">
                    <div class="gallery-card-title">Farmacii / Clinici</div>
                    <div class="gallery-card-desc">Ecrane de așteptare care afișează reclame la vitamine, promoții sezoniere, sfaturi de sănătate.</div>
                </div>
            </div>

            <!-- Cafenele -->
            <div class="gallery-card">
                <div class="gallery-tv-container">
                    <div class="gallery-tv-bg" style="background-image: url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=250&fit=crop')"></div>
                    <div class="gallery-tv-stand"></div>
                    <div class="gallery-tv-frame">
                        <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=250&fit=crop" />
                    </div>
                </div>
                <div class="gallery-card-text">
                    <div class="gallery-card-title">Cafenele & Baruri</div>
                    <div class="gallery-card-desc">Prezentarea meniului de băuturi cu oferte Happy Hour care se activează automat la oră fixă.</div>
                </div>
            </div>

            <!-- Imobiliare / Vitrine -->
            <div class="gallery-card">
                <div class="gallery-tv-container">
                    <div class="gallery-tv-bg" style="background-image: url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=250&fit=crop')"></div>
                    <div class="gallery-tv-stand"></div>
                    <div class="gallery-tv-frame">
                        <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=250&fit=crop" />
                    </div>
                </div>
                <div class="gallery-card-text">
                    <div class="gallery-card-title">Agenții Imobiliare</div>
                    <div class="gallery-card-desc">Ecrane orientate spre vitrină care rulează oferte de apartamente, prețuri și imagini de interior.</div>
                </div>
            </div>

            <!-- Receptii -->
            <div class="gallery-card">
                <div class="gallery-tv-container">
                    <div class="gallery-tv-bg" style="background-image: url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop')"></div>
                    <div class="gallery-tv-stand"></div>
                    <div class="gallery-tv-frame">
                        <img src="https://loremflickr.com/400/250/spa,resort" />
                    </div>
                </div>
                <div class="gallery-card-text">
                    <div class="gallery-card-title">Recepții Hoteluri</div>
                    <div class="gallery-card-desc">Welcome screens afișând informații pentru oaspeți, evenimente, oferte spa, curs valutar.</div>
                </div>
            </div>

        </div>
    </div>
    <div class="footer"><div>SCREEN MEDIA — Digital Signage</div><div>contact@getapp.ro | +40 75 77777 12</div><div>Pagina 1 / 2</div></div>
</div>

<!-- ========== PAGE 2: MOCKUP + ALL FEATURES ========== -->
<div class="page">
    <div class="p2-header">
        <img src="data:image/png;base64,${logoB64}" class="p2-logo" />
        <div><div class="p2-brand">Interfața Screen Media</div><div class="p2-sub">Panou de control complet</div></div>
    </div>
    <div class="p2-accent"></div>

    <div class="app-mockup">
        <div class="mock-sidebar">
            <div class="mock-sidebar-brand">
                <img src="data:image/png;base64,${logoB64}" />
                <span>Screen Media</span>
            </div>
            <div class="mock-nav-item"><span class="mock-nav-dot"></span> Dashboard</div>
            <div class="mock-nav-item"><span class="mock-nav-dot"></span> Live Preview</div>
            <div class="mock-nav-item"><span class="mock-nav-dot"></span> Locații</div>
            <div class="mock-nav-item active"><span class="mock-nav-dot"></span> Ecrane</div>
            <div class="mock-nav-item"><span class="mock-nav-dot"></span> Conținut</div>
            <div class="mock-nav-item"><span class="mock-nav-dot"></span> Sincronizare</div>
            <div class="mock-nav-item"><span class="mock-nav-dot"></span> Happy Hour</div>
            <div class="mock-nav-item"><span class="mock-nav-dot"></span> Playlist-uri</div>
            <div class="mock-nav-item"><span class="mock-nav-dot"></span> Produse</div>
            <div class="mock-nav-item"><span class="mock-nav-dot"></span> Meniuri Digitale</div>
        </div>
        <div class="mock-main">
            <div class="mock-topbar">
                <div><span class="mock-title">Ecrane</span><span class="mock-title-badge">25</span></div>
                <button class="mock-btn">+ Adaugă ecran</button>
            </div>
            <div class="mock-filters">
                <div class="mock-filter">BRAND: Toate ▾</div>
                <div class="mock-filter">ORAȘ: Toate ▾</div>
                <div class="mock-filter">LOCAȚIE: Toate ▾</div>
                <div class="mock-filter">ROTAȚIE: Toate ▾</div>
            </div>
            <div class="mock-grid">
                <div class="mock-card">
                    <div class="mock-card-header"><div class="mock-card-icon"></div><span class="mock-card-name">ECRAN LOBBY</span></div>
                    <div class="mock-card-preview"><img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=200&fit=crop" /></div>
                    <div class="mock-card-footer"><span class="mock-badge mock-badge-on">● ONLINE</span><button class="mock-card-btn">Link TV</button></div>
                </div>
                <div class="mock-card">
                    <div class="mock-card-header"><div class="mock-card-icon"></div><span class="mock-card-name">ECRAN BAR</span></div>
                    <div class="mock-card-preview"><img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=200&fit=crop" /></div>
                    <div class="mock-card-footer"><span class="mock-badge mock-badge-on">● ONLINE</span><button class="mock-card-btn">Link TV</button></div>
                </div>
                <div class="mock-card">
                    <div class="mock-card-header"><div class="mock-card-icon"></div><span class="mock-card-name">ECRAN TERASĂ</span></div>
                    <div class="mock-card-preview"><img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop" /></div>
                    <div class="mock-card-footer"><span class="mock-badge mock-badge-off">● OFFLINE</span><button class="mock-card-btn">Link TV</button></div>
                </div>
                <div class="mock-card">
                    <div class="mock-card-header"><div class="mock-card-icon"></div><span class="mock-card-name">ECRAN ETAJ</span></div>
                    <div class="mock-card-preview"><img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=200&fit=crop" /></div>
                    <div class="mock-card-footer"><span class="mock-badge mock-badge-on">● ONLINE</span><button class="mock-card-btn">Link TV</button></div>
                </div>
                <div class="mock-card">
                    <div class="mock-card-header"><div class="mock-card-icon"></div><span class="mock-card-name">ECRAN VITRINA</span></div>
                    <div class="mock-card-preview"><img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=200&fit=crop" /></div>
                    <div class="mock-card-footer"><span class="mock-badge mock-badge-on">● ONLINE</span><button class="mock-card-btn">Link TV</button></div>
                </div>
                <div class="mock-card">
                    <div class="mock-card-header"><div class="mock-card-icon"></div><span class="mock-card-name">ECRAN DEPOU</span></div>
                    <div class="mock-card-preview"><img src="https://images.unsplash.com/photo-1551218808-94e220e084d2?w=300&h=200&fit=crop" /></div>
                    <div class="mock-card-footer"><span class="mock-badge mock-badge-off">● OFFLINE</span><button class="mock-card-btn">Link TV</button></div>
                </div>
            </div>
        </div>
    </div>

    <div class="section-title">Funcționalități principale</div>
    <div class="feat-section">
        <div class="feat-grid">
            <div class="feat">
                <div class="feat-title">Actualizare Live</div>
                <div class="feat-desc">Orice modificare apare pe TV în secunde prin WebSocket. Fără refresh manual, sistem in timp real.</div>
            </div>
            <div class="feat">
                <div class="feat-title">Split-Zone</div>
                <div class="feat-desc">Afișați simultan video, imagini și text pe zone diferite ale aceluiași ecran. Configurabil dintr-un clic.</div>
            </div>
            <div class="feat">
                <div class="feat-title">Playlist & Rotație</div>
                <div class="feat-desc">Suport total pentru liste de redare cu secunde personalizabile și tranziții complet fluide.</div>
            </div>
            <div class="feat">
                <div class="feat-title">Video Wall</div>
                <div class="feat-desc">Sincronizare perfectă la nivel de secundă între TV-uri pentru un afișaj imens vizual continuu.</div>
            </div>
            <div class="feat">
                <div class="feat-title">Programare & Happy Hour</div>
                <div class="feat-desc">Meniuri care se schimbă singure la ora fixată. Porați campanii temporare 100% automat.</div>
            </div>
            <div class="feat">
                <div class="feat-title">Multi-Brand & Locații</div>
                <div class="feat-desc">Zeci de locații și branduri într-un singur cont cu permisiuni separate de utilizatori.</div>
            </div>
            <div class="feat">
                <div class="feat-title">Mod Offline Inteligent</div>
                <div class="feat-desc">Ecranele continuă cu ultimul conținut descărcat în caz de picare a internetului pe locație.</div>
            </div>
            <div class="feat">
                <div class="feat-title">Meniuri Digitale Integrate</div>
                <div class="feat-desc">Gestiune precisă de produse, categorii și etichete – platforma randează automat elementele pe ecran.</div>
            </div>
            <div class="feat">
                <div class="feat-title">Securitate Multi-Strat</div>
                <div class="feat-desc">Sistem robust bazat pe PIN de asociere dispozitive. Roluri stricte: SuperAdmin, Admin, Operator.</div>
            </div>
        </div>
    </div>

    <div class="cta">
        <div class="cta-title">Compatibil complet cu orice Smart TV modern (fără player adițional)</div>
        <div class="cta-sub">Integrare perfectă: LG WebOS, Samsung Tizen OS, Android TV, Amazon Fire TV, sau orice Browser.</div>
    </div>

    <div class="footer"><div>SCREEN MEDIA — Digital Signage</div><div>contact@getapp.ro | +40 75 77777 12</div><div>Pagina 2 / 2</div></div>
</div>

</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'presentation.html'), html);
console.log('✅ Re-rendered completely fixed presentation');
