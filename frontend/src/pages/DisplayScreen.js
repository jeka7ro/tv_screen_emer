import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/effects.css';
import { ValentineHearts } from '../components/ValentineHearts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SUPABASE_CONTENT_PREFIX = 'https://isdzbwxjtfrykyoeevmy.supabase.co/storage/v1/object/public/content/';
const SUPABASE_AUDIO_PREFIX = 'https://isdzbwxjtfrykyoeevmy.supabase.co/storage/v1/object/public/audio/';

// Running locally? Skip the Netlify CDN proxy — use Supabase URLs directly
const IS_LOCAL = BACKEND_URL && BACKEND_URL.includes('localhost');

const getFileUrl = (url) => {
  if (!url) return '';

  // On Netlify production: proxy Supabase through CDN to reduce egress
  // Locally: use Supabase URLs directly (the Netlify proxy /supabase-media/ doesn't exist locally)
  if (!IS_LOCAL) {
    if (url.startsWith(SUPABASE_CONTENT_PREFIX)) {
      return '/supabase-media/' + url.substring(SUPABASE_CONTENT_PREFIX.length);
    }
    if (url.startsWith(SUPABASE_AUDIO_PREFIX)) {
      return '/supabase-audio/' + url.substring(SUPABASE_AUDIO_PREFIX.length);
    }
  }

  if (url.startsWith('http')) return url;
  if (url.startsWith('/api/uploads') || url.startsWith('/uploads')) {
    const cleanUrl = url.startsWith('/api') ? url : `/api${url}`;
    return `${BACKEND_URL}${cleanUrl}`;
  }
  return url;
};

