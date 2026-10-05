import type { OrderItem } from '../types/orders';

type OrderLike = {
  orderId?: unknown;
  createdAt?: unknown;
  customerEmail?: unknown;
  customerName?: unknown;
  items?: unknown;
  total?: unknown;
  currency?: unknown;
  businessDisplayName?: unknown;
  businessNotificationEmail?: unknown;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toStringOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toNumberOrNaN(value: unknown): number {
  return typeof value === 'number' ? value : Number.NaN;
}

function normalizeItems(value: unknown): OrderItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x) => !!x && typeof x === 'object') as OrderItem[];
}

export function formatMoney(amount: number, currency: string): string {
  if (!Number.isFinite(amount)) return '';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return String(amount);
  }
}

// Options selection (e.g. { Size: "4x4" }) rendered as "Size: 4x4" — same field
// products and classes both use for their variant selection.
function formatItemOptionsText(item: OrderItem): string {
  const options = (item as Record<string, unknown>).options;
  if (options && typeof options === 'object' && !Array.isArray(options)) {
    const pairs = Object.entries(options as Record<string, unknown>)
      .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
      .map(([k, v]) => `${k}: ${v}`);
    if (pairs.length) return pairs.join(', ');
  }
  return '';
}

function renderItemsList(items: OrderItem[], currency: string): string {
  if (!items.length) return '<p>(No items)</p>';
  const rows = items
    .map((item) => {
      const name = escapeHtml(toStringOrEmpty(item.name) || 'Item');
      const qty = typeof item.quantity === 'number' && Number.isFinite(item.quantity) ? item.quantity : 1;
      const lineTotal =
        typeof item.total === 'number' && Number.isFinite(item.total)
          ? item.total
          : typeof item.price === 'number' && Number.isFinite(item.price)
            ? item.price * qty
            : Number.NaN;
      const money = lineTotal ? escapeHtml(formatMoney(lineTotal, currency)) : '';

      // Class bookings: show the selected option/type (if any), the booked time, and the location.
      const rec = item as Record<string, unknown>;
      const classTimeLabel = typeof rec.classTimeLabel === 'string' ? rec.classTimeLabel : '';
      const classLocation = typeof rec.classLocation === 'string' ? rec.classLocation : '';
      const optionsText = formatItemOptionsText(item);
      const detailBits = [optionsText, classTimeLabel, classLocation].filter(Boolean).map(escapeHtml);
      const details = detailBits.length
        ? `<br/><span style="opacity:0.7;font-size:0.9em">${detailBits.join(' · ')}</span>`
        : '';

      return `<li><strong>${name}</strong> × ${qty}${money ? ` — ${money}` : ''}${details}</li>`;
    })
    .join('');
  return `<ul>${rows}</ul>`;
}

export function buildCustomerEmail(params: { order: OrderLike }): {
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  html: string;
} | null {
  const { order } = params;
  const customerEmail = toStringOrEmpty(order.customerEmail).trim();
  const businessDisplayName = toStringOrEmpty(order.businessDisplayName).trim();
  const businessNotificationEmail = toStringOrEmpty(order.businessNotificationEmail).trim();
  const orderId = toStringOrEmpty(order.orderId).trim();
  const currency = (toStringOrEmpty(order.currency).trim() || 'USD').toUpperCase();
  const items = normalizeItems(order.items);
  const total = toNumberOrNaN(order.total);

  if (!customerEmail || !businessNotificationEmail || !businessDisplayName) return null;

  const subject = 'Your order is confirmed 🎉';
  const html = [
    `<h2>Thank you for your order!</h2>`,
    `<p>We’ve received your order and it’s confirmed.</p>`,
    orderId ? `<p><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>` : '',
    `<h3>Items</h3>`,
    renderItemsList(items, currency),
    Number.isFinite(total)
      ? `<p><strong>Total:</strong> ${escapeHtml(formatMoney(total, currency))}</p>`
      : '',
    `<p>If you have questions, contact us at <a href="mailto:${escapeHtml(businessNotificationEmail)}">${escapeHtml(businessNotificationEmail)}</a>.</p>`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    to: customerEmail,
    from: `${businessDisplayName} <orders@saplingsites.com>`,
    replyTo: businessNotificationEmail,
    subject,
    html,
  };
}

export function buildBusinessEmail(params: { order: OrderLike }): {
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  html: string;
} | null {
  const { order } = params;
  const businessNotificationEmail = toStringOrEmpty(order.businessNotificationEmail).trim();
  const customerEmail = toStringOrEmpty(order.customerEmail).trim();
  const customerName = toStringOrEmpty(order.customerName).trim();
  const orderId = toStringOrEmpty(order.orderId).trim();
  const createdAt = toStringOrEmpty(order.createdAt).trim();
  const currency = (toStringOrEmpty(order.currency).trim() || 'USD').toUpperCase();
  const items = normalizeItems(order.items);
  const total = toNumberOrNaN(order.total);

  if (!businessNotificationEmail) return null;

  const subject = `New Order Received – ${orderId || 'Unknown Order'}`;
  const html = [
    `<h2>New order received</h2>`,
    customerName ? `<p><strong>Customer:</strong> ${escapeHtml(customerName)}</p>` : '',
    customerEmail ? `<p><strong>Customer email:</strong> ${escapeHtml(customerEmail)}</p>` : '',
    orderId ? `<p><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>` : '',
    `<h3>Items</h3>`,
    renderItemsList(items, currency),
    Number.isFinite(total)
      ? `<p><strong>Total:</strong> ${escapeHtml(formatMoney(total, currency))}</p>`
      : '',
    createdAt ? `<p><strong>Created:</strong> ${escapeHtml(createdAt)}</p>` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    to: businessNotificationEmail,
    from: 'New Order <orders@saplingsites.com>',
    replyTo: businessNotificationEmail,
    subject,
    html,
  };
}
