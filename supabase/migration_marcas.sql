-- ============================================================
-- Bambu Gestión — Migración: tabla de marcas + inventario editable
-- Ejecutar en Supabase → SQL Editor
-- (este script asume que ya corriste schema.sql anteriormente)
-- ============================================================

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

alter table public.marcas enable row level security;

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

-- ------------------------------------------------------------
-- Migrar inventario: agregar marca_id (FK a marcas)
-- Se conserva la columna de texto "marca" original por compat-
-- ibilidad y se completa automáticamente con un trigger, pero
-- el campo que usa la aplicación de ahora en más es marca_id.
-- ------------------------------------------------------------
alter table public.inventario
  add column if not exists marca_id uuid references public.marcas(id) on delete set null;

create index if not exists idx_inventario_marca_id on public.inventario(marca_id);

-- Si ya tenías productos cargados con la columna de texto "marca",
-- este bloque crea automáticamente una marca por cada valor distinto
-- que encuentre y los enlaza. Es seguro correrlo aunque la tabla
-- esté vacía.
insert into public.marcas (nombre, codigo_prefijo)
select distinct marca, upper(left(marca, 3))
from public.inventario
where marca is not null
  and marca <> ''
  and not exists (
    select 1 from public.marcas m where m.nombre = public.inventario.marca
  );

update public.inventario i
set marca_id = m.id
from public.marcas m
where i.marca = m.nombre
  and i.marca_id is null;

-- ------------------------------------------------------------
-- Permitir edición y borrado de inventario (UPDATE ya existía;
-- agregamos DELETE explícito para usuarios autenticados)
-- ------------------------------------------------------------
create policy "Usuarios autenticados pueden eliminar inventario"
  on public.inventario for delete
  to authenticated
  using (true);

-- ============================================================
-- Fin de la migración.
-- La app ahora usa inventario.marca_id -> marcas.id, y arma el
-- código sugerido a partir de marcas.codigo_prefijo.
-- ============================================================
