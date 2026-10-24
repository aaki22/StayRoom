export interface Lease {
  until: Date;
}

export interface RetryFailure {
  code: string;
  safeMessage: string;
  retryAt: Date;
  outcomeUnknown: boolean;
}