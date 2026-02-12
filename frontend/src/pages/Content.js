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

  const handleDelete = async (id) => {
    if (!window.confirm('Sigur dorești să ștergi acest conținut?')) return;
    try {
      await api.delete(`/content/${id}`);
      toast.success('Conținut șters!');
      loadContent();
    } catch (error) {
      toast.error('Eroare la ștergere');
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
      setSelectedItems(new Set()); // Clear selection
    } catch (error) {
      console.error('Slideshow creation failed:', error);
      toast.error('Eroare la crearea slideshow-ului');
    } finally {
      setPendingSlideshowScreen(null);
    }
  };

  const getFileUrl = (fileUrl) => {
    // If it's a relative URL (starts with /api/uploads), prepend backend URL
    if (fileUrl.startsWith('/api/uploads')) {
      return `${process.env.REACT_APP_BACKEND_URL}${fileUrl}`;
    }
    // Otherwise it's an external URL
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
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="p-4 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === items.length && items.length > 0}
                      onChange={() => toggleSelectAll(items)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Previzualizare</th>
                  <th
                    className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                    onClick={() => requestSort('title')}
                  >
                    <div className="flex items-center gap-1">
                      Titlu
                      {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Branduri</th>
                  <th
                    className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                    onClick={() => requestSort('type')}
                  >
                    <div className="flex items-center gap-1">
                      Tip
                      {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th
                    className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
                    onClick={() => requestSort('file_size')}
                  >
                    <div className="flex items-center gap-1">
                      Dimensiune
                      {sortConfig.key === 'file_size' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Creat de</th>
                  <th
                    className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors"
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
                    className={`group hover:bg-slate-50/50 transition-colors ${selectedItems.has(item.id) ? 'bg-indigo-50/30' : ''} cursor-move active:opacity-50 active:scale-[0.99] transform`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('contentId', item.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                      />
                    </td>
                    <td className="p-4 w-24">
                      <div
                        className="w-16 h-10 rounded-lg overflow-hidden bg-slate-100 cursor-pointer flex items-center justify-center border border-slate-200 shadow-sm"
                        onClick={() => handlePreview(item)}
                      >
                        {item.type === 'youtube' ? (
                          <div className="w-full h-full bg-red-600 flex items-center justify-center text-white font-bold text-[10px] shadow-inner">
                            <Film className="w-4 h-4 mr-0.5" /> YT
                          </div>
                        ) : item.type === 'web' ? (
                          <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-bold text-[10px] shadow-inner">
                            <LayoutGrid className="w-4 h-4 mr-0.5" /> WEB
                          </div>
                        ) : item.type === 'image' ? (
                          <img src={getFileUrl(item.file_url)} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="relative w-full h-full bg-slate-900 flex items-center justify-center text-white">
                            <Film className="w-4 h-4" />
                          </div>
                        )}
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
                          <div className="text-[10px] text-indigo-500 font-bold uppercase truncate max-w-[120px]">
                            {item.brand.join(', ')}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">Fără brand</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {item.type === 'image' && <FileImage className="w-3.5 h-3.5 text-indigo-500" />}
                        {item.type === 'video' && <Film className="w-3.5 h-3.5 text-slate-500" />}
                        {item.type === 'youtube' && <Film className="w-3.5 h-3.5 text-red-600" />}
                        {item.type === 'web' && <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />}
                        <span className={`text-xs font-medium capitalize ${item.type === 'youtube' ? 'text-red-600' :
                          item.type === 'web' ? 'text-indigo-600' : 'text-slate-600'
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
                              className="h-8 w-8 hover:bg-indigo-50"
                              onClick={() => {
                                setRenamingItem(item);
                                setNewTitle(item.title);
                                setShowRenameDialog(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4 text-indigo-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-rose-50 group/d" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="w-4 h-4 text-slate-400 group-hover/d:text-rose-500" />
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

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Afișează:</span>
                <select
                  className="text-xs border rounded-md px-1 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
              <span className="text-xs text-slate-500">
                Pagina {currentPage} din {totalPages}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="h-8 px-2 text-xs"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="h-8 px-2 text-xs"
              >
                Următor
              </Button>
            </div>
          </div>
        </div >
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="glass-card p-4 group"
            data-testid={`content-card-${item.id}`}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('contentId', item.id);
            }}
          >
            <div
              className="relative mb-3 cursor-pointer"
              onClick={() => handlePreview(item)}
              data-testid={`preview-content-${item.id}`}
            >
              {item.type === 'youtube' ? (
                <div className="w-full h-40 bg-red-900 rounded-xl flex items-center justify-center">
                  <Film className="w-12 h-12 text-white" />
                  <div className="absolute bottom-2 right-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">YOUTUBE</div>
                </div>
              ) : item.type === 'web' ? (
                <div className="w-full h-40 bg-blue-900 rounded-xl flex items-center justify-center">
                  <LayoutGrid className="w-12 h-12 text-white" />
                  <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">WEB</div>
                </div>
              ) : item.type === 'image' ? (
                <div className="relative group">
                  <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shadow-sm cursor-pointer"
                      checked={selectedItems.has(item.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelectItem(item.id);
                      }}
                    />
                  </div>
                  <img
                    src={getFileUrl(item.file_url)}
                    alt={item.title}
                    className={`w-full h-40 object-cover rounded-xl ${selectedItems.has(item.id) ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                  />
                </div>
              ) : (
                <>
                  <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shadow-sm cursor-pointer"
                      checked={selectedItems.has(item.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelectItem(item.id);
                      }}
                    />
                  </div>
                  <div
                    className={`aspect-video bg-slate-100 relative group overflow-hidden ${selectedItems.has(item.id) ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                    onClick={() => {
                      // Optional: Allow selection on card click if needed, or keep preview
                      // For now keep preview on main click, checkbox for selection
                    }}
                  >
                    <video
                      src={getFileUrl(item.file_url)}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-4">
                        <Film className="w-8 h-8 text-slate-800" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      VIDEO
                    </div>
                  </div>
                </>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-white/90 text-slate-800 px-3 py-2 rounded-lg text-sm font-medium">
                  👁️ Preview
                </div>
              </div>
              {isAdmin() && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingItem(item);
                      setNewTitle(item.title);
                      setEditBrands(Array.isArray(item.brand) ? item.brand : []);
                      setShowRenameDialog(true);
                    }}
                    className="p-2 bg-indigo-500 text-white rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="p-2 bg-rose-500 text-white rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <h3 className="text-sm font-medium text-slate-800 mb-1 truncate flex items-center gap-2">
              <div className="flex -space-x-1 overflow-hidden">
                {Array.isArray(item.brand) && item.brand.slice(0, 2).map((brandName, idx) => (
                  getBrandLogo(brandName) && (
                    <div
                      key={idx}
                      className="w-5 h-5 rounded border border-slate-100 bg-white overflow-hidden shrink-0 shadow-sm ring-2 ring-white"
                      title={brandName}
                    >
                      <img src={getBrandLogo(brandName)} className="w-full h-full object-contain" alt="" />
                    </div>
                  )
                ))}
                {Array.isArray(item.brand) && item.brand.length > 2 && (
                  <div className="w-5 h-5 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500 ring-2 ring-white">
                    +{item.brand.length - 2}
                  </div>
                )}
              </div>
              {item.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 bg-slate-100/50 px-2 py-1 rounded-full">
                {item.category}
              </span>
              {item.type === 'image' && (
                <span className="text-xs text-slate-500">
                  {item.duration}s
                </span>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Bibliotecă Conținut</h1>
            <p className="text-slate-500">Gestionează imagini și video-uri</p>
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

            <div className="flex items-center gap-3 overflow-x-auto pb-1 max-w-4xl scrollbar-hide mr-auto ml-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Filtrează:</span>
              <div className="flex gap-2">
                {brands.map(brand => (
                  <button
                    key={brand.id}
                    onClick={() => toggleBrandFilter(brand.name)}
                    className={`relative group transition-all duration-200 ${selectedBrands.includes(brand.name) ? 'scale-110 opacity-100' : 'opacity-50 hover:opacity-100 hover:scale-105'}`}
                    title={brand.name}
                  >
                    <div className={`w-9 h-9 flex items-center justify-center overflow-hidden transition-all rounded-md ${selectedBrands.includes(brand.name) ? '' : 'opacity-80'}`}>
                      {brand.logo_url ? (
                        <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[8px] font-bold text-slate-400">{brand.name?.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    {selectedBrands.includes(brand.name) && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full flex items-center justify-center text-white border-2 border-slate-50 shadow-sm z-10 animate-in zoom-in duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-2 h-2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {selectedBrands.length > 0 && (
                <button
                  onClick={() => setSelectedBrands([])}
                  className="ml-2 px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors uppercase tracking-wider"
                >
                  Resetează
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* View Mode Switcher */}
              <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
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
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
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
                            <div className="mt-3 border-2 border-dashed border-indigo-300 rounded-xl p-6 bg-gradient-to-br from-indigo-50/50 to-blue-50/30 hover:from-indigo-50 hover:to-blue-50 transition-all">
                              <div className="flex flex-col items-center mb-4">
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                                  <Upload className="w-8 h-8 text-indigo-600" />
                                </div>
                                <p className="text-sm font-semibold text-slate-700 mb-1">Click pentru a selecta fișiere</p>
                                <p className="text-xs text-slate-500">sau drag & drop aici</p>
                              </div>
                              <Input
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
                                className="cursor-pointer"
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
          <div className="flex flex-col lg:flex-row gap-6 items-start min-h-[600px]">
            {/* Sidebar Column (Left) */}
            <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-24">
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
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col">
                <div className="p-6 flex-1">
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
                      className="text-sm text-indigo-600 hover:text-indigo-700 truncate block"
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
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
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
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex-1 shadow-md">
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
      </div >
    </DashboardLayout >
  );
};
