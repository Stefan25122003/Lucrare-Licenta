# main.py - FIXED cu import paths corecte
import sys
import os
from contextlib import asynccontextmanager
from datetime import datetime
import bcrypt
from dotenv import load_dotenv
load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles 
from database import connect_to_mongo, close_mongo_connection, get_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    print("🚀 Starting Voting System with Paillier Encryption...")

    jwt_secret = os.getenv("JWT_SECRET")
    if not jwt_secret:
        print("❌ WARNING: JWT_SECRET not found in environment variables!")
        print("❌ Using default secret - NOT SAFE FOR PRODUCTION!")
    else:
        print(f"✅ JWT_SECRET loaded: {jwt_secret[:10]}...")

    await connect_to_mongo()

    async def ensure_admin_exists():
        db = await get_database()
        admin = await db.users.find_one({"email": "admin@gmail.com"})
        if not admin:
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw("admin".encode(), salt).decode()
            
            admin_doc = {
                "username": "admin",
                "email": "admin@gmail.com",
                "password": hashed_password,
                "full_name": "Administrator",
                "bio": "System Administrator",
                "location": "",
                "phone_number": "",
                "profile_image": "",
                "voted_polls": [],
                "created_at": datetime.utcnow(),
                "is_admin": True  
            }
            
            await db.users.insert_one(admin_doc)
            print("✅ Admin account created")
        else:
            print("✅ Admin account found")
    
    await ensure_admin_exists()

    print("🔐 Crypto system initialized successfully!")
    
    yield

    print("🛑 Shutting down...")
    await close_mongo_connection()

app = FastAPI(
    title="Secure Voting System",
    description="Anonymous voting system with Paillier homomorphic encryption",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers.auth import router as auth_router
from routers.polls import router as polls_router
from routers.secure_polls import router as secure_polls_router
from routers.users import router as users_router

app.include_router(auth_router)
app.include_router(polls_router)
app.include_router(secure_polls_router)
app.include_router(users_router)

uploads_dir = "uploads"
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    return {
        "message": "Secure Voting System API",
        "version": "1.0.0",
        "features": [
            "Paillier Homomorphic Encryption",
            "Zero-Knowledge Proofs", 
            "Blind Signatures",
            "Anonymous Voting"
        ]
    }

@app.get("/health")
async def health_check():
    try:
        from database import ping_database
        db_status = await ping_database()
        return {
            "status": "healthy" if db_status else "unhealthy",
            "database": "connected" if db_status else "disconnected",
            "crypto": "initialized"
        }
    except Exception as e:
        print(f"Health check error: {e}")
        return {
            "status": "error",
            "database": "error",
            "crypto": "initialized",
            "error": str(e)
        }

if __name__ == "__main__":
    print("🔐 Initializing Voting System with Paillier Encryption...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5000,
        reload=True,
        log_level="info"
    )