-- Testes transacionais: não cria usuários, gerações nem consumo permanentes.
begin;
do $$
declare normal uuid:=gen_random_uuid(); liberado uuid:=gen_random_uuid(); i integer; g uuid; r uuid;
begin
  insert into auth.users(id,email) values(normal,normal||'@teste.invalid'),(liberado,liberado||'@teste.invalid');
  insert into rumo_private.contas_geracao_ilimitada values(liberado);
  perform set_config('request.jwt.claim.sub',normal::text,true);
  set local role authenticated;
  if public.consultar_geracao_ilimitada() then raise exception 'Conta normal liberada'; end if;
  begin
    insert into public.geracoes_trilhas(usuario_id,vaga) values(normal,null);
    raise exception 'Vaga ilimitada forjada';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.avaliacoes_temas(usuario_id,vaga) values(normal,null);
    raise exception 'Avaliação ilimitada forjada';
  exception when insufficient_privilege then null; end;
  begin
    insert into rumo_private.contas_geracao_ilimitada values(normal);
    raise exception 'Conta concedeu a própria permissão';
  exception when insufficient_privilege then null; end;
  perform public.reservar_geracao_trilha(); perform public.reservar_geracao_trilha();
  begin perform public.reservar_geracao_trilha(); raise exception 'Terceira geração normal permitida';
  exception when raise_exception then if sqlerrm not like 'Limite diário de 2%' then raise; end if; end;
  for i in 1..5 loop perform public.reservar_avaliacao_tema(); end loop;
  begin perform public.reservar_avaliacao_tema(); raise exception 'Sexta avaliação normal permitida';
  exception when raise_exception then if sqlerrm not like 'Limite diário de 5%' then raise; end if; end;
  perform set_config('request.jwt.claim.sub',liberado::text,true);
  if not public.consultar_geracao_ilimitada() then raise exception 'Conta autorizada bloqueada'; end if;
  for i in 1..8 loop
    g:=public.reservar_geracao_trilha(); perform public.reservar_avaliacao_tema();
    if not exists(select 1 from public.geracoes_trilhas where id=g and usuario_id=liberado and vaga is null) then raise exception 'Reserva ilimitada sem registro'; end if;
  end loop;
  perform set_config('request.jwt.claim.sub',normal::text,true);
  if exists(select 1 from public.geracoes_trilhas where usuario_id=liberado) then raise exception 'Consumo de outra conta exposto'; end if;
  reset role;
end;
$$;
rollback;
