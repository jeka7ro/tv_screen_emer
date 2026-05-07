import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Plus, Edit, Trash2, ShoppingBag, MapPin, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useViewMode } from '../hooks/useViewMode';
import { ViewToggle } from '../components/ViewToggle';
import { useConfirm } from '../hooks/useConfirm';

const categories = [
  { value: 'sushi', label: 'Sushi' },
  { value: 'rolls', label: 'Rolls' },
  { value: 'sashimi', label: 'Sashimi' },
  { value: 'tempura', label: 'Tempura' },
  { value: 'soup', label: 'Supă' },
  { value: 'salad', label: 'Salată' },
  { value: 'dessert', label: 'Desert' },
  { value: 'drinks', label: 'Băuturi' },
  { value: 'other', label: 'Altele' }
];

export const Products = () => {
  const { confirm, ConfirmDialog } = useConfirm();
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showDialog, setShowDialog] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewMode, setViewMode] = useViewMode('view_mode_products', 'grid');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'RON',
    category: 'other',
    image_url: '',
    available: true,
    featured: false
  });

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (selectedLocationId) {
      loadProducts(selectedLocationId);
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [selectedLocationId]);

  const loadLocations = async () => {
    try {
      const response = await api.get('/locations');
      setLocations(response.data);
      if (response.data.length > 0) {
        setSelectedLocationId(response.data[0].id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      toast.error('Eroare la încărcarea locațiilor');
      setLoading(false);
    }
  };

  const loadProducts = async (locationId) => {
    setLoading(true);
    try {
      const response = await api.get(`/products?location_id=${locationId}`);
      // Filter out products that don't match the location, just in case backend doesn't filter yet
      const filtered = response.data.filter(p => p.location_id === locationId);
      setProducts(filtered);
    } catch (error) {
      toast.error('Eroare la încărcarea produselor pentru această locație');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocationId) {
      toast.error('Selectează o locație mai întâi!');
      return;
    }
    
    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        location_id: selectedLocationId
      };
      
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, submitData);
        toast.success('Produs actualizat!');
      } else {
        await api.post('/products', submitData);
        toast.success('Produs creat manual!');
      }
      setShowDialog(false);
      resetForm();
      loadProducts(selectedLocationId);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Eroare la salvare');
    }
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=60";
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      currency: product.currency,
      category: product.category,
      image_url: product.image_url || '',
      available: product.available,
      featured: product.featured
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!(await confirm({ message: 'Sigur dorești să ștergi acest produs din această locație?', isDanger: true }))) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Produs șters!');
      loadProducts(selectedLocationId);
    } catch (error) {
      toast.error('Eroare la ștergere');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      currency: 'RON',
      category: 'other',
      image_url: '',
      available: true,
      featured: false
    });
    setEditingProduct(null);
  };

  const syncWithIiko = async () => {
    if (!selectedLocationId) return;
    setSyncing(true);
    try {
      // In a real scenario, this endpoint will trigger the IIKO sync for the selected location
      await api.post(`/products/sync-iiko/${selectedLocationId}`);
      toast.success('Sincronizare IIKO finalizată cu succes pentru această locație!');
      setShowSyncDialog(false);
      loadProducts(selectedLocationId);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Eroare la sincronizarea IIKO (Verifică setările API)');
    } finally {
      setSyncing(false);
    }
  };

  const selectedLocation = locations.find(l => l.id === selectedLocationId);

  return (
    <DashboardLayout>
      <div className="animate-in" data-testid="products-page">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200 mb-2">Produse per Locație</h1>
            <p className="text-slate-500 dark:text-slate-400">Gestionează meniul și prețurile specifice fiecărui restaurant</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Location Selector */}
            <div className="w-64">
              <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                <SelectTrigger className="glass-select h-10 border-indigo-200 bg-indigo-50/30 text-indigo-900 font-medium">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    <SelectValue placeholder="Selectează locația" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {locations.length === 0 ? (
                    <SelectItem value="none" disabled>Nicio locație definită</SelectItem>
                  ) : (
                    locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name} - {loc.city}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>

        {!selectedLocationId ? (
          <div className="glass-card p-12 text-center">
            <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Selectează o locație
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Prețurile și produsele diferă de la un restaurant la altul. Selectează locația dorită din meniul de sus.
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* Actions Bar for the selected location */}
            <div className="flex gap-3 mb-6 bg-white/50 dark:bg-slate-900/50 p-3 rounded-2xl border border-white/60 shadow-sm backdrop-blur-sm">
              <Button
                onClick={() => setShowSyncDialog(true)}
                className="btn-primary bg-blue-600 hover:bg-blue-700 shadow-blue-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sincronizare IIKO
              </Button>
              
              <Dialog open={showDialog} onOpenChange={(open) => {
                setShowDialog(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="btn-secondary">
                    <Plus className="w-4 h-4 mr-2" />
                    Adaugă Manual
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-panel max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? 'Editează produsul' : 'Adaugă produs nou'}
                      <span className="block text-xs font-normal text-slate-500 dark:text-slate-400 mt-1">
                        Pentru: {selectedLocation?.name}
                      </span>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto pr-1" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Form fields identical to before, omitted for brevity but keeping standard fields */}
                      <div>
                        <Label>Nume produs</Label>
                        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Preț</Label>
                          <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                        </div>
                        <div>
                          <Label>Categorie</Label>
                          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {categories.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>URL imagine</Label>
                        <Input value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={formData.available} onChange={(e) => setFormData({ ...formData, available: e.target.checked })} className="rounded" />
                          <span className="text-sm">Disponibil</span>
                        </label>
                      </div>
                      <Button type="submit" className="btn-primary w-full mt-4">Salveză Produsul</Button>
                    </form>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Products List/Grid */}
            {products.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Niciun produs</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Meniul pentru {selectedLocation?.name} este gol. Sincronizează cu IIKO sau adaugă manual.</p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="glass-card overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Produs</th>
                      <th className="px-6 py-4">Categorie</th>
                      <th className="px-6 py-4">Preț Local</th>
                      <th className="px-6 py-4 text-right">Acțiuni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map(product => (
                      <tr key={product.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                           <div className="flex items-center gap-3">
                             {product.image_url ? (
                               <img src={product.image_url} className="w-10 h-10 object-cover rounded-full" onError={handleImageError} alt="img" />
                             ) : (
                               <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full"><ShoppingBag className="w-5 h-5 text-slate-400" /></div>
                             )}
                             {product.name}
                             {product.iiko_id && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">IIKO</span>}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100/50 px-2 py-1 rounded-full">{categories.find(c => c.value === product.category)?.label || 'Altul'}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-brand-600">{product.price} {product.currency}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleEdit(product)} className="p-2 text-slate-400 hover:text-brand-600"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(product => (
                  <div key={product.id} className="glass-card p-6">
                    {product.image_url && (
                      <img src={product.image_url} alt={product.name} className="w-full h-40 object-cover rounded-2xl mb-4" onError={handleImageError} />
                    )}
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
                      {product.name}
                      {product.iiko_id && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">IIKO</span>}
                    </h3>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-2xl font-bold text-brand-600">{product.price} {product.currency}</span>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(product)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 rounded-full text-slate-600 dark:text-slate-400"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 rounded-full text-slate-600 dark:text-slate-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
          <DialogContent className="modal-panel max-w-md">
            <DialogHeader>
              <DialogTitle>Sincronizare Produse cu IIKO</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 text-sm text-blue-800">
                Aducem întregul nomenclator, prețurile și imaginile direct din API-ul IIKO pentru <strong>{selectedLocation?.name}</strong>.
              </div>
              
              {!selectedLocation?.iiko_organization_id && (
                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-sm text-rose-800 flex gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p>Această locație nu are un <strong>IIKO Organization ID</strong> setat. Va fi folosit un ID default sau sincronizarea va eșua dacă API-ul este strict.</p>
                </div>
              )}

              <Button onClick={syncWithIiko} disabled={syncing} className="w-full btn-primary bg-brand-600 hover:bg-brand-700 relative overflow-hidden">
                {syncing ? (
                  <div className="flex flex-col items-center justify-center py-2">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 animate-spin text-white/90" />
                      <span className="font-semibold text-white">Sincronizare în curs...</span>
                    </div>
                    <p className="text-xs text-white/70 mt-1 font-normal">Așteaptă, aducem sute de produse (durează câteva secunde).</p>
                    <div className="absolute bottom-0 left-0 h-1 bg-white/30 dark:bg-slate-900/30 w-full">
                      <div className="h-full bg-white dark:bg-slate-900 animate-pulse w-1/2 rounded-full mx-auto"></div>
                    </div>
                  </div>
                ) : 'Pornește Sincronizarea'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <ConfirmDialog />
      </div>
    </DashboardLayout>
  );
};
