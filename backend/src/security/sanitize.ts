// Strip characters that could be used for prompt injection
const INJECTION_PATTERN = /(\b(ignore|forget|disregard|override|bypass|system|assistant|user|human|AI|GPT|Claude|Anthropic)\b.*:|\{\{|\}\}|<\|.*\|>)/gi;
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const NEWLINE_EXCESS = /\n{3,}/g;

export function sanitizeField(input: string, maxLen: number): string {
  return input
    .replace(CONTROL_CHARS, '')
    .replace(INJECTION_PATTERN, '[REDACTED]')
    .replace(NEWLINE_EXCESS, '\n\n')
    .slice(0, maxLen)
    .trim();
}

export function sanitizeThreatData(data: {
  appName: string;
  description: string;
  permissions: string[];
}): { appName: string; description: string; permissions: string[] } {
  return {
    appName: sanitizeField(data.appName, 80),
    description: sanitizeField(data.description, 400),
    permissions: data.permissions.map(p => sanitizeField(p, 60)).filter(p => /^[A-Z_a-z.]+$/.test(p)),
  };
}
