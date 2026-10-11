begin;
do $$
declare
  usuario_a uuid := gen_random_uuid();
  usuario_b uuid := gen_random_uuid();
  trilha_a uuid;
  trilha_b uuid;
  bloqueou boolean;
begin
  insert into auth.users(id) values (usuario_a), (usuario_b);
  insert into public.trilhas(usuario_id, linguagem, nivel, titulo)
    values (usuario_a, 'Python', 'iniciante', 'Teste YouTube') returning id into trilha_a;
  insert into public.trilhas(usuario_id, linguagem, nivel, titulo)
    values (usuario_b, 'Python', 'iniciante', 'Teste YouTube B') returning id into trilha_b;
  perform set_config('request.jwt.claim.sub', usuario_a::text, true);
  set local role authenticated;
  insert into public.youtube_recomendacoes(trilha_id) values (trilha_a);
  update public.youtube_recomendacoes set estado = 'pronto', videos = '[]'::jsonb where trilha_id = trilha_a;
  if not exists (select 1 from public.youtube_recomendacoes where trilha_id = trilha_a and estado = 'pronto') then
    raise exception 'Não foi possível salvar o cache próprio.' using errcode = 'XX000';
  end if;
  bloqueou := false;
  begin
    insert into public.youtube_recomendacoes(trilha_id) values (trilha_a);
  exception when unique_violation then bloqueou := true;
  end;
  if not bloqueou then raise exception 'Reserva duplicada permitida.' using errcode = 'XX000'; end if;
  insert into public.youtube_recomendacoes(trilha_id, contexto) values (trilha_a, 'novo-conteudo');
  update public.youtube_recomendacoes set estado = 'pronto' where trilha_id = trilha_a and contexto = 'novo-conteudo';
  if (select count(*) from public.youtube_recomendacoes where trilha_id = trilha_a) <> 2 then
    raise exception 'Contextos diferentes não possuem caches independentes.' using errcode = 'XX000';
  end if;
  bloqueou := false;
  begin
    insert into public.youtube_recomendacoes(trilha_id, contexto) values (trilha_a, 'novo-conteudo');
  exception when unique_violation then bloqueou := true;
  end;
  if not bloqueou then raise exception 'Reserva duplicada no mesmo contexto permitida.' using errcode = 'XX000'; end if;
  bloqueou := false;
  begin
    update public.youtube_recomendacoes set contexto = 'outro' where trilha_id = trilha_a;
  exception when insufficient_privilege then bloqueou := true;
  end;
  if not bloqueou then raise exception 'Cliente pode alterar o contexto do cache.' using errcode = 'XX000'; end if;
  bloqueou := false;
  begin
    update public.youtube_recomendacoes set criado_em = now() - interval '8 days' where trilha_id = trilha_a;
  exception when insufficient_privilege then bloqueou := true;
  end;
  if not bloqueou then raise exception 'Cliente pode alterar a validade.' using errcode = 'XX000'; end if;
  bloqueou := false;
  begin
    delete from public.youtube_recomendacoes where trilha_id = trilha_a;
  exception when insufficient_privilege then bloqueou := true;
  end;
  if not bloqueou then raise exception 'Cliente pode apagar o cache para repetir buscas.' using errcode = 'XX000'; end if;
  bloqueou := false;
  begin
    insert into public.youtube_recomendacoes(trilha_id) values (trilha_b);
  exception when insufficient_privilege then bloqueou := true;
  end;
  if not bloqueou then raise exception 'Reserva em trilha alheia permitida.' using errcode = 'XX000'; end if;

  perform set_config('request.jwt.claim.sub', usuario_b::text, true);
  if exists (select 1 from public.youtube_recomendacoes where trilha_id = trilha_a) then
    raise exception 'Cache de outro usuário visível.' using errcode = 'XX000';
  end if;
  update public.youtube_recomendacoes set estado = 'indisponivel' where trilha_id = trilha_a;
  if found then raise exception 'Cache de outro usuário alterado.' using errcode = 'XX000'; end if;
  set local role anon;
  if has_table_privilege('anon', 'public.youtube_recomendacoes', 'SELECT,INSERT,UPDATE,DELETE') then
    raise exception 'Acesso anônimo permitido.' using errcode = 'XX000';
  end if;
  reset role;
  if not exists (select 1 from cron.job where jobname = 'rumo-youtube-cache-cleanup' and active) then
    raise exception 'Limpeza automática não está ativa.' using errcode = 'XX000';
  end if;
end;
$$;
rollback;
select 'Cache, reserva única, RLS e limpeza automática: OK (dados revertidos)' as resultado;
