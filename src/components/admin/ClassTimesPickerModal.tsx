'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Plus, X } from 'lucide-react';
import type { ClassTime } from '@/types/site';

type TimeWithLocalId = ClassTime & { _localId: string };

function rid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

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

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
// Upper bound on how many times a single "Generate & Assign" click can
// create (e.g. weekly for ~4 years) — keeps the config, the admin list, and
// the availability lookup query string from growing unbounded on a typo'd
// date range.
const MAX_SERIES_DATES = 200;

// Every date between from/to (inclusive) that falls on one of `weekdays`
// (0 = Sunday … 6 = Saturday). Iteration is capped so a mistyped multi-year
// range can't hang the browser building an enormous list.
function computeSeriesDates(fromISO: string, toISO: string, weekdays: Set<number>): string[] {
  if (!fromISO || !toISO || weekdays.size === 0) return [];
  const from = new Date(`${fromISO}T00:00:00`);
  const to = new Date(`${toISO}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return [];
  const dates: string[] = [];
  const cur = new Date(from);
  let guard = 0;
  while (cur <= to && guard < 1000) {
    if (weekdays.has(cur.getDay())) dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
    guard++;
  }
  return dates;
}

type Props = {
  classItemName: string;
  /** Full shared pool of class times (not just this class's assigned ones). */
  allTimes: TimeWithLocalId[];
  assignedIds: string[];
  /** Reusable location names, managed in the "Locations" tab. */
  locations: string[];
  onToggle: (timeId: string) => void;
  /** Adds new times to the shared pool AND assigns them to this class, in one go. */
  onCreateAndAssign: (newTimes: ClassTime[]) => void;
  onClose: () => void;
};

// Dropdown when there are saved locations to pick from; otherwise falls back
// to free text so scheduling still works before any locations are set up.
// If the current value isn't one of the known locations (a legacy free-typed
// value, or simply unset), it's kept as its own option rather than silently
// snapping to the first location.
function LocationField({
  value,
  locations,
  onChange,
}: {
  value: string;
  locations: string[];
  onChange: (next: string) => void;
}) {
  if (locations.length === 0) {
    return (
      <input
        className="input w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. 123 Main St, Studio B"
      />
    );
  }
  return (
    <select className="select w-full" value={value} onChange={(e) => onChange(e.target.value)}>
      {!locations.includes(value) && <option value={value}>{value || '— none —'}</option>}
      {locations.map((loc) => (
        <option key={loc} value={loc}>
          {loc}
        </option>
      ))}
    </select>
  );
}

export default function ClassTimesPickerModal({
  classItemName,
  allTimes,
  assignedIds,
  locations,
  onToggle,
  onCreateAndAssign,
  onClose,
}: Props) {
  const assigned = new Set(assignedIds);

  // ── Calendar ────────────────────────────────────────────────────────────
  const byDate = useMemo(() => {
    const map = new Map<string, TimeWithLocalId[]>();
    for (const t of allTimes) {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    }
    return map;
  }, [allTimes]);

  const today = todayISO();
  const initialMonth = useMemo(() => {
    const first = [...allTimes].sort((a, b) => a.date.localeCompare(b.date))[0]?.date ?? today;
    const d = new Date(`${first}T00:00:00`);
    return new Date(d.getFullYear(), d.getMonth(), 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [viewMonth, setViewMonth] = useState(initialMonth);
  const [openDate, setOpenDate] = useState<string | null>(null);

  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const grid = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { dateISO: string | null; day: number | null }[] = [];
    for (let i = 0; i < startOffset; i++) cells.push({ dateISO: null, day: null });
    for (let day = 1; day <= daysInMonth; day++) {
      const dateISO = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ dateISO, day });
    }
    return cells;
  }, [viewMonth]);

  const dayStatus = (dateISO: string): 'none' | 'assigned' | 'unassigned' => {
    const times = byDate.get(dateISO);
    if (!times || times.length === 0) return 'none';
    return times.some((t) => assigned.has(t.id)) ? 'assigned' : 'unassigned';
  };

  const openTimes = openDate
    ? (byDate.get(openDate) ?? []).slice().sort((a, b) => a.startTime.localeCompare(b.startTime))
    : [];

  // Create-a-time form for whichever date is selected on the calendar —
  // collapsed by default so it doesn't compete with the times list above it.
  const [createFormOpen, setCreateFormOpen] = useState(false);
  useEffect(() => setCreateFormOpen(false), [openDate]);

  const [quickStart, setQuickStart] = useState('18:00');
  const [quickEnd, setQuickEnd] = useState('');
  const [quickCapacity, setQuickCapacity] = useState('');
  const [quickLocation, setQuickLocation] = useState(() => locations[0] ?? '');
  const [quickLabel, setQuickLabel] = useState('');

  const handleQuickAdd = () => {
    if (!openDate) return;
    onCreateAndAssign([
      {
        id: `time-${rid().slice(0, 8)}`,
        date: openDate,
        startTime: quickStart,
        endTime: quickEnd || undefined,
        capacity: quickCapacity === '' ? undefined : Math.max(0, Number(quickCapacity) || 0),
        location: quickLocation || undefined,
        label: quickLabel || undefined,
      },
    ]);
    setQuickEnd('');
    setQuickCapacity('');
    setQuickLocation(locations[0] ?? '');
    setQuickLabel('');
    setCreateFormOpen(false);
  };

  // ── Recurring series ───────────────────────────────────────────────────
  const [seriesWeekdays, setSeriesWeekdays] = useState<Set<number>>(new Set());
  const [seriesFrom, setSeriesFrom] = useState(today);
  const [seriesTo, setSeriesTo] = useState(today);
  const [seriesStart, setSeriesStart] = useState('18:00');
  const [seriesEnd, setSeriesEnd] = useState('');
  const [seriesCapacity, setSeriesCapacity] = useState('');
  const [seriesLocation, setSeriesLocation] = useState(() => locations[0] ?? '');
  const [seriesLabel, setSeriesLabel] = useState('');

  const toggleWeekday = (day: number) => {
    setSeriesWeekdays((cur) => {
      const next = new Set(cur);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const seriesDates = useMemo(
    () => computeSeriesDates(seriesFrom, seriesTo, seriesWeekdays),
    [seriesFrom, seriesTo, seriesWeekdays]
  );
  // computeSeriesDates already caps how many *days* it scans (guards a bad
  // range from hanging the browser); this caps how many *times* a single
  // click can create, so a fat-fingered multi-year range or "every day"
  // selection can't silently dump hundreds of rows into the config.
  const seriesTooLarge = seriesDates.length > MAX_SERIES_DATES;

  const handleGenerateSeries = () => {
    if (seriesDates.length === 0 || seriesTooLarge) return;
    // Re-running the same series (e.g. after extending the end date) skips
    // dates that are already assigned to *this* class at the same start
    // time, so it doesn't pile up duplicates. We deliberately don't dedupe
    // against other classes' times: two classes coincidentally starting at
    // the same date/time are still distinct real-world events and must not
    // end up sharing one capacity pool.
    const alreadyAssignedByKey = new Set(
      allTimes.filter((t) => assigned.has(t.id)).map((t) => `${t.date}|${t.startTime}`)
    );
    const toCreate: ClassTime[] = [];
    for (const date of seriesDates) {
      if (alreadyAssignedByKey.has(`${date}|${seriesStart}`)) continue;
      toCreate.push({
        id: `time-${rid().slice(0, 8)}`,
        date,
        startTime: seriesStart,
        endTime: seriesEnd || undefined,
        capacity: seriesCapacity === '' ? undefined : Math.max(0, Number(seriesCapacity) || 0),
        location: seriesLocation || undefined,
        label: seriesLabel || undefined,
      });
    }
    if (toCreate.length) onCreateAndAssign(toCreate);
    setSeriesWeekdays(new Set());
  };

  return (
    <div
      className="fixed inset-0 z-[13000] bg-black/60 flex items-center justify-center p-4"
      onClick={(e) => {
        // Only close on the backdrop itself — clicks bubble up from
        // everything inside the panel too, so without this check any click
        // on padding/whitespace inside the modal would close it.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="card admin-card card-solid p-4 w-full max-w-2xl max-h-[85vh] overflow-auto relative space-y-6">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <div className="font-semibold text-lg">Select Times</div>
            <div className="text-xs text-muted">{classItemName}</div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar + times for the selected day, side by side */}
        <div className="space-y-3">
          <div className="text-sm font-semibold">Pick from the calendar</div>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: times on the selected date + create-time form */}
            <div className="flex-1 min-w-0 order-2 md:order-1 space-y-2">
              {!openDate ? (
                <p className="text-xs text-muted">Select a date on the calendar to view or add times.</p>
              ) : (
                <>
                  <div className="text-sm font-medium">{formatDayHeading(openDate)}</div>

                  {openTimes.length === 0 ? (
                    <p className="text-xs text-muted">No times on this date yet.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-32 overflow-auto pr-1">
                      {openTimes.map((t) => {
                        const isAssigned = assigned.has(t.id);
                        return (
                          <button
                            key={t._localId}
                            type="button"
                            onClick={() => onToggle(t.id)}
                            className={[
                              'w-full px-3 py-1.5 rounded-lg border text-sm text-left flex flex-col items-start gap-0.5',
                              isAssigned
                                ? 'bg-[var(--admin-primary)] text-white border-transparent'
                                : 'border-black/20 hover:border-black/40',
                            ].join(' ')}
                          >
                            <span>
                              {formatTimeLabel(t.startTime)}
                              {t.endTime ? ` – ${formatTimeLabel(t.endTime)}` : ''}
                            </span>
                            {(t.location || t.label) && (
                              <span className="text-xs opacity-80">
                                {[t.location, t.label].filter(Boolean).join(' · ')}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="admin-card card-solid p-3 space-y-2">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between text-xs font-semibold opacity-70"
                      onClick={() => setCreateFormOpen((v) => !v)}
                      aria-expanded={createFormOpen}
                    >
                      <span>Create a time on this date</span>
                      {createFormOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {createFormOpen && (
                      <>
                        <div className="grid sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium mb-1">Time</label>
                            <input
                              type="time"
                              className="input w-full"
                              value={quickStart}
                              onChange={(e) => setQuickStart(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">End (optional)</label>
                            <input
                              type="time"
                              className="input w-full"
                              value={quickEnd}
                              onChange={(e) => setQuickEnd(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Capacity</label>
                            <input
                              type="number"
                              min={0}
                              className="input w-full"
                              placeholder="Unlimited"
                              value={quickCapacity}
                              onChange={(e) => setQuickCapacity(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Location</label>
                            <LocationField value={quickLocation} locations={locations} onChange={setQuickLocation} />
                          </div>
                        </div>
                        <input
                          className="input w-full"
                          placeholder="Note (optional)"
                          value={quickLabel}
                          onChange={(e) => setQuickLabel(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-primary text-sm w-full justify-center"
                          onClick={handleQuickAdd}
                        >
                          <Plus className="w-3 h-3 inline mr-1" /> Create &amp; Assign
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Right: calendar grid, 32×32 day cells */}
            <div className="flex-shrink-0 order-1 md:order-2 space-y-2 mx-auto md:mx-0">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="btn btn-ghost p-1"
                  onClick={() => setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold whitespace-nowrap">{monthLabel}</span>
                <button
                  type="button"
                  className="btn btn-ghost p-1"
                  onClick={() => setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-[repeat(7,2rem)] gap-1 text-center">
                {WEEKDAY_SHORT.map((w, i) => (
                  <div key={`${w}-${i}`} className="h-8 w-8 flex items-center justify-center text-[10px] opacity-50">
                    {w}
                  </div>
                ))}
                {grid.map((cell, i) => {
                  if (!cell.dateISO) return <div key={`blank-${i}`} className="h-8 w-8" />;
                  const status = dayStatus(cell.dateISO);
                  const isOpen = openDate === cell.dateISO;
                  return (
                    <button
                      key={cell.dateISO}
                      type="button"
                      onClick={() => setOpenDate(cell.dateISO)}
                      className={[
                        'relative h-8 w-8 rounded-md text-xs flex items-center justify-center transition-colors',
                        isOpen ? 'bg-[var(--admin-primary)] text-white' : 'hover:bg-black/10',
                      ].join(' ')}
                    >
                      {cell.day}
                      {status !== 'none' && (
                        <span
                          className={[
                            'absolute bottom-0.5 h-1 w-1 rounded-full',
                            isOpen ? 'bg-white' : status === 'assigned' ? 'bg-[var(--admin-primary)]' : 'bg-black/30',
                          ].join(' ')}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recurring series */}
        <div className="space-y-3 border-t pt-4">
          <div className="text-sm font-semibold">Add a recurring series</div>
          <p className="text-xs text-muted">
            e.g. every Wednesday, 6:00–7:30 PM, from a start date to an end date — generates and assigns
            all matching times at once.
          </p>

          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleWeekday(i)}
                className={[
                  'px-3 py-1.5 rounded-full text-xs font-medium border',
                  seriesWeekdays.has(i)
                    ? 'bg-[var(--admin-primary)] text-white border-transparent'
                    : 'border-black/20 hover:border-black/40',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1">From</label>
              <input
                type="date"
                className="input w-full"
                value={seriesFrom}
                onChange={(e) => setSeriesFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">To</label>
              <input
                type="date"
                className="input w-full"
                value={seriesTo}
                onChange={(e) => setSeriesTo(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Start time</label>
              <input
                type="time"
                className="input w-full"
                value={seriesStart}
                onChange={(e) => setSeriesStart(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">End time (optional)</label>
              <input
                type="time"
                className="input w-full"
                value={seriesEnd}
                onChange={(e) => setSeriesEnd(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Capacity</label>
              <input
                type="number"
                min={0}
                className="input w-full"
                placeholder="Unlimited"
                value={seriesCapacity}
                onChange={(e) => setSeriesCapacity(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Location</label>
              <LocationField value={seriesLocation} locations={locations} onChange={setSeriesLocation} />
            </div>
          </div>
          <input
            className="input w-full"
            placeholder="Note (optional)"
            value={seriesLabel}
            onChange={(e) => setSeriesLabel(e.target.value)}
          />

          <div className="flex items-center justify-between pt-1 gap-3">
            <span className={`text-xs ${seriesTooLarge ? 'text-red-500 font-medium' : 'text-muted'}`}>
              {seriesDates.length === 0
                ? 'Pick at least one weekday and a valid date range'
                : seriesTooLarge
                  ? `${seriesDates.length} dates match — that's over the ${MAX_SERIES_DATES} limit per series. Narrow the date range or run it again from where this leaves off.`
                  : `${seriesDates.length} date${seriesDates.length === 1 ? '' : 's'} will be generated`}
            </span>
            <button
              type="button"
              className="btn btn-primary text-sm flex-shrink-0"
              disabled={seriesDates.length === 0 || seriesTooLarge}
              onClick={handleGenerateSeries}
            >
              Generate &amp; Assign
            </button>
          </div>
        </div>

        <div className="flex justify-end border-t pt-3">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
