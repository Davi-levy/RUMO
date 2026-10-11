import { z } from "zod";
import type { VideoRecomendado } from "./youtube.shared";
import { prepararContextoVideos, type ContextoVideos } from "./youtube-contexto.server";

const SearchSchema = z.object({ items: z.array(z.object({
  id: z.object({ videoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/).optional() }),
})).default([]) });
const DetailsSchema = z.object({ items: z.array(z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
  snippet: z.object({ title: z.string(), description: z.string().default(""), channelTitle: z.string(),
    defaultAudioLanguage: z.string().optional(), defaultLanguage: z.string().optional(),
    liveBroadcastContent: z.string().optional(),
  }),
  status: z.object({ embeddable: z.boolean(), privacyStatus: z.string(), uploadStatus: z.string() }),
  contentDetails: z.object({ regionRestriction: z.object({
    allowed: z.array(z.string()).optional(), blocked: z.array(z.string()).optional(),
  }).optional() }),
})).default([]) });

async function consultar(endpoint: string, parameters: Record<string, string>, signal: AbortSignal) {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) throw new Error("YouTube não configurado.");
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  Object.entries(parameters).forEach(([name, value]) => url.searchParams.set(name, value));
  try {
    const response = await fetch(url, { headers: { "X-Goog-Api-Key": key }, signal });
    if (!response.ok) throw new Error("YouTube indisponível.");
    return await response.json() as unknown;
  } catch {
    // Não expor URLs, a chave nem respostas internas do provedor.
    throw new Error("Não foi possível carregar os vídeos do YouTube.");
  }
}

async function buscarIdioma(contexto: ReturnType<typeof prepararContextoVideos>, language: "pt" | "en", signal: AbortSignal) {
  const search = SearchSchema.parse(await consultar("search", {
    part: "snippet", type: "video", q: contexto.consulta(language),
    maxResults: "10", relevanceLanguage: language, regionCode: "BR",
    videoEmbeddable: "true", videoSyndicated: "true", safeSearch: "strict", order: "relevance",
    fields: "items(id/videoId)",
  }, signal));
  const ids = [...new Set(search.items.flatMap(item => item.id.videoId ? [item.id.videoId] : []))];
  if (!ids.length) return [];
  const details = DetailsSchema.parse(await consultar("videos", {
    part: "snippet,status,contentDetails", id: ids.join(","),
    fields: "items(id,snippet(title,description,channelTitle,defaultAudioLanguage,defaultLanguage,liveBroadcastContent),status(embeddable,privacyStatus,uploadStatus),contentDetails/regionRestriction)",
  }, signal));
  return ids.flatMap(id => {
    const item = details.items.find(video => video.id === id);
    if (!item || !item.status.embeddable || item.status.privacyStatus !== "public"
      || item.status.uploadStatus !== "processed" || item.snippet.liveBroadcastContent === "live"
      || item.snippet.liveBroadcastContent === "upcoming") return [];
    const region = item.contentDetails.regionRestriction;
    if (region?.blocked?.includes("BR") || (region?.allowed && !region.allowed.includes("BR"))) return [];
    const audio = (item.snippet.defaultAudioLanguage ?? item.snippet.defaultLanguage ?? "").toLowerCase();
    const idioma: VideoRecomendado["idioma"] = audio.startsWith("pt") ? "pt" : audio.startsWith("en") ? "en" : audio ? "outro" : "indefinido";
    if (idioma !== language && idioma !== "indefinido") return [];
    const relevancia = contexto.relevancia(item.snippet.title, item.snippet.description);
    if (!relevancia) return [];
    return [{ relevancia, video: { id, titulo: item.snippet.title, canal: item.snippet.channelTitle, idioma, obtidoEm: new Date().toISOString() } }];
  }).sort((a, b) => b.relevancia - a.relevancia).map(item => item.video);
}

export async function buscarVideosYouTube(linguagem: string, nivel: string, detalhes?: Omit<ContextoVideos, "linguagem" | "nivel">): Promise<VideoRecomendado[]> {
  const contexto = prepararContextoVideos({ linguagem, nivel, titulo: detalhes?.titulo ?? linguagem,
    descricao: detalhes?.descricao ?? null, modulos: detalhes?.modulos ?? [] });
  const signal = AbortSignal.timeout(20_000);
  const portugues = await buscarIdioma(contexto, "pt", signal);
  if (portugues.length >= 3) return portugues.slice(0, 3);
  try {
    const ingles = await buscarIdioma(contexto, "en", signal);
    return [...portugues, ...ingles.filter(video => !portugues.some(item => item.id === video.id))].slice(0, 3);
  } catch {
    if (portugues.length) return portugues.slice(0, 3);
    throw new Error("Não foi possível carregar os vídeos do YouTube.");
  }
}
