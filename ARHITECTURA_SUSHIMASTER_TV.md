# 📺 SushiMaster TV - Documentație Tehnică Completă

## 📋 Prezentare Generală

SushiMaster TV este un sistem complet de management pentru meniuri digitale, conceput pentru restaurante și locații cu multiple ecrane. Permite afișarea dinamică a produselor, prețurilor, promoțiilor și conținut media pe ecrane TV distribuite în mai multe locații.

---

## 🏗️ Arhitectură Tehnică

### Stack Tehnologic

**Backend:**
- **Framework:** FastAPI (Python)
- **Bază de date:** MongoDB (motor async cu AsyncIOMotorClient)
- **Autentificare:** JWT (JSON Web Tokens) cu python-jose
- **Password Hashing:** bcrypt via passlib
- **File Upload:** python-multipart, Pillow (PIL)
- **CORS:** Activat pentru comunicare cross-origin

**Frontend:**
- **Framework:** React 18
- **Routing:** React Router DOM v6
- **UI Components:** Shadcn/UI (componente moderne)
- **Styling:** Tailwind CSS + Custom glassmorphism
- **Icons:** Lucide React
- **HTTP Client:** Axios cu interceptori pentru auth
- **Notifications:** Sonner (toast notifications)
- **Fonts:** Outfit (headings), Manrope (body)

**Infrastructură:**
- **Backend Port:** 8001 (intern)
- **Frontend Port:** 3000 (intern)
- **Reverse Proxy:** Kubernetes Ingress
- **Hot Reload:** Activat pentru development
- **Supervisor:** Process management

---

## 🗄️ Modele de Date (MongoDB Collections)

### 1. Users (Utilizatori)
```python
{
    "id": "uuid",
    "email": "string (EmailStr)",
    "full_name": "string",
    "hashed_password": "string (bcrypt)",
    "created_at": "datetime (ISO 8601)"
}
```

**Câmpuri cheie:**
- `email` - Unic, folosit pentru autentificare
- `hashed_password` - Parola hashată cu bcrypt
- `full_name` - Numele complet al utilizatorului

### 2. Locations (Locații)
```python
{
    "id": "uuid",
    "name": "string",
    "address": "string",
    "city": "string",
    "status": "active|inactive",
    "timezone": "string (default: Europe/Bucharest)",
    "security_code": "string|null (opțional)",
    "created_at": "datetime"
}
```

**Funcționalitate:**
- Reprezintă un restaurant sau punct de vânzare fizic
- `security_code` - Cod opțional pentru protejarea accesului la ecrane
- `status` - Activează/dezactivează toate ecranele din locație

### 3. Screens (Ecrane)
```python
{
    "id": "uuid",
    "location_id": "uuid (FK -> Locations)",
    "name": "string",
    "slug": "string (unic, link scurt)",
    "resolution": "string (1920x1080, 3840x2160, etc.)",
    "orientation": "landscape|portrait",
    "template_id": "string|null (FK -> ScreenTemplates)",
    "sync_group": "uuid|null",
    "cascade_offset": "int (0 = master)",
    "status": "online|offline",
    "last_active": "datetime|null",
    "created_at": "datetime"
}
```

**Funcționalitate:**
- Reprezintă un ecran fizic din locație
- `slug` - Link scurt pentru acces (ex: "c1" → /display/c1)
- `sync_group` - Grup de sincronizare pentru multiple ecrane
- `cascade_offset` - Offset în pagini pentru afișare în cascadă
- `status` - Actualizat automat prin heartbeat API

### 4. ScreenTemplates (Template-uri Layout)
```python
{
    "id": "string",
    "name": "string",
    "description": "string",
    "thumbnail_url": "string|null",
    "zones": [
        {
            "id": "string",
            "name": "string",
            "x": "int (procent 0-100)",
            "y": "int (procent 0-100)",
            "width": "int (procent)",
            "height": "int (procent)",
            "type": "menu|promo|video|weather|custom"
        }
    ],
    "is_default": "boolean"
}
```

**Template-uri predefinite:**
1. **Full Screen** - O zonă 100% (meniu principal)
2. **Split Horizontal** - Două zone 50/50 (meniu + promo)
3. **Split Vertical** - Două zone sus/jos
4. **Sidebar** - Meniu 70% + sidebar 30%

### 5. Content (Conținut Media)
```python
{
    "id": "uuid",
    "title": "string",
    "type": "image|video",
    "file_url": "string (local /api/uploads sau extern)",
    "duration": "int (secunde, pentru imagini)",
    "category": "menu|promo|drinks|desserts|other",
    "tags": ["string"],
    "thumbnail_url": "string|null",
    "autoplay": "boolean",
    "loop": "boolean",
    "playlist_urls": ["string"],
    "created_at": "datetime"
}
```

**Funcționalitate:**
- Upload local pentru fișiere <200MB
- Link extern pentru fișiere >200MB (Google Drive, etc.)
- Thumbnail generat automat pentru imagini
- Video: suport MP4, WebM, AVI, QuickTime

### 6. Playlists (Playlist-uri)
```python
{
    "id": "uuid",
    "name": "string",
    "description": "string|null",
    "items": [
        {
            "content_id": "uuid (FK -> Content)",
            "order": "int",
            "duration_override": "int|null"
        }
    ],
    "autoplay": "boolean",
    "loop": "boolean",
    "status": "active|inactive",
    "created_at": "datetime"
}
```

**Funcționalitate:**
- Secvențe automate de imagini/video-uri
- Ordinea personalizabilă (reordonare cu ▲▼)
- Durată override per item individual

