-- Cada início de geração ocupa uma das duas vagas do dia, mesmo se for interrompido.
-- O banco calcula o dia; o navegador não pode escolher a data nem apagar o consumo.
create table public.geracoes_trilhas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  dia date not null default (now() at time zone 'America/Sao_Paulo')::date,
  vaga smallint not null check (vaga between 1 and 2),
  criado_em timestamptz not null default now(),
  unique (usuario_id, dia, vaga)
);

create table public.geracoes_modulos (
  geracao_id uuid not null references public.geracoes_trilhas(id) on delete cascade,
  posicao smallint not null check (posicao between 1 and 6),
  primary key (geracao_id, posicao)
);

alter table public.geracoes_trilhas enable row level security;
alter table public.geracoes_modulos enable row level security;
revoke all on public.geracoes_trilhas, public.geracoes_modulos from public, anon, authenticated;
grant select on public.geracoes_trilhas, public.geracoes_modulos to authenticated;
grant insert (usuario_id, vaga) on public.geracoes_trilhas to authenticated;
grant insert (geracao_id, posicao) on public.geracoes_modulos to authenticated;

create policy geracoes_trilhas_ler on public.geracoes_trilhas
  for select to authenticated using (usuario_id = (select auth.uid()));
create policy geracoes_trilhas_inserir on public.geracoes_trilhas
  for insert to authenticated with check (
    usuario_id = (select auth.uid())
    and dia = (now() at time zone 'America/Sao_Paulo')::date
  );
create policy geracoes_modulos_ler on public.geracoes_modulos
  for select to authenticated using (exists (
    select 1 from public.geracoes_trilhas g
    where g.id = geracao_id and g.usuario_id = (select auth.uid())
  ));
create policy geracoes_modulos_inserir on public.geracoes_modulos
  for insert to authenticated with check (exists (
    select 1 from public.geracoes_trilhas g
    where g.id = geracao_id and g.usuario_id = (select auth.uid())
      and g.criado_em > now() - interval '1 hour'
  ));

-- SECURITY INVOKER mantém as permissões e o isolamento por usuário do chamador.
-- A restrição UNIQUE decide a vaga atomicamente, inclusive entre várias abas.
create function public.reservar_geracao_trilha() returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  geracao uuid;
  tentativa smallint;
begin
  if auth.uid() is null then
    raise exception 'Sessão expirada.' using errcode = '42501';
  end if;
  for tentativa in 1..2 loop
    begin
      insert into public.geracoes_trilhas (usuario_id, vaga)
      values (auth.uid(), tentativa) returning id into geracao;
      return geracao;
    exception when unique_violation then
      -- Uma outra requisição pode ter reservado esta vaga simultaneamente.
    end;
  end loop;
  raise exception 'Limite diário de 2 gerações atingido. Tente novamente amanhã, após 00h (horário de Brasília).'
    using errcode = 'P0001';
end;
$$;

create function public.consultar_geracoes_hoje() returns integer
language sql stable security invoker set search_path = '' as $$
  select count(*)::integer from public.geracoes_trilhas
  where usuario_id = (select auth.uid())
    and dia = (now() at time zone 'America/Sao_Paulo')::date;
$$;

revoke all on function public.reservar_geracao_trilha(), public.consultar_geracoes_hoje() from public, anon;
grant execute on function public.reservar_geracao_trilha(), public.consultar_geracoes_hoje() to authenticated;
