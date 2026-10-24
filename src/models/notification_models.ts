import type { JsonObject } from './audit_models.ts';

export interface EncryptedPayload {
  ciphertext: Buffer;
  keyId: string;
}

export interface NotificationInput {
  recipientUserId: string | null;
  recipientEmail: string;
  bookingId: string | null;
  passwordResetTokenId: string | null;
  templateCode: string;
  templateVersion: number;
  templateData: JsonObject;
  sensitiveData: JsonObject | null;
  deduplicationKey: string;
}

export interface RenderedEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  messageKey: string;
}

export interface DeliveryReceipt {
  providerMessageId: string;
}