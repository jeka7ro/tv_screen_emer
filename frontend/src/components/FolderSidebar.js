import React from 'react';
import { Folder, FolderPlus, FolderOpen, Edit2, Trash2 } from 'lucide-react';
import api from '../utils/api';

export const FolderSidebar = ({
    folders,
    selectedFolder,
    setSelectedFolder,
    content,
    isAdmin,
    openFolderDialog,
    handleDeleteFolder,
    isCollapsed,
    setIsCollapsed,
    onRefresh
}) => {
    const toggleCollapse = () => setIsCollapsed(!isCollapsed);
    return (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto">
            <div className={`flex items-center mb-4 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && <h3 className="font-semibold text-slate-800">Foldere</h3>}
                <div className="flex items-center gap-1">
                    {isAdmin && !isCollapsed && (
                        <button
                            onClick={() => openFolderDialog()}
                            className="p-1.5 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Folder nou"
                        >
                            <FolderPlus className="w-4 h-4 text-indigo-600" />
                        </button>
                    )}
                    <button
                        onClick={toggleCollapse}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? <FolderOpen className="w-4 h-4" /> : <ListIcon className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* All Content */}
            <button
                onClick={() => setSelectedFolder(null)}
                className={`w-full flex items-center transition-colors mb-2 ${isCollapsed ? 'justify-center p-2 rounded-xl' : 'gap-3 px-3 py-2 rounded-lg'} ${!selectedFolder ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                title="Toate fișierele"
            >
                <FolderOpen className="w-4 h-4 shrink-0" />
                {!isCollapsed && (
                    <>
                        <span className="flex-1 text-left text-sm font-medium">Toate fișierele</span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded-full">{content.length}</span>
                    </>
                )}
            </button>

            {/* Folder List */}
            <div className="space-y-1">
                {folders.map(folder => {
                    const folderContent = content.filter(item => item.folder_id === folder.id);
                    const isSelected = selectedFolder?.id === folder.id;
                    return (
                        <div
                            key={folder.id}
                            className={`flex items-center transition-all group/f ${isCollapsed ? 'justify-center p-2 rounded-xl' : 'gap-2 px-3 py-2 rounded-lg'} ${isSelected ? 'bg-indigo-100 shadow-sm' : 'hover:bg-slate-50'
                                }`}
                            title={folder.name}
                        >
                            <button
                                onClick={() => setSelectedFolder(folder)}
                                className={`flex-1 flex items-center text-left overflow-hidden ${isCollapsed ? 'justify-center' : 'gap-3'}`}
                            >
                                <Folder className="w-4 h-4 shrink-0 transition-transform group-hover/f:scale-110" style={{ color: folder.color }} />
                                {!isCollapsed && (
                                    <>
                                        <span className="flex-1 text-sm font-medium text-slate-700 truncate">{folder.name}</span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>
                                            {folderContent.length}
                                        </span>
                                    </>
                                )}
                            </button>
                            {isAdmin && !isCollapsed && (
                                <div className="flex gap-1 opacity-0 group-hover/f:opacity-100 transition-opacity">
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
                <p className="text-xs text-slate-400 text-center py-8 bg-slate-50/50 rounded-xl mt-2 border border-dashed border-slate-200">
                    Niciun folder creat
                </p>
            )}
        </div>
    );
};
