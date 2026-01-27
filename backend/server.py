from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT settings
SECRET_KEY = os.environ.get("SECRET_KEY", "sushimaster-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Security
security = HTTPBearer()

# Create the main app with increased file size limit
app = FastAPI()

# Increase max request body size to 500MB for video uploads
app.router.route_class = type('CustomRoute', (app.router.route_class,), {
    'max_body_size': 500 * 1024 * 1024  # 500MB
})

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Ensure upload directories exist
UPLOAD_DIR = ROOT_DIR / "uploads"
IMAGES_DIR = UPLOAD_DIR / "images"
VIDEOS_DIR = UPLOAD_DIR / "videos"
for dir in [UPLOAD_DIR, IMAGES_DIR, VIDEOS_DIR]:
    dir.mkdir(exist_ok=True)

# ============ MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    hashed_password: str
    is_super_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ScreenCreate(BaseModel):
    location_id: str
    name: str
    slug: str
    resolution: Optional[str] = "1920x1080"
    orientation: Optional[str] = "landscape"
    template_id: Optional[str] = None

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
    sync_type: str  # simple, cascade
    master_screen_id: str

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
    
    user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    if user_doc is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email deja înregistrat")
    
    # Check if this is the first user (becomes Super Admin)
    users_count = await db.users.count_documents({})
    is_first_user = users_count == 0
    
    if not is_first_user:
        # Not first user - requires valid invitation code
        if not user_data.invitation_code:
            raise HTTPException(status_code=403, detail="Înregistrarea necesită un cod de invitație valid")
        
        # Validate invitation code
        invitation = await db.invitations.find_one({
            "code": user_data.invitation_code,
            "is_active": True
        }, {"_id": 0})
        
        if not invitation:
            raise HTTPException(status_code=403, detail="Cod de invitație invalid sau expirat")
        
        # Check expiration
        expires_at = invitation.get('expires_at')
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=403, detail="Cod de invitație expirat")
        
        # Check max uses
        if invitation.get('uses', 0) >= invitation.get('max_uses', 1):
            raise HTTPException(status_code=403, detail="Codul de invitație a atins limita maximă de utilizări")
        
        # Increment uses
        await db.invitations.update_one(
            {"code": user_data.invitation_code},
            {"$inc": {"uses": 1}}
        )
    
    # Create user
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        is_super_admin=is_first_user
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user.email})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(id=user.id, email=user.email, full_name=user.full_name, is_super_admin=user.is_super_admin)
    )

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Email sau parolă incorectă")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email sau parolă incorectă")
    
    access_token = create_access_token(data={"sub": user.email})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(id=user.id, email=user.email, full_name=user.full_name, is_super_admin=user.is_super_admin)
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(id=current_user.id, email=current_user.email, full_name=current_user.full_name, is_super_admin=current_user.is_super_admin)

# ============ INVITATION ROUTES ============

