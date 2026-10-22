import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";
import { ErroGemini, gerarJsonGemini } from "./gemini.server";
import { FALHAS_TUTOR, InteracaoTutorSchema, montarContextoTutor, POLITICA_TUTOR, type CursorTutor } from "./tutor.shared";
import { proximoReinicioDiario } from "./trilha-limite";

type Client = SupabaseClient<Database>;

// Nunca registrar conteúdo das conversas, respostas dos alunos ou credenciais.
function registrarFalha(etapa: string, erro?: unknown) {
  const codigo = typeof erro === "object" && erro !== null && "code" in erro && typeof erro.code === "string" && /^[A-Z0-9_]{1,24}$/.test(erro.code) ? erro.code : undefined;
  console.error("[Atlas] Falha", { etapa, codigo });
}

async function moduloProprio(db: Client, id: string) {
  const { data, error } = await db.from("modulos").select("id, titulo, conteudo, trilha_id").eq("id", id).maybeSingle();
  if (error) { registrarFalha("consultar_modulo", error); throw new Error("Não foi possível carregar o módulo do Atlas."); }
  if (!data) throw new Error("Módulo não encontrado.");
  return data;
}

export async function limiteTutor(db: Client, usuario: string) {
  const reiniciaEm = proximoReinicioDiario();
  // Inclui módulos excluídos: apagar uma trilha não devolve a cota consumida.
  const { data, error } = await db.rpc("consultar_tutor_hoje");
  if (error || data === null) { registrarFalha("consultar_limite", error); throw new Error("Não foi possível consultar o limite do Atlas."); }
  return { restantes: Math.max(0, 5 - data), reiniciaEm };
}

export async function carregarTutor(db: Client, usuario: string, moduloId: string, cursor?: CursorTutor) {
  await moduloProprio(db, moduloId);
  let query = db.from("tutor_interacoes").select("id, pergunta, resposta, estado, avaliacao, criado_em")
    .eq("modulo_id", moduloId).eq("usuario_id", usuario).order("criado_em", { ascending: false }).order("id", { ascending: false }).limit(21);
  if (cursor) query = query.or(`criado_em.lt.${cursor.data},and(criado_em.eq.${cursor.data},id.lt.${cursor.id})`);
  const [result, limite] = await Promise.all([query, limiteTutor(db, usuario)]);
  if (result.error) { registrarFalha("consultar_historico", result.error); throw new Error("Não foi possível carregar a conversa do Atlas."); }
  const parsed = z.array(InteracaoTutorSchema).safeParse(result.data);
  if (!parsed.success) { registrarFalha("validar_historico"); throw new Error("Não foi possível carregar a conversa do Atlas."); }
  const itens = parsed.data.slice(0, 20);
  const last = itens.at(-1);
  return { itens: itens.reverse(), cursor: result.data && result.data.length > 20 && last ? { data: last.criado_em, id: last.id } : null, ...limite };
}

