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
    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-4">
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
                <FolderOpen className="w-4 h-4" />
                <span className="flex-1 text-left text-sm font-medium">Toate fișierele</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded-full">{content.length}</span>
            </button>

            {/* Folder List */}
            <div className="space-y-1 mb-6">
                {folders.map(folder => {
                    const folderContent = content.filter(item => String(item.folder_id) === String(folder.id));
                    const isSelected = selectedFolder?.id === folder.id;
                    const isIconUrl = folder.icon && (folder.icon.startsWith('http') || folder.icon.startsWith('/') || folder.icon.startsWith('data:'));

                    return (
                        <div
                            key={folder.id}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all group/f ${isSelected ? 'bg-indigo-100 shadow-sm' : 'hover:bg-slate-50'
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
                                className="flex-1 flex items-center gap-3 text-left overflow-hidden"
                            >
                                {isIconUrl ? (
                                    <div className="w-5 h-5 rounded-md overflow-hidden shrink-0 border border-slate-200/60 bg-white">
                                        <img src={folder.icon} alt={folder.name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <Folder className="w-4 h-4 shrink-0 transition-transform group-hover/f:scale-110" style={{ color: folder.color }} fill={folder.color} />
                                )}
                                <span className="flex-1 text-sm font-medium text-slate-700 md:truncate">{folder.name}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>
                                    {folderContent.length}
                                </span>
                            </button>
                            {isAdmin && (
                                <div className="flex gap-1 opacity-0 group-hover/f:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onAddContent(folder)}
                                        className="p-1 hover:bg-indigo-50 rounded transition-colors"
                                        title="Adaugă conținut"
                                    >
                                        <Plus className="w-3 h-3 text-indigo-600" />
                                    </button>
                                    <button
                                        onClick={() => openFolderDialog(folder)}
                                        className="p-1 hover:bg-white rounded transition-colors"
                                        title="Editează"
                                    >
                                        <Edit2 className="w-3 h-3 text-slate-500" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteFolder(folder.id)}
                                        className="p-1 hover:bg-rose-50 rounded transition-colors"
                                        title="Șterge"
                                    >
                                        <Trash2 className="w-3 h-3 text-rose-500" />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
                {folders.length === 0 && (
                    <p className="text-[10px] text-slate-400 text-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        Niciun folder
                    </p>
                )}
            </div>

            {/* Screens Section */}
            <div className="mt-auto border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="font-semibold text-slate-800 text-sm">Ecrane</h3>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                        {screens.length}
                    </span>
                </div>

                <div className="space-y-2">
                    {screens.map(screen => (
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
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${screen.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                            {screen.status === 'online' ? 'Online' : 'Offline'}
                                        </p>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover/s:opacity-100 transition-opacity">
                                    <div className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                                        Trage aici
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {screens.length === 0 && (
                        <p className="text-[10px] text-slate-400 text-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            Niciun ecran găsit
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
