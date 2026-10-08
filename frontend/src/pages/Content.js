import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { FolderSidebar } from '../components/FolderSidebar';
import { FolderDialog } from '../components/FolderDialog';
import { 
  Upload, Link as LinkIcon, FileImage, Film, Trash2, Plus, LayoutGrid, 
  List as ListIcon, Eye, Folder, FolderPlus, Edit2, FolderOpen, Search, 
  X, Loader2, Clock, Zap, CheckCircle2, FileUp, ChevronLeft, ChevronRight,
  Download, ExternalLink, Copy, Check, ZoomIn, Play, Pause, Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'; import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { SlideshowConfigDialog } from '../components/SlideshowConfigDialog';
import { Switch } from '../components/ui/switch';
import { useConfirm } from '../hooks/useConfirm';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../components/ui/hover-card';

export const getFileUrl = (fileUrl) => {
  if (!fileUrl) return '';
  const SUPABASE_CONTENT = 'https://isdzbwxjtfrykyoeevmy.supabase.co/storage/v1/object/public/content/';
  const SUPABASE_AUDIO = 'https://isdzbwxjtfrykyoeevmy.supabase.co/storage/v1/object/public/audio/';
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (!isLocal) {
    if (fileUrl.startsWith(SUPABASE_CONTENT)) return '/supabase-media/' + fileUrl.substring(SUPABASE_CONTENT.length);
    if (fileUrl.startsWith(SUPABASE_AUDIO)) return '/supabase-audio/' + fileUrl.substring(SUPABASE_AUDIO.length);
  }
  const backend = process.env.REACT_APP_BACKEND_URL || (isLocal ? 'http://localhost:8002' : '');
  if (fileUrl.startsWith('/api/uploads') || fileUrl.startsWith('/uploads')) {
    return `${backend}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
  }
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://') || fileUrl.startsWith('data:')) {
    return fileUrl;
  }
  return `${backend}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
};

export const getYouTubeEmbedUrl = (url) => {
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  return match && match[1] ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&enablejsapi=1` : url;
};

const ContentHoverPreview = ({ item, onClick, videoAutoplay = false }) => {
  const [hasError, setHasError] = useState(false);

  if (!item) return null;
  const resolvedUrl = getFileUrl(item.file_url);
  const resolvedThumb = getFileUrl(item.thumbnail_url || item.file_url);

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div
          onClick={onClick}
          className="w-16 h-10 rounded-xl overflow-hidden bg-slate-900 cursor-pointer flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-xs transition-all hover:scale-105 hover:ring-2 hover:ring-brand-500 group/thumb relative"
          title="Click pentru previzualizare mărită"
        >
          {hasError ? (
            <div className="w-full h-full flex items-center justify-center bg-rose-950/80 text-[8px] font-bold text-rose-300">
              EROARE
            </div>
          ) : item.type === 'youtube' ? (
            <div className="w-full h-full bg-red-950 flex items-center justify-center text-red-400 font-bold text-[10px]">
              <Film className="w-4 h-4 mr-0.5" /> YT
            </div>
          ) : item.type === 'web' ? (
            <div className="w-full h-full bg-blue-950 flex items-center justify-center text-blue-400 font-bold text-[10px]">
              <LayoutGrid className="w-4 h-4 mr-0.5" /> WEB
            </div>
          ) : item.type === 'image' ? (
            <>
              <img
                src={resolvedUrl}
                alt=""
                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                onError={() => setHasError(true)}
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                <Eye className="w-3.5 h-3.5 text-white drop-shadow" />
              </div>
            </>
          ) : (
            <>
              {item.thumbnail_url ? (
                <img
                  src={resolvedThumb}
                  alt=""
                  className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                  onError={() => setHasError(true)}
                />
              ) : (
                <video
                  src={resolvedUrl}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  onError={() => setHasError(true)}
                />
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm rounded-full p-0.5 group-hover/thumb:scale-110 transition-transform">
                  <Film className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                <Eye className="w-3.5 h-3.5 text-white drop-shadow" />
              </div>
            </>
          )}
        </div>
      </HoverCardTrigger>

      <HoverCardContent side="right" sideOffset={12} className="w-72 p-2 bg-slate-950 border border-slate-800 shadow-2xl z-[100] rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 pointer-events-none text-slate-100">
        {item.type === 'video' ? (
          <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center relative">
            <video
              src={resolvedUrl}
              className="w-full h-full object-contain"
              autoPlay
              muted
              loop
              playsInline
            />
            {item.duration && (
              <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                {item.duration}s
              </span>
            )}
          </div>
        ) : item.type === 'youtube' ? (
          <div className="p-3 text-center text-xs text-slate-300">
            <Film className="w-8 h-8 text-red-500 mx-auto mb-1" />
            <p className="font-bold truncate">{item.title}</p>
            <p className="text-[10px] text-slate-400">YouTube Video</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center">
            <img src={resolvedUrl} alt="" className="w-full h-auto max-h-[240px] object-contain" />
          </div>
        )}
        <div className="mt-2 px-1 flex items-center justify-between text-[10px] text-slate-400">
          <span className="truncate max-w-[170px] font-medium text-slate-300">{item.title}</span>
          <span className="text-brand-400 font-bold uppercase tracking-wider">Click pt. mărire</span>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

const ContentLightboxModal = ({ item, items = [], folders = [], onClose, onNavigate, onEdit }) => {
  const [copied, setCopied] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Find index in current item list
  const currentIndex = items.findIndex(i => i.id === item?.id);
  const totalCount = items.length;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < totalCount - 1 && currentIndex >= 0;

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      setIsZoomed(false);
      onNavigate(items[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, items, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      setIsZoomed(false);
      onNavigate(items[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, items, onNavigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handlePrev, handleNext]);

  if (!item) return null;

  const resolvedUrl = getFileUrl(item.file_url);
  const itemFolder = folders.find(f => String(f.id) === String(item.folder_id));
  const fileSizeMb = item.file_size ? (item.file_size / (1024 * 1024)).toFixed(1) : null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(resolvedUrl);
    setCopied(true);
    toast.success('Link-ul a fost copiat în clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div 
        className="relative max-w-6xl w-full bg-slate-950/95 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[96vh] text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 shrink-0">
              {item.type === 'video' ? (
                <Film className="w-5 h-5 text-brand-400" />
              ) : item.type === 'youtube' ? (
                <Film className="w-5 h-5 text-red-500" />
              ) : item.type === 'web' ? (
                <LayoutGrid className="w-5 h-5 text-blue-400" />
              ) : (
                <ImageIcon className="w-5 h-5 text-brand-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate" title={item.title}>
                  {item.title}
                </h3>
                {totalCount > 1 && currentIndex >= 0 && (
                  <span className="text-[11px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full border border-slate-700 shrink-0">
                    {currentIndex + 1} / {totalCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap mt-0.5">
                <span className="uppercase font-bold tracking-wider text-brand-400 text-[10px] bg-brand-500/10 px-1.5 py-0.5 rounded">
                  {item.type}
                </span>
                {item.duration ? <span>• {item.duration}s durată</span> : null}
                {item.category ? <span className="capitalize">• {item.category}</span> : null}
                {itemFolder ? (
                  <span className="flex items-center gap-1 text-slate-300">
                    • <Folder className="w-3 h-3 inline text-indigo-400" /> {itemFolder.name}
                  </span>
                ) : null}
                {fileSizeMb ? <span>• {fileSizeMb} MB</span> : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(item)}
                className="h-8 px-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl hidden sm:flex items-center gap-1.5"
                title="Editează titlu / brand"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Editează
              </Button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Închide (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Media Area with Floating Prev/Next Buttons */}
        <div className="relative flex-1 min-h-[380px] max-h-[calc(92vh-130px)] bg-black/80 flex items-center justify-center p-2 sm:p-4 overflow-hidden group/stage">
          {/* Previous Button */}
          {hasPrev && (
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-slate-900/80 hover:bg-brand-600 text-white border border-slate-700/80 shadow-2xl transition-all opacity-70 group-hover/stage:opacity-100 hover:scale-110 active:scale-95"
              title="Anteriorul (Săgeată Stânga ←)"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* Next Button */}
          {hasNext && (
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-slate-900/80 hover:bg-brand-600 text-white border border-slate-700/80 shadow-2xl transition-all opacity-70 group-hover/stage:opacity-100 hover:scale-110 active:scale-95"
              title="Următorul (Săgeată Dreapta →)"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* Actual Media Content */}
          <div className="w-full h-full flex items-center justify-center">
            {item.type === 'video' ? (
              <video
                key={item.id}
                src={resolvedUrl}
                controls
                autoPlay
                playsInline
                loop
                preload="metadata"
                className="w-full h-full max-h-[72vh] object-contain rounded-2xl shadow-2xl"
              >
                Browserul nu suportă redarea acestui fișier video.
              </video>
            ) : item.type === 'youtube' ? (
              <iframe
                key={item.id}
                src={getYouTubeEmbedUrl(item.file_url)}
                title={item.title}
                className="w-full aspect-video max-h-[72vh] rounded-2xl border-0 shadow-2xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : item.type === 'web' ? (
              <iframe
                key={item.id}
                src={item.file_url}
                title={item.title}
                className="w-full h-[65vh] rounded-2xl border-0 bg-white shadow-2xl"
              />
            ) : (
              <img
                key={item.id}
                src={resolvedUrl}
                alt={item.title}
                onClick={() => setIsZoomed(!isZoomed)}
                className={`max-w-full max-h-[72vh] object-contain rounded-2xl shadow-2xl transition-transform duration-300 cursor-zoom-in ${isZoomed ? 'scale-125 cursor-zoom-out' : 'scale-100'}`}
                title="Click pentru zoom"
              />
            )}
          </div>
        </div>

        {/* Footer Bar with Details & Actions */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-800/80 bg-slate-900/80 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-3 truncate max-w-[50%]">
            <span className="truncate font-mono text-[11px] text-slate-400" title={resolvedUrl}>
              {item.file_url?.split('/').pop() || item.title}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              className="h-8 px-3 text-xs font-semibold rounded-xl border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 gap-1.5"
              title="Copiază link-ul direct către fișier"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiat!' : 'Copiază Link'}
            </Button>

            <a
              href={resolvedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Deschide în tab nou"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Tab Nou
            </a>

            <Button
              size="sm"
              variant="secondary"
              onClick={onClose}
              className="h-8 px-4 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-500 text-white"
            >
              Închide
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Content = () => {
    const { confirm, ConfirmDialog } = useConfirm();
  const { isAdmin } = useAuth();
  const [content, setContent] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('file');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'image',
    category: 'other',
    duration: '10',
    file_url: '',
    folder_id: selectedFolder?.id || 'none',
    brand: []
  });
  const [folderFormData, setFolderFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    icon: 'folder'
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isPageDragging, setIsPageDragging] = useState(false);
  const modalDragCounter = useRef(0);
  const pageDragCounter = useRef(0);
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState({
    currentFileIndex: 0,
    totalFiles: 0,
    currentFileName: '',
    currentFileSize: 0,
    currentFileLoaded: 0,
    filePercent: 0,
    totalBatchBytes: 0,
    totalLoadedBytes: 0,
    overallPercent: 0,
    speedBytesPerSec: 0,
    remainingSeconds: 0,
    remainingFiles: 0,
    statusText: ''
  });
  const [previewItem, setPreviewItem] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [videoAutoplay, setVideoAutoplay] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [screens, setScreens] = useState([]);
  const [renamingItem, setRenamingItem] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [editBrands, setEditBrands] = useState([]);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('contentItemsPerPage');
    if (saved === 'all') return 'all';
    return saved ? parseInt(saved) : 10; // Default to 10
  });
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showImages, setShowImages] = useState(true);
  const [showVideos, setShowVideos] = useState(true);
  const [brands, setBrands] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [showSlideshowDialog, setShowSlideshowDialog] = useState(false);
  const [pendingSlideshowScreen, setPendingSlideshowScreen] = useState(null);

  // Safe Delete States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [usageInfo, setUsageInfo] = useState({ screens: [], playlists: [] });
  const [isCheckingUsage, setIsCheckingUsage] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [forceDeleteConfirm, setForceDeleteConfirm] = useState(false);

  useEffect(() => {
    loadContent();
    loadFolders();
    loadScreens();
    loadBrands();
    loadPlaylists();
  }, []);

  const loadContent = async () => {
    try {
      const response = await api.get('/content');
      setContent(response.data);
    } catch (error) {
      toast.error('Eroare la încărcarea conținutului');
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const response = await api.get('/content/folders');
      setFolders(response.data);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const loadScreens = async () => {
    try {
      const response = await api.get('/screens');
      setScreens(response.data);
    } catch (error) {
      console.error('Error loading screens:', error);
    }
  };
  const loadBrands = async () => {
    try {
      const response = await api.get('/brands');
      setBrands(response.data);
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const loadPlaylists = async () => {
    try {
      const response = await api.get('/playlists');
      setPlaylists(response.data);
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  };

  const getBrandLogo = (brandName) => {
    const brand = brands.find(b => b.name === brandName);
    return brand?.logo_url;
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    try {
      await api.post('/content/folders', folderFormData);
      toast.success('Folder creat!');
      setShowFolderDialog(false);
      resetFolderForm();
      loadFolders();
    } catch (error) {
      toast.error('Eroare la crearea folderului');
    }
  };

  const handleUpdateFolder = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/content/folders/${editingFolder.id}`, folderFormData);
      toast.success('Folder actualizat!');
      setShowFolderDialog(false);
      resetFolderForm();
      loadFolders();
    } catch (error) {
      toast.error('Eroare la actualizarea folderului');
    }
  };

  const handleIconUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      toast.info('Se încarcă iconița...');
      const response = await api.post('/content/folders/upload-icon', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFolderFormData(prev => ({ ...prev, icon: response.data.url }));
      toast.success('Iconiță încărcată!');
    } catch (error) {
      toast.error('Eroare la încărcarea iconiței');
      console.error(error);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!(await confirm({ message: 'Sigur dorești să ștergi acest folder? Conținutul va fi mutat în "Toate fișierele".', isDanger: true }))) return;
    try {
      await api.delete(`/content/folders/${folderId}`);
      toast.success('Folder șters!');
      if (selectedFolder?.id === folderId) {
        setSelectedFolder(null);
      }
      loadFolders();
      loadContent();
    } catch (error) {
      toast.error('Eroare la ștergerea folderului');
    }
  };

  const handleMoveToFolder = async (contentId, folderId) => {
    try {
      await api.patch(`/content/${contentId}/folder`, { folder_id: folderId });
      toast.success('Conținut mutat!');
      loadContent();
    } catch (error) {
      toast.error('Eroare la mutarea conținutului');
    }
  };

  const openFolderDialog = (folder = null) => {
    if (folder) {
      setEditingFolder(folder);
      setFolderFormData({
        name: folder.name,
        description: folder.description || '',
        color: folder.color,
        icon: folder.icon || 'folder'
      });
    } else {
      resetFolderForm();
    }
    setShowFolderDialog(true);
  };

  const resetFolderForm = () => {
    setFolderFormData({ name: '', description: '', color: '#6366f1', icon: 'folder' });
    setEditingFolder(null);
  };

  // 1. Filter by folder
  const folderFilteredContent = selectedFolder
    ? (selectedFolder.id === 'unassigned'
      ? content.filter(item => !item.folder_id)
      : content.filter(item => String(item.folder_id) === String(selectedFolder.id)))
    : content;

  // 2. Filter by brand
  const [selectedBrands, setSelectedBrands] = useState([]);

  const brandFilteredContent = selectedBrands.length === 0
    ? folderFilteredContent
    : folderFilteredContent.filter(item =>
      Array.isArray(item.brand) && item.brand.some(b => selectedBrands.includes(b))
    );

  const toggleBrandFilter = (brandName) => {
    if (selectedBrands.includes(brandName)) {
      setSelectedBrands(selectedBrands.filter(b => b !== brandName));
    } else {
      setSelectedBrands([...selectedBrands, brandName]);
    }
    setCurrentPage(1);
  };


  // 3. Filter by type and search (for display)
  const typeFilteredContent = brandFilteredContent.filter(item => {
    // search filter
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
    }
    // type filter
    if (item.type === 'image' && !showImages) return false;
    if (item.type === 'video' && !showVideos) return false;
    // For youtube/web, we can map them to video, or always show.
    if ((item.type === 'youtube' || item.type === 'web') && !showVideos) return false;
    
    return true;
  });

  // Sorting Logic
  const sortedContent = [...typeFilteredContent].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    // Handle string comparisons
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const images = brandFilteredContent.filter(c => c.type === 'image');
  const videos = brandFilteredContent.filter(c => c.type === 'video');

  // Pagination Logic
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(sortedContent.length / itemsPerPage);
  const currentItems = itemsPerPage === 'all'
    ? sortedContent
    : sortedContent.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Generate a thumbnail from a video file using canvas
  const generateVideoThumbnail = (videoFile) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const url = URL.createObjectURL(videoFile);
      video.src = url;

      video.onloadeddata = () => {
        // Seek to 1 second or 10% of duration, whichever is less
        video.currentTime = Math.min(1, video.duration * 0.1);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(video.videoWidth, 640);
          canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url);
            resolve(blob);
          }, 'image/jpeg', 0.8);
        } catch (e) {
          URL.revokeObjectURL(url);
          resolve(null);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      // Timeout fallback
      setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve(null);
      }, 10000);
    });
  };

  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.ceil(video.duration));
      };
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(10);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatEta = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return 'câteva secunde';
    if (seconds < 5) return 'sub 5 secunde';
    if (seconds < 60) return `~${seconds} sec`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) return `~${mins} min`;
    return `~${mins}m ${secs}s`;
  };

  const formatSpeed = (bytesPerSec) => {
    if (!bytesPerSec || isNaN(bytesPerSec) || bytesPerSec < 1024) return 'Calculare...';
    if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  const processIncomingFiles = (incomingFiles) => {
    const fileList = Array.from(incomingFiles || []);
    const validFiles = fileList.filter(file => {
      return (
        file.type.startsWith('image/') ||
        file.type.startsWith('video/') ||
        /\.(jpe?g|png|webp|gif|svg|mp4|webm|mov|mkv)$/i.test(file.name)
      );
    });

    if (validFiles.length === 0) {
      toast.error('Selectează doar imagini (JPG, PNG, WEBP, GIF) sau fișiere video (MP4, WEBM, MOV)');
      return;
    }

    setSelectedFiles(prev => {
      const existing = Array.isArray(prev) ? prev : Array.from(prev || []);
      const existingKeys = new Set(existing.map(f => `${f.name}_${f.size}`));
      const newFiles = validFiles.filter(f => !existingKeys.has(`${f.name}_${f.size}`));

      if (newFiles.length < validFiles.length && existing.length > 0) {
        toast.info('Fișierele duplicate au fost omise');
      }

      const combined = [...existing, ...newFiles];

      if (combined.length > 0) {
        const first = combined[0];
        const isVid = first.type.startsWith('video') || /\.(mp4|webm|mov|mkv)$/i.test(first.name);
        setFormData(f => ({
          ...f,
          type: isVid ? 'video' : 'image',
          title: combined.length === 1 ? (f.title || first.name) : f.title
        }));

        if (isVid) {
          getVideoDuration(first).then(duration => {
            if (duration && duration > 0) {
              setFormData(f => ({ ...f, duration: duration.toString() }));
            }
          });
        }
      }

      return combined;
    });
  };

  const handleRemoveFile = (indexToRemove) => {
    setSelectedFiles(prev => {
      const current = Array.isArray(prev) ? prev : Array.from(prev || []);
      const updated = current.filter((_, idx) => idx !== indexToRemove);
      if (updated.length === 1) {
        setFormData(p => ({ ...p, title: updated[0].name }));
      }
      return updated;
    });
  };

  const handleModalDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    modalDragCounter.current++;
    if (e.dataTransfer && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleModalDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    if (!isDragging) setIsDragging(true);
  };

  const handleModalDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    modalDragCounter.current--;
    if (modalDragCounter.current <= 0) {
      setIsDragging(false);
      modalDragCounter.current = 0;
    }
  };

  const handleModalDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    modalDragCounter.current = 0;
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processIncomingFiles(e.dataTransfer.files);
    }
  };

  // Window-level drag & drop for dropping files anywhere on Content page
  useEffect(() => {
    if (!isAdmin()) return;

    const handleWindowDragEnter = (e) => {
      if (showDialog) return;
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
        e.preventDefault();
        pageDragCounter.current++;
        if (pageDragCounter.current === 1) {
          setIsPageDragging(true);
        }
      }
    };

    const handleWindowDragOver = (e) => {
      if (showDialog) return;
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleWindowDragLeave = (e) => {
      if (showDialog) return;
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
        e.preventDefault();
        pageDragCounter.current--;
        if (pageDragCounter.current <= 0) {
          setIsPageDragging(false);
          pageDragCounter.current = 0;
        }
      }
    };

    const handleWindowDrop = (e) => {
      if (showDialog) return;
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
        e.preventDefault();
        setIsPageDragging(false);
        pageDragCounter.current = 0;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          processIncomingFiles(e.dataTransfer.files);
          setShowDialog(true);
        }
      }
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [showDialog, selectedFolder, isAdmin]);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (uploadMethod === 'file') {
      const filesArray = Array.from(selectedFiles || []);
      if (filesArray.length === 0) {
        toast.error('Selectează sau trage cel puțin un fișier');
        return;
      }

      setUploading(true);
      const totalFiles = filesArray.length;
      const totalBatchBytes = filesArray.reduce((acc, f) => acc + (f.size || 0), 0);
      let completedFilesBytes = 0;
      const batchStartTime = Date.now();
      let smoothedSpeed = 0;

      // Initialize progress
      setUploadProgress({
        currentFileIndex: 0,
        totalFiles,
        currentFileName: filesArray[0].name,
        currentFileSize: filesArray[0].size || 0,
        currentFileLoaded: 0,
        filePercent: 0,
        totalBatchBytes,
        totalLoadedBytes: 0,
        overallPercent: 0,
        speedBytesPerSec: 0,
        remainingSeconds: 0,
        remainingFiles: totalFiles,
        statusText: 'Pregătire încărcare...'
      });

      try {
        for (let i = 0; i < totalFiles; i++) {
          const file = filesArray[i];
          const isVid = file.type.startsWith('video') || /\.(mp4|webm|mov|mkv)$/i.test(file.name);
          const type = isVid ? 'video' : 'image';
          const remainingFilesCount = totalFiles - (i + 1);

          setUploadProgress(prev => ({
            ...prev,
            currentFileIndex: i,
            totalFiles,
            currentFileName: file.name,
            currentFileSize: file.size || 0,
            currentFileLoaded: 0,
            filePercent: 0,
            remainingFiles: remainingFilesCount,
            statusText: isVid ? 'Generare previzualizare video...' : 'Se pregătește...'
          }));

          const formDataToSend = new FormData();
          formDataToSend.append('files', file);

          const itemTitle = (totalFiles === 1 && formData.title) ? formData.title : file.name;
          formDataToSend.append('title', itemTitle);
          formDataToSend.append('type', type);
          formDataToSend.append('category', formData.category || 'other');

          if (type === 'video') {
            const dur = await getVideoDuration(file);
            formDataToSend.append('duration', dur);

            const thumbBlob = await generateVideoThumbnail(file);
            if (thumbBlob) {
              formDataToSend.append('thumbnail', thumbBlob, 'thumbnail.jpg');
            }
          } else {
            formDataToSend.append('duration', formData.duration || '10');
          }

          if (formData.folder_id && formData.folder_id !== 'none') {
            formDataToSend.append('folder_id', formData.folder_id);
          }
          if (formData.brand && Array.isArray(formData.brand) && formData.brand.length > 0) {
            formDataToSend.append('brand', formData.brand.join(','));
          }

          setUploadProgress(prev => ({
            ...prev,
            statusText: 'Se transferă fișierul...'
          }));

          await api.post('/content', formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 600000,
            onUploadProgress: (progressEvent) => {
              const fileLoaded = progressEvent.loaded || 0;
              const fileTotal = progressEvent.total || file.size || 1;
              const filePercent = Math.min(100, Math.round((fileLoaded * 100) / fileTotal));

              const totalLoaded = completedFilesBytes + fileLoaded;
              const overallPercent = Math.min(99, Math.round((totalLoaded * 100) / Math.max(totalBatchBytes, 1)));

              const now = Date.now();
              const elapsedSec = (now - batchStartTime) / 1000;

              let currentSpeed = smoothedSpeed;
              if (elapsedSec > 0.3 && totalLoaded > 0) {
                const instantSpeed = totalLoaded / elapsedSec;
                currentSpeed = smoothedSpeed === 0 ? instantSpeed : (smoothedSpeed * 0.7 + instantSpeed * 0.3);
                smoothedSpeed = currentSpeed;
              }

              const remainingBytes = Math.max(0, totalBatchBytes - totalLoaded);
              const remainingSec = currentSpeed > 0 ? Math.ceil(remainingBytes / currentSpeed) : 0;

              setUploadProgress(prev => ({
                ...prev,
                currentFileIndex: i,
                totalFiles,
                currentFileName: file.name,
                currentFileSize: file.size || 0,
                currentFileLoaded: fileLoaded,
                filePercent,
                totalBatchBytes,
                totalLoadedBytes: totalLoaded,
                overallPercent,
                speedBytesPerSec: currentSpeed,
                remainingSeconds: remainingSec,
                remainingFiles: remainingFilesCount,
                statusText: filePercent >= 100 ? 'Procesare pe server...' : 'Se transferă...'
              }));
            }
          });

          completedFilesBytes += (file.size || 0);
        }

        setUploadProgress(prev => ({
          ...prev,
          overallPercent: 100,
          filePercent: 100,
          remainingFiles: 0,
          remainingSeconds: 0,
          statusText: 'Finalizat cu succes!'
        }));

        toast.success(totalFiles === 1 ? 'Conținut adăugat!' : `Toate cele ${totalFiles} fișiere au fost adăugate!`);
        setShowDialog(false);
        resetForm();
        loadContent();
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(error.response?.data?.detail || 'Eroare la upload. Pentru fișiere foarte mari (>200MB), folosește "Link Extern"');
      } finally {
        setUploading(false);
      }
    } else {
      setUploading(true);
      try {
        await api.post('/content/external', {
          title: formData.title,
          type: formData.type,
          source_type: 'url',
          file_url: formData.file_url,
          category: formData.category,
          duration: parseInt(formData.duration),
          folder_id: formData.folder_id === 'none' ? null : formData.folder_id,
          brand: Array.isArray(formData.brand) ? formData.brand : []
        });
        toast.success('Conținut adăugat!');
        setShowDialog(false);
        resetForm();
        loadContent();
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(error.response?.data?.detail || 'Eroare la adăugarea link-ului extern');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDelete = async (item) => {
    setItemToDelete(item);
    setUsageInfo({ screens: [], playlists: [] });
    setIsCheckingUsage(true);
    setShowDeleteConfirm(true);
    setForceDeleteConfirm(false);

    try {
      const response = await api.get(`/content/${item.id}/usage`);
      setUsageInfo(response.data);
    } catch (error) {
      console.error('Eroare la verificarea utilizării:', error);
    } finally {
      setIsCheckingUsage(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/content/${itemToDelete.id}`);
      toast.success('Conținut șters!');
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      loadContent();
    } catch (error) {
      toast.error('Eroare la ștergere');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'image',
      category: 'other',
      duration: '10',
      file_url: '',
      folder_id: selectedFolder?.id || 'none',
      brand: []
    });
    setSelectedFiles([]);
    setIsDragging(false);
    modalDragCounter.current = 0;
    setUploadProgress({
      currentFileIndex: 0,
      totalFiles: 0,
      currentFileName: '',
      currentFileSize: 0,
      currentFileLoaded: 0,
      filePercent: 0,
      totalBatchBytes: 0,
      totalLoadedBytes: 0,
      overallPercent: 0,
      speedBytesPerSec: 0,
      remainingSeconds: 0,
      remainingFiles: 0,
      statusText: ''
    });
  };

  const openUploadDialogWithFolder = (folder) => {
    setSelectedFiles([]);
    setIsDragging(false);
    modalDragCounter.current = 0;
    setUploadProgress({
      currentFileIndex: 0,
      totalFiles: 0,
      currentFileName: '',
      currentFileSize: 0,
      currentFileLoaded: 0,
      filePercent: 0,
      totalBatchBytes: 0,
      totalLoadedBytes: 0,
      overallPercent: 0,
      speedBytesPerSec: 0,
      remainingSeconds: 0,
      remainingFiles: 0,
      statusText: ''
    });
    setFormData({
      title: '',
      type: 'image',
      category: 'other',
      duration: '10',
      file_url: '',
      folder_id: folder?.id || 'none',
      brand: []
    });
    setSelectedFolder(folder); // Auto-switch to destination folder
    setShowDialog(true);
  };

  const handlePreview = (item) => {
    setPreviewItem(item);
    setShowPreview(true);
  };

  const handleRenameContent = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      // 1. Update Title if changed
      if (newTitle !== renamingItem.title) {
        await api.patch(`/content/${renamingItem.id}/title`, { title: newTitle });
      }

      // 2. Update Brands
      await api.patch(`/content/${renamingItem.id}/brand`, { brand: editBrands });

      toast.success('Conținut actualizat!');
      setShowRenameDialog(false);
      loadContent();
    } catch (error) {
      toast.error('Eroare la actualizare');
    }
  };
  const handleAssignToScreen = async (contentId, screenId) => {
    // Check if we are dragging a selection (multi-select)
    // If contentId matches one of the selected items, and we have multiple selected
    if (selectedItems.has(contentId) && selectedItems.size > 1) {
      // Open Slideshow Dialog
      setPendingSlideshowScreen(screenId);
      setShowSlideshowDialog(true);
      return;
    }

    // Sigle item assignment
    try {
      await api.post('/screen-zones', {
        screen_id: screenId,
        zone_id: 'zone1',
        content_type: 'single_content',
        content_id: contentId
      });
      toast.success('Conținut asignat ecranului!');
      loadScreens(); // REFRESH UI
    } catch (error) {
      toast.error('Eroare la asignarea conținutului');
    }
  };

  const handleCreateSlideshow = async (config) => {
    if (!pendingSlideshowScreen || selectedItems.size === 0) return;

    try {
      // 1. Create Playlist
      const playlistResponse = await api.post('/playlists', {
        name: `Slideshow Screen ${pendingSlideshowScreen} - ${new Date().toLocaleTimeString()}`,
        items: Array.from(selectedItems).map(id => {
          const contentItem = content.find(c => c.id === id);
          return {
            content_id: id,
            duration: (contentItem && contentItem.type === 'video') ? contentItem.duration : config.duration,
            transition: config.transition // Backend might need schema update for this if not in JSONB
          };
        }),
        autoplay: true,
        loop: true
      });

      const playlistId = playlistResponse.data.id;

      // 2. Assign Playlist to Screen
      await api.post('/screen-zones', {
        screen_id: pendingSlideshowScreen,
        zone_id: 'zone1',
        content_type: 'playlist',
        playlist_id: playlistId
      });

      toast.success('Slideshow creat și asignat!');
      loadScreens(); // REFRESH UI
      setSelectedItems(new Set()); // Clear selection
    } catch (error) {
      console.error('Slideshow creation failed:', error);
      toast.error('Eroare la crearea slideshow-ului');
    } finally {
      setPendingSlideshowScreen(null);
    }
  };


  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="spinner"></div>
        </div>
          <ConfirmDialog />
        </DashboardLayout>
    );
  }

  const toggleSelectAll = (items) => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(i => i.id)));
    }
  };

  const toggleSelectItem = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkDelete = async () => {
    if (!(await confirm({ message: `Sigur dorești să ștergi ${selectedItems.size} elemente?`, isDanger: true }))) return;

    try {
      // Execute deletions (Promise.all for now)
      const deletePromises = Array.from(selectedItems).map(id => api.delete(`/content/${id}`));
      await Promise.all(deletePromises);

      toast.success(`${selectedItems.size} elemente șterse!`);
      setSelectedItems(new Set());
      loadContent();
    } catch (error) {
      console.error('Bulk delete error', error);
      toast.error('Eroare la ștergerea multiplă');
    }
  };

  const handleBulkMoveToFolder = async (folderId) => {
    try {
      // 1. Verificăm dacă fișierele sunt în playlist sau pe ecran
      const usagePromises = Array.from(selectedItems).map(id => api.get(`/content/${id}/usage`));
      const usageResults = await Promise.all(usagePromises);
      
      const isUsed = usageResults.some(res => res.data.playlists.length > 0 || res.data.screens.length > 0);
      
      if (isUsed) {
        toast.error('Unele fișiere sunt folosite în playlist-uri sau ecrane! Nu le poți muta până nu le scoți din playlist.', { autoClose: 5000 });
        return;
      }

      // 2. Efectuăm mutarea dacă nu sunt în use
      const movePromises = Array.from(selectedItems).map(id =>
        api.patch(`/content/${id}/folder`, { folder_id: folderId })
      );
      await Promise.all(movePromises);

      toast.success(`${selectedItems.size} elemente mutate!`);
      setSelectedItems(new Set());
      loadContent();
    } catch (error) {
      console.error('Bulk move error', error);
      toast.error('Eroare la mutarea multiplă');
    }
  };

  // Map content usage in playlists
  const getPlaylistsForContent = (contentId) => {
    return playlists.filter(p => {
      if (!p.items) return false;
      let items = typeof p.items === 'string' ? JSON.parse(p.items) : p.items;
      return items.some(item => item.content_id === contentId);
    });
  };

  const renderView = (items) => {
    if (items.length === 0) {
      return (
        <div className="glass-card p-12 text-center" data-testid="no-content">
          <FileImage className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Niciun fișier găsit aici.</p>
          <p className="text-sm text-slate-400 mt-1">Încarcă un fișier nou sau alege alt folder.</p>
        </div>
      );
    }

    if (viewMode === 'list') {
      return (
        <div className="overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed">
              <colgroup>
                <col className="w-10" />
                <col className="w-16" />
                <col />
                <col className="w-16" />
                <col className="w-20" />
                <col className="w-20" />
                <col className="w-20" />
                <col className="w-24" />
                <col className="w-24" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-slate-50 dark:from-slate-900 to-slate-100/50">
                  <th className="p-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === items.length && items.length > 0}
                      onChange={() => toggleSelectAll(items)}
                      className="rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500"
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Preview</th>
                  <th
                    className="p-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-brand-600 transition-colors"
                    onClick={() => requestSort('title')}
                  >
                    <div className="flex items-center gap-1">
                      Titlu
                      {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Brand</th>
                  <th
                    className="p-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-brand-600 transition-colors"
                    onClick={() => requestSort('type')}
                  >
                    <div className="flex items-center gap-1">
                      Tip
                      {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th
                    className="p-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-brand-600 transition-colors"
                    onClick={() => requestSort('file_size')}
                  >
                    <div className="flex items-center gap-1">
                      Dim.
                      {sortConfig.key === 'file_size' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="p-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Adăugat</th>
                  <th
                    className="p-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-brand-600 transition-colors"
                    onClick={() => requestSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      Dată
                      {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="p-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={`group hover:bg-slate-50/50 transition-colors ${selectedItems.has(item.id) ? 'bg-brand-50/30' : ''} cursor-move active:opacity-50 active:scale-[0.99] transform`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('contentId', item.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                      />
                    </td>
                    <td className="p-4 w-24">
                      <ContentHoverPreview
                        item={item}
                        videoAutoplay={videoAutoplay}
                        onClick={() => handlePreview(item)}
                      />
                    </td>
                    <td className="p-4">
                      <div 
                        className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer hover:text-brand-600 transition-colors"
                        onClick={() => handlePreview(item)}
                        title="Click pentru previzualizare fișier"
                      >
                        {item.title}
                      </div>
                      {(() => {
                        const itemPlaylists = getPlaylistsForContent(item.id);
                        if (itemPlaylists.length > 0) {
                          return (
                            <div className="mt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/playlists?edit=${itemPlaylists[0].id}`;
                                }}
                                title={`Folosit în ${itemPlaylists.length} playlist(uri). Click pentru a edita.`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-200 text-[10px] font-bold uppercase transition-colors shadow-sm"
                              >
                                <ListIcon className="w-3 h-3" />
                                Playlist ({itemPlaylists.length})
                              </button>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <div className="flex -space-x-2 overflow-hidden">
                          {Array.isArray(item.brand) && item.brand.slice(0, 3).map((brandName, idx) => (
                            getBrandLogo(brandName) && (
                              <div
                                key={idx}
                                className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 overflow-hidden shrink-0 shadow-md ring-2 ring-white dark:ring-slate-900"
                                title={brandName}
                              >
                                <img src={getBrandLogo(brandName)} className="w-full h-full object-cover rounded-full" alt="" />
                              </div>
                            )
                          ))}
                          {Array.isArray(item.brand) && item.brand.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 shadow-md ring-2 ring-white dark:ring-slate-900">
                              +{item.brand.length - 3}
                            </div>
                          )}
                        </div>
                        {Array.isArray(item.brand) && item.brand.length > 0 && !item.brand.some(b => getBrandLogo(b)) && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic truncate max-w-[100px]">{item.brand.join(', ')}</span>
                        )}
                        {(!Array.isArray(item.brand) || item.brand.length === 0) && (
                          <span className="text-[10px] text-slate-300 dark:text-slate-600 italic">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {item.type === 'image' && <FileImage className="w-3.5 h-3.5 text-brand-500" />}
                        {item.type === 'video' && <Film className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
                        {item.type === 'youtube' && <Film className="w-3.5 h-3.5 text-brand-600" />}
                        {item.type === 'web' && <LayoutGrid className="w-3.5 h-3.5 text-brand-600" />}
                        <span className={`text-xs font-medium capitalize ${item.type === 'youtube' ? 'text-brand-600' :
                          item.type === 'web' ? 'text-brand-600' : 'text-slate-600 dark:text-slate-400'
                          }`}>
                          {item.type}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 text-sm">
                      {item.file_size ? `${(item.file_size / 1024 / 1024).toFixed(2)} MB` : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col text-xs">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{item.created_by_name || 'System'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 text-sm">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('ro-RO') : '-'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-brand-50 dark:hover:bg-brand-950/40 text-slate-400 hover:text-brand-600 rounded-lg transition-colors" 
                          onClick={() => handlePreview(item)}
                          title="Previzualizează (Foto/Video)"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {isAdmin() && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-brand-50"
                              onClick={() => {
                                setRenamingItem(item);
                                setNewTitle(item.title);
                                setEditBrands(Array.isArray(item.brand) ? item.brand : []);
                                setShowRenameDialog(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4 text-brand-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-rose-50 group/d" onClick={() => handleDelete(item)}>
                              <Trash2 className="h-4 w-4 text-slate-400 group-hover/d:text-rose-600 transition-colors" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Padding Empty Rows */}
                {Array.from({ length: Math.max(0, 10 - items.length) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-[65px] bg-white/40 dark:bg-slate-900/40">
                    <td colSpan={9} className="p-4"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className={`glass-card p-6 flex flex-col group transition-all duration-300 ${selectedItems.has(item.id) ? 'ring-2 ring-brand-500 shadow-lg scale-[1.02]' : 'hover:shadow-md'}`}
            style={{ minHeight: '600px' }}
            data-testid={`content-card-${item.id}`}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('contentId', item.id);
            }}
            onClick={(e) => {
              // Toggle selection on card click if not clicking a button
              if (!e.target.closest('button') && !e.target.closest('input')) {
                toggleSelectItem(item.id);
              }
            }}
          >
            {/* Header: Brand & Title */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-col min-w-0">
                <div className="flex -space-x-1 overflow-hidden mb-1.5 h-6 items-center">
                  {Array.isArray(item.brand) && item.brand.map((brandName, idx) => (
                    getBrandLogo(brandName) ? (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 overflow-hidden shrink-0 shadow-md ring-2 ring-white dark:ring-slate-900 z-10"
                        title={brandName}
                      >
                        <img src={getBrandLogo(brandName)} className="w-full h-full object-cover rounded-full" alt="" />
                      </div>
                    ) : (
                      <span key={idx} className="text-[10px] font-black text-brand-600 uppercase tracking-widest mr-2 underline decoration-2 decoration-brand-200 underline-offset-4">
                        {brandName}
                      </span>
                    )
                  ))}
                  {Array.isArray(item.brand) && item.brand.length === 0 && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fără Brand</span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 leading-tight truncate pr-2" title={item.title}>
                  {item.title}
                </h3>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 shadow-sm cursor-pointer mt-1"
                  checked={selectedItems.has(item.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSelectItem(item.id);
                  }}
                />
              </div>
            </div>

            {/* Media Area - Aspect Video */}
            <div 
              onClick={(e) => { e.stopPropagation(); handlePreview(item); }}
              className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden mb-5 border border-slate-200 dark:border-slate-700 shadow-inner group-inner cursor-pointer"
            >
              {item.type === 'youtube' ? (
                <div className="w-full h-full bg-brand-900 flex items-center justify-center">
                  <Film className="w-16 h-16 text-white/80" />
                  <div className="absolute top-3 right-3 z-20 bg-brand-600 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest shadow-sm">YOUTUBE</div>
                </div>
              ) : item.type === 'web' ? (
                <div className="w-full h-full bg-brand-900 flex items-center justify-center">
                  <LayoutGrid className="w-16 h-16 text-white/80" />
                  <div className="absolute top-3 right-3 z-20 bg-brand-600 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest shadow-sm">WEB</div>
                </div>
              ) : item.type === 'image' ? (
                <>
                  <img
                    src={getFileUrl(item.file_url)}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 z-20 flex flex-col gap-1 items-end">
                    <div className="bg-slate-900/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-white/10">
                      {item.duration}s
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {item.thumbnail_url ? (
                    <img
                      src={getFileUrl(item.thumbnail_url)}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                      <Film className="w-12 h-12 text-slate-500 dark:text-slate-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm rounded-full p-3 border border-white/30 group-hover:scale-110 transition-transform">
                      <Film className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 z-20 bg-brand-600/90 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest shadow-sm">
                    VIDEO
                  </div>
                  <div className="absolute bottom-3 left-3 z-20 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-medium">
                    {item.duration}s
                  </div>
                </>
              )}

              {/* Hover Overlay with Preview Icon */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white shadow-xl flex items-center gap-1.5 transform group-hover:scale-105 transition-transform">
                  <Eye className="w-4 h-4 text-brand-400" />
                  <span className="text-xs font-bold">Mărește</span>
                </div>
              </div>

              {/* Playlist Badge overlay for Grid View */}
              {(() => {
                const itemPlaylists = getPlaylistsForContent(item.id);
                if (itemPlaylists.length > 0) {
                  return (
                    <div className="absolute top-3 left-3 z-30">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/playlists?edit=${itemPlaylists[0].id}`;
                        }}
                        title={`Folosit în ${itemPlaylists.length} playlist(uri). Click pentru a edita.`}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-600/90 hover:bg-brand-500 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest shadow-lg border border-white/20 transition-all transform hover:scale-105"
                      >
                        <ListIcon className="w-3.5 h-3.5" />
                        În Playlist
                      </button>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Metadata Section */}
            <div className="flex-1 space-y-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {item.type === 'video' || item.type === 'youtube' ? <Film className="w-4 h-4 text-slate-400" /> : <FileImage className="w-4 h-4 text-slate-400" />}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Tip</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">{item.type}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Categorie</span>
                  <span className="text-xs font-bold text-brand-600 capitalize">{item.category}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800">
                  {(item.file_size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-2 mt-auto">
              <button
                onClick={(e) => { e.stopPropagation(); handlePreview(item); }}
                className="flex-1 flex items-center justify-center gap-2 text-sm bg-brand-600 text-white hover:bg-brand-700 px-4 py-3 rounded-full transition-all shadow-md hover:shadow-lg font-bold"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>

              {isAdmin() && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingItem(item);
                      setNewTitle(item.title);
                      setEditBrands(Array.isArray(item.brand) ? item.brand : []);
                      setShowRenameDialog(true);
                    }}
                    className="p-3 hover:bg-brand-50 rounded-full transition-all text-slate-400 hover:text-brand-600 border border-transparent hover:border-brand-100"
                    title="Editează"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                    className="p-3 hover:bg-rose-50 rounded-full transition-all text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-100 group/del"
                    title="Șterge"
                  >
                    <Trash2 className="w-5 h-5 group-hover/del:scale-110 transition-transform" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="animate-in" data-testid="content-page">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent mb-1 tracking-tight">Bibliotecă Conținut</h1>
            <p className="text-sm text-slate-400 font-medium">Gestionează imagini, video-uri și conținut media</p>
          </div>

          {isAdmin() && selectedItems.size > 0 && (
            <div className="mb-6 bg-gradient-to-r from-brand-600 to-rose-600 text-white px-6 py-4 rounded-2xl shadow-lg flex items-center gap-4 animate-in slide-in-from-top-4">
              <span className="font-semibold text-lg">{selectedItems.size} selectate</span>
              <div className="h-6 w-px bg-white/30 dark:bg-slate-900/30"></div>

              {/* Move to Folder Dropdown */}
              <Select onValueChange={(value) => handleBulkMoveToFolder(value === 'none' ? null : value)}>
                <SelectTrigger className="w-48 bg-white dark:bg-slate-900 text-slate-900 border-none shadow-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50">
                  <SelectValue placeholder="Mută în folder..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">📁 Root (Niciun folder)</SelectItem>
                  {folders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4" style={{ color: (folder.color === '#ef4444' || folder.color === '#dc2626') ? 'var(--brand-500)' : folder.color }} />
                        {folder.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <button
                onClick={handleBulkDelete}
                className="ml-auto bg-white dark:bg-slate-900 text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 px-4 py-2 rounded-full font-semibold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Șterge
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="text-white hover:underline text-sm font-medium transition-all"
              >
                Anulează
              </button>
            </div>
          )}

        </div>


        {/* Folder Dialog */}
        <FolderDialog
          showFolderDialog={showFolderDialog}
          setShowFolderDialog={setShowFolderDialog}
          editingFolder={editingFolder}
          folderFormData={folderFormData}
          setFolderFormData={setFolderFormData}
          handleCreateFolder={handleCreateFolder}
          handleUpdateFolder={handleUpdateFolder}
          handleIconUpload={handleIconUpload}
        />

        {/* Header Row: Search (Left) + Actions (Right) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
          <div className="w-full sm:w-64 shrink-0">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Caută fișiere..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-2xl h-10 text-sm w-full"
                />
             </div>
          </div>

            <div className="flex items-center gap-3 overflow-x-auto py-2 max-w-4xl scrollbar-hide mr-auto ml-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Filtrează:</span>
              <div className="flex gap-2">
                {brands.map(brand => {
                  const count = folderFilteredContent.filter(item =>
                    Array.isArray(item.brand)
                      ? item.brand.includes(brand.name)
                      : item.brand === brand.name
                  ).length;

                  return (
                    <button
                      key={brand.id}
                      onClick={() => toggleBrandFilter(brand.name)}
                      className={`relative group transition-all duration-200 ${selectedBrands.includes(brand.name) ? 'scale-110 opacity-100' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                      title={`${brand.name} (${count})`}
                    >
                      <div className={`w-8 h-8 flex items-center justify-center overflow-hidden transition-all rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-700 ${selectedBrands.includes(brand.name) ? 'ring-2 ring-brand-500 border-brand-500' : ''}`}>
                        {brand.logo_url ? (
                          <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="text-[8px] font-bold text-slate-400">{brand.name?.substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      {selectedBrands.includes(brand.name) && (
                        <div className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-0.5 bg-brand-600 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-white shadow-sm z-20 animate-in zoom-in duration-200">
                          {count}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedBrands.length > 0 && (
                <button
                  onClick={() => setSelectedBrands([])}
                  className="ml-2 px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors uppercase tracking-wider"
                >
                  Resetează
                </button>
              )}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-x-auto custom-scrollbar shrink-0">
                  <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-700 pr-3">
                    <Switch
                      checked={showImages}
                      onCheckedChange={setShowImages}
                      className="data-[state=checked]:bg-brand-500 scale-75"
                    />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Imagini</span>
                  </div>
                  <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-700 pr-3">
                    <Switch
                      checked={showVideos}
                      onCheckedChange={setShowVideos}
                      className="data-[state=checked]:bg-brand-500 scale-75"
                    />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Video</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={videoAutoplay}
                      onCheckedChange={setVideoAutoplay}
                      className="data-[state=checked]:bg-brand-500 scale-75"
                    />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Autoplay</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* View Mode Switcher */}
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-2xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-2xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400'}`}
                  title="List View"
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Add Content Button & Dialog */}
              {isAdmin() && (
                <Dialog open={showDialog} onOpenChange={(open) => {
                  if (uploading) return;
                  setShowDialog(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="btn-primary px-6 py-2 rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-all h-[40px]">
                      <Plus className="w-4 h-4 mr-2" />
                      Adăugă conținut
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    className="glass-panel max-w-xl max-h-[90vh] overflow-y-auto"
                    onPointerDownOutside={(e) => { if (uploading) e.preventDefault(); }}
                    onEscapeKeyDown={(e) => { if (uploading) e.preventDefault(); }}
                  >
                    <DialogHeader>
                      <DialogTitle>Adăugă conținut nou</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleFileUpload} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Folder Destinație</Label>
                        <Select
                          disabled={uploading}
                          value={formData.folder_id || 'none'}
                          onValueChange={(val) => setFormData({ ...formData, folder_id: val })}
                        >
                          <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                            <SelectValue placeholder="Selectează folder" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">📁 Root (Toate fișierele)</SelectItem>
                            {folders.map(folder => (
                              <SelectItem key={folder.id} value={folder.id}>
                                <div className="flex items-center gap-2">
                                  {folder.icon && (folder.icon.startsWith('http') || folder.icon.startsWith('/') || folder.icon.startsWith('data:')) ? (
                                    <div className="w-4 h-4 rounded-sm overflow-hidden shrink-0">
                                      <img src={folder.icon} className="w-full h-full object-cover" alt="" />
                                    </div>
                                  ) : (
                                    <Folder className="w-4 h-4" style={{ color: (folder.color === '#ef4444' || folder.color === '#dc2626') ? 'var(--brand-500)' : folder.color }} fill={(folder.color === '#ef4444' || folder.color === '#dc2626') ? 'var(--brand-500)' : folder.color} />
                                  )}
                                  {folder.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Branduri (Clienți)</Label>
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl max-h-36 overflow-y-auto">
                          {brands.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Niciun brand creat încă.</p>
                          ) : (
                            brands.map(brand => (
                              <label
                                key={brand.id}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border cursor-pointer transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''} ${formData.brand?.includes(brand.name)
                                  ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-sm'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:border-slate-600'
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  disabled={uploading}
                                  className="hidden"
                                  checked={formData.brand?.includes(brand.name)}
                                  onChange={() => {
                                    const currentBrands = formData.brand || [];
                                    const newBrands = currentBrands.includes(brand.name)
                                      ? currentBrands.filter(b => b !== brand.name)
                                      : [...currentBrands, brand.name];
                                    setFormData({ ...formData, brand: newBrands });
                                  }}
                                />
                                {brand.logo_url && (
                                  <div className="w-4 h-4 rounded-sm overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                    <img src={brand.logo_url} className="w-full h-full object-contain" alt="" />
                                  </div>
                                )}
                                <span className="text-xs font-medium">{brand.name}</span>
                              </label>
                            ))
                          )}
                        </div>
                        {formData.brand?.length > 0 && (
                          <p className="text-[10px] text-slate-400">
                            {formData.brand.length} branduri selectate
                          </p>
                        )}
                      </div>

                      <Tabs value={uploadMethod} onValueChange={(val) => { if (!uploading) setUploadMethod(val); }}>
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="file" disabled={uploading}>Upload Fișiere</TabsTrigger>
                          <TabsTrigger value="external" disabled={uploading}>Link Extern</TabsTrigger>
                        </TabsList>

                        <TabsContent value="file" className="space-y-4 mt-4">
                          <div>
                            <Label className="text-base font-semibold">Selectează sau trage fișiere</Label>
                            
                            {/* Interactive Drag & Drop Area */}
                            <div
                              onDragEnter={handleModalDragEnter}
                              onDragOver={handleModalDragOver}
                              onDragLeave={handleModalDragLeave}
                              onDrop={handleModalDrop}
                              onClick={() => !uploading && fileInputRef.current?.click()}
                              className={`mt-2 border-2 border-dashed rounded-2xl p-6 transition-all text-center cursor-pointer select-none relative overflow-hidden ${
                                isDragging
                                  ? 'border-brand-500 bg-brand-100/70 dark:bg-brand-950/60 ring-4 ring-brand-400/40 scale-[1.01]'
                                  : 'border-brand-300/80 dark:border-brand-700/60 bg-gradient-to-br from-brand-50/50 via-white to-brand-50/30 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-900/80 hover:from-brand-50/80 hover:to-brand-50/60 hover:border-brand-400 shadow-xs hover:shadow-sm'
                              } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                            >
                              <div className="flex flex-col items-center">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-transform ${
                                  isDragging ? 'bg-brand-500 text-white scale-110 shadow-lg animate-bounce' : 'bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400'
                                }`}>
                                  {isDragging ? <FileUp className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                                </div>
                                
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                                  {isDragging ? 'Dă drumul fișierelor aici!' : 'Trage fișierele aici sau apasă pentru a alege'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                  Suportă imagini (JPG, PNG, WEBP, GIF) și video (MP4, WEBM, MOV)
                                </p>
                                
                                <button
                                  type="button"
                                  disabled={uploading}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                  }}
                                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-full shadow-md hover:shadow-lg transition-all active:scale-95"
                                >
                                  <Upload className="w-4 h-4" />
                                  Alege fișiere din calculator
                                </button>
                              </div>

                              <input
                                ref={fileInputRef}
                                id="file-upload-input"
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,video/quicktime"
                                multiple
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    processIncomingFiles(e.target.files);
                                    e.target.value = '';
                                  }
                                }}
                                className="hidden"
                              />
                            </div>

                            {/* Staged files list & counter */}
                            {selectedFiles.length > 0 && (
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 px-1">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    {selectedFiles.length} {selectedFiles.length === 1 ? 'fișier pregătit' : 'fișiere pregătite'}
                                  </span>
                                  <span className="text-slate-500 font-mono text-[11px]">
                                    Total: {formatFileSize(Array.from(selectedFiles).reduce((sum, f) => sum + (f.size || 0), 0))}
                                  </span>
                                </div>

                                <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 divide-y divide-slate-100 dark:divide-slate-800">
                                  {Array.from(selectedFiles).map((file, idx) => {
                                    const isVid = file.type.startsWith('video') || /\.(mp4|webm|mov|mkv)$/i.test(file.name);
                                    return (
                                      <div
                                        key={`${file.name}_${file.size}_${idx}`}
                                        className="flex items-center justify-between gap-2 p-1.5 pt-2 first:pt-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/60 shadow-2xs hover:border-brand-200 transition-all text-xs"
                                      >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                            isVid
                                              ? 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400'
                                              : 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                                          }`}>
                                            {isVid ? <Film className="w-4 h-4" /> : <FileImage className="w-4 h-4" />}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-slate-800 dark:text-slate-200" title={file.name}>
                                              {file.name}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                              {isVid ? 'Video' : 'Imagine'} • {formatFileSize(file.size)}
                                            </p>
                                          </div>
                                        </div>

                                        {!uploading && (
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveFile(idx)}
                                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                            title="Șterge fișierul"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Single file title edit */}
                            {selectedFiles.length === 1 && !uploading && (
                              <div className="mt-3 space-y-1.5">
                                <Label className="text-xs font-semibold">Titlu afișare</Label>
                                <Input
                                  value={formData.title}
                                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                  placeholder="ex: Meniu Săptămânal"
                                  className="h-9 text-xs"
                                />
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="external" className="space-y-4 mt-4">
                          <div>
                            <Label>Tip Conținut Extern</Label>
                            <Select
                              disabled={uploading}
                              value={formData.type}
                              onValueChange={(value) => setFormData({ ...formData, type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="image">Imagine (Link Direct)</SelectItem>
                                <SelectItem value="video">Video (Link Direct)</SelectItem>
                                <SelectItem value="youtube">YouTube (Link/Embed)</SelectItem>
                                <SelectItem value="web">Pagină Web (URL)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>URL conținut</Label>
                            <Input
                              disabled={uploading}
                              value={formData.file_url}
                              onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                              placeholder={formData.type === 'youtube' ? "https://youtube.com/watch?v=..." : "https://..."}
                            />
                          </div>
                        </TabsContent>
                      </Tabs>

                      {/* Progress Bar & ETA block when uploading */}
                      {uploading && (
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-brand-50/40 dark:from-slate-800 dark:to-slate-800/90 border border-brand-200 dark:border-brand-700 shadow-md space-y-3 animate-in fade-in duration-200">
                          {/* Top Header: File index, remaining count and total percentage */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                                <Loader2 className="w-4 h-4 animate-spin" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-extrabold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                                    Fișierul {uploadProgress.currentFileIndex + 1} din {uploadProgress.totalFiles}
                                  </span>
                                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200 border border-brand-200/60 dark:border-brand-700/60">
                                    {uploadProgress.remainingFiles > 0
                                      ? `Mai sunt ${uploadProgress.remainingFiles} ${uploadProgress.remainingFiles === 1 ? 'fișier' : 'fișiere'}`
                                      : 'Ultimul fișier!'}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[280px] mt-0.5" title={uploadProgress.currentFileName}>
                                  {uploadProgress.currentFileName || 'Se transferă datele...'}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-2xl font-black bg-gradient-to-r from-brand-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
                                {uploadProgress.overallPercent}%
                              </span>
                            </div>
                          </div>

                          {/* Visual Progress Bar */}
                          <div className="space-y-1">
                            <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 shadow-inner">
                              <div
                                className="h-full bg-gradient-to-r from-brand-500 via-rose-500 to-amber-500 rounded-full transition-all duration-300 ease-out relative"
                                style={{ width: `${Math.max(3, uploadProgress.overallPercent)}%` }}
                              >
                                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
                              </div>
                            </div>

                            {uploadProgress.totalFiles > 1 && (
                              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-0.5">
                                <span>Progres fișier curent: {uploadProgress.filePercent}%</span>
                                <span className="font-medium text-brand-600 dark:text-brand-400">{uploadProgress.statusText}</span>
                              </div>
                            )}
                          </div>

                          {/* Metric Cards: Viteză, Transferat, Timp Rămas */}
                          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-center">
                            <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                                <Zap className="w-3 h-3 text-amber-500" />
                                <span>Viteză</span>
                              </div>
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {formatSpeed(uploadProgress.speedBytesPerSec)}
                              </div>
                            </div>

                            <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                                <Upload className="w-3 h-3 text-brand-500" />
                                <span>Transferat</span>
                              </div>
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {formatFileSize(uploadProgress.totalLoadedBytes)} / {formatFileSize(uploadProgress.totalBatchBytes)}
                              </div>
                            </div>

                            <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                                <Clock className="w-3 h-3 text-blue-500" />
                                <span>Timp rămas</span>
                              </div>
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {formatEta(uploadProgress.remainingSeconds)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 pt-3">
                        <Button
                          type="submit"
                          disabled={uploading || (uploadMethod === 'file' && selectedFiles.length === 0)}
                          className="btn-primary flex-1 h-11 text-sm font-bold shadow-md hover:shadow-lg transition-all"
                        >
                          {uploading ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Se încarcă ({uploadProgress.overallPercent}%)
                            </span>
                          ) : (
                            uploadMethod === 'file' && selectedFiles.length > 1
                              ? `Încarcă ${selectedFiles.length} fișiere`
                              : 'Adaugă'
                          )}
                        </Button>
                        <Button
                          type="button"
                          disabled={uploading}
                          onClick={() => setShowDialog(false)}
                          className="btn-secondary h-11"
                        >
                          Anulează
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Main Layout Body */}
          <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-13rem)]">
            {/* Sidebar Column (Left) */}
            <div className="w-full lg:w-72 xl:w-80 shrink-0 h-full overflow-hidden flex flex-col">
              <FolderSidebar
                folders={folders}
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
                content={content}
                isAdmin={isAdmin}
                openFolderDialog={openFolderDialog}
                handleDeleteFolder={handleDeleteFolder}
                handleMoveToFolder={handleMoveToFolder}
                onAddContent={openUploadDialogWithFolder}
                screens={screens}
                onAssignToScreen={handleAssignToScreen}
                onRefresh={() => {
                  loadFolders();
                  loadContent();
                }}
              />
            </div>

            {/* Right Column (Content) */}
            <div className="flex-1 flex flex-col w-full min-w-0">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden flex flex-col h-full">
                {/* Header */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100/80 dark:border-slate-800/80 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-sm">
                      <FileImage className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 tracking-tight">Bibliotecă Conținut</h3>
                  </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                  {renderView(currentItems)}
                </div>

                {/* Pagination Footer */}
                <div className="px-4 py-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between bg-gradient-to-r from-slate-50/80 to-white dark:to-slate-900 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium">Afișează:</span>
                      <select
                        className="text-xs border border-slate-200 dark:border-slate-700 rounded-2xl px-2 py-1.5 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all cursor-pointer font-medium text-slate-600 dark:text-slate-400 shadow-sm"
                        value={itemsPerPage}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newItemsPerPage = val === 'all' ? 'all' : parseInt(val);
                          setItemsPerPage(newItemsPerPage);
                          localStorage.setItem('contentItemsPerPage', val);
                          setCurrentPage(1);
                        }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value="all">Toate</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-medium">Pagina</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-2.5 py-1 shadow-sm min-w-[2.5rem] text-center">
                        {currentPage}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">din {totalPages}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="h-8 px-3 text-xs font-semibold rounded-full border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:border-slate-300 dark:border-slate-600 transition-all disabled:opacity-40"
                    >
                      ← Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className="h-8 px-3 text-xs font-semibold rounded-full border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:border-slate-300 dark:border-slate-600 transition-all disabled:opacity-40"
                    >
                      Următor →
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Fullscreen Media Lightbox Modal */}
        {previewItem && (
          <ContentLightboxModal
            item={previewItem}
            items={sortedContent}
            folders={folders}
            onClose={() => {
              setPreviewItem(null);
              setShowPreview(false);
            }}
            onNavigate={(newItem) => setPreviewItem(newItem)}
            onEdit={isAdmin() ? (itemToEdit) => {
              setPreviewItem(null);
              setShowPreview(false);
              setRenamingItem(itemToEdit);
              setNewTitle(itemToEdit.title);
              setEditBrands(Array.isArray(itemToEdit.brand) ? itemToEdit.brand : []);
              setShowRenameDialog(true);
            } : null}
          />
        )}

        {/* Rename Dialog */}
        < Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog} >
          <DialogContent className="glass-panel">
            <DialogHeader>
              <DialogTitle>Editează conținutul</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRenameContent} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Titlu</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Introdu titlul..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Branduri (Clienți)</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl max-h-48 overflow-y-auto">
                  {brands.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Niciun brand creat încă.</p>
                  ) : (
                    brands.map(brand => (
                      <label
                        key={brand.id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border cursor-pointer transition-all ${editBrands.includes(brand.name)
                          ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:border-slate-600'
                          }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={editBrands.includes(brand.name)}
                          onChange={() => {
                            const newBrands = editBrands.includes(brand.name)
                              ? editBrands.filter(b => b !== brand.name)
                              : [...editBrands, brand.name];
                            setEditBrands(newBrands);
                          }}
                        />
                        {brand.logo_url && (
                          <div className="w-4 h-4 rounded-sm overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <img src={brand.logo_url} className="w-full h-full object-contain" alt="" />
                          </div>
                        )}
                        <span className="text-xs font-medium">{brand.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowRenameDialog(false)}>
                  Anulează
                </Button>
                <Button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white font-semibold flex-1 shadow-md">
                  Salvează modificările
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog >

        <SlideshowConfigDialog
          open={showSlideshowDialog}
          onOpenChange={setShowSlideshowDialog}
          onConfirm={handleCreateSlideshow}
          count={selectedItems.size}
          selectedContent={content.filter(item => selectedItems.has(item.id))}
        />

        {/* Safe Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-600">
                <Trash2 className="h-5 w-5" />
                Confirmare Ștergere
              </DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                Sigur dorești să ștergi fișierul <span className="font-semibold text-slate-900">"{itemToDelete?.title}"</span>?
              </p>

              {isCheckingUsage ? (
                <div className="flex items-center gap-2 text-slate-400 italic py-2">
                  <div className="h-4 w-4 border-2 border-slate-300 dark:border-slate-600 border-t-slate-600 rounded-full animate-spin" />
                  Se verifică utilizarea...
                </div>
              ) : (
                (usageInfo.screens.length > 0 || usageInfo.playlists.length > 0) && (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="flex items-start gap-3 text-rose-800 font-bold text-base">
                      <span className="text-xl">⚠️</span>
                      <p>Fișierul rulează pe ecrane sau este într-un playlist!</p>
                    </div>
                    <div className="space-y-2 text-sm text-rose-700 bg-white/50 dark:bg-slate-900/50 p-3 rounded-xl border border-rose-100">
                      {usageInfo.screens.length > 0 && (
                        <div>
                          <span className="font-bold">Ecrane:</span> {usageInfo.screens.map(s => s.name).join(', ')}
                        </div>
                      )}
                      {usageInfo.playlists.length > 0 && (
                        <div>
                          <span className="font-bold">Playlist-uri:</span> {usageInfo.playlists.map(p => p.name).join(', ')}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-rose-200/60">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="mt-1 w-5 h-5 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                          checked={forceDeleteConfirm}
                          onChange={(e) => setForceDeleteConfirm(e.target.checked)}
                        />
                        <span className="text-sm font-bold text-rose-900 leading-tight">
                          Da, sunt de acord să scot automat fișierul din aceste locații pentru a-l putea șterge definitiv.
                        </span>
                      </label>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                Anulează
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isCheckingUsage || isDeleting || ((usageInfo.screens.length > 0 || usageInfo.playlists.length > 0) && !forceDeleteConfirm)}
                className={`transition-all ${((usageInfo.screens.length > 0 || usageInfo.playlists.length > 0) && !forceDeleteConfirm) ? 'bg-slate-300 hover:bg-slate-300 text-slate-500 dark:text-slate-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'}`}
              >
                {isDeleting ? 'Se șterge...' : 'Șterge Fișierul'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <ConfirmDialog />

      {/* Fullscreen Page Drag Overlay */}
      {isPageDragging && (
        <div
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDragLeave={(e) => {
            e.preventDefault();
            pageDragCounter.current--;
            if (pageDragCounter.current <= 0) {
              setIsPageDragging(false);
              pageDragCounter.current = 0;
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsPageDragging(false);
            pageDragCounter.current = 0;
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              processIncomingFiles(e.dataTransfer.files);
              setShowDialog(true);
            }
          }}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md p-8 flex items-center justify-center animate-in fade-in duration-150"
        >
          <div className="w-full max-w-lg border-3 border-dashed border-white bg-white/95 dark:bg-slate-900/95 rounded-3xl p-10 text-center shadow-2xl flex flex-col items-center scale-100 animate-in zoom-in-95 duration-150">
            <div className="w-24 h-24 bg-brand-100 dark:bg-brand-950/80 rounded-full flex items-center justify-center mb-5 ring-12 ring-brand-500/20 shadow-inner">
              <Upload className="w-12 h-12 text-brand-600 dark:text-brand-400 animate-bounce" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              Plasează fișierele aici
            </h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 max-w-sm">
              Dă drumul fișierelor pentru a le încărca direct în{' '}
              <span className="font-bold text-brand-600 dark:text-brand-400">
                {selectedFolder ? `folderul „${selectedFolder.name}”` : 'directorul Root (Toate fișierele)'}
              </span>
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
