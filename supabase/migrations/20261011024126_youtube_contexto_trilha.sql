-- Recomendações antigas continuam expirando normalmente, mas não atendem ao novo contexto.
alter table public.youtube_recomendacoes
  add column contexto text not null default 'legacy';
alter table public.youtube_recomendacoes
  drop constraint youtube_recomendacoes_pkey,
  add primary key (trilha_id, contexto);
grant insert (contexto) on public.youtube_recomendacoes to authenticated;
create index youtube_recomendacoes_contexto_idx
  on public.youtube_recomendacoes(contexto, criado_em) where estado = 'pronto';
