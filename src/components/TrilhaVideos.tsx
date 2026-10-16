import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Play } from "lucide-react";
import { obterVideosTrilha } from "@/lib/youtube.functions";
import type { Recomendacoes, VideoRecomendado } from "@/lib/youtube.shared";

function VideoCard({ video }: { video: VideoRecomendado }) {
  const [reproduzindo, setReproduzindo] = useState(false);
  return (
    <article className="min-w-0 border border-border">
      {reproduzindo ? (
        <iframe
          className="aspect-video w-full" title={video.titulo}
          src={`https://www.youtube-nocookie.com/embed/${video.id}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin" allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setReproduzindo(true)}
          className="relative block aspect-video w-full overflow-hidden bg-muted group"
          aria-label={`Reproduzir no YouTube: ${video.titulo}`}>
          <img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt="" loading="lazy"
            className="h-full w-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
            <Play className="h-10 w-10 text-white" aria-hidden="true" />
          </span>
        </button>
      )}
      <div className="p-4">
        <h3 className="text-sm font-medium leading-relaxed">{video.titulo}</h3>
        <p className="mt-2 text-xs text-muted-foreground">{video.canal}
          {video.idioma === "en" ? " · Inglês" : video.idioma === "pt" ? " · Português" : ""}
        </p>
        <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 border border-border px-3 py-2 text-xs hover:border-foreground transition-colors">
          Acessar no YouTube <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

export function TrilhaVideos({ trilhaId }: { trilhaId: string }) {
  const obter = useServerFn(obterVideosTrilha);
  const [resultado, setResultado] = useState<Recomendacoes | null>(null);
  useEffect(() => {
    let ativo = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let tentativas = 0;
    setResultado(null);
    const carregar = async () => {
      try {
        const resposta = await obter({ data: { trilhaId } });
        if (!ativo) return;
        if (resposta.estado === "pendente" && tentativas++ < 8) {
          timer = setTimeout(() => { void carregar(); }, 3000);
        } else {
          setResultado(resposta.estado === "pendente" ? { estado: "indisponivel", videos: [] } : resposta);
        }
      } catch {
        if (ativo) setResultado({ estado: "indisponivel", videos: [] });
      }
    };
    void carregar();
    return () => { ativo = false; clearTimeout(timer); };
  }, [obter, trilhaId]);

  return (
    <section className="mt-14" aria-labelledby="trilha-videos-titulo">
      <h2 id="trilha-videos-titulo" className="font-display text-2xl font-bold">Vídeos que podem te ajudar neste conteúdo</h2>
      <p className="mt-3 text-sm text-muted-foreground">Conteúdo complementar no YouTube para continuar seus estudos.</p>
      {!resultado ? (
        <p className="mt-6 text-sm text-muted-foreground" role="status">Buscando vídeos recomendados...</p>
      ) : resultado.videos.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">{resultado.videos.map(video => <VideoCard key={video.id} video={video} />)}</div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground" role="status">
          {resultado.estado === "pronto" ? "Não encontramos vídeos disponíveis para este conteúdo." : "Os vídeos recomendados estão indisponíveis no momento. Você pode continuar estudando a trilha normalmente."}
        </p>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        Ao reproduzir, você utiliza o player do YouTube. <a className="underline" href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">Termos do YouTube</a>
        {" · "}<a className="underline" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacidade do Google</a>
      </p>
    </section>
  );
}
