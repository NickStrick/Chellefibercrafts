'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxesStacked, faReceipt, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { adminFetch } from '@/lib/adminClient';
import { getSiteId } from '@/lib/siteId';
import type { OrderRecord } from '@/types/orders';

type OrdersModalProps = {
  onClose: () => void;
};

const STATUS_OPTIONS = ['PLACED', 'PAID', 'FULFILLED', 'CANCELLED', 'REFUNDED'];

type OrdersViewMode = 'items' | 'orders' | 'classes';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function formatItemCost(item: Record<string, unknown>): number | null {
  const total = item.total;
  if (typeof total === 'number' && Number.isFinite(total)) return total;
  const price = item.price;
  const quantity = item.quantity;
  if (
    typeof price === 'number' &&
    Number.isFinite(price) &&
    typeof quantity === 'number' &&
    Number.isFinite(quantity)
  ) {
    return price * quantity;
  }
  return null;
}

function summarizePairs(pairs: Array<[string, string]>, maxPairs = 3) {
  const shown = pairs.slice(0, maxPairs).map(([k, v]) => `${k}: ${v}`);
  const rest = pairs.length - shown.length;
  return rest > 0 ? `${shown.join(', ')} (+${rest} more)` : shown.join(', ');
}

function dayKeyFromISO(iso: string | undefined) {
  if (!iso) return 'unknown';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'unknown';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDayLabel(iso: string | undefined) {
  if (!iso) return 'Unknown date';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown date';
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatItemOptions(item: Record<string, unknown>): string {
  const options = item.options;
  if (isPlainObject(options)) {
    const pairs = Object.entries(options)
      .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
      .map(([k, v]) => [k, String(v)] as [string, string]);
    if (pairs.length) return summarizePairs(pairs);
  }
  if (Array.isArray(options)) {
    const vals = options.map((v) => String(v)).filter(Boolean);
    if (vals.length) return vals.slice(0, 4).join(', ');
  }

  const ignored = new Set([
    'id', 'name', 'quantity', 'price', 'total', 'sku', 'notes', 'options',
    'currency', 'imageUrl', 'taxable',
    'classItemId', 'classTimeId', 'classTimeLabel', 'classLocation',
  ]);
  const pairs = Object.entries(item)
    .filter(([k, v]) => !ignored.has(k) && v !== undefined && v !== null)
    .flatMap(([k, v]) => {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        const s = String(v).trim();
        return s ? ([[k, s]] as Array<[string, string]>) : [];
      }
      if (isPlainObject(v)) {
        const nestedPairs = Object.entries(v)
          .filter(([, nv]) => typeof nv === 'string' || typeof nv === 'number' || typeof nv === 'boolean')
          .map(([nk, nv]) => [`${k}.${nk}`, String(nv)] as [string, string]);
        return nestedPairs;
      }
      return [];
    });

  return pairs.length ? summarizePairs(pairs) : '-';
}

function formatMoney(total: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(total);
  } catch {
    return `${total.toFixed(2)} ${currency}`;
  }
}

function toISOStart(dateStr: string) {
  if (!dateStr) return '';
  return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
}

function toISOEnd(dateStr: string) {
  if (!dateStr) return '';
  return new Date(`${dateStr}T23:59:59.999Z`).toISOString();
}

