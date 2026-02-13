import React, { useState, useEffect } from 'react';
import {
    Search, Filter, Calendar, User,
    Activity, Clock, ChevronLeft, ChevronRight,
    FileText, Layout, Monitor, Film, PlaySquare, Folder,
    Shield, AlertTriangle, CheckCircle, Info, MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';

const ActivityLogs = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter lists
    const [usersList, setUsersList] = useState([]);
    const [locationsList, setLocationsList] = useState([]);

    const [filters, setFilters] = useState({
        entity_type: '',
        level: '',
        user_id: '',
        location_id: '',
        limit: 50,
        offset: 0
    });
    const [pagination, setPagination] = useState({
        page: 1,
        hasMore: false
    });

    // Load filter options
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [usersRes, locsRes] = await Promise.all([
                    api.get('/users'),
                    api.get('/locations')
                ]);
                setUsersList(usersRes.data);
                setLocationsList(locsRes.data);
            } catch (error) {
                console.error("Failed to load filter options", error);
            }
        };
        fetchOptions();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: filters.limit,
                offset: filters.offset
            });
            if (filters.entity_type) params.append('entity_type', filters.entity_type);
            if (filters.level) params.append('level', filters.level);
            if (filters.user_id) params.append('user_id', filters.user_id);
            if (filters.location_id) params.append('location_id', filters.location_id);

            const res = await api.get(`/activity-logs?${params.toString()}`);

            // If we got full limit, assume there's more
            const hasMore = res.data.length === filters.limit;
            setLogs(res.data);
            setPagination(prev => ({ ...prev, hasMore }));
        } catch (error) {
            console.error('Failed to load logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [filters]);

    const handlePageChange = (newPage) => {
        const newOffset = (newPage - 1) * filters.limit;
        setFilters(prev => ({ ...prev, offset: newOffset }));
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const getEntityIcon = (type) => {
        switch (type) {
            case 'user': return <User className="w-4 h-4" />;
            case 'location': return <Layout className="w-4 h-4" />;
            case 'screen': return <Monitor className="w-4 h-4" />;
            case 'content': return <Film className="w-4 h-4" />;
            case 'playlist': return <PlaySquare className="w-4 h-4" />;
            case 'folder': return <Folder className="w-4 h-4" />;
            case 'happy_hour': return <Clock className="w-4 h-4" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    const getLevelBadge = (level) => {
        switch (level) {
            case 'WARNING':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> WARNING</span>;
            case 'ERROR':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1"><Shield className="w-3 h-3" /> ERROR</span>;
            default:
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 flex items-center gap-1"><Info className="w-3 h-3" /> INFO</span>;
        }
    };

    const formatDetails = (details) => {
        if (!details) return '-';
        try {
            // If it's a JSON string, parse it
            const data = typeof details === 'string' ? JSON.parse(details) : details;

            // Filter out empty values or internal IDs if needed
            const entries = Object.entries(data).filter(([key, val]) => val !== null && val !== undefined);

            if (entries.length === 0) return '-';

            return (
                <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                    {entries.map(([key, val]) => (
                        <div key={key} className="flex gap-1">
                            <span className="font-semibold">{key}:</span>
                            <span className="truncate max-w-[200px]" title={String(val)}>{String(val)}</span>
                        </div>
                    ))}
                </div>
            );
        } catch (e) {
            return <span className="text-xs text-slate-400">Invalid Data</span>;
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Jurnale Activitate</h1>
                        <p className="text-slate-500">Istoric complet al acțiunilor din sistem</p>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        {/* User Filter */}
                        <select
                            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none min-w-[150px]"
                            value={filters.user_id}
                            onChange={(e) => setFilters(prev => ({ ...prev, user_id: e.target.value, offset: 0 }))}
                        >
                            <option value="">Toți utilizatorii</option>
                            {usersList.map(u => (
                                <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                            ))}
                        </select>

                        {/* Location Filter */}
                        <select
                            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none min-w-[150px]"
                            value={filters.location_id}
                            onChange={(e) => setFilters(prev => ({ ...prev, location_id: e.target.value, offset: 0 }))}
                        >
                            <option value="">Toate locațiile</option>
                            {locationsList.map(l => (
                                <option key={l.id} value={l.id}>{l.name} ({l.city})</option>
                            ))}
                        </select>

                        {/* Entity Type Filter */}
                        <select
                            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                            value={filters.entity_type}
                            onChange={(e) => setFilters(prev => ({ ...prev, entity_type: e.target.value, offset: 0 }))}
                        >
                            <option value="">Toate entitățile</option>
                            <option value="user">Utilizatori</option>
                            <option value="location">Locații</option>
                            <option value="screen">Ecrane</option>
                            <option value="content">Conținut</option>
                            <option value="playlist">Playlists</option>
                            <option value="folder">Foldere</option>
                            <option value="happy_hour">Happy Hour</option>
                        </select>

                        {/* Level Filter */}
                        <select
                            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                            value={filters.level}
                            onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value, offset: 0 }))}
                        >
                            <option value="">Toate nivelurile</option>
                            <option value="INFO">Info</option>
                            <option value="WARNING">Warning</option>
                            <option value="ERROR">Error</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Dată & Oră</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Utilizator</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Acțiune</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Entitate</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Detalii</th>
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Nivel</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                                Se încarcă...
                                            </div>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <FileText className="w-8 h-8 opacity-50" />
                                                <p>Nu există jurnale pentru filtrele selectate</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                    {log.created_at ? format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss', { locale: ro }) : '-'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs uppercase border border-red-200">
                                                        {log.user_real_name ? log.user_real_name.substring(0, 2) : (log.user_name ? log.user_name.substring(0, 2) : '??')}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-800">{log.user_real_name || log.user_name || 'System'}</p>
                                                        <div className="flex items-center gap-1.5">
                                                            {log.user_role && (
                                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold uppercase tracking-wide">
                                                                    {log.user_role}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wide shadow-sm">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <span className="p-1.5 bg-slate-100 rounded text-slate-500">
                                                        {getEntityIcon(log.entity_type)}
                                                    </span>
                                                    <div className="flex flex-col">
                                                        <span className="capitalize font-medium">{log.entity_type}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono">{log.entity_id ? log.entity_id.split('-')[0] : ''}...</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 max-w-[300px]">
                                                {formatDetails(log.details)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {getLevelBadge(log.level)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-sm text-slate-500">
                            Pagina {pagination.page}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1 || loading}
                                className="p-1 px-3 bg-white border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={!pagination.hasMore || loading}
                                className="p-1 px-3 bg-white border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Următor
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ActivityLogs;
