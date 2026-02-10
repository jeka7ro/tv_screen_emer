import React from 'react';
import { Folder, FolderPlus, FolderOpen, Edit2, Trash2 } from 'lucide-react';

export const FolderSidebar = ({
    folders,
    selectedFolder,
    setSelectedFolder,
    content,
    isAdmin,
    openFolderDialog,
    handleDeleteFolder
}) => {
    return (
        <div className="w-64 flex-shrink-0">
            <div className="glass-card p-4 sticky top-6">
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
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-2 ${!selectedFolder ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                >
                    <FolderOpen className="w-4 h-4" />
                    <span className="flex-1 text-left text-sm font-medium">Toate fișierele</span>
                    <span className="text-xs text-slate-500">{content.length}</span>
                </button>

                {/* Folder List */}
                <div className="space-y-1">
                    {folders.map(folder => {
                        const folderContent = content.filter(item => item.folder_id === folder.id);
                        return (
                            <div
                                key={folder.id}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${selectedFolder?.id === folder.id ? 'bg-indigo-100' : 'hover:bg-slate-50'
                                    }`}
                            >
                                <button
                                    onClick={() => setSelectedFolder(folder)}
                                    className="flex-1 flex items-center gap-3 text-left"
                                >
                                    <Folder className="w-4 h-4" style={{ color: folder.color }} />
                                    <span className="flex-1 text-sm font-medium text-slate-700 truncate">{folder.name}</span>
                                    <span className="text-xs text-slate-500">{folderContent.length}</span>
                                </button>
                                {isAdmin && (
                                    <div className="flex gap-1">
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
                </div>

                {folders.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">
                        Niciun folder creat
                    </p>
                )}
            </div>
        </div>
    );
};
