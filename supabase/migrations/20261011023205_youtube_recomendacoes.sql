create table public.youtube_recomendacoes (
  trilha_id uuid primary key references public.trilhas(id) on delete cascade,
  estado text not null default 'pendente' check (estado in ('pendente', 'pronto', 'indisponivel')),
  videos jsonb not null default '[]'::jsonb
    check (jsonb_typeof(videos) = 'array' and jsonb_array_length(videos) <= 3),
  criado_em timestamptz not null default now()
);
create index youtube_recomendacoes_criado_em_idx on public.youtube_recomendacoes(criado_em);
alter table public.youtube_recomendacoes enable row level security;
revoke all on public.youtube_recomendacoes from public, anon, authenticated;
grant select on public.youtube_recomendacoes to authenticated;
grant insert (trilha_id) on public.youtube_recomendacoes to authenticated;
grant update (estado, videos) on public.youtube_recomendacoes to authenticated;

create policy youtube_recomendacoes_ler on public.youtube_recomendacoes
  for select to authenticated using (exists (
    select 1 from public.trilhas t where t.id = trilha_id and t.usuario_id = (select auth.uid())
  ));
create policy youtube_recomendacoes_inserir on public.youtube_recomendacoes
  for insert to authenticated with check (exists (
    select 1 from public.trilhas t where t.id = trilha_id and t.usuario_id = (select auth.uid())
  ));
create policy youtube_recomendacoes_atualizar on public.youtube_recomendacoes
  for update to authenticated using (exists (
    select 1 from public.trilhas t where t.id = trilha_id and t.usuario_id = (select auth.uid())
  )) with check (exists (
    select 1 from public.trilhas t where t.id = trilha_id and t.usuario_id = (select auth.uid())
  ));

-- Expira os dados mesmo de trilhas que nunca mais forem abertas.
-- Falhas também são mantidas temporariamente para evitar repetir chamadas em cada visita.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('rumo-youtube-cache-cleanup', '17 * * * *', $$
  delete from public.youtube_recomendacoes
  where criado_em < now() - interval '7 days'
    or (estado <> 'pronto' and criado_em < now() - interval '1 hour');
  delete from cron.job_run_details
  where jobid = (select jobid from cron.job where jobname = 'rumo-youtube-cache-cleanup')
    and end_time < now() - interval '7 days';
$$);
