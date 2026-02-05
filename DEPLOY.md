# Deploy SushiMaster TV online (Supabase + Netlify + Render)

Proiectul folosește **Supabase** (PostgreSQL) în loc de MongoDB. Plan recomandat:

| Component | Serviciu | Notă |
|-----------|----------|------|
| Frontend | **Netlify** | SPA, build React |
| Backend  | **Render** | FastAPI, plan free |
| Baza de date | **Supabase** | Postgres gratuit |

---

## 1. Pregătire

- Conturi: [Supabase](https://supabase.com), [Netlify](https://netlify.com), [Render](https://render.com).
- Codul pe **GitHub** (frontend în `frontend/`, backend în `backend/`).

---

## 2. Supabase (Postgres)

1. Creează un [proiect Supabase](https://supabase.com/dashboard) (plan free).
2. **Project Settings** → **Database** → **Connection string** → **URI**. Copiază URI-ul (ex. `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`).
3. Pentru **asyncpg** folosește **Direct connection** (port **5432**), nu Pooler (6543). În **Database** → **Connection string** alege “Direct” și notează URI-ul.
4. **SQL Editor** → New query → lipește conținutul din `supabase/schema.sql` → **Run**. Se creează tabelele necesare.

---

## 3. Backend pe Render

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
2. Conectează repo-ul GitHub (branch cu `render.yaml`).
3. Apasă **Apply**. Serviciul **sushimaster-api** este creat. Notează URL-ul (ex. `https://sushimaster-api.onrender.com`).
4. **sushimaster-api** → **Environment** → adaugă:

   | Key | Value |
   |-----|--------|
   | `DATABASE_URL` | URI-ul **Direct** Supabase (Postgres) |
   | `SECRET_KEY` | string aleatoriu (ex. `openssl rand -hex 32`) |
   | `CORS_ORIGINS` | lasă gol; îl completezi după Netlify |

5. **Save** → Render redeploy-ează.

**Important:** Pe plan free, serviciul intră în sleep după inactivitate. Primul request poate dura 30–60 s.

---

## 4. Frontend pe Netlify

1. [Netlify](https://app.netlify.com) → **Add new site** → **Import an existing project**.
2. Conectează același repo. Netlify folosește `netlify.toml` (base `frontend`, build, redirecturi).
3. **Site settings** → **Environment variables**:
   - `REACT_APP_BACKEND_URL` = URL-ul Render (ex. `https://sushimaster-api.onrender.com`)
4. **Trigger deploy**. Notează URL-ul Netlify (ex. `https://sushimaster-tv.netlify.app`).

---

## 5. Conectare Frontend ↔ Backend

1. **Render** → **sushimaster-api** → **Environment**.
2. Setează `CORS_ORIGINS` = URL Netlify (ex. `https://sushimaster-tv.netlify.app`), fără slash la final.
3. **Save** → așteaptă redeploy.

---

## 6. Verificare

- Deschide URL-ul Netlify → Login / Înregistrare.
- Primul user devine Super Admin. Verifică Dashboard, Utilizatori, Invitații.

---

## Variabile de mediu – rezumat

**Render (backend)**

- `DATABASE_URL` – URI Postgres Supabase (Direct, port 5432)
- `SECRET_KEY` – secret JWT
- `CORS_ORIGINS` – URL Netlify

**Netlify (frontend)**

- `REACT_APP_BACKEND_URL` – URL Render
- `DISABLE_ESLINT_PLUGIN` – setat în `netlify.toml`

---

## Resetează parola unui user (producție)

Din `backend/`, cu `.env` care conține `DATABASE_URL` (Supabase):

```bash
python reset_password.py jeka7ro@gmail.com ParolaNoua123!
```

---

## Limitări plan free

- **Render:** sleep după inactivitate; filesystem efemer (upload-urile din `uploads/` se pierd la restart). Pentru stocare persistentă: Supabase Storage sau S3.
- **Supabase:** limite pe plan free (spațiu, trafic).
