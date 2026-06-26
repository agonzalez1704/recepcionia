import { describe, it, expect, beforeAll } from "vitest";

// Setear env antes de importar (getServerEnv cachea)
beforeAll(() => {
  process.env.CLERK_SECRET_KEY = "sk_test_x";
  process.env.INSFORGE_API_KEY = "ik_x";
  process.env.INSFORGE_JWT_SECRET = "jwt_x";
  process.env.INSFORGE_ENCRYPTION_KEY = Buffer.alloc(32, "k").toString("base64");
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_x";
  process.env.NEXT_PUBLIC_INSFORGE_BASE_URL = "https://example.com";
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY = "anon_x";
});

describe("crypto", () => {
  it("encripta y desencripta round-trip", async () => {
    const { encriptar, desencriptar } = await import("./crypto");
    const plain = "secret-webhook-token-abc123";
    const enc = encriptar(plain);
    expect(enc).not.toBe(plain);
    expect(desencriptar(enc)).toBe(plain);
  });

  it("produce ciphertext distinto cada vez (IV random)", async () => {
    const { encriptar } = await import("./crypto");
    const a = encriptar("hola");
    const b = encriptar("hola");
    expect(a).not.toBe(b);
  });

  it("tira error si manipulan ciphertext", async () => {
    const { encriptar, desencriptar } = await import("./crypto");
    const enc = encriptar("hola");
    const buf = Buffer.from(enc, "base64");
    buf[buf.length - 1] ^= 0x01; // flip último bit
    expect(() => desencriptar(buf.toString("base64"))).toThrow();
  });
});
