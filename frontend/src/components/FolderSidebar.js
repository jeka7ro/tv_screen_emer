import React from 'react';
import { Folder, FolderPlus, FolderOpen, Edit2, Trash2, List as ListIcon, Plus, Monitor, RefreshCw } from 'lucide-react';
import api from '../utils/api';

export const FolderSidebar = ({
    folders,
    selectedFolder,
    setSelectedFolder,
    content,
    isAdmin,
    openFolderDialog,
    handleDeleteFolder,
    handleMoveToFolder,
    onAddContent,
    screens = [],
    onAssignToScreen,
    onRefresh
}) => {
    // State for location filter
    const [selectedLocation, setSelectedLocation] = React.useState('all');

    // Extract unique locations (Cities)
    const locations = React.useMemo(() => {
        const cities = new Set(screens.map(s => s.city).filter(Boolean));
        return Array.from(cities).sort();
    }, [screens]);

    // Filter and Sort screens
    const filteredScreens = React.useMemo(() => {
        let result = [...screens];

        if (selectedLocation !== 'all') {
            result = result.filter(s => s.city === selectedLocation);
        }

        return result.sort((a, b) => {
            const cityA = (a.city || '').toLowerCase();
            const cityB = (b.city || '').toLowerCase();
            if (cityA !== cityB) return cityA.localeCompare(cityB);

            const locA = (a.location_name || '').toLowerCase();
            const locB = (b.location_name || '').toLowerCase();
            return locA.localeCompare(locB);
        });
    }, [screens, selectedLocation]);

    return (
        <div className="flex flex-col h-full overflow-hidden gap-3">

            {/* Folders Card - grows to fill available space */}
            <div className="bg-white rounded-2xl border border-indigo-100/80 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-indigo-100/60 shrink-0 bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-indigo-50/40">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                            <FolderOpen className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h3 className="font-bold text-sm text-indigo-900 tracking-tight">Foldere</h3>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => openFolderDialog()}
                            className="p-1.5 hover:bg-indigo-100/60 rounded-lg transition-all hover:scale-105 active:scale-95"
                            title="Folder nou"
                        >
                            <FolderPlus className="w-4 h-4 text-indigo-600" />
                        </button>
                    )}
                </div>

                <div className="p-2 flex-1 overflow-y-auto custom-scrollbar">
                    {/* All Content */}
                    <button
                        onClick={() => setSelectedFolder(null)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all mb-1.5 ${!selectedFolder
                            ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-sm border border-indigo-100/60'
                            : 'hover:bg-slate-50 text-slate-600'
                            }`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('bg-indigo-200', 'scale-[1.02]');
                        }}
                        onDragLeave={(e) => {
                            e.currentTarget.classList.remove('bg-indigo-200', 'scale-[1.02]');
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('bg-indigo-200', 'scale-[1.02]');
                            const contentId = e.dataTransfer.getData('contentId');
                            if (contentId) {
                                handleMoveToFolder(contentId, null);
                            }
                        }}
                    >
                        <FolderOpen className="w-4 h-4 shrink-0" />
                        <span className="flex-1 text-left text-sm font-semibold truncate">Toate fișierele</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${!selectedFolder ? 'bg-indigo-200/70 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                            {content.length}
                        </span>
                    </button>

                    {/* Folder List */}
                    <div className="space-y-0.5">
                        {folders.map(folder => {
                            const folderContent = content.filter(item => String(item.folder_id) === String(folder.id));
                            const isSelected = selectedFolder?.id === folder.id;
                            const isIconUrl = folder.icon && (folder.icon.startsWith('http') || folder.icon.startsWith('/') || folder.icon.startsWith('data:'));

                            return (
                                <div
                                    key={folder.id}
                                    className={`relative flex items-center px-3 py-2 rounded-xl transition-all group/f ${isSelected
                                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 shadow-sm border border-indigo-100/60'
                                        : 'hover:bg-slate-50'
                                        }`}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.classList.add('bg-indigo-200', 'scale-[1.02]');
                                    }}
                                    onDragLeave={(e) => {
                                        e.currentTarget.classList.remove('bg-indigo-200', 'scale-[1.02]');
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('bg-indigo-200', 'scale-[1.02]');
                                        const contentId = e.dataTransfer.getData('contentId');
                                        if (contentId) {
                                            handleMoveToFolder(contentId, folder.id);
                                        }
                                    }}
                                >
                                    <button
                                        onClick={() => setSelectedFolder(folder)}
                                        className="flex-1 flex items-center gap-3 text-left min-w-0 pr-8"
                                    >
                                        {isIconUrl ? (
                                            <div className="w-5 h-5 rounded-md overflow-hidden shrink-0 border border-slate-200/60 bg-white shadow-sm">
                                                <img src={folder.icon} alt={folder.name} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <Folder className="w-4 h-4 shrink-0 transition-transform group-hover/f:scale-110" style={{ color: folder.color }} fill={folder.color} />
                                        )}
                                        <span className="flex-1 text-sm font-medium text-slate-700 break-words leading-tight">{folder.name}</span>
                                    </button>

                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-inherit rounded-lg">
                                        {isAdmin && (
                                            <div className="flex gap-0.5 opacity-0 group-hover/f:opacity-100 transition-all bg-inherit px-0.5">
                                                <button
                                                    onClick={() => onAddContent(folder)}
                                                    className="p-1 hover:bg-white rounded-md transition-colors"
                                                    title="Adaugă conținut"
                                                >
                                                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                                                </button>
                                                <button
                                                    onClick={() => openFolderDialog(folder)}
                                                    className="p-1 hover:bg-white rounded-md transition-colors"
                                                    title="Editează"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFolder(folder.id)}
                                                    className="p-1 hover:bg-rose-50 rounded-md transition-colors"
                                                    title="Șterge"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                                </button>
                                            </div>
                                        )}
                                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 min-w-[24px] text-center font-bold ${isSelected ? 'bg-indigo-200/70 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {folderContent.length}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {folders.length === 0 && (
                            <p className="text-[10px] text-slate-400 text-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                Niciun folder
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Screens Card - equal height with Folders */}
            <div className="bg-white rounded-2xl border border-emerald-100/80 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-emerald-100/60 shrink-0 bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-emerald-50/40">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                            <Monitor className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h3 className="font-bold text-sm text-emerald-900 tracking-tight">Ecrane</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onRefresh}
                            className="p-1.5 hover:bg-emerald-100/60 rounded-lg transition-all text-emerald-500 hover:text-emerald-700 group/refresh hover:scale-105 active:scale-95"
                            title="Refresh"
                        >
                            <RefreshCw className="w-3.5 h-3.5 group-hover/refresh:rotate-180 transition-transform duration-500" />
                        </button>
                        {locations.length > 0 && (
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className="text-[10px] border border-emerald-200/80 rounded-lg px-2 py-1 bg-white/80 text-slate-600 focus:outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-100 cursor-pointer max-w-[80px] transition-all"
                            >
                                <option value="all">Toate</option>
                                {locations.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        )}
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200/60">
                            {filteredScreens.length}
                        </span>
                    </div>
                </div>

                <div className="p-2 grid grid-cols-2 gap-2 flex-1 overflow-y-auto custom-scrollbar content-start">
                    {filteredScreens.map(screen => (
                        <div
                            key={screen.id}
                            className={`rounded-xl p-2.5 transition-all cursor-default group/s flex flex-col border ${screen.status === 'online'
                                ? 'bg-gradient-to-br from-white to-emerald-50/30 border-emerald-100/60 hover:border-emerald-300 hover:shadow-sm'
                                : 'bg-white border-slate-100 hover:border-slate-200'
                                }`}
                            style={{ minHeight: '72px' }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add('border-indigo-500', 'bg-indigo-50/50', 'shadow-md');
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50/50', 'shadow-md');
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50/50', 'shadow-md');
                                const contentId = e.dataTransfer.getData('contentId');
                                if (contentId && onAssignToScreen) {
                                    onAssignToScreen(contentId, screen.id);
                                }
                            }}
                        >
                            <div className="flex items-start gap-2 flex-1">
                                <div className={`p-1.5 rounded-lg shrink-0 ${screen.status === 'online' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <Monitor className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                                    <p className="text-[11px] font-bold text-slate-800 leading-tight mb-1.5 line-clamp-2">{screen.name}</p>
                                    <div className="flex flex-col gap-1 mt-auto">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${screen.status === 'online' ? 'bg-emerald-500 animate-pulse shadow-sm shadow-emerald-300' : 'bg-slate-300'}`} />
                                            <p className={`text-[8px] uppercase tracking-wider font-bold ${screen.status === 'online' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {screen.status === 'online' ? 'Online' : 'Offline'}
                                            </p>
                                        </div>
                                        {screen.current_content_title && (
                                            <p className="text-[8px] text-indigo-600 font-medium truncate bg-indigo-50 px-1.5 py-0.5 rounded-md">
                                                {screen.current_content_title}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredScreens.length === 0 && (
                        <p className="text-[10px] text-slate-400 text-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 col-span-2">
                            Niciun ecran găsit
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
