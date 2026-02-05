import { useState, useEffect } from 'react';

export const useViewMode = (key, defaultMode = 'grid') => {
    const [viewMode, setViewMode] = useState(() => {
        return localStorage.getItem(key) || defaultMode;
    });

    useEffect(() => {
        localStorage.setItem(key, viewMode);
    }, [key, viewMode]);

    return [viewMode, setViewMode];
};
