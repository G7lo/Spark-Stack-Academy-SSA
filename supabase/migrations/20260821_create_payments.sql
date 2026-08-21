alter table public.payments
add column if not exists course_id text;

alter table public.payments
add column if not exists course_name text;

alter table public.payments
add column if not exists currency text default 'KES';

alter table public.payments
add column if not exists reference text;

alter table public.payments
add column if not exists provider text default 'flutterwave';

alter table public.payments
add column if not exists customer_email text;

alter table public.payments
add column if not exists status text default 'pending';

alter table public.payments
add column if not exists provider_transaction_id text;

alter table public.payments
add column if not exists payment_method text;

alter table public.payments
add column if not exists metadata jsonb default '{}'::jsonb;

alter table public.payments
add column if not exists updated_at timestamptz default now();

create index if not exists payments_course_id_idx
on public.payments(course_id);

create index if not exists payments_status_idx
on public.payments(status);

create index if not exists payments_reference_idx
on public.payments(reference);