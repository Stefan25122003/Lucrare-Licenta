from datetime import datetime, timezone
import sys
import os
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from typing import List, Optional
from models import UserProfile, UserVoteStats, PollResponse
from database import get_database
from bson import ObjectId
from .auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

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

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    try:
        print(f"📋 Getting profile for user: {current_user.get('email')}")
        created_at = normalize_datetime(current_user.get("created_at"))
        
        user_data = {
            "id": str(current_user["_id"]),
            "username": current_user["username"],
            "email": current_user["email"],
            "full_name": current_user.get("full_name", ""),
            "location": current_user.get("location", ""),
            "bio": current_user.get("bio", ""),
            "phone_number": current_user.get("phone_number", ""),
            "profile_image": current_user.get("profile_image", ""),
            "is_admin": current_user.get("is_admin", False),
            "created_at": created_at.isoformat() if created_at else None
        }
        
        print(f"✅ Profile data prepared for: {user_data['email']}")
        return user_data
        
    except Exception as e:
        print(f"❌ Error in get_profile: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/profile")
async def update_profile(
    current_user: dict = Depends(get_current_user),
    full_name: str = Form(...),
    location: str = Form(""),
    bio: str = Form(""),
    phone_number: str = Form(""),
    profile_image: Optional[UploadFile] = File(None)
):
    """Update user profile"""
    db = await get_database()
    
    update_data = {
        "full_name": full_name,
        "location": location,
        "bio": bio,
        "phone_number": phone_number
    }
    
    if profile_image:
        update_data["profile_image"] = f"uploads/{profile_image.filename}"
    
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": update_data}
    )
    
    return {"message": "Profile updated successfully"}

@router.get("/{username}")
async def get_user_profile(username: str, current_user: dict = Depends(get_current_user)):
    """Obține profilul unui utilizator"""
    try:
        print(f"🔍 Looking for user: {username}")
        db = await get_database()
        
        user_doc = await db.users.find_one({"username": username})
        if not user_doc:
            print(f"❌ User {username} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilizatorul nu a fost găsit"
            )
        
        print(f"✅ Found user: {user_doc['username']}")
        
        return {
            "id": str(user_doc["_id"]),
            "username": user_doc["username"],
            "email": user_doc.get("email", ""),
            "created_at": user_doc.get("created_at"),
            "is_admin": user_doc.get("is_admin", False),
            "full_name": user_doc.get("full_name", ""),
            "bio": user_doc.get("bio", ""),
            "location": user_doc.get("location", ""),
            "profile_image": user_doc.get("profile_image", "")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Eroare la încărcarea profilului"
        )

@router.get("/{username}/stats")
async def get_user_stats(username: str, current_user: dict = Depends(get_current_user)):
    """Obține statisticile unui utilizator"""
    try:
        print(f"📊 Getting stats for user: {username}")
        db = await get_database()
        
        user_doc = await db.users.find_one({"username": username})
        if not user_doc:
            print(f"❌ User {username} not found for stats")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilizatorul nu a fost găsit"
            )
        
        user_id = user_doc["_id"]
        print(f"🔍 User ID: {user_id}")

        polls_created = await db.polls.count_documents({"created_by": user_id})
        votes_cast = await db.polls.count_documents({"voters": user_id})

        user_polls = await db.polls.find({"created_by": user_id}).to_list(length=None)
        total_votes_received = sum(
            sum(option.get("votes", 0) for option in poll.get("options", []))
            for poll in user_polls
        )
        
        active_polls = await db.polls.count_documents({
            "created_by": user_id, 
            "is_active": True
        })
        
        stats = {
            "user_id": str(user_id),
            "polls_created": polls_created,
            "active_polls": active_polls,
            "votes_cast": votes_cast,
            "total_votes_received": total_votes_received,
            "average_votes_per_poll": (total_votes_received / polls_created) if polls_created > 0 else 0
        }
        
        print(f"✅ Stats calculated: {stats}")
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching user stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Eroare la încărcarea statisticilor"
        )

@router.get("/{username}/polls")
async def get_user_polls(username: str, current_user: dict = Depends(get_current_user)):
    """Obține sondajele create de un utilizator"""
    try:
        print(f"📋 Getting polls for user: {username}")
        db = await get_database()
        
        user_doc = await db.users.find_one({"username": username})
        if not user_doc:
            print(f"❌ User {username} not found for polls")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilizatorul nu a fost găsit"
            )
        
        user_id = user_doc["_id"]
        print(f"🔍 Looking for polls by user ID: {user_id}")

        polls_cursor = db.polls.find({"created_by": user_id}).sort("created_at", -1)
        polls_docs = await polls_cursor.to_list(length=100)
        
        print(f"📋 Found {len(polls_docs)} polls for user {username}")

        from .polls import transform_poll_document
        polls = []
        for poll_doc in polls_docs:
            transformed_poll = await transform_poll_document(
                poll_doc, 
                db, 
                current_user_id=current_user["_id"]
            )
            if transformed_poll:
                polls.append(transformed_poll)
        
        print(f"✅ Returning {len(polls)} transformed polls")
        return polls
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching user polls: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Eroare la încărcarea sondajelor"
        )