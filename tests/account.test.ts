import { expect, test } from "bun:test";
import type { User } from "@supabase/supabase-js";
import { perfilConta, temGoogle } from "../src/lib/account";
import { recoveryValida } from "../src/lib/password-recovery";
import { criarNonceGoogle } from "../src/lib/google-identity";

const user = (extra: Partial<User> = {}) => ({ id: "user-1", email: "teste@example.com", user_metadata: {}, app_metadata: {}, ...extra }) as User;

test("detecta Google em contas vinculadas sem confiar no metadata editável", () => {
  expect(temGoogle(user({ user_metadata: { provider: "google" } }))).toBe(false);
  expect(temGoogle(user({ app_metadata: { providers: ["email", "google"] } }))).toBe(true);
  expect(temGoogle(user({ identities: [{ provider: "email" }, { provider: "google" }] as User["identities"] }))).toBe(true);
});

test("usa foto do Google e iniciais como alternativa, descartando URLs inseguras", () => {
  expect(perfilConta(user({ user_metadata: { nome: "Davi Silva" } }))).toEqual({ nome: "Davi Silva", iniciais: "DS", foto: undefined });
  const google = user({ app_metadata: { provider: "google" }, user_metadata: { full_name: "Maria Santos", picture: "https://example.com/avatar.png" } });
  expect(perfilConta(google).foto).toBe("https://example.com/avatar.png");
  google.user_metadata.picture = "javascript:alert(1)";
  expect(perfilConta(google).foto).toBeUndefined();
});

test("recuperação só restaura marcador válido do mesmo usuário", () => {
  expect(recoveryValida(JSON.stringify({ userId: "user-1", expiraEm: 200 }), "user-1", 100)).toBe(true);
  expect(recoveryValida(JSON.stringify({ userId: "user-1", expiraEm: 200 }), "user-2", 100)).toBe(false);
  expect(recoveryValida(JSON.stringify({ userId: "user-1", expiraEm: 200 }), "user-1", 200)).toBe(false);
  expect(recoveryValida("invalid", "user-1")).toBe(false);
});

test("nonce Google é aleatório e separado de seu SHA-256 enviado ao Google", async () => {
  const first = await criarNonceGoogle();
  const second = await criarNonceGoogle();
  expect(first.nonce).toMatch(/^[a-f0-9]{64}$/);
  expect(first.nonce).not.toBe(second.nonce);
  expect(first.hashedNonce).toBe(new Bun.CryptoHasher("sha256").update(first.nonce).digest("hex"));
  expect(first.hashedNonce).not.toBe(first.nonce);
});
