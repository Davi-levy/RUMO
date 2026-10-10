

--uma resposta por usuário e exercício (necessário para o upsert do app)
alter table public.respostas
  add constraint respostas_usuario_exercicio_key unique (usuario_id, exercicio_id);

-- permite refazer um exercício o upsert faz UPDATE quando já existe resposta
create policy "Usuário atualiza as próprias respostas"
  on public.respostas for update
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- handle_new_user() só deve ser executada pelo trigger e nunca via /rest/v1/rpc
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- colunas que o app sempre preenche passam a ser obrigatórias
alter table public.trilhas alter column titulo set not null;
alter table public.modulos alter column titulo set not null;
alter table public.modulos alter column conteudo set default '';
alter table public.modulos alter column conteudo set not null;
alter table public.respostas alter column resposta set not null;
alter table public.respostas alter column acertou set default false;
alter table public.respostas alter column acertou set not null;
