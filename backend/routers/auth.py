import sys
import os

# Adaugă directorul backend în sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson.objectid import ObjectId
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from dotenv import load_dotenv

# IMPORTANT: Încarcă variabilele de mediu
load_dotenv()

from database import get_database
from models import UserRegistration, UserLogin, UserCreate, UserResponse, UserProfile, UserProfileUpdate, ChangePasswordRequest

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

# Configurare JWT - FOLOSEȘTE ACEEAȘI CHEIE CA ÎN MAIN.PY
JWT_SECRET = os.getenv("JWT_SECRET", "fallback-secret-not-secure")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Debug: Verifică că folosim aceeași cheie
print(f"🔑 Auth module JWT_SECRET: {JWT_SECRET[:10]}...")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        print(f"🔍 Verifying token: {credentials.credentials[:20]}...")
        print(f"🔑 Using JWT_SECRET: {JWT_SECRET[:10]}...")
        
        db = await get_database()
        
        # Decode JWT token
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        
        print(f"✅ Token decoded successfully. User ID: {user_id}")
        
        if not user_id:
            print("❌ No user_id in token payload")
            raise HTTPException(status_code=401, detail="Invalid token: no user_id")
        
        # Find user in database
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user is None:
            print(f"❌ User not found in database: {user_id}")
            raise HTTPException(status_code=401, detail="User not found")
        
        print(f"✅ User found: {user['email']}")
        return user
        
    except jwt.ExpiredSignatureError:
        print("❌ Token expired")
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        print(f"❌ Invalid token: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        print(f"❌ Unexpected error in get_current_user: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

@router.post("/register")
async def register(user_data: UserRegistration):
    db = await get_database()
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username already exists
    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Hash password
    hashed_password = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt())
    
    # ✅ FIX: Admin accounts - verifică multiple email-uri admin
    admin_emails = ["admin@gmail.com", "admin@admin.com", "cristian@admin.com"]
    is_admin = user_data.email.lower() in [email.lower() for email in admin_emails]
    
    print(f"🔍 Registering user: {user_data.email}")
    print(f"🔑 Is admin: {is_admin}")
    
    # Create user document
    user_doc = {
        "username": user_data.username,
        "email": user_data.email,
        "password": hashed_password.decode(),
        "full_name": "",
        "first_name": "",
        "last_name": "",
        "city": "",
        "age": None,
        "phone": "",
        "bio": "",
        "avatar_url": "",
        "voted_polls": [],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "is_admin": is_admin  # ✅ FIX: Set admin status
    }
    
    result = await db.users.insert_one(user_doc)
    print(f"✅ User registered with admin status: {is_admin}")
    
    return {"message": "User registered successfully", "user_id": str(result.inserted_id)}

