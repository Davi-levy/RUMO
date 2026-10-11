import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { buscarVideosYouTube } from "./youtube.server";
import { prepararContextoVideos } from "./youtube-contexto.server";
import { VideosRecomendadosSchema, type Recomendacoes } from "./youtube.shared";

export async function carregarRecomendacoes(supabase: SupabaseClient<Database>, trilhaId: string): Promise<Recomendacoes> {
  const indisponivel: Recomendacoes = { estado: "indisponivel", videos: [] };
  const { data: trilha, error: trilhaError } = await supabase.from("trilhas")
    .select("linguagem,nivel,titulo,descricao").eq("id", trilhaId).maybeSingle();
  // RLS verifica a propriedade antes de qualquer consulta externa.
  if (trilhaError || !trilha) throw new Error("Trilha não encontrada.");
  const { data: modulos, error: moduloError } = await supabase.from("modulos")
    .select("titulo").eq("trilha_id", trilhaId).order("ordem");
  if (moduloError || !modulos?.length) return indisponivel;
  const contexto = { ...trilha, modulos };
  const chaveContexto = prepararContextoVideos(contexto).chave;

  const lerCache = async (): Promise<Recomendacoes | null> => {
    const { data, error } = await supabase.from("youtube_recomendacoes")
      .select("estado,videos,criado_em").eq("trilha_id", trilhaId).eq("contexto", chaveContexto).maybeSingle();
    if (error) throw new Error("Não foi possível consultar as recomendações.");
    if (!data) return null;
    if (data.estado === "pronto" && Date.now() - Date.parse(data.criado_em) < 7 * 86_400_000) {
      const videos = VideosRecomendadosSchema.safeParse(data.videos);
      return videos.success ? { estado: "pronto", videos: videos.data } : indisponivel;
    }
    return data.estado === "pendente" && Date.now() - Date.parse(data.criado_em) < 60_000
      ? { estado: "pendente", videos: [] } : indisponivel;
  };
  const cached = await lerCache();
  if (cached) return cached;
  if (!process.env.YOUTUBE_API_KEY?.trim()) return indisponivel;

  // A chave primária concede uma única busca por trilha, mesmo entre várias abas.
  const { error: reservaError } = await supabase.from("youtube_recomendacoes").insert({ trilha_id: trilhaId, contexto: chaveContexto });
  if (reservaError?.code === "23505") return await lerCache() ?? indisponivel;
  if (reservaError) return indisponivel;
  try {
    // Reaproveita recomendações recentes de outra trilha do mesmo tema e usuário.
    const { data: anteriores } = await supabase.from("youtube_recomendacoes")
      .select("videos")
      .eq("estado", "pronto").neq("trilha_id", trilhaId)
      .eq("contexto", chaveContexto)
      .gt("criado_em", new Date(Date.now() - 86_400_000).toISOString()).limit(1);
    const reutilizaveis = VideosRecomendadosSchema.safeParse(anteriores?.[0]?.videos);
    // A data original impede que cópias sucessivas prolonguem indefinidamente o cache.
    const videos = reutilizaveis.success && reutilizaveis.data.length
      && reutilizaveis.data.every(video => Date.now() - Date.parse(video.obtidoEm) < 86_400_000)
      ? reutilizaveis.data : await buscarVideosYouTube(trilha.linguagem, trilha.nivel, contexto);
    const { error } = await supabase.from("youtube_recomendacoes")
      .update({ estado: "pronto", videos }).eq("trilha_id", trilhaId).eq("contexto", chaveContexto);
    if (error) return indisponivel;
    return { estado: "pronto", videos };
  } catch {
    await supabase.from("youtube_recomendacoes").update({ estado: "indisponivel" }).eq("trilha_id", trilhaId).eq("contexto", chaveContexto);
    return indisponivel;
  }
}