### 7. Products (Produse)
```python
{
    "id": "uuid",
    "name": "string",
    "description": "string|null",
    "price": "float",
    "currency": "string (RON, EUR, USD)",
    "category": "sushi|rolls|sashimi|tempura|soup|salad|dessert|drinks",
    "image_url": "string|null",
    "available": "boolean",
    "featured": "boolean",
    "order_index": "int",
    "created_at": "datetime"
}
```

**Funcționalitate:**
- Produse individuale din meniu
- `featured` - Produse în evidență (promoții)
- `available` - Control disponibilitate în timp real
- `order_index` - Ordinea de afișare

### 8. MenuTemplates (Template-uri Meniu)
```python
{
    "id": "string",
    "name": "string",
    "layout_type": "grid|list|carousel|fullscreen_promo",
    "products_per_page": "int (1-12)",
    "page_duration": "int (secunde)",
    "show_images": "boolean",
    "show_descriptions": "boolean",
    "background_color": "string|null",
    "text_color": "string|null",
    "accent_color": "string|null"
}
```

**Template-uri predefinite:**
- Grid Modern (6 produse/pagină)
- List Compact (8 produse/pagină, fără imagini)
- Carousel (3 produse/pagină)

### 9. DigitalMenus (Meniuri Digitale)
```python
{
    "id": "uuid",
    "name": "string",
    "template_id": "string|null (FK -> MenuTemplates)",
    "selected_products": ["uuid"],
    "selected_categories": ["string"],
    "promo_products": [
        {
            "product_id": "uuid",
            "promo_price": "float",
            "promo_text": "string"
        }
    ],
    "show_promo_slides": "boolean",
    "promo_slide_duration": "int",
    "products_per_page": "int (1-12)",
    "page_duration": "int (secunde)",
    "auto_rotate": "boolean",
    "status": "active|draft",
    "created_at": "datetime"
}
```

**Funcționalitate:**
- Grupează produse pentru afișare pe ecrane
- Selectare individuală sau pe categorii întregi
- Promoții cu prețuri speciale
- Rotație automată între pagini

### 10. ScreenZoneContent (Configurare Zone)
```python
{
    "id": "uuid",
    "screen_id": "uuid (FK -> Screens)",
    "zone_id": "string (ID zonă din template)",
    "content_type": "digital_menu|playlist|single_content|weather|custom",
    "digital_menu_id": "uuid|null",
    "playlist_id": "uuid|null",
    "content_id": "uuid|null",
    "weather_location": "string|null",
    "custom_html": "string|null"
}
```

**Funcționalitate:**
- Asociază conținut la zonele unui ecran
- O singură configurare per screen_id + zone_id
- Tipuri de conținut diferite per zonă

---

## 🔌 API Endpoints (Backend)

### Autentificare (/api/auth)

**POST /api/auth/register**
```json
Request: {
    "email": "user@example.com",
    "password": "password123",
    "full_name": "Nume Prenume"
}
Response: {
    "access_token": "jwt_token",
    "token_type": "bearer",
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "full_name": "Nume Prenume"
    }
}
```

**POST /api/auth/login**
```json
Request: {
    "email": "user@example.com",
    "password": "password123"
}
Response: {
    "access_token": "jwt_token",
    "token_type": "bearer",
    "user": {...}
}
```

**GET /api/auth/me**
- Headers: `Authorization: Bearer <token>`
- Response: User object

### Locații (/api/locations)

**GET /api/locations** - Lista toate locațiile
**POST /api/locations** - Creează locație nouă
**GET /api/locations/{id}** - Detalii locație
**PUT /api/locations/{id}** - Actualizează locație
**DELETE /api/locations/{id}** - Șterge locație

### Ecrane (/api/screens)

**GET /api/screens** - Lista toate ecranele
**POST /api/screens** - Creează ecran nou
**GET /api/screens/{id}** - Detalii ecran
**PUT /api/screens/{id}** - Actualizează ecran
**DELETE /api/screens/{id}** - Șterge ecran
**POST /api/screens/{id}/heartbeat** - Marchează ecranul ca online (public, fără auth)

### Template-uri (/api/screen-templates)

**GET /api/screen-templates** - Lista template-uri predefinite

### Conținut (/api/content)

**GET /api/content** - Lista tot conținutul
**POST /api/content/upload** - Upload fișier (multipart/form-data)
```
Form fields:
- file: UploadFile
- title: string
- type: image|video
- category: string
- duration: int
```
**POST /api/content/external** - Adaugă conținut din URL extern
**GET /api/content/{id}** - Detalii conținut
**DELETE /api/content/{id}** - Șterge conținut și fișierul asociat
**GET /api/uploads/{type}/{filename}** - Servește fișierele încărcate

### Playlist-uri (/api/playlists)

**GET /api/playlists** - Lista playlist-uri
**POST /api/playlists** - Creează playlist
**GET /api/playlists/{id}** - Detalii playlist
**PUT /api/playlists/{id}** - Actualizează playlist
**DELETE /api/playlists/{id}** - Șterge playlist

### Produse (/api/products)

**GET /api/products** - Lista produse (sortate după order_index)
**POST /api/products** - Creează produs
**POST /api/products/import-batch** - Import în masă
**GET /api/products/{id}** - Detalii produs
**PUT /api/products/{id}** - Actualizează produs
**DELETE /api/products/{id}** - Șterge produs

### Template-uri Meniu (/api/menu-templates)

**GET /api/menu-templates** - Lista template-uri predefinite

### Meniuri Digitale (/api/digital-menus)

**GET /api/digital-menus** - Lista meniuri
**POST /api/digital-menus** - Creează meniu digital
**GET /api/digital-menus/{id}** - Detalii meniu
**PUT /api/digital-menus/{id}** - Actualizează meniu
**DELETE /api/digital-menus/{id}** - Șterge meniu

### Zone Ecran (/api/screen-zones)

