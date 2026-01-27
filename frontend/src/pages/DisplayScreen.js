import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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

    return (
      <div className="w-full h-full p-12 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
        <h1 className="text-6xl font-bold text-white mb-12 text-center">
          {menu.name}
        </h1>
        <div className={`grid gap-8 ${
          menu.products_per_page <= 3 ? 'grid-cols-3' :
          menu.products_per_page <= 6 ? 'grid-cols-3' :
          'grid-cols-4'
        }`}>
          {productsToShow.map(product => (
            <div key={product.id} className="glass-card p-6 text-center">
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-2xl mb-4"
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

    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        {currentItem.type === 'image' ? (
          <img
            src={getFullUrl(currentItem.file_url)}
            alt={currentItem.title}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            src={getFullUrl(currentItem.file_url)}
            autoPlay={playlist.autoplay}
            loop={playlist.loop || currentItem.loop}
            muted
            playsInline
            className="max-w-full max-h-full"
          >
            Browser-ul nu suportă video.
          </video>
        )}
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

    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        {content.type === 'image' ? (
          <img
            src={getFullUrl(content.file_url)}
            alt={content.title}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            src={getFullUrl(content.file_url)}
            autoPlay
            loop
            muted
            playsInline
            className="max-w-full max-h-full"
          >
            Browser-ul nu suportă video.
          </video>
        )}
      </div>
    );
  };

  const renderZone = (zone, zoneConfig) => {
    if (!zoneConfig) return null;

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