export default function OrdersModal({ onClose }: OrdersModalProps) {
  const businessId = getSiteId();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<OrdersViewMode>('items');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<string>('PLACED');
  const [savingStatus, setSavingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchOrders = useCallback(
    async (opts?: { next?: string; append?: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        qs.set('businessId', businessId);
        const fromISO = toISOStart(fromDate);
        const toISO = toISOEnd(toDate);
        if (fromISO) qs.set('from', fromISO);
        if (toISO) qs.set('to', toISO);
        qs.set('limit', '25');
        if (opts?.next) qs.set('next', opts.next);

        const res = await adminFetch(`/api/admin/orders?${qs.toString()}`);
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `Request failed (${res.status})`);
        }
        const data = (await res.json()) as { items: OrderRecord[]; nextToken?: string | null };
        setOrders((prev) => (opts?.append ? [...prev, ...(data.items || [])] : data.items || []));
        setNextToken(data.nextToken || null);
      } catch (err) {
        setError((err as Error).message || 'Failed to load orders.');
      } finally {
        setLoading(false);
      }
    },
    [businessId, fromDate, toDate]
  );

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = orders.filter((order) => {
      if (statusFilter && (order.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (!term) return true;
      return (
        (order.customerEmail || '').toLowerCase().includes(term) ||
        (order.customerName || '').toLowerCase().includes(term) ||
        (order.orderId || '').toLowerCase().includes(term) ||
        (order.items || []).some((item) =>
          item?.name ? String(item.name).toLowerCase().includes(term) : false
        )
      );
    });

    return filtered.sort((a, b) => {
      const aT = Date.parse(a.createdAt || '') || 0;
      const bT = Date.parse(b.createdAt || '') || 0;
      if (aT !== bT) return bT - aT; // newest first
      return String(b.createdAtOrderId || '').localeCompare(String(a.createdAtOrderId || ''));
    });
  }, [orders, search, statusFilter]);

  const filteredItems = useMemo(() => {
    return filteredOrders.flatMap((order) =>
      (order.items || []).map((item, idx) => ({
        order,
        item: item as Record<string, unknown>,
        idx,
      }))
    );
  }, [filteredOrders]);

  const filteredClassItems = useMemo(
    () => filteredItems.filter(({ item }) => typeof item.classItemId === 'string'),
    [filteredItems]
  );

  const selectedOrder = useMemo(
    () => orders.find((o) => o.createdAtOrderId === selectedId) || null,
    [orders, selectedId]
  );

  useEffect(() => {
    if (!selectedOrder) return;
    setStatusDraft(selectedOrder.status || 'PLACED');
  }, [selectedOrder]);

  async function handleUpdateStatus() {
    if (!selectedOrder) return;
    setSavingStatus(true);
    try {
      const res = await adminFetch('/api/admin/orders/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          createdAtOrderId: selectedOrder.createdAtOrderId,
          status: statusDraft,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Request failed (${res.status})`);
      }
      setOrders((prev) =>
        prev.map((order) =>
          order.createdAtOrderId === selectedOrder.createdAtOrderId
            ? { ...order, status: statusDraft }
            : order
        )
      );
    } catch (err) {
      setError((err as Error).message || 'Failed to update status.');
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleDelete(order: OrderRecord) {
    if (!confirm(`Delete order ${order.orderId}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await adminFetch('/api/admin/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          createdAtOrderId: order.createdAtOrderId,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Request failed (${res.status})`);
      }
      setOrders((prev) =>
        prev.filter((o) => o.createdAtOrderId !== order.createdAtOrderId)
      );
      if (selectedId === order.createdAtOrderId) setSelectedId(null);
    } catch (err) {
      setError((err as Error).message || 'Failed to delete order.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[11000] bg-black/50 flex items-center justify-center p-4">
      <div className="card admin-card card-full card-solid w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <div className="text-lg font-semibold">
              {viewMode === 'items' ? 'Items' : viewMode === 'classes' ? 'Class Bookings' : 'Orders'}
            </div>
            <div className="text-sm opacity-70">Business: {businessId}</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="orders-filters px-5 py-4 border-b border-white/10">
          <div className="orders-filters-top flex flex-wrap gap-3 items-end">
            <div className="orders-view-toggle flex items-end gap-2">
            <button
              type="button"
              className={viewMode === 'items' ? 'btn btn-primary' : 'btn btn-inverted'}
              onClick={() => setViewMode('items')}
              title="Items view (default)"
              aria-label="Items view"
            >
              <FontAwesomeIcon icon={faBoxesStacked} className="text-base" />
            </button>
            <button
              type="button"
              className={viewMode === 'orders' ? 'btn btn-primary' : 'btn btn-inverted'}
              onClick={() => setViewMode('orders')}
              title="Orders view"
              aria-label="Orders view"
            >
              <FontAwesomeIcon icon={faReceipt} className="text-base" />
            </button>
            <button
              type="button"
              className={viewMode === 'classes' ? 'btn btn-primary' : 'btn btn-inverted'}
              onClick={() => setViewMode('classes')}
              title="Class bookings view"
              aria-label="Class bookings view"
            >
              <FontAwesomeIcon icon={faCalendarDays} className="text-base" />
            </button>
          </div>

            <button
              type="button"
              className="btn btn-inverted orders-filters-toggle"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-controls="orders-filters-panel"
              title={filtersOpen ? 'Hide filters' : 'Show filters'}
            >
              {filtersOpen ? 'Hide Filters' : 'Filters'}
            </button>
          </div>

          <div
            id="orders-filters-panel"
            className={`orders-filters-panel flex flex-wrap gap-3 items-end ${filtersOpen ? 'is-open' : ''}`}
          >
            <label className="text-sm orders-filter-half">
              <div className="opacity-70">From</div>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="input"
              />
            </label>
            <label className="text-sm orders-filter-half">
              <div className="opacity-70">To</div>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="input"
              />
            </label>
            <label className="text-sm orders-filter-full">
              <div className="opacity-70">Status</div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select"
              >
                <option value="">All</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm flex-1 min-w-[220px] orders-filter-full">
              <div className="opacity-70">Search</div>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Email, customer, item, or order ID"
                className="input w-full"
              />
            </label>
            <button
              className="btn btn-primary orders-filter-full"
              onClick={() => {
                fetchOrders();
                setFiltersOpen(false);
              }}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Apply'}
            </button>
            {nextToken && (
              <button
                className="btn btn-inverted orders-filter-full"
                onClick={() => fetchOrders({ next: nextToken, append: true })}
                disabled={loading}
              >
                Load More
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="px-5 py-3 text-sm text-red-300 border-b border-white/10">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {loading ? <div className="flex-1 overflow-auto text-center p-4 font-bold load-animate">Loading...</div> : <></>}
          {viewMode === 'orders' ? (
            <>
              <div className="orders-table-desktop">
                <table className="w-full text-sm">
                  <thead className="text-left sticky top-0 bg-[var(--panel)]/90 backdrop-blur border-b border-white/10">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Order ID</th>
                      <th className="py-2 px-3">Customer</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Total</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Fulfillment</th>
                      <th className="py-2 px-3">Delivery Address</th>
                      <th className="py-2 px-3">Items</th>
                      <th className="py-2 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.createdAtOrderId}
                        className={`border-b border-white/10 hover:bg-white/5 ${
                          selectedId === order.createdAtOrderId ? 'bg-white/5' : ''
                        }`}
                      >
                        <td className="py-2 px-3">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}
                        </td>
                        <td className="py-2 px-3 font-mono text-xs">{order.orderId}</td>
                        <td className="py-2 px-3">{order.customerName || '-'}</td>
                        <td className="py-2 px-3">{order.customerEmail}</td>
                        <td className="py-2 px-3">{formatMoney(order.total, order.currency)}</td>
                        <td className="py-2 px-3">{order.status}</td>
                        <td className="py-2 px-3">
                          {order.fulfillment || order.delivery?.fulfillment || '-'}
                        </td>
                        <td className="py-2 px-3 max-w-[220px] truncate">
                          {(order.fulfillment || order.delivery?.fulfillment) === 'delivery'
                            ? order.deliveryAddress || order.delivery?.address || '-'
                            : '-'}
                        </td>
                        <td className="py-2 px-3">{order.items?.length ?? 0}</td>
                        <td className="py-2 px-3 flex gap-2">
                          <button
                            className="btn btn-ghost"
                            onClick={() => setSelectedId(order.createdAtOrderId)}
                          >
                            View
                          </button>
                          <button
                            className="btn btn-ghost"
                            onClick={() => setSelectedId(order.createdAtOrderId)}
                          >
                            Update Status
                          </button>
                          <button
                            className="btn btn-ghost"
                            onClick={() => void handleDelete(order)}
                            disabled={deleting}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!filteredOrders.length && !loading && (
                      <tr>
                        <td className="py-6 px-3 text-center opacity-70" colSpan={10}>
                          No orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="orders-list-mobile" data-view="orders">
                {(() => {
                  let lastDayKey: string | null = null;
                  const nodes: JSX.Element[] = [];

                  for (const order of filteredOrders) {
                    const dayKey = dayKeyFromISO(order.createdAt);
                    if (dayKey !== lastDayKey) {
                      lastDayKey = dayKey;
                      nodes.push(
                        <div key={`day-${dayKey}`} className="orders-day-separator">
                          {formatDayLabel(order.createdAt)}
                        </div>
                      );
                    }

                    const isSelected = selectedId === order.createdAtOrderId;
                    const isDelivery =
                      (order.fulfillment || order.delivery?.fulfillment) === 'delivery';
                    const deliveryAddress = isDelivery
                      ? order.deliveryAddress || order.delivery?.address || '-'
                      : '-';

                    nodes.push(
                      <div
                        key={order.createdAtOrderId}
                        className={`orders-mobile-card ${isSelected ? 'is-selected' : ''}`}
                      >
                        <div className="orders-mobile-top">
                          <div className="min-w-0">
                            <div className="orders-mobile-title truncate">
                              {order.customerName || 'No name'}
                            </div>
                            <div className="orders-mobile-sub truncate">{order.customerEmail}</div>
                          </div>
                          <span className="orders-status-badge">{order.status}</span>
                        </div>

                        <div className="orders-mobile-grid">
                          <div>
                            <span className="orders-mobile-label">Order</span>
                            <span className="orders-mobile-mono">{order.orderId}</span>
                          </div>
                          <div>
                            <span className="orders-mobile-label">Total</span>
                            <span className="orders-mobile-value">
                              {formatMoney(order.total, order.currency)}
                            </span>
                          </div>
                          <div>
                            <span className="orders-mobile-label">Items</span>
                            <span className="orders-mobile-value">{order.items?.length ?? 0}</span>
                          </div>
                          <div>
                            <span className="orders-mobile-label">Received</span>
                            <span className="orders-mobile-value">
                              {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="orders-mobile-label">Fulfillment</span>
                            <span className="orders-mobile-value">
                              {order.fulfillment || order.delivery?.fulfillment || '-'}
                            </span>
                          </div>
                          {isDelivery ? (
                            <div className="orders-mobile-wide">
                              <span className="orders-mobile-label">Address</span>
                              <span className="orders-mobile-value">{deliveryAddress}</span>
                            </div>
                          ) : null}
                        </div>

                        <div className="orders-mobile-actions">
                          <button
                            className="btn btn-ghost"
                            onClick={() => setSelectedId(order.createdAtOrderId)}
                          >
                            View
                          </button>
                          <button
                            className="btn btn-ghost"
                            onClick={() => setSelectedId(order.createdAtOrderId)}
                          >
                            Update Status
                          </button>
                          <button
                            className="btn btn-ghost"
                            onClick={() => void handleDelete(order)}
                            disabled={deleting}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (!nodes.length && !loading) {
                    nodes.push(
                      <div key="empty" className="orders-mobile-empty">
                        No orders found.
                      </div>
                    );
                  }

                  return nodes;
                })()}
              </div>
            </>
          ) : viewMode === 'classes' ? (
            <>
              <div className="orders-table-desktop">
                <table className="w-full text-sm">
                  <thead className="text-left sticky top-0 bg-[var(--panel)]/90 backdrop-blur border-b border-white/10">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Customer</th>
                      <th className="py-2 px-3">Class</th>
                      <th className="py-2 px-3">Time</th>
                      <th className="py-2 px-3">Location</th>
                      <th className="py-2 px-3">Qty</th>
                      <th className="py-2 px-3">Options</th>
                      <th className="py-2 px-3">Cost</th>
                      <th className="py-2 px-3">Order ID</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClassItems.map(({ order, item, idx }) => {
                      const cost = formatItemCost(item);
                      const optionsText = formatItemOptions(item);
                      const timeLabel = typeof item.classTimeLabel === 'string' ? item.classTimeLabel : '-';
                      const locationLabel = typeof item.classLocation === 'string' ? item.classLocation : '-';
                      return (
                        <tr
                          key={`${order.createdAtOrderId}-${idx}`}
                          className={`border-b border-white/10 hover:bg-white/5 ${
                            selectedId === order.createdAtOrderId ? 'bg-white/5' : ''
                          }`}
                        >
                          <td className="py-2 px-3">
                            {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-semibold">{order.customerName || '-'}</div>
                            <div className="opacity-70 text-xs">{order.customerEmail}</div>
                          </td>
                          <td className="py-2 px-3 min-w-[200px]">
                            <div className="font-semibold">{String(item.name || `Item ${idx + 1}`)}</div>
                          </td>
                          <td className="py-2 px-3 min-w-[160px]">{timeLabel}</td>
                          <td className="py-2 px-3 min-w-[160px]">{locationLabel}</td>
                          <td className="py-2 px-3">
                            {typeof item.quantity === 'number' ? item.quantity : '-'}
                          </td>
                          <td className="py-2 px-3 max-w-[300px] truncate" title={optionsText}>
                            {optionsText}
                          </td>
                          <td className="py-2 px-3">
                            {typeof cost === 'number' ? formatMoney(cost, order.currency) : '-'}
                          </td>
                          <td className="py-2 px-3 font-mono text-xs">{order.orderId}</td>
                          <td className="py-2 px-3">{order.status}</td>
                          <td className="py-2 px-3 flex gap-2">
                            <button
                              className="btn btn-ghost"
                              onClick={() => setSelectedId(order.createdAtOrderId)}
                            >
                              View
                            </button>
                            <button
                              className="btn btn-ghost"
                              onClick={() => setSelectedId(order.createdAtOrderId)}
                            >
                              Update Status
                            </button>
                            <button
                              className="btn btn-ghost"
                              onClick={() => void handleDelete(order)}
                              disabled={deleting}
                              title="Delete order"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {!filteredClassItems.length && !loading && (
                      <tr>
                        <td className="py-6 px-3 text-center opacity-70" colSpan={11}>
                          No class bookings found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="orders-list-mobile" data-view="classes">
                {(() => {
                  let lastDayKey: string | null = null;
                  const nodes: JSX.Element[] = [];

                  for (const { order, item, idx } of filteredClassItems) {
                    const dayKey = dayKeyFromISO(order.createdAt);
                    if (dayKey !== lastDayKey) {
                      lastDayKey = dayKey;
                      nodes.push(
                        <div key={`day-${dayKey}`} className="orders-day-separator">
                          {formatDayLabel(order.createdAt)}
                        </div>
                      );
                    }

                    const isSelected = selectedId === order.createdAtOrderId;
                    const cost = formatItemCost(item);
                    const optionsText = formatItemOptions(item);
                    const timeLabel = typeof item.classTimeLabel === 'string' ? item.classTimeLabel : '-';
                    const locationLabel = typeof item.classLocation === 'string' ? item.classLocation : '-';

                    nodes.push(
                      <div
                        key={`${order.createdAtOrderId}-${idx}`}
                        className={`orders-mobile-card ${isSelected ? 'is-selected' : ''}`}
                      >
                        <div className="orders-mobile-top">
                          <div className="min-w-0">
                            <div className="orders-mobile-title truncate">
                              {String(item.name || `Item ${idx + 1}`)}
                            </div>
                            <div className="orders-mobile-sub truncate">
                              {order.customerName || 'No name'} • {order.customerEmail}
                            </div>
                          </div>
                          <span className="orders-status-badge">{order.status}</span>
                        </div>

                        <div className="orders-mobile-grid">
                          <div className="orders-mobile-wide">
                            <span className="orders-mobile-label">Time</span>
                            <span className="orders-mobile-value">{timeLabel}</span>
                          </div>
                          <div className="orders-mobile-wide">
                            <span className="orders-mobile-label">Location</span>
                            <span className="orders-mobile-value">{locationLabel}</span>
                          </div>
                          <div>
                            <span className="orders-mobile-label">Qty</span>
                            <span className="orders-mobile-value">
                              {typeof item.quantity === 'number' ? item.quantity : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="orders-mobile-label">Cost</span>
                            <span className="orders-mobile-value">
                              {typeof cost === 'number' ? formatMoney(cost, order.currency) : '-'}
                            </span>
                          </div>
                          <div className="orders-mobile-wide">
                            <span className="orders-mobile-label">Options</span>
                            <span className="orders-mobile-value">{optionsText}</span>
                          </div>
                          <div className="orders-mobile-wide">
                            <span className="orders-mobile-label">Order</span>
                            <span className="orders-mobile-mono">{order.orderId}</span>
                          </div>
                        </div>

                        <div className="orders-mobile-actions">
                          <button
                            className="btn btn-ghost"
                            onClick={() => setSelectedId(order.createdAtOrderId)}
                          >
                            View
                          </button>
                          <button
                            className="btn btn-ghost"
                            onClick={() => setSelectedId(order.createdAtOrderId)}
                          >
                            Update Status
                          </button>
                          <button
                            className="btn btn-ghost"
                            onClick={() => void handleDelete(order)}
                            disabled={deleting}
                            title="Delete order"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (!nodes.length && !loading) {
                    nodes.push(
                      <div key="empty" className="orders-mobile-empty">
                        No class bookings found.
                      </div>
                    );
                  }

                  return nodes;
                })()}
              </div>
            </>
          ) : (
            <>
              <div className="orders-table-desktop">
                <table className="w-full text-sm">
                  <thead className="text-left sticky top-0 bg-[var(--panel)]/90 backdrop-blur border-b border-white/10">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Customer</th>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3">Qty</th>
                      <th className="py-2 px-3">Options</th>
                      <th className="py-2 px-3">Cost</th>
                      <th className="py-2 px-3">Order ID</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(({ order, item, idx }) => {
                      const cost = formatItemCost(item);
                      const optionsText = formatItemOptions(item);
                      return (
                        <tr
                          key={`${order.createdAtOrderId}-${idx}`}
                          className={`border-b border-white/10 hover:bg-white/5 ${
                            selectedId === order.createdAtOrderId ? 'bg-white/5' : ''
                          }`}
                        >
                          <td className="py-2 px-3">
                            {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-semibold">{order.customerName || '-'}</div>
                            <div className="opacity-70 text-xs">{order.customerEmail}</div>
                          </td>
                          <td className="py-2 px-3 min-w-[220px]">
                            <div className="font-semibold">{String(item.name || `Item ${idx + 1}`)}</div>
                            {typeof item.sku === 'string' && item.sku.trim() ? (
                              <div className="opacity-70 text-xs">SKU: {item.sku}</div>
                            ) : null}
                          </td>
                          <td className="py-2 px-3">
                            {typeof item.quantity === 'number' ? item.quantity : '-'}
                          </td>
                          <td className="py-2 px-3 max-w-[380px] truncate" title={optionsText}>
                            {optionsText}
                          </td>
                          <td className="py-2 px-3">
                            {typeof cost === 'number' ? formatMoney(cost, order.currency) : '-'}
                          </td>
                          <td className="py-2 px-3 font-mono text-xs">{order.orderId}</td>
                          <td className="py-2 px-3">{order.status}</td>
                          <td className="py-2 px-3 flex gap-2">
                            <button
                              className="btn btn-ghost"
                              onClick={() => setSelectedId(order.createdAtOrderId)}
                            >
                              View
                            </button>
                            <button
                              className="btn btn-ghost"
                              onClick={() => setSelectedId(order.createdAtOrderId)}
                            >
                              Update Status
                            </button>
                            <button
                              className="btn btn-ghost"
                              onClick={() => void handleDelete(order)}
                              disabled={deleting}
                              title="Delete order"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {!filteredItems.length && !loading && (
                      <tr>
                        <td className="py-6 px-3 text-center opacity-70" colSpan={9}>
                          No items found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="orders-list-mobile" data-view="items">
                {(() => {
                  let lastDayKey: string | null = null;
                  const nodes: JSX.Element[] = [];

                  for (const { order, item, idx } of filteredItems) {
                    const dayKey = dayKeyFromISO(order.createdAt);
                    if (dayKey !== lastDayKey) {
                      lastDayKey = dayKey;
                      nodes.push(
                        <div key={`day-${dayKey}`} className="orders-day-separator">
                          {formatDayLabel(order.createdAt)}
                        </div>
                      );
                    }

                    const isSelected = selectedId === order.createdAtOrderId;
                    const cost = formatItemCost(item);
                    const optionsText = formatItemOptions(item);

                    nodes.push(
                      <div
                        key={`${order.createdAtOrderId}-${idx}`}
                        className={`orders-mobile-card ${isSelected ? 'is-selected' : ''}`}
                      >
                        <div className="orders-mobile-top">
                          <div className="min-w-0">
                            <div className="orders-mobile-title truncate">
                              {String(item.name || `Item ${idx + 1}`)}
                            </div>
                            <div className="orders-mobile-sub truncate">
                              {order.customerName || 'No name'} • {order.customerEmail}
                            </div>
                            {typeof item.sku === 'string' && item.sku.trim() ? (
                              <div className="orders-mobile-sub truncate">SKU: {item.sku}</div>
                            ) : null}
                          </div>
                          <span className="orders-status-badge">{order.status}</span>
                        </div>

                        <div className="orders-mobile-grid">
                          <div>
                            <span className="orders-mobile-label">Qty</span>
                            <span className="orders-mobile-value">
                              {typeof item.quantity === 'number' ? item.quantity : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="orders-mobile-label">Cost</span>
                            <span className="orders-mobile-value">
                              {typeof cost === 'number' ? formatMoney(cost, order.currency) : '-'}
                            </span>
                          </div>
                          <div className="orders-mobile-wide">
                            <span className="orders-mobile-label">Options</span>
                            <span className="orders-mobile-value">{optionsText}</span>
                          </div>
                          <div className="orders-mobile-wide">
                            <span className="orders-mobile-label">Order</span>
                            <span className="orders-mobile-mono">{order.orderId}</span>
                          </div>
                          <div className="orders-mobile-wide">
                            <span className="orders-mobile-label">Received</span>
                            <span className="orders-mobile-value">
                              {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}
                            </span>
                          </div>
                        </div>

                        <div className="orders-mobile-actions">
                          <button
                            className="btn btn-ghost"
                            onClick={() => setSelectedId(order.createdAtOrderId)}
                          >
                            View
                          </button>
                          <button
                            className="btn btn-ghost"
                            onClick={() => setSelectedId(order.createdAtOrderId)}
                          >
                            Update Status
                          </button>
                          <button
                            className="btn btn-ghost"
                            onClick={() => void handleDelete(order)}
                            disabled={deleting}
                            title="Delete order"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (!nodes.length && !loading) {
                    nodes.push(
                      <div key="empty" className="orders-mobile-empty">
                        No items found.
                      </div>
                    );
                  }

                  return nodes;
                })()}
              </div>
            </>
          )}
        </div>

        <div className="border-t border-white/10 px-5 py-4">
          {selectedOrder ? (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Order Details</div>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setSelectedId(null)}
                    aria-label="Close order details"
                  >
                    Hide Details
                  </button>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-sm font-semibold mb-2">Items</div>
                  <div className="space-y-2">
                    {(selectedOrder.items || []).map((item, idx) => (
                      <div
                        key={`${selectedOrder.orderId}-${idx}`}
                        className="grid grid-cols-[1.4fr_auto_auto] gap-3 items-center rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="text-base font-semibold truncate">
                            {item.name || `Item ${idx + 1}`}
                          </div>
                          {item.sku && (
                            <div className="text-xs opacity-70">SKU: {item.sku}</div>
                          )}
                        </div>
                        <div className="text-sm opacity-80">
                          Qty: {item.quantity ?? '-'}
                        </div>
                        <div className="text-sm font-semibold">
                          {typeof item.total === 'number'
                            ? formatMoney((item.total), selectedOrder.currency)
                            : typeof item.price === 'number' && typeof item.quantity === 'number'
                            ? formatMoney(((item.price * item.quantity)), selectedOrder.currency)
                            : '-'}
                        </div>
                      </div>
                    ))}
                    {!selectedOrder.items?.length && (
                      <div className="opacity-70">No items.</div>
                    )}
                  </div>
                  <div className="mt-3 grid gap-2 text-sm">
                    {typeof selectedOrder.taxes?.taxCents === 'number' && (
                      <div className="flex justify-between border-t border-white/10 pt-2">
                        <span className="opacity-80">Tax</span>
                        <span className="font-semibold">
                          {formatMoney(selectedOrder.taxes.taxCents / 100, selectedOrder.currency)}
                        </span>
                      </div>
                    )}
                    {typeof selectedOrder.delivery?.flatFeeCents === 'number' && (
                      <div className="flex justify-between">
                        <span className="opacity-80">Shipping</span>
                        <span className="font-semibold">
                          {formatMoney(
                            selectedOrder.delivery.flatFeeCents / 100,
                            selectedOrder.currency
                          )}
                        </span>
                      </div>
                    )}
                    {typeof selectedOrder.taxes?.totalCents === 'number' && (
                      <div className="flex justify-between border-t border-white/10 pt-2 text-base font-semibold">
                        <span>Total</span>
                        <span>
                          {formatMoney(
                            selectedOrder.taxes.totalCents / 100,
                            selectedOrder.currency
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 mb-2">
                    <div className="text-xs uppercase tracking-wide opacity-70">Important info</div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">
                          {selectedOrder.customerName || 'No name'}
                        </div>
                        <div className="text-sm font-semibold">
                          {selectedOrder.customerEmail}
                        </div>
                      </div>
                      <div className="text-right text-sm font-semibold">
                        <div>
                          {(selectedOrder.fulfillment || selectedOrder.delivery?.fulfillment) ===
                          'delivery'
                            ? <><span className="underline mr-2"> Deilver to:</span>{selectedOrder.deliveryAddress ||
                              selectedOrder.delivery?.address ||
                              'No address'}</>
                            : 'Pickup order'}
                        </div>
                        <div className="opacity-80">
                          <span className="underline mr-2">Received:</span> {new Date(selectedOrder.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>Status: {selectedOrder.status}</div>
                  <div>Order ID: <span className="font-mono">{selectedOrder.orderId}</span></div>
                  
                  {selectedOrder.notes && <div>Notes: {selectedOrder.notes}</div>}
                </div>
              </div>
              <div className="space-y-3">
                <div className="font-semibold">Update Status</div>
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value)}
                  className="select w-full"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-primary w-full"
                  onClick={() => void handleUpdateStatus()}
                  disabled={savingStatus}
                >
                  {savingStatus ? 'Saving...' : 'Save Status'}
                </button>
                <button
                  className="btn btn-inverted w-full"
                  onClick={() => void handleDelete(selectedOrder)}
                  disabled={deleting}
                >
                  Delete Order
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm opacity-70">Select an order to view details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
