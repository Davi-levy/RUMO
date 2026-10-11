-- Teste de integração: todas as contas e reservas de teste são revertidas no fim.
begin;
do $$
declare
  usuario_a uuid := gen_random_uuid();
  usuario_b uuid := gen_random_uuid();
  antiga uuid;
  primeira uuid;
  segunda uuid;
  bloqueou boolean;
begin
  if (timestamptz '2026-10-11 02:59:59+00' at time zone 'America/Sao_Paulo')::date <> date '2026-10-10'
    or (timestamptz '2026-10-11 03:00:00+00' at time zone 'America/Sao_Paulo')::date <> date '2026-10-11' then
    raise exception 'Virada do dia deve ocorrer à meia-noite de Brasília.' using errcode = 'XX000';
  end if;
  insert into auth.users (id) values (usuario_a), (usuario_b);
  insert into public.geracoes_trilhas (usuario_id, dia, vaga, criado_em)
  values (usuario_a, (now() at time zone 'America/Sao_Paulo')::date - 1, 1, now() - interval '2 hours')
  returning id into antiga;

  perform set_config('request.jwt.claim.sub', usuario_a::text, true);
  set local role authenticated;
  if public.consultar_geracoes_hoje() <> 0 then
    raise exception 'O consumo de ontem não deve contar hoje.' using errcode = 'XX000';
  end if;
  primeira := public.reservar_geracao_trilha();
  segunda := public.reservar_geracao_trilha();
  if primeira = segunda or public.consultar_geracoes_hoje() <> 2 then
    raise exception 'As duas primeiras reservas devem funcionar.' using errcode = 'XX000';
  end if;
  bloqueou := false;
  begin
    perform public.reservar_geracao_trilha();
  exception when sqlstate 'P0001' then
    bloqueou := sqlerrm like 'Limite diário de 2%';
  end;
  if not bloqueou then raise exception 'Terceira geração permitida.' using errcode = 'XX000'; end if;

  insert into public.geracoes_modulos (geracao_id, posicao)
    select primeira, generate_series(1, 6);
  bloqueou := false;
  begin
    insert into public.geracoes_modulos (geracao_id, posicao) values (primeira, 1);
  exception when unique_violation then bloqueou := true;
  end;
  if not bloqueou then raise exception 'Módulo repetido permitido.' using errcode = 'XX000'; end if;
  bloqueou := false;
  begin
    insert into public.geracoes_modulos (geracao_id, posicao) values (primeira, 7);
  exception when check_violation then bloqueou := true;
  end;
  if not bloqueou then raise exception 'Sétimo módulo permitido.' using errcode = 'XX000'; end if;
  bloqueou := false;
  begin
    insert into public.geracoes_modulos (geracao_id, posicao) values (antiga, 1);
  exception when insufficient_privilege then bloqueou := true;
  end;
  if not bloqueou then raise exception 'Geração expirada reutilizada.' using errcode = 'XX000'; end if;

  bloqueou := false;
  begin
    delete from public.geracoes_trilhas where id = primeira;
  exception when insufficient_privilege then bloqueou := true;
  end;
  if not bloqueou then raise exception 'Consumo pode ser apagado.' using errcode = 'XX000'; end if;
  bloqueou := false;
  begin
    update public.geracoes_trilhas set dia = dia + 1 where id = primeira;
  exception when insufficient_privilege then bloqueou := true;
  end;
  if not bloqueou then raise exception 'Consumo pode ser alterado.' using errcode = 'XX000'; end if;
  bloqueou := false;
  begin
    insert into public.geracoes_trilhas (usuario_id, dia, vaga) values (usuario_a, current_date + 1, 1);
  exception when insufficient_privilege then bloqueou := true;
  end;
  if not bloqueou then raise exception 'Data fornecida pelo cliente aceita.' using errcode = 'XX000'; end if;
  bloqueou := false;
  begin
    insert into public.geracoes_trilhas (usuario_id, vaga) values (usuario_b, 1);
  exception when insufficient_privilege then bloqueou := true;
  end;
  if not bloqueou then raise exception 'Reserva para outro usuário permitida.' using errcode = 'XX000'; end if;
  bloqueou := false;
  begin
    delete from public.geracoes_modulos where geracao_id = primeira;
  exception when insufficient_privilege then bloqueou := true;
  end;
  if not bloqueou then raise exception 'Consumo de módulos pode ser apagado.' using errcode = 'XX000'; end if;
  bloqueou := false;
  begin
    update public.geracoes_modulos set posicao = 2 where geracao_id = primeira and posicao = 1;
  exception when insufficient_privilege then bloqueou := true;
  end;
  if not bloqueou then raise exception 'Consumo de módulos pode ser alterado.' using errcode = 'XX000'; end if;

  perform set_config('request.jwt.claim.sub', usuario_b::text, true);
  if public.consultar_geracoes_hoje() <> 0 then
    raise exception 'Limites compartilhados entre usuários.' using errcode = 'XX000';
  end if;
  if exists (select 1 from public.geracoes_trilhas where usuario_id = usuario_a)
    or exists (select 1 from public.geracoes_modulos where geracao_id = primeira) then
    raise exception 'Consumo de outro usuário visível.' using errcode = 'XX000';
  end if;
  bloqueou := false;
  begin
    insert into public.geracoes_modulos (geracao_id, posicao) values (segunda, 1);
  exception when insufficient_privilege then bloqueou := true;
  end;
  if not bloqueou then raise exception 'Geração de outro usuário reutilizada.' using errcode = 'XX000'; end if;
  perform public.reservar_geracao_trilha();
  if public.consultar_geracoes_hoje() <> 1 then
    raise exception 'Usuário B não possui limite independente.' using errcode = 'XX000';
  end if;

  set local role anon;
  bloqueou := false;
  begin
    perform public.reservar_geracao_trilha();
  exception when insufficient_privilege then bloqueou := true;
  end;
  if not bloqueou then raise exception 'Reserva anônima permitida.' using errcode = 'XX000'; end if;
  bloqueou := false;
  begin
    perform public.consultar_geracoes_hoje();
  exception when insufficient_privilege then bloqueou := true;
  end;
  if not bloqueou then raise exception 'Consulta anônima permitida.' using errcode = 'XX000'; end if;
  if has_table_privilege('anon', 'public.geracoes_trilhas', 'SELECT,INSERT,UPDATE,DELETE')
    or has_table_privilege('anon', 'public.geracoes_modulos', 'SELECT,INSERT,UPDATE,DELETE') then
    raise exception 'Tabelas de consumo expostas a anônimos.' using errcode = 'XX000';
  end if;
  reset role;
end;
$$;
rollback;
select 'Limite diário, isolamento, validade e permissões: OK (dados revertidos)' as resultado;
