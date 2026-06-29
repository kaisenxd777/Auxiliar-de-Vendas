-- ============================================================
-- Execute este script no Supabase: painel do projeto →
-- SQL Editor → New query → cole tudo → Run
-- ============================================================

create table if not exists vendas (
  id          uuid primary key default gen_random_uuid(),
  product     text not null,
  value       numeric(10,2) not null,
  commission  numeric(10,2) not null,
  rate        text,
  type        text,
  date        date not null,
  qty         integer,
  created_at  timestamptz default now()
);

-- Índice para acelerar filtros por data (period: hoje/semana/mês)
create index if not exists idx_vendas_date on vendas (date);

-- Habilita Row Level Security (boa prática, mesmo de início)
alter table vendas enable row level security;

-- Por enquanto, sem autenticação de usuário no app, liberamos
-- acesso total via service_role (o backend já usa essa chave,
-- que ignora RLS por padrão — esta policy é só para o caso de
-- você futuramente chamar o Supabase direto do frontend com a
-- anon key).
create policy "Acesso total via service role"
  on vendas for all
  using (true)
  with check (true);
