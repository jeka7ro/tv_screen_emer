import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Trash2, MapPin, Search, X } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useViewMode } from '../hooks/useViewMode';
import { ViewToggle } from '../components/ViewToggle';

export const Locations = () => {
  const { isAdmin } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [viewMode, setViewMode] = useViewMode('view_mode_locations', 'grid');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    security_code: '',
    status: 'active'
  });
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await api.get('/locations');
      setLocations(response.data);
    } catch (error) {
      toast.error('Eroare la încărcarea locațiilor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLocation) {
        await api.put(`/locations/${editingLocation.id}`, formData);
        toast.success('Locație actualizată!');
      } else {
        await api.post('/locations', formData);
        toast.success('Locație creată!');
      }
      setShowDialog(false);
      resetForm();
      loadLocations();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Eroare la salvare');
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      security_code: location.security_code || '',
      status: location.status
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sigur dorești să ștergi această locație?')) return;
    try {
      await api.delete(`/locations/${id}`);
      toast.success('Locație ștearsă!');
      loadLocations();
    } catch (error) {
      toast.error('Eroare la ștergere');
    }
  };

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
    if (!window.confirm(`Sigur dorești să ștergi ${selectedItems.size} locații?`)) return;

    try {
      const deletePromises = Array.from(selectedItems).map(id => api.delete(`/locations/${id}`));
      await Promise.all(deletePromises);
      toast.success(`${selectedItems.size} locații șterse!`);
      setSelectedItems(new Set());
      loadLocations();
    } catch (error) {
      toast.error('Eroare la ștergerea în masă');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      security_code: '',
      status: 'active'
    });
    setEditingLocation(null);
  };

  // Get unique cities for filter
  const cities = useMemo(() => {
    const uniqueCities = [...new Set(locations.map(loc => loc.city).filter(Boolean))];
    return uniqueCities.sort();
  }, [locations]);

  // Filter locations based on search and city
  const filteredLocations = useMemo(() => {
    return locations.filter(location => {
      const matchesSearch = searchQuery === '' ||
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCity = selectedCity === 'all' || location.city === selectedCity;

      return matchesSearch && matchesCity;
    });
  }, [locations, searchQuery, selectedCity]);

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
      <div className="animate-in" data-testid="locations-page">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Locații</h1>
            <p className="text-slate-500">Gestionează restaurantele și punctele de vânzare</p>
          </div>

          <div className="flex items-center gap-3">
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />

            {isAdmin() && (
              <Dialog open={showDialog} onOpenChange={(open) => {
                setShowDialog(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="btn-red px-6 py-2 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all h-[40px]" data-testid="add-location-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Adăugă locație
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-panel max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>
                      {editingLocation ? 'Editează locația' : 'Adăugă locație nouă'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto pr-1" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label>Nume locație</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="SushiMaster Centru"
                          required
                          data-testid="location-name-input"
                        />
                      </div>
                      <div>
                        <Label>Adresă</Label>
                        <Input
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Strada Principală nr. 123"
                          required
                          data-testid="location-address-input"
                        />
                      </div>
                      <div>
                        <Label>Oraș</Label>
                        <Input
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="București"
                          required
                          data-testid="location-city-input"
                        />
                      </div>
                      <div>
                        <Label>Cod de securitate (opțional)</Label>
                        <Input
                          value={formData.security_code}
                          onChange={(e) => setFormData({ ...formData, security_code: e.target.value })}
                          placeholder="1234"
                          data-testid="location-security-input"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Va fi cerut la accesarea ecranelor din această locație
                        </p>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="btn-primary flex-1" data-testid="save-location-button">
                          {editingLocation ? 'Actualizează' : 'Creează'}
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

        {/* Filters */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Filter */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Caută după nume sau adresă..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* City Filter */}
            <div className="sm:w-64">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm bg-white"
              >
                <option value="all">Toate orașele</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Results count */}
            <div className="flex items-center px-4 py-2 bg-slate-50 rounded-lg text-sm text-slate-600 font-medium">
              {filteredLocations.length} {filteredLocations.length === 1 ? 'locație' : 'locații'}
            </div>
          </div>
        </div>

        {isAdmin() && selectedItems.size > 0 && (
          <div className="mb-6 bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-4 animate-in slide-in-from-top-4">
            <span className="font-semibold text-lg">{selectedItems.size} selectate</span>
            <div className="h-6 w-px bg-white/30"></div>
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

        {filteredLocations.length === 0 && locations.length > 0 ? (
          <div className="glass-card p-12 text-center">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Nicio locație găsită
            </h3>
            <p className="text-slate-500 mb-6">
              Încearcă să modifici filtrele de căutare
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('all');
              }}
              className="btn-secondary"
            >
              Resetează filtrele
            </button>
          </div>
        ) : locations.length === 0 ? (
          <div className="glass-card p-12 text-center" data-testid="no-locations">
            <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Nicio locație
            </h3>
            <p className="text-slate-500 mb-6">
              Începe prin a adăuga prima locație
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    {isAdmin() && (
                      <th className="px-6 py-4 w-10">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === locations.length && locations.length > 0}
                          onChange={() => toggleSelectAll(locations)}
                          className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                        />
                      </th>
                    )}
                    <th className="px-6 py-4">Nume</th>
                    <th className="px-6 py-4">Adresă / Oraș</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">{isAdmin() && 'Acțiuni'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLocations.map((location) => (
                    <tr key={location.id} className={`hover:bg-slate-50/50 transition-colors ${selectedItems.has(location.id) ? 'bg-red-50/30' : ''}`}>
                      {isAdmin() && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(location.id)}
                            onChange={() => toggleSelectItem(location.id)}
                            className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 font-medium text-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-100 p-2 rounded-lg">
                            <MapPin className="w-4 h-4 text-red-600" />
                          </div>
                          {location.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          {location.address}
                          <p className="text-xs text-slate-400 mt-0.5">{location.city}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={location.status === 'active' ? 'status-active' : 'status-offline'}>
                            {location.status === 'active' ? 'Activ' : 'Inactiv'}
                          </span>
                          {location.security_code && (
                            <span className="text-xs text-slate-500 bg-slate-100/50 px-2 py-1 rounded-full border border-slate-200">
                              Protejat
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isAdmin() && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-red-50"
                              onClick={() => handleEdit(location)}
                            >
                              <Edit2 className="w-4 h-4 text-red-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-rose-50 group/d"
                              onClick={() => handleDelete(location.id)}
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
            {filteredLocations.map((location) => (
              <div key={location.id} className={`glass-card p-6 relative group ${selectedItems.has(location.id) ? 'ring-2 ring-red-500 ring-offset-2' : ''}`} data-testid={`location-card-${location.id}`}>
                {isAdmin() && (
                  <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 shadow-sm cursor-pointer"
                      checked={selectedItems.has(location.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelectItem(location.id);
                      }}
                    />
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-red-100 p-3 rounded-2xl">
                    <MapPin className="w-6 h-6 text-red-600" />
                  </div>
                  {isAdmin() && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(location)}
                        className="p-2 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition-colors"
                        data-testid={`edit-location-${location.id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(location.id)}
                        className="p-2 bg-rose-500 text-white rounded-lg shadow-sm hover:bg-rose-600 transition-colors"
                        data-testid={`delete-location-${location.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {location.name}
                </h3>
                <p className="text-sm text-slate-600 mb-1">{location.address}</p>
                <p className="text-sm text-slate-500 mb-3">{location.city}</p>
                <div className="flex items-center gap-2">
                  <span className={location.status === 'active' ? 'status-active' : 'status-offline'}>
                    {location.status === 'active' ? 'Activ' : 'Inactiv'}
                  </span>
                  {location.security_code && (
                    <span className="text-xs text-slate-500 bg-slate-100/50 px-2 py-1 rounded-full">
                      Protejat
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
