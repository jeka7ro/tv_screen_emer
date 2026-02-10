import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export const FolderDialog = ({
    showFolderDialog,
    setShowFolderDialog,
    editingFolder,
    folderFormData,
    setFolderFormData,
    handleCreateFolder,
    handleUpdateFolder
}) => {
    const colorOptions = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
            <DialogContent className="glass-panel">
                <DialogHeader>
                    <DialogTitle>{editingFolder ? 'Editează folder' : 'Folder nou'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={editingFolder ? handleUpdateFolder : handleCreateFolder} className="space-y-4">
                    <div>
                        <Label>Nume folder</Label>
                        <Input
                            value={folderFormData.name}
                            onChange={(e) => setFolderFormData({ ...folderFormData, name: e.target.value })}
                            placeholder="Imagini produse"
                            required
                        />
                    </div>
                    <div>
                        <Label>Descriere (opțional)</Label>
                        <Input
                            value={folderFormData.description}
                            onChange={(e) => setFolderFormData({ ...folderFormData, description: e.target.value })}
                            placeholder="Poze cu produsele noastre"
                        />
                    </div>
                    <div>
                        <Label>Culoare</Label>
                        <div className="flex gap-2 mt-2">
                            {colorOptions.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFolderFormData({ ...folderFormData, color })}
                                    className={`w-10 h-10 rounded-lg transition-all hover:scale-110 ${folderFormData.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                                        }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button type="submit" className="btn-primary flex-1">
                            {editingFolder ? 'Actualizează' : 'Creează'}
                        </Button>
                        <Button type="button" onClick={() => setShowFolderDialog(false)} className="btn-secondary">
                            Anulează
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
