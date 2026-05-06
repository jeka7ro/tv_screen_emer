import React, { useState, useCallback, useRef } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';

export const useConfirm = () => {
    const [config, setConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirmă',
        isDanger: true
    });
    
    const resolver = useRef(null);

    const confirm = useCallback(({ title, message, confirmText = 'Confirmă', isDanger = true }) => {
        return new Promise((resolve) => {
            resolver.current = resolve;
            setConfig({
                isOpen: true,
                title: title || 'Confirmare',
                message,
                confirmText,
                isDanger
            });
        });
    }, []);

    const handleConfirm = () => {
        if (resolver.current) resolver.current(true);
        setConfig(prev => ({ ...prev, isOpen: false }));
    };

    const handleClose = () => {
        if (resolver.current) resolver.current(false);
        setConfig(prev => ({ ...prev, isOpen: false }));
    };

    const ConfirmDialog = () => (
        <ConfirmModal 
            isOpen={config.isOpen}
            title={config.title}
            message={config.message}
            confirmText={config.confirmText}
            isDanger={config.isDanger}
            onClose={handleClose}
            onConfirm={handleConfirm}
        />
    );

    return { confirm, ConfirmDialog };
};
