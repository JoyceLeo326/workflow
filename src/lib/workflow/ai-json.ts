export type JsonRetryResult<T> = {
  value: T;
  usedFallback: boolean;
  attempts: number;
  error?: string;
};

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  return JSON.parse(candidate);
}

export async function requestJsonWithRetry<T>(
  provider: () => Promise<string>,
  fallback: T,
  maxAttempts = 2,
): Promise<JsonRetryResult<T>> {
  let lastError = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return {
        value: extractJson(await provider()) as T,
        usedFallback: false,
        attempts: attempt,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  return {
    value: fallback,
    usedFallback: true,
    attempts: maxAttempts,
    error: lastError,
  };
}
