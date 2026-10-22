-- Exceção privada por usuário autenticado. O navegador não pode concedê-la.
create table rumo_private.contas_geracao_ilimitada (
  usuario_id uuid primary key references auth.users(id) on delete cascade
);
alter table rumo_private.contas_geracao_ilimitada enable row level security;
revoke all on rumo_private.contas_geracao_ilimitada from public, anon, authenticated;
insert into rumo_private.contas_geracao_ilimitada(usuario_id)
select id from auth.users where lower(email)='d4vil3vy@gmail.com' and email_confirmed_at is not null
on conflict do nothing;

create function rumo_private.geracao_ilimitada() returns boolean
language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and exists (
    select 1 from rumo_private.contas_geracao_ilimitada where usuario_id=auth.uid()
  );
$$;
revoke all on function rumo_private.geracao_ilimitada() from public, anon;
grant execute on function rumo_private.geracao_ilimitada() to authenticated;
create function public.consultar_geracao_ilimitada() returns boolean
language sql stable security invoker set search_path='' as $$
  select rumo_private.geracao_ilimitada();
$$;
revoke all on function public.consultar_geracao_ilimitada() from public, anon;
grant execute on function public.consultar_geracao_ilimitada() to authenticated;

-- Vaga NULL representa consumo sem limite. UNIQUE continua protegendo as vagas
-- numeradas dos demais usuários. RLS impede que eles insiram uma vaga NULL.
alter table public.geracoes_trilhas alter column vaga drop not null;
alter table public.avaliacoes_temas alter column vaga drop not null;
alter policy geracoes_trilhas_inserir on public.geracoes_trilhas
with check (usuario_id=(select auth.uid()) and dia=(now() at time zone 'America/Sao_Paulo')::date
  and (vaga is not null or (select rumo_private.geracao_ilimitada())));
alter policy avaliacoes_temas_inserir on public.avaliacoes_temas
with check (usuario_id=(select auth.uid()) and dia=(now() at time zone 'America/Sao_Paulo')::date
  and (vaga is not null or (select rumo_private.geracao_ilimitada())));

create or replace function public.reservar_geracao_trilha() returns uuid
language plpgsql security invoker set search_path='' as $$
declare geracao uuid; tentativa smallint;
begin
  if auth.uid() is null then raise exception 'Sessão expirada.' using errcode='42501'; end if;
  if rumo_private.geracao_ilimitada() then
    insert into public.geracoes_trilhas(usuario_id,vaga) values(auth.uid(),null) returning id into geracao;
    return geracao;
  end if;
  for tentativa in 1..2 loop
    begin
      insert into public.geracoes_trilhas(usuario_id,vaga) values(auth.uid(),tentativa) returning id into geracao;
      return geracao;
    exception when unique_violation then null;
    end;
  end loop;
  raise exception 'Limite diário de 2 gerações atingido. Tente novamente amanhã, após 00h (horário de Brasília).' using errcode='P0001';
end;
$$;
create or replace function public.reservar_avaliacao_tema() returns integer
language plpgsql security invoker set search_path='' as $$
declare tentativa smallint;
begin
  if auth.uid() is null then raise exception 'Sessão expirada.' using errcode='42501'; end if;
  if rumo_private.geracao_ilimitada() then
    insert into public.avaliacoes_temas(usuario_id,vaga) values(auth.uid(),null);
    return 0;
  end if;
  for tentativa in 1..5 loop
    begin
      insert into public.avaliacoes_temas(usuario_id,vaga) values(auth.uid(),tentativa);
      return public.consultar_avaliacoes_hoje();
    exception when unique_violation then null;
    end;
  end loop;
  raise exception 'Limite diário de 5 avaliações atingido.' using errcode='P0001';
end;
$$;
notify pgrst,'reload schema';
