'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ClassTime } from '@/types/site';

export type ClassAvailability = Record<string, { remaining: number | null }>;

type Props = {
  classTimes: ClassTime[]; // already resolved to this class item's assigned times
  selectedTimeId: string | null;
  onSelect: (timeId: string) => void;
  availability?: ClassAvailability;
};

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatTimeLabel(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function formatDayHeading(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function ClassTimePicker({ classTimes, selectedTimeId, onSelect, availability }: Props) {
  const today = todayISO();
  const upcoming = useMemo(
    () => classTimes.filter((t) => t.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
    [classTimes, today]
  );

  const byDate = useMemo(() => {
    const map = new Map<string, ClassTime[]>();
    for (const t of upcoming) {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    }
    return map;
  }, [upcoming]);

  const isFull = (t: ClassTime) => {
    const remaining = availability?.[t.id]?.remaining;
    return remaining === 0;
  };

  const hasAvailableOnDate = (dateISO: string) =>
    (byDate.get(dateISO) ?? []).some((t) => !isFull(t));

  const initialMonth = useMemo(() => {
    const first = upcoming[0]?.date ?? today;
    const d = new Date(`${first}T00:00:00`);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, [upcoming, today]);

  const [viewMonth, setViewMonth] = useState(initialMonth);
  const selectedDate = useMemo(
    () => upcoming.find((t) => t.id === selectedTimeId)?.date ?? null,
    [upcoming, selectedTimeId]
  );
  const [openDate, setOpenDate] = useState<string | null>(selectedDate);

  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const grid = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: { dateISO: string | null; day: number | null }[] = [];
    for (let i = 0; i < startOffset; i++) cells.push({ dateISO: null, day: null });
    for (let day = 1; day <= daysInMonth; day++) {
      const dateISO = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ dateISO, day });
    }
    return cells;
  }, [viewMonth]);

  if (upcoming.length === 0) {
    return <p className="text-sm text-muted">No upcoming times are scheduled for this class yet.</p>;
  }

  const openTimes = openDate ? (byDate.get(openDate) ?? []) : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="btn btn-ghost p-1"
          aria-label="Previous month"
          onClick={() => setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold">{monthLabel}</span>
        <button
          type="button"
          className="btn btn-ghost p-1"
          aria-label="Next month"
          onClick={() => setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((w, i) => (
          <div key={`${w}-${i}`} className="text-xs opacity-50 py-1">
            {w}
          </div>
        ))}
        {grid.map((cell, i) => {
          if (!cell.dateISO) return <div key={`blank-${i}`} />;
          const hasTimes = byDate.has(cell.dateISO);
          const available = hasTimes && hasAvailableOnDate(cell.dateISO);
          const isOpen = openDate === cell.dateISO;
          return (
            <button
              key={cell.dateISO}
              type="button"
              disabled={!hasTimes}
              onClick={() => setOpenDate(cell.dateISO)}
              className={[
                'aspect-square rounded-lg text-sm flex items-center justify-center transition-colors',
                !hasTimes ? 'opacity-25 cursor-default' : 'cursor-pointer',
                hasTimes && !available ? 'opacity-40 line-through' : '',
                isOpen ? 'bg-[var(--primary)] text-white' : hasTimes ? 'bg-[var(--bg-2)] hover:opacity-80' : '',
              ].join(' ')}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      {openDate && (
        <div className="space-y-2 pt-2 border-t">
          <div className="text-sm font-medium">{formatDayHeading(openDate)}</div>
          <div className="flex flex-wrap gap-2">
            {openTimes.map((t) => {
              const full = isFull(t);
              const active = selectedTimeId === t.id;
              const remaining = availability?.[t.id]?.remaining;
              const metaBits = [
                t.location || null,
                full ? 'Full' : typeof remaining === 'number' ? `${remaining} spot${remaining === 1 ? '' : 's'} left` : null,
                t.label || null,
              ].filter((x): x is string => !!x);
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={full}
                  onClick={() => onSelect(t.id)}
                  className={`px-3 py-1.5 border product-select text-sm text-left flex flex-col items-start gap-0.5 ${
                    active
                      ? 'bg-gradient-colored'
                      : full
                        ? 'opacity-40 cursor-not-allowed border-black/30'
                        : 'border-2 border-black/50 hover:border-black/60'
                  }`}
                >
                  <span>
                    {formatTimeLabel(t.startTime)}
                    {t.endTime ? ` – ${formatTimeLabel(t.endTime)}` : ''}
                  </span>
                  {metaBits.length > 0 && (
                    <span className="text-xs opacity-70">{metaBits.join(' · ')}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
