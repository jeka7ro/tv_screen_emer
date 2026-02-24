import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { DollarSign, Monitor, MapPin, Download, Save, Shield, Wifi, WifiOff, Calendar, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Period helper functions
const getMonthRange = (offset = 0) => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const from = new Date(d.getFullYear(), d.getMonth(), 1);
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    return { from, to, label: from.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' }) };
};

const getYearRange = (offset = 0) => {
    const y = new Date().getFullYear() + offset;
    return { from: new Date(y, 0, 1), to: new Date(y, 11, 31, 23, 59, 59), label: `${y}` };
};

const formatDateISO = (d) => d ? d.toISOString() : null;
const formatDateDisplay = (d) => d ? d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

const PERIOD_PRESETS = [
    { key: 'all', label: 'Toate', fn: () => ({ from: null, to: null }) },
    { key: 'current_month', label: 'Luna curentă', fn: () => getMonthRange(0) },
    { key: 'prev_month', label: 'Luna trecută', fn: () => getMonthRange(-1) },
    { key: 'current_year', label: 'Anul curent', fn: () => getYearRange(0) },
    { key: 'prev_year', label: 'Anul precedent', fn: () => getYearRange(-1) },
    { key: 'custom', label: 'Personalizat', fn: () => ({ from: null, to: null }) },
];

export const Billing = () => {
    const { isSuperAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [locations, setLocations] = useState([]);
    const [config, setConfig] = useState({ price_per_screen: 0, currency: 'EUR', notes: '' });
    const [totalScreens, setTotalScreens] = useState(0);
    const [totalMonthly, setTotalMonthly] = useState(0);

    // Period state
    const [activePeriod, setActivePeriod] = useState('all');
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);
    const [periodLabel, setPeriodLabel] = useState('Toate');
    const [showCustom, setShowCustom] = useState(false);
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const loadData = useCallback(async (from, to) => {
        setLoading(true);
        try {
            const params = {};
            if (from) params.date_from = formatDateISO(from);
            if (to) params.date_to = formatDateISO(to);
            const res = await axios.get(`${API}/billing/summary`, { headers, params });
            setLocations(res.data.locations || []);
            setConfig(res.data.config || { price_per_screen: 0, currency: 'EUR', notes: '' });
            setTotalScreens(res.data.total_screens || 0);
            setTotalMonthly(res.data.total_monthly || 0);
        } catch (err) {
            toast.error('Eroare la încărcarea datelor de facturare');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(dateFrom, dateTo); }, [dateFrom, dateTo, loadData]);

    const handlePeriodChange = (key) => {
        const preset = PERIOD_PRESETS.find(p => p.key === key);
        if (!preset) return;
        setActivePeriod(key);
        if (key === 'custom') {
            setShowCustom(true);
            return;
        }
        setShowCustom(false);
        const range = preset.fn();
        setDateFrom(range.from);
        setDateTo(range.to);
        setPeriodLabel(range.label || preset.label);
    };

    const applyCustomRange = () => {
        if (!customFrom || !customTo) {
            toast.error('Selectează ambele date');
            return;
        }
        const from = new Date(customFrom);
        const to = new Date(customTo + 'T23:59:59');
        if (from > to) {
            toast.error('Data de început trebuie să fie înainte de data de sfârșit');
            return;
        }
        setDateFrom(from);
        setDateTo(to);
        setPeriodLabel(`${formatDateDisplay(from)} – ${formatDateDisplay(to)}`);
        setShowCustom(false);
    };

    const handleSaveConfig = async () => {
        setSaving(true);
        try {
            await axios.put(`${API}/billing/config`, config, { headers });
            toast.success('Configurație salvată');
            await loadData(dateFrom, dateTo);
        } catch (err) {
            toast.error('Eroare la salvare');
        } finally {
            setSaving(false);
        }
    };

    const exportCSV = () => {
        const price = parseFloat(config.price_per_screen) || 0;
        const rows = [
            ['Locație', 'Oraș', 'Ecrane', 'Online', `Preț/Ecran (${config.currency})`, `Total Lunar (${config.currency})`, 'Perioadă'],
            ...locations.map(loc => [
                loc.name,
                loc.city || '-',
                loc.screen_count,
                loc.screens_online,
                price.toFixed(2),
                (loc.screen_count * price).toFixed(2),
                periodLabel,
            ]),
            ['', '', '', '', 'TOTAL', (totalScreens * price).toFixed(2), ''],
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `facturare_${periodLabel.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('CSV exportat');
    };

    if (!isSuperAdmin()) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-slate-600">Acces restricționat</h2>
                        <p className="text-slate-400 mt-2">Pagina este disponibilă doar pentru Super Admin.</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const price = parseFloat(config.price_per_screen) || 0;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                Facturare
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded-full uppercase tracking-wider">
                                    Super Admin
                                </span>
                            </h1>
                            <p className="text-sm text-slate-500">Evidență ecrane și costuri per client</p>
                        </div>
                    </div>
                    <button
                        onClick={exportCSV}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>

                {/* Period selector */}
                <div className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-semibold text-slate-700">Perioadă</span>
                        {activePeriod !== 'all' && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                                {periodLabel}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {PERIOD_PRESETS.filter(p => p.key !== 'custom').map(preset => (
                            <button
                                key={preset.key}
                                onClick={() => handlePeriodChange(preset.key)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activePeriod === preset.key
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                        <div className="relative">
                            <button
                                onClick={() => { setActivePeriod('custom'); setShowCustom(!showCustom); }}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${activePeriod === 'custom'
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <Calendar className="w-3.5 h-3.5" />
                                Personalizat
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            {showCustom && (
                                <div className="absolute top-full mt-2 left-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-4 min-w-[300px]">
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">De la</label>
                                            <input
                                                type="date"
                                                value={customFrom}
                                                onChange={e => setCustomFrom(e.target.value)}
                                                className="glass-input px-3 py-1.5 w-full text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Până la</label>
                                            <input
                                                type="date"
                                                value={customTo}
                                                onChange={e => setCustomTo(e.target.value)}
                                                className="glass-input px-3 py-1.5 w-full text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={applyCustomRange}
                                            className="btn-primary px-4 py-1.5 text-sm flex-1"
                                        >
                                            Aplică
                                        </button>
                                        <button
                                            onClick={() => setShowCustom(false)}
                                            className="px-4 py-1.5 text-sm text-slate-500 hover:text-slate-700"
                                        >
                                            Anulează
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <Monitor className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Total Ecrane</p>
                                <p className="text-2xl font-bold text-slate-800">{loading ? '...' : totalScreens}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Total Lunar</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {loading ? '...' : `${(totalScreens * price).toFixed(2)} ${config.currency}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Locații Active</p>
                                <p className="text-2xl font-bold text-slate-800">
                                    {loading ? '...' : locations.filter(l => l.screen_count > 0).length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Config card */}
                <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        ⚙️ Configurare Preț
                    </h3>
                    <div className="flex flex-wrap items-end gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Preț / ecran / lună</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={config.price_per_screen}
                                onChange={e => setConfig({ ...config, price_per_screen: parseFloat(e.target.value) || 0 })}
                                className="glass-input px-3 py-2 w-32 text-right font-mono text-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Monedă</label>
                            <select
                                value={config.currency}
                                onChange={e => setConfig({ ...config, currency: e.target.value })}
                                className="glass-input px-3 py-2"
                            >
                                <option value="EUR">EUR</option>
                                <option value="RON">RON</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs text-slate-500 mb-1">Note</label>
                            <input
                                type="text"
                                value={config.notes}
                                onChange={e => setConfig({ ...config, notes: e.target.value })}
                                className="glass-input px-3 py-2 w-full"
                                placeholder="Notițe interne..."
                            />
                        </div>
                        <button
                            onClick={handleSaveConfig}
                            disabled={saving}
                            className="btn-primary flex items-center gap-2 px-5 py-2"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Se salvează...' : 'Salvează'}
                        </button>
                    </div>
                </div>

                {/* Locations table */}
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200/60">
                                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Locație</th>
                                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Oraș</th>
                                    <th className="text-center py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ecrane</th>
                                    <th className="text-center py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Online</th>
                                    <th className="text-right py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Preț/Ecran</th>
                                    <th className="text-right py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Lunar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400 animate-pulse">
                                            Se încarcă...
                                        </td>
                                    </tr>
                                ) : locations.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400">
                                            Nu există locații
                                        </td>
                                    </tr>
                                ) : (
                                    locations.map(loc => (
                                        <tr key={loc.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-5 font-medium text-slate-800">{loc.name}</td>
                                            <td className="py-3 px-5 text-slate-500">{loc.city || '-'}</td>
                                            <td className="py-3 px-5 text-center">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-semibold text-xs">
                                                    <Monitor className="w-3 h-3" />
                                                    {loc.screen_count}
                                                </span>
                                            </td>
                                            <td className="py-3 px-5 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-xs ${loc.screens_online > 0
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                    {loc.screens_online > 0
                                                        ? <Wifi className="w-3 h-3" />
                                                        : <WifiOff className="w-3 h-3" />
                                                    }
                                                    {loc.screens_online}
                                                </span>
                                            </td>
                                            <td className="py-3 px-5 text-right font-mono text-slate-600">
                                                {price.toFixed(2)} {config.currency}
                                            </td>
                                            <td className="py-3 px-5 text-right font-mono font-semibold text-slate-800">
                                                {(loc.screen_count * price).toFixed(2)} {config.currency}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {!loading && locations.length > 0 && (
                                <tfoot>
                                    <tr className="bg-slate-50/80 border-t-2 border-slate-200">
                                        <td colSpan={2} className="py-3 px-5 font-bold text-slate-700">TOTAL</td>
                                        <td className="py-3 px-5 text-center font-bold text-indigo-700">{totalScreens}</td>
                                        <td className="py-3 px-5 text-center font-bold text-emerald-700">
                                            {locations.reduce((sum, l) => sum + l.screens_online, 0)}
                                        </td>
                                        <td className="py-3 px-5"></td>
                                        <td className="py-3 px-5 text-right font-mono font-bold text-lg text-emerald-700">
                                            {(totalScreens * price).toFixed(2)} {config.currency}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};
