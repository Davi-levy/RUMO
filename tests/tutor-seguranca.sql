-- Executar dentro de BEGIN/ROLLBACK para não criar conversas reais.
do $$
declare u uuid; outro uuid; t uuid; m uuid; pedido uuid:=gen_random_uuid(); r jsonb; segredo text:='credencial-de-teste-com-mais-de-32-caracteres'; i integer;
begin
  select id into u from auth.users order by id limit 1;
  select id into outro from auth.users where id<>u order by id limit 1;
  insert into rumo_private.tutor_config(id,segredo_hash) values(true,encode(extensions.digest(segredo,'sha256'),'hex')) on conflict(id) do update set segredo_hash=excluded.segredo_hash;
  insert into public.trilhas(usuario_id,linguagem,nivel,titulo,descricao) values(u,'Python','iniciante','Teste tutor','Teste') returning id into t;
  insert into public.modulos(trilha_id,titulo,conteudo,ordem) values(t,'Teste','Conteúdo',0) returning id into m;
  -- Usa ontem para não interferir em cota real prévia do usuário escolhido.
  delete from public.tutor_interacoes where usuario_id=u;
  perform set_config('request.jwt.claim.sub',u::text,true);
  set local role authenticated;
  begin insert into public.tutor_interacoes(id,usuario_id,modulo_id,pergunta) values(pedido,u,m,'Falsa'); raise exception 'Gravação direta permitida'; exception when insufficient_privilege then null; end;
  begin perform public.tutor_operacao(pedido,m,'Dúvida',null,'errado'); raise exception 'Credencial falsa permitida'; exception when insufficient_privilege then null; end;
  r:=public.tutor_operacao(pedido,m,'Dúvida',null,segredo);
  if not (r->>'executar')::boolean then raise exception 'Reserva falhou'; end if;
  r:=public.tutor_operacao(pedido,m,'Dúvida',null,segredo);
  if (r->>'executar')::boolean or public.consultar_tutor_hoje()<>1 then raise exception 'Duplicação de chamada/cota'; end if;
  begin perform public.tutor_operacao(gen_random_uuid(),m,'Outra',null,segredo); raise exception 'Duas consultas pendentes aceitas'; exception when raise_exception then if sqlerrm<>'TUTOR_PENDENTE' then raise; end if; end;
  perform public.tutor_operacao(pedido,null,null,'Uma pista',segredo,true);
  perform public.avaliar_tutor(pedido,1::smallint); perform public.avaliar_tutor(pedido,-1::smallint);
  if not exists(select 1 from public.tutor_interacoes ti where ti.id=pedido and avaliacao=-1) then raise exception 'Avaliação falhou'; end if;
  for i in 2..5 loop
    pedido:=gen_random_uuid(); perform public.tutor_operacao(pedido,m,'Dúvida '||i,null,segredo);
    perform public.tutor_operacao(pedido,null,null,null,segredo,true);
  end loop;
  begin perform public.tutor_operacao(gen_random_uuid(),m,'Sexta',null,segredo); raise exception 'Sexta consulta aceita'; exception when raise_exception then if sqlerrm<>'TUTOR_LIMITE' then raise; end if; end;
  perform set_config('request.jwt.claim.sub',outro::text,true);
  if exists(select 1 from public.tutor_interacoes where modulo_id=m) then raise exception 'Histórico alheio exposto'; end if;
  begin perform public.tutor_operacao(gen_random_uuid(),m,'Alheia',null,segredo); raise exception 'Módulo alheio aceito'; exception when insufficient_privilege then null; end;
  begin perform public.avaliar_tutor(pedido,1::smallint); raise exception 'Avaliação alheia aceita'; exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claim.sub',u::text,true);
  delete from public.trilhas where public.trilhas.id=t;
  if public.consultar_tutor_hoje()<>5 then raise exception 'Apagar trilha devolveu cota'; end if;
  reset role;
  -- A virada do dia libera cota; uma pendência antiga não bloqueia o novo dia.
  update public.tutor_interacoes set dia=(now() at time zone 'America/Sao_Paulo')::date-1 where usuario_id=u;
  insert into public.trilhas(usuario_id,linguagem,nivel,titulo,descricao) values(u,'Python','iniciante','Segundo teste','Teste') returning id into t;
  insert into public.modulos(trilha_id,titulo,conteudo,ordem) values(t,'Teste','Conteúdo',0) returning id into m;
  pedido:=gen_random_uuid();
  insert into public.tutor_interacoes(id,usuario_id,modulo_id,pergunta,criado_em,dia) values(pedido,u,m,'Expirada',now()-interval '3 minutes',(now() at time zone 'America/Sao_Paulo')::date-1);
  set local role authenticated;
  if public.consultar_tutor_hoje()<>0 then raise exception 'Dia anterior conta na cota'; end if;
  r:=public.tutor_operacao(gen_random_uuid(),m,'Novo dia',null,segredo);
  if not (r->>'executar')::boolean or public.consultar_tutor_hoje()<>1 then raise exception 'Novo dia bloqueado'; end if;
  if not exists(select 1 from public.tutor_interacoes ti where ti.id=pedido and estado='falha') then raise exception 'Pendência expirada não tratada'; end if;
  reset role;
end;
$$;
