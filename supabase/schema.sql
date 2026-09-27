-- ============================================================
-- Bambu Gestión — Script de creación de base de datos
-- Ejecutar en Supabase → SQL Editor
-- (Si ya tenías una base creada con una versión anterior de este
-- script, no vuelvas a correr este archivo: usá en cambio
-- migration_marcas.sql, pensado para actualizar sin perder datos)
-- ============================================================

-- Extensión necesaria para generar UUIDs
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Tabla: marcas
-- ------------------------------------------------------------
create table if not exists public.marcas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  codigo_prefijo text not null,
  created_at timestamptz not null default now()
);

comment on table public.marcas is 'Marcas gestionadas de forma independiente';

-- ------------------------------------------------------------
-- Tabla: inventario
-- ------------------------------------------------------------
create table if not exists public.inventario (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  precio_compra numeric(10, 2) not null default 0,
  talle text,
  color text,
  marca_id uuid references public.marcas(id) on delete set null,
  en_stock boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.inventario is 'Stock de productos';
comment on column public.inventario.marca_id is 'Referencia a public.marcas';

-- ------------------------------------------------------------
-- Tabla: clientes
-- ------------------------------------------------------------
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  talle text,
  created_at timestamptz not null default now()
);

comment on table public.clientes is 'Clientes del negocio';

-- ------------------------------------------------------------
-- Tabla: ventas
-- ------------------------------------------------------------
create table if not exists public.ventas (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  producto_id uuid not null references public.inventario(id) on delete restrict,
  precio_venta numeric(10, 2) not null default 0,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  medio_pago text not null check (
    medio_pago in ('Efectivo', 'Transferencia', 'Tarjeta de Débito', 'Tarjeta de Crédito')
  ),
  pagada boolean not null default true,
  observaciones text,
  created_at timestamptz not null default now()
);

comment on table public.ventas is 'Registro de ventas realizadas';

-- Índices útiles para las consultas más frecuentes
create index if not exists idx_ventas_cliente_id on public.ventas(cliente_id);
create index if not exists idx_ventas_producto_id on public.ventas(producto_id);
create index if not exists idx_inventario_en_stock on public.inventario(en_stock);
create index if not exists idx_inventario_marca_id on public.inventario(marca_id);

-- ------------------------------------------------------------
-- Row Level Security (RLS)
-- Cualquier usuario autenticado (los miembros del equipo que
-- inician sesión desde la plataforma) puede leer y escribir.
-- Los usuarios anónimos (sin sesión) no tienen ningún acceso.
-- ------------------------------------------------------------
alter table public.marcas enable row level security;
alter table public.inventario enable row level security;
alter table public.clientes enable row level security;
alter table public.ventas enable row level security;

create policy "Usuarios autenticados pueden ver marcas"
  on public.marcas for select
  to authenticated
  using (true);

create policy "Usuarios autenticados pueden crear marcas"
  on public.marcas for insert
  to authenticated
  with check (true);

create policy "Usuarios autenticados pueden actualizar marcas"
  on public.marcas for update
  to authenticated
  using (true)
  with check (true);

create policy "Usuarios autenticados pueden ver inventario"
  on public.inventario for select
  to authenticated
  using (true);

create policy "Usuarios autenticados pueden crear inventario"
  on public.inventario for insert
  to authenticated
  with check (true);

create policy "Usuarios autenticados pueden actualizar inventario"
  on public.inventario for update
  to authenticated
  using (true)
  with check (true);

create policy "Usuarios autenticados pueden eliminar inventario"
  on public.inventario for delete
  to authenticated
  using (true);

create policy "Usuarios autenticados pueden ver clientes"
  on public.clientes for select
  to authenticated
  using (true);

create policy "Usuarios autenticados pueden crear clientes"
  on public.clientes for insert
  to authenticated
  with check (true);

create policy "Usuarios autenticados pueden ver ventas"
  on public.ventas for select
  to authenticated
  using (true);

create policy "Usuarios autenticados pueden crear ventas"
  on public.ventas for insert
  to authenticated
  with check (true);

-- ============================================================
-- Fin del script
-- Después de ejecutarlo, creá los usuarios del equipo desde
-- Authentication → Users → Add user (con email y contraseña).
-- Cargá al menos una marca desde la sección Inventario antes
-- de dar de alta productos.
-- ============================================================
