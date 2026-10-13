-- Helpers privilegiados ficam fora dos schemas expostos pela API.
create schema if not exists rumo_private;
revoke all on schema rumo_private from public, anon;
grant usage on schema rumo_private to authenticated;

create function rumo_private.normalizar_legado(valor text) returns text
language sql immutable set search_path = '' as $$
  select btrim(regexp_replace(regexp_replace(regexp_replace(lower(normalize(valor, NFD)), U&'[\0300-\036f]', '', 'g'), '[^[:alnum:][:space:]+*/=<>._()\[\]{}-]', ' ', 'g'), '[[:space:]]+', ' ', 'g'));
$$;
create function rumo_private.normalizar_saida(valor text) returns text
language sql immutable set search_path = '' as $$
  select btrim(regexp_replace(replace(valor, E'\r\n', E'\n'), E'[\t ]+$', '', 'ng'), E'\n');
$$;

create function rumo_private.avaliar_exercicio(p_exercicio_id uuid, p_resposta text, p_revelar boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  ex public.exercicios%rowtype;
  usuario uuid := auth.uid();
  acertou boolean := false;
  score double precision := 0;
  resultado text;
  feedback text;
  a text; b text; ta text[]; tb text[]; faltando text[]; comuns integer;
  solucao text;
begin
  if usuario is null then raise exception 'Sessão expirada.' using errcode = '42501'; end if;
  select e.* into ex from public.exercicios e join public.modulos m on m.id=e.modulo_id
    join public.trilhas t on t.id=m.trilha_id where e.id=p_exercicio_id and t.usuario_id=usuario;
  if not found then raise exception 'Exercício não encontrado.' using errcode = '42501'; end if;
  if p_revelar then
    if not exists(select 1 from public.respostas r where r.usuario_id=usuario and r.exercicio_id=ex.id) then
      raise exception 'Envie uma resposta antes de ver a solução.' using errcode = '42501';
    end if;
    solucao := ex.resposta_esperada;
    if ex.tipo='multipla_escolha' then
      select item->>'texto' into solucao from jsonb_array_elements(ex.alternativas) item where item->>'id'=ex.resposta_esperada;
    end if;
    return jsonb_build_object('solucao',solucao,'explicacao',ex.explicacao);
  end if;
  if p_resposta is null or length(p_resposta)>6000 or btrim(p_resposta)= '' then raise exception 'Resposta inválida.'; end if;
  if ex.tipo='legado' then
    a := rumo_private.normalizar_legado(p_resposta); b := rumo_private.normalizar_legado(ex.resposta_esperada);
    select coalesce(array_agg(distinct t), '{}') into ta from unnest(string_to_array(a,' ')) t where length(t)>1;
    select coalesce(array_agg(distinct t), '{}') into tb from unnest(string_to_array(b,' ')) t where length(t)>1;
    select count(*) into comuns from unnest(tb) t where t=any(ta);
    if a='' or b='' then score:=0;
    elsif a=b then score:=1;
    elsif cardinality(tb)=0 then score:=case when strpos(a,b)>0 or strpos(b,a)>0 then 1 else 0 end;
    else score:=least(1, greatest(2.0*comuns/(cardinality(ta)+cardinality(tb)), 0.9*comuns/cardinality(tb)) + case when strpos(a,b)>0 or strpos(b,a)>0 then 0.35 else 0 end); end if;
    resultado:=case when score>=0.75 then 'acertou' when score>=0.45 then 'quase' else 'errou' end;
    acertou:=resultado='acertou';
    select coalesce(array_agg(t), '{}') into faltando from (select t from unnest(tb) t where not(t=any(ta)) limit 5) s;
    feedback:=case resultado when 'acertou' then 'Correto. Sua resposta cobre o que era esperado.'
      when 'quase' then 'Quase. Você chegou perto, mas faltou considerar: ' || coalesce(nullif(array_to_string(faltando, ', '),''),'alguns detalhes') || '.'
      else 'Ainda não. Sua resposta não contempla o que o exercício pedia. Resposta esperada: ' || ex.resposta_esperada end;
    if coalesce(ex.explicacao,'')<>'' then feedback:=feedback || E'\n\n' || ex.explicacao; end if;
  else
    acertou:=case when ex.tipo='multipla_escolha' then p_resposta ~ '^[a-d]$' and p_resposta=ex.resposta_esperada
      else rumo_private.normalizar_saida(p_resposta)=rumo_private.normalizar_saida(ex.resposta_esperada) end;
    score:=case when acertou then 1 else 0 end;
    resultado:=case when acertou then 'acertou' else 'errou' end;
    feedback:=case when acertou then 'Correto.' || case when coalesce(ex.explicacao,'')<>'' then E'\n\n' || ex.explicacao else '' end
      else 'Ainda não. Revise o exemplo e tente novamente.' || case when coalesce(ex.dica,'')<>'' then E'\n\nDica: ' || ex.dica else '' end end;
  end if;
  insert into public.respostas(usuario_id,exercicio_id,resposta,acertou,feedback)
    values(usuario,ex.id,p_resposta,acertou,feedback)
    on conflict(usuario_id,exercicio_id) do update set resposta=excluded.resposta, acertou=excluded.acertou, feedback=excluded.feedback;
  return jsonb_build_object('resultado',resultado,'acertou',acertou,'score',score,'feedback',feedback);
end;
$$;
revoke all on function rumo_private.normalizar_legado(text), rumo_private.normalizar_saida(text), rumo_private.avaliar_exercicio(uuid,text,boolean) from public, anon, authenticated;
grant execute on function rumo_private.avaliar_exercicio(uuid,text,boolean) to authenticated;

create function public.avaliar_exercicio(p_exercicio_id uuid, p_resposta text default null, p_revelar boolean default false)
returns jsonb language sql security invoker set search_path = '' as $$
  select rumo_private.avaliar_exercicio(p_exercicio_id,p_resposta,p_revelar);
$$;
revoke all on function public.avaliar_exercicio(uuid,text,boolean) from public, anon;
grant execute on function public.avaliar_exercicio(uuid,text,boolean) to authenticated;

-- SELECT * e leituras dos dois campos privados passam a ser recusados.
revoke select on public.exercicios from public, anon, authenticated;
revoke select(resposta_esperada,explicacao) on public.exercicios from public, anon, authenticated;
grant select(id,modulo_id,pergunta,dica,ordem,criado_em,tipo,alternativas) on public.exercicios to authenticated;
-- Impede substituir um gabarito existente ou fabricar progresso pelo REST.
revoke update, delete, truncate, trigger on public.exercicios from public, anon, authenticated;
revoke insert, update, delete, truncate, trigger on public.respostas from public, anon, authenticated;
notify pgrst, 'reload schema';
