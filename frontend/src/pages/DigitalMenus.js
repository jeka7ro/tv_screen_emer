import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Menu, Plus, Edit, Trash2 } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useViewMode } from '../hooks/useViewMode';
import { ViewToggle } from '../components/ViewToggle';

export const DigitalMenus = () => {
  const [menus, setMenus] = useState([]);
  const [products, setProducts] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    products_per_page: 6,
    page_duration: 10,
    auto_rotate: true,
    background_image_url: '',
    status: 'active'
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [viewMode, setViewMode] = useViewMode('view_mode_menus', 'grid');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [menusRes, productsRes, contentRes] = await Promise.all([
        api.get('/digital-menus'),
        api.get('/products'),
        api.get('/content')
      ]);
      setMenus(menusRes.data);
      setProducts(productsRes.data);
      setContent(contentRes.data);
    } catch (error) {
      toast.error('Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        selected_products: selectedProducts,
        products_per_page: parseInt(formData.products_per_page),
        page_duration: parseInt(formData.page_duration)
      };
      if (editingMenu) {
        await api.put(`/digital-menus/${editingMenu.id}`, submitData);
        toast.success('Meniu actualizat!');
      } else {
        await api.post('/digital-menus', submitData);
        toast.success('Meniu creat!');
      }
      setShowDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Eroare la salvare');
    }
  };

  const handleEdit = (menu) => {
    setEditingMenu(menu);
    setFormData({
      name: menu.name,
      products_per_page: menu.products_per_page,
      page_duration: menu.page_duration,
      auto_rotate: menu.auto_rotate,
      background_image_url: menu.background_image_url || '',
      status: menu.status
    });
    setSelectedProducts(menu.selected_products || []);
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sigur dorești să ștergi acest meniu?')) return;
    try {
      await api.delete(`/digital-menus/${id}`);
      toast.success('Meniu șters!');
      loadData();
    } catch (error) {
      toast.error('Eroare la ștergere');
    }
  };

  const toggleProduct = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      products_per_page: 6,
      page_duration: 10,
      auto_rotate: true,
      background_image_url: '',
      status: 'active'
    });
    setSelectedProducts([]);
    setEditingMenu(null);
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

  return (
    <DashboardLayout>
      <div className="animate-in" data-testid="digital-menus-page">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Meniuri Digitale</h1>
            <p className="text-slate-500">Creează meniuri cu produse pentru afișare</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={showDialog} onOpenChange={(open) => {
              setShowDialog(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="btn-primary" data-testid="add-menu-button">
                  <Plus className="w-5 h-5 mr-2" />
                  Creează meniu
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-panel max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingMenu ? 'Editează meniul' : 'Creează meniu nou'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Nume meniu</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Meniu Principal"
                      required
                      data-testid="menu-name-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Produse pe pagină</Label>
                      <Select
                        value={formData.products_per_page?.toString()}
                        onValueChange={(value) => setFormData({ ...formData, products_per_page: parseInt(value) })}
                      >
                        <SelectTrigger data-testid="menu-products-per-page">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 produs</SelectItem>
                          <SelectItem value="2">2 produse</SelectItem>
                          <SelectItem value="3">3 produse</SelectItem>
                          <SelectItem value="4">4 produse</SelectItem>
                          <SelectItem value="5">5 produse</SelectItem>
                          <SelectItem value="6">6 produse</SelectItem>
                          <SelectItem value="7">7 produse</SelectItem>
                          <SelectItem value="8">8 produse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Durată pagină (sec)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.page_duration}
                        onChange={(e) => setFormData({ ...formData, page_duration: e.target.value })}
                        data-testid="menu-page-duration"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Imagine de fundal (opțional)</Label>
                    <Select
                      value={formData.background_image_url}
                      onValueChange={(value) => setFormData({ ...formData, background_image_url: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează imagine" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Fără fundal</SelectItem>
                        {content.filter(c => c.type === 'image').map(img => (
                          <SelectItem key={img.id} value={img.file_url}>
                            {img.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.auto_rotate}
                        onChange={(e) => setFormData({ ...formData, auto_rotate: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-700">Rotație automată</span>
                    </label>
                  </div>
                  <div>
                    <Label>Selectează produse ({selectedProducts.length} selectate)</Label>
                    <div className="mt-2 max-h-64 overflow-y-auto space-y-2 border border-white/60 rounded-xl p-4 bg-white/20">
                      {products.map(product => (
                        <label
                          key={product.id}
                          className="flex items-center gap-3 p-3 bg-white/40 rounded-lg hover:bg-white/60 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => toggleProduct(product.id)}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800">{product.name}</p>
                            <p className="text-xs text-slate-500">{product.price} {product.currency}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="btn-primary flex-1" data-testid="save-menu-button">
                      {editingMenu ? 'Actualizează' : 'Creează'}
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

            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>

        {menus.length === 0 ? (
          <div className="glass-card p-12 text-center" data-testid="no-menus">
            <Menu className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Niciun meniu
            </h3>
            <p className="text-slate-500 mb-6">
              Creează primul meniu digital
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Nume Meniu</th>
                    <th className="px-6 py-4">Configurație</th>
                    <th className="px-6 py-4">Produse</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {menus.map((menu) => (
                    <tr key={menu.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <Menu className="w-4 h-4 text-purple-600" />
                          </div>
                          {menu.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-xs">
                          <div>
                            <span className="font-medium">{menu.products_per_page}</span> prod/pag
                          </div>
                          <div>
                            <span className="font-medium">{menu.page_duration}s</span> durată
                          </div>
                          {menu.auto_rotate && (
                            <span className="text-xs text-slate-500 bg-slate-100/50 px-1.5 py-0.5 rounded-full inline-block mt-1">
                              Auto-rotație
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-medium">
                          {menu.selected_products?.length || 0} selectate
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={menu.status === 'active' ? 'status-active' : 'status-offline'}>
                            {menu.status === 'active' ? 'Activ' : 'Draft'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(menu)}
                            className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all text-slate-500 hover:text-indigo-600 shadow-sm hover:shadow"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(menu.id)}
                            className="p-2 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all text-slate-500 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menus.map((menu) => (
              <div key={menu.id} className="glass-card p-6" data-testid={`menu-card-${menu.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-purple-100 p-3 rounded-2xl">
                    <Menu className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(menu)}
                      className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                      data-testid={`edit-menu-${menu.id}`}
                    >
                      <Edit className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(menu.id)}
                      className="p-2 hover:bg-rose-100/50 rounded-lg transition-colors"
                      data-testid={`delete-menu-${menu.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {menu.name}
                </h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>{menu.selected_products?.length || 0} produse selectate</p>
                  <p>{menu.products_per_page} produse/pagină</p>
                  <p>{menu.page_duration}s durată/pagină</p>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <span className={menu.status === 'active' ? 'status-active' : 'status-offline'}>
                    {menu.status === 'active' ? 'Activ' : 'Draft'}
                  </span>
                  {menu.auto_rotate && (
                    <span className="text-xs text-slate-500 bg-slate-100/50 px-2 py-1 rounded-full">
                      Auto-rotație
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout >
  );
};
