-- Rodar sempre em BEGIN/ROLLBACK; nenhum dado de teste permanece.
do $$
declare u uuid; outro uuid; t uuid; m uuid; e uuid; n integer; ok integer;
begin
  select id into u from auth.users order by id limit 1;
  select id into outro from auth.users where id<>u order by id limit 1;
  if u is null or outro is null then raise exception 'Teste exige dois usuários.'; end if;
  insert into public.trilhas(usuario_id,linguagem,nivel,titulo,criado_em)
    select u,'Teste','iniciante','Resumo fixture '||i,'2100-01-01'::timestamptz+i*interval '1 second' from generate_series(1,14) i;
  select id into t from public.trilhas where usuario_id=u order by criado_em desc,id desc limit 1;
  insert into public.modulos(trilha_id,titulo,conteudo,ordem) values(t,'Teste','Conteúdo',0) returning id into m;
  insert into public.exercicios(modulo_id,pergunta,resposta_esperada,explicacao,ordem)
    select m,'Teste '||i,'a','Explicação',i from generate_series(1,1002) i;
  select id into e from public.exercicios where modulo_id=m order by ordem limit 1;
  insert into public.respostas(usuario_id,exercicio_id,resposta,acertou) values(u,e,'a',true);
  perform set_config('request.jwt.claim.sub',u::text,true);
  set local role authenticated;
  select total,acertos into n,ok from public.listar_resumo_trilhas(0) where id=t;
  if n is distinct from 1002 or ok is distinct from 1 then raise exception 'Contagem truncada ou incorreta'; end if;
  if (select count(*) from public.listar_resumo_trilhas(0))<>13 then raise exception 'Limite de página incorreto'; end if;
  if exists(select 1 from public.listar_resumo_trilhas(12) where id=t) then raise exception 'Paginação repetiu registro'; end if;
  if not exists(select 1 from public.listar_resumo_trilhas(-1) where id=t) then raise exception 'Offset negativo incorreto'; end if;
  reset role;
  perform set_config('request.jwt.claim.sub',outro::text,true);
  set local role authenticated;
  if exists(select 1 from public.listar_resumo_trilhas(0) where id=t) then raise exception 'Vazou trilha alheia'; end if;
  reset role;
  if has_function_privilege('anon','public.listar_resumo_trilhas(integer)','execute') then raise exception 'RPC exposta para anon'; end if;
end;
$$;
