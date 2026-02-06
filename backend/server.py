import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
from jose import JWTError, jwt
import shutil
from PIL import Image

from db import (
    init_db,
    close_db,
    user_get_by_email,
    user_insert,
    user_update_last_login,
    users_count,
    users_list,
    invitation_get_by_code,
    invitation_insert,
    invitation_increment_uses,
    invitations_list,
    invitation_deactivate,
    location_get,
    locations_list,
    location_insert,
    location_update,
    location_delete,
    locations_count,
    screen_get,
    screen_get_by_slug,
    screens_list,
    screen_exists_by_slug,
    screen_insert,
    screen_update,
    screen_update_sync,
    screen_update_heartbeat,
    screen_delete,
    screens_count,
    screens_count_online,
    screen_zones_list,
    screen_zones_delete_by_screen_and_zone,
    screen_zone_insert,
    screen_zone_delete,
    screen_zones_delete_by_screen,
    content_get,
    content_list,
    content_insert,
    content_delete,
    content_count,
    playlist_get,
    playlists_list,
    playlist_insert,
    playlist_update,
    playlist_delete,
    product_get,
    product_get_by_name,
    products_list,
    products_by_category,
    product_insert,
    product_update,
    product_upsert_by_name,
    product_delete,
    products_count,
    digital_menu_get,
    digital_menus_list,
    digital_menu_insert,
    digital_menu_update,
    digital_menu_delete,
    screens_by_sync_group,
    sync_groups_list,
    sync_groups_list,
    sync_group_delete,
    password_reset_create,
    password_reset_get,
    password_reset_delete,
    user_update_password,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# JWT settings
SECRET_KEY = os.environ.get("SECRET_KEY", "sushimaster-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Email settings
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "noreply@sushimaster.ro")

# Security
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await asyncio.wait_for(init_db(), timeout=20.0)
    except asyncio.TimeoutError:
        logging.getLogger("uvicorn.error").error(
            "Conectare la Supabase expirată. Posibil IPv4: folosește Session Pooler în Connect (Supabase)."
        )
        raise
    yield
    await close_db()


# Create the main app with increased file size limit
app = FastAPI(lifespan=lifespan)

# Increase max request body size to 500MB for video uploads
app.router.route_class = type('CustomRoute', (app.router.route_class,), {
})

# Get CORS origins from environment
cors_origins_env = os.getenv("CORS_ORIGINS", "")
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
]
if cors_origins_env:
    # Handle both comma-separated and space-separated origins
    # Strip whitespace and trailing slashes to be more robust
    extra_origins = [o.strip().rstrip("/") for o in cors_origins_env.replace(",", " ").split() if o.strip()]
    allowed_origins.extend(extra_origins)
else:
    # Fallback to wildcard ONLY if no origins are specified in env
    allowed_origins.append("*")