**GET /api/screen-zones/{screen_id}** - Configurări zone pentru ecran
**POST /api/screen-zones** - Salvează configurare zonă (șterge veche, inserează nouă)
**DELETE /api/screen-zones/{zone_id}** - Șterge configurare zonă

### Sincronizare (/api/screen-sync)

**POST /api/screen-sync**
```json
Request: {
    "screen_ids": ["uuid1", "uuid2", "uuid3"],
    "sync_type": "simple|cascade",
    "master_screen_id": "uuid"
}
Response: {
    "message": "Screens synchronized",
    "sync_group": "uuid"
}
```

**Sincronizare simplă:**
- Toate ecranele afișează același conținut simultan
- `cascade_offset = 0` pentru toate

**Sincronizare cascadă:**
- Fiecare ecran afișează o pagină diferită
- Master: offset=0, Ecran 2: offset=1, Ecran 3: offset=2, etc.

### Display Public (/api/display)

**GET /api/display/{slug}?security_code={code}** (PUBLIC, fără auth)
```json
Response: {
    "screen": {...},
    "template": {...},
    "zones_config": [
        {
            "zone_id": "zone1",
            "content_type": "digital_menu",
            "digital_menu": {
                "name": "Meniu Principal",
                "products": [...],
                "products_per_page": 6,
                "page_duration": 10
            }
        }
    ]
}
```

**Funcționalitate:**
- Endpoint public pentru afișare pe TV
- Verifică security_code dacă locația are cod setat
- Returnează toate datele necesare pentru rendering
- Include produse expand-uite pentru meniuri digitale

### Dashboard Stats (/api/dashboard/stats)

**GET /api/dashboard/stats**
```json
Response: {
    "locations": 5,
    "screens": 12,
    "online_screens": 8,
    "products": 45,
    "content": 23
}
```

---

## 🎨 Design System - Glassmorphism "Frosted Sushi"

### Paleta de Culori

**Primary Colors:**
- Indigo 600 (`#4F46E5`) - Butoane principale, accente
- Indigo 700 (`#4338CA`) - Hover states
- Slate 800 (`#1E293B`) - Text principal
- Slate 600 (`#475569`) - Text secundar
- Slate 500 (`#64748B`) - Text teritiary

**Backgrounds:**
- Base: `linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, #E9D5FF 100%)` (opacity 50%)
- Glass panels: `bg-white/60 backdrop-blur-xl border-white/40`
- Glass cards: `bg-white/40 backdrop-blur-xl border-white/60`

**Status Colors:**
- Online: `bg-emerald-100/50 text-emerald-700 border-emerald-200`
- Offline: `bg-slate-100/50 text-slate-600 border-slate-200`
- Active: `bg-indigo-100/50 text-indigo-700 border-indigo-200`

### Typography

**Fonts:**
- Headings (h1-h6): Outfit (300, 400, 500, 600, 700)
- Body text: Manrope (400, 500, 600)
- Code/monospace: System fonts

**Sizes:**
- H1: `text-4xl md:text-5xl` (36px-48px)
- H2: `text-3xl` (30px)
- H3: `text-xl` (20px)
- Body: `text-base` (16px)
- Small: `text-sm` (14px)
- Tiny: `text-xs` (12px)

### Componente UI

**Butoane:**
```css
.btn-primary {
    @apply rounded-full bg-indigo-600 text-white 
           hover:bg-indigo-700 shadow-lg shadow-indigo-200 
           transition-transform hover:scale-105 active:scale-95 
           px-6 py-2.5 font-medium;
}

.btn-secondary {
    @apply rounded-full bg-white/50 text-slate-700 
           border border-white/60 hover:bg-white/80 
           backdrop-blur-sm px-6 py-2.5 font-medium 
           transition-all duration-300;
}
```

**Cards:**
```css
.glass-card {
    @apply rounded-3xl bg-white/40 backdrop-blur-xl 
           border border-white/60 
           shadow-[0_8px_30px_rgb(0,0,0,0.04)] 
           transition-all duration-300;
}

.glass-card:hover {
    @apply shadow-[0_12px_40px_rgb(0,0,0,0.08)] -translate-y-1;
}
```

**Inputs:**
```css
.glass-input {
    @apply rounded-xl bg-white/50 border-white/60 
           focus:bg-white/80 focus:ring-2 focus:ring-indigo-200 
           transition-all placeholder:text-slate-400;
}
```

**Dialogs:**
- Background: `bg-white/70 backdrop-blur-xl`
- Border: `border-white/60`
- Shadow: `shadow-[0_8px_30px_rgb(0,0,0,0.08)]`
- Border radius: `rounded-3xl`
- Padding: `p-8`

### Animații

**Entrance animations:**
```css
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(1rem);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-in {
    animation: fadeIn 0.5s ease-out;
}
```

**Transitions:**
- Buttons: `transition-transform hover:scale-105`
- Cards: `transition-all duration-300`
- Hover: `hover:-translate-y-1`

---

## 🧭 Structura Frontend (React)

### Componente Principale

**1. App.js** - Routing principal
```jsx
<AuthProvider>
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/display/:slug" element={<DisplayScreen />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      // ... alte rute protejate
    </Routes>
    <Toaster />
  </BrowserRouter>
</AuthProvider>
```

**2. AuthContext.js** - Context pentru autentificare
```javascript
const AuthContext = createContext(null);

Funcții:
- login(email, password)
- register(email, password, full_name)
- logout()
- user state
- loading state
```

**3. DashboardLayout.js** - Layout cu sidebar
```jsx
Componente:
- Sidebar fix (w-64) cu glassmorphism
- Logo și branding
- Meniu navigare (9 pagini)
- User info panel
- Logout button
- Main content area (ml-64)
```

