export interface IdempotencyScope {
  userId: string;
  operation: string;
}

export interface StoredOutcome<T> {
  httpStatus: number;
  message: string;
  data: T | null;
}

export type ClaimKind = 'claimed' | 'replay' | 'conflict' | 'inProgress';

export interface ClaimResult<T> {
  kind: ClaimKind;
  recordId: string;
  outcome: StoredOutcome<T> | null;
}