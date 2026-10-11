import { afterEach, describe, expect, test } from "bun:test";
import { buscarVideosYouTube } from "../src/lib/youtube.server";
import { carregarRecomendacoes } from "../src/lib/youtube-recomendacoes.server";
import { prepararContextoVideos } from "../src/lib/youtube-contexto.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/integrations/supabase/types";

const originalFetch = globalThis.fetch;
const originalKey = process.env.YOUTUBE_API_KEY;
const ids = ["abcdefghij1", "abcdefghij2", "abcdefghij3", "abcdefghij4"];
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const search = (videoIds: string[]) => json({ items: videoIds.map(videoId => ({ id: { videoId } })) });
const video = (id: string, language = "pt-BR", embeddable = true) => ({
  id, snippet: { title: "Python React Expo tutorial", channelTitle: "Canal", defaultAudioLanguage: language },
  status: { embeddable, privacyStatus: "public", uploadStatus: "processed" }, contentDetails: {},
});

const loginContexto = {
  linguagem: "Como criar login com React Native Expo Go", nivel: "intermediario",
  titulo: "Criando Sistema de Login com React Native e Expo Go", descricao: "Autenticação de usuários",
  modulos: [{ titulo: "Telas de login e cadastro" }, { titulo: "Proteção de rotas" }],
};

describe("Correspondência com o conteúdo da trilha", () => {
  test("busca pelo objetivo em português e inglês e não só pelo nome da tecnologia", () => {
    const contexto = prepararContextoVideos(loginContexto);
    expect(contexto.consulta("pt")).toContain("React Native Expo login");
    expect(contexto.consulta("en")).toContain("React Native Expo login");
    expect(contexto.consulta("pt")).not.toContain("Como criar");
  });

  test("rejeita publicação de apps, entrevistas React web e tutoriais genéricos de IA", () => {
    const contexto = prepararContextoVideos(loginContexto);
    expect(contexto.relevancia("Meu Primeiro App React Native Foi Publicado na Google Play", "React Native Expo Go")).toBe(0);
    expect(contexto.relevancia("React JS Interview Questions", "Login authentication Expo")).toBe(0);
    expect(contexto.relevancia("How to Vibe Code", "Beginners tutorial")).toBe(0);
    expect(contexto.relevancia("Curso completo React Native Expo", "login auth deploy banco de dados")).toBe(0);
    expect(contexto.relevancia("React Native Expo login e autenticação", "Proteção de rotas")).toBeGreaterThan(0);
    expect(contexto.relevancia("React Native authentication tutorial", "Expo Go login")).toBeGreaterThan(0);
  });

  test("conteúdos distintos da mesma linguagem possuem caches separados", () => {
    const login = prepararContextoVideos(loginContexto);
    const deploy = prepararContextoVideos({ ...loginContexto, titulo: "Publicação de apps", linguagem: "React Native Expo deploy" });
    const outrosModulos = prepararContextoVideos({ ...loginContexto, modulos: [{ titulo: "Login com Firebase" }] });
    expect(login.chave).not.toBe(deploy.chave);
    expect(login.chave).not.toBe(outrosModulos.chave);
    expect(login.chave).toBe(prepararContextoVideos(loginContexto).chave);
  });

  test("usa assuntos dos módulos para uma trilha com pedido genérico", () => {
    const contexto = prepararContextoVideos({ linguagem: "Python", titulo: "Trilha Python para Iniciantes Absolutos",
      nivel: "iniciante", descricao: null, modulos: [{ titulo: "Testes automatizados" }] });
    expect(contexto.consulta("en")).toContain("Python testing");
    expect(contexto.relevancia("Python tutorial", "")).toBeGreaterThan(0);
    expect(contexto.relevancia("Java tutorial", "")).toBe(0);
  });
});

function banco(options: { dono?: boolean; completo?: boolean; cache?: unknown; anterior?: unknown; disputa?: boolean } = {}) {
  let cache = options.cache ?? null;
  let leituras = 0;
  let reservas = 0;
  const criado_em = new Date().toISOString();
  const client = { from: (table: string) => {
    let operation = "select";
    let columns = "";
    let values: Record<string, unknown> = {};
    let filtroContexto: string | undefined;
    const query = {
      select: (value: string) => { columns = value; return query; },
      eq: (column: string, value: string) => { if (column === "contexto") filtroContexto = value; return query; },
      neq: () => query, gt: () => query, limit: () => query, order: () => query, maybeSingle: () => query,
      insert: (value: Record<string, unknown>) => { operation = "insert"; values = value; return query; },
      update: (value: Record<string, unknown>) => { operation = "update"; values = value; return query; },
      then: (resolve: (value: unknown) => unknown) => {
        if (table === "trilhas") return Promise.resolve(resolve({ data: options.dono === false ? null : { linguagem: "Python", nivel: "iniciante", titulo: "Python", descricao: null }, error: null }));
        if (table === "modulos") return Promise.resolve(resolve({ data: options.completo === false ? [] : [{ titulo: "Fundamentos" }], error: null }));
        if (operation === "insert") {
          reservas++;
          if (options.disputa) return Promise.resolve(resolve({ error: { code: "23505" } }));
          cache = { estado: "pendente", videos: [], criado_em, contexto: values.contexto };
        } else if (operation === "update") {
          cache = { ...cache as object, ...values };
        } else if (columns === "videos") {
          return Promise.resolve(resolve({ data: options.anterior ? [{ videos: options.anterior }] : [], error: null }));
        } else {
          const contextoSalvo = (cache as { contexto?: string } | null)?.contexto;
          const visivel = contextoSalvo && contextoSalvo !== filtroContexto ? null : cache;
          return Promise.resolve(resolve({ data: options.disputa && leituras++ === 0 ? null : visivel, error: null }));
        }
        return Promise.resolve(resolve({ data: null, error: null }));
      },
    };
    return query;
  } } as unknown as SupabaseClient<Database>;
  return { client, reservas: () => reservas };
}

