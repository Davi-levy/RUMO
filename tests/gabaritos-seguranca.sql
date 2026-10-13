-- Executar depois da migração, dentro de BEGIN/ROLLBACK: não deixa dados de teste.
do $$
declare
  u uuid; outro uuid; t uuid; m uuid; e uuid; legado uuid; previsao uuid; r jsonb; n integer;
begin
  select id into u from auth.users order by id limit 1;
  select id into outro from auth.users where id<>u order by id limit 1;
  if u is null or outro is null then raise exception 'Teste exige dois usuários existentes.'; end if;
  insert into public.trilhas(usuario_id,linguagem,nivel,titulo,descricao) values(u,'Teste','iniciante','Teste segurança','Teste') returning id into t;
  insert into public.modulos(trilha_id,titulo,conteudo,ordem) values(t,'Teste','Conteúdo',0) returning id into m;
  insert into public.exercicios(modulo_id,pergunta,resposta_esperada,explicacao,dica,ordem,tipo,alternativas)
    values(m,'Qual opção?','b','EXPLICACAO_PRIVADA','Uma dica',0,'multipla_escolha',
      '[{"id":"a","texto":"Errada"},{"id":"b","texto":"Certa"},{"id":"c","texto":"Outra"},{"id":"d","texto":"Última"}]') returning id into e;
  insert into public.exercicios(modulo_id,pergunta,resposta_esperada,explicacao,ordem,tipo)
    values(m,'Pergunta antiga','print mostra texto','Explicação antiga',1,'legado') returning id into legado;
  insert into public.exercicios(modulo_id,pergunta,resposta_esperada,explicacao,ordem,tipo)
    values(m,'Saída?','  Olá Mundo','Saída literal',2,'previsao_saida') returning id into previsao;
  perform set_config('request.jwt.claim.sub',u::text,true);
  set local role authenticated;
  perform pergunta from public.exercicios where id=e;
  begin perform * from public.exercicios where id=e; raise exception 'SELECT * exposto'; exception when insufficient_privilege then null; end;
  begin perform resposta_esperada from public.exercicios where id=e; raise exception 'Gabarito exposto'; exception when insufficient_privilege then null; end;
  begin perform explicacao from public.exercicios where id=e; raise exception 'Explicação exposta'; exception when insufficient_privilege then null; end;
  begin perform public.avaliar_exercicio(e,null,true); raise exception 'Revelou antes de responder'; exception when insufficient_privilege then null; end;
  begin insert into public.respostas(usuario_id,exercicio_id,resposta,acertou) values(u,e,'a',true); raise exception 'Progresso forjável'; exception when insufficient_privilege then null; end;
  begin update public.exercicios set resposta_esperada='a' where id=e; raise exception 'Gabarito alterável'; exception when insufficient_privilege then null; end;
  r:=public.avaliar_exercicio(e,'a',false);
  if (r->>'acertou')::boolean or r::text like '%EXPLICACAO_PRIVADA%' or r ? 'resposta_esperada' then raise exception 'Correção incorreta ou exposta'; end if;
  r:=public.avaliar_exercicio(e,null,true);
  if r->>'solucao'<>'Certa' then raise exception 'Solução incorreta'; end if;
  if exists(select 1 from public.respostas where exercicio_id=e and acertou) then raise exception 'Revelação alterou progresso'; end if;
  r:=public.avaliar_exercicio(e,'b',false);
  if not (r->>'acertou')::boolean or r->>'feedback' not like '%EXPLICACAO_PRIVADA%' then raise exception 'Acerto sem explicação'; end if;
  perform public.avaliar_exercicio(e,'b',false);
  select count(*) into n from public.respostas where exercicio_id=e;
  if n<>1 then raise exception 'Resposta duplicada'; end if;
  begin update public.respostas set acertou=true where exercicio_id=e; raise exception 'Acerto alterável'; exception when insufficient_privilege then null; end;
  r:=public.avaliar_exercicio(legado,'PRINT mostra texto',false);
  if not (r->>'acertou')::boolean then raise exception 'Legado incompatível'; end if;
  r:=public.avaliar_exercicio(previsao,E'\n  Olá Mundo  \t\r\n\n',false);
  if not (r->>'acertou')::boolean then raise exception 'Normalização incorreta'; end if;
  r:=public.avaliar_exercicio(previsao,'Olá Mundo',false);
  if (r->>'acertou')::boolean then raise exception 'Indentação ignorada'; end if;
  r:=public.avaliar_exercicio(previsao,'  olá Mundo',false);
  if (r->>'acertou')::boolean then raise exception 'Caixa ignorada'; end if;
  perform set_config('request.jwt.claim.sub',outro::text,true);
  begin perform public.avaliar_exercicio(e,'b',false); raise exception 'Exercício alheio acessível'; exception when insufficient_privilege then null; end;
  begin perform public.avaliar_exercicio(e,null,true); raise exception 'Solução alheia acessível'; exception when insufficient_privilege then null; end;
  reset role;
  if has_function_privilege('anon','public.avaliar_exercicio(uuid,text,boolean)','execute') then raise exception 'RPC acessível anonimamente'; end if;
end;
$$;