### Pagini

**1. Login** (`/login`)
- Form autentificare/înregistrare
- Toggle între login și register
- Design glassmorphism centrat
- Validare și error handling

**2. Dashboard** (`/dashboard`)
- Statistici overview (5 cards)
- Ghid rapid utilizare (4 pași)
- Funcționalități cheie (5 bullets)

**3. Locations** (`/locations`)
- CRUD complet pentru locații
- Grid layout cu cards
- Dialog pentru create/edit
- Security code opțional

**4. Screens** (`/screens`)
- CRUD complet pentru ecrane
- Status online/offline cu badge
- Link direct cu QR code generator
- Buton "Design" pentru configurare zone
- Link generator cu TinyURL

**5. ScreenDesigner** (`/screens/:id/design`)
- Selectare template ecran
- Preview vizual al zonelor
- Configurare conținut per zonă
- Dropdown-uri pentru meniuri/playlists/content

**6. Content** (`/content`)
- Upload fișiere (drag & drop)
- Tab-uri: Toate / Imagini / Video-uri
- Preview modal cu video player
- Thumbnail real pentru video-uri
- Support pentru link-uri externe

**7. Products** (`/products`)
- CRUD complet pentru produse
- Grid layout cu imagini
- Import batch din SushiMaster
- Filtre pe categorii
- Featured/Available toggles

**8. DigitalMenus** (`/digital-menus`)
- Creare meniuri digitale
- Selectare produse (checkboxes)
- Configurare rotație și durată
- Preview număr produse selectate

**9. Playlists** (`/playlists`)
- Creare playlist-uri
- Dual panel: Available content | Playlist items
- Reordonare cu ▲▼
- Autoplay și loop settings

**10. ScreenSync** (`/screen-sync`)
- Selectare multiple ecrane (checkboxes)
- Alegere master screen
- Tip sincronizare: Simple vs Cascade
- Preview configurare înainte de sync

**11. DisplayScreen** (`/display/:slug`)
- Fullscreen display pentru TV
- Heartbeat automat la 30 secunde
- Security code input dacă necesar
- Rendering zone bazat pe template
- Auto-rotație pentru meniuri digitale
- Video autoplay cu loop

---

## 🔐 Securitate și Autentificare

### JWT Authentication

**Token generation:**
```python
SECRET_KEY = os.environ.get("SECRET_KEY", "default-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 zile

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

**Token verification:**
- Interceptor axios pe frontend
- HTTPBearer dependency pe backend
- Auto-redirect la /login pe 401 errors
- Token stocat în localStorage

### Password Hashing

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

### Screen Security

- Locațiile pot avea `security_code` opțional
- La acces `/display/{slug}`, se verifică codul
- Codul se salvează local în browser
- Error 403 dacă codul e greșit

---

## 📁 Structura Directoare

```
/app/
├── backend/
│   ├── server.py              # FastAPI application
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables
│   └── uploads/               # Uploaded files
│       ├── images/
│       └── videos/
├── frontend/
│   ├── public/
│   │   └── index.html         # HTML template
│   ├── src/
│   │   ├── App.js             # Main component
│   │   ├── App.css            # Custom styles
│   │   ├── index.js           # Entry point
│   │   ├── index.css          # Global styles + Tailwind
│   │   ├── components/
│   │   │   ├── ui/            # Shadcn components
│   │   │   ├── DashboardLayout.js
│   │   │   └── ProtectedRoute.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Locations.js
│   │   │   ├── Screens.js
│   │   │   ├── ScreenDesigner.js
│   │   │   ├── Content.js
│   │   │   ├── Products.js
│   │   │   ├── DigitalMenus.js
│   │   │   ├── Playlists.js
│   │   │   ├── ScreenSync.js
│   │   │   └── DisplayScreen.js
│   │   └── utils/
│   │       └── api.js         # Axios configuration
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env
└── test_reports/              # Testing results
```

---

## 🔄 Flow-uri Principale

### Flow 1: Setup Inițial

1. **Register/Login**
   - User creează cont sau se autentifică
   - Token JWT salvat în localStorage
   - Redirect la /dashboard

2. **Creează Locație**
   - POST /api/locations
   - Nume, adresă, oraș, cod securitate (opțional)

3. **Adaugă Produse**
   - Opțiune A: Import batch din SushiMaster
   - Opțiune B: Adaugă manual produse individuale
   - Produse cu nume, preț, categorie, imagine

4. **Creează Meniu Digital**
   - POST /api/digital-menus
   - Selectează produse (individual sau pe categorii)
   - Configurează: produse/pagină, durată pagină

5. **Creează Ecran**
   - POST /api/screens
   - Asociază cu locație
   - Slug scurt (ex: "c1")
   - Selectează template (Full Screen, Split, etc.)

6. **Design Ecran**
   - Configurează zonele din template
   - Asociază meniu digital la zona principală
   - Salvează configurația

7. **Accesează pe TV**
   - Click "Link TV" pe ecran
   - Copiază link scurt (TinyURL) sau scanează QR
   - Deschide pe TV
   - F11 pentru fullscreen

### Flow 2: Upload Conținut Media

**Fișiere Mici (<200MB):**
1. Du-te la "Conținut"
2. Click "Adaugă conținut"
3. Tab "Upload Fișier"
4. Selectează fișier local
5. Completează titlu, categorie, durată
6. Upload automat → salvat în `/backend/uploads/`

**Fișiere Mari (>200MB):**
1. Încarcă pe Google Drive/OneDrive
2. Obține link public
3. Tab "Link Extern"
4. Lipește URL-ul
5. Salvează → stocat doar URL-ul în DB

### Flow 3: Sincronizare Ecrane

**Sincronizare Simplă:**
1. Du-te la "Sincronizare"
2. Selectează 2+ ecrane (checkboxes)
3. Alege master screen
4. Tip: "Sincronizare simplă"
5. Click "Sincronizează ecranele"
6. Rezultat: Toate ecranele afișează același conținut

**Sincronizare Cascadă:**
1. Selectează 3+ ecrane
2. Alege master (primul ecran)
3. Tip: "Mod cascadă"
4. Click "Sincronizează"
5. Rezultat:
   - Master: Pagina 1-2-3-4...
   - Ecran 2: Pagina 2-3-4-5...
   - Ecran 3: Pagina 3-4-5-6...

### Flow 4: Afișare Live pe TV

**Pentru operator:**
1. Configurează ecranul complet
2. Click "Link TV"
3. Copiază link scurt sau scanează QR
4. Trimite link la TV (email, WhatsApp, etc.)

**Pe TV:**
1. Deschide browser (Chrome, Firefox, Safari)
2. Introdu link-ul scurt (ex: tinyurl.com/xyz123)
3. Dacă locația are cod: introdu security_code
4. Apasă F11 pentru fullscreen
5. Conținutul pornește automat
6. Heartbeat trimis automat la 30s (status = online)

**Comportament:**
- Digital Menu: Rotație automată între pagini
- Playlist: Redare secvențială cu durate configurate
- Single Content: Afișare statică (imagine) sau video loop

---

## ⚙️ Configurare Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=sushimaster_tv
SECRET_KEY=your-secret-key-change-in-production
CORS_ORIGINS=*
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://your-domain.com
```

