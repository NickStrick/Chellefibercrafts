'use client';

import { useMemo, useState } from 'react';
import type { SiteConfig } from '@/types/site';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type AdminAIChatPanelProps = {
  mode?: 'drawer' | 'panel' | 'inline';
  title?: string;
  placeholder?: string;
  config: SiteConfig;
  onApplyPatch?: (patch: Partial<SiteConfig>) => void;
  onApplied?: () => void;
  onClose?: () => void;
};

const SITE_CONFIG_SKELETON = {
  theme: {
    preset: 'ocean | sunset | forest | slate | festival | candy | neon | grove | forest-earthy | lavender | irish | splunk | sue | custom',
    colors: {
      primary: '#000000',
      accent: '#000000',
      bg: '#000000',
      bg2: '#000000',
      fg: '#000000',
      muted: '#000000',
      text1: '#000000',
      text2: '#000000',
    },
    radius: 'sm | md | lg | xl | 2xl | full',
  },
  meta: { title: '', description: '', favicon: '' },
  settings: { general: {}, payments: {} },
  showHeader: true,
  header: { id: 'hdr', type: 'header' },
  sections: [{ id: '...', type: '...' }],
  showFooter: true,
  footer: { id: 'ftr', type: 'footer' },
};

function rid() {
  return Math.random().toString(36).slice(2);
}

type AiResponse = {
  reply?: string;
  patch?: Partial<SiteConfig> | null;
};

export default function AdminAIChatPanel({
  mode = 'drawer',
  title = 'AI Assistant (beta - in testing)',
  placeholder = 'Describe your edit request...',
  config,
  onApplyPatch,
  onApplied,
  onClose,
}: AdminAIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inlineExpanded, setInlineExpanded] = useState(false);

  const contextPayload = useMemo(() => {
    return {
      structure: SITE_CONFIG_SKELETON,
      current: {
        theme: config.theme,
        meta: config.meta,
        settings: config.settings,
        showHeader: config.showHeader,
        header: config.header,
        sections: config.sections,
        showFooter: config.showFooter,
        footer: config.footer,
      },
    };
  }, [config]);

  function addMessage(role: Message['role'], content: string) {
    setMessages((prev) => [...prev, { id: rid(), role, content }]);
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (mode === 'inline') setInlineExpanded(true);
    addMessage('user', trimmed);
    setInput('');
    setIsLoading(true);
    setError(null);
    try {
      const wireMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: trimmed },
      ];
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: wireMessages,
          context: contextPayload,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `AI request failed: ${res.status}`);
      }
      const data = (await res.json()) as AiResponse;
      if (data.reply) {
        addMessage('assistant', data.reply);
      }
      if (data.patch) {
        if (onApplyPatch) {
          onApplyPatch(data.patch);
          onApplied?.();
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI request failed.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  const shellClass =
    mode === 'drawer'
      ? 'fixed top-[168px] right-5 h-[580px] w-[360px] md:w-[420px]  admin-card shadow-2xl border-l z-[12000] flex flex-col'
      : mode === 'panel'
        ? 'h-full w-full  admin-card border-l flex flex-col'
        : 'w-full admin-card border rounded-xl flex flex-col';

  const isExpanded = mode !== 'inline' ? true : inlineExpanded || messages.length > 0;

  return (
    <div className={shellClass}>
      {mode !== 'inline' && (
        <>
          <div className="flex items-center justify-between px-4 py-3 ">
            <div className="font-semibold">{title}</div>
            {onClose && (
              <button className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
            )}
          </div>

          {isLoading && (
            <div className="px-4 py-3 ">
              <span className="ml-2 text-xs text-muted">Thinking...</span>
            </div>
          )}
        </>
      )}

      {mode === 'inline' && (
        <div className="px-4 py-3 ">
          <label className="block text-sm font-medium mb-1">{title}</label>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />
            <button className="btn btn-primary" onClick={handleSend} disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
          {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
        </div>
      )}

      {isExpanded && mode === 'inline' && isLoading && (
        <div className="px-4 py-2 border-b flex items-center gap-2">
          <span className="text-xs text-muted">Thinking...</span>
        </div>
      )}

      {isExpanded && (
      <div
        className={[
          'px-4 py-3 overflow-auto space-y-3',
          mode === 'inline' ? 'max-h-[260px]' : 'flex-1',
        ].join(' ')}
      >
        {messages.length === 0 ? (
          <div className="text-sm text-muted">
            Ask for edits like “add an about section above the footer” or “change my colors”.
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={[
                'rounded-lg px-3 py-2 text-sm',
                m.role === 'user' ? 'bg-emerald-50 text-emerald-900' : 'bg-black/5 text-white',
              ].join(' ')}
            >
              <div className="text-xs opacity-60 mb-1">{m.role === 'user' ? 'You' : 'AI'}</div>
              <div>{m.content}</div>
            </div>
          ))
        )}
      </div>
      )}

      {isExpanded && mode !== 'inline' && error && (
        <div className="px-4 py-2 border-t">
          <div className="text-xs text-red-600">{error}</div>
        </div>
      )}

      {mode !== 'inline' && (
        <div className="px-4 py-3 border-t flex gap-2">
          <input
            className="input flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
          <button className="btn btn-primary" onClick={handleSend} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      )}
    </div>
  );
}
