// Demo mode - rate limiting disabled

export interface UsageResult {
  allowed: boolean;
  reason?: string;
  remaining?: { tokens: number; requests: number };
}

export async function checkRateLimit(_userId: number): Promise<UsageResult> {
  return { allowed: true, remaining: { tokens: 999999, requests: 999999 } };
}

export async function trackUsage(
  _userId: number,
  _endpoint: string,
  _inputTokens: number,
  _outputTokens: number
): Promise<void> {
  // Demo mode - no tracking
}

export async function getUserUsageStats(_userId: number) {
  return {
    today: { tokens: 0, requests: 0, cost: 0 },
    tier: 'free',
    limits: { dailyTokens: 50000, dailyRequests: 100 }
  };
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}