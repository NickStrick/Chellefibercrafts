import { NextRequest, NextResponse } from 'next/server';
import { Resend } from '@resend/node';

export type ContactPayload = {
  siteId?: string;
  recipientEmail: string;
  senderName?: string;
  subject?: string;
  /** Key-value pairs of submitted field labels → values */
  fields: { label: string; value: string }[];
};

export async function POST(req: NextRequest) {
  let body: ContactPayload;
  try {
    body = (await req.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { recipientEmail, subject, fields, senderName } = body;

  if (!recipientEmail) {
    return NextResponse.json({ error: 'recipientEmail is required.' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Email service not configured.' }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  const rows = fields
    .map(({ label, value }) => `<tr><td style="padding:6px 12px;font-weight:600;white-space:nowrap">${label}</td><td style="padding:6px 12px">${value || '—'}</td></tr>`)
    .join('');

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="margin-bottom:4px">${subject ?? 'New message'}</h2>
      ${senderName ? `<p style="color:#666;margin-top:0">From: ${senderName}</p>` : ''}
      <table style="border-collapse:collapse;width:100%;margin-top:16px">
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  const fromDomain = process.env.RESEND_FROM_EMAIL ?? 'noreply@notifications.site-crafter.com';

  const { error } = await resend.emails.send({
    from: fromDomain,
    to: recipientEmail,
    subject: subject ?? 'New message from your website',
    html,
  });

  if (error) {
    console.error('[contact] Resend error', error);
    return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
