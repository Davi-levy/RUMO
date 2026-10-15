import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Reconhecimento = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void; abort: () => void;
};
type Construtor = new () => Reconhecimento;

export function useDitado(onTexto: (texto: string) => void) {
  const [suportado, setSuportado] = useState(false);
  const [ouvindo, setOuvindo] = useState(false);
  const reconhecimento = useRef<Reconhecimento | null>(null);
  const callback = useRef(onTexto);
  callback.current = onTexto;

  useEffect(() => {
    const browser = window as typeof window & { SpeechRecognition?: Construtor; webkitSpeechRecognition?: Construtor };
    const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Constructor) return;
    setSuportado(true);
    const speech = new Constructor();
    speech.lang = "pt-BR";
    speech.continuous = true;
    speech.interimResults = false;
    speech.onresult = event => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) callback.current(event.results[i][0].transcript);
      }
    };
    speech.onerror = event => {
      if (event.error !== "aborted") toast.error(event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "Permita o acesso ao microfone no navegador para usar o ditado."
        : event.error === "audio-capture" ? "Não foi possível acessar o microfone."
        : event.error === "no-speech" ? "Não identifiquei uma fala. Tente novamente."
        : "Não foi possível transcrever sua fala. Você pode digitar a pergunta.");
      setOuvindo(false);
    };
    speech.onend = () => setOuvindo(false);
    reconhecimento.current = speech;
    const ocultar = () => { if (document.hidden) { speech.abort(); setOuvindo(false); } };
    document.addEventListener("visibilitychange", ocultar);
    return () => {
      speech.onresult = speech.onerror = speech.onend = null;
      speech.abort();
      reconhecimento.current = null;
      document.removeEventListener("visibilitychange", ocultar);
    };
  }, []);

  function alternar() {
    const speech = reconhecimento.current;
    if (!speech) return;
    if (ouvindo) { speech.stop(); return; }
    try { setOuvindo(true); speech.start(); }
    catch { setOuvindo(false); toast.error("Não foi possível iniciar o ditado. Tente novamente."); }
  }

  return { suportado, ouvindo, alternar, parar: () => reconhecimento.current?.stop() };
}
