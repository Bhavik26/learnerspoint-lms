const encoder = new TextEncoder();

function base64urlEncode(arr: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < arr.byteLength; i++) {
    bin += String.fromCharCode(arr[i]);
  }
  return btoa(bin)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64urlDecode(str: string): Uint8Array {
  let adjusted = str.replace(/-/g, "+").replace(/_/g, "/");
  while (adjusted.length % 4) {
    adjusted += "=";
  }
  const bin = atob(adjusted);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    arr[i] = bin.charCodeAt(i);
  }
  return arr;
}

export async function signJWT(payload: any, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64urlEncode(encoder.encode(JSON.stringify(header)));
  const encodedPayload = base64urlEncode(encoder.encode(JSON.stringify(payload)));
  
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"]
  );
  
  const tokenData = `${encodedHeader}.${encodedPayload}`;
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(tokenData)
  );
  
  const encodedSignature = base64urlEncode(new Uint8Array(signature));
  return `${tokenData}.${encodedSignature}`;
}

export async function verifyJWT(token: string, secret: string): Promise<any | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const tokenData = `${encodedHeader}.${encodedPayload}`;
    
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["verify"]
    );
    
    const signatureBytes = base64urlDecode(encodedSignature);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as any,
      encoder.encode(tokenData)
    );
    
    if (!isValid) return null;
    
    const payloadJson = new TextDecoder().decode(base64urlDecode(encodedPayload));
    const payload = JSON.parse(payloadJson);
    
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  
  const exportedKey = await crypto.subtle.exportKey("raw", derivedKey);
  const keyBytes = new Uint8Array(exportedKey);
  
  const hexSalt = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
  const hexKey = Array.from(keyBytes).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${hexSalt}:${hexKey}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [hexSalt, hexKey] = storedHash.split(":");
    if (!hexSalt || !hexKey) return false;
    
    const salt = new Uint8Array(hexSalt.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const baseKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
    
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    
    const exportedKey = await crypto.subtle.exportKey("raw", derivedKey);
    const keyBytes = new Uint8Array(exportedKey);
    const derivedHex = Array.from(keyBytes).map(b => b.toString(16).padStart(2, "0")).join("");
    return derivedHex === hexKey;
  } catch {
    return false;
  }
}