export async function enviarTutor(db: Client, usuario: string, input: { id: string; moduloId: string; pergunta: string },
  gerar = (prompt: string) => gerarJsonGemini({ prompt: () => prompt, systemInstruction: POLITICA_TUTOR,
    schema: z.object({ resposta: z.string().trim().min(1).max(8000) }), validar: () => {},
    responseSchema: { type: "object", properties: { resposta: { type: "string" } }, required: ["resposta"] }, maxAttempts: 1, timeoutMs: 60_000, maxOutputTokens: 1800 })) {
  const segredo = process.env.TUTOR_SERVER_SECRET?.trim();
  const modelo = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
  if (!segredo || segredo.length < 32 || !process.env.GEMINI_API_KEY?.trim() || !/^[a-zA-Z0-9._-]+$/.test(modelo)) {
    registrarFalha("configuracao");
    throw new Error(FALHAS_TUTOR.configuracao);
  }
  const modulo = await moduloProprio(db, input.moduloId);
  const { data: trilha, error: errTrilha } = await db.from("trilhas").select("titulo, nivel, linguagem").eq("id", modulo.trilha_id).single();
  if (errTrilha || !trilha) { registrarFalha("contexto_trilha", errTrilha); throw new Error("Não foi possível carregar a trilha do Atlas."); }
  const { data: exs, error: errExs } = await db.from("exercicios").select("id, pergunta, alternativas").eq("modulo_id", modulo.id).order("ordem");
  if (errExs) { registrarFalha("contexto_exercicios", errExs); throw new Error("Não foi possível carregar o contexto do módulo."); }
  const ids = (exs ?? []).map(e => e.id);
  const respostas = ids.length ? await db.from("respostas").select("exercicio_id, resposta, acertou, criado_em").eq("usuario_id", usuario).in("exercicio_id", ids).order("criado_em", { ascending: false }).limit(6) : { data: [], error: null };
  if (respostas.error) { registrarFalha("contexto_respostas", respostas.error); throw new Error("Não foi possível carregar suas respostas."); }
  const { data: hist, error: errHist } = await db.from("tutor_interacoes").select("pergunta, resposta").eq("usuario_id", usuario).eq("modulo_id", modulo.id).eq("estado", "concluida").order("criado_em", { ascending: false }).limit(4);
  if (errHist) { registrarFalha("contexto_historico", errHist); throw new Error("Não foi possível carregar a conversa."); }
  const erros = (respostas.data ?? []).map(r => {
    const ex = exs?.find(e => e.id === r.exercicio_id);
    const alternativas = z.array(z.object({ id: z.string(), texto: z.string() })).safeParse(ex?.alternativas);
    return { pergunta: ex?.pergunta ?? "", resposta: alternativas.success ? alternativas.data.find(a => a.id === r.resposta)?.texto ?? r.resposta : r.resposta, acertou: r.acertou };
  });
  const { data, error } = await db.rpc("tutor_operacao", { p_id: input.id, p_modulo: modulo.id, p_pergunta: input.pergunta, p_segredo: segredo });
  if (error) {
    const status = error.message.includes("TUTOR_LIMITE") ? "limite" as const : error.message.includes("TUTOR_PENDENTE") ? "pendente" as const : "erro" as const;
    if (status === "erro") registrarFalha("reservar_mensagem", error);
    return { status, mensagem: status === "erro" ? (error.code === "42501" ? FALHAS_TUTOR.configuracao : FALHAS_TUTOR.indisponivel) : undefined, ...await limiteTutor(db, usuario) };
  }
  const reserva = z.object({ executar: z.boolean(), interacao: InteracaoTutorSchema }).parse(data);
  if (!reserva.executar) return { status: "ok" as const, interacao: reserva.interacao, mensagem: undefined, ...await limiteTutor(db, usuario) };
  let interacao = reserva.interacao;
  let mensagem: string | undefined;
  let etapa = "gerar_resposta";
  try {
    const resultado = await gerar(montarContextoTutor(modulo, trilha, [...hist ?? []].reverse(), erros, input.pergunta));
    etapa = "salvar_resposta";
    const complete = await db.rpc("tutor_operacao", { p_id: input.id, p_resposta: resultado.resposta, p_segredo: segredo, p_concluir: true });
    if (complete.error) { registrarFalha("salvar_resposta", complete.error); throw new Error(FALHAS_TUTOR.salvar); }
    interacao = InteracaoTutorSchema.parse(complete.data);
  } catch (erro) {
    const codigo = erro instanceof ErroGemini ? erro.codigo : etapa;
    registrarFalha("gerar_ou_concluir_resposta", { code: codigo.toUpperCase() });
    mensagem = erro instanceof ErroGemini
      ? erro.codigo === "cota" ? FALHAS_TUTOR.cota
        : erro.codigo === "timeout" ? FALHAS_TUTOR.timeout
        : erro.codigo === "conexao" ? FALHAS_TUTOR.conexao
        : erro.codigo === "resposta" ? FALHAS_TUTOR.resposta
        : erro.codigo === "bloqueio" ? FALHAS_TUTOR.bloqueio
        : FALHAS_TUTOR.indisponivel
      : etapa === "salvar_resposta" ? FALHAS_TUTOR.salvar : FALHAS_TUTOR.indisponivel;
    const falha = await db.rpc("tutor_operacao", { p_id: input.id, p_segredo: segredo, p_concluir: true });
    if (falha.error) registrarFalha("registrar_falha", falha.error);
    interacao = { ...interacao, estado: "falha", resposta: null };
  }
  return { status: "ok" as const, interacao, mensagem, ...await limiteTutor(db, usuario) };
}
