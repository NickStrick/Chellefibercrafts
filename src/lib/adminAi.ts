const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);

function parseEnabled(value: string | undefined) {
  return value ? TRUE_VALUES.has(value.trim().toLowerCase()) : false;
}

export function isAdminAiUiEnabled() {
  return parseEnabled(process.env.NEXT_PUBLIC_ADMIN_AI_ENABLED);
}

export function isAdminAiServerEnabled() {
  return parseEnabled(process.env.ADMIN_AI_ENABLED)
    || parseEnabled(process.env.NEXT_PUBLIC_ADMIN_AI_ENABLED);
}