describe("Economia de buscas por trilha", () => {
  const salvos = [{ id: ids[0], titulo: "Tutorial", canal: "Canal", idioma: "pt", obtidoEm: new Date().toISOString() }];
  test("ignora o cache da busca antiga e salva novas recomendações sem repetir a busca na próxima visita", async () => {
    process.env.YOUTUBE_API_KEY = "teste";
    let calls = 0;
    const responses = [search(ids.slice(0, 3)), json({ items: ids.slice(0, 3).map(id => video(id)) })];
    globalThis.fetch = (async () => { calls++; return responses.shift()!; }) as typeof fetch;
    const db = banco({ cache: { contexto: "legacy", estado: "pronto", videos: salvos, criado_em: new Date().toISOString() } });
    const result = await carregarRecomendacoes(db.client, "trilha");
    expect(result.videos).toHaveLength(3);
    expect(result.videos).not.toEqual(salvos);
    expect((await carregarRecomendacoes(db.client, "trilha")).videos).toEqual(result.videos);
    expect(calls).toBe(2);
    expect(db.reservas()).toBe(1);
  });
  test("abrir novamente usa o cache sem reservar ou consultar o YouTube", async () => {
    let calls = 0;
    globalThis.fetch = (async () => { calls++; throw new Error("Não deveria consultar"); }) as typeof fetch;
    const db = banco({ cache: { estado: "pronto", videos: salvos, criado_em: new Date().toISOString() } });
    expect((await carregarRecomendacoes(db.client, "trilha")).videos).toEqual(salvos);
    expect(db.reservas()).toBe(0);
    expect(calls).toBe(0);
  });

  test("trilha alheia ou incompleta não consome a API", async () => {
    let calls = 0;
    globalThis.fetch = (async () => { calls++; throw new Error("Não deveria consultar"); }) as typeof fetch;
    await expect(carregarRecomendacoes(banco({ dono: false }).client, "trilha")).rejects.toThrow("Trilha não encontrada");
    expect((await carregarRecomendacoes(banco({ completo: false }).client, "trilha")).estado).toBe("indisponivel");
    expect(calls).toBe(0);
  });

  test("duas abas disputando a reserva reutilizam o resultado salvo", async () => {
    process.env.YOUTUBE_API_KEY = "teste";
    let calls = 0;
    globalThis.fetch = (async () => { calls++; throw new Error("Não deveria consultar"); }) as typeof fetch;
    const db = banco({ disputa: true, cache: { estado: "pronto", videos: salvos, criado_em: new Date().toISOString() } });
    expect((await carregarRecomendacoes(db.client, "trilha")).videos).toEqual(salvos);
    expect(calls).toBe(0);
  });

  test("outra trilha recente do mesmo tema reutiliza os vídeos", async () => {
    process.env.YOUTUBE_API_KEY = "teste";
    let calls = 0;
    globalThis.fetch = (async () => { calls++; throw new Error("Não deveria consultar"); }) as typeof fetch;
    const db = banco({ anterior: salvos });
    expect((await carregarRecomendacoes(db.client, "trilha")).videos).toEqual(salvos);
    expect((await carregarRecomendacoes(db.client, "trilha")).videos).toEqual(salvos);
    expect(db.reservas()).toBe(1);
    expect(calls).toBe(0);
  });

  test("uma falha é armazenada para não repetir requests em cada visita", async () => {
    process.env.YOUTUBE_API_KEY = "teste";
    let calls = 0;
    globalThis.fetch = (async () => { calls++; return json({ error: "Cota" }, 403); }) as typeof fetch;
    const db = banco();
    expect((await carregarRecomendacoes(db.client, "trilha")).estado).toBe("indisponivel");
    expect((await carregarRecomendacoes(db.client, "trilha")).estado).toBe("indisponivel");
    expect(calls).toBe(1);
  });
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.YOUTUBE_API_KEY;
  else process.env.YOUTUBE_API_KEY = originalKey;
});

