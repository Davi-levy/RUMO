import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const aliases: Record<string, string> = { "c++": "cpp", "c#": "csharp", sh: "bash", shell: "bash", py: "python", js: "javascript", ts: "typescript" };

export function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(true);
  const reducedMotion = useReducedMotion();
  const normalizedLanguage = language?.toLowerCase();
  const syntax = normalizedLanguage ? aliases[normalizedLanguage] ?? normalizedLanguage : "text";
  const lines = code.split("\n").length;

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    let success = false;
    try {
      await navigator.clipboard.writeText(code);
      success = true;
    } catch {
      const previousFocus = document.activeElement;
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.readOnly = true;
      textarea.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
      try {
        document.body.appendChild(textarea);
        textarea.select();
        success = document.execCommand("copy");
      } catch { success = false; }
      finally {
        textarea.remove();
        if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
      }
    }
    if (!active.current) return;
    setCopied(success);
    setCopyError(!success);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { setCopied(false); setCopyError(false); }, 2000);
  }

  return (
    <div className="not-prose my-6 min-w-0 max-w-full overflow-hidden rounded-[4px] border border-border bg-[#050505]">
      <div className="flex items-end justify-between gap-3 border-b border-border bg-[#090909] pl-3 pr-2 pt-2">
        <span className="-mb-px min-w-0 truncate rounded-t-[3px] border border-b-0 border-border bg-[#050505] px-3 py-2 font-mono text-xs text-foreground/75">
          {language || "Código"}
        </span>
        <motion.button type="button" onClick={copy} aria-label={copied ? "Código copiado" : "Copiar código"}
          whileTap={reducedMotion ? undefined : { scale: 0.96 }}
          className={`mb-1 flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-[3px] px-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${copied ? "bg-emerald-500/10 text-emerald-400" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}>
          <span className="relative h-3.5 w-3.5" aria-hidden="true">
            <AnimatePresence initial={false}>
              <motion.span key={copied ? "check" : "copy"} className="absolute inset-0"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 30 }}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="inline-block w-[7ch] text-left">{copied ? "Copiado" : "Copiar"}</span>
        </motion.button>
      </div>
      <div className="max-h-96 overflow-auto [scrollbar-width:thin]" tabIndex={0} role="region" aria-label={`Código ${language || "sem linguagem informada"}`}>
        <SyntaxHighlighter language={syntax} style={vscDarkPlus} showLineNumbers wrapLines
          customStyle={{ background: "#050505", color: "#d4d4d4", margin: 0, padding: "14px 16px 14px 0", overflow: "visible", minWidth: "max-content", fontSize: "13px", lineHeight: "24px", borderRadius: 0 }}
          lineNumberStyle={{ position: "sticky", left: 0, background: "#050505", color: "#666", borderRight: "1px solid #1b1b1b", paddingLeft: "12px", paddingRight: "12px", marginRight: "16px", minWidth: "3.5em", userSelect: "none" }}
          codeTagProps={{ style: { fontFamily: "var(--font-mono)" } }}>
          {code}
        </SyntaxHighlighter>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border bg-[#080808] px-4 py-2 text-[11px] text-muted-foreground">
        <span><span className="font-mono uppercase tracking-wider">{language || "Texto"}</span><span aria-hidden="true"> · </span>{lines} {lines === 1 ? "linha" : "linhas"}</span>
        <span role="status" aria-live="polite">{copyError ? "Não foi possível copiar. Selecione o código." : copied ? "Código copiado." : ""}</span>
      </div>
    </div>
  );
}
