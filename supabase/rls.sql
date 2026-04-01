alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.invoice_payments enable row level security;
alter table public.reminders enable row level security;
alter table public.subscriptions enable row level security;

create or replace function public.current_organization_id()
returns uuid
language sql
stable
as $$
  select organization_id
  from public.profiles
  where id = auth.uid()
$$;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member"
on public.organizations
for select
using (id = public.current_organization_id());

drop policy if exists "organizations_update_owner" on public.organizations;
create policy "organizations_update_owner"
on public.organizations
for update
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "clients_member_access" on public.clients;
create policy "clients_member_access"
on public.clients
for all
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

drop policy if exists "quotes_member_access" on public.quotes;
create policy "quotes_member_access"
on public.quotes
for all
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

drop policy if exists "quote_items_member_access" on public.quote_items;
create policy "quote_items_member_access"
on public.quote_items
for all
using (
  exists (
    select 1
    from public.quotes
    where quotes.id = quote_items.quote_id
      and quotes.organization_id = public.current_organization_id()
  )
)
with check (
  exists (
    select 1
    from public.quotes
    where quotes.id = quote_items.quote_id
      and quotes.organization_id = public.current_organization_id()
  )
);

drop policy if exists "invoices_member_access" on public.invoices;
create policy "invoices_member_access"
on public.invoices
for all
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

drop policy if exists "invoice_items_member_access" on public.invoice_items;
create policy "invoice_items_member_access"
on public.invoice_items
for all
using (
  exists (
    select 1
    from public.invoices
    where invoices.id = invoice_items.invoice_id
      and invoices.organization_id = public.current_organization_id()
  )
)
with check (
  exists (
    select 1
    from public.invoices
    where invoices.id = invoice_items.invoice_id
      and invoices.organization_id = public.current_organization_id()
  )
);

drop policy if exists "invoice_payments_member_access" on public.invoice_payments;
create policy "invoice_payments_member_access"
on public.invoice_payments
for all
using (
  exists (
    select 1
    from public.invoices
    where invoices.id = invoice_payments.invoice_id
      and invoices.organization_id = public.current_organization_id()
  )
)
with check (
  exists (
    select 1
    from public.invoices
    where invoices.id = invoice_payments.invoice_id
      and invoices.organization_id = public.current_organization_id()
  )
);

drop policy if exists "reminders_member_access" on public.reminders;
create policy "reminders_member_access"
on public.reminders
for all
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

drop policy if exists "subscriptions_member_access" on public.subscriptions;
create policy "subscriptions_member_access"
on public.subscriptions
for all
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());