describe("Recomendações do YouTube", () => {
  test("retorna menos vídeos em vez de completar com resultados sem relação com o objetivo", async () => {
    process.env.YOUTUBE_API_KEY = "teste";
    const responses = [search(ids.slice(0, 3)), json({ items: [
      { ...video(ids[0]), snippet: { ...video(ids[0]).snippet, title: "React Native Expo login e autenticação" } },
      { ...video(ids[1]), snippet: { ...video(ids[1]).snippet, title: "Publicando React Native Expo na loja" } },
      { ...video(ids[2]), snippet: { ...video(ids[2]).snippet, title: "React interview questions" } },
    ] }), search([ids[3]]), json({ items: [{ ...video(ids[3], "en"),
      snippet: { ...video(ids[3], "en").snippet, title: "Vibe Coding tutorial" } }] })];
    globalThis.fetch = (async () => responses.shift()!) as typeof fetch;
    const result = await buscarVideosYouTube(loginContexto.linguagem, loginContexto.nivel, loginContexto);
    expect(result.map(item => item.id)).toEqual([ids[0]]);
    expect(responses.length).toBe(0);
  });
  test("três vídeos em português usam somente uma busca e uma validação em lote", async () => {
    process.env.YOUTUBE_API_KEY = "segredo-teste";
    const calls: URL[] = [];
    globalThis.fetch = (async (input, init) => {
      const url = new URL(String(input));
      expect(url.toString()).not.toContain("segredo-teste");
      expect(new Headers(init?.headers).get("X-Goog-Api-Key")).toBe("segredo-teste");
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      calls.push(url);
      if (url.pathname.endsWith("/search")) {
        expect(url.searchParams.get("videoEmbeddable")).toBe("true");
        expect(url.searchParams.get("relevanceLanguage")).toBe("pt");
        return search(ids.slice(0, 3));
      }
      return json({ items: ids.slice(0, 3).map(id => video(id)) });
    }) as typeof fetch;
    expect((await buscarVideosYouTube("Python", "iniciante")).map(item => item.id)).toEqual(ids.slice(0, 3));
    expect(calls.length).toBe(2);
  });

  test("completa com inglês apenas quando faltam vídeos, sem repetir IDs", async () => {
    process.env.YOUTUBE_API_KEY = "teste";
    const responses = [search([ids[0]]), json({ items: [video(ids[0])] }),
      search([ids[0], ids[1], ids[2]]), json({ items: [video(ids[0], "en"), video(ids[1], "en"), video(ids[2], "en")] })];
    const languages: string[] = [];
    globalThis.fetch = (async input => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/search")) languages.push(url.searchParams.get("relevanceLanguage")!);
      return responses.shift()!;
    }) as typeof fetch;
    const result = await buscarVideosYouTube("React Expo", "iniciante");
    expect(languages).toEqual(["pt", "en"]);
    expect(result.map(item => item.id)).toEqual(ids.slice(0, 3));
    expect(result.map(item => item.idioma)).toEqual(["pt", "en", "en"]);
  });

  test("exclui vídeos privados, bloqueados no Brasil, ao vivo e sem incorporação", async () => {
    process.env.YOUTUBE_API_KEY = "teste";
    const responses = [search(ids), json({ items: [
      video(ids[0], "pt", false),
      { ...video(ids[1]), status: { embeddable: true, privacyStatus: "private", uploadStatus: "processed" } },
      { ...video(ids[2]), contentDetails: { regionRestriction: { blocked: ["BR"] } } },
      { ...video(ids[3]), snippet: { ...video(ids[3]).snippet, liveBroadcastContent: "live" } },
    ] }), search([])];
    globalThis.fetch = (async () => responses.shift()!) as typeof fetch;
    expect(await buscarVideosYouTube("Python", "iniciante")).toEqual([]);
    expect(responses.length).toBe(0);
  });

  test("preserva vídeos portugueses se a busca em inglês falhar", async () => {
    process.env.YOUTUBE_API_KEY = "teste";
    const responses = [search([ids[0]]), json({ items: [video(ids[0])] }), json({ error: "Detalhes privados" }, 403)];
    globalThis.fetch = (async () => responses.shift()!) as typeof fetch;
    expect((await buscarVideosYouTube("Python", "iniciante")).map(item => item.id)).toEqual([ids[0]]);
  });

  test("não repete erros de cota nem expõe a resposta do provedor", async () => {
    process.env.YOUTUBE_API_KEY = "teste";
    let calls = 0;
    globalThis.fetch = (async () => { calls++; return json({ error: "Detalhes privados" }, 403); }) as typeof fetch;
    await expect(buscarVideosYouTube("Python", "iniciante")).rejects.toThrow("Não foi possível carregar");
    expect(calls).toBe(1);
  });

  test("chave ausente não chama a API", async () => {
    delete process.env.YOUTUBE_API_KEY;
    let calls = 0;
    globalThis.fetch = (async () => { calls++; return search([]); }) as typeof fetch;
    await expect(buscarVideosYouTube("Python", "iniciante")).rejects.toThrow("YouTube não configurado");
    expect(calls).toBe(0);
  });
});
