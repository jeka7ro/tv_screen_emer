import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Trash2, Building2, Globe, Link as LinkIcon, Upload } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useViewMode } from '../hooks/useViewMode';
import { ViewToggle } from '../components/ViewToggle';

export const Brands = () => {
    const { isAdmin } = useAuth();
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [viewMode, setViewMode] = useViewMode('view_mode_brands', 'grid');
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        logo_url: ''
    });

    useEffect(() => {
        loadBrands();
    }, []);

    const loadBrands = async () => {
        try {
            const response = await api.get('/brands');
            setBrands(response.data);
        } catch (error) {
            toast.error('Eroare la încărcarea brandurilor');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBrand) {
                await api.put(`/brands/${editingBrand.id}`, formData);
                toast.success('Brand actualizat!');
            } else {
                await api.post('/brands', formData);
                toast.success('Brand creat!');
            }
            setShowDialog(false);
            resetForm();
            loadBrands();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Eroare la salvare');
        }
    };

    const handleEdit = (brand) => {
        setEditingBrand(brand);
        setFormData({
            name: brand.name,
            address: brand.address || '',
            logo_url: brand.logo_url || ''
        });
        setShowDialog(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Sigur dorești să ștergi acest brand?')) return;
        try {
            await api.delete(`/brands/${id}`);
            toast.success('Brand șters!');
            loadBrands();
        } catch (error) {
            toast.error('Eroare la ștergere');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            address: '',
            logo_url: ''
        });
        setEditingBrand(null);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!editingBrand) {
            // For new brands, we need to create first, then upload
            toast.error('Salvează brandul mai întâi, apoi uploadează logo-ul');
            return;
        }

        setUploadingLogo(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const response = await api.post(`/brands/${editingBrand.id}/logo`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({ ...prev, logo_url: response.data.logo_url }));
            toast.success('Logo încărcat cu succes!');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Eroare la încărcarea logo-ului');
        } finally {
            setUploadingLogo(false);
        }
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
            <div className="animate-in" data-testid="brands-page">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-800 mb-2">Branduri</h1>
                        <p className="text-slate-500">Gestionează identitatea brandurilor tale</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />

                        {isAdmin() && (
                            <Dialog open={showDialog} onOpenChange={(open) => {
                                setShowDialog(open);
                                if (!open) resetForm();
                            }}>
                                <DialogTrigger asChild>
                                    <Button className="btn-red px-6 py-2 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all h-[40px]" data-testid="add-brand-button">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Adăugă brand
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="glass-panel max-h-[90vh] flex flex-col">
                                    <DialogHeader>
                                        <DialogTitle>
                                            {editingBrand ? 'Editează brandul' : 'Adăugă brand nou'}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="flex-1 overflow-y-auto px-1" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div>
                                                <Label>Nume brand</Label>
                                                <Input
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    placeholder="Ex: SushiMaster"
                                                    required
                                                    data-testid="brand-name-input"
                                                />
                                            </div>
                                            <div>
                                                <Label>Adresă / Sediul central</Label>
                                                <Input
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    placeholder="Strada Exemplului nr. 1"
                                                    data-testid="brand-address-input"
                                                />
                                            </div>
                                            <div>
                                                <Label>Logo</Label>
                                                {/* Preview */}
                                                {formData.logo_url && (
                                                    <div className="mb-2 flex items-center gap-3 p-2 border border-slate-200 rounded-lg bg-slate-50">
                                                        <img src={formData.logo_url} alt="Logo preview" className="w-12 h-12 object-contain rounded" />
                                                        <span className="text-xs text-slate-500 truncate flex-1">{formData.logo_url.split('/').pop()}</span>
                                                    </div>
                                                )}
                                                {/* Upload button */}
                                                <div className="flex gap-2">
                                                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-red-400 hover:bg-red-50/30 transition-all">
                                                        <Upload className="w-4 h-4 text-slate-400" />
                                                        <span className="text-sm text-slate-500">{uploadingLogo ? 'Se încarcă...' : 'Încarcă logo (PNG, JPG, SVG)'}</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={handleLogoUpload}
                                                            disabled={uploadingLogo}
                                                            data-testid="brand-logo-upload"
                                                        />
                                                    </label>
                                                </div>
                                                {/* URL fallback */}
                                                <div className="mt-2">
                                                    <Input
                                                        value={formData.logo_url}
                                                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                                        placeholder="sau lipește URL: https://..."
                                                        className="text-xs"
                                                        data-testid="brand-logo-input"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-3 pt-4">
                                                <Button type="submit" className="btn-primary flex-1" data-testid="save-brand-button">
                                                    {editingBrand ? 'Actualizează' : 'Creează'}
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
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>

                {brands.length === 0 ? (
                    <div className="glass-card p-12 text-center" data-testid="no-brands">
                        <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">
                            Niciun brand
                        </h3>
                        <p className="text-slate-500 mb-6">
                            Începe prin a adăuga primul brand
                        </p>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Brand</th>
                                        <th className="px-6 py-4">Adresă</th>
                                        <th className="px-6 py-4 text-right">{isAdmin() && 'Acțiuni'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {brands.map((brand) => (
                                        <tr key={brand.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg border border-slate-100 flex items-center justify-center bg-white overflow-hidden shadow-sm">
                                                        {brand.logo_url ? (
                                                            <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain" />
                                                        ) : (
                                                            <Building2 className="w-5 h-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                    {brand.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {brand.address || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isAdmin() && (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-red-50"
                                                            onClick={() => handleEdit(brand)}
                                                        >
                                                            <Edit2 className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-rose-50 group/d"
                                                            onClick={() => handleDelete(brand.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-slate-400 group-hover/d:text-rose-500" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {brands.map((brand) => (
                            <div key={brand.id} className="glass-card p-6 relative group border border-white/40 shadow-sm" data-testid={`brand-card-${brand.id}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-16 h-16 rounded-2xl border border-slate-200 flex items-center justify-center bg-white overflow-hidden shadow-inner">
                                        {brand.logo_url ? (
                                            <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain" />
                                        ) : (
                                            <Building2 className="w-8 h-8 text-slate-300" />
                                        )}
                                    </div>
                                    {isAdmin() && (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleEdit(brand)}
                                                className="p-2 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition-colors"
                                                data-testid={`edit-brand-${brand.id}`}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(brand.id)}
                                                className="p-2 bg-rose-500 text-white rounded-lg shadow-sm hover:bg-rose-600 transition-colors"
                                                data-testid={`delete-brand-${brand.id}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-1 leading-tight">
                                    {brand.name}
                                </h3>
                                <p className="text-sm text-slate-600 mb-4 line-clamp-2 min-h-[40px]">
                                    {brand.address || 'Nicio adresă specificată'}
                                </p>
                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-400">
                                        Creat pe {new Date(brand.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};