print(f"DEBUG: Allowed CORS origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Ensure upload directories exist
UPLOAD_DIR = ROOT_DIR / "uploads"
IMAGES_DIR = UPLOAD_DIR / "images"
VIDEOS_DIR = UPLOAD_DIR / "videos"
for dir in [UPLOAD_DIR, IMAGES_DIR, VIDEOS_DIR]:
    dir.mkdir(exist_ok=True)

# Mount static files
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
async def health_check():
    return {"status": "ok", "message": "SushiMaster TV API is running"}

# ============ MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    hashed_password: str
    is_super_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None

class InvitationLink(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    created_by: str  # User ID
    expires_at: datetime
    max_uses: int = 1
    uses: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InvitationCreate(BaseModel):
    expires_in_days: int = 7
    max_uses: int = 1

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    invitation_code: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    is_super_admin: bool = False
    last_login: Optional[datetime] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class Location(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    city: str
    status: str = "active"  # active, inactive
    timezone: str = "Europe/Bucharest"
    security_code: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LocationCreate(BaseModel):
    name: str
    address: str
    city: str
    status: Optional[str] = "active"
    timezone: Optional[str] = "Europe/Bucharest"
    security_code: Optional[str] = None

class Screen(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location_id: str
    name: str
    slug: str
    resolution: str = "1920x1080"
    orientation: str = "landscape"  # landscape, portrait
    template_id: Optional[str] = None
    sync_group: Optional[str] = None
    cascade_offset: int = 0
    status: str = "offline"  # online, offline
    last_active: Optional[datetime] = None
    parallax_enabled: bool = False
    steam_enabled: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ScreenCreate(BaseModel):
    location_id: str
    name: str
    slug: str
    resolution: Optional[str] = "1920x1080"
    orientation: Optional[str] = "landscape"
    template_id: Optional[str] = None
    parallax_enabled: Optional[bool] = False
    steam_enabled: Optional[bool] = False

class ScreenTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    thumbnail_url: Optional[str] = None
    zones: List[Dict[str, Any]]  # [{id, name, x, y, width, height, type}]
    is_default: bool = False

class Content(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    type: str  # image, video
    file_url: str
    duration: int = 10  # seconds
    category: str = "other"  # menu, promo, drinks, desserts, other
    tags: List[str] = []
    thumbnail_url: Optional[str] = None
    autoplay: bool = True
    loop: bool = True
    playlist_urls: List[str] = []  # For video playlists
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContentCreate(BaseModel):
    title: str
    type: str
    file_url: Optional[str] = None
    duration: Optional[int] = 10
    category: Optional[str] = "other"
    tags: Optional[List[str]] = []
    autoplay: Optional[bool] = True
    loop: Optional[bool] = True
    playlist_urls: Optional[List[str]] = []

class Playlist(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    items: List[Dict[str, Any]] = []  # [{content_id, order, duration_override}]
    autoplay: bool = True
    loop: bool = True
    status: str = "active"  # active, inactive
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PlaylistCreate(BaseModel):
    name: str
    description: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = []
    autoplay: Optional[bool] = True
    loop: Optional[bool] = True
    status: Optional[str] = "active"

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    price: float
    currency: str = "RON"
    category: str  # sushi, rolls, sashimi, tempura, etc
    image_url: Optional[str] = None
    available: bool = True
    featured: bool = False
    order_index: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    currency: Optional[str] = "RON"
    category: str
    image_url: Optional[str] = None
    available: Optional[bool] = True
    featured: Optional[bool] = False
    order_index: Optional[int] = 0

class MenuTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    layout_type: str  # grid, list, carousel, fullscreen_promo
    products_per_page: int = 6
    page_duration: int = 10
    show_images: bool = True
    show_descriptions: bool = True
    background_color: Optional[str] = None
    text_color: Optional[str] = None
    accent_color: Optional[str] = None

class DigitalMenu(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    template_id: Optional[str] = None
    selected_products: List[str] = []  # Product IDs
    selected_categories: List[str] = []  # Category names
    promo_products: List[Dict[str, Any]] = []  # [{product_id, promo_price, promo_text}]
    show_promo_slides: bool = False
    promo_slide_duration: int = 8
    products_per_page: int = 6
    page_duration: int = 10
    auto_rotate: bool = True
    status: str = "active"  # active, draft
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DigitalMenuCreate(BaseModel):
    name: str
    template_id: Optional[str] = None
    selected_products: Optional[List[str]] = []
    selected_categories: Optional[List[str]] = []
    promo_products: Optional[List[Dict[str, Any]]] = []
    show_promo_slides: Optional[bool] = False
    promo_slide_duration: Optional[int] = 8
    products_per_page: Optional[int] = 6
    page_duration: Optional[int] = 10
    auto_rotate: Optional[bool] = True
    status: Optional[str] = "active"

class ScreenZoneContent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    screen_id: str
    zone_id: str
    content_type: str  # digital_menu, playlist, single_content, weather, custom
    digital_menu_id: Optional[str] = None
    playlist_id: Optional[str] = None
    content_id: Optional[str] = None
    weather_location: Optional[str] = None
    custom_html: Optional[str] = None

class ScreenZoneContentCreate(BaseModel):
    screen_id: str
    zone_id: str
    content_type: str
    digital_menu_id: Optional[str] = None
    playlist_id: Optional[str] = None
    content_id: Optional[str] = None
    weather_location: Optional[str] = None
    custom_html: Optional[str] = None

class ScreenSync(BaseModel):
    screen_ids: List[str]
    sync_type: str  # simple, cascade, matrix
class ScreenSync(BaseModel):
    screen_ids: List[str]
    sync_type: str  # simple, cascade, matrix
    master_screen_id: Optional[str] = None
    content_id: Optional[str] = None  # Direct content selection
    group_name: Optional[str] = None  # Sync group name
    grid_cols: Optional[int] = None
    grid_rows: Optional[int] = None

class ScreenSyncUpdate(BaseModel):
    group_name: Optional[str] = None
    content_id: Optional[str] = None

# ============ AUTH HELPERS ============

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8") if isinstance(hashed_password, str) else hashed_password,
    )

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user_doc = await user_get_by_email(email)
    if user_doc is None:
        raise HTTPException(status_code=401, detail="User not found")
    if isinstance(user_doc.get("created_at"), str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    return User(**user_doc)

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    existing_user = await user_get_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email deja înregistrat")
    n = await users_count()
    is_first_user = n == 0
    if not is_first_user:
        if not user_data.invitation_code:
            raise HTTPException(status_code=403, detail="Înregistrarea necesită un cod de invitație valid")
        invitation = await invitation_get_by_code(user_data.invitation_code)
        if not invitation:
            raise HTTPException(status_code=403, detail="Cod de invitație invalid sau expirat")
        expires_at = invitation.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=403, detail="Cod de invitație expirat")
        if invitation.get("uses", 0) >= invitation.get("max_uses", 1):
            raise HTTPException(status_code=403, detail="Codul de invitație a atins limita maximă de utilizări")
        await invitation_increment_uses(user_data.invitation_code)
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        is_super_admin=is_first_user,
    )
    user_dict = user.model_dump()
    await user_insert(user_dict)
    access_token = create_access_token(data={"sub": user.email})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(id=user.id, email=user.email, full_name=user.full_name, is_super_admin=user.is_super_admin),
    )

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user_doc = await user_get_by_email(credentials.email)
    if not user_doc:
        raise HTTPException(status_code=401, detail="Email sau parolă incorectă")
    if isinstance(user_doc.get("created_at"), str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    user = User(**user_doc)
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email sau parolă incorectă")
    
    # Update last_login
    await user_update_last_login(user.email)
    
    access_token = create_access_token(data={"sub": user.email})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id, 
            email=user.email, 
            full_name=user.full_name, 
            is_super_admin=user.is_super_admin,
            last_login=datetime.now(timezone.utc)
        ),
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id, 
        email=current_user.email, 
        full_name=current_user.full_name, 
        is_super_admin=current_user.is_super_admin,
        last_login=current_user.last_login
    )

# ============ INVITATION ROUTES ============

async def get_super_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency that requires super admin access"""
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Acces permis doar pentru Super Admin")
    return current_user

@api_router.post("/invitations")
async def create_invitation(invitation_data: InvitationCreate, current_user: User = Depends(get_super_admin)):
    invitation = InvitationLink(
        created_by=current_user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=invitation_data.expires_in_days),
        max_uses=invitation_data.max_uses,
    )
    inv_dict = invitation.model_dump()
    await invitation_insert(inv_dict)
    return {
        "id": invitation.id,
        "code": invitation.code,
        "expires_at": invitation.expires_at.isoformat(),
        "max_uses": invitation.max_uses,
        "uses": invitation.uses,
        "is_active": invitation.is_active,
    }

@api_router.get("/invitations")
async def get_invitations(current_user: User = Depends(get_super_admin)):
    return await invitations_list()

@api_router.delete("/invitations/{invitation_id}")
async def delete_invitation(invitation_id: str, current_user: User = Depends(get_super_admin)):
    ok = await invitation_deactivate(invitation_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Invitație negăsită")
    return {"message": "Invitație dezactivată"}

@api_router.get("/users")
async def get_users(current_user: User = Depends(get_super_admin)):
    return await users_list(exclude_password=True)

@api_router.get("/invitations/validate/{code}")
async def validate_invitation(code: str):
    invitation = await invitation_get_by_code(code)
    if not invitation:
        raise HTTPException(status_code=404, detail="Cod de invitație invalid")
    expires_at = invitation.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=403, detail="Cod de invitație expirat")
    if invitation.get("uses", 0) >= invitation.get("max_uses", 1):
        raise HTTPException(status_code=403, detail="Codul de invitație a atins limita maximă")
    return {"valid": True, "expires_at": invitation["expires_at"]}

@api_router.get("/auth/check-registration-open")
async def check_registration_open():
    return {"open": (await users_count()) == 0}

# ============ LOCATIONS ROUTES ============

@api_router.get("/locations", response_model=List[Location])
async def get_locations(current_user: User = Depends(get_current_user)):
    return await locations_list()

@api_router.post("/locations", response_model=Location)
async def create_location(location_data: LocationCreate, current_user: User = Depends(get_current_user)):
    location = Location(**location_data.model_dump())
    await location_insert(location.model_dump())
    return location

@api_router.get("/locations/{location_id}", response_model=Location)
async def get_location(location_id: str, current_user: User = Depends(get_current_user)):
    location = await location_get(location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location

@api_router.put("/locations/{location_id}", response_model=Location)
async def update_location(location_id: str, location_data: LocationCreate, current_user: User = Depends(get_current_user)):
    existing = await location_get(location_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Location not found")
    update_data = location_data.model_dump()
    await location_update(location_id, update_data)
    updated = await location_get(location_id)
    return updated

@api_router.delete("/locations/{location_id}")
async def delete_location(location_id: str, current_user: User = Depends(get_current_user)):
    ok = await location_delete(location_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Location not found")
    return {"message": "Location deleted"}

# ============ SCREENS ROUTES ============

@api_router.get("/screens", response_model=List[Screen])
async def get_screens(current_user: User = Depends(get_current_user)):
    return await screens_list()

@api_router.post("/screens", response_model=Screen)
async def create_screen(screen_data: ScreenCreate, current_user: User = Depends(get_current_user)):
    if await screen_exists_by_slug(screen_data.slug):
        raise HTTPException(status_code=400, detail="Slug already exists")
    screen = Screen(**screen_data.model_dump())
    await screen_insert(screen.model_dump())
    return screen

@api_router.get("/screens/{screen_id}", response_model=Screen)
async def get_screen(screen_id: str, current_user: User = Depends(get_current_user)):
    screen = await screen_get(screen_id)
    if not screen:
        raise HTTPException(status_code=404, detail="Screen not found")
    return screen

@api_router.put("/screens/{screen_id}", response_model=Screen)
async def update_screen(screen_id: str, screen_data: ScreenCreate, current_user: User = Depends(get_current_user)):
    existing = await screen_get(screen_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Screen not found")
    await screen_update(screen_id, screen_data.model_dump())
    updated = await screen_get(screen_id)
    return updated

@api_router.delete("/screens/{screen_id}")
async def delete_screen(screen_id: str, current_user: User = Depends(get_current_user)):
    ok = await screen_delete(screen_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Screen not found")
    return {"message": "Screen deleted"}

@api_router.post("/screens/{screen_id}/heartbeat")
async def screen_heartbeat(screen_id: str):
    await screen_update_heartbeat(screen_id, "online", datetime.now(timezone.utc))
    return {"message": "Heartbeat received"}


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=6)

async def send_reset_email(email: str, token: str):
    reset_link = f"https://tvscreener.netlify.app/reset-password?token={token}"
    
    # Check if SMTP is configured
    if SMTP_USER and SMTP_PASSWORD:
        import smtplib
        from email.message import EmailMessage
        import asyncio
        
        msg = EmailMessage()
        msg.set_content(f"Click the link to reset your password: {reset_link}")
        msg["Subject"] = "Reset Your Password - SushiMaster TV"
        msg["From"] = FROM_EMAIL
        msg["To"] = email
        
        try:
            # Run blocking SMTP call in a thread
            def _send():
                import socket
                
                # Monkey-patch getaddrinfo to force IPv4 (fixes Errno 101 on some containers)
                original_getaddrinfo = socket.getaddrinfo
                def getaddrinfo_ipv4_only(*args, **kwargs):
                    # Force AF_INET (IPv4)
                    new_args = list(args)
                    if len(new_args) >= 3:
                         # family is the 3rd arg (0-indexed 2)
                         new_args[2] = socket.AF_INET
                    elif 'family' in kwargs:
                        kwargs['family'] = socket.AF_INET
                    else:
                        # Append defaults until we can set family
                        # args signature: host, port, family, type, proto, flags
                        while len(new_args) < 2:
                            new_args.append(0) # Should not happen for getaddrinfo(host, port)
                        if len(new_args) == 2:
                            new_args.append(socket.AF_INET)
                    return original_getaddrinfo(*new_args, **kwargs)

                try:
                    # Apply patch
                    socket.getaddrinfo = getaddrinfo_ipv4_only
                    
                    print(f"🔌 Connecting to SMTP {SMTP_HOST}:{SMTP_PORT} (STARTTLS) [IPv4 Forced]...")
                    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                        # Debug level
                        server.set_debuglevel(1)
                        server.starttls()
                        server.login(SMTP_USER, SMTP_PASSWORD)
                        server.send_message(msg)
                except Exception as e1:
                    print(f"⚠️ Port {SMTP_PORT} failed ({e1}). Retrying with Port 465 (SSL) [IPv4 Forced]...")
                    # Fallback to 465 (SSL)
                    with smtplib.SMTP_SSL(SMTP_HOST, 465, timeout=10) as server:
                        server.set_debuglevel(1)
                        server.login(SMTP_USER, SMTP_PASSWORD)
                        server.send_message(msg)
                finally:
                    # Restore original
                    socket.getaddrinfo = original_getaddrinfo

            await asyncio.to_thread(_send)
            print(f"📧 Email sent to {email}")
            return "Email sent via SMTP"
        except Exception as e:
            print(f"❌ Failed to send email: {e}")
            # RETHROW so the endpoint knows functionality failed
            raise Exception(f"SMTP Error: {str(e)}")
    else:
        # Log to console
        print(f"🔗 RESET LINK for {email}: {reset_link}")
        return "SMTP not configured (Logged to console)"


@api_router.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    try:
        user = await user_get_by_email(req.email)
        if not user:
            # Don't reveal user existence, just fake success
            return {"message": "If the email exists, a reset link has been sent."}
        
        token = str(uuid.uuid4())
        # Expire in 1 hour
        # Use naive datetime because DB column is TIMESTAMP (without timezone)
        expires_at = datetime.utcnow() + timedelta(hours=1)
        
        await password_reset_create(req.email, token, expires_at)
        
        # Send email (and catch SMTP specific errors to show USER)
        try:
            status = await send_reset_email(req.email, token)
            return {"message": f"Success: {status}"}
        except Exception as smtp_err:
             # FOR DEBUGGING: Return the actual error
             raise HTTPException(status_code=500, detail=f"Email Send Failed: {str(smtp_err)}")
             
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")


@api_router.post("/auth/reset-password")
async def reset_password_endpoint(req: ResetPasswordRequest):
    try:
        reset_record = await password_reset_get(req.token)
        if not reset_record:
            raise HTTPException(status_code=400, detail="Invalid or expired token")
            
        expires_at = reset_record["expires_at"]
        
        # Handle case where DB returns string instead of datetime
        if isinstance(expires_at, str):
            # Replace space with T for fromisoformat compatibility if needed
            # Postgres format: YYYY-MM-DD HH:MM:SS.mmmmmm
            try:
                expires_at = datetime.fromisoformat(expires_at.replace(" ", "T"))
            except ValueError:
                # Fallback for other formats
                pass

        # Compare with naive datetime
        # Ensure expires_at is naive if comparing with naive utcnow
        if expires_at.tzinfo:
            expires_at = expires_at.replace(tzinfo=None)

        if expires_at < datetime.utcnow():
            await password_reset_delete(req.token)
            raise HTTPException(status_code=400, detail="Token expired")
            
        # User exists?
        user = await user_get_by_email(reset_record["email"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Update password
        hashed_password = get_password_hash(req.new_password)
        await user_update_password(reset_record["email"], hashed_password)
        
        # Delete token
        await password_reset_delete(req.token)
        
        return {"message": "Password updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Reset Error: {str(e)}")

# ============ SCREEN TEMPLATES ROUTES ============

@api_router.get("/screen-templates", response_model=List[ScreenTemplate])
async def get_screen_templates(current_user: User = Depends(get_current_user)):
    # Predefined templates
    templates = [
        ScreenTemplate(
            id="fullscreen",
            name="Full Screen",
            description="Single zone covering entire screen",
            zones=[
                {"id": "zone1", "name": "Main", "x": 0, "y": 0, "width": 100, "height": 100, "type": "menu"}
            ],
            is_default=True
        ),
        ScreenTemplate(
            id="split-horizontal",
            name="Split Horizontal",
            description="Two zones side by side",
            zones=[
                {"id": "zone1", "name": "Left", "x": 0, "y": 0, "width": 50, "height": 100, "type": "menu"},
                {"id": "zone2", "name": "Right", "x": 50, "y": 0, "width": 50, "height": 100, "type": "promo"}
            ]
        ),
        ScreenTemplate(
            id="split-vertical",
            name="Split Vertical",
            description="Two zones top and bottom",
            zones=[
                {"id": "zone1", "name": "Top", "x": 0, "y": 0, "width": 100, "height": 50, "type": "menu"},
                {"id": "zone2", "name": "Bottom", "x": 0, "y": 50, "width": 100, "height": 50, "type": "promo"}
            ]
        ),
        ScreenTemplate(
            id="sidebar",
            name="Sidebar Layout",
            description="Main content with sidebar",
            zones=[
                {"id": "zone1", "name": "Main", "x": 0, "y": 0, "width": 70, "height": 100, "type": "menu"},
                {"id": "zone2", "name": "Sidebar", "x": 70, "y": 0, "width": 30, "height": 100, "type": "promo"}
            ]
        )
    ]
    return templates

# ============ CONTENT ROUTES ============

@api_router.get("/content", response_model=List[Content])
async def get_content(current_user: User = Depends(get_current_user)):
    return await content_list()

@api_router.get("/content/{content_id}", response_model=Content)
async def get_content_item(content_id: str, current_user: User = Depends(get_current_user)):
    item = await content_get(content_id)
    if not item:
        raise HTTPException(status_code=404, detail="Content not found")
    return item

@api_router.post("/content/upload")
async def upload_content(
    title: str = Form(...),
    type: str = Form(...),
    category: str = Form("other"),
    duration: int = Form(10),
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    created_items = []
    
    for file in files:
        try:
            # Validate file type
            allowed_image_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
            allowed_video_types = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm']
            
            if type == "image" and file.content_type not in allowed_image_types:
                # Skip invalid files or raise error? raising error aborts all. 
                # For now let's raise to be safe, or just log and continue. 
                # User expects all or nothing usually, or at least feedback.
                raise HTTPException(status_code=400, detail=f"Tip fișier imagine invalid: {file.content_type}")
            if type == "video" and file.content_type not in allowed_video_types:
                raise HTTPException(status_code=400, detail=f"Tip fișier video invalid: {file.content_type}")
            
            # Determine save directory
            save_dir = IMAGES_DIR if type == "image" else VIDEOS_DIR
            
            # Generate unique filename
            file_ext = Path(file.filename).suffix.lower()
            if not file_ext:
                file_ext = '.mp4' if type == "video" else '.jpg'
            unique_filename = f"{uuid.uuid4()}{file_ext}"
            file_path = save_dir / unique_filename
            
            # Save file in chunks for large files
            chunk_size = 1024 * 1024  # 1MB chunks
            with open(file_path, "wb") as buffer:
                while chunk := await file.read(chunk_size):
                    buffer.write(chunk)
            
            # Create content record
            # Use original filename as title if multiple files are uploaded, or if user didn't simplify it.
            # User request: "keep filenames".
            content_title = title if len(files) == 1 else Path(file.filename).stem

            file_url_path = f"/api/uploads/{'images' if type == 'image' else 'videos'}/{unique_filename}"
            
            content_id = str(uuid.uuid4())
            new_content = {
                "id": content_id,
                "title": content_title, 
                "type": type,
                "file_url": file_url_path,
                "duration": duration,
                "category": category,
                "tags": [], # default empty list
                "thumbnail_url": file_url_path if type == "image" else None,
                "autoplay": True,
                "loop": True,
                "playlist_urls": [],
                "created_at": datetime.now(timezone.utc)
            }
            
            await content_insert(new_content)
            created_items.append(new_content)
            
        except Exception as e:
            # If one fails, we probably should report it. 
            # For simplicity in this iteration, we raise.
            logging.error(f"Error uploading file {file.filename}: {e}")
            raise HTTPException(status_code=500, detail=f"Eroare la procesarea fișierului {file.filename}: {str(e)}")

    return created_items

@api_router.post("/content/external", response_model=Content)
async def create_external_content(content_data: ContentCreate, current_user: User = Depends(get_current_user)):
    content = Content(**content_data.model_dump())
    await content_insert(content.model_dump())
    return content

@api_router.get("/content/{content_id}", response_model=Content)
async def get_content_by_id(content_id: str, current_user: User = Depends(get_current_user)):
    content = await content_get(content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    return content

@api_router.delete("/content/{content_id}")
async def delete_content(content_id: str, current_user: User = Depends(get_current_user)):
    content = await content_get(content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    if content.get("file_url", "").startswith("/api/uploads/"):
        file_path = ROOT_DIR / content["file_url"].replace("/api/uploads/", "uploads/")
        if file_path.exists():
            file_path.unlink()
    await content_delete(content_id)
    return {"message": "Content deleted"}

# Serve uploaded files
from fastapi.responses import FileResponse

@api_router.get("/uploads/{file_type}/{filename}")
async def serve_upload(file_type: str, filename: str):
    file_path = UPLOAD_DIR / file_type / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

# ============ PLAYLISTS ROUTES ============

@api_router.get("/playlists", response_model=List[Playlist])
async def get_playlists(current_user: User = Depends(get_current_user)):
    return await playlists_list()

@api_router.post("/playlists", response_model=Playlist)
async def create_playlist(playlist_data: PlaylistCreate, current_user: User = Depends(get_current_user)):
    playlist = Playlist(**playlist_data.model_dump())
    await playlist_insert(playlist.model_dump())
    return playlist

@api_router.get("/playlists/{playlist_id}", response_model=Playlist)
async def get_playlist(playlist_id: str, current_user: User = Depends(get_current_user)):
    playlist = await playlist_get(playlist_id)
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return playlist

@api_router.put("/playlists/{playlist_id}", response_model=Playlist)
async def update_playlist(playlist_id: str, playlist_data: PlaylistCreate, current_user: User = Depends(get_current_user)):
    existing = await playlist_get(playlist_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Playlist not found")
    await playlist_update(playlist_id, playlist_data.model_dump())
    updated = await playlist_get(playlist_id)
    return updated

@api_router.delete("/playlists/{playlist_id}")
async def delete_playlist(playlist_id: str, current_user: User = Depends(get_current_user)):
    ok = await playlist_delete(playlist_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"message": "Playlist deleted"}

# ============ PRODUCTS ROUTES ============

@api_router.get("/products", response_model=List[Product])
async def get_products(current_user: User = Depends(get_current_user)):
    return await products_list()

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, current_user: User = Depends(get_current_user)):
    product = Product(**product_data.model_dump())
    await product_insert(product.model_dump())
    return product

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str, current_user: User = Depends(get_current_user)):
    product = await product_get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductCreate, current_user: User = Depends(get_current_user)):
    existing = await product_get(product_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    await product_update(product_id, product_data.model_dump())
    return await product_get(product_id)

@api_router.post("/products/import-batch", response_model=List[Product])
async def import_products_batch(
    products_data: List[ProductCreate],
    current_user: User = Depends(get_current_user),
):
    imported = []
    for d in products_data:
        p = Product(**d.model_dump())
        await product_upsert_by_name(p.model_dump())
        imported.append(p)
    return imported

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: User = Depends(get_current_user)):
    ok = await product_delete(product_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ============ MENU TEMPLATES ROUTES ============

@api_router.get("/menu-templates", response_model=List[MenuTemplate])
async def get_menu_templates(current_user: User = Depends(get_current_user)):
    templates = [
        MenuTemplate(
            id="grid-modern",
            name="Grid Modern",
            layout_type="grid",
            products_per_page=6,
            page_duration=10,
            show_images=True,
            show_descriptions=True
        ),
        MenuTemplate(
            id="list-compact",
            name="List Compact",
            layout_type="list",
            products_per_page=8,
            page_duration=10,
            show_images=False,
            show_descriptions=False
        ),
        MenuTemplate(
            id="carousel",
            name="Carousel",
            layout_type="carousel",
            products_per_page=3,
            page_duration=8,
            show_images=True,
            show_descriptions=True
        )
    ]
    return templates

# ============ DIGITAL MENUS ROUTES ============

@api_router.get("/digital-menus", response_model=List[DigitalMenu])
async def get_digital_menus(current_user: User = Depends(get_current_user)):
    return await digital_menus_list()

@api_router.post("/digital-menus", response_model=DigitalMenu)
async def create_digital_menu(menu_data: DigitalMenuCreate, current_user: User = Depends(get_current_user)):
    menu = DigitalMenu(**menu_data.model_dump())
    await digital_menu_insert(menu.model_dump())
    return menu

@api_router.get("/digital-menus/{menu_id}", response_model=DigitalMenu)
async def get_digital_menu(menu_id: str, current_user: User = Depends(get_current_user)):
    menu = await digital_menu_get(menu_id)
    if not menu:
        raise HTTPException(status_code=404, detail="Digital menu not found")
    return menu

@api_router.put("/digital-menus/{menu_id}", response_model=DigitalMenu)
async def update_digital_menu(menu_id: str, menu_data: DigitalMenuCreate, current_user: User = Depends(get_current_user)):
    existing = await digital_menu_get(menu_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Digital menu not found")
    await digital_menu_update(menu_id, menu_data.model_dump())
    return await digital_menu_get(menu_id)

@api_router.delete("/digital-menus/{menu_id}")
async def delete_digital_menu(menu_id: str, current_user: User = Depends(get_current_user)):
    ok = await digital_menu_delete(menu_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Digital menu not found")
    return {"message": "Digital menu deleted"}

# ============ SCREEN ZONE CONTENT ROUTES ============

@api_router.get("/screen-zones/{screen_id}", response_model=List[ScreenZoneContent])
async def get_screen_zones(screen_id: str, current_user: User = Depends(get_current_user)):
    return await screen_zones_list(screen_id)

@api_router.post("/screen-zones", response_model=ScreenZoneContent)
async def create_screen_zone(zone_data: ScreenZoneContentCreate, current_user: User = Depends(get_current_user)):
    await screen_zones_delete_by_screen_and_zone(zone_data.screen_id, zone_data.zone_id)
    zone = ScreenZoneContent(**zone_data.model_dump())
    await screen_zone_insert(zone.model_dump())
    return zone

@api_router.delete("/screen-zones/{zone_id}")
async def delete_screen_zone(zone_id: str, current_user: User = Depends(get_current_user)):
    ok = await screen_zone_delete(zone_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Zone configuration not found")
    return {"message": "Zone configuration deleted"}

# ============ SCREEN SYNC ROUTES ============

@api_router.post("/screen-sync")
async def sync_screens(sync_data: ScreenSync, current_user: User = Depends(get_current_user)):
    sync_group = str(uuid.uuid4())
    
    # Logic for leader screen
    # If content_id is provided, we pick first screen as leader and set its content
    leader_screen_id = sync_data.master_screen_id
    
    if sync_data.content_id:
        if not sync_data.screen_ids:
             raise HTTPException(status_code=400, detail="No screens selected")
        # First screen becomes leader
        leader_screen_id = sync_data.screen_ids[0]
        
        # Verify content exists
        content = await content_get(sync_data.content_id)
        if not content:
            raise HTTPException(status_code=404, detail="Content not found")
            
        # Set zone1 of leader screen to this content
        # Clear existing zones
        await screen_zones_delete_by_screen(leader_screen_id)
        
        # Insert new zone with content
        new_zone = {
            "id": str(uuid.uuid4()),
            "screen_id": leader_screen_id,
            "zone_id": "zone1",
            "content_type": "single_content",
            "content_id": sync_data.content_id
        }
        await screen_zone_insert(new_zone)
        
    if not leader_screen_id:
        # If no master and no content, this is invalid unless just grouping?
        # Assuming we need a source.
        if sync_data.screen_ids:
             leader_screen_id = sync_data.screen_ids[0]
        else:
             raise HTTPException(status_code=400, detail="No screens or master specified")

    master_screen = await screen_get(leader_screen_id)
    if not master_screen:
        raise HTTPException(status_code=404, detail="Leader screen not found")
        
    tpl = master_screen.get("template_id")
    
    group_name = sync_data.group_name
    if not group_name:
        # Fallback to something like "Group {short_uuid}"
        group_name = f"Group {sync_group[:8]}"

    if sync_data.sync_type == "simple":
        for sid in sync_data.screen_ids:
            # Skip update if logic requires, but usually we just sync all
            await screen_update_sync(sid, sync_group, 0, tpl, "simple", group_name)
            
            # Copy zones from leader (if sid is leader, it just rewrites same zones, or skip)
            if sid != leader_screen_id:
                master_zones = await screen_zones_list(leader_screen_id)
                await screen_zones_delete_by_screen(sid)
                for z in master_zones:
                    new_z = {**z, "id": str(uuid.uuid4()), "screen_id": sid}
                    await screen_zone_insert(new_z)
        
        # Ensure leader also gets sync info updated
        if leader_screen_id in sync_data.screen_ids:
             await screen_update_sync(leader_screen_id, sync_group, 0, tpl, "simple", group_name)

    elif sync_data.sync_type == "cascade":
        for idx, sid in enumerate(sync_data.screen_ids):
            await screen_update_sync(sid, sync_group, idx, tpl, "cascade", group_name)
            if sid != leader_screen_id:
                master_zones = await screen_zones_list(leader_screen_id)
                await screen_zones_delete_by_screen(sid)
                for z in master_zones:
                    new_z = {**z, "id": str(uuid.uuid4()), "screen_id": sid}
                    await screen_zone_insert(new_z)
                    
    elif sync_data.sync_type == "matrix":
        # Matrix works similar to cascade (assigning indexes 0..N)
        # Frontend uses the index to calculate grid position
        
        # If grid dimensions are provided, encode them in sync_type
        actual_sync_type = "matrix"
        if sync_data.grid_cols and sync_data.grid_rows:
            actual_sync_type = f"matrix:{sync_data.grid_cols}x{sync_data.grid_rows}"
            
        for idx, sid in enumerate(sync_data.screen_ids):
            await screen_update_sync(sid, sync_group, idx, tpl, actual_sync_type, group_name)
            if sid != leader_screen_id:
                master_zones = await screen_zones_list(leader_screen_id)
                await screen_zones_delete_by_screen(sid)
                for z in master_zones:
                    new_z = {**z, "id": str(uuid.uuid4()), "screen_id": sid}
                    await screen_zone_insert(new_z)
                    
    return {"message": f"Screens synchronized with group {sync_group}", "sync_group": sync_group}

@api_router.get("/screen-sync/groups")
async def get_sync_groups(current_user: User = Depends(get_current_user)):
    return await sync_groups_list()

@api_router.delete("/screen-sync/groups/{group_id}")
async def unsync_group(group_id: str, current_user: User = Depends(get_current_user)):
    screens = await screens_list()
    group_screens = [s for s in screens if s.get("sync_group") == group_id]
    
    for s in group_screens:
        await screen_update_sync(s["id"], None, 0, s.get("template_id"), "simple", None)
        await screen_zones_delete_by_screen(s["id"])
        
    return {"message": "Group unsynced"}

@api_router.put("/screen-sync/groups/{group_id}")
async def update_sync_group(group_id: str, data: ScreenSyncUpdate, current_user: User = Depends(get_current_user)):
    screens = await screens_list()
    group_screens = [s for s in screens if s.get("sync_group") == group_id]
    
    if not group_screens:
        raise HTTPException(status_code=404, detail="Group not found")
        
    # 1. Update Group Name
    if data.group_name is not None:
        for s in group_screens:
            await screen_update_sync(
                s["id"], 
                s.get("sync_group"), 
                s.get("cascade_offset", 0), 
                s.get("template_id"), 
                s.get("sync_type", "simple"), 
                data.group_name
            )
            
    # 2. Update Content
    if data.content_id:
        content = await content_get(data.content_id)
        if not content:
            raise HTTPException(status_code=404, detail="Content not found")
            
        leader = group_screens[0]
        leader_id = leader["id"]
        
        await screen_zones_delete_by_screen(leader_id)
        new_zone = {
            "id": str(uuid.uuid4()),
            "screen_id": leader_id,
            "zone_id": "zone1",
            "content_type": "single_content",
            "content_id": data.content_id
        }
        await screen_zone_insert(new_zone)
        
        master_zones = [new_zone]
        
        for s in group_screens:
            if s["id"] == leader_id:
                continue
                
            await screen_zones_delete_by_screen(s["id"])
            for z in master_zones:
                new_z = {**z, "id": str(uuid.uuid4()), "screen_id": s["id"]}
                await screen_zone_insert(new_z)
                
    return {"message": "Group updated"}

# ============ PUBLIC DISPLAY ROUTES ============

@api_router.get("/display/{slug}")
async def get_display_data(slug: str, security_code: Optional[str] = None):
    screen = await screen_get_by_slug(slug)
    if not screen:
        raise HTTPException(status_code=404, detail="Screen not found")
    location = await location_get(screen["location_id"]) if screen.get("location_id") else None
    if location and location.get("security_code"):
        if not security_code or security_code != location["security_code"]:
            raise HTTPException(status_code=403, detail="Security code required")
    predefined = [
        {"id": "fullscreen", "name": "Full Screen", "zones": [{"id": "zone1", "name": "Main", "x": 0, "y": 0, "width": 100, "height": 100, "type": "menu"}]},
        {"id": "split-horizontal", "name": "Split Horizontal", "zones": [{"id": "zone1", "name": "Left", "x": 0, "y": 0, "width": 50, "height": 100, "type": "menu"}, {"id": "zone2", "name": "Right", "x": 50, "y": 0, "width": 50, "height": 100, "type": "promo"}]},
    ]
    template = next((t for t in predefined if t["id"] == screen.get("template_id")), None) if screen.get("template_id") else None
    zones_config = await screen_zones_list(screen["id"])
    for zc in zones_config:
        if zc.get("content_type") == "digital_menu" and zc.get("digital_menu_id"):
            menu = await digital_menu_get(zc["digital_menu_id"])
            if menu:
                products = []
                for pid in menu.get("selected_products") or []:
                    p = await product_get(pid)
                    if p:
                        products.append(p)
                cat_prods = await products_by_category(menu.get("selected_categories") or [])
                products.extend(cat_prods)
                menu = {**menu, "products": products}
                zc["digital_menu"] = menu
        elif zc.get("content_type") == "playlist" and zc.get("playlist_id"):
            playlist = await playlist_get(zc["playlist_id"])
            if playlist:
                items = []
                for it in playlist.get("items") or []:
                    c = await content_get(it["content_id"])
                    if c:
                        items.append({**c, "duration_override": it.get("duration_override")})
                playlist = {**playlist, "content_items": items}
                zc["playlist"] = playlist
        elif zc.get("content_type") == "single_content" and zc.get("content_id"):
            c = await content_get(zc["content_id"])
            if c:
                zc["content"] = c
    
    # Get sync group info if applicable
    sync_info = None
    if screen.get("sync_group"):
        group_screens = await screens_by_sync_group(screen["sync_group"])
        sync_info = {
            "group_id": screen["sync_group"],
            "total_screens": len(group_screens),
            "sync_type": screen.get("sync_type", "simple"),
            "my_index": screen.get("cascade_offset", 0),
            "screens": [{"id": s["id"], "index": s.get("cascade_offset", 0)} for s in group_screens]
        }
        
        # Parse grid dims if matrix
        st = screen.get("sync_type", "")
        if st and st.startswith("matrix:"):
            try:
                dims = st.split(":")[1].split("x")
                sync_info["grid_cols"] = int(dims[0])
                sync_info["grid_rows"] = int(dims[1])
            except:
                pass
    
    return {"screen": screen, "template": template, "zones_config": zones_config, "sync_info": sync_info}


@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    return {
        "locations": await locations_count(),
        "screens": await screens_count(),
        "online_screens": await screens_count_online(),
        "products": await products_count(),
        "content": await content_count(),
    }

# Include the router in the main app
app.include_router(api_router)



# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

