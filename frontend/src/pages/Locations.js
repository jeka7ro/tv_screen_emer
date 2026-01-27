import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export const Locations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    security_code: '',
    status: 'active'
  });

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Locații</h1>
            <p className="text-slate-500">Gestionează restaurantele și punctele de vânzare</p>
          </div>
          <Dialog open={showDialog} onOpenChange={(open) => {
            setShowDialog(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="add-location-button">
                <Plus className="w-5 h-5 mr-2" />
                Adaugă locație
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel">
              <DialogHeader>
                <DialogTitle>
                  {editingLocation ? 'Editează locația' : 'Adaugă locație nouă'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Nume locație</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="SushiMaster Centru"
                    required
                    data-testid="location-name-input"
                  />
                </div>
                <div>
                  <Label>Adresă</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Strada Principală nr. 123"
                    required
                    data-testid="location-address-input"
                  />
                </div>
                <div>
                  <Label>Oraș</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="București"
                    required
                    data-testid="location-city-input"
                  />
                </div>
                <div>
                  <Label>Cod de securitate (opțional)</Label>
                  <Input
                    value={formData.security_code}
                    onChange={(e) => setFormData({...formData, security_code: e.target.value})}
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
            </DialogContent>
          </Dialog>
        </div>

        {locations.length === 0 ? (
          <div className="glass-card p-12 text-center" data-testid="no-locations">
            <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Nicio locație
            </h3>
            <p className="text-slate-500 mb-6">
              Începe prin a adăuga prima locație
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => (
              <div key={location.id} className="glass-card p-6" data-testid={`location-card-${location.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-indigo-100 p-3 rounded-2xl">
                    <MapPin className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(location)}
                      className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                      data-testid={`edit-location-${location.id}`}
                    >
                      <Edit className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(location.id)}
                      className="p-2 hover:bg-rose-100/50 rounded-lg transition-colors"
                      data-testid={`delete-location-${location.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </button>
                  </div>
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
