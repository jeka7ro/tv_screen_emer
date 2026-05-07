import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

export const ViewToggle = ({ viewMode, setViewMode }) => {
    return (
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600 dark:text-slate-400'
                    }`}
                title="Grid View"
            >
                <LayoutGrid className="w-4 h-4" />
            </button>
            <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600 dark:text-slate-400'
                    }`}
                title="List View"
            >
                <List className="w-4 h-4" />
            </button>
        </div>
    );
};
