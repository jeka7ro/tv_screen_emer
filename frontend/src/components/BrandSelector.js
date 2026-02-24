import React from 'react';
import { Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export const BrandSelector = ({ brands, value, onValueChange, placeholder = "Selectează brand", className = "", style }) => {
    // Find selected brand for display
    const selectedBrand = brands.find(b => b.id === value);

    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className={className} style={style} data-testid="brand-select">
                <SelectValue placeholder={placeholder}>
                    {selectedBrand && (
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center bg-white overflow-hidden flex-shrink-0">
                                {selectedBrand.logo_url ? (
                                    <img
                                        src={selectedBrand.logo_url}
                                        alt={selectedBrand.name}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <Building2 className="w-3 h-3 text-slate-400" />
                                )}
                            </div>
                            <span className="truncate">{selectedBrand.name}</span>
                        </div>
                    )}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="none">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center bg-slate-50 flex-shrink-0">
                            <Building2 className="w-3 h-3 text-slate-400" />
                        </div>
                        <span className="text-slate-700 italic">Niciun brand</span>
                    </div>
                </SelectItem>
                {brands.map(brand => (
                    <SelectItem key={brand.id} value={brand.id}>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center bg-white overflow-hidden flex-shrink-0">
                                {brand.logo_url ? (
                                    <img
                                        src={brand.logo_url}
                                        alt={brand.name}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <Building2 className="w-3 h-3 text-slate-400" />
                                )}
                            </div>
                            <span className="truncate text-slate-800">{brand.name}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};
