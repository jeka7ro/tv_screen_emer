# Setup rapid – SushiMaster TV (Supabase)

## 0. Session Pooler (obligatoriu pe IPv4)

Conectarea **Direct** dă timeout pe multe rețele. Folosește **Session pooler**:

1. Supabase → **Connect** → tab **Connection string**.
2. **Method** → alege **Session pooler** (nu „Direct connection”).
3. Copiază URI-ul afișat (alt host, ex. `pooler.supabase.com`).
4. Îl folosești mai jos la `DATABASE_URL`.

## 1. Backend `.env`

Editează `backend/.env`:

- **DATABASE_URL:** URI-ul de la pasul 0, cu parola ta în loc de `[YOUR-PASSWORD]`.
- **SECRET_KEY:** un string aleatoriu (ex. `openssl rand -hex 32`).
- **CORS_ORIGINS:** lasă sau ajustează (localhost + URL Netlify).

## 2. Aplică schema în Supabase

```bash
cd backend && python3 apply_schema.py
```

Rulezi o singură dată. Creează tabelele în proiectul Supabase.

## 3. Pornește local

```bash
./start-local.sh
```

Backend: http://localhost:8000  
Frontend: http://localhost:3000  

Asigură-te că `frontend/.env` are `REACT_APP_BACKEND_URL=http://localhost:8000`.

## 4. Render (backend)

- **Environment** → adaugă **DATABASE_URL** = același URI din `backend/.env` (cu parola reală).
- **SECRET_KEY**, **CORS_ORIGINS** (URL Netlify).

## 5. Netlify (frontend)

- **Environment** → **REACT_APP_BACKEND_URL** = URL-ul Render (ex. `https://sushimaster-api.onrender.com`).

## Dacă „connection refused” sau backend nu pornește (timeout / IPv4)

Conectarea **Direct** la Supabase poate eșua pe rețele doar IPv4. Folosește **Session Pooler**:

1. Supabase → **Connect** → tab **Connection string**.
2. La **Method** alege **Session pooler** (nu Direct).
3. Copiază noul **URI** (alt host, de ex. `pooler.supabase.com`).
4. În `backend/.env` pune acest URI la **DATABASE_URL** (cu parola ta).
5. Rulează din nou `apply_schema.py`, apoi `./start-local.sh`.

## Resetează parolă user

```bash
cd backend && python3 reset_password.py email@example.com ParolaNoua
```

`.env` trebuie să conțină `DATABASE_URL` valid.
