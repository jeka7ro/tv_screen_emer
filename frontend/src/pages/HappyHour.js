import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Clock, Plus, Edit2, Trash2, Copy, Calendar, LayoutGrid, List as ListIcon, FileImage, ImageIcon, Eye, Film } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useViewMode } from '../hooks/useViewMode';

export const HappyHour = () => {
    const [schedules, setSchedules] = useState([]);
    const [screens, setScreens] = useState([]);
    const [content, setContent] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        location_ids: [],
        screen_ids: [],
        start_time: '17:00',
        end_time: '19:00',
        content_type: 'single_content',
        content_id: null,
        playlist_id: null,
        active: true,
        days_of_week: [1, 2, 3, 4, 5]
    });
    const [locations, setLocations] = useState([]);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const { viewMode, setViewMode } = useViewMode('grid');
    const [showOnlyWithScreens, setShowOnlyWithScreens] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [schedulesRes, screensRes, contentRes, playlistsRes, locationsRes] = await Promise.all([
                api.get('/happy-hours'),
                api.get('/screens'),
                api.get('/content'),
                api.get('/playlists'),
                api.get('/locations')
            ]);
            setSchedules(schedulesRes.data);
            setScreens(screensRes.data);
            setContent(contentRes.data);
            setPlaylists(playlistsRes.data);
            setLocations(locationsRes.data);
        } catch (error) {
            toast.error('Eroare la încărcarea datelor');
        } finally {
            setLoading(false);
        }
    };

    const cities = [...new Set(screens.map(s => s.city).filter(Boolean))].sort();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSchedule) {
                await api.put(`/happy-hours/${editingSchedule.id}`, formData);
                toast.success('Program actualizat!');
            } else {
                await api.post('/happy-hours', formData);
                toast.success('Program creat!');
            }
            setShowDialog(false);
            resetForm();
            loadData();
        } catch (error) {
            toast.error('Eroare la salvare');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Ștergi acest program?')) return;
        try {
            await api.delete(`/happy-hours/${id}`);
            toast.success('Program șters!');
            loadData();
        } catch (error) {
            toast.error('Eroare la ștergere');
        }
    };

    const handleDuplicate = (schedule) => {
        // ... same logic
    };

    const filteredLocations = useMemo(() => {
        if (!showOnlyWithScreens) return locations;
        const locationsWithScreens = new Set(screens.map(s => s.location_id).filter(Boolean));
        return locations.filter(l => locationsWithScreens.has(l.id));
    }, [locations, screens, showOnlyWithScreens]);

    const resetForm = () => {
        setFormData({
            name: '',
            location_ids: [],
            screen_ids: [],
            start_time: '17:00',
            end_time: '19:00',
            content_type: 'single_content',
            content_id: null,
            playlist_id: null,
            active: true,
            days_of_week: [1, 2, 3, 4, 5]
        });
        setEditingSchedule(null);
    };

    const toggleDay = (day) => {
        const days = formData.days_of_week || [];
        if (days.includes(day)) {
            setFormData({ ...formData, days_of_week: days.filter(d => d !== day) });
        } else {
            setFormData({ ...formData, days_of_week: [...days, day].sort() });
        }
    };

    const toggleLocation = (locationId) => {
        const currentIds = formData.location_ids || [];
        if (currentIds.includes(locationId)) {
            setFormData({ ...formData, location_ids: currentIds.filter(id => id !== locationId) });
        } else {
            setFormData({ ...formData, location_ids: [...currentIds, locationId] });
        }
    };

    const toggleAllLocations = () => {
        const allIds = locations.map(l => l.id);
        if (formData.location_ids.length === allIds.length) {
            setFormData({ ...formData, location_ids: [] });
        } else {
            setFormData({ ...formData, location_ids: allIds });
        }
    };

    const toggleScreen = (screenId) => {
        const screens = formData.screen_ids || [];
        if (screens.includes(screenId)) {
            setFormData({ ...formData, screen_ids: screens.filter(id => id !== screenId) });
        } else {
            setFormData({ ...formData, screen_ids: [...screens, screenId] });
        }
    };

    const toggleAllScreens = (filteredScreenIds) => {
        if (formData.screen_ids.length === filteredScreenIds.length) {
            setFormData({ ...formData, screen_ids: [] });
        } else {
            setFormData({ ...formData, screen_ids: filteredScreenIds });
        }
    };

    const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

    if (loading) return <DashboardLayout><div className="p-8">Se încarcă...</div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <Clock className="w-8 h-8 text-red-600" />
                            Happy Hour
                        </h1>
                        <p className="text-slate-600 mt-1">Programare conținut pe intervale orare</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 mr-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Grid View"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-red-600' : 'text-slate-400 hover:text-slate-600'}`}
                                title="List View"
                            >
                                <ListIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <Button
                            onClick={() => {
                                resetForm();
                                setShowDialog(true);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Program Nou
                        </Button>
                    </div>
                </div>

                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {schedules.map((schedule) => (
                            <div
                                key={schedule.id}
                                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-800">{schedule.name}</h3>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {(schedule.location_ids || []).map(locId => {
                                                const loc = locations.find(l => l.id === locId);
                                                return loc ? (
                                                    <span key={locId} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                                                        {loc.name}
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${schedule.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {schedule.active ? 'Activ' : 'Inactiv'}
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm flex-1">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        <span className="text-slate-700">
                                            {schedule.start_time} - {schedule.end_time}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <div className="flex gap-1 flex-wrap">
                                            {(schedule.days_of_week || []).map(day => (
                                                <span key={day} className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                                                    {dayNames[day - 1]}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-slate-600 flex items-center gap-2">
                                        <LayoutGrid className="w-4 h-4 text-slate-400" />
                                        {schedule.screen_ids?.length || 0} ecrane
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                                    <button
                                        onClick={() => {
                                            setFormData(schedule);
                                            setEditingSchedule(schedule);
                                            setShowDialog(true);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-sm font-medium"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Editează
                                    </button>
                                    <button
                                        onClick={() => handleDuplicate(schedule)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-sm font-medium"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Duplică
                                    </button>
                                    <button
                                        onClick={() => handleDelete(schedule.id)}
                                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Previzualizare</th>
                                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Nume</th>
                                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Locații</th>
                                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Program</th>
                                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Zile</th>
                                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Creat de</th>
                                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">Stare</th>
                                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Acțiuni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {schedules.map(schedule => (
                                    <tr key={schedule.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="w-16 h-10 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden">
                                                {schedule.content_type === 'single_content' ? (
                                                    (() => {
                                                        const item = content.find(c => c.id === schedule.content_id);
                                                        if (item?.thumbnail_url || (item?.type === 'image' && item?.file_url)) {
                                                            return <img src={item.thumbnail_url || item.file_url} className="w-full h-full object-cover" />;
                                                        }
                                                        return <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                                                            {item?.type === 'video' ? <Film className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                                                        </div>;
                                                    })()
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-red-500 bg-red-50">
                                                        <LayoutGrid className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm font-semibold text-slate-800">{schedule.name}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {(schedule.location_ids || []).map(locId => {
                                                    const loc = locations.find(l => l.id === locId);
                                                    return loc ? (
                                                        <span key={locId} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full border border-slate-200">
                                                            {loc.name}
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">
                                            {schedule.start_time} - {schedule.end_time}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-1">
                                                {(schedule.days_of_week || []).map(day => (
                                                    <span key={day} className="w-5 h-5 flex items-center justify-center bg-red-50 text-red-600 text-[10px] font-bold rounded">
                                                        {dayNames[day - 1]}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col text-xs">
                                                <span className="text-slate-700 font-medium">{schedule.created_by_name || 'System'}</span>
                                                <span className="text-slate-400">{schedule.created_at ? new Date(schedule.created_at).toLocaleDateString() : '-'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${schedule.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {schedule.active ? 'Activ' : 'Inactiv'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-red-50 text-red-600"
                                                    onClick={() => {
                                                        setFormData(schedule);
                                                        setEditingSchedule(schedule);
                                                        setShowDialog(true);
                                                    }}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-red-50 text-red-600"
                                                    onClick={() => handleDuplicate(schedule)}
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-rose-50 text-rose-500"
                                                    onClick={() => handleDelete(schedule.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Dialog */}
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent className="glass-panel sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                            <DialogTitle>
                                {editingSchedule ? 'Editează Program' : 'Program Nou Happy Hour'}
                            </DialogTitle>
                            <DialogDescription className="hidden">
                                Configurează intervalele orare și conținutul pentru Happy Hour.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto pr-1" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label>Nume eveniment</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <Label>Locații</Label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowOnlyWithScreens(!showOnlyWithScreens)}
                                                    className={`text-[10px] font-bold uppercase tracking-tighter transition-colors ${showOnlyWithScreens ? 'text-red-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    {showOnlyWithScreens ? 'Toate locațiile' : 'Doar cu ecrane'}
                                                </button>
                                                <span className="text-slate-200">|</span>
                                                <button
                                                    type="button"
                                                    onClick={toggleAllLocations}
                                                    className="text-[10px] font-bold text-red-600 hover:text-red-700 uppercase tracking-tighter"
                                                >
                                                    {formData.location_ids.length === locations.length ? 'Deselectează tot' : 'Selectează tot'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="border border-slate-200 rounded-xl p-3 max-h-32 overflow-y-auto space-y-1 bg-slate-50/50">
                                            {filteredLocations.map(loc => (
                                                <label key={loc.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded-lg transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={(formData.location_ids || []).includes(loc.id)}
                                                        onChange={() => toggleLocation(loc.id)}
                                                        className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                                                    />
                                                    <span className="text-sm font-medium text-slate-700">{loc.name} <span className="text-[10px] text-slate-400">({loc.city})</span></span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <Label>Ecrane</Label>
                                            {formData.location_ids.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const visibleScreens = screens.filter(s => formData.location_ids.includes(s.location_id));
                                                        const allVisibleIds = visibleScreens.map(s => s.id);
                                                        if (formData.screen_ids.length === allVisibleIds.length) {
                                                            setFormData({ ...formData, screen_ids: [] });
                                                        } else {
                                                            setFormData({ ...formData, screen_ids: allVisibleIds });
                                                        }
                                                    }}
                                                    className="text-[10px] font-bold text-red-600 hover:text-red-700 uppercase tracking-tighter"
                                                >
                                                    {formData.screen_ids.length > 0 ? 'Deselectează tot' : 'Selectează tot'}
                                                </button>
                                            )}
                                        </div>
                                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                            {formData.location_ids.length === 0 ? (
                                                <p className="text-xs text-slate-400 italic text-center py-4">Selectează cel puțin o locație</p>
                                            ) : (
                                                <div className="max-h-40 overflow-y-auto">
                                                    {locations
                                                        .filter(loc => formData.location_ids.includes(loc.id))
                                                        .map(loc => {
                                                            const locScreens = screens.filter(s => s.location_id === loc.id);
                                                            if (locScreens.length === 0) return null;
                                                            return (
                                                                <div key={loc.id} className="border-b border-slate-50 last:border-0">
                                                                    <div className="flex items-center gap-2 px-3 py-2 text-xs">
                                                                        <span className="font-semibold text-slate-700 flex-1">{loc.name}</span>
                                                                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{locScreens.length}</span>
                                                                    </div>
                                                                    <div className="pl-4 pr-3 pb-2 flex flex-wrap gap-1.5">
                                                                        {locScreens.map(screen => (
                                                                            <label
                                                                                key={screen.id}
                                                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] cursor-pointer transition-all border ${(formData.screen_ids || []).includes(screen.id)
                                                                                        ? 'bg-red-100 border-red-300 text-red-700 font-bold shadow-sm'
                                                                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-200'
                                                                                    }`}
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={(formData.screen_ids || []).includes(screen.id)}
                                                                                    onChange={() => toggleScreen(screen.id)}
                                                                                    className="hidden"
                                                                                />
                                                                                <span className={`w-2 h-2 rounded-full ${(formData.screen_ids || []).includes(screen.id) ? 'bg-red-500' : 'bg-slate-300'}`} />
                                                                                {screen.name}
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Oră început</Label>
                                        <Input
                                            type="time"
                                            value={formData.start_time}
                                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Oră sfârșit</Label>
                                        <Input
                                            type="time"
                                            value={formData.end_time}
                                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Zile săptămână</Label>
                                    <div className="flex gap-2 mt-2">
                                        {dayNames.map((day, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => toggleDay(idx + 1)}
                                                className={`w-10 h-10 rounded-full font-medium transition-all ${(formData.days_of_week || []).includes(idx + 1)
                                                    ? 'bg-red-600 text-white shadow-md shadow-red-200'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label>Tip conținut</Label>
                                    <Select
                                        value={formData.content_type}
                                        onValueChange={(val) => setFormData({ ...formData, content_type: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single_content">Imagine/Video singular</SelectItem>
                                            <SelectItem value="playlist">Playlist</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.content_type === 'single_content' ? (
                                    <div>
                                        <Label>Conținut</Label>
                                        <Select
                                            value={formData.content_id ? String(formData.content_id) : ''}
                                            onValueChange={(val) => setFormData({ ...formData, content_id: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selectează conținut" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {content.map(item => (
                                                    <SelectItem key={item.id} value={item.id}>
                                                        <div className="flex items-center gap-3 py-1">
                                                            <div className="w-10 h-10 rounded border border-slate-200 overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center">
                                                                {item.thumbnail_url || (item.type === 'image' && item.file_url) ? (
                                                                    <img src={item.thumbnail_url || item.file_url} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                        {item.type === 'video' ? <Film className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-sm font-medium truncate">{item.title}</span>
                                                                <span className="text-[10px] text-slate-500 uppercase">{item.type}</span>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : (
                                    <div>
                                        <Label>Playlist</Label>
                                        <Select
                                            value={formData.playlist_id ? String(formData.playlist_id) : ''}
                                            onValueChange={(val) => setFormData({ ...formData, playlist_id: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selectează playlist" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {playlists.map(pl => (
                                                    <SelectItem key={pl.id} value={pl.id}>{pl.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <Label>Activ</Label>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                                        Anulează
                                    </Button>
                                    <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200">
                                        {editingSchedule ? 'Actualizează' : 'Creează'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};
