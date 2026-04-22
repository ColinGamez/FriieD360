export function getErrorMessage(error: unknown, fallbackMessage = 'Request failed') {
  return error instanceof Error && error.message ? error.message : fallbackMessage;
}

function parseJsonSafely(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractErrorMessage(payload: unknown) {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }

  if (payload && typeof payload === 'object') {
    const value = payload as { error?: unknown; message?: unknown };
    if (typeof value.error === 'string' && value.error.trim()) {
      return value.error.trim();
    }

    if (typeof value.message === 'string' && value.message.trim()) {
      return value.message.trim();
    }
  }

  return null;
}

export async function readJsonOrThrow<T>(response: Response, fallbackMessage = 'Request failed'): Promise<T> {
  const rawBody = await response.text();
  const payload = rawBody ? parseJsonSafely(rawBody) : null;

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload) || response.statusText || fallbackMessage);
  }

  return payload as T;
}
