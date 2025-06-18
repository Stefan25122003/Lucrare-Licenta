# models.py - FIXED cu toate modelele corecte
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

# User Models - FIXED toate clasele necesare
class UserRegistration(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr  # ✅ FIX: Login cu email
    password: str

class UserCreate(BaseModel):
    """Model pentru crearea unui utilizator nou - folosit intern"""
    username: str
    email: EmailStr
    password: str
    is_admin: bool = False

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    is_admin: bool = False

class UserProfile(BaseModel):
    """Model pentru profilul complet al utilizatorului"""
    username: str
    email: str
    first_name: str = ""
    last_name: str = ""
    city: str = ""
    age: Optional[int] = None
    phone: str = ""
    bio: str = ""
    avatar_url: str = ""

class UserProfileUpdate(BaseModel):
    """Model pentru actualizarea profilului"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    city: Optional[str] = None
    age: Optional[int] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    """Model pentru schimbarea parolei"""
    current_password: str
    new_password: str
    confirm_password: str

# Poll Models
class PollCreate(BaseModel):
    title: str
    options: List[str]
    end_date: Optional[datetime] = None

class PollResponse(BaseModel):
    id: str
    title: str
    options: List[dict]
    creator_id: str
    creator_username: str
    created_at: datetime
    end_date: Optional[datetime] = None
    is_active: bool
    total_votes: int

class Vote(BaseModel):
    option_index: int

class VoteRequest(BaseModel):
    option_index: int

# Secure Poll Models
class SecurePollCreate(BaseModel):
    title: str
    options: List[str]
    end_date: Optional[datetime] = None

class SecurePollResponse(BaseModel):
    id: str
    title: str
    options: List[dict]
    creator_id: str
    creator_username: str
    created_at: datetime
    end_date: Optional[datetime] = None
    is_active: bool
    total_votes: int
    has_paillier_encryption: bool = True
    has_blind_signatures: bool = True

class SecureVote(BaseModel):
    vote_index: int
    signed_token: str
    message: str

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Response Models
class MessageResponse(BaseModel):
    message: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Crypto Models
class BlindSignatureRequest(BaseModel):
    blinded_token: str

class BlindSignatureResponse(BaseModel):
    signature: str

class CryptoKeysResponse(BaseModel):
    paillier_n: str
    paillier_g: str
    rsa_public_key: str

class SystemStatusResponse(BaseModel):
    status: str
    encryption: str
    anonymity: str
    timestamp: str

# User model complet pentru MongoDB operations
class User(BaseModel):
    id: Optional[str] = None
    username: str
    email: str
    password: str
    full_name: Optional[str] = ""
    bio: Optional[str] = ""
    location: Optional[str] = ""
    phone_number: Optional[str] = ""
    profile_image: Optional[str] = ""
    # ✅ Adăugat câmpurile pentru profilul nou
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    city: Optional[str] = None
    age: Optional[int] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    voted_polls: List[str] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    password_changed_at: Optional[datetime] = None
    is_admin: bool = False

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ✅ Modele adiționale pentru compatibilitate cu codul existent
class UserRegister(BaseModel):
    """Alias pentru UserRegistration - pentru compatibilitate"""
    username: str
    email: EmailStr
    password: str

class PollStatistics(BaseModel):
    """Statistici detaliate pentru un sondaj"""
    poll_id: str
    poll_title: str
    total_votes: int
    vote_distribution: List[dict]  # Distribuția voturilor pe opțiuni
    demographic_stats: dict  # Statistici demografice
    city_distribution: dict  # Distribuția pe orașe
    age_distribution: dict   # Distribuția pe grupe de vârstă
    voting_timeline: List[dict]  # Timeline-ul voturilor
    engagement_metrics: dict  # Metrici de engagement

class UserVoteStats(BaseModel):
    """Statistici pentru un utilizator specific"""
    user_id: str
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    city: Optional[str] = None
    age: Optional[int] = None
    vote_option_index: int
    vote_option_text: str
    voted_at: datetime

class DemographicBreakdown(BaseModel):
    """Breakdown demografic pentru o opțiune"""
    option_index: int
    option_text: str
    votes: int
    percentage: float
    age_groups: dict
    cities: dict
    gender_distribution: dict  # dacă adaugi gender în profil

class PollAnalytics(BaseModel):
    """Analiză completă a unui sondaj"""
    poll_info: PollResponse
    statistics: PollStatistics
    user_votes: List[UserVoteStats]
    demographic_breakdown: List[DemographicBreakdown]
    insights: List[str]  # Insights generate automat