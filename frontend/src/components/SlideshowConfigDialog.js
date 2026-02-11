import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Film, Globe, FileImage, Video } from 'lucide-react';

export const SlideshowConfigDialog = ({ open, onOpenChange, onConfirm, count, selectedContent = [] }) => {
    const [useTimer, setUseTimer] = React.useState(true);
    const [duration, setDuration] = React.useState(10);
    const [timeUnit, setTimeUnit] = React.useState('seconds');
    const [transition, setTransition] = React.useState('fade');

    // Helper to get file URL (same as in Content.js)
    const getFileUrl = (fileUrl) => {
        if (!fileUrl) return '';
        if (fileUrl.startsWith('http')) return fileUrl;
        if (fileUrl.startsWith('/')) return fileUrl;
        return fileUrl;
    };

    const handleConfirm = () => {
        // Convert to seconds if minutes selected
        const durationInSeconds = timeUnit === 'minutes' ? duration * 60 : duration;
        onConfirm({
            duration: useTimer ? durationInSeconds : 10,
            transition,
            useTimer
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Configurare Slideshow</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="item-count" className="text-right">
                            Fișiere
                        </Label>
                        <div className="col-span-3 text-sm font-medium text-slate-700">
                            {count} elemente selectate
                        </div>
                    </div>

                    {/* Content Preview Grid */}
                    {selectedContent.length > 0 && (
                        <div className="col-span-4 border-t border-b border-slate-200 py-4">
                            <Label className="text-sm font-semibold text-slate-700 mb-3 block">
                                Preview conținut
                            </Label>
                            <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
                                {selectedContent.map((item) => (
                                    <div
                                        key={item.id}
                                        className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50 hover:border-indigo-300 transition-all"
                                    >
                                        {/* Preview Image/Video */}
                                        <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                            {item.type === 'youtube' ? (
                                                <div className="w-full h-full bg-red-600 flex items-center justify-center">
                                                    <Film className="w-8 h-8 text-white" />
                                                </div>
                                            ) : item.type === 'web' ? (
                                                <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                                                    <Globe className="w-8 h-8 text-white" />
                                                </div>
                                            ) : item.type === 'image' ? (
                                                <img
                                                    src={getFileUrl(item.file_url)}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="relative w-full h-full">
                                                    <video
                                                        src={getFileUrl(item.file_url)}
                                                        className="w-full h-full object-cover"
                                                        muted
                                                    />
                                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                        <div className="bg-white/90 rounded-full p-2">
                                                            <Video className="w-6 h-6 text-slate-800" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content Type Badge */}
                                        <div className="absolute top-1 right-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.type === 'youtube' ? 'bg-red-600 text-white' :
                                                    item.type === 'web' ? 'bg-blue-600 text-white' :
                                                        item.type === 'image' ? 'bg-green-600 text-white' :
                                                            'bg-purple-600 text-white'
                                                }`}>
                                                {item.type === 'youtube' ? 'YT' :
                                                    item.type === 'web' ? 'WEB' :
                                                        item.type === 'image' ? 'IMG' : 'VID'}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <div className="p-2 bg-white">
                                            <p className="text-xs text-slate-700 truncate font-medium">
                                                {item.title}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timer Checkbox */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="use-timer" className="text-right">
                            Timer
                        </Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <input
                                id="use-timer"
                                type="checkbox"
                                checked={useTimer}
                                onChange={(e) => setUseTimer(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-slate-600">
                                Activează schimbarea automată
                            </span>
                        </div>
                    </div>

                    {/* Duration Input - Only show if timer is enabled */}
                    {useTimer && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="duration" className="text-right">
                                Durată
                            </Label>
                            <div className="col-span-3 flex gap-2">
                                <Input
                                    id="duration"
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                    className="flex-1"
                                    min={1}
                                />
                                <Select value={timeUnit} onValueChange={setTimeUnit}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="seconds">Secunde</SelectItem>
                                        <SelectItem value="minutes">Minute</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Transition Effects */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="transition" className="text-right">
                            Efect tranziție
                        </Label>
                        <Select value={transition} onValueChange={setTransition}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selectează efectul" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Fără efect</SelectItem>
                                <SelectItem value="fade">Fade (Estompare)</SelectItem>
                                <SelectItem value="slide-left">Slide Stânga</SelectItem>
                                <SelectItem value="slide-right">Slide Dreapta</SelectItem>
                                <SelectItem value="slide-up">Slide Sus</SelectItem>
                                <SelectItem value="slide-down">Slide Jos</SelectItem>
                                <SelectItem value="zoom">Zoom</SelectItem>
                                <SelectItem value="flip">Flip (Întoarcere)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Anulează
                    </Button>
                    <Button onClick={handleConfirm} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        Creează Playlist
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
