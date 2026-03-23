import crypto from "crypto";

const SECRET = process.env.JWT_SECRET || "ecommerce-secret-key-change-in-prod";

function base64url(data: string): string {
  return Buffer.from(data).toString("base64url");
}

function decodeBase64url(data: string): string {
  return Buffer.from(data, "base64url").toString("utf8");
}

export function signToken(payload: object): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token: string): Record<string, unknown> | null {
  try {
    const [header, body, sig] = token.split(".");
    const expected = crypto
      .createHmac("sha256", SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");
    if (sig !== expected) return null;
    return JSON.parse(decodeBase64url(body));
  } catch {
    return null;
  }
}
