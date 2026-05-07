import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

export const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = 'Confirmare', 
    message = 'Sigur dorești să efectuezi această acțiune?',
    confirmText = 'Confirmă',
    cancelText = 'Anulează',
    isDanger = true
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="modal-panel max-w-sm">
                <DialogHeader className="flex flex-col items-center text-center gap-3">
                    {isDanger && (
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-1">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                    )}
                    <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400">
                        {message}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex gap-3 mt-6">
                    <Button 
                        type="button" 
                        onClick={onClose} 
                        className="flex-1 btn-secondary"
                    >
                        {cancelText}
                    </Button>
                    <Button 
                        type="button" 
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }} 
                        className={`flex-1 ${isDanger ? 'bg-red-600 hover:bg-red-700 text-white shadow-md rounded-full px-6 py-2.5 font-medium transition-transform hover:scale-105 active:scale-95' : 'btn-primary'}`}
                    >
                        {confirmText}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
