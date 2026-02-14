import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/effects.css';
import { ValentineHearts } from '../components/ValentineHearts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getFileUrl = (url) => {
  if (!url) return '';
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
  const [displayData, setDisplayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);
  const [securityCode, setSecurityCode] = useState('');
  const [needsAuth, setNeedsAuth] = useState(false);
  const isDebug = searchParams.get('debug') === 'true';

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

      if (data.screen?.id) {
        axios.post(`${API}/screens/${data.screen.id}/heartbeat`).catch(() => { });
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

  useEffect(() => {
    loadDisplayData();
  }, [slug]);

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
      const duration = currentItem?.duration || 10; // Default 10 seconds if no duration

      const interval = setInterval(() => {
        setCurrentPlaylistIndex(prev => (prev + 1) % playlist.content_items.length);
      }, duration * 1000);

      return () => clearInterval(interval);
    }
  }, [displayData, currentPlaylistIndex]);

  useEffect(() => {
    const pollInterval = setInterval(() => {
      const code = securityCode || searchParams.get('code');
      const params = code ? `?security_code=${code}` : '';
      axios.get(`${API}/display/${slug}${params}`)
        .then(response => {
          const newData = response.data;
          if (newData && !newData.zones_config && newData.zones) {
            newData.zones_config = newData.zones;
          }
          const hasSyncChanged = JSON.stringify(displayData?.sync_info) !== JSON.stringify(newData?.sync_info);
          const hasContentChanged = JSON.stringify(displayData?.zones_config) !== JSON.stringify(newData?.zones_config);
          if (hasSyncChanged || hasContentChanged) {
            setDisplayData(newData);
          }
        })
        .catch(err => console.debug("Poll failed", err));
    }, 10000);
    return () => clearInterval(pollInterval);
  }, [slug, securityCode, displayData]);

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
    const style = {
      objectFit: fitMode || (isMatrix ? 'cover' : 'contain'),
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
          {/* Background Layer (Blur) */}
          <div className="absolute inset-0 z-0">
            {contentItem.type === 'image' && (
              <img src={getFileUrl(contentItem.file_url)} className="w-full h-full object-cover opacity-50 blur-xl scale-110" alt="" />
            )}
            {contentItem.type === 'video' && (
              <video src={getFileUrl(contentItem.file_url)} className="w-full h-full object-cover opacity-50 blur-xl scale-110" muted loop autoPlay playsInline />
            )}
          </div>

          {/* Main Content Layer */}
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div style={isMatrix ? matrixTransformStyle : { width: '100%', height: '100%' }}>
              {renderContentItem(contentItem, syncInfo?.fit_mode, syncInfo?.sync_type)}
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

  return (
    <div className="display-fullscreen relative bg-black font-sans">
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
              style={{ mixBlendMode: 'multiply', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
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

      {/* Valentine Hearts Effect */}
      <ValentineHearts
        enabled={(() => {
          const saved = localStorage.getItem(`valentine_hearts_${displayData?.screen?.id}`);
          if (saved) {
            try {
              return JSON.parse(saved).enabled || false;
            } catch (e) {
              return false;
            }
          }
          return false;
        })()}
        intensity={(() => {
          const saved = localStorage.getItem(`valentine_hearts_${displayData?.screen?.id}`);
          if (saved) {
            try {
              return JSON.parse(saved).intensity || 'medium';
            } catch (e) {
              return 'medium';
            }
          }
          return 'medium';
        })()}
      />
    </div>
  );
};
