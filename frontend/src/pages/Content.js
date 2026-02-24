import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { FolderSidebar } from '../components/FolderSidebar';
import { FolderDialog } from '../components/FolderDialog';
import { Upload, Link as LinkIcon, FileImage, Film, Trash2, Plus, LayoutGrid, List as ListIcon, Eye, Folder, FolderPlus, Edit2, FolderOpen } from 'lucide-react';
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

export const Content = () => {
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

  const [brands, setBrands] = useState([]);
  const [showSlideshowDialog, setShowSlideshowDialog] = useState(false);
  const [pendingSlideshowScreen, setPendingSlideshowScreen] = useState(null);

  // Safe Delete States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [usageInfo, setUsageInfo] = useState({ screens: [], playlists: [] });
  const [isCheckingUsage, setIsCheckingUsage] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadContent();
    loadFolders();
    loadScreens();
    loadBrands();
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
    if (!window.confirm('Sigur dorești să ștergi acest folder? Conținutul va fi mutat în "Toate fișierele".')) return;
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
    ? content.filter(item => String(item.folder_id) === String(selectedFolder.id))
    : content.filter(item => !item.folder_id);

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


  // 3. Filter by type (for display)
  const typeFilteredContent = typeFilter === 'all'
    ? brandFilteredContent
    : brandFilteredContent.filter(item => {
      if (typeFilter === 'images') return item.type === 'image';
      if (typeFilter === 'videos') return item.type === 'video';
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

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (uploadMethod === 'file' && selectedFiles.length === 0) {
      toast.error('Selectează cel puțin un fișier');
      return;
    }

    setUploading(true);
    try {
      if (uploadMethod === 'file') {
        const formDataToSend = new FormData();
        Array.from(selectedFiles).forEach((file) => {
          formDataToSend.append('files', file);
        });
        formDataToSend.append('title', formData.title);
        formDataToSend.append('type', formData.type);
        formDataToSend.append('category', formData.category);
        formDataToSend.append('duration', formData.duration);
        if (formData.folder_id && formData.folder_id !== 'none') {
          formDataToSend.append('folder_id', formData.folder_id);
        }
        if (formData.brand && Array.isArray(formData.brand) && formData.brand.length > 0) {
          formDataToSend.append('brand', formData.brand.join(','));
        }

        // Generate video thumbnail on client side
        if (formData.type === 'video' && selectedFiles.length > 0) {
          try {
            const thumbBlob = await generateVideoThumbnail(selectedFiles[0]);
            if (thumbBlob) {
              formDataToSend.append('thumbnail', thumbBlob, 'thumbnail.jpg');
            }
          } catch (e) {
            console.warn('Could not generate video thumbnail:', e);
          }
        }

        // Increase timeout for large files
        await api.post('/content', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 300000, // 5 minutes for large video files
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log('Upload progress:', percentCompleted + '%');
          }
        });
      } else {
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
      }
      toast.success('Conținut adăugat!');
      setShowDialog(false);
      resetForm();
      loadContent();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Eroare la upload. Pentru fișiere >200MB, folosește "Link Extern"');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item) => {
    setItemToDelete(item);
    setUsageInfo({ screens: [], playlists: [] });
    setIsCheckingUsage(true);
    setShowDeleteConfirm(true);

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
  };

  const openUploadDialogWithFolder = (folder) => {
    setSelectedFiles([]);
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
        items: Array.from(selectedItems).map(id => ({
          content_id: id,
          duration: config.duration,
          transition: config.transition // Backend might need schema update for this if not in JSONB
        })),
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

  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return '';
    // Proxy Supabase Storage through CDN to reduce egress (only in production)
    const SUPABASE_CONTENT = 'https://isdzbwxjtfrykyoeevmy.supabase.co/storage/v1/object/public/content/';
    const SUPABASE_AUDIO = 'https://isdzbwxjtfrykyoeevmy.supabase.co/storage/v1/object/public/audio/';
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal) {
      if (fileUrl.startsWith(SUPABASE_CONTENT)) return '/supabase-media/' + fileUrl.substring(SUPABASE_CONTENT.length);
      if (fileUrl.startsWith(SUPABASE_AUDIO)) return '/supabase-audio/' + fileUrl.substring(SUPABASE_AUDIO.length);
    }
    // If it's a relative URL (starts with /api/uploads), prepend backend URL
    if (fileUrl.startsWith('/api/uploads')) {
      return `${process.env.REACT_APP_BACKEND_URL}${fileUrl}`;
    }
    // Otherwise it's an external URL (or direct Supabase on localhost)
    return fileUrl;
  };


  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="spinner"></div>
        </div>
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
    if (!window.confirm(`Sigur dorești să ștergi ${selectedItems.size} elemente?`)) return;

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

  const renderView = (items) => {
    if (items.length === 0) {
      return (
        <div className="glass-card p-12 text-center" data-testid="no-content">
          <FileImage className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Niciun fișier găsit aici.</p>
          <p className="text-sm text-slate-400 mt-1">Încarcă un fișier nou sau alege alt folder.</p>
        </div>
      );
    }

    if (viewMode === 'list') {
      return (
        <div className="overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-slate-100/50">
                  <th className="p-4 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === items.length && items.length > 0}
                      onChange={() => toggleSelectAll(items)}
                      className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Previzualizare</th>
                  <th
                    className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-red-600 transition-colors"
                    onClick={() => requestSort('title')}
                  >
                    <div className="flex items-center gap-1">
                      Titlu
                      {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Branduri</th>
                  <th
                    className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-red-600 transition-colors"
                    onClick={() => requestSort('type')}
                  >
                    <div className="flex items-center gap-1">
                      Tip
                      {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th
                    className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-red-600 transition-colors"
                    onClick={() => requestSort('file_size')}
                  >
                    <div className="flex items-center gap-1">
                      Dimensiune
                      {sortConfig.key === 'file_size' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Creat de</th>
                  <th
                    className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-red-600 transition-colors"
                    onClick={() => requestSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      Dată
                      {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={`group hover:bg-slate-50/50 transition-colors ${selectedItems.has(item.id) ? 'bg-red-50/30' : ''} cursor-move active:opacity-50 active:scale-[0.99] transform`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('contentId', item.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                      />
                    </td>
                    <td className="p-4 w-24">
                      <div
                        className="w-16 h-10 rounded-lg overflow-hidden bg-slate-100 cursor-pointer flex items-center justify-center border border-slate-200 shadow-sm transition-transform hover:scale-105"
                        onClick={() => handlePreview(item)}
                      >
                        {item.type === 'youtube' ? (
                          <div className="w-full h-full bg-red-600 flex items-center justify-center text-white font-bold text-[10px] shadow-inner">
                            <Film className="w-4 h-4 mr-0.5" /> YT
                          </div>
                        ) : item.type === 'web' ? (
                          <div className="w-full h-full bg-red-600 flex items-center justify-center text-white font-bold text-[10px] shadow-inner">
                            <LayoutGrid className="w-4 h-4 mr-0.5" /> WEB
                          </div>
                        ) : item.type === 'image' ? (
                          <img src={getFileUrl(item.file_url)} className="w-full h-full object-cover" alt="" />
                        ) : (videoAutoplay ? (
                          <video
                            key={`v-${item.id}-${videoAutoplay}`}
                            src={getFileUrl(item.file_url)}
                            className="w-full h-full object-cover"
                            muted
                            autoPlay
                            loop
                            playsInline
                            preload="metadata"
                          />
                        ) : item.thumbnail_url ? (
                          <div className="relative w-full h-full">
                            <img src={getFileUrl(item.thumbnail_url)} className="w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="bg-white/30 backdrop-blur-sm rounded-full p-0.5">
                                <Film className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <video
                            key={`v-${item.id}-${videoAutoplay}`}
                            src={getFileUrl(item.file_url)}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-semibold text-slate-800">{item.title}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 overflow-hidden">
                          {Array.isArray(item.brand) && item.brand.slice(0, 3).map((brandName, idx) => (
                            getBrandLogo(brandName) && (
                              <div
                                key={idx}
                                className="w-8 h-8 rounded border border-slate-100 bg-white overflow-hidden shrink-0 shadow-sm ring-2 ring-white"
                                title={brandName}
                              >
                                <img src={getBrandLogo(brandName)} className="w-full h-full object-contain" alt="" />
                              </div>
                            )
                          ))}
                          {Array.isArray(item.brand) && item.brand.length > 3 && (
                            <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 ring-2 ring-white">
                              +{item.brand.length - 3}
                            </div>
                          )}
                        </div>
                        {Array.isArray(item.brand) && item.brand.length > 0 ? (
                          <div className="text-[10px] text-red-500 font-bold uppercase truncate max-w-[120px]">
                            {item.brand.join(', ')}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">Fără brand</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {item.type === 'image' && <FileImage className="w-3.5 h-3.5 text-red-500" />}
                        {item.type === 'video' && <Film className="w-3.5 h-3.5 text-slate-500" />}
                        {item.type === 'youtube' && <Film className="w-3.5 h-3.5 text-red-600" />}
                        {item.type === 'web' && <LayoutGrid className="w-3.5 h-3.5 text-red-600" />}
                        <span className={`text-xs font-medium capitalize ${item.type === 'youtube' ? 'text-red-600' :
                          item.type === 'web' ? 'text-red-600' : 'text-slate-600'
                          }`}>
                          {item.type}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      {item.file_size ? `${(item.file_size / 1024 / 1024).toFixed(2)} MB` : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col text-xs">
                        <span className="text-slate-700 font-medium">{item.created_by_name || 'System'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('ro-RO') : '-'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100" onClick={() => handlePreview(item)}>
                          <Eye className="w-4 h-4 text-slate-500" />
                        </Button>
                        {isAdmin() && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-red-50"
                              onClick={() => {
                                setRenamingItem(item);
                                setNewTitle(item.title);
                                setEditBrands(Array.isArray(item.brand) ? item.brand : []);
                                setShowRenameDialog(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4 text-red-500" />
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
                  <tr key={`empty-${i}`} className="h-[65px] bg-white/40">
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
            className={`glass-card p-6 flex flex-col group transition-all duration-300 ${selectedItems.has(item.id) ? 'ring-2 ring-red-500 shadow-lg scale-[1.02]' : 'hover:shadow-md'}`}
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
                        className="w-6 h-6 rounded border border-slate-100 bg-white overflow-hidden shrink-0 shadow-sm ring-2 ring-white z-10"
                        title={brandName}
                      >
                        <img src={getBrandLogo(brandName)} className="w-full h-full object-contain p-0.5" alt="" />
                      </div>
                    ) : (
                      <span key={idx} className="text-[10px] font-black text-red-600 uppercase tracking-widest mr-2 underline decoration-2 decoration-red-200 underline-offset-4">
                        {brandName}
                      </span>
                    )
                  ))}
                  {Array.isArray(item.brand) && item.brand.length === 0 && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fără Brand</span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-800 leading-tight truncate pr-2" title={item.title}>
                  {item.title}
                </h3>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 shadow-sm cursor-pointer mt-1"
                  checked={selectedItems.has(item.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSelectItem(item.id);
                  }}
                />
              </div>
            </div>

            {/* Media Area - Aspect Video */}
            <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden mb-5 border border-slate-200 shadow-inner group-inner">
              {item.type === 'youtube' ? (
                <div className="w-full h-full bg-red-900 flex items-center justify-center">
                  <Film className="w-16 h-16 text-white/80" />
                  <div className="absolute inset-0 bg-transparent z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePreview(item); }}></div>
                  <div className="absolute top-3 right-3 z-20 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest shadow-sm">YOUTUBE</div>
                </div>
              ) : item.type === 'web' ? (
                <div className="w-full h-full bg-red-900 flex items-center justify-center">
                  <LayoutGrid className="w-16 h-16 text-white/80" />
                  <div className="absolute inset-0 bg-transparent z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePreview(item); }}></div>
                  <div className="absolute top-3 right-3 z-20 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest shadow-sm">WEB</div>
                </div>
              ) : item.type === 'image' ? (
                <>
                  <img
                    src={getFileUrl(item.file_url)}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePreview(item); }}></div>
                  <div className="absolute top-3 right-3 z-20 bg-slate-900/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-white/10">
                    {item.duration}s
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
                      <Film className="w-12 h-12 text-slate-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePreview(item); }}>
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 border border-white/30 group-hover:scale-110 transition-transform">
                      <Film className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 z-20 bg-red-600/90 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest shadow-sm">
                    VIDEO
                  </div>
                  <div className="absolute bottom-3 left-3 z-20 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-medium">
                    {item.duration}s
                  </div>
                </>
              )}
            </div>

            {/* Metadata Section */}
            <div className="flex-1 space-y-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  {item.type === 'video' || item.type === 'youtube' ? <Film className="w-4 h-4 text-slate-400" /> : <FileImage className="w-4 h-4 text-slate-400" />}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Tip</p>
                  <p className="text-sm font-bold text-slate-700 capitalize">{item.type}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Categorie</span>
                  <span className="text-xs font-bold text-red-600 capitalize">{item.category}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase bg-white px-2 py-0.5 rounded-md border border-slate-100">
                  {(item.file_size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-2 mt-auto">
              <button
                onClick={(e) => { e.stopPropagation(); handlePreview(item); }}
                className="flex-1 flex items-center justify-center gap-2 text-sm bg-red-600 text-white hover:bg-red-700 px-4 py-3 rounded-xl transition-all shadow-md hover:shadow-lg font-bold"
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
                    className="p-3 hover:bg-red-50 rounded-xl transition-all text-slate-400 hover:text-red-600 border border-transparent hover:border-red-100"
                    title="Editează"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                    className="p-3 hover:bg-rose-50 rounded-xl transition-all text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-100 group/del"
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
            <div className="mb-6 bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-4 animate-in slide-in-from-top-4">
              <span className="font-semibold text-lg">{selectedItems.size} selectate</span>
              <div className="h-6 w-px bg-white/30"></div>

              {/* Move to Folder Dropdown */}
              <Select onValueChange={(value) => handleBulkMoveToFolder(value === 'none' ? null : value)}>
                <SelectTrigger className="w-48 bg-white text-slate-900 border-none shadow-sm font-medium hover:bg-slate-50">
                  <SelectValue placeholder="Mută în folder..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">📁 Root (Niciun folder)</SelectItem>
                  {folders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4" style={{ color: folder.color }} />
                        {folder.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <button
                onClick={handleBulkDelete}
                className="ml-auto bg-white text-rose-600 hover:bg-slate-100 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
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

        <Tabs value={typeFilter} onValueChange={(val) => {
          setTypeFilter(val);
          setCurrentPage(1);
        }} className="space-y-6">
          {/* Header Row: Tabs (Left) + Actions (Right) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm mb-6">
            <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto grid grid-cols-3 sm:flex">
              <TabsTrigger value="all" className="rounded-lg px-4 py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 sm:flex-none">
                Toate ({brandFilteredContent.length})
              </TabsTrigger>
              <TabsTrigger value="images" className="rounded-lg px-4 py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 sm:flex-none">
                Imagini ({images.length})
              </TabsTrigger>
              <TabsTrigger value="videos" className="rounded-lg px-4 py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 sm:flex-none">
                Video ({videos.length})
              </TabsTrigger>
            </TabsList>

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
                      <div className={`w-8 h-8 flex items-center justify-center overflow-hidden transition-all rounded-md bg-white shadow-sm border ${selectedBrands.includes(brand.name) ? 'border-red-500' : 'border-slate-100'}`}>
                        {brand.logo_url ? (
                          <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain p-0.5" />
                        ) : (
                          <span className="text-[8px] font-bold text-slate-400">{brand.name?.substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      {selectedBrands.includes(brand.name) && (
                        <div className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-0.5 bg-red-600 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-white shadow-sm z-20 animate-in zoom-in duration-200">
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
                  className="ml-2 px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors uppercase tracking-wider"
                >
                  Resetează
                </button>
              )}
              {/* Video Autoplay Toggle */}
              <div className="flex items-center gap-2 ml-2">
                <Switch
                  checked={videoAutoplay}
                  onCheckedChange={setVideoAutoplay}
                  className="data-[state=checked]:bg-red-500"
                />
                <span className={`text-xs font-semibold ${videoAutoplay ? 'text-red-600' : 'text-slate-400'}`}>
                  Autoplay Video
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* View Mode Switcher */}
              <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="List View"
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Add Content Button & Dialog */}
              {isAdmin() && (
                <Dialog open={showDialog} onOpenChange={(open) => {
                  setShowDialog(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="btn-red px-6 py-2 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all h-[40px]">
                      <Plus className="w-4 h-4 mr-2" />
                      Adăugă conținut
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-panel">
                    <DialogHeader>
                      <DialogTitle>Adăugă conținut nou</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleFileUpload} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Folder Destinație</Label>
                        <Select
                          value={formData.folder_id || 'none'}
                          onValueChange={(val) => setFormData({ ...formData, folder_id: val })}
                        >
                          <SelectTrigger className="w-full bg-white border-slate-200">
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
                                    <Folder className="w-4 h-4" style={{ color: folder.color }} fill={folder.color} />
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
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-40 overflow-y-auto">
                          {brands.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Niciun brand creat încă.</p>
                          ) : (
                            brands.map(brand => (
                              <label
                                key={brand.id}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${formData.brand?.includes(brand.name)
                                  ? 'bg-red-50 border-red-200 text-red-700 shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                  }`}
                              >
                                <input
                                  type="checkbox"
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
                                  <div className="w-4 h-4 rounded-sm overflow-hidden shrink-0 border border-slate-100 bg-white">
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

                      <Tabs value={uploadMethod} onValueChange={setUploadMethod}>
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="file">Upload Fișier</TabsTrigger>
                          <TabsTrigger value="external">Link Extern</TabsTrigger>
                        </TabsList>
                        <TabsContent value="file" className="space-y-4 mt-4">
                          <div>
                            <Label className="text-base font-semibold">Selectează fișier(e)</Label>
                            <div className="mt-3 border-2 border-dashed border-red-300 rounded-xl p-6 bg-gradient-to-br from-red-50/50 to-red-50/30 hover:from-red-50 hover:to-red-50 transition-all">
                              <div className="flex flex-col items-center mb-4">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-3">
                                  <Upload className="w-8 h-8 text-red-600" />
                                </div>
                                <p className="text-sm font-semibold text-slate-700 mb-1">Click pentru a selecta fișiere</p>
                                <p className="text-xs text-slate-500">sau drag & drop aici</p>
                              </div>
                              <Label
                                htmlFor="file-upload-input"
                                className="inline-block px-6 py-3 bg-red-600 text-white font-bold rounded-lg cursor-pointer hover:bg-red-700 transition-colors shadow-md hover:shadow-lg mb-4"
                              >
                                Alege fișierele
                              </Label>
                              <Input
                                id="file-upload-input"
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                onChange={(e) => {
                                  const files = e.target.files;
                                  setSelectedFiles(files);
                                  if (files.length > 0) {
                                    const file = files[0];
                                    const type = file.type.startsWith('video') ? 'video' : 'image';
                                    setFormData({ ...formData, type, title: formData.title || file.name });
                                  }
                                }}
                                className="hidden"
                              />
                              {selectedFiles.length > 0 && (
                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                  <p className="text-sm text-green-700 font-semibold flex items-center gap-2">
                                    <span className="text-green-600">✓</span> {selectedFiles.length} fișier(e) selectat(e)
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="external" className="space-y-4 mt-4">
                          <div>
                            <Label>Tip Conținut Extern</Label>
                            <Select
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
                              value={formData.file_url}
                              onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                              placeholder={formData.type === 'youtube' ? "https://youtube.com/watch?v=..." : "https://..."}
                            />
                          </div>
                        </TabsContent>
                      </Tabs>

                      <div className="flex gap-3 pt-4">
                        <Button type="submit" disabled={uploading} className="btn-primary flex-1">
                          {uploading ? 'Se încarcă...' : 'Adăugă'}
                        </Button>
                        <Button type="button" onClick={() => setShowDialog(false)} className="btn-secondary">
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
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col h-full">
                {/* Header */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100/80 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center shadow-sm">
                      <FileImage className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 tracking-tight">Bibliotecă Conținut</h3>
                  </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                  <TabsContent value="all" className="mt-0">
                    {renderView(currentItems)}
                  </TabsContent>
                  <TabsContent value="images" className="mt-0">
                    {renderView(currentItems)}
                  </TabsContent>
                  <TabsContent value="videos" className="mt-0">
                    {renderView(currentItems)}
                  </TabsContent>
                </div>

                {/* Pagination Footer */}
                <div className="px-4 py-3 border-t border-slate-200/60 flex items-center justify-between bg-gradient-to-r from-slate-50/80 to-white shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium">Afișează:</span>
                      <select
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all cursor-pointer font-medium text-slate-600 shadow-sm"
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
                      <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-sm min-w-[2.5rem] text-center">
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
                      className="h-8 px-3 text-xs font-semibold rounded-lg border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-40"
                    >
                      ← Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className="h-8 px-3 text-xs font-semibold rounded-lg border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-40"
                    >
                      Următor →
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Tabs>

        {/* Preview Modal */}
        < Dialog open={showPreview} onOpenChange={setShowPreview} >
          <DialogContent className="glass-panel max-w-5xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>{previewItem?.title}</DialogTitle>
            </DialogHeader>
            {previewItem && (
              <div className="space-y-4">
                <div className="bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center relative" style={{ minHeight: '400px', maxHeight: '600px' }}>
                  {previewItem.type === 'youtube' ? (
                    <div className="w-full aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${(previewItem.file_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/) || [])[1]}`}
                        className="w-full h-full border-0"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                      />
                    </div>
                  ) : previewItem.type === 'web' ? (
                    <iframe
                      src={previewItem.file_url}
                      className="w-full h-[500px] border-0 bg-white"
                    />
                  ) : previewItem.type === 'image' ? (
                    <img
                      src={getFileUrl(previewItem.file_url)}
                      alt={previewItem.title}
                      className="max-w-full max-h-full object-contain"
                      data-testid="preview-image"
                    />
                  ) : (
                    <video
                      src={getFileUrl(previewItem.file_url)}
                      controls
                      autoPlay
                      className="max-w-full max-h-full"
                      data-testid="preview-video"
                    >
                      Browser-ul tău nu suportă redarea video.
                    </video>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-white/40 rounded-xl">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Tip</p>
                    <p className="text-sm font-medium text-slate-800 capitalize">{previewItem.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Categorie</p>
                    <p className="text-sm font-medium text-slate-800 capitalize">{previewItem.category}</p>
                  </div>
                  {previewItem.type === 'image' && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Durată afișare</p>
                      <p className="text-sm font-medium text-slate-800">{previewItem.duration} secunde</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-500 mb-1">URL fișier</p>
                    <a
                      href={getFileUrl(previewItem.file_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-red-600 hover:text-red-700 truncate block"
                    >
                      Deschide în tab nou →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog >

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
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                  {brands.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Niciun brand creat încă.</p>
                  ) : (
                    brands.map(brand => (
                      <label
                        key={brand.id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${editBrands.includes(brand.name)
                          ? 'bg-red-50 border-red-200 text-red-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
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
                          <div className="w-4 h-4 rounded-sm overflow-hidden shrink-0 border border-slate-100 bg-white">
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
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-semibold flex-1 shadow-md">
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
              <p className="text-slate-600">
                Sigur dorești să ștergi fișierul <span className="font-semibold text-slate-900">"{itemToDelete?.title}"</span>?
              </p>

              {isCheckingUsage ? (
                <div className="flex items-center gap-2 text-slate-400 italic py-2">
                  <div className="h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                  Se verifică utilizarea...
                </div>
              ) : (
                (usageInfo.screens.length > 0 || usageInfo.playlists.length > 0) && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-2 text-rose-800 font-medium text-sm">
                      <span className="mt-0.5">⚠️</span>
                      Acest fișier este folosit în următoarele locuri:
                    </div>
                    <div className="space-y-2 text-sm text-rose-700">
                      {usageInfo.screens.length > 0 && (
                        <div>
                          <span className="font-semibold">Ecrane:</span> {usageInfo.screens.map(s => s.name).join(', ')}
                        </div>
                      )}
                      {usageInfo.playlists.length > 0 && (
                        <div>
                          <span className="font-semibold">Playlist-uri:</span> {usageInfo.playlists.map(p => p.name).join(', ')}
                        </div>
                      )}
                      <p className="text-xs font-semibold mt-2 text-rose-900 italic">
                        * Notă: Fișierul va fi eliminat automat din playlist-uri după ștergere.
                      </p>
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
                disabled={isCheckingUsage || isDeleting}
                className="bg-rose-600 hover:bg-rose-700"
              >
                {isDeleting ? 'Se șterge...' : 'Șterge Fișierul'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div >
    </DashboardLayout >
  );
};
