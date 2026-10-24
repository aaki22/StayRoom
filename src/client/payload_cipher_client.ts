import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { JsonObject } from '../models/audit_models.ts';
import type { EncryptedPayload } from '../models/notification_models.ts';
import type { Settings } from '../settings.ts';

export interface IPayloadCipherClient {
  encrypt(data: JsonObject): EncryptedPayload;
  decrypt(payload: EncryptedPayload): JsonObject;
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;

export class PayloadCipherClient implements IPayloadCipherClient {
  private readonly key: Buffer;
  private readonly keyId: string;

  public constructor(settings: Settings) {
    this.key = Buffer.from(settings.PAYLOAD_ENCRYPTION_KEY_BASE64, 'base64');
    this.keyId = settings.PAYLOAD_ENCRYPTION_KEY_ID;
  }

  public encrypt(data: JsonObject): EncryptedPayload {
    const iv = randomBytes(IV_LENGTH_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH_BYTES,
    });
    const plaintext = Buffer.from(JSON.stringify(data), 'utf8');
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      keyId: this.keyId,
      ciphertext: Buffer.concat([iv, authTag, encrypted]),
    };
  }

  public decrypt(payload: EncryptedPayload): JsonObject {
    if (payload.keyId !== this.keyId) {
      throw new Error(`Unsupported payload encryption key ID: ${payload.keyId}`);
    }
    const minLength = IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES;
    if (payload.ciphertext.length < minLength) {
      throw new Error('Malformed encrypted payload');
    }

    const iv = payload.ciphertext.subarray(0, IV_LENGTH_BYTES);
    const authTag = payload.ciphertext.subarray(IV_LENGTH_BYTES, minLength);
    const body = payload.ciphertext.subarray(minLength);

    const decipher = createDecipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH_BYTES,
    });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8');
    const parsed: unknown = JSON.parse(decrypted);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Decrypted payload is not a JSON object');
    }
    return parsed as JsonObject;
  }
}