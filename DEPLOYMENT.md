# Deployment Configuration Guide

## Automated Deployment Setup

Am creat scriptul `deploy.sh` pentru deployment automat pe Netlify și Render.

### Configurare API Tokens

#### 1. Netlify
1. Mergi la https://app.netlify.com/user/applications
2. Click "New access token"
3. Copiază token-ul generat
4. Găsește Site ID: Settings → General → Site details → API ID

#### 2. Render
1. Mergi la https://dashboard.render.com/u/settings#api-keys
2. Click "Create API Key"
3. Copiază cheia generată
4. Găsește Service ID din URL-ul serviciului (ex: `srv-xxxxx`)

### Utilizare

**Opțiunea 1: Environment Variables**
```bash
export NETLIFY_SITE_ID="your-site-id"
export NETLIFY_AUTH_TOKEN="your-netlify-token"
export RENDER_SERVICE_ID="srv-xxxxx"
export RENDER_API_KEY="your-render-key"

./deploy.sh
```

**Opțiunea 2: Direct în script**
Editează `deploy.sh` și înlocuiește valorile:
```bash
NETLIFY_SITE_ID="your-site-id"
NETLIFY_AUTH_TOKEN="your-netlify-token"
RENDER_SERVICE_ID="srv-xxxxx"
RENDER_API_KEY="your-render-key"
```

### Auto-Deploy din Git

**Netlify și Render au deja auto-deploy configurat!**

Când faci `git push origin main`:
- ✅ Netlify detectează automat și face rebuild
- ✅ Render detectează automat și face redeploy

**Verifică status:**
- Netlify: https://app.netlify.com
- Render: https://dashboard.render.com

### Troubleshooting

Dacă auto-deploy nu funcționează:
1. Verifică că branch-ul este `main` (nu `master`)
2. Verifică webhook-urile în Settings
3. Folosește `./deploy.sh` pentru deploy manual
