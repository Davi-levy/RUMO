-- Avaliar um tema não ocupa uma vaga de geração de trilha.
create table public.avaliacoes_temas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  dia date not null default (now() at time zone 'America/Sao_Paulo')::date,
  vaga smallint not null check (vaga between 1 and 5),
  criado_em timestamptz not null default now(),
  unique (usuario_id, dia, vaga)
);

alter table public.avaliacoes_temas enable row level security;
revoke all on public.avaliacoes_temas from public, anon, authenticated;
grant select on public.avaliacoes_temas to authenticated;
grant insert (usuario_id, vaga) on public.avaliacoes_temas to authenticated;

create policy avaliacoes_temas_ler on public.avaliacoes_temas
  for select to authenticated using (usuario_id = (select auth.uid()));
create policy avaliacoes_temas_inserir on public.avaliacoes_temas
  for insert to authenticated with check (
    usuario_id = (select auth.uid())
    and dia = (now() at time zone 'America/Sao_Paulo')::date
  );

create function public.consultar_avaliacoes_hoje() returns integer
language sql stable security invoker set search_path = '' as $$
  select count(*)::integer from public.avaliacoes_temas
  where usuario_id = (select auth.uid())
    and dia = (now() at time zone 'America/Sao_Paulo')::date;
$$;

create function public.reservar_avaliacao_tema() returns integer
language plpgsql security invoker set search_path = '' as $$
declare tentativa smallint;
begin
  if auth.uid() is null then
    raise exception 'Sessão expirada.' using errcode = '42501';
  end if;
  for tentativa in 1..5 loop
    begin
      insert into public.avaliacoes_temas (usuario_id, vaga)
      values (auth.uid(), tentativa);
      return public.consultar_avaliacoes_hoje();
    exception when unique_violation then
      -- A chave única decide a vaga inclusive entre abas concorrentes.
    end;
  end loop;
  raise exception 'Limite diário de 5 avaliações atingido.' using errcode = 'P0001';
end;
$$;

revoke all on function public.consultar_avaliacoes_hoje(), public.reservar_avaliacao_tema() from public, anon;
grant execute on function public.consultar_avaliacoes_hoje(), public.reservar_avaliacao_tema() to authenticated;
