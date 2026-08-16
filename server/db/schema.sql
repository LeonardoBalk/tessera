create type user_role as enum ('organizer', 'customer', 'gate_staff');
create type event_type as enum ('seated', 'general_admission');
create type event_status as enum ('published', 'closed');
create type seat_status as enum ('available', 'reserved', 'sold');
create type booking_status as enum ('pending', 'paid', 'declined', 'canceled');
create type ticket_status as enum ('valid', 'used', 'canceled');

create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role user_role not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  source_event_id text,
  title text not null,
  image_url text,
  venue_name text,
  venue_city text,
  event_date timestamptz not null,
  location text,
  description text,
  category text,
  type event_type not null,
  price numeric(10, 2) not null check (price >= 0),
  total_capacity integer not null check (total_capacity > 0),
  organizer_id uuid not null references users (id),
  status event_status not null default 'published',
  created_at timestamptz not null default now()
);

create index events_organizer_id_idx on events (organizer_id);
create index events_status_idx on events (status);
create index events_category_idx on events (category);

create table seats (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  code text not null,
  status seat_status not null default 'available',
  unique (event_id, code)
);

create index seats_event_id_idx on seats (event_id);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id),
  customer_id uuid not null references users (id),
  seat_ids uuid[],
  quantity integer check (quantity > 0),
  status booking_status not null default 'pending',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint bookings_seats_xor_quantity check (
    (seat_ids is not null and array_length(seat_ids, 1) > 0 and quantity is null) or
    (seat_ids is null and quantity is not null)
  ),
  constraint bookings_pending_has_expiry check (status != 'pending' or expires_at is not null)
);

create index bookings_event_id_idx on bookings (event_id);
create index bookings_customer_id_idx on bookings (customer_id);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id),
  event_id uuid not null references events (id),
  customer_id uuid not null references users (id),
  seat_id uuid references seats (id),
  qr_payload text not null unique,
  status ticket_status not null default 'valid',
  validated_at timestamptz,
  validated_by uuid references users (id),
  created_at timestamptz not null default now()
);

create index tickets_booking_id_idx on tickets (booking_id);
create index tickets_event_id_idx on tickets (event_id);
create index tickets_customer_id_idx on tickets (customer_id);

alter table users enable row level security;
alter table events enable row level security;
alter table seats enable row level security;
alter table bookings enable row level security;
alter table tickets enable row level security;

grant select, insert, update, delete on table users to service_role;
grant select, insert, update, delete on table events to service_role;
grant select, insert, update, delete on table seats to service_role;
grant select, insert, update, delete on table bookings to service_role;
grant select, insert, update, delete on table tickets to service_role;

create function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role, name)
  values (
    new.id,
    new.email,
    coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'customer'),
    coalesce(new.raw_user_meta_data ->> 'name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create function sync_user_role()
returns trigger as $$
begin
  update public.users
  set role = coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, role)
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function sync_user_role();

create function custom_access_token_hook(event jsonb)
returns jsonb as $$
declare
  claims jsonb;
  user_role_value public.user_role;
begin
  select role into user_role_value from public.users where id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';

  if user_role_value is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role_value));
  else
    claims := jsonb_set(claims, '{user_role}', 'null');
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$ language plpgsql set search_path = public;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
grant select on table public.users to supabase_auth_admin;

create policy "allow auth admin to read user roles" on public.users
as permissive for select
to supabase_auth_admin
using (true);

create function book_general_admission(
  p_event_id uuid,
  p_customer_id uuid,
  p_quantity integer
) returns bookings as $$
declare
  v_capacity integer;
  v_booked integer;
  v_booking bookings;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'quantity must be greater than zero';
  end if;

  if not exists (select 1 from public.users where id = p_customer_id and role = 'customer') then
    raise exception 'invalid customer';
  end if;

  select total_capacity into v_capacity
  from public.events
  where id = p_event_id and type = 'general_admission' and status = 'published'
  for update;

  if v_capacity is null then
    raise exception 'event not found or not general admission';
  end if;

  select coalesce(sum(quantity), 0) into v_booked
  from public.bookings
  where event_id = p_event_id
    and (status = 'paid' or (status = 'pending' and expires_at > now()));

  if v_booked + p_quantity > v_capacity then
    raise exception 'not enough capacity';
  end if;

  insert into public.bookings (event_id, customer_id, quantity, status, expires_at)
  values (p_event_id, p_customer_id, p_quantity, 'pending', now() + interval '10 minutes')
  returning * into v_booking;

  return v_booking;
end;
$$ language plpgsql set search_path = public;

grant execute on function public.book_general_admission to service_role;
revoke execute on function public.book_general_admission from authenticated, anon, public;
