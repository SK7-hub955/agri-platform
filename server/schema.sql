-- AgriConnect PostgreSQL schema

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  roles         TEXT[] NOT NULL DEFAULT ARRAY['customer']::TEXT[],
  verified      BOOLEAN NOT NULL DEFAULT FALSE,
  avatar        TEXT,
  location      TEXT NOT NULL DEFAULT 'Zambia',
  truck_type    TEXT,
  available     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE TABLE IF NOT EXISTS email_verifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  code       TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications (user_id);

CREATE TABLE IF NOT EXISTS products (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  supplier_id     INTEGER REFERENCES users (id) ON DELETE SET NULL,
  category        TEXT NOT NULL DEFAULT 'Produce',
  price           NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  unit            TEXT,
  stock           INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  season          TEXT,
  predicted_avail TEXT,
  predicted_price NUMERIC(12, 2),
  demand          TEXT NOT NULL DEFAULT 'Medium',
  img             TEXT,
  image           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_supplier ON products (supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

CREATE TABLE IF NOT EXISTS orders (
  id           SERIAL PRIMARY KEY,
  customer_id  INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  product_id   INTEGER REFERENCES products (id) ON DELETE SET NULL,
  qty          INTEGER NOT NULL CHECK (qty > 0),
  total        NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  status       TEXT NOT NULL DEFAULT 'Pending',
  transport_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
  delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 250,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_product ON orders (product_id);
CREATE INDEX IF NOT EXISTS idx_orders_transport ON orders (transport_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

CREATE TABLE IF NOT EXISTS community_posts (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users (id) ON DELETE SET NULL,
  author     TEXT NOT NULL,
  role       TEXT,
  text       TEXT NOT NULL,
  likes      INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_created ON community_posts (created_at DESC);

CREATE TABLE IF NOT EXISTS crop_data (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  soil        TEXT,
  season      TEXT,
  spacing     TEXT,
  fertilizer  TEXT,
  disease     TEXT,
  yield_range TEXT,
  harvest     TEXT,
  img         TEXT,
  image       TEXT
);

CREATE TABLE IF NOT EXISTS user_actions (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users (id) ON DELETE SET NULL,
  type       TEXT NOT NULL,
  details    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_actions_user ON user_actions (user_id);