**IMPORTANT:**
- Nu hardcoda URL-uri în cod
- Folosește întotdeauna variabile de mediu
- Backend: `os.environ['MONGO_URL']`
- Frontend: `process.env.REACT_APP_BACKEND_URL`

---

## 🚀 Deployment și Build

### Development

**Backend:**
```bash
cd /app/backend
pip install -r requirements.txt
# Server pornit automat de supervisor pe 0.0.0.0:8001
```

**Frontend:**
```bash
cd /app/frontend
yarn install
# Dev server pornit automat de supervisor pe :3000
```

**Supervisor:**
```bash
sudo supervisorctl status
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

### Production Build

**Frontend:**
```bash
cd /app/frontend
yarn build
# Build output în /app/frontend/build/
```

**Backend:**
- Rulează cu Uvicorn
- Configurare CORS pentru domeniul production
- SECRET_KEY securizat
- Rate limiting recomandat

---

## 📊 Integrări Externe

### 1. TinyURL API
**Endpoint:** `https://tinyurl.com/api-create.php`
**Fallback:** `https://is.gd/create.php`

**Utilizare:**
```javascript
const response = await fetch(
    `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`
);
const shortUrl = await response.text();
```

**Scop:** Generare link-uri scurte pentru TV

### 2. QR Server API
**Endpoint:** `https://api.qrserver.com/v1/create-qr-code/`

**Utilizare:**
```javascript
const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
```

**Scop:** Generare QR codes pentru scanare cu telefon

### 3. Unsplash Images
**CDN:** `storage.cdneu.syrve.com` (SushiMaster original)

**Utilizare:** 
- Imagini produse importate din CSV
- URL-uri externe (nu necesită API key)

---

## 🧪 Testing și Validare

### Backend Testing

**Health check:**
```bash
curl -X GET "$API_URL/api/dashboard/stats" -H "Authorization: Bearer $TOKEN"
```

**Auth test:**
```bash
curl -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"pass123"}'
```

**Upload test:**
```bash
curl -X POST "$API_URL/api/content/upload" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@/path/to/file.jpg" \
    -F "title=Test" \
    -F "type=image" \
    -F "category=menu"
```

### Frontend Testing

**Playwright test structure:**
- Login flow test
- CRUD operations test
- File upload test
- Screen configuration test
- Display rendering test

---

## 📐 Business Logic și Reguli

### Validări

**1. Slug unic:**
- Verificare la crearea ecranului
- Error 400 dacă slug există deja
- Recomandare: 2-3 caractere (c1, tv1, s2)

**2. Security code:**
- Opțional pe locație
- Dacă există: cerut la /display/{slug}
- Salvat în localStorage după validare

**3. Screen status:**
- Automat "offline" la creare
- Devine "online" la primul heartbeat
- Heartbeat la 30 secunde
- "offline" dacă > 2 minute fără heartbeat

**4. File upload:**
- Max 500MB server-side
- Timeout 5 minute pentru upload
- Chunk-based upload (1MB chunks)
- Validare tip fișier (MIME type)

**5. Sincronizare:**
- Minimum 2 ecrane pentru sync
- Master screen obligatoriu
- Toate ecranele primesc același template_id
- Zone configuration copiată de la master

### Calcule și Algoritmi

**Paginare meniu digital:**
```python
total_products = len(menu.selected_products)
products_per_page = menu.products_per_page
total_pages = ceil(total_products / products_per_page)

# Pentru cascadă:
displayed_page = (base_page + screen.cascade_offset) % total_pages
```

**Rotație automată:**
```javascript
useEffect(() => {
    const interval = setInterval(() => {
        setCurrentPage(prev => (prev + 1) % totalPages);
    }, menu.page_duration * 1000);
    return () => clearInterval(interval);
}, [totalPages, menu.page_duration]);
```

---

## 🐛 Troubleshooting

### Ecranul nu apare Online

**Cauze posibile:**
1. URL greșit → Verifică slug-ul
2. Network error → Verifică conexiunea
3. Heartbeat failed → Verifică endpoint /api/screens/{id}/heartbeat

**Soluție:**
- Reîmprospătează pagina (F5)
- Verifică console pentru errors
- Testează heartbeat manual cu curl

