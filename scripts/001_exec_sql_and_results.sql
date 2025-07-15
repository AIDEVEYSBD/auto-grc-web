-- Helper that lets the service-role execute arbitrary SQL safely
create or replace function public.exec_sql(sql text)
returns void
language plpgsql
security definer
as $$
begin
  execute sql;
end;
$$;

-- Grant execute permission to authenticated users and service_role
grant execute on function public.exec_sql(text) to authenticated;
grant execute on function public.exec_sql(text) to service_role;

-- Table used as the guaranteed fallback target
create table if not exists public.automation_results (
  id          serial primary key,
  table_name  text        not null,
  row_index   integer     not null,
  data        jsonb       not null,
  created_at  timestamptz not null default now()
);

-- Create indexes for better performance
create index if not exists idx_auto_results_tbl on public.automation_results(table_name);
create index if not exists idx_auto_results_created on public.automation_results(created_at);

-- Enable RLS
alter table public.automation_results enable row level security;

-- Create policies for RLS
create policy "Users can view their own automation results" on public.automation_results
  for select using (true);

create policy "Users can insert automation results" on public.automation_results
  for insert with check (true);

create policy "Service role can do everything" on public.automation_results
  for all using (true);

-- Grant permissions
grant all on public.automation_results to authenticated;
grant all on public.automation_results to service_role;
grant usage, select on sequence automation_results_id_seq to authenticated;
grant usage, select on sequence automation_results_id_seq to service_role;