async def get_super_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency that requires super admin access"""
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Acces permis doar pentru Super Admin")
    return current_user

@api_router.post("/invitations")
async def create_invitation(invitation_data: InvitationCreate, current_user: User = Depends(get_super_admin)):
    """Create a new invitation link - Super Admin only"""
    invitation = InvitationLink(
        created_by=current_user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=invitation_data.expires_in_days),
        max_uses=invitation_data.max_uses
    )
    
    inv_dict = invitation.model_dump()
    inv_dict['created_at'] = inv_dict['created_at'].isoformat()
    inv_dict['expires_at'] = inv_dict['expires_at'].isoformat()
    
    await db.invitations.insert_one(inv_dict)
    
    return {
        "id": invitation.id,
        "code": invitation.code,
        "expires_at": inv_dict['expires_at'],
        "max_uses": invitation.max_uses,
        "uses": invitation.uses,
        "is_active": invitation.is_active
    }

@api_router.get("/invitations")
async def get_invitations(current_user: User = Depends(get_super_admin)):
    """Get all invitation links - Super Admin only"""
    invitations = await db.invitations.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return invitations

@api_router.delete("/invitations/{invitation_id}")
async def delete_invitation(invitation_id: str, current_user: User = Depends(get_super_admin)):
    """Deactivate an invitation - Super Admin only"""
    result = await db.invitations.update_one(
        {"id": invitation_id},
        {"$set": {"is_active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invitație negăsită")
    return {"message": "Invitație dezactivată"}

@api_router.get("/users")
async def get_users(current_user: User = Depends(get_super_admin)):
    """Lista utilizatorilor – doar Super Admin"""
    cursor = db.users.find({}, {"_id": 0, "hashed_password": 0}).sort("created_at", -1)
    users = await cursor.to_list(500)
    for u in users:
        if u.get("created_at"):
            u["created_at"] = u["created_at"].isoformat() if hasattr(u["created_at"], "isoformat") else u["created_at"]
    return users

@api_router.get("/invitations/validate/{code}")
async def validate_invitation(code: str):
    """Public endpoint to validate an invitation code"""
    invitation = await db.invitations.find_one({
        "code": code,
        "is_active": True
    }, {"_id": 0})
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Cod de invitație invalid")
    
    # Check expiration
    expires_at = invitation.get('expires_at')
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=403, detail="Cod de invitație expirat")
    
    # Check max uses
    if invitation.get('uses', 0) >= invitation.get('max_uses', 1):
        raise HTTPException(status_code=403, detail="Codul de invitație a atins limita maximă")
    
    return {"valid": True, "expires_at": invitation['expires_at']}

@api_router.get("/auth/check-registration-open")
async def check_registration_open():
    """Check if open registration is available (first user)"""
    users_count = await db.users.count_documents({})
    return {"open": users_count == 0}

# ============ LOCATIONS ROUTES ============

@api_router.get("/locations", response_model=List[Location])
async def get_locations(current_user: User = Depends(get_current_user)):
    locations = await db.locations.find({}, {"_id": 0}).to_list(1000)
    for loc in locations:
        if isinstance(loc.get('created_at'), str):
            loc['created_at'] = datetime.fromisoformat(loc['created_at'])
    return locations

@api_router.post("/locations", response_model=Location)
async def create_location(location_data: LocationCreate, current_user: User = Depends(get_current_user)):
    location = Location(**location_data.model_dump())
    loc_dict = location.model_dump()
    loc_dict['created_at'] = loc_dict['created_at'].isoformat()
    await db.locations.insert_one(loc_dict)
    return location

@api_router.get("/locations/{location_id}", response_model=Location)
async def get_location(location_id: str, current_user: User = Depends(get_current_user)):
    location = await db.locations.find_one({"id": location_id}, {"_id": 0})
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    if isinstance(location.get('created_at'), str):
        location['created_at'] = datetime.fromisoformat(location['created_at'])
    return location

@api_router.put("/locations/{location_id}", response_model=Location)
async def update_location(location_id: str, location_data: LocationCreate, current_user: User = Depends(get_current_user)):
    existing = await db.locations.find_one({"id": location_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Location not found")
    
    update_data = location_data.model_dump()
    await db.locations.update_one({"id": location_id}, {"$set": update_data})
    
    updated = await db.locations.find_one({"id": location_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/locations/{location_id}")
async def delete_location(location_id: str, current_user: User = Depends(get_current_user)):
    result = await db.locations.delete_one({"id": location_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")
    return {"message": "Location deleted"}

# ============ SCREENS ROUTES ============

@api_router.get("/screens", response_model=List[Screen])
async def get_screens(current_user: User = Depends(get_current_user)):
    screens = await db.screens.find({}, {"_id": 0}).to_list(1000)
    for screen in screens:
        if isinstance(screen.get('created_at'), str):
            screen['created_at'] = datetime.fromisoformat(screen['created_at'])
        if isinstance(screen.get('last_active'), str):
            screen['last_active'] = datetime.fromisoformat(screen['last_active'])
    return screens

@api_router.post("/screens", response_model=Screen)
async def create_screen(screen_data: ScreenCreate, current_user: User = Depends(get_current_user)):
    # Check if slug already exists
    existing = await db.screens.find_one({"slug": screen_data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    screen = Screen(**screen_data.model_dump())
    screen_dict = screen.model_dump()
    screen_dict['created_at'] = screen_dict['created_at'].isoformat()
    if screen_dict.get('last_active'):
        screen_dict['last_active'] = screen_dict['last_active'].isoformat()
    
    await db.screens.insert_one(screen_dict)
    return screen

@api_router.get("/screens/{screen_id}", response_model=Screen)
async def get_screen(screen_id: str, current_user: User = Depends(get_current_user)):
    screen = await db.screens.find_one({"id": screen_id}, {"_id": 0})
    if not screen:
        raise HTTPException(status_code=404, detail="Screen not found")
    if isinstance(screen.get('created_at'), str):
        screen['created_at'] = datetime.fromisoformat(screen['created_at'])
    if isinstance(screen.get('last_active'), str):
        screen['last_active'] = datetime.fromisoformat(screen['last_active'])
    return screen

@api_router.put("/screens/{screen_id}", response_model=Screen)
async def update_screen(screen_id: str, screen_data: ScreenCreate, current_user: User = Depends(get_current_user)):
    existing = await db.screens.find_one({"id": screen_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Screen not found")
    
    update_data = screen_data.model_dump()
    await db.screens.update_one({"id": screen_id}, {"$set": update_data})
    
    updated = await db.screens.find_one({"id": screen_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('last_active'), str):
        updated['last_active'] = datetime.fromisoformat(updated['last_active'])
    return updated

@api_router.delete("/screens/{screen_id}")
async def delete_screen(screen_id: str, current_user: User = Depends(get_current_user)):
    result = await db.screens.delete_one({"id": screen_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Screen not found")
    return {"message": "Screen deleted"}

@api_router.post("/screens/{screen_id}/heartbeat")
async def screen_heartbeat(screen_id: str):
    """Public endpoint for screens to report they are online"""
    update_data = {
        "status": "online",
        "last_active": datetime.now(timezone.utc).isoformat()
    }
    await db.screens.update_one({"id": screen_id}, {"$set": update_data})
    return {"message": "Heartbeat received"}

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
    content_list = await db.content.find({}, {"_id": 0}).to_list(1000)
    for content in content_list:
        if isinstance(content.get('created_at'), str):
            content['created_at'] = datetime.fromisoformat(content['created_at'])
    return content_list

@api_router.post("/content/upload")
async def upload_content(
    title: str = Form(...),
    type: str = Form(...),
    category: str = Form("other"),
    duration: int = Form(10),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    try:
        # Validate file type
        allowed_image_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        allowed_video_types = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm']
        
        if type == "image" and file.content_type not in allowed_image_types:
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
        
        # Generate relative URL
        file_url = f"/api/uploads/{type}s/{unique_filename}"
        
        # Create content record
        content = Content(
            title=title,
            type=type,
            file_url=file_url,
            duration=duration,
            category=category,
            thumbnail_url=file_url if type == "image" else None
        )
        
        content_dict = content.model_dump()
        content_dict['created_at'] = content_dict['created_at'].isoformat()
        
        await db.content.insert_one(content_dict)
        return content
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Eroare la upload: {str(e)}")

@api_router.post("/content/external", response_model=Content)
async def create_external_content(content_data: ContentCreate, current_user: User = Depends(get_current_user)):
    """Create content from external URL"""
    content = Content(**content_data.model_dump())
    content_dict = content.model_dump()
    content_dict['created_at'] = content_dict['created_at'].isoformat()
    await db.content.insert_one(content_dict)
    return content

@api_router.get("/content/{content_id}", response_model=Content)
async def get_content_by_id(content_id: str, current_user: User = Depends(get_current_user)):
    content = await db.content.find_one({"id": content_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    if isinstance(content.get('created_at'), str):
        content['created_at'] = datetime.fromisoformat(content['created_at'])
    return content

@api_router.delete("/content/{content_id}")
async def delete_content(content_id: str, current_user: User = Depends(get_current_user)):
    content = await db.content.find_one({"id": content_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Delete file if it's local
    if content['file_url'].startswith('/api/uploads/'):
        file_path = ROOT_DIR / content['file_url'].replace('/api/uploads/', 'uploads/')
        if file_path.exists():
            file_path.unlink()
    
    await db.content.delete_one({"id": content_id})
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
    playlists = await db.playlists.find({}, {"_id": 0}).to_list(1000)
    for playlist in playlists:
        if isinstance(playlist.get('created_at'), str):
            playlist['created_at'] = datetime.fromisoformat(playlist['created_at'])
    return playlists

@api_router.post("/playlists", response_model=Playlist)
async def create_playlist(playlist_data: PlaylistCreate, current_user: User = Depends(get_current_user)):
    playlist = Playlist(**playlist_data.model_dump())
    playlist_dict = playlist.model_dump()
    playlist_dict['created_at'] = playlist_dict['created_at'].isoformat()
    await db.playlists.insert_one(playlist_dict)
    return playlist

@api_router.get("/playlists/{playlist_id}", response_model=Playlist)
async def get_playlist(playlist_id: str, current_user: User = Depends(get_current_user)):
    playlist = await db.playlists.find_one({"id": playlist_id}, {"_id": 0})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    if isinstance(playlist.get('created_at'), str):
        playlist['created_at'] = datetime.fromisoformat(playlist['created_at'])
    return playlist

@api_router.put("/playlists/{playlist_id}", response_model=Playlist)
async def update_playlist(playlist_id: str, playlist_data: PlaylistCreate, current_user: User = Depends(get_current_user)):
    existing = await db.playlists.find_one({"id": playlist_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    update_data = playlist_data.model_dump()
    await db.playlists.update_one({"id": playlist_id}, {"$set": update_data})
    
    updated = await db.playlists.find_one({"id": playlist_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/playlists/{playlist_id}")
async def delete_playlist(playlist_id: str, current_user: User = Depends(get_current_user)):
    result = await db.playlists.delete_one({"id": playlist_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"message": "Playlist deleted"}

# ============ PRODUCTS ROUTES ============

@api_router.get("/products", response_model=List[Product])
async def get_products(current_user: User = Depends(get_current_user)):
    products = await db.products.find({}, {"_id": 0}).sort("order_index", 1).to_list(1000)
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    return products

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, current_user: User = Depends(get_current_user)):
    product = Product(**product_data.model_dump())
    product_dict = product.model_dump()
    product_dict['created_at'] = product_dict['created_at'].isoformat()
    await db.products.insert_one(product_dict)
    return product

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str, current_user: User = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductCreate, current_user: User = Depends(get_current_user)):
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_data.model_dump()
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.post("/products/import-batch", response_model=List[Product])
async def import_products_batch(
    products_data: List[ProductCreate],
    current_user: User = Depends(get_current_user)
):
    """Import multiple products at once"""
    imported_products = []
    
    for product_data in products_data:
        product = Product(**product_data.model_dump())
        product_dict = product.model_dump()
        product_dict['created_at'] = product_dict['created_at'].isoformat()
        
        # Check if product with same name exists
        existing = await db.products.find_one({"name": product.name})
        if existing:
            # Update existing product
            await db.products.update_one(
                {"name": product.name},
                {"$set": product_dict}
            )
        else:
            # Insert new product
            await db.products.insert_one(product_dict)
        
        imported_products.append(product)
    
    return imported_products

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: User = Depends(get_current_user)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
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
    menus = await db.digital_menus.find({}, {"_id": 0}).to_list(1000)
    for menu in menus:
        if isinstance(menu.get('created_at'), str):
            menu['created_at'] = datetime.fromisoformat(menu['created_at'])
    return menus

@api_router.post("/digital-menus", response_model=DigitalMenu)
async def create_digital_menu(menu_data: DigitalMenuCreate, current_user: User = Depends(get_current_user)):
    menu = DigitalMenu(**menu_data.model_dump())
    menu_dict = menu.model_dump()
    menu_dict['created_at'] = menu_dict['created_at'].isoformat()
    await db.digital_menus.insert_one(menu_dict)
    return menu

@api_router.get("/digital-menus/{menu_id}", response_model=DigitalMenu)
async def get_digital_menu(menu_id: str, current_user: User = Depends(get_current_user)):
    menu = await db.digital_menus.find_one({"id": menu_id}, {"_id": 0})
    if not menu:
        raise HTTPException(status_code=404, detail="Digital menu not found")
    if isinstance(menu.get('created_at'), str):
        menu['created_at'] = datetime.fromisoformat(menu['created_at'])
    return menu

@api_router.put("/digital-menus/{menu_id}", response_model=DigitalMenu)
async def update_digital_menu(menu_id: str, menu_data: DigitalMenuCreate, current_user: User = Depends(get_current_user)):
    existing = await db.digital_menus.find_one({"id": menu_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Digital menu not found")
    
    update_data = menu_data.model_dump()
    await db.digital_menus.update_one({"id": menu_id}, {"$set": update_data})
    
    updated = await db.digital_menus.find_one({"id": menu_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/digital-menus/{menu_id}")
async def delete_digital_menu(menu_id: str, current_user: User = Depends(get_current_user)):
    result = await db.digital_menus.delete_one({"id": menu_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Digital menu not found")
    return {"message": "Digital menu deleted"}

# ============ SCREEN ZONE CONTENT ROUTES ============

@api_router.get("/screen-zones/{screen_id}", response_model=List[ScreenZoneContent])
async def get_screen_zones(screen_id: str, current_user: User = Depends(get_current_user)):
    zones = await db.screen_zones.find({"screen_id": screen_id}, {"_id": 0}).to_list(100)
    return zones

@api_router.post("/screen-zones", response_model=ScreenZoneContent)
async def create_screen_zone(zone_data: ScreenZoneContentCreate, current_user: User = Depends(get_current_user)):
    # Delete existing zone config for this screen+zone
    await db.screen_zones.delete_many({"screen_id": zone_data.screen_id, "zone_id": zone_data.zone_id})
    
    zone = ScreenZoneContent(**zone_data.model_dump())
    await db.screen_zones.insert_one(zone.model_dump())
    return zone

@api_router.delete("/screen-zones/{zone_id}")
async def delete_screen_zone(zone_id: str, current_user: User = Depends(get_current_user)):
    result = await db.screen_zones.delete_one({"id": zone_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Zone configuration not found")
    return {"message": "Zone configuration deleted"}

# ============ SCREEN SYNC ROUTES ============

@api_router.post("/screen-sync")
async def sync_screens(sync_data: ScreenSync, current_user: User = Depends(get_current_user)):
    # Generate sync group ID
    sync_group = str(uuid.uuid4())
    
    # Find master screen
    master_screen = await db.screens.find_one({"id": sync_data.master_screen_id})
    if not master_screen:
        raise HTTPException(status_code=404, detail="Master screen not found")
    
    if sync_data.sync_type == "simple":
        # Simple sync: all screens show same content
        for screen_id in sync_data.screen_ids:
            await db.screens.update_one(
                {"id": screen_id},
                {"$set": {
                    "sync_group": sync_group,
                    "cascade_offset": 0,
                    "template_id": master_screen.get('template_id')
                }}
            )
            # Copy zone configuration
            master_zones = await db.screen_zones.find({"screen_id": sync_data.master_screen_id}, {"_id": 0}).to_list(100)
            await db.screen_zones.delete_many({"screen_id": screen_id})
            for zone in master_zones:
                new_zone = zone.copy()
                new_zone['id'] = str(uuid.uuid4())
                new_zone['screen_id'] = screen_id
                await db.screen_zones.insert_one(new_zone)
    
    elif sync_data.sync_type == "cascade":
        # Cascade sync: each screen shows offset pages
        for idx, screen_id in enumerate(sync_data.screen_ids):
            await db.screens.update_one(
                {"id": screen_id},
                {"$set": {
                    "sync_group": sync_group,
                    "cascade_offset": idx,
                    "template_id": master_screen.get('template_id')
                }}
            )
            # Copy zone configuration
            if idx > 0:  # Skip master
                master_zones = await db.screen_zones.find({"screen_id": sync_data.master_screen_id}, {"_id": 0}).to_list(100)
                await db.screen_zones.delete_many({"screen_id": screen_id})
                for zone in master_zones:
                    new_zone = zone.copy()
                    new_zone['id'] = str(uuid.uuid4())
                    new_zone['screen_id'] = screen_id
                    await db.screen_zones.insert_one(new_zone)
    
    return {"message": f"Screens synchronized with group {sync_group}", "sync_group": sync_group}

# ============ PUBLIC DISPLAY ROUTES ============

@api_router.get("/display/{slug}")
async def get_display_data(slug: str, security_code: Optional[str] = None):
    """Public endpoint for screen display"""
    screen = await db.screens.find_one({"slug": slug}, {"_id": 0})
    if not screen:
        raise HTTPException(status_code=404, detail="Screen not found")
    
    # Check security code
    location = await db.locations.find_one({"id": screen['location_id']}, {"_id": 0})
    if location and location.get('security_code'):
        if not security_code or security_code != location['security_code']:
            raise HTTPException(status_code=403, detail="Security code required")
    
    # Get template
    if screen.get('template_id'):
        # Check predefined templates first
        predefined = [
            {"id": "fullscreen", "name": "Full Screen", "zones": [{"id": "zone1", "name": "Main", "x": 0, "y": 0, "width": 100, "height": 100, "type": "menu"}]},
            {"id": "split-horizontal", "name": "Split Horizontal", "zones": [{"id": "zone1", "name": "Left", "x": 0, "y": 0, "width": 50, "height": 100, "type": "menu"}, {"id": "zone2", "name": "Right", "x": 50, "y": 0, "width": 50, "height": 100, "type": "promo"}]}
        ]
        template = next((t for t in predefined if t['id'] == screen['template_id']), None)
    else:
        template = None
    
    # Get zone configurations
    zones_config = await db.screen_zones.find({"screen_id": screen['id']}, {"_id": 0}).to_list(100)
    
    # Get content for each zone
    for zone_config in zones_config:
        if zone_config['content_type'] == 'digital_menu' and zone_config.get('digital_menu_id'):
            menu = await db.digital_menus.find_one({"id": zone_config['digital_menu_id']}, {"_id": 0})
            if menu:
                # Get products
                products = []
                if menu.get('selected_products'):
                    for pid in menu['selected_products']:
                        product = await db.products.find_one({"id": pid}, {"_id": 0})
                        if product:
                            products.append(product)
                if menu.get('selected_categories'):
                    cat_products = await db.products.find({"category": {"$in": menu['selected_categories']}}, {"_id": 0}).to_list(1000)
                    products.extend(cat_products)
                menu['products'] = products
                zone_config['digital_menu'] = menu
        
        elif zone_config['content_type'] == 'playlist' and zone_config.get('playlist_id'):
            playlist = await db.playlists.find_one({"id": zone_config['playlist_id']}, {"_id": 0})
            if playlist:
                # Get content items
                items = []
                for item in playlist.get('items', []):
                    content = await db.content.find_one({"id": item['content_id']}, {"_id": 0})
                    if content:
                        items.append({**content, 'duration_override': item.get('duration_override')})
                playlist['content_items'] = items
                zone_config['playlist'] = playlist
        
        elif zone_config['content_type'] == 'single_content' and zone_config.get('content_id'):
            content = await db.content.find_one({"id": zone_config['content_id']}, {"_id": 0})
            if content:
                zone_config['content'] = content
    
    return {
        "screen": screen,
        "template": template,
        "zones_config": zones_config
    }

# ============ DASHBOARD STATS ============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    locations_count = await db.locations.count_documents({})
    screens_count = await db.screens.count_documents({})
    online_screens = await db.screens.count_documents({"status": "online"})
    products_count = await db.products.count_documents({})
    content_count = await db.content.count_documents({})
    
    return {
        "locations": locations_count,
        "screens": screens_count,
        "online_screens": online_screens,
        "products": products_count,
        "content": content_count
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
