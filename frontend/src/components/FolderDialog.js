import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

export const FolderDialog = ({
    showFolderDialog,
    setShowFolderDialog,
    editingFolder,
    folderFormData,
    setFolderFormData,
    handleCreateFolder,
    handleUpdateFolder,
    handleIconUpload
}) => {
    const fileInputRef = useRef(null);
    const colorOptions = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const onFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleIconUpload(file);
        }
    };

    return (
        <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
            <DialogContent className="glass-panel max-w-md">
                <DialogHeader>
                    <DialogTitle>{editingFolder ? 'Editează folder' : 'Folder nou'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={editingFolder ? handleUpdateFolder : handleCreateFolder} className="space-y-5">
                    <div>
                        <Label className="text-sm font-semibold text-slate-700">Nume folder</Label>
                        <Input
                            className="mt-1.5"
                            value={folderFormData.name}
                            onChange={(e) => setFolderFormData({ ...folderFormData, name: e.target.value })}
                            placeholder="Ex: Imagini produse"
                            required
                        />
                    </div>
                    <div>
                        <Label className="text-sm font-semibold text-slate-700">Descriere (opțional)</Label>
                        <Input
                            className="mt-1.5"
                            value={folderFormData.description}
                            onChange={(e) => setFolderFormData({ ...folderFormData, description: e.target.value })}
                            placeholder="Ex: Poze cu produsele noastre"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-sm font-semibold text-slate-700">Iconiță Folder (Imagine / Link)</Label>

                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative group">
                                {folderFormData.icon && folderFormData.icon !== 'folder' ? (
                                    <>
                                        <img src={folderFormData.icon} alt="Icon" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFolderFormData({ ...folderFormData, icon: 'folder' })}
                                            className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} />
                                        </button>
                                    </>
                                ) : (
                                    <ImageIcon className="w-6 h-6 text-slate-300" />
                                )}
                            </div>

                            <div className="flex-1 space-y-2">
                                <Input
                                    className="text-xs h-8"
                                    value={folderFormData.icon === 'folder' ? '' : folderFormData.icon}
                                    onChange={(e) => setFolderFormData({ ...folderFormData, icon: e.target.value || 'folder' })}
                                    placeholder="Pastează link imagine..."
                                />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={onFileSelect}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-xs h-8 flex items-center gap-2"
                                    >
                                        <Upload size={14} />
                                        Încarcă fișier
                                    </Button>
                                    {folderFormData.icon && folderFormData.icon !== 'folder' && (
                                        <span className="text-[10px] text-green-600 font-medium">Iconiță setată!</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-semibold text-slate-700">Culoare (pentru iconița standard)</Label>
                        <div className="flex gap-2 mt-2">
                            {colorOptions.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFolderFormData({ ...folderFormData, color })}
                                    className={`w-9 h-9 rounded-lg transition-all hover:scale-110 ${folderFormData.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                                        }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" className="btn-primary flex-1 h-11">
                            {editingFolder ? 'Actualizează' : 'Creează Folder'}
                        </Button>
                        <Button type="button" onClick={() => setShowFolderDialog(false)} className="btn-secondary h-11">
                            Anulează
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