@router.post("/login")
async def login(login_data: UserLogin):
    print(f"🔍 Login attempt for email: {login_data.email}")
    
    db = await get_database()
    
    # ✅ FIX: Căutăm după email
    user = await db.users.find_one({"email": login_data.email})
    
    if not user:
        print(f"❌ User not found for email: {login_data.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    print(f"✅ User found: {user['email']}")
    
    # Verify password
    if not bcrypt.checkpw(login_data.password.encode(), user["password"].encode()):
        print("❌ Password verification failed")
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    print("✅ Password verified successfully")
    
    # Create JWT token
    token_payload = {
        "user_id": str(user["_id"]),
        "email": user["email"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    
    print(f"🔑 Creating token with secret: {JWT_SECRET[:10]}...")
    token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {
        "access_token": token,  # ✅ FIX: Schimbat de la "token" la "access_token"
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "is_admin": user.get("is_admin", False)
        }
    }

@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Endpoint pentru a obține informațiile utilizatorului curent"""
    user_info = {
        "id": str(current_user["_id"]),
        "username": current_user["username"],
        "email": current_user["email"],
        "is_admin": current_user.get("is_admin", False),
        "created_at": current_user.get("created_at")
    }
    
    print(f"👤 Returning user info: {user_info['email']}")
    print(f"🔑 Admin status: {user_info['is_admin']}")
    
    return user_info

@router.get("/profile", response_model=UserProfile)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Obține profilul complet al utilizatorului curent"""
    try:
        db = await get_database()
        user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Creează profilul cu informații complete
        profile = UserProfile(
            username=user.get("username", ""),
            email=user.get("email", ""),
            first_name=user.get("first_name", ""),
            last_name=user.get("last_name", ""),
            city=user.get("city", ""),
            age=user.get("age"),
            phone=user.get("phone", ""),
            bio=user.get("bio", ""),
            avatar_url=user.get("avatar_url", "")
        )
        
        return profile
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to get profile")

@router.put("/profile")
async def update_user_profile(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Actualizează profilul utilizatorului curent"""
    try:
        db = await get_database()
        
        # Construiește obiectul de actualizare doar cu câmpurile furnizate
        update_data = {}
        
        if profile_data.first_name is not None:
            update_data["first_name"] = profile_data.first_name.strip()
        if profile_data.last_name is not None:
            update_data["last_name"] = profile_data.last_name.strip()
        if profile_data.city is not None:
            update_data["city"] = profile_data.city.strip()
        if profile_data.age is not None:
            if profile_data.age < 13 or profile_data.age > 120:
                raise HTTPException(status_code=400, detail="Vârsta trebuie să fie între 13 și 120 de ani")
            update_data["age"] = profile_data.age
        if profile_data.phone is not None:
            update_data["phone"] = profile_data.phone.strip()
        if profile_data.bio is not None:
            if len(profile_data.bio) > 500:
                raise HTTPException(status_code=400, detail="Biografia nu poate depăși 500 de caractere")
            update_data["bio"] = profile_data.bio.strip()
        if profile_data.avatar_url is not None:
            update_data["avatar_url"] = profile_data.avatar_url.strip()
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No data provided for update")
        
        # Adaugă timestamp pentru ultima actualizare
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        # Actualizează în baza de date
        result = await db.users.update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        print(f"✅ Profile updated for user {current_user['username']}")
        
        return {
            "message": "Profil actualizat cu succes",
            "updated_fields": list(update_data.keys())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """Schimbă parola utilizatorului curent"""
    try:
        if password_data.new_password != password_data.confirm_password:
            raise HTTPException(status_code=400, detail="Parolele noi nu se potrivesc")
        
        if len(password_data.new_password) < 6:
            raise HTTPException(status_code=400, detail="Parola nouă trebuie să aibă cel puțin 6 caractere")
        
        db = await get_database()
        user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verifică parola curentă
        if not bcrypt.checkpw(password_data.current_password.encode('utf-8'), user["password"].encode()):
            raise HTTPException(status_code=400, detail="Parola curentă este incorectă")
        
        # Hash-uiește parola nouă
        hashed_new_password = bcrypt.hashpw(password_data.new_password.encode('utf-8'), bcrypt.gensalt())
        
        # Actualizează parola
        await db.users.update_one(
            {"_id": ObjectId(current_user["_id"])},
            {
                "$set": {
                    "password": hashed_new_password.decode(),
                    "password_changed_at": datetime.now(timezone.utc)
                }
            }
        )
        
        print(f"✅ Password changed for user {current_user['username']}")
        
        return {"message": "Parolă schimbată cu succes"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error changing password: {e}")
        raise HTTPException(status_code=500, detail="Failed to change password")

# ✅ HELPER: Funcție pentru normalizarea datetime-urilor
def normalize_datetime(dt):
    """Convertește datetime la UTC timezone-aware"""
    if dt is None:
        return None
    if isinstance(dt, datetime):
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        else:
            return dt.astimezone(timezone.utc)
    return dt

@router.get("/stats")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    """Get current user statistics"""
    try:
        print(f"📊 Getting stats for user: {current_user.get('email')}")
        
        db = await get_database()
        user_id = ObjectId(current_user["_id"])
        
        # ✅ FIXED: Calculează statistici fără operații datetime problematice
        polls_created = await db.polls.count_documents({"created_by": user_id})
        votes_cast = await db.polls.count_documents({"voters": user_id})
        
        # Voturi primite
        user_polls = await db.polls.find({"created_by": user_id}).to_list(length=None)
        total_votes_received = sum(
            sum(option.get("votes", 0) for option in poll.get("options", []))
            for poll in user_polls
        )
        
        # ✅ FIXED: Normalizează datetime pentru afișare
        created_at = normalize_datetime(current_user.get("created_at"))
        
        stats = {
            "user_id": str(user_id),
            "polls_created": polls_created,
            "votes_cast": votes_cast,
            "total_votes_received": total_votes_received,
            "member_since": created_at.isoformat() if created_at else None,
            "average_votes_per_poll": (total_votes_received / polls_created) if polls_created > 0 else 0
        }
        
        print(f"✅ Stats calculated for user: {stats}")
        return stats
        
    except Exception as e:
        print(f"❌ Error getting user stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Eroare la calcularea statisticilor"
        )

# ✅ FIX: Endpoint pentru a promova utilizatori la admin (doar pentru admin-ii existenți)
@router.post("/promote-admin")
async def promote_to_admin(
    target_email: str,
    current_user: dict = Depends(get_current_user)
):
    """Promovează un utilizator la admin (doar admin-ii pot face asta)"""
    if not current_user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Only admins can promote users")
    
    db = await get_database()
    
    # Găsește utilizatorul țintă
    target_user = await db.users.find_one({"email": target_email})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Promovează la admin
    await db.users.update_one(
        {"email": target_email},
        {"$set": {"is_admin": True, "updated_at": datetime.now(timezone.utc)}}
    )
    
    print(f"✅ User {target_email} promoted to admin by {current_user['email']}")
    
    return {"message": f"User {target_email} promoted to admin successfully"}

# ✅ FIX: Endpoint pentru a verifica status-ul admin
@router.get("/admin-status")
async def check_admin_status(current_user: dict = Depends(get_current_user)):
    """Verifică dacă utilizatorul curent este admin"""
    return {
        "is_admin": current_user.get("is_admin", False),
        "email": current_user["email"],
        "username": current_user["username"]
    }