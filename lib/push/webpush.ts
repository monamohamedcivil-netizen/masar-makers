import {
  createCipheriv,
  createECDH,
  createHmac,
  createPrivateKey,
  randomBytes,
  sign as cryptoSign,
} from "crypto";

/* =========================================================
   Minimal Web Push sender (no external dependency)
   - Payload encryption: RFC 8291 (aes128gcm, RFC 8188)
   - Server identification: VAPID, RFC 8292 (ES256 JWT)
   Keys come from env: NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
   (base64url, generate once with scripts/generate-vapid-keys.mjs).
========================================================= */

export type PushSubscriptionKeys = { endpoint: string; p256dh: string; auth: string };

export function b64urlDecode(value: string) {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function b64urlEncode(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function hmac(key: Buffer, data: Buffer) {
  return createHmac("sha256", key).update(data).digest();
}

/** RFC 8291 encryption. `asPrivate`/`salt` are injectable for test vectors only. */
export function encryptPayload(
  plaintext: Buffer,
  uaPublicB64: string,
  authSecretB64: string,
  opts: { asPrivate?: Buffer; salt?: Buffer; recordSize?: number } = {},
) {
  const uaPublic = b64urlDecode(uaPublicB64);
  const authSecret = b64urlDecode(authSecretB64);
  const ecdh = createECDH("prime256v1");
  if (opts.asPrivate) ecdh.setPrivateKey(opts.asPrivate);
  else ecdh.generateKeys();
  const asPublic = ecdh.getPublicKey();
  const ecdhSecret = ecdh.computeSecret(uaPublic);
  const salt = opts.salt ?? randomBytes(16);
  const rs = opts.recordSize ?? 4096;

  // IKM = HKDF(auth_secret, ecdh_secret, "WebPush: info" || 0x00 || ua_public || as_public, 32)
  const prkKey = hmac(authSecret, ecdhSecret);
  const keyInfo = Buffer.concat([Buffer.from("WebPush: info\0"), uaPublic, asPublic, Buffer.from([1])]);
  const ikm = hmac(prkKey, keyInfo);

  // CEK / NONCE = HKDF(salt, IKM, ...)
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.from("Content-Encoding: aes128gcm\0\x01")).subarray(0, 16);
  const nonce = hmac(prk, Buffer.from("Content-Encoding: nonce\0\x01")).subarray(0, 12);

  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const body = Buffer.concat([cipher.update(Buffer.concat([plaintext, Buffer.from([2])])), cipher.final(), cipher.getAuthTag()]);

  const header = Buffer.alloc(16 + 4 + 1);
  salt.copy(header, 0);
  header.writeUInt32BE(rs, 16);
  header.writeUInt8(asPublic.length, 20);
  return Buffer.concat([header, asPublic, body]);
}

function vapidAuthorization(endpoint: string, publicKeyB64: string, privateKeyB64: string, subject: string) {
  const pub = b64urlDecode(publicKeyB64); // 65 bytes, uncompressed
  const key = createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      d: privateKeyB64,
      x: b64urlEncode(pub.subarray(1, 33)),
      y: b64urlEncode(pub.subarray(33, 65)),
    },
    format: "jwk",
  });
  const header = b64urlEncode(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64urlEncode(
    Buffer.from(
      JSON.stringify({
        aud: new URL(endpoint).origin,
        exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
        sub: subject,
      }),
    ),
  );
  const unsigned = `${header}.${claims}`;
  const signature = cryptoSign("sha256", Buffer.from(unsigned), { key, dsaEncoding: "ieee-p1363" });
  return `vapid t=${unsigned}.${b64urlEncode(signature)}, k=${publicKeyB64}`;
}

export function vapidConfigured() {
  return Boolean(
    (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").trim() && (process.env.VAPID_PRIVATE_KEY ?? "").trim(),
  );
}

/** Send one notification. Returns the HTTP status (404/410 = subscription expired). */
export async function sendWebPush(sub: PushSubscriptionKeys, payload: Record<string, unknown>) {
  const publicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY ?? "").trim();
  const subject = (process.env.VAPID_SUBJECT ?? "mailto:notifications@masarmakers.com").trim();
  if (!publicKey || !privateKey) throw new Error("VAPID keys are not configured.");

  const body = encryptPayload(Buffer.from(JSON.stringify(payload)), sub.p256dh, sub.auth);
  const response = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: vapidAuthorization(sub.endpoint, publicKey, privateKey, subject),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
      Urgency: "high",
    },
    body,
  });
  return response.status;
}
