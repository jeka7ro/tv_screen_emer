-- SushiMaster TV – schema PostgreSQL (Supabase)
-- Rulează în Supabase: SQL Editor → New query → paste → Run

-- Users (auth custom, păstrăm JWT în backend)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  hashed_password TEXT NOT NULL,
  is_super_admin BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'admin', -- admin, manager
  location_id TEXT, -- For managers
  status TEXT DEFAULT 'active', -- active, suspended
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Invitations
CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INT DEFAULT 1,
  uses INT DEFAULT 0,
  role TEXT DEFAULT 'admin',
  location_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(code);

-- Locations
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  timezone TEXT DEFAULT 'Europe/Bucharest',
  security_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Screens
CREATE TABLE IF NOT EXISTS screens (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  resolution TEXT DEFAULT '1920x1080',
  orientation TEXT DEFAULT 'landscape',
  template_id TEXT,
  sync_group TEXT,
  cascade_offset INT DEFAULT 0,
  sync_type TEXT DEFAULT 'simple',
  sync_group_name TEXT,
  sync_fit_mode TEXT DEFAULT 'cover',
  status TEXT DEFAULT 'offline',
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_screens_slug ON screens(slug);
CREATE INDEX IF NOT EXISTS idx_screens_location ON screens(location_id);

-- Content
CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  duration INT DEFAULT 10,
  category TEXT DEFAULT 'other',
  tags JSONB DEFAULT '[]',
  thumbnail_url TEXT,
  autoplay BOOLEAN DEFAULT TRUE,
  loop BOOLEAN DEFAULT TRUE,
  playlist_urls JSONB DEFAULT '[]',
  source_type TEXT DEFAULT 'file',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Playlists
CREATE TABLE IF NOT EXISTS playlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  items JSONB DEFAULT '[]',
  autoplay BOOLEAN DEFAULT TRUE,
  loop BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DOUBLE PRECISION NOT NULL,
  currency TEXT DEFAULT 'RON',
  category TEXT NOT NULL,
  image_url TEXT,
  available BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Digital menus
CREATE TABLE IF NOT EXISTS digital_menus (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  template_id TEXT,
  selected_products JSONB DEFAULT '[]',
  selected_categories JSONB DEFAULT '[]',
  promo_products JSONB DEFAULT '[]',
  show_promo_slides BOOLEAN DEFAULT FALSE,
  promo_slide_duration INT DEFAULT 8,
  products_per_page INT DEFAULT 6,
  page_duration INT DEFAULT 10,
  auto_rotate BOOLEAN DEFAULT TRUE,
  background_image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Screen zones (layout per screen)
CREATE TABLE IF NOT EXISTS screen_zones (
  id TEXT PRIMARY KEY,
  screen_id TEXT NOT NULL,
  zone_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  digital_menu_id TEXT,
  playlist_id TEXT,
  content_id TEXT,
  weather_location TEXT,
  custom_html TEXT,
  UNIQUE(screen_id, zone_id)
);
CREATE INDEX IF NOT EXISTS idx_screen_zones_screen ON screen_zones(screen_id);
