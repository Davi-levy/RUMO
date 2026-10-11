type CredentialResponse = { credential: string };
type GoogleIdentity = {
  initialize: (options: { client_id: string; callback: (response: CredentialResponse) => void;
    nonce: string; context: "signin"; ux_mode: "popup"; auto_select: boolean; use_fedcm_for_button: boolean }) => void;
  renderButton: (element: HTMLElement, options: { type: "standard"; theme: "filled_black";
    size: "large"; text: "continue_with"; shape: "rectangular"; logo_alignment: "left"; locale: "pt-BR" }) => void;
  disableAutoSelect: () => void;
};

declare global {
  interface Window { google?: { accounts: { id: GoogleIdentity } } }
}

let scriptPromise: Promise<GoogleIdentity> | undefined;
let configuracao: { clientId: string; nonce: string } | undefined;
let inicializacao: Promise<GoogleIdentity> | undefined;
let callbackAtivo: ((token: string, nonce: string) => void) | undefined;

export function carregarGoogleIdentity(): Promise<GoogleIdentity> {
  if (window.google?.accounts.id) return Promise.resolve(window.google.accounts.id);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    const falhar = () => { script.remove(); reject(new Error("Não foi possível carregar o login Google.")); };
    const timeout = window.setTimeout(falhar, 15_000);
    script.onload = () => {
      window.clearTimeout(timeout);
      if (window.google?.accounts.id) resolve(window.google.accounts.id);
      else falhar();
    };
    script.onerror = () => { window.clearTimeout(timeout); falhar(); };
    document.head.append(script);
  }).catch(error => { scriptPromise = undefined; throw error; });
  return scriptPromise;
}

export async function criarNonceGoogle() {
  const nonce = [...crypto.getRandomValues(new Uint8Array(32))].map(value => value.toString(16).padStart(2, "0")).join("");
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(nonce));
  const hashedNonce = [...new Uint8Array(hash)].map(value => value.toString(16).padStart(2, "0")).join("");
  return { nonce, hashedNonce };
}

export async function configurarGoogleIdentity(clientId: string) {
  if (inicializacao) await inicializacao;
  if (configuracao?.clientId === clientId) return carregarGoogleIdentity();
  inicializacao = (async () => {
    const sdk = await carregarGoogleIdentity();
    const { nonce, hashedNonce } = await criarNonceGoogle();
    sdk.initialize({ client_id: clientId, nonce: hashedNonce, context: "signin", ux_mode: "popup", auto_select: false,
      use_fedcm_for_button: true,
      callback: response => {
        if (configuracao && response.credential) callbackAtivo?.(response.credential, configuracao.nonce);
      },
    });
    configuracao = { clientId, nonce };
    return sdk;
  })();
  try { return await inicializacao; }
  finally { inicializacao = undefined; }
}

export function receberLoginGoogle(callback: (token: string, nonce: string) => void) {
  callbackAtivo = callback;
  return () => { if (callbackAtivo === callback) callbackAtivo = undefined; };
}

export function desativarLoginAutomaticoGoogle() {
  window.google?.accounts.id.disableAutoSelect();
}
