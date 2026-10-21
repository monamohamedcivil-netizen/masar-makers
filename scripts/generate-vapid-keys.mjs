// Run once:  node scripts/generate-vapid-keys.mjs
// Then add the three lines to the server environment (DigitalOcean / hosting env vars) and redeploy.
import { createECDH } from "node:crypto";

const b64url = (buf) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const ecdh = createECDH("prime256v1");
ecdh.generateKeys();

console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${b64url(ecdh.getPublicKey())}`);
console.log(`VAPID_PRIVATE_KEY=${b64url(ecdh.getPrivateKey())}`);
console.log(`VAPID_SUBJECT=mailto:notifications@masarmakers.com`);
console.log("\nKeep VAPID_PRIVATE_KEY secret. Never commit it.");
