# Deploy SushiMaster TV online

Proiectul are **frontend** (React) și **backend** (FastAPI + MongoDB). Plan recomandat:

| Component | Serviciu | Notă |
|-----------|----------|------|
| Frontend | **Netlify** | SPA, build React |
| Backend  | **Render** | FastAPI, plan free |
| Baza de date | **MongoDB Atlas** | Cluster gratuit |

---

## 1. Pregătire

- Conturi: [Netlify](https://netlify.com), [Render](https://render.com), [MongoDB Atlas](https://cloud.mongodb.com).
- Codul pe **GitHub** (sau GitLab) în același repo (frontend în `frontend/`, backend în `backend/`).

---

## 2. MongoDB Atlas

1. Creează un [cluster gratuit](https://cloud.mongodb.com) (M0).
2. **Database Access** → Add User → user + parolă. Notează-le.
3. **Network Access** → Add IP → **Allow Access from Anywhere** (`0.0.0.0/0`) pentru Render.
4. **Database** → Connect → **Drivers** → copiază URI-ul. Exemple:
   - `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/`
   - Cu database: `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/sushimaster_tv`

Poți folosi DB-ul `sushimaster_tv` sau alt nume; îl vei seta în Render ca `DB_NAME`.

---

## 3. Backend pe Render

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
2. Conectează repo-ul GitHub (branch-ul unde ai `render.yaml`).
3. Render citește `render.yaml` din root. Apasă **Apply**.
4. Serviciul **sushimaster-api** este creat. Notează URL-ul (ex. `https://sushimaster-api.onrender.com`).
5. **sushimaster-api** → **Environment** → adaugă:

   | Key | Value |
   |-----|--------|
   | `MONGO_URL` | `mongodb+srv://USER:PASS@cluster....mongodb.net/` |
   | `DB_NAME` | `sushimaster_tv` |
   | `SECRET_KEY` | un string lung, aleatoriu (ex. `openssl rand -hex 32`) |
   | `CORS_ORIGINS` | lasă gol momentan; îl completezi după Netlify |

6. **Save** → Render redeploy-ează backend-ul.

**Important:** Pe planul free, serviciul se pune în sleep după inactivitate. Primul request poate dura 30–60 s.

---

## 4. Frontend pe Netlify

1. [Netlify](https://app.netlify.com) → **Add new site** → **Import an existing project**.
2. Conectează același repo GitHub. Netlify detectează `netlify.toml` din root și folosește base `frontend`, build și redirecturi.
3. **Site settings** → **Environment variables** → **Add variable**:
   - `REACT_APP_BACKEND_URL` = `https://sushimaster-api.onrender.com` (URL-ul backend-ului de la Render)
4. **Trigger deploy** (sau așteaptă deploy-ul automat). Notează URL-ul (ex. `https://nume-site.netlify.app`).

---

## 5. Conectare Frontend ↔ Backend

1. **Render** → **sushimaster-api** → **Environment**.
2. Setează `CORS_ORIGINS` = URL-ul Netlify, ex. `https://nume-site.netlify.app`  
   (fără slash la final).
3. **Save** → așteaptă redeploy.

Acum frontend-ul de pe Netlify poate apela API-ul de pe Render fără erori CORS.

---

## 6. Verificare

- Deschide URL-ul Netlify → Login / Înregistrare.
- Primul user devine Super Admin. Verifică Dashboard, Utilizatori, Invitații.

---

## Variabile de mediu – rezumat

**Render (backend)**

- `MONGO_URL` – URI MongoDB Atlas
- `DB_NAME` – nume DB (ex. `sushimaster_tv`)
- `SECRET_KEY` – secret JWT
- `CORS_ORIGINS` – URL Netlify (ex. `https://nume-site.netlify.app`)

**Netlify (frontend)**

- `REACT_APP_BACKEND_URL` – URL Render (ex. `https://sushimaster-api.onrender.com`)
- `DISABLE_ESLINT_PLUGIN` e setat în `netlify.toml`; nu e nevoie să-l mai adaugi în UI.

---

## Limitări pe plan free

- **Render:** sleep după inactivitate; filesystem efemer (fișierele încărcate în `backend/uploads` se pierd la restart). Pentru stocare persistentă ar trebui S3 sau similar.
- **MongoDB Atlas:** limită de spațiu pe M0.

---

## Resetează parola unui user (producție)

Rulezi local scriptul `reset_password.py` cu `MONGO_URL` și `DB_NAME` din Atlas (ex. într-un `.env` temporar), sau adaugi un endpoint securizat de reset (ex. doar pentru Super Admin).
