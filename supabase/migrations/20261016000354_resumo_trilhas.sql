-- Consultas e contagens respeitam as mesmas RLS e permissões do cliente.
create index if not exists trilhas_usuario_criacao on public.trilhas(usuario_id, criado_em desc, id desc);
create index if not exists modulos_trilha on public.modulos(trilha_id);
create index if not exists exercicios_modulo on public.exercicios(modulo_id);

create function public.listar_resumo_trilhas(p_offset integer default 0)
returns table (id uuid, titulo text, linguagem text, nivel text, descricao text, total bigint, acertos bigint)
language sql stable security invoker set search_path='' as $$
  select t.id, t.titulo, t.linguagem, t.nivel, t.descricao, c.total, c.acertos
  from (
    select t.id, t.titulo, t.linguagem, t.nivel, t.descricao, t.criado_em
    from public.trilhas t where t.usuario_id=(select auth.uid())
    order by t.criado_em desc, t.id desc
    limit 13 offset greatest(coalesce(p_offset,0),0)
  ) t
  cross join lateral (
    select count(e.id) total, count(e.id) filter (where r.acertou) acertos
    from public.modulos m join public.exercicios e on e.modulo_id=m.id
    left join public.respostas r on r.exercicio_id=e.id and r.usuario_id=(select auth.uid())
    where m.trilha_id=t.id
  ) c
  order by t.criado_em desc, t.id desc;
$$;
revoke all on function public.listar_resumo_trilhas(integer) from public, anon;
grant execute on function public.listar_resumo_trilhas(integer) to authenticated;
