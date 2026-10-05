import { NextResponse } from 'next/server';
import type { SiteConfig } from '@/types/site';
import OpenAI from 'openai';
import { isAdminAiServerEnabled } from '@/lib/adminAi';

type Message = { role: 'user' | 'assistant'; content: string };

type AiRequest = {
  messages: Message[];
  context: {
    structure: unknown;
    current: Partial<SiteConfig>;
  };
};

export async function POST(req: Request) {
  if (!isAdminAiServerEnabled()) {
    return NextResponse.json({ error: 'Admin AI is disabled' }, { status: 403 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log('[api/admin/ai] OPENAI_API_KEY present:', true, 'len:', apiKey.length);
  }

  let body: AiRequest;
  try {
    body = (await req.json()) as AiRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const client = new OpenAI({ apiKey });
  const userMessages = (body.messages ?? []).map(({ role, content }) => ({ role, content }));

  const systemPrompt = [
    'You are a SiteConfig editor assistant.',
    'Return a JSON object ONLY with keys: "reply" (string) and optional "patch" (object).',
    'The "patch" should be a partial SiteConfig to apply as a deep-merge.',
    'Header and footer are top-level fields: patch.header, patch.showHeader, patch.footer, patch.showFooter. Do NOT put header/footer inside patch.sections and do NOT reorder them.',
    'For body sections edits: set patch.sections to an array of sections to add/update by id (do NOT send the full current sections array).',
    'To delete a section: include { "id": "...", "_delete": true } in patch.sections.',
    'Do not include code fences or extra text outside JSON.',
    'If no patch is needed, omit "patch".',
  ].join(' ');

  const contextPayload = JSON.stringify({
    structure: body.context?.structure ?? {},
    current: body.context?.current ?? {},
  });

  try {
    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context:\n${contextPayload}` },
        ...userMessages,
      ],
    });

    const text = response.output_text ?? '';
    if (process.env.NODE_ENV !== 'production') {
      console.log('[api/admin/ai] OpenAI response received. output_text_len:', text.length);
    }
    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ reply: text });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'AI request failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
