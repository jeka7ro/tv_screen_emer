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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

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
    folder_id: null
  });
  const [folderFormData, setFolderFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1'
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewItem, setPreviewItem] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('contentItemsPerPage');
    if (saved === 'all') return 'all';
    return saved ? parseInt(saved) : 10; // Default to 10
  });
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadContent();
    loadFolders();
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
        color: folder.color
      });
    } else {
      resetFolderForm();
    }
    setShowFolderDialog(true);
  };

  const resetFolderForm = () => {
    setFolderFormData({ name: '', description: '', color: '#6366f1' });
    setEditingFolder(null);
  };

  // Filter content by selected folder
  const filteredContent = selectedFolder
    ? content.filter(item => item.folder_id === selectedFolder.id)
    : content;

  // Filter by type
  const typeFilteredContent = typeFilter === 'all'
    ? filteredContent
    : filteredContent.filter(item => {
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

  const images = filteredContent.filter(c => c.type === 'image');
  const videos = filteredContent.filter(c => c.type === 'video');

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
          duration: parseInt(formData.duration)
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
      file_url: ''
    });
    setSelectedFiles([]);
  };

  const handlePreview = (item) => {
    setPreviewItem(item);
    setShowPreview(true);
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
                          <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                            <video src={getFileUrl(item.file_url)} className="w-full h-full object-cover opacity-60" />
                            <Film className="absolute w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">{item.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">{item.id.substring(0, 8)}</span>
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
                    <td className="p-4 text-slate-600 text-sm">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100" onClick={() => handlePreview(item)}>
                          <Eye className="w-4 h-4 text-slate-500" />
                        </Button>
                        {isAdmin() && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-rose-50 group/d" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="w-4 h-4 text-slate-400 group-hover/d:text-rose-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Padding Empty Rows */}
                {Array.from({ length: Math.max(0, 10 - items.length) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-[65px] bg-white/40">
                    <td colSpan={7} className="p-4"></td>
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
        </div>
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
                <img
                  src={getFileUrl(item.file_url)}
                  alt={item.title}
                  className="w-full h-40 object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-40 bg-slate-900 rounded-xl overflow-hidden relative group">
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
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-white/90 text-slate-800 px-3 py-2 rounded-lg text-sm font-medium">
                  👁️ Preview
                </div>
              </div>
              {isAdmin() && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  data-testid={`delete-content-${item.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <h3 className="text-sm font-medium text-slate-800 mb-1 truncate">
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
            <div className="mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-4 animate-in slide-in-from-top-4">
              <span className="font-semibold text-lg">{selectedItems.size} selectate</span>
              <div className="h-6 w-px bg-white/30"></div>

              {/* Move to Folder Dropdown */}
              <Select onValueChange={(value) => handleBulkMoveToFolder(value === 'none' ? null : value)}>
                <SelectTrigger className="w-48 bg-white/20 border-white/30 text-white hover:bg-white/30">
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
                className="ml-auto bg-white/20 hover:bg-red-500 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Șterge
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="text-white/80 hover:text-white text-sm"
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
        />

        <Tabs value={typeFilter} onValueChange={(val) => {
          setTypeFilter(val);
          setCurrentPage(1);
        }} className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <TabsList className="bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="all" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Toate ({filteredContent.length})</TabsTrigger>
              <TabsTrigger value="images" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Imagini ({images.length})</TabsTrigger>
              <TabsTrigger value="videos" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Video-uri ({videos.length})</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="bg-white p-1 rounded-lg flex border border-slate-200 shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title="List View"
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>

              {isAdmin() && (
                <Dialog open={showDialog} onOpenChange={(open) => {
                  setShowDialog(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="btn-red px-6 py-2.5 rounded-full text-base font-semibold shadow-lg hover:shadow-xl transition-all h-auto" data-testid="add-content-button">
                      <Plus className="w-5 h-5 mr-2" />
                      Adăugă conținut
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-panel">
                    <DialogHeader>
                      <DialogTitle>Adăugă conținut nou</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleFileUpload} className="space-y-4">
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
                                    setFormData({ ...formData, type, title: formData.title || file.name }); // Set title from first file if empty
                                  }
                                }}
                                data-testid="content-file-input"
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
                            <p className="text-xs text-slate-500 mt-2">
                              Poți selecta mai multe fișiere. Max 200MB/fișier.
                            </p>
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
                              data-testid="content-url-input"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                              {formData.type === 'youtube'
                                ? "Pastează link-ul YouTube (normal sau embed)."
                                : "Direct link către fișier (Dropbox, Drive cu 'direct download link')."}
                            </p>
                          </div>
                        </TabsContent>
                      </Tabs>

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="submit"
                          disabled={uploading}
                          className="btn-primary flex-1"
                          data-testid="save-content-button"
                        >
                          {uploading ? (
                            <div className="flex items-center gap-2">
                              <div className="spinner w-4 h-4"></div>
                              Se încarcă...
                            </div>
                          ) : (
                            'Adăugă'
                          )}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setShowDialog(false)}
                          className="btn-secondary"
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

          {/* Main Content with Folder Sidebar */}
          <div className="flex flex-col lg:flex-row gap-6 items-start min-h-[600px]">
            <div className="w-full lg:w-96 shrink-0 lg:sticky lg:top-24">
              <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col p-1">
                <FolderSidebar
                  folders={folders}
                  selectedFolder={selectedFolder}
                  setSelectedFolder={setSelectedFolder}
                  content={content}
                  isAdmin={isAdmin}
                  openFolderDialog={openFolderDialog}
                  handleDeleteFolder={handleDeleteFolder}
                  onRefresh={() => {
                    loadFolders();
                    loadContent();
                  }}
                />
              </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <TabsContent value="all">
                  {renderView(currentItems)}
                </TabsContent>

                <TabsContent value="images">
                  {renderView(currentItems)}
                </TabsContent>

                <TabsContent value="videos">
                  {renderView(currentItems)}
                </TabsContent>
              </div>
            </div>
          </div>
        </Tabs>

        {/* Preview Modal */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
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
        </Dialog>
      </div >
    </DashboardLayout >
  );
};
