import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

export const ViewToggle = ({ viewMode, setViewMode }) => {
    return (
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                title="Grid View"
            >
                <LayoutGrid className="w-4 h-4" />
            </button>
            <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                title="List View"
            >
                <List className="w-4 h-4" />
            </button>
        </div>
    );
};