const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  let videoId = '';
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    /^[a-zA-Z0-9_-]{11}$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      videoId = match[1] || match[0];
      break;
    }
  }
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&rel=0`;
  }
  return url;
};

export const DisplayScreen = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const securityCodeParam = searchParams.get('code');
  const isPreview = searchParams.get('preview') === 'true';
  const [displayData, setDisplayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);
  const [securityCode, setSecurityCode] = useState('');
  const [needsAuth, setNeedsAuth] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(null);
  const isDebug = searchParams.get('debug') === 'true';

  // ===== ANTI-STANDBY =====
  useEffect(() => {
    if (isPreview) return; // Do not run aggressive hardware keep-alives inside Admin dashboard thumbnails
    
    // 1. Simulate activity every 15s — title flicker tricks TV browsers
    const keepAlive = setInterval(() => {
      window.dispatchEvent(new Event('scroll'));
      const orig = document.title;
      document.title = orig + ' ';
      setTimeout(() => { document.title = orig; }, 100);
    }, 15000);

    // 2. WakeLock API (standard, silently fails if unsupported)
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (e) { /* unsupported */ }
    };
    requestWakeLock();

    // 3. Re-request wake lock when page becomes visible again
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // 4. SmartTV OS Idle Timer Bypass (LG/Hisense WebOS/VIDAA/Tizen)
    // Hardware auto-dimming and OS screensavers activate around 10-15 minutes if no real remote interaction occurs.
    let tvRefreshInterval = null;
    try {
      if (
        navigator.userAgent.indexOf('Web0S') >= 0 ||
        navigator.userAgent.indexOf('WebOS') >= 0 ||
        navigator.userAgent.indexOf('SmartTV') >= 0 ||
        navigator.userAgent.indexOf('VIDAA') >= 0 ||
        navigator.userAgent.indexOf('Hisense') >= 0 ||
        navigator.userAgent.indexOf('Tizen') >= 0
      ) {
        console.log('[AntiStandby] SmartTV detected. Initiating 9-minute Hard-Navigation bypass.');
        // 9 minutes (540,000 ms) beats both 10-min hardware Auto-Dimming and 15-min OS active Screensavers
        tvRefreshInterval = setInterval(() => {
          console.log('[AntiStandby] Forcing hard navigation to reset TV OS idle timers.');
          const currentUrl = new URL(window.location.href);
          // Timestamp bypasses the internal TV browser cache
          currentUrl.searchParams.set('t', Date.now().toString());
          window.location.replace(currentUrl.toString());
        }, 9 * 60 * 1000); 
      }
    } catch (e) { }

    return () => {
      clearInterval(keepAlive);
      if (tvRefreshInterval) clearInterval(tvRefreshInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLock) { try { wakeLock.release(); } catch (e) { } }
    };
  }, [isPreview]);

  const loadDisplayData = async () => {
    try {
      const code = securityCode || searchParams.get('code');
      const params = code ? `?security_code=${code}` : '';
      const response = await axios.get(`${API}/display/${slug}${params}`);

      const data = response.data;
      if (data && !data.zones_config && data.zones) {
        data.zones_config = data.zones;
      }

      setDisplayData(data);
      setNeedsAuth(false);
      setLoading(false);

      if (data.screen?.id && !isPreview) {
        axios.post(`${API}/screens/${data.screen.id}/heartbeat`).catch(() => { });
      }

      // Pre-cache all media URLs via Service Worker to reduce Supabase egress (Only for physical TVs, not Dashboard previews)
      if (!isPreview && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const mediaUrls = [];
        const zonesList = data.zones_config || data.zones || [];
        for (const zone of zonesList) {
          if (zone.content?.file_url) {
            mediaUrls.push(getFileUrl(zone.content.file_url));
          }
          if (zone.playlist?.content_items) {
            for (const item of zone.playlist.content_items) {
              if (item.file_url) mediaUrls.push(getFileUrl(item.file_url));
            }
          }
        }
        if (mediaUrls.length > 0) {
          const channel = new MessageChannel();
          navigator.serviceWorker.controller.postMessage(
            { type: 'CACHE_URLS', urls: mediaUrls },
            [channel.port2]
          );
          console.log(`[Display] Pre-caching ${mediaUrls.length} media URLs`);
        }
      }
    } catch (error) {
      console.error("Display load error:", error);
      if (error.response?.status === 403) {
        setNeedsAuth(true);
        setLoading(false);
      } else {
        setError(error.response?.data?.detail || 'Ecran negăsit');
        setLoading(false);
      }
    }
  };

  // Register Service Worker for media caching (reduces Supabase egress)
  useEffect(() => {
    if (isPreview) return; // Dashboard iframes do not need offline caching
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/media-cache-sw.js')
        .then(reg => console.log('[Display] Media cache SW registered:', reg.scope))
        .catch(err => console.warn('[Display] Media cache SW failed:', err));
    }
  }, [isPreview]);

  // Auto-reload safety net: if content doesn't load within 15s, refresh the page
  // Disabled in Preview mode (Dashboard) to prevent 25 iframes from DDOS-ing the local server on slow load
  useEffect(() => {
    if (isPreview) return;
    
    const reloadTimer = setTimeout(() => {
      if (!displayData) {
        console.warn('[Display] Content not loaded after 15s, reloading...');
        window.location.reload();
      }
    }, 15000);
    return () => clearTimeout(reloadTimer);
  }, [displayData, isPreview]);

  useEffect(() => {
    loadDisplayData();
  }, [slug]);

  // Reset playlist index to 0 when displayData changes (new config loaded)
  // Prevents stale index pointing beyond the new playlist's bounds → black screen
  useEffect(() => {
    setCurrentPlaylistIndex(0);
    setCurrentPage(0);
  }, [displayData?.screen?.id]);

  useEffect(() => {
    if (!displayData) return;
    const zonesList = displayData.zones_config || displayData.zones || [];

    // Digital Menu rotation
    const zoneWithMenu = zonesList.find(z => z.content_type === 'digital_menu');
    if (zoneWithMenu?.digital_menu?.auto_rotate) {
      const menu = zoneWithMenu.digital_menu;
      const totalProducts = menu.products?.length || 0;
      const totalPages = Math.ceil(totalProducts / (menu.products_per_page || 1));
      if (totalPages > 1) {
        const interval = setInterval(() => {
          setCurrentPage(prev => (prev + 1) % totalPages);
        }, (menu.page_duration || 10) * 1000);
        return () => clearInterval(interval);
      }
    }

    // Playlist rotation
    const zoneWithPlaylist = zonesList.find(z => z.content_type === 'playlist');
    if (zoneWithPlaylist?.playlist?.content_items?.length > 1) {
      const playlist = zoneWithPlaylist.playlist;
      const currentItem = playlist.content_items[currentPlaylistIndex];
      // Clamp to minimum 3s — prevents 0/NaN/undefined duration causing immediate black screen
      const rawDuration = Number(currentItem?.duration);
      const duration = (isFinite(rawDuration) && rawDuration >= 1) ? rawDuration : 10;

      const interval = setInterval(() => {
        setCurrentPlaylistIndex(prev => (prev + 1) % playlist.content_items.length);
      }, Math.max(duration, 3) * 1000);

      return () => clearInterval(interval);
    }
  }, [displayData, currentPlaylistIndex]);

  useEffect(() => {
    // Preview iframes don't need polling at all — saves egress
    if (isPreview) return;

    const pollInterval = setInterval(() => {
      // Off-hours check: restaurants closed 22:00-09:00, skip polling to save Supabase egress
      const hour = new Date().getHours();
      if (hour >= 22 || hour < 9) {
        console.debug('[Display] Off-hours (22:00-09:00), skipping poll');
        return;
      }

      const code = securityCode || searchParams.get('code');
      const params = code ? `?security_code=${code}` : '';
      axios.get(`${API}/display/${slug}${params}`)
        .then(response => {
          const newData = response.data;
          if (newData && !newData.zones_config && newData.zones) {
            newData.zones_config = newData.zones;
          }
          // Compare entire config — catches ANY change (effects, zones, sync, templates, happy hour)
          const oldHash = JSON.stringify({ s: displayData?.screen, z: displayData?.zones_config, si: displayData?.sync_info, hh: displayData?.happy_hour_active });
          const newHash = JSON.stringify({ s: newData?.screen, z: newData?.zones_config, si: newData?.sync_info, hh: newData?.happy_hour_active });
          if (oldHash !== newHash) {
            setDisplayData(newData);
          }
          // Piggyback heartbeat on every poll — keeps status accurate
          if (newData?.screen?.id) {
            axios.post(`${API}/screens/${newData.screen.id}/heartbeat`).catch(() => { });
          }
        })
        .catch(err => console.debug("Poll failed", err));
    }, 30000); // Poll every 30 seconds (also serves as heartbeat)
    return () => clearInterval(pollInterval);
  }, [slug, securityCode, displayData, isPreview]);

  // Happy Hour Timer Countdown - uses absolute endTimestamp for persistence
  useEffect(() => {
    if (!displayData?.screen?.id) return;

    const savedTimer = localStorage.getItem(`happy_hour_timer_${displayData.screen.id}`);
    if (!savedTimer) {
      setTimerSeconds(null);
      return;
    }

    try {
      const timerSettings = JSON.parse(savedTimer);
      if (!timerSettings.enabled) {
        setTimerSeconds(null);
        return;
      }

      // Use absolute endTimestamp for persistence across refreshes
      const endTimestamp = timerSettings.endTimestamp;
      if (!endTimestamp) {
        // Fallback: parse duration if no endTimestamp (legacy format)
        const parts = (timerSettings.endTime || '0:0:0').split(':');
        const hours = parseInt(parts[0] || 0);
        const minutes = parseInt(parts[1] || 0);
        const seconds = parseInt(parts[2] || 0);
        setTimerSeconds(hours * 3600 + minutes * 60 + seconds);
      } else {
        // Compute remaining seconds from absolute timestamp
        const remaining = Math.max(0, Math.floor((endTimestamp - Date.now()) / 1000));
        if (remaining <= 0) {
          setTimerSeconds(0);
          return;
        }
        setTimerSeconds(remaining);
      }

      // Countdown every second using endTimestamp for accuracy
      const countdownInterval = setInterval(() => {
        if (endTimestamp) {
          const remaining = Math.max(0, Math.floor((endTimestamp - Date.now()) / 1000));
          setTimerSeconds(remaining);
          if (remaining <= 0) {
            clearInterval(countdownInterval);
          }
        } else {
          setTimerSeconds(prev => {
            if (prev === null || prev <= 0) {
              clearInterval(countdownInterval);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);

      return () => clearInterval(countdownInterval);
    } catch (e) {
      setTimerSeconds(null);
    }
  }, [displayData?.screen?.id]);

  // Dedicated heartbeat — runs every 60s regardless of polling/content status
  // Keeps the TV marked as 'online' in the admin panel even when content polling fails
  useEffect(() => {
    if (isPreview) return; // Don't send heartbeats from Dashboard iframes
    // Don't send until we know the screen ID
    if (!displayData?.screen?.id) return;

    const screenId = displayData.screen.id;

    // Send immediately on mount, then every 60s
    const sendHeartbeat = () => {
      axios.post(`${API}/screens/${screenId}/heartbeat`).catch(() => { /* silent */ });
    };

    sendHeartbeat();
    const hbInterval = setInterval(sendHeartbeat, 60000);
    return () => clearInterval(hbInterval);
  }, [displayData?.screen?.id, isPreview]);

  // Listen for config updates from ScreenDesigner (cross-tab refresh)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'screen_config_updated') {
        // Reload the page to pick up new config
        window.location.reload();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSecuritySubmit = (e) => {
    e.preventDefault();
    loadDisplayData();
  };

  if (loading) {
    return (
      <div className="display-fullscreen flex items-center justify-center bg-black">
        <div className="text-white opacity-40 text-xl animate-pulse">Se încarcă {slug}...</div>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="display-fullscreen flex items-center justify-center p-8 bg-black">
        <div className="glass-card p-8 max-w-md w-full border-2 border-amber-500/50">
          <h1 className="text-2xl font-bold text-slate-800 mb-4 text-center">Cod de securitate necesar</h1>
          <form onSubmit={handleSecuritySubmit} className="space-y-4">
            <input
              type="password"
              value={securityCode}
              onChange={(e) => setSecurityCode(e.target.value)}
              placeholder="Introdu codul"
              className="w-full glass-input px-4 py-3 border text-center text-2xl"
              autoFocus
            />
            <button type="submit" className="w-full btn-primary">Accesează ecran</button>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="display-fullscreen flex flex-col items-center justify-center bg-black p-4">
        <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-2xl text-center">
          <div className="text-white text-3xl mb-4">⚠️</div>
          <div className="text-white text-xl font-bold">{error}</div>
          <button onClick={() => loadDisplayData()} className="mt-4 text-xs text-white/50 underline">Reîncearcă</button>
        </div>
      </div>
    );
  }

  const renderDigitalMenu = (zoneConfig) => {
    const menu = zoneConfig?.digital_menu;
    if (!menu || !menu.products) {
      return <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white/20">Menu data missing</div>;
    }
    const startIndex = currentPage * (menu.products_per_page || 1);
    const endIndex = startIndex + (menu.products_per_page || 1);
    const productsToShow = menu.products.slice(startIndex, endIndex);
    const backgroundStyle = menu.background_image_url
      ? {
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.85)), url(${getFileUrl(menu.background_image_url)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
      : {};

    return (
      <div className="w-full h-full p-12 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900" style={backgroundStyle}>
        <h1 className="text-6xl font-bold text-white mb-12 text-center text-shadow-lg">{menu.name}</h1>
        <div className={`grid gap-8 ${menu.products_per_page <= 3 ? 'grid-cols-3' : menu.products_per_page <= 6 ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {productsToShow.map(product => (
            <div key={product.id} className="glass-card p-6 text-center shadow-xl">
              {product.image_url && (
                <img
                  src={getFileUrl(product.image_url)}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-2xl mb-4 shadow"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <h3 className="text-2xl font-bold text-slate-800 mb-2 underline decoration-red-200 decoration-2 underline-offset-4">{product.name}</h3>
              {menu.show_descriptions && product.description && <p className="text-slate-600 mb-4 text-sm line-clamp-2">{product.description}</p>}
              <p className="text-3xl font-bold text-indigo-600">{product.price} {product.currency || 'RON'}</p>
            </div>
          ))}
        </div>
        <div className="fixed bottom-8 right-8 text-white/40 text-sm font-bold uppercase tracking-widest">
          Pagina {currentPage + 1} / {Math.ceil(menu.products.length / (menu.products_per_page || 1))}
        </div>
      </div>
    );
  };

  const renderContentItem = (item, fitMode, syncType) => {
    if (!item) return isDebug ? <div className="text-red-500">NO ITEM</div> : null;
    const isMatrix = syncType?.startsWith('matrix');
    // Map our fit modes: contain=original, cover=fill, fit=contain(same), stretch=fill(100%)
    let objectFit = fitMode || (isMatrix ? 'cover' : 'contain');
    const style = {
      objectFit: objectFit === 'stretch' ? 'fill' : objectFit,
      width: '100%',
      height: '100%'
    };

    if (item.type === 'image') {
      return <img src={getFileUrl(item.file_url)} alt="" className="shadow-2xl" style={style} />;
    } else if (item.type === 'video') {
      return <video src={getFileUrl(item.file_url)} autoPlay loop muted playsInline className="shadow-2xl" style={style} />;
    } else if (item.type === 'youtube') {
      return <iframe src={getYouTubeEmbedUrl(item.file_url)} className="w-full h-full border-0" allow="autoplay; encrypted-media" allowFullScreen title={item.title || ''} />;
    } else if (item.type === 'web') {
      return <iframe src={item.file_url} className="w-full h-full border-0 bg-white" title={item.title || ''} />;
    }
    return isDebug ? <div className="text-red-500">UNKNOWN TYPE: {item.type}</div> : null;
  };

  const renderZone = (zone, zoneConfig) => {
    if (!zoneConfig) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border border-red-500/20 text-white font-mono text-[10px]">
          <div className="opacity-40 uppercase">{zone.name}</div>
          {isDebug && <div className="text-red-400 mt-2">NO CONFIG FOUND ({zone.id})</div>}
        </div>
      );
    }

    const syncInfo = displayData?.sync_info;
    const isMatrix = syncInfo && (syncInfo.sync_type?.startsWith('matrix'));

    let contentItem = null;
    if (zoneConfig.content_type === 'single_content') {
      contentItem = zoneConfig.content;
    } else if (zoneConfig.content_type === 'playlist') {
      const playlistItems = zoneConfig.playlist?.content_items || [];
      contentItem = playlistItems[currentPlaylistIndex] || playlistItems[0];
    } else if (zoneConfig.content_type === 'digital_menu') {
      return renderDigitalMenu(zoneConfig);
    }

    if (!contentItem) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white font-mono text-[10px]">
          <div className="opacity-30 uppercase">{zone.name}</div>
          {isDebug && (
            <div className="text-amber-400 mt-2">
              MISSING CONTENT ({zoneConfig.content_type})
              {zoneConfig.content_id && ` ID: ${zoneConfig.content_id.substring(0, 8)}`}
            </div>
          )}
        </div>
      );
    }

    let matrixTransformStyle = {};
    if (isMatrix) {
      let cols = syncInfo.grid_cols || (syncInfo.total_screens === 3 ? 3 : syncInfo.total_screens === 4 ? 2 : 1);
      let rows = syncInfo.grid_rows || (syncInfo.total_screens === 4 ? 2 : 1);
      const myIndex = syncInfo.my_index || 0;
      const myRow = Math.floor(myIndex / cols);
      const myCol = myIndex % cols;

      matrixTransformStyle = {
        width: `${cols * 100}%`,
        height: `${rows * 100}%`,
        transform: `translate3d(-${(myCol * 100) / cols}%, -${(myRow * 100) / rows}%, 0)`,
        position: 'absolute',
        left: 0,
        top: 0,
        transformOrigin: 'top left',
      };
    }

    const parallaxEnabled = displayData?.screen?.parallax_enabled;
    const steamEnabled = displayData?.screen?.steam_enabled;

    return (
      <div className="relative w-full h-full bg-black overflow-hidden group">
        <div className={`w-full h-full relative ${parallaxEnabled ? 'parallax-container' : ''}`}>
          {/* Main Content Layer — no blur background (too heavy for TV GPUs) */}
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div style={isMatrix ? matrixTransformStyle : { width: '100%', height: '100%' }}>
              {renderContentItem(contentItem, zoneConfig.fit_mode || syncInfo?.fit_mode, syncInfo?.sync_type)}
            </div>
          </div>

          {steamEnabled && (
            <div className="steam z-20 pointer-events-none">
              {[...Array(12)].map((_, i) => <div key={i} className="steam-particle"></div>)}
            </div>
          )}

          {isDebug && (
            <div className="absolute top-2 left-2 z-30 bg-black/60 p-1 text-[8px] text-white font-mono rounded pointer-events-none">
              {zoneConfig.content_type}: {contentItem.type}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Calculate rotation style based on screen orientation
  // In preview mode (iframe), skip rotation — the container already has correct aspect ratio
  
  let rotation = 0;
  const rawOrientation = displayData?.screen?.orientation;
  
  if (rawOrientation === 'portrait') {
    rotation = 90;
  } else if (rawOrientation === 'landscape') {
    rotation = 0;
  } else {
    rotation = parseInt(rawOrientation || '0', 10);
    if (isNaN(rotation)) rotation = 0;
  }
  
  const isRotated = rotation === 90 || rotation === 270;
  
  // SmartTV Bulletproof Rotation
  let rotationStyle = {};
  if (rotation !== 0 && !isPreview) {
    if (rotation === 90) {
      rotationStyle = {
        transform: 'rotate(90deg)',
        transformOrigin: 'top left',
        width: '1080px',     // Explicit Full HD TV Height
        height: '1920px',    // Explicit Full HD TV Width
        position: 'fixed',
        top: '0px',
        left: '1920px'       // Shift matrix back into the landscape view
      };
    } else if (rotation === 270 || rotation === -90) {
      rotationStyle = {
        transform: 'rotate(270deg)',
        transformOrigin: 'top left',
        width: '1080px',
        height: '1920px',
        position: 'fixed',
        top: '1080px',
        left: '0px'
      };
    } else if (rotation === 180) {
      rotationStyle = {
        transform: 'rotate(180deg)',
        transformOrigin: 'center center',
        width: '1920px',
        height: '1080px',
        position: 'fixed',
        top: '0px',
        left: '0px'
      };
    }
  }

  return (
    <div className="display-fullscreen relative bg-black font-sans">
      {/* Content zones wrapper — only this rotates */}
      <div className="absolute inset-0" style={rotationStyle}>
        {(displayData?.template?.zones || []).map(zone => {
          const zcList = displayData?.zones_config || displayData?.zones || [];
          const zoneConfig = zcList.find(zc =>
            zc.zone_id === zone.id ||
            zc.zone_id === zone.id.replace('zone', 'zone-') ||
            (zc.zone_id && zc.zone_id.replace('-', '') === zone.id)
          );

          return (
            <div
              key={zone.id}
              className="absolute overflow-hidden"
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.width}%`,
                height: `${zone.height}%`
              }}
            >
              {renderZone(zone, zoneConfig)}
            </div>
          );
        })}
      </div>

      {/* Logo Overlay */}
      {displayData?.screen?.logo_enabled && displayData?.screen?.logo_brand_id && (() => {
        const logoUrl = displayData?.screen?.logo_url;
        const position = displayData?.screen?.logo_position || 'top-right';
        const size = displayData?.screen?.logo_size || 'md';

        const posMap = {
          'top-left': { top: '12px', left: '12px' },
          'top-center': { top: '12px', left: '50%', transform: 'translateX(-50%)' },
          'top-right': { top: '12px', right: '12px' },
          'center-left': { top: '50%', left: '12px', transform: 'translateY(-50%)' },
          'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
          'center-right': { top: '50%', right: '12px', transform: 'translateY(-50%)' },
          'bottom-left': { bottom: '12px', left: '12px' },
          'bottom-center': { bottom: '12px', left: '50%', transform: 'translateX(-50%)' },
          'bottom-right': { bottom: '12px', right: '12px' },
        };
        const sizeMap = { sm: '2vw', md: '3.5vw', lg: '5vw', xl: '7vw' };

        if (!logoUrl) return null;
        const dim = sizeMap[size] || '3.5vw';
        return (
          <div className="absolute z-40 pointer-events-none" style={{ ...posMap[position], width: dim, height: dim }}>
            <img
              src={getFileUrl(logoUrl)}
              className="w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
              alt="Logo"
            />
          </div>
        );
      })()}

      {isDebug && (
        <div className="absolute bottom-4 left-4 z-50 p-3 bg-black/90 text-emerald-400 font-mono text-[9px] rounded-lg border border-emerald-500/30 max-w-sm pointer-events-none shadow-2xl backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1 border-b border-emerald-500/20 pb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">DEBUG INFO</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <span className="opacity-60">SLUG:</span> <span>{slug}</span>
            <span className="opacity-60">TEMPLATE:</span> <span>{displayData?.template?.id}</span>
            <span className="opacity-60">ZONES:</span> <span>{(displayData?.zones_config || []).length}</span>
            <span className="opacity-60">SYNC:</span> <span>{displayData?.sync_info?.sync_type || 'none'}</span>
          </div>
        </div>
      )}

      {/* Valentine Hearts Effect — reads from API screen data, NOT localStorage */}
      <ValentineHearts
        enabled={!!displayData?.screen?.valentine_hearts_enabled}
        intensity={displayData?.screen?.valentine_hearts_intensity || 'medium'}
      />

      {/* Custom Text Overlay — reads from API screen data */}
      {displayData?.screen?.custom_text_enabled && displayData?.screen?.custom_text_content && (() => {
        const screen = displayData.screen;
        const posMap = {
          'top-left': 'top-4 left-4',
          'top-center': 'top-4 left-1/2 -translate-x-1/2',
          'top-right': 'top-4 right-4',
          'center-left': 'top-1/2 left-4 -translate-y-1/2',
          'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'center-right': 'top-1/2 right-4 -translate-y-1/2',
          'bottom-left': 'bottom-4 left-4',
          'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
          'bottom-right': 'bottom-4 right-4',
        };
        const sizeMap = { sm: 'text-2xl', md: 'text-4xl', lg: 'text-6xl', xl: 'text-8xl' };
        const posClass = posMap[screen.custom_text_position] || posMap['bottom-center'];
        const sizeClass = sizeMap[screen.custom_text_size] || sizeMap['md'];
        return (
          <div className={`absolute z-50 pointer-events-none ${posClass}`}>
            <div
              className={`${sizeClass} font-bold ${screen.custom_text_has_background ? 'px-6 py-3 rounded-2xl' : ''}`}
              style={{
                color: screen.custom_text_color || '#FFFFFF',
                backgroundColor: screen.custom_text_has_background ? (screen.custom_text_bg_color || '#000000') : 'transparent',
                textShadow: screen.custom_text_has_background ? 'none' : '0 2px 8px rgba(0,0,0,0.8)',
              }}
            >
              {screen.custom_text_content}
            </div>
          </div>
        );
      })()}

      {/* Happy Hour Timer */}
      {(() => {
        if (timerSeconds === null) return null;

        const savedTimer = localStorage.getItem(`happy_hour_timer_${displayData?.screen?.id}`);
        if (!savedTimer) return null;

        try {
          const timerSettings = JSON.parse(savedTimer);
          if (!timerSettings.enabled) return null;

          // Convert timerSeconds back to hh:mm:ss
          const hoursLeft = Math.floor(timerSeconds / 3600);
          const minutesLeft = Math.floor((timerSeconds % 3600) / 60);
          const secondsLeft = timerSeconds % 60;

          const position = timerSettings.position || 'top-center';
          const posStyles = {
            'top-left': { top: '16px', left: '16px' },
            'top-center': { top: '16px', left: '50%', transform: 'translateX(-50%)' },
            'top-right': { top: '16px', right: '16px' },
            'center-left': { top: '50%', left: '16px', transform: 'translateY(-50%)' },
            'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
            'center-right': { top: '50%', right: '16px', transform: 'translateY(-50%)' },
            'bottom-left': { bottom: '16px', left: '16px' },
            'bottom-center': { bottom: '16px', left: '50%', transform: 'translateX(-50%)' },
            'bottom-right': { bottom: '16px', right: '16px' },
          };

          return (
            <div className="absolute z-40 pointer-events-none" style={posStyles[position]}>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-2xl shadow-2xl">
                <div className="text-xs font-semibold uppercase tracking-wider mb-1 text-center">Happy Hour se termină în</div>
                <div className="text-3xl font-bold text-center tabular-nums">
                  {String(hoursLeft).padStart(2, '0')}:{String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
                </div>
              </div>
            </div>
          );
        } catch (e) {
          return null;
        }
      })()}

      {/* Sakura Effect */}
      {displayData?.screen?.sakura_enabled && (
        <div className={`absolute inset-0 z-30 pointer-events-none sakura-container intensity-${displayData.screen.sakura_intensity || 'medium'}`}>
          {[...Array(25)].map((_, i) => (
            <div key={i} className="sakura-petal"></div>
          ))}
        </div>
      )}

      {/* Snow Effect — reads from API screen data */}
      {displayData?.screen?.snow_enabled && (
        <div className={`absolute inset-0 z-30 pointer-events-none snow-container intensity-${displayData.screen.snow_intensity || 'medium'}`}>
          {[...Array(35)].map((_, i) => (
            <div key={i} className="snowflake"></div>
          ))}
        </div>
      )}
    </div>
  );
};