### Video-urile nu pornesc automat

**Cauze:**
1. Browser blochează autoplay
2. Video fără attribut `muted`
3. CORS issues pentru link-uri externe

**Soluție:**
- Click oriunde pe ecran pentru user interaction
- Adaugă `muted` și `playsInline` la video element
- Folosește link-uri cu CORS headers corecte

### Upload eșuează

**Cauze:**
1. Fișier > 500MB
2. Tip fișier invalid
3. Timeout

**Soluție:**
- Pentru >200MB: Folosește "Link Extern"
- Verifică format: MP4, PNG, JPG, WebM
- Crește timeout în axios config

### Sincronizarea nu funcționează

**Verificări:**
1. Toate ecranele au același `sync_group`
2. Master are `cascade_offset = 0`
3. Toate ecranele sunt online
4. Template și zone sunt identice

---

## 💡 Best Practices

### Performance

1. **Imagini:**
   - Rezoluție: 1920x1080px (Full HD)
   - Format: JPG (compress), PNG (transparency)
   - Mărime: <5MB per imagine
   - Durată: 10-15 secunde per slide

2. **Video-uri:**
   - Rezoluție: 1920x1080px sau 4K
   - Format: MP4 (H.264 codec)
   - <200MB: Upload direct
   - >200MB: Link extern (Google Drive recommended)

3. **Meniuri digitale:**
   - 6 produse per pagină (optimal)
   - 10 secunde per pagină
   - Max 18-24 produse total (3-4 pagini)

4. **Database queries:**
   - Excludere `_id` în toate query-urile
   - Limit 1000 pentru liste
   - Indexare pe: email, slug, location_id, screen_id

### Organizare

1. **Denumiri:**
   - Locații: "SushiMaster Centru", "SushiMaster Nord"
   - Ecrane: "Ecran 1 - Zona Principală"
   - Slug: scurt și memorabil ("c1", "nord1")

2. **Categorii content:**
   - menu (conținut meniu)
   - promo (promoții și oferte)
   - drinks (băuturi)
   - desserts (deserturi)
   - other (altele)

3. **Categorii produse:**
   - sushi (nigiri, sashimi)
   - rolls (california, philadelphia, etc.)
   - tempura (rolls prăjite)
   - soup (supe)
   - salad (salate, poke bowls)
   - dessert (deserturi)
   - drinks (băuturi)

---

## 🔧 Configurare Completă pas cu pas

### Pas 1: Setup Backend

1. **Instalare dependințe:**
```bash
pip install fastapi uvicorn motor pydantic python-jose passlib bcrypt python-multipart pillow
```

2. **Creare .env:**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=sushimaster_tv
SECRET_KEY=generate-random-key-here
```

3. **Pornire server:**
```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Pas 2: Setup Frontend

1. **Instalare dependințe:**
```bash
yarn add react-router-dom axios sonner lucide-react
```

2. **Configurare Tailwind:**
```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
      },
      backdropBlur: {
        'xl': '24px',
      }
    },
  },
  plugins: [],
}
```

3. **Creare .env:**
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

4. **Pornire dev server:**
```bash
yarn start
```

### Pas 3: Configurare Inițială

1. **Creează primul user:**
```bash
curl -X POST "http://localhost:8001/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "admin@sushimaster.ro",
        "password": "admin123",
        "full_name": "Administrator"
    }'
```

2. **Import produse SushiMaster:**
- Login în aplicație
- Du-te la "Produse"
- Click "Import SushiMaster"
- Click "Importă Produse"
- → 30+ produse cu poze reale importate

3. **Creează primul ecran:**
- Du-te la "Locații" → Adaugă locație
- Du-te la "Ecrane" → Adaugă ecran (slug: "c1")
- Du-te la "Meniuri Digitale" → Creează meniu (selectează produse)
- Click "Design" pe ecran → Asociază meniul la zona principală
- Salvează

4. **Testează:**
- Click "Link TV" pe ecran
- Copiază link-ul scurt
- Deschide în browser
- Verifică că meniul se afișează corect

---

## 📱 Integrare cu dispozitive

### Smart TV

**Browser-e compatibile:**
- Chrome (Android TV)
- Firefox
- Safari (Apple TV)
- Edge (Xbox)

**Setări recomandate:**
- Fullscreen: F11 sau buton fullscreen
- Disable screensaver
- Auto-refresh: Nu (pentru video continuous)
- Hardware acceleration: Enabled

### Tablet/iPad

**Utilizare ca ecran secundar:**
1. Deschide link-ul în Safari/Chrome
2. "Add to Home Screen"
3. Lansează ca app fullscreen
4. Montează tablet-ul pe perete

### Raspberry Pi

**Setup:**
```bash
# Install Chromium
sudo apt-get install chromium-browser

# Auto-start in kiosk mode
chromium-browser --kiosk --app=https://domain.com/display/c1
```

---

## 🔮 Extensii Viitoare (Recomandări)

### Analytics
- Tracking vizualizări pe ecran
- Statistici produse cele mai afișate
- Durata medie sesiune per ecran
- Heatmap pentru interacțiuni (dacă touch screen)

### Programare
- Schedule conținut pe intervale orare
- Meniuri diferite: breakfast, lunch, dinner
- Promoții automate pe zile specifice

### Multi-tenant
- Suport pentru multiple restaurante independente
- Izolare date per tenant
- Billing și subscripții

### Advanced Features
- Integrare POS pentru prețuri live
- Stoc live (indisponibil dacă out of stock)
- Recommendation engine (produse populare)
- A/B testing pentru layout-uri

### Notificări
- Email alert când ecran devine offline
- Notificare când content expiră
- Reminder pentru actualizare meniu

---

## 📞 Support și Mentenanță

