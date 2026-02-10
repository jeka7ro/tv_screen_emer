import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/effects.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Helper to get full URL for files
const getFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('/api/uploads') || url.startsWith('/uploads')) {
    return `${BACKEND_URL}${url}`;
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
  const [displayData, setDisplayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [securityCode, setSecurityCode] = useState('');
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    loadDisplayData();
    // Heartbeat every 30 seconds
    const interval = setInterval(() => {
      if (displayData?.screen?.id) {
        axios.post(`${API}/screens/${displayData.screen.id}/heartbeat`);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [slug, securityCode]);

  const loadDisplayData = async () => {
    try {
      const code = securityCode || searchParams.get('code');
      const params = code ? `?security_code=${code}` : '';
      const response = await axios.get(`${API}/display/${slug}${params}`);
      setDisplayData(response.data);
      setNeedsAuth(false);
      setLoading(false);

      // Send initial heartbeat
      if (response.data.screen?.id) {
        await axios.post(`${API}/screens/${response.data.screen.id}/heartbeat`);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        setNeedsAuth(true);
        setLoading(false);
      } else {
        setError(error.response?.data?.detail || 'Ecran negăsit');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!displayData) return;

    // Auto-rotate pages for digital menus
    const zone = displayData.zones_config?.[0];
    if (zone?.digital_menu?.auto_rotate) {
      const menu = zone.digital_menu;
      const totalProducts = menu.products?.length || 0;
      const totalPages = Math.ceil(totalProducts / menu.products_per_page);

      const interval = setInterval(() => {
        setCurrentPage(prev => (prev + 1) % totalPages);
      }, menu.page_duration * 1000);

      return () => clearInterval(interval);
    }
  }, [displayData, currentPage]);

  // Poll for configuration changes every 10 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      const code = securityCode || searchParams.get('code');
      const params = code ? `?security_code=${code}` : '';

      axios.get(`${API}/display/${slug}${params}`)
        .then(response => {
          const newData = response.data;
          // Check for changes that require re-render (content, sync info, template)
          // Simple deep comparison or key fields check
          const currentSync = displayData?.sync_info;
          const newSync = newData.sync_info;

          const hasSyncChanged = JSON.stringify(currentSync) !== JSON.stringify(newSync);
          const hasContentChanged = JSON.stringify(displayData?.zones_config) !== JSON.stringify(newData.zones_config);

          if (hasSyncChanged || hasContentChanged) {
            setDisplayData(newData);
          }
        })
        .catch(err => console.error("Poll error", err));
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [slug, securityCode, displayData]);

  const handleSecuritySubmit = (e) => {
    e.preventDefault();
    loadDisplayData();
  };

  if (loading) {
    return (
      <div className="display-fullscreen flex items-center justify-center">
        <div className="text-white text-2xl">Se încarcă...</div>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="display-fullscreen flex items-center justify-center p-8">
        <div className="glass-card p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-slate-800 mb-4 text-center">
            Cod de securitate necesar
          </h1>
          <form onSubmit={handleSecuritySubmit} className="space-y-4">
            <input
              type="password"
              value={securityCode}
              onChange={(e) => setSecurityCode(e.target.value)}
              placeholder="Introdu codul"
              className="w-full glass-input px-4 py-3 border text-center text-2xl"
              autoFocus
            />
            <button type="submit" className="w-full btn-primary">
              Accesează ecran
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="display-fullscreen flex items-center justify-center">
        <div className="text-white text-2xl">{error}</div>
      </div>
    );
  }

  // Render digital menu
  const renderDigitalMenu = (zoneConfig) => {
    const menu = zoneConfig.digital_menu;
    if (!menu || !menu.products) return null;

    const startIndex = currentPage * menu.products_per_page;
    const endIndex = startIndex + menu.products_per_page;
    const productsToShow = menu.products.slice(startIndex, endIndex);

    const backgroundStyle = menu.background_image_url
      ? {
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.85)), url(${getFileUrl(menu.background_image_url)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
      : {};

    return (
      <div
        className="w-full h-full p-12 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900"
        style={backgroundStyle}
      >
        <h1 className="text-6xl font-bold text-white mb-12 text-center">
          {menu.name}
        </h1>
        <div className={`grid gap-8 ${menu.products_per_page <= 3 ? 'grid-cols-3' :
          menu.products_per_page <= 6 ? 'grid-cols-3' :
            'grid-cols-4'
          }`}>
          {productsToShow.map(product => (
            <div key={product.id} className="glass-card p-6 text-center">
              {product.image_url && (
                <img
                  src={getFileUrl(product.image_url)}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-2xl mb-4"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                {product.name}
              </h3>
              {menu.show_descriptions && product.description && (
                <p className="text-slate-600 mb-4 text-sm">{product.description}</p>
              )}
              <p className="text-3xl font-bold text-indigo-600">
                {product.price} {product.currency}
              </p>
            </div>
          ))}
        </div>
        <div className="fixed bottom-8 right-8 text-white text-xl">
          Pagina {currentPage + 1} / {Math.ceil(menu.products.length / menu.products_per_page)}
        </div>
      </div>
    );
  };

  // Render playlist - simplified without internal hooks
  const renderPlaylist = (zoneConfig) => {
    const playlist = zoneConfig.playlist;
    if (!playlist || !playlist.content_items || playlist.content_items.length === 0) return null;

    const currentItem = playlist.content_items[0]; // Show first item for now

    // Complete URL for local files
    const getFullUrl = (url) => {
      if (url.startsWith('/api/uploads')) {
        return `${BACKEND_URL}${url}`;
      }
      return url;
    };

    const parallaxEnabled = displayData?.screen?.parallax_enabled;
    const steamEnabled = displayData?.screen?.steam_enabled;

    return (
      <div className="relative w-full h-full bg-black overflow-hidden">
        <div className={`w-full h-full relative ${parallaxEnabled ? 'parallax-container' : ''}`}>
          {/* Blurred Background Layer */}
          <div className="absolute inset-0 z-0">
            {currentItem.type === 'image' ? (
              <img
                src={getFullUrl(currentItem.file_url)}
                className="w-full h-full object-cover opacity-50 blur-xl scale-110"
                alt=""
              />
            ) : (
              <video
                src={getFullUrl(currentItem.file_url)}
                className="w-full h-full object-cover opacity-50 blur-xl scale-110"
                muted
                loop
                autoPlay // Background video should autoplay
                playsInline
              />
            )}
          </div>

          {/* Foreground Content Layer */}
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            {currentItem.type === 'image' ? (
              <img
                src={getFullUrl(currentItem.file_url)}
                alt={currentItem.title}
                className={`max-w-full max-h-full shadow-2xl ${parallaxEnabled ? 'parallax-layer' : ''}`}
                style={{
                  objectFit: displayData?.sync_info?.fit_mode || (displayData?.sync_info?.sync_type?.startsWith('matrix') ? 'cover' : 'contain'),
                  width: (displayData?.sync_info?.fit_mode === 'cover' || displayData?.sync_info?.sync_type?.startsWith('matrix')) ? '100%' : 'auto',
                  height: (displayData?.sync_info?.fit_mode === 'cover' || displayData?.sync_info?.sync_type?.startsWith('matrix')) ? '100%' : 'auto'
                }}
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
              />
            ) : (
              <>
                <video
                  src={getFullUrl(currentItem.file_url)}
                  autoPlay={playlist.autoplay}
                  loop={playlist.loop || currentItem.loop}
                  muted
                  playsInline
                  className={`max-w-full max-h-full shadow-2xl ${parallaxEnabled ? 'parallax-layer' : ''}`}
                  style={{
                    objectFit: displayData?.sync_info?.fit_mode || (displayData?.sync_info?.sync_type?.startsWith('matrix') ? 'cover' : 'contain'),
                    width: '100%',
                    height: '100%'
                  }}
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                >
                  Browser-ul nu suportă video.
                </video>
                <div className="hidden text-white text-center p-4 bg-red-900/50 rounded-xl backdrop-blur-sm border border-red-500/30">
                  <div className="text-4xl mb-2">⚠️</div>
                  <div className="text-xl font-bold">Video indisponibil</div>
                  <div className="text-sm opacity-75">Fișierul a fost șters sau mutat.</div>
                </div>
              </>
            )}
          </div>

          {steamEnabled && (
            <div className="steam z-20">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="steam-particle"></div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render single content
  const renderSingleContent = (zoneConfig) => {
    const content = zoneConfig.content;
    if (!content) return null;

    // Complete URL for local files
    const getFullUrl = (url) => {
      if (url.startsWith('/api/uploads')) {
        return `${BACKEND_URL}${url}`;
      }
      return url;
    };

    const parallaxEnabled = displayData?.screen?.parallax_enabled;
    const steamEnabled = displayData?.screen?.steam_enabled;

    return (
      <div className="relative w-full h-full bg-black overflow-hidden">
        <div className={`w-full h-full relative ${parallaxEnabled ? 'parallax-container' : ''}`}>
          {/* Blurred Background Layer */}
          <div className="absolute inset-0 z-0">
            {content.type === 'youtube' || content.type === 'web' ? (
              <div className="w-full h-full bg-slate-900" />
            ) : content.type === 'image' ? (
              <img
                src={getFullUrl(content.file_url)}
                className="w-full h-full object-cover opacity-50 blur-xl scale-110"
                alt=""
              />
            ) : (
              <video
                src={getFullUrl(content.file_url)}
                className="w-full h-full object-cover opacity-50 blur-xl scale-110"
                muted
                loop
                autoPlay
                playsInline
              />
            )}
          </div>

          {/* Foreground Content Layer */}
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            {content.type === 'youtube' ? (
              <iframe
                src={getYouTubeEmbedUrl(content.file_url)}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={content.title}
              />
            ) : content.type === 'web' ? (
              <iframe
                src={content.file_url}
                className="w-full h-full border-0 bg-white"
                title={content.title}
              />
            ) : content.type === 'image' ? (
              <img
                src={getFullUrl(content.file_url)}
                alt={content.title}
                className={`shadow-2xl ${parallaxEnabled ? 'parallax-layer' : ''}`}
                style={{
                  objectFit: displayData?.sync_info?.fit_mode || (displayData?.sync_info?.sync_type?.startsWith('matrix') ? 'cover' : 'contain'),
                  width: '100%',
                  height: '100%'
                }}
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
              />
            ) : (
              <>
                <video
                  src={getFullUrl(content.file_url)}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className={`shadow-2xl ${parallaxEnabled ? 'parallax-layer' : ''}`}
                  style={{
                    objectFit: displayData?.sync_info?.fit_mode || (displayData?.sync_info?.sync_type?.startsWith('matrix') ? 'cover' : 'contain'),
                    width: (displayData?.sync_info?.fit_mode === 'cover' || displayData?.sync_info?.sync_type?.startsWith('matrix')) ? '100%' : 'auto',
                    height: (displayData?.sync_info?.fit_mode === 'cover' || displayData?.sync_info?.sync_type?.startsWith('matrix')) ? '100%' : 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                >
                  Browser-ul nu suportă video.
                </video>
                <div className="hidden text-white text-center p-4 bg-red-900/50 rounded-xl backdrop-blur-sm border border-red-500/30">
                  <div className="text-4xl mb-2">⚠️</div>
                  <div className="text-xl font-bold">Video indisponibil</div>
                  <div className="text-sm opacity-75">Fișierul a fost ștears de pe server. Te rog reîncarcă-l.</div>
                </div>
              </>
            )}
          </div>

          {steamEnabled && (
            <div className="steam z-20">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="steam-particle"></div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderZone = (zone, zoneConfig) => {
    if (!zoneConfig) return null;

    // Matrix transform logic
    const syncInfo = displayData.sync_info;
    const isMatrix = syncInfo && (syncInfo.sync_type === 'matrix' || (syncInfo.sync_type && syncInfo.sync_type.startsWith('matrix')));

    let matrixStyle = {};
    if (isMatrix) {
      // Use dimensions from backend if available (parsed from matrix:CxR)
      // Fallback heuristics:
      // 3 screens -> 3x1 (Horizontal Strip) - most common for menus/ads
      // 4 screens -> 2x2 (Grid)
      // Others -> Standard rectangular approximation
      let cols = 1;
      let rows = 1;

      if (syncInfo.grid_cols) {
        cols = syncInfo.grid_cols;
        rows = syncInfo.grid_rows || Math.ceil(syncInfo.total_screens / cols);
      } else {
        if (syncInfo.total_screens === 3) { cols = 3; rows = 1; }
        else if (syncInfo.total_screens === 4) { cols = 2; rows = 2; }
        else if (syncInfo.total_screens === 2) { cols = 2; rows = 1; }
        else {
          cols = Math.ceil(Math.sqrt(syncInfo.total_screens));
          rows = Math.ceil(syncInfo.total_screens / cols);
        }
      }

      const myIndex = syncInfo.my_index;
      const myRow = Math.floor(myIndex / cols);
      const myCol = myIndex % cols;

      matrixStyle = {
        width: `${cols * 100}%`,
        height: `${rows * 100}%`,
        transform: `translate(-${(myCol * 100) / cols}%, -${(myRow * 100) / rows}%)`,
        position: 'absolute',
        left: 0,
        top: 0,
        transformOrigin: 'top left'
      };
    }

    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
        <div style={isMatrix ? matrixStyle : { width: '100%', height: '100%' }}>
          {(() => {
            switch (zoneConfig.content_type) {
              case 'digital_menu':
                return renderDigitalMenu(zoneConfig);
              case 'playlist':
                return renderPlaylist(zoneConfig);
              case 'single_content':
                return renderSingleContent(zoneConfig);
              default:
                return null;
            }
          })()}
        </div>
      </div>
    );
  };

  return (
    <div className="display-fullscreen relative">
      {displayData.template?.zones.map(zone => {
        const zoneConfig = displayData.zones_config.find(zc => zc.zone_id === zone.id);
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
  );
};
