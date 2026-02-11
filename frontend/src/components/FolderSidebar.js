import React from 'react';
import { Folder, FolderPlus, FolderOpen, Edit2, Trash2, List as ListIcon, Plus, Monitor } from 'lucide-react';
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
        <div className="flex flex-col min-h-0 overflow-y-auto custom-scrollbar px-1 pb-4 gap-4">

            {/* Folders Card */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800">Foldere</h3>
                    {isAdmin && (
                        <button
                            onClick={() => openFolderDialog()}
                            className="p-1.5 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Folder nou"
                        >
                            <FolderPlus className="w-4 h-4 text-indigo-600" />
                        </button>
                    )}
                </div>

                {/* All Content */}
                <button
                    onClick={() => setSelectedFolder(null)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all mb-2 ${!selectedFolder ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'hover:bg-slate-50 text-slate-700'
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
                            handleMoveToFolder(contentId, null); // Move to root
                        }
                    }}
                >
                    <FolderOpen className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left text-sm font-medium truncate">Toate fișierele</span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded-full shrink-0">{content.length}</span>
                </button>

                {/* Folder List */}
                <div className="space-y-1 flex-1 overflow-y-auto">
                    {folders.map(folder => {
                        const folderContent = content.filter(item => String(item.folder_id) === String(folder.id));
                        const isSelected = selectedFolder?.id === folder.id;
                        const isIconUrl = folder.icon && (folder.icon.startsWith('http') || folder.icon.startsWith('/') || folder.icon.startsWith('data:'));

                        return (
                            <div
                                key={folder.id}
                                className={`relative flex items-center px-3 py-2 rounded-lg transition-all group/f ${isSelected ? 'bg-indigo-100 shadow-sm' : 'hover:bg-slate-50'
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
                                        <div className="w-5 h-5 rounded-md overflow-hidden shrink-0 border border-slate-200/60 bg-white">
                                            <img src={folder.icon} alt={folder.name} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <Folder className="w-4 h-4 shrink-0 transition-transform group-hover/f:scale-110" style={{ color: folder.color }} fill={folder.color} />
                                    )}
                                    <span className="flex-1 text-sm font-medium text-slate-700 break-words leading-tight">{folder.name}</span>
                                </button>

                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-inherit rounded-lg">
                                    {isAdmin && (
                                        <div className="flex gap-0.5 opacity-0 group-hover/f:opacity-100 transition-all bg-inherit px-1">
                                            <button
                                                onClick={() => onAddContent(folder)}
                                                className="p-1 hover:bg-white rounded transition-colors"
                                                title="Adaugă conținut"
                                            >
                                                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                                            </button>
                                            <button
                                                onClick={() => openFolderDialog(folder)}
                                                className="p-1 hover:bg-white rounded transition-colors"
                                                title="Editează"
                                            >
                                                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFolder(folder.id)}
                                                className="p-1 hover:bg-rose-50 rounded transition-colors"
                                                title="Șterge"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                            </button>
                                        </div>
                                    )}
                                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 min-w-[24px] text-center font-semibold ${isSelected ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>
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

            {/* Screens Card */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="font-semibold text-slate-800 text-sm">Ecrane</h3>
                    <div className="flex items-center gap-2">
                        {locations.length > 0 && (
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className="text-[10px] border border-slate-200 rounded-md px-1.5 py-0.5 bg-slate-50 text-slate-600 focus:outline-none focus:border-indigo-300 cursor-pointer max-w-[100px]"
                            >
                                <option value="all">Toate</option>
                                {locations.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        )}
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            {filteredScreens.length}
                        </span>
                    </div>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto">
                    {filteredScreens.map(screen => (
                        <div
                            key={screen.id}
                            className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-default group/s"
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add('border-indigo-500', 'bg-indigo-50/50', 'scale-[1.02]');
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50/50', 'scale-[1.02]');
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50/50', 'scale-[1.02]');
                                const contentId = e.dataTransfer.getData('contentId');
                                if (contentId && onAssignToScreen) {
                                    onAssignToScreen(contentId, screen.id);
                                }
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${screen.status === 'online' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                                    <Monitor className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 truncate">{screen.name}</p>

                                    {/* City • Location */}
                                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                        {[screen.city, screen.location_name].filter(Boolean).join(' • ') || 'Fără locație'}
                                    </p>

                                    {/* Current Content */}
                                    {screen.current_content_title && (
                                        <div className="flex items-center gap-1 mt-1 text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md w-fit max-w-full">
                                            <span className="font-medium truncate block max-w-full">
                                                Playing: {screen.current_content_title}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ${screen.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                            {screen.status === 'online' ? 'Online' : 'Offline'}
                                        </p>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover/s:opacity-100 transition-opacity">
                                    <div className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                                        Trage
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredScreens.length === 0 && (
                        <p className="text-[10px] text-slate-400 text-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            Niciun ecran găsit
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
