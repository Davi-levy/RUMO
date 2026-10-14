create table public.tutor_interacoes (
  id uuid primary key,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  modulo_id uuid references public.modulos(id) on delete set null,
  pergunta text not null check (length(pergunta) between 1 and 1500),
  resposta text check (length(resposta) between 1 and 8000),
  estado text not null default 'pendente' check (estado in ('pendente','concluida','falha')),
  avaliacao smallint check (avaliacao in (-1,1)),
  criado_em timestamptz not null default now(),
  dia date not null default (now() at time zone 'America/Sao_Paulo')::date,
  check ((estado='concluida' and resposta is not null) or (estado<>'concluida' and resposta is null))
);
create index tutor_historico on public.tutor_interacoes(usuario_id,modulo_id,criado_em desc,id desc);
create index tutor_cota on public.tutor_interacoes(usuario_id,dia);
alter table public.tutor_interacoes enable row level security;
create policy tutor_ler_proprio on public.tutor_interacoes for select to authenticated using (
  usuario_id=(select auth.uid()) and exists(select 1 from public.modulos m join public.trilhas t on t.id=m.trilha_id where m.id=modulo_id and t.usuario_id=(select auth.uid()))
);
revoke all on public.tutor_interacoes from public,anon,authenticated;
grant select on public.tutor_interacoes to authenticated;

-- Só o hash da credencial de escrita do servidor fica no banco.
create table rumo_private.tutor_config (id boolean primary key default true check(id), segredo_hash text not null);
revoke all on rumo_private.tutor_config from public,anon,authenticated;
alter table rumo_private.tutor_config enable row level security;

create function rumo_private.tutor_operacao(p_id uuid,p_modulo uuid,p_pergunta text,p_resposta text,p_segredo text,p_concluir boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); existente public.tutor_interacoes%rowtype; usadas integer;
begin
  if u is null or not exists(select 1 from rumo_private.tutor_config where segredo_hash=encode(extensions.digest(p_segredo,'sha256'),'hex')) then
    raise exception 'Operação não autorizada.' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('tutor:'||u::text,0));
  update public.tutor_interacoes set estado='falha' where usuario_id=u and estado='pendente' and criado_em<now()-interval '2 minutes';
  if p_concluir then
    update public.tutor_interacoes set estado=case when p_resposta is null then 'falha' else 'concluida' end,resposta=p_resposta
      where id=p_id and usuario_id=u and estado='pendente' returning * into existente;
    if not found then raise exception 'Consulta já finalizada ou expirada.'; end if;
    return to_jsonb(existente);
  end if;
  if not exists(select 1 from public.modulos m join public.trilhas t on t.id=m.trilha_id where m.id=p_modulo and t.usuario_id=u) then
    raise exception 'Módulo não encontrado.' using errcode='42501';
  end if;
  if p_pergunta is null or btrim(p_pergunta)='' or length(p_pergunta)>1500 then raise exception 'Mensagem inválida.'; end if;
  select * into existente from public.tutor_interacoes where id=p_id;
  if found then
    if existente.usuario_id<>u or existente.modulo_id<>p_modulo or existente.pergunta<>p_pergunta then raise exception 'Solicitação inválida.' using errcode='42501'; end if;
    return jsonb_build_object('executar',false,'interacao',to_jsonb(existente));
  end if;
  select count(*) into usadas from public.tutor_interacoes where usuario_id=u and dia=(now() at time zone 'America/Sao_Paulo')::date;
  if usadas>=5 then raise exception 'TUTOR_LIMITE'; end if;
  if exists(select 1 from public.tutor_interacoes where usuario_id=u and estado='pendente') then raise exception 'TUTOR_PENDENTE'; end if;
  insert into public.tutor_interacoes(id,usuario_id,modulo_id,pergunta) values(p_id,u,p_modulo,p_pergunta) returning * into existente;
  return jsonb_build_object('executar',true,'interacao',to_jsonb(existente));
end;
$$;
revoke all on function rumo_private.tutor_operacao(uuid,uuid,text,text,text,boolean) from public,anon,authenticated;
grant execute on function rumo_private.tutor_operacao(uuid,uuid,text,text,text,boolean) to authenticated;
create function public.tutor_operacao(p_id uuid,p_modulo uuid default null,p_pergunta text default null,p_resposta text default null,p_segredo text default null,p_concluir boolean default false)
returns jsonb language sql security invoker set search_path='' as $$
  select rumo_private.tutor_operacao(p_id,p_modulo,p_pergunta,p_resposta,p_segredo,p_concluir);
$$;
revoke all on function public.tutor_operacao(uuid,uuid,text,text,text,boolean) from public,anon;
grant execute on function public.tutor_operacao(uuid,uuid,text,text,text,boolean) to authenticated;

create function rumo_private.avaliar_tutor(p_id uuid,p_avaliacao smallint) returns void
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or p_avaliacao is null or p_avaliacao not in (-1,1) then raise exception 'Avaliação inválida.'; end if;
  update public.tutor_interacoes i set avaliacao=p_avaliacao where i.id=p_id and i.usuario_id=auth.uid() and i.estado='concluida'
    and exists(select 1 from public.modulos m join public.trilhas t on t.id=m.trilha_id where m.id=i.modulo_id and t.usuario_id=auth.uid());
  if not found then raise exception 'Resposta não encontrada.' using errcode='42501'; end if;
end;
$$;
revoke all on function rumo_private.avaliar_tutor(uuid,smallint) from public,anon,authenticated;
grant execute on function rumo_private.avaliar_tutor(uuid,smallint) to authenticated;
create function public.avaliar_tutor(p_id uuid,p_avaliacao smallint) returns void
language sql security invoker set search_path='' as $$ select rumo_private.avaliar_tutor(p_id,p_avaliacao); $$;
revoke all on function public.avaliar_tutor(uuid,smallint) from public,anon;
grant execute on function public.avaliar_tutor(uuid,smallint) to authenticated;
notify pgrst,'reload schema';

create function rumo_private.consultar_tutor_hoje() returns integer
language sql security definer set search_path='' as $$
  select count(*)::integer from public.tutor_interacoes where usuario_id=auth.uid() and dia=(now() at time zone 'America/Sao_Paulo')::date;
$$;
revoke all on function rumo_private.consultar_tutor_hoje() from public,anon,authenticated;
grant execute on function rumo_private.consultar_tutor_hoje() to authenticated;
create function public.consultar_tutor_hoje() returns integer language sql security invoker set search_path='' as $$ select rumo_private.consultar_tutor_hoje(); $$;
revoke all on function public.consultar_tutor_hoje() from public,anon;
grant execute on function public.consultar_tutor_hoje() to authenticated;
