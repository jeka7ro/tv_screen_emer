import React, { useState, useMemo } from 'react';
import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    isSameMonth,
    addWeeks,
    subWeeks,
    addMonths,
    subMonths,
    parse,
    isWithinInterval
} from 'date-fns';
import { ro } from 'date-fns/locale';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    PlaySquare
} from 'lucide-react';

export const EventsCalendar = ({
    playlists = [],
    happyHours = [],
    loading = false,
    defaultView = 'week',
    onEventClick = () => { }
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarView, setCalendarView] = useState(defaultView);

    const calculateEffectiveHours = (playlist, dayDate) => {
        if (!playlist.is_scheduled || !playlist.start_at) return null;

        const startLimit = new Date(dayDate);
        startLimit.setHours(10, 0, 0, 0);
        const endLimit = new Date(dayDate);
        endLimit.setHours(22, 0, 0, 0);

        const pStart = new Date(playlist.start_at);
        const pEnd = playlist.end_at ? new Date(playlist.end_at) : endLimit;

        const effectiveStart = new Date(Math.max(pStart.getTime(), startLimit.getTime()));
        const effectiveEnd = new Date(Math.min(pEnd.getTime(), endLimit.getTime()));

        if (effectiveStart >= effectiveEnd) return null;

        const durationMs = effectiveEnd - effectiveStart;
        const hours = (durationMs / (1000 * 60 * 60)).toFixed(1);

        return {
            start: format(effectiveStart, 'HH:mm'),
            end: format(effectiveEnd, 'HH:mm'),
            hours: parseFloat(hours).toString() + 'h'
        };
    };

    const getEventsForDay = (day) => {
        // 1. Filter Playlists
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const playlistEvents = playlists
            .filter(p => {
                if (!p.is_scheduled || !p.start_at) return false;
                const start = new Date(p.start_at);
                const end = p.end_at ? new Date(p.end_at) : null;
                return start <= dayEnd && (!end || end >= dayStart);
            })
            .map(p => ({
                id: `p-${p.id}`,
                type: 'playlist',
                name: p.name,
                color: p.color || '#EF4444',
                brand: p.brand,
                startTime: format(new Date(p.start_at), 'HH:mm'),
                endTime: p.end_at ? format(new Date(p.end_at), 'HH:mm') : '22:00',
                original: p,
                hours: calculateEffectiveHours(p, day)?.hours
            }));

        // 2. Filter Happy Hours (Recurring)
        const dayOfWeek = day.getDay() === 0 ? 7 : day.getDay(); // 1=Mon, 7=Sun
        const happyHourEvents = happyHours
            .filter(h => h.active && (h.days_of_week || []).includes(dayOfWeek))
            .map(h => ({
                id: `h-${h.id}`,
                type: 'happy_hour',
                name: `HH: ${h.name}`,
                color: '#F97316', // Orange for Happy Hour
                startTime: h.start_time.substring(0, 5),
                endTime: h.end_time.substring(0, 5),
                original: h,
                hours: '' // Optional logic for duration calculation
            }));

        return [...playlistEvents, ...happyHourEvents].sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center min-h-[400px]">
                <div className="spinner mb-4"></div>
                <p className="text-slate-500 font-medium">Se încarcă calendarul...</p>
            </div>
        );
    }

    const isToday = (day) => isSameDay(day, new Date());

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4 relative overflow-hidden transition-all duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-50 rounded-2xl shadow-sm shadow-red-100/50">
                        <CalendarIcon className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 capitalize tracking-tight leading-none mb-1.5">
                            {calendarView === 'week' ? (
                                `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM', { locale: ro })} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM yyyy', { locale: ro })}`
                            ) : calendarView === 'month' ? (
                                format(currentDate, 'MMMM yyyy', { locale: ro })
                            ) : (
                                format(currentDate, 'EEEE, d MMMM', { locale: ro })
                            )}
                        </h3>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                {calendarView === 'week' ? 'Program Săptămânal' : calendarView === 'month' ? 'Prezentare Lunară' : 'Program Zilnic'}
                            </span>
                            <div className="flex bg-slate-100 rounded-xl p-1 shadow-inner">
                                {['week', 'month', 'day'].map(view => (
                                    <button
                                        key={view}
                                        onClick={() => setCalendarView(view)}
                                        className={`px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${calendarView === view ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {view === 'week' ? 'Săpt' : view === 'month' ? 'Lună' : 'Zi'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                    <button
                        onClick={() => setCurrentDate(curr => {
                            if (calendarView === 'week') return subWeeks(curr, 1);
                            if (calendarView === 'month') return subMonths(curr, 1);
                            const prev = new Date(curr);
                            prev.setDate(prev.getDate() - 1);
                            return prev;
                        })}
                        className="p-2 hover:bg-white rounded-xl transition-all text-slate-500 hover:text-red-600 shadow-sm hover:shadow"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-5 text-xs font-black text-slate-600 hover:text-red-600 transition-colors uppercase tracking-widest"
                    >
                        Azi
                    </button>
                    <button
                        onClick={() => setCurrentDate(curr => {
                            if (calendarView === 'week') return addWeeks(curr, 1);
                            if (calendarView === 'month') return addMonths(curr, 1);
                            const next = new Date(curr);
                            next.setDate(next.getDate() + 1);
                            return next;
                        })}
                        className="p-2 hover:bg-white rounded-xl transition-all text-slate-500 hover:text-red-600 shadow-sm hover:shadow"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {calendarView === 'week' ? (
                <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden mt-2">
                    {eachDayOfInterval({
                        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
                        end: endOfWeek(currentDate, { weekStartsOn: 1 })
                    }).map((day, idx) => {
                        const dayEvents = getEventsForDay(day);
                        const isDayToday = isToday(day);

                        return (
                            <div key={idx} className={`bg-white min-h-[160px] p-2 flex flex-col gap-2 transition-colors ${isDayToday ? 'bg-red-50/20' : ''}`} onClick={() => { setCurrentDate(day); setCalendarView('day'); }}>
                                <div className={`text-center mb-1 p-2 rounded-xl border ${isDayToday ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{format(day, 'EEE', { locale: ro })}</div>
                                    <div className={`text-lg font-black ${isDayToday ? 'text-red-600' : 'text-slate-800'}`}>{format(day, 'd')}</div>
                                </div>

                                <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[220px] scrollbar-hide pr-1">
                                    {dayEvents.map(event => (
                                        <div key={event.id}
                                            className="rounded-xl p-2 transition-all cursor-pointer group border shadow-sm hover:shadow-md"
                                            style={{
                                                backgroundColor: `${event.color}10`,
                                                borderColor: `${event.color}30`,
                                                borderLeftWidth: '4px',
                                                borderLeftColor: event.color
                                            }}
                                            onClick={(e) => { e.stopPropagation(); onEventClick(event); }}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black truncate flex-1 uppercase tracking-tight" style={{ color: event.color }}>{event.name}</span>
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <div className="flex items-center gap-1 text-[9px] font-bold opacity-60">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    <span>{event.startTime}-{event.endTime}</span>
                                                </div>
                                                {event.hours && <span className="text-[9px] font-black bg-white rounded px-1 shadow-sm" style={{ color: event.color }}>{event.hours}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : calendarView === 'month' ? (
                <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden mt-2">
                    {['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'].map(day => (
                        <div key={day} className="bg-slate-50 p-3 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-200">
                            {day}
                        </div>
                    ))}
                    {eachDayOfInterval({
                        start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
                        end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
                    }).map((day, idx) => {
                        const isSameMonthDay = isSameMonth(day, currentDate);
                        const isDayToday = isToday(day);
                        const dayEvents = getEventsForDay(day);

                        return (
                            <div
                                key={idx}
                                className={`bg-white min-h-[100px] p-2 flex flex-col gap-1 transition-all hover:bg-slate-50 cursor-pointer ${!isSameMonthDay ? 'bg-slate-50/50 opacity-30 grayscale' : ''} ${isDayToday ? 'bg-red-50/30' : ''}`}
                                onClick={() => { setCurrentDate(day); setCalendarView('day'); }}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-xs font-black rounded-lg w-7 h-7 flex items-center justify-center transition-all ${isDayToday ? 'bg-red-600 text-white shadow-lg shadow-red-200 border border-red-500' : 'text-slate-700 bg-slate-50 border border-slate-100'}`}>
                                        {format(day, 'd')}
                                    </span>
                                    {dayEvents.length > 0 && (
                                        <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full shadow-sm animate-in fade-in zoom-in">
                                            {dayEvents.length}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1 overflow-hidden">
                                    {dayEvents.slice(0, 3).map(event => (
                                        <div key={event.id} className="text-[10px] truncate font-bold px-1.5 py-0.5 rounded border-l-2"
                                            style={{
                                                backgroundColor: `${event.color}08`,
                                                borderColor: event.color,
                                                color: event.color
                                            }}>
                                            {event.name}
                                        </div>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <div className="text-[9px] font-black text-slate-400 text-center bg-slate-50 rounded py-0.5 border border-dashed border-slate-200">
                                            + {dayEvents.length - 3} altele
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="relative h-32 bg-slate-50 rounded-2xl border border-slate-200 mt-2 select-none overflow-hidden shadow-inner p-2">
                    {/* Time Grid Lines */}
                    <div className="absolute inset-0 flex justify-between px-4 pt-2 pointer-events-none opacity-50">
                        {[0, 4, 8, 12, 16, 20, 24].map(hour => (
                            <div key={hour} className="flex flex-col items-center h-full relative group">
                                <span className="text-[10px] font-black text-slate-300 group-hover:text-red-400 transition-colors uppercase">{hour}:00</span>
                                <div className="h-full w-px bg-slate-200 mt-1 border-r border-dashed border-white"></div>
                            </div>
                        ))}
                    </div>

                    {/* Current Time Line */}
                    {isSameDay(currentDate, new Date()) && (
                        <div
                            className="absolute top-0 bottom-0 w-px bg-red-500 z-20 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
                            style={{
                                left: `${((new Date().getHours() * 60 + new Date().getMinutes()) / 1440) * 100}%`
                            }}
                        >
                            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                        </div>
                    )}

                    {/* Events Visualization */}
                    <div className="relative h-full flex flex-col justify-center gap-2 pr-4 pl-4">
                        {getEventsForDay(currentDate).map(event => {
                            const [h1, m1] = event.startTime.split(':').map(Number);
                            const [h2, m2] = event.endTime.split(':').map(Number);

                            const startMinutes = h1 * 60 + m1;
                            const endMinutes = h2 * 60 + m2;
                            const durationMinutes = Math.max(endMinutes - startMinutes, 30);

                            const leftPercent = (startMinutes / 1440) * 100;
                            const widthPercent = (durationMinutes / 1440) * 100;

                            return (
                                <div
                                    key={event.id}
                                    onClick={() => onEventClick(event)}
                                    className="bg-white border rounded-xl shadow-sm hover:shadow-xl hover:scale-[1.02] hover:z-10 transition-all cursor-pointer overflow-hidden group flex items-center px-3 gap-3 h-10 border-l-4"
                                    style={{
                                        marginLeft: `${leftPercent}%`,
                                        width: `${widthPercent}%`,
                                        borderLeftColor: event.color,
                                        borderColor: `${event.color}40`,
                                        boxShadow: `0 4px 6px -1px ${event.color}15`
                                    }}
                                    title={`${event.startTime} - ${event.endTime}: ${event.name}`}
                                >
                                    <div className={`p-1 rounded-lg`} style={{ backgroundColor: `${event.color}15` }}>
                                        <PlaySquare className="w-4 h-4" style={{ color: event.color }} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[11px] font-black text-slate-800 truncate leading-tight group-hover:text-red-600 uppercase tracking-tight">{event.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">{event.startTime}-{event.endTime}</span>
                                            {event.hours && <span className="text-[9px] font-black text-red-500 bg-red-50 px-1 rounded border border-red-100">{event.hours}</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
