-- Alteração aditiva: exercícios existentes continuam usando a correção legada.
alter table public.exercicios
  add column tipo text not null default 'legado'
    check (tipo in ('legado', 'multipla_escolha', 'previsao_saida')),
  add column alternativas jsonb;
alter table public.exercicios add constraint exercicios_alternativas_tipo check (
  case when tipo = 'multipla_escolha' then
    alternativas is not null and jsonb_typeof(alternativas) = 'array'
      and jsonb_array_length(alternativas) = 4 and resposta_esperada in ('a','b','c','d')
  else alternativas is null end
);

create table public.relatos_exercicios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  exercicio_id uuid not null references public.exercicios(id) on delete cascade,
  observacao text check (char_length(observacao) <= 1000),
  criado_em timestamptz not null default now(),
  unique (usuario_id, exercicio_id)
);
create index relatos_exercicios_exercicio_id_idx on public.relatos_exercicios(exercicio_id);
alter table public.relatos_exercicios enable row level security;
revoke all on public.relatos_exercicios from public, anon, authenticated;
grant select on public.relatos_exercicios to authenticated;
grant insert (usuario_id, exercicio_id, observacao) on public.relatos_exercicios to authenticated;
create policy relatos_exercicios_ler on public.relatos_exercicios
  for select to authenticated using (usuario_id = (select auth.uid()));
create policy relatos_exercicios_inserir on public.relatos_exercicios
  for insert to authenticated with check (
    usuario_id = (select auth.uid()) and exists (
      select 1 from public.exercicios e
      join public.modulos m on m.id = e.modulo_id
      join public.trilhas t on t.id = m.trilha_id
      where e.id = exercicio_id and t.usuario_id = (select auth.uid())
    )
  );