### Backup

**MongoDB backup:**
```bash
mongodump --uri="$MONGO_URL" --db=$DB_NAME --out=/backup/$(date +%Y%m%d)
```

**Files backup:**
```bash
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /app/backend/uploads/
```

**Recovery:**
```bash
mongorestore --uri="$MONGO_URL" --db=$DB_NAME /backup/20260114/
```

### Logs

**Backend logs:**
```bash
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/backend.out.log
```

**Frontend logs:**
```bash
tail -f /var/log/supervisor/frontend.err.log
```

### Monitoring

**Verificare ecrane online:**
```bash
curl -X GET "$API_URL/api/screens" -H "Authorization: Bearer $TOKEN" | jq '.[] | select(.status=="online") | .name'
```

**Statistici:**
```bash
curl -X GET "$API_URL/api/dashboard/stats" -H "Authorization: Bearer $TOKEN"
```

---

## 🎯 Cazuri de Utilizare Reale

### Restaurant cu 1 ecran
- 1 Locație
- 1 Ecran (Full Screen template)
- 1 Meniu Digital cu 18 produse
- Rotație automată: 6 produse/pagină, 10s/pagină

### Restaurant cu 3 ecrane sincronizate
- 1 Locație
- 3 Ecrane (sync în cascadă)
- 1 Meniu Digital cu 15 produse
- Fiecare ecran afișează pagină diferită

### Restaurant cu zone multiple
- 1 Locație
- 1 Ecran (Split Horizontal template)
- Zona 1 (70%): Meniu digital rotativ
- Zona 2 (30%): Playlist promoții video

### Lanț cu 5 locații
- 5 Locații în orașe diferite
- 15 Ecrane total (3 per locație)
- Meniuri diferite per locație
- Content partajat în bibliotecă centrală

---

## 🔒 Securitate

### Best Practices Implementate

1. **Password Security:**
   - Bcrypt hashing (cost factor implicit)
   - Nu se stochează parole plain text
   - Token expiration (7 zile)

2. **JWT Security:**
   - Secret key din environment
   - Algorithm: HS256
   - Expiration verificată pe fiecare request

3. **CORS:**
   - Configured pentru domeniul production
   - Credentials allowed
   - Methods: GET, POST, PUT, DELETE

4. **File Upload Security:**
   - Validare MIME type
   - Unique filename cu UUID
   - Size limit (500MB)
   - Separate directories pentru images/videos

5. **MongoDB:**
   - Excludere `_id` în toate response-urile
   - Parametrizare queries (nu string concatenation)
   - Connection pooling prin motor

### Recomandări Adiționale

1. **Rate Limiting:**
```python
from slowapi import Limiter
limiter = Limiter(key_func=lambda: request.client.host)

@app.post("/api/auth/login")
@limiter.limit("5/minute")
async def login(...):
```

2. **HTTPS:**
- Mandatory pentru production
- Let's Encrypt pentru SSL gratuit
- Redirect HTTP → HTTPS

3. **Input Sanitization:**
- Validare Pydantic models
- Escape HTML în custom_html fields
- URL validation pentru external links

---

## 📚 Dependencies Complete List

### Backend (requirements.txt)
```
fastapi>=0.104.1
uvicorn>=0.24.0
motor>=3.3.2
pydantic>=2.5.0
pydantic-settings>=2.1.0
python-dotenv>=1.0.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart>=0.0.6
pillow>=10.1.0
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.2",
    "lucide-react": "^0.294.0",
    "sonner": "^1.2.3",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4"
  },
  "devDependencies": {
    "tailwindcss": "^3.3.6",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

---

## 🎓 Concepte Cheie

### Separarea Responsabilităților

1. **Products** = Date brute (nume, preț, imagine)
2. **DigitalMenus** = Grupare și configurare afișare
3. **ScreenZoneContent** = Asociere la ecrane fizice
4. **DisplayScreen** = Rendering și prezentare

### Flow-ul datelor

```
User creates Products
    ↓
User creates DigitalMenu (selectează Products)
    ↓
User configures Screen with ScreenZoneContent
    ↓
ScreenZoneContent references DigitalMenu
    ↓
/api/display/{slug} expand-ează toate relațiile
    ↓
DisplayScreen component renderează pe TV
```

### Sincronizare vs Zone

**Zone diferite = Conținut diferit pe același ecran**
- Exemplu: Meniu stânga + Video dreapta

**Sincronizare = Același layout pe ecrane diferite**
- Simple: Conținut identic
- Cascadă: Conținut offsetat (pagini diferite)

---

## 🚦 Status și Monitoring

### Screen Status Flow

```
Screen created → status: "offline"
    ↓
User opens /display/{slug}
    ↓
Heartbeat POST /api/screens/{id}/heartbeat every 30s
    ↓
status: "online", last_active: now()
    ↓
No heartbeat for 2+ minutes
    ↓
status: "offline" (manual or cron job)
```

### Health Endpoints

**Dashboard stats:**
- Endpoint: GET /api/dashboard/stats
- Auth: Required
- Cache: None (real-time counts)

**Screen heartbeat:**
- Endpoint: POST /api/screens/{id}/heartbeat
- Auth: Not required (public)
- Side effect: Updates status and last_active

---

## 🎨 Design Tokens

### Spacing
- xs: 0.5rem (8px)
- sm: 0.75rem (12px)
- base: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)

### Border Radius
- sm: 0.5rem (8px)
- base: 0.75rem (12px)
- lg: 1rem (16px)
- xl: 1.5rem (24px)
- 2xl: 2rem (32px)
- 3xl: 3rem (48px) - Used for cards

### Shadows
- sm: `0 1px 2px rgb(0 0 0 / 0.05)`
- base: `0 8px 30px rgb(0 0 0 / 0.04)` - Glass cards
- lg: `0 12px 40px rgb(0 0 0 / 0.08)` - Hover state
- indigo: `shadow-indigo-200` - Primary buttons

### Backdrop Blur
- sm: 12px
- base: 16px
- xl: 24px - Main glassmorphism effect

---

## 📖 Glosar Termeni

**Slug** - Identificator scurt pentru URL-uri (ex: "c1", "tv1")

**Zone** - Arii rectangulare pe un ecran, fiecare cu conținut propriu

**Template** - Layout predefinit cu zone configurate

**Heartbeat** - Ping periodic pentru a marca ecranul ca online

**Cascade** - Mod sincronizare unde fiecare ecran afișează pagină diferită

**Sync Group** - Grup de ecrane sincronizate cu același conținut

**Digital Menu** - Colecție de produse configurată pentru afișare

**Playlist** - Secvență de imagini/video-uri cu ordine definită

**Featured** - Produs marcat ca important (promoție, popular)

**Content Type** - Tip de conținut asociat unei zone (menu, playlist, etc.)

---

## 🎬 Checklist Lansare

### Pre-production

- [ ] Schimbă SECRET_KEY în backend/.env
- [ ] Configurează CORS_ORIGINS cu domeniul real
- [ ] Setează REACT_APP_BACKEND_URL cu domeniul production
- [ ] Build frontend: `yarn build`
- [ ] Test upload video mare
- [ ] Test toate CRUD operations
- [ ] Test sincronizare ecrane
- [ ] Test display pe TV real

### Production

- [ ] Setup MongoDB cu replica set
- [ ] Configurează backup automat (daily)
- [ ] Activează HTTPS
- [ ] Setup monitoring (Uptime robot)
- [ ] Configurează rate limiting
- [ ] Documentație utilizator
- [ ] Training pentru staff

### Post-launch

- [ ] Monitor logs pentru errors
- [ ] Track screen uptime
- [ ] Colectează feedback utilizatori
- [ ] Planifică updates și features noi

---

## 📞 Întrebări Frecvente (FAQ)

**Q: Pot folosi același meniu pe multiple ecrane?**
A: Da! Creezi un meniu digital o singură dată și îl asociezi la oricâte ecrane dorești.

**Q: Cum schimb un preț rapid?**
A: Produse → Click Edit pe produs → Schimbă prețul → Salvează. Toate ecranele care afișează acel produs se vor actualiza automat.

**Q: Pot programa meniuri diferite pentru ore diferite?**
A: Momentan nu, dar se poate adăuga. Trebuie implementat scheduler cu time-based rules.

**Q: Funcționează offline?**
A: Nu. Ecranele necesită conexiune internet pentru a încărca conținut și pentru heartbeat.

**Q: Pot restricționa accesul la anumite pagini?**
A: Da, prin roles (necesită extindere). Momentan toți userii autentificați au acces complet.

**Q: Câte ecrane pot sincroniza simultan?**
A: Teoretic nelimitat. Practic, recomandat max 10 ecrane per sync group pentru performance.

---

## 🛠️ Comenzi Utile

### Development

```bash
# Restart services
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# Check status
sudo supervisorctl status

# View logs
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/frontend.out.log

# MongoDB shell
mongosh $MONGO_URL

# Clear cache
rm -rf /app/frontend/node_modules/.cache
```

### Database Operations

```bash
# Count documents
mongosh $MONGO_URL --eval "db.products.countDocuments()"

# Find all screens
mongosh $MONGO_URL --eval "db.screens.find({}, {_id:0, name:1, status:1})"

# Update all prices by 10%
mongosh $MONGO_URL --eval "db.products.updateMany({}, {$mul: {price: 1.1}})"

# Delete old content
mongosh $MONGO_URL --eval "db.content.deleteMany({created_at: {$lt: ISODate('2025-01-01')}})"
```

### Testing

```bash
# Backend health
curl http://localhost:8001/api/dashboard/stats

# Login test
curl -X POST http://localhost:8001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@test.com","password":"pass123"}'

# Screen heartbeat test
curl -X POST http://localhost:8001/api/screens/{screen_id}/heartbeat
```

---

## 📊 Metrici de Success

### Performance Targets

- **API Response Time:** <200ms pentru GET requests
- **Upload Time:** <30s pentru fișiere <100MB
- **Screen Load Time:** <3s pentru /display/{slug}
- **Heartbeat Interval:** 30s (2% overhead)
- **Page Transition:** <300ms smooth animation

### Capacity Planning

- **Screens per location:** Avg 3-5, Max 20
- **Products per menu:** Avg 12-18, Max 50
- **Content files:** Avg 20-30, Storage 5-10GB
- **Concurrent screens:** 100+ (tested)
- **Database size:** ~500MB per 100 locations

---

## 🏆 Funcționalități Cheie Finale

1. ✅ Management Multi-Locații
2. ✅ Template-uri Personalizabile
3. ✅ Meniuri Digitale cu Rotație
4. ✅ Upload Media (imagini + video-uri)
5. ✅ Playlist-uri Video
6. ✅ Sincronizare Ecrane (Simple + Cascadă)
7. ✅ Acces Securizat (cod protecție)
8. ✅ Live Preview pe ecrane
9. ✅ Link-uri Scurte pentru TV (TinyURL)
10. ✅ QR Codes pentru acces rapid
11. ✅ Import Produse SushiMaster (30+ produse)
12. ✅ Heartbeat Automat (status online)
13. ✅ Design Glassmorphism macOS Tahoe
14. ✅ Toate produsele EDITABILE

---

**Versiune document:** 1.0  
**Data:** 14 Ianuarie 2026  
**Autor:** Documentație Tehnică SushiMaster TV
