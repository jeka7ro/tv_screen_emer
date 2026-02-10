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

  const images = filteredContent.filter(c => c.type === 'image');
  const videos = filteredContent.filter(c => c.type === 'video');

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

  const renderView = (items) => {
    if (items.length === 0) {
      return (
        <div className="glass-card p-12 text-center" data-testid="no-content">
          <FileImage className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            Niciun conținut
          </h3>
          <p className="text-slate-500 mb-6">
            Începe prin a adăuga imagini sau video-uri
          </p>
        </div>
      );
    }

    if (viewMode === 'list') {
      return (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={items.length > 0 && selectedItems.size === items.length}
                    onChange={() => toggleSelectAll(items)}
                  />
                </th>
                <th className="p-4 font-medium text-slate-500 text-xs uppercase">Preview</th>
                <th className="p-4 font-medium text-slate-500 text-xs uppercase">Titlu</th>
                <th className="p-4 font-medium text-slate-500 text-xs uppercase">Tip</th>
                <th className="p-4 font-medium text-slate-500 text-xs uppercase">Categorie</th>
                <th className="p-4 font-medium text-slate-500 text-xs uppercase">Durată</th>
                <th className="p-4 font-medium text-slate-500 text-xs uppercase text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className={`group hover:bg-slate-50/50 transition-colors ${selectedItems.has(item.id) ? 'bg-indigo-50/30' : ''}`}>
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
                      className="w-16 h-10 rounded-lg overflow-hidden bg-slate-100 cursor-pointer"
                      onClick={() => handlePreview(item)}
                    >
                      {item.type === 'youtube' ? (
                        <div className="w-full h-full bg-red-600 flex items-center justify-center text-white font-bold text-[8px]">YT</div>
                      ) : item.type === 'web' ? (
                        <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-[8px]">WEB</div>
                      ) : item.type === 'image' ? (
                        <img src={getFileUrl(item.file_url)} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <video src={getFileUrl(item.file_url)} className="w-full h-full object-cover" />
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-slate-800">{item.title}</td>
                  <td className="p-4 capitalize text-slate-600">{item.type}</td>
                  <td className="p-4 capitalize text-slate-600">{item.category}</td>
                  <td className="p-4 text-slate-600">{item.type === 'image' ? `${item.duration}s` : '-'}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button className="btn-ghost p-2 h-auto" onClick={() => handlePreview(item)}>
                        <Eye className="w-4 h-4 text-slate-500" />
                      </Button>
                      {isAdmin() && (
                        <Button className="btn-ghost p-2 h-auto" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((item) => (
          <div key={item.id} className="glass-card p-4 group" data-testid={`content-card-${item.id}`}>
            <div
              className="relative mb-3 cursor-pointer"
              onClick={() => handlePreview(item)}
              data-testid={`preview-content-${item.id}`}
            >
              {item.type === 'youtube' ? (
                <div className="w-full h-40 bg-red-900 rounded-xl flex items-center justify-center">
                  <Film className="w-12 h-12 text-white/50" />
                  <div className="absolute bottom-2 right-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">YOUTUBE</div>
                </div>
              ) : item.type === 'web' ? (
                <div className="w-full h-40 bg-blue-900 rounded-xl flex items-center justify-center">
                  <LayoutGrid className="w-12 h-12 text-white/50" />
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
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-4 animate-in slide-in-from-bottom-4">
              <span className="font-medium">{selectedItems.size} selectate</span>
              <div className="h-4 w-px bg-slate-700"></div>
              <button
                onClick={handleBulkDelete}
                className="text-white hover:text-red-400 font-medium flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Șterge
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="text-slate-400 hover:text-white ml-2 text-sm"
              >
                Anulează
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <div className="bg-white/50 p-1 rounded-lg flex border border-slate-200/50 mr-4">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                title="List View"
              >
                <ListIcon className="w-5 h-5" />
              </button>
            </div>
            {isAdmin() && (
              <Dialog open={showDialog} onOpenChange={(open) => {
                setShowDialog(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="btn-primary px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all" data-testid="add-content-button">
                    <Plus className="w-6 h-6 mr-2" />
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

                    <div>
                      <Label>Titlu</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Nume conținut"
                        required
                        data-testid="content-title-input"
                      />
                    </div>
                    <div>
                      <Label>Categorie</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="menu">Meniu</SelectItem>
                          <SelectItem value="promo">Promo</SelectItem>
                          <SelectItem value="drinks">Băuturi</SelectItem>
                          <SelectItem value="desserts">Deserturi</SelectItem>
                          <SelectItem value="other">Altele</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.type === 'image' && (
                      <div>
                        <Label>Durată afișare (secunde)</Label>
                        <Input
                          type="number"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                          min="1"
                          data-testid="content-duration-input"
                        />
                      </div>
                    )}
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

                {/* Main Content with Folder Sidebar */}

      {/* Main Content with Folder Sidebar */}
            <div className="flex gap-6">
              <FolderSidebar
                folders={folders}
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
                content={content}
                isAdmin={isAdmin}
                openFolderDialog={openFolderDialog}
                handleDeleteFolder={handleDeleteFolder}
              />
              <div className="flex-1">
                <Tabs defaultValue="all" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="all">Toate ({content.length})</TabsTrigger>
                    <TabsTrigger value="images">Imagini ({images.length})</TabsTrigger>
                    <TabsTrigger value="videos">Video-uri ({videos.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all">
                    {renderView(content)}
                  </TabsContent>

                  <TabsContent value="images">
                    {renderView(images)}
                  </TabsContent>

                  <TabsContent value="videos">
                    {renderView(videos)}
                  </TabsContent>
                </Tabs>
              </div>
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
        </div> {/* Close flex-1 */}
                    </div> {/* Close flex gap-6 */}

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
