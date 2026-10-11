import { z } from "zod";

export const VideoRecomendadoSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
  titulo: z.string().min(1),
  canal: z.string().min(1),
  idioma: z.enum(["pt", "en", "outro", "indefinido"]),
  obtidoEm: z.string().datetime(),
});
export const VideosRecomendadosSchema = z.array(VideoRecomendadoSchema).max(3);
export type VideoRecomendado = z.infer<typeof VideoRecomendadoSchema>;
export type Recomendacoes = { estado: "pendente" | "pronto" | "indisponivel"; videos: VideoRecomendado[] };
