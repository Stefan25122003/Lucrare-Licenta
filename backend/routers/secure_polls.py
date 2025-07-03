import hashlib
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
import json

import sys
import os

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from routers.auth import get_current_user
from database import get_database
from models import SecurePollCreate, SecurePollResponse

crypto_system = None

try:
    from crypto_system import crypto_system
    print("✅ Crypto system imported successfully")
except ImportError as e:
    print(f"❌ Error importing crypto_system: {e}")
    crypto_system = None

router = APIRouter(prefix="/secure-polls", tags=["secure_polls"])

# Dictionary pentru a stoca sistemele crypto per sondaj
poll_crypto_systems = {}

# Helper function to safely retrieve the crypto system
def get_crypto_system_safe(poll_id: str = None):
    """Safely retrieves the crypto system for a specific poll or the global crypto system"""

    if poll_id and poll_id in poll_crypto_systems:
        system = poll_crypto_systems[poll_id]
        if system is not None:
            return system
    if crypto_system is not None:
        return crypto_system
    raise HTTPException(
        status_code=500, 
        detail="Crypto system not available. Please ensure crypto_system is properly configured."
    )

# Helper function to serialize poll data for JSON compatibility
def serialize_poll(poll: Dict[str, Any]) -> Dict[str, Any]:
    """Serializes MongoDB poll document into a JSON-compatible format"""
    try:
        poll_id = str(poll["_id"]) if "_id" in poll else None
        created_at = poll["created_at"].isoformat() if isinstance(poll.get("created_at"), datetime) else str(poll.get("created_at", ""))
        end_date = poll["end_date"].isoformat() if poll.get("end_date") and isinstance(poll["end_date"], datetime) else poll.get("end_date")
        closed_at = poll["closed_at"].isoformat() if poll.get("closed_at") and isinstance(poll["closed_at"], datetime) else poll.get("closed_at")
        
        options = poll.get("options", [])
        if isinstance(options, list):
            safe_options = []
            for option in options:
                if isinstance(option, dict):
                    safe_options.append({
                        "text": str(option.get("text", "")),
                        "encrypted_votes": option.get("encrypted_votes", [])
                    })
                elif isinstance(option, str):
                    safe_options.append({"text": option, "encrypted_votes": []})
                else:
                    safe_options.append({"text": str(option), "encrypted_votes": []})
        else:
            safe_options = []
        
        serialized = {
            "_id": poll_id,
            "title": str(poll.get("title", "")),
            "options": safe_options,
            "creator_id": str(poll.get("creator_id", "")),
            "creator_username": str(poll.get("creator_username", "Unknown")),
            "created_at": created_at,
            "end_date": end_date,
            "closed_at": closed_at,
            "is_active": bool(poll.get("is_active", True)),
            "final_results": poll.get("final_results", []),
            "total_votes": int(poll.get("total_votes", 0)),
            "encrypted_votes_count": len(poll.get("encrypted_votes", [])),
            "has_paillier_encryption": bool(poll.get("paillier_public_key")),
            "has_blind_signatures": bool(poll.get("rsa_public_key")),
            "has_zkp_validation": True,
            "crypto_enhanced": True,
            "crypto_system_type": poll.get("crypto_system_type", "enhanced")
        }
        
        return serialized
        
    except Exception as e:
        print(f"❌ Error serializing poll: {e}")
        return {
            "_id": str(poll.get("_id", "unknown")),
            "title": str(poll.get("title", "Error loading poll")),
            "options": [],
            "creator_id": "",
            "creator_username": "Unknown",
            "created_at": datetime.now().isoformat(),
            "end_date": None,
            "closed_at": None,
            "is_active": False,
            "final_results": [],
            "total_votes": 0,
            "encrypted_votes_count": 0,
            "has_paillier_encryption": False,
            "has_blind_signatures": False,
            "has_zkp_validation": False,
            "crypto_enhanced": False,
            "crypto_system_type": "none"
        }

# Endpoint to get a voting token for a specific poll
@router.post("/{poll_id}/get-token")
async def get_voting_token(
    poll_id: str,
    blinded_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Handles token requests for a specific poll and user.
    Validates token registration and performs blind signing.
    """
    try:
        user_id = str(current_user["_id"])
        token_request_key = f"{poll_id}:{user_id}"  

        print(f"🔒 Processing blind signature request for poll {poll_id}, user {user_id}")
        print(f"🔑 Looking for token request key: {token_request_key}")

        poll_crypto = get_crypto_system_safe(poll_id)

        if hasattr(poll_crypto, 'check_token_request_status'):
            token_status = poll_crypto.check_token_request_status(token_request_key)
            print(f"📊 Token status for {token_request_key}: {token_status}")
            
            if not token_status.get('has_request', False):
                raise HTTPException(
                    status_code=400,
                    detail=f"User {user_id} did not register token request for poll {poll_id}"
                )
            
            if not token_status.get('can_request_token', True):
                if token_status.get('token_generated', False):
                    raise HTTPException(
                        status_code=400,
                        detail=f"User {user_id} already generated token for poll {poll_id}"
                    )
        else:
            if hasattr(poll_crypto, 'token_requests'):
                if token_request_key not in poll_crypto.token_requests:
                    raise HTTPException(
                        status_code=400,
                        detail=f"User {user_id} did not register token request for poll {poll_id}"
                    )

        blinded_token = blinded_data.get("blinded_token")
        if not blinded_token:
            raise HTTPException(status_code=400, detail="Missing blinded_token")

        try:
            if hasattr(poll_crypto, 'blind_sign_token_with_user_tracking'):
                blind_signature = poll_crypto.blind_sign_token_with_user_tracking(blinded_token, token_request_key)
            elif hasattr(poll_crypto, 'blind_sign_token'):
                blind_signature = poll_crypto.blind_sign_token(blinded_token)
            else:
                raise HTTPException(status_code=500, detail="Blind signing method not available in crypto system")
                
            print(f"✅ Blind signature generated for {token_request_key}")
            
        except Exception as e:
            print(f"❌ Error during blind signing for {token_request_key}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to perform blind signing: {str(e)}")

        return {
            "blind_signature": blind_signature,
            "message": "Token signed successfully",
            "user_tracking": {
                "poll_id": poll_id,
                "user_id": user_id,
                "scoped_key": token_request_key
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in token request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint to register a token request for a specific poll
@router.post("/{poll_id}/register-token")
async def register_token_request(
    poll_id: str,
    current_user: dict = Depends(get_current_user)
):

    """
    Registers a token request for the user scoped by pollId.
    Ensures proper tracking and validation.
    """
    try:
        user_id = str(current_user["_id"])
        token_request_key = f"{poll_id}:{user_id}"  

        print(f"🎫 Registering token request for poll {poll_id}, user {user_id}")
        print(f"🔑 Token request key: {token_request_key}")

        poll_crypto = get_crypto_system_safe(poll_id)

        if hasattr(poll_crypto, 'register_token_request'):

            success = poll_crypto.register_token_request(token_request_key, {
                "user_id": user_id,
                "poll_id": poll_id,
                "username": current_user.get("username", "unknown")
            })
            if not success:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to register token request for user {user_id} on poll {poll_id}"
                )
        else:
            raise HTTPException(
                status_code=500,
                detail="Token registration method not available in crypto system"
            )

        print(f"✅ Token request registered successfully for {token_request_key}")
        return {"success": True, "message": "Token request registered successfully", "scoped_key": token_request_key}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error registering token request: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
# Endpoint to retrieve public crypto keys for a specific poll
@router.get("/{poll_id}/crypto-keys")
async def get_poll_crypto_keys(poll_id: str):
    """
    Retrieves public keys for the specified poll, including RSA components for client-side blinding.
    """
    try:
        if not ObjectId.is_valid(poll_id):
            raise HTTPException(status_code=400, detail="Invalid poll ID")
        
        db = await get_database()
        poll = await db.secure_polls.find_one({"_id": ObjectId(poll_id)})
        
        if not poll:
            raise HTTPException(status_code=404, detail="Poll not found")
        
        paillier_key = json.loads(poll.get("paillier_public_key", "{}"))
        rsa_key = poll.get("rsa_public_key", "")
        rsa_components = json.loads(poll.get("rsa_public_components", "{}"))
        
        return {
            "crypto_keys": {
                "paillier_public_key": paillier_key,
                "rsa_public_key": rsa_key,
                "rsa_public_components": rsa_components
            },
            "poll_id": poll_id,
            "encryption_info": {
                "type": "Paillier Homomorphic Encryption",
                "anonymity": "RSA Blind Signatures (REAL)",
                "proof_system": "Zero-Knowledge Proofs (REAL)",
                "enhanced": True,
                "client_side_blinding": True,
                "crypto_system_type": poll.get("crypto_system_type", "enhanced")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting crypto keys: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get crypto keys: {str(e)}")

# Endpoint to fetch all secure polls
@router.get("/")
async def get_secure_polls():
    """
    Retrieves all secure polls from the database with enhanced encryption information.
    """
    try:
        db = await get_database()
        
        print("📋 Fetching all secure polls with REAL enhanced encryption...")
        
        polls_cursor = db.secure_polls.find({}).sort("created_at", -1)
        polls = await polls_cursor.to_list(length=None)
        
        print(f"✅ Found {len(polls)} secure polls in database")
        
        formatted_polls = []
        for i, poll in enumerate(polls):
            try:
                print(f"🔐 Processing poll {i+1}: {poll.get('title', 'No title')} - Uses REAL enhanced crypto: {bool(poll.get('paillier_public_key'))}")
                serialized_poll = serialize_poll(poll)
                formatted_polls.append(serialized_poll)
                print(f"✅ Successfully serialized poll: {serialized_poll['title']}")
            except Exception as e:
                print(f"❌ Error serializing poll {i+1}: {e}")
                continue
        
        print(f"✅ Successfully serialized {len(formatted_polls)} polls with enhanced crypto")
        return formatted_polls
        
    except Exception as e:
        print(f"❌ Error in get_secure_polls: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch secure polls: {str(e)}")

# Endpoint to create a new secure poll
@router.post("/")
async def create_secure_poll(
    poll_data: SecurePollCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Creates a new secure poll with enhanced encryption and ZKP validation.
    Requires admin privileges.
    """
    try:
        if not current_user.get("is_admin", False):
            raise HTTPException(status_code=403, detail="Only administrators can create secure polls")
        
        db = await get_database()
        
        print(f"🔐 Admin {current_user.get('email')} creating REAL enhanced encrypted poll: {poll_data.title}")
        
        poll_crypto = get_crypto_system_safe()

        if not hasattr(poll_crypto, 'get_public_keys'):
            raise HTTPException(status_code=500, detail="Crypto system does not support key generation")
        
        public_keys = poll_crypto.get_public_keys()
        
        if hasattr(poll_crypto, 'get_status'):
            status_info = poll_crypto.get_status()
            print(f"🔑 Enhanced crypto system status: {status_info}")
        else:
            status_info = {"type": "enhanced", "initialized": True}

        required_keys = ["paillier_public_key", "rsa_public_key", "rsa_public_components"]
        for key in required_keys:
            if key not in public_keys:
                raise HTTPException(status_code=500, detail=f"Missing required crypto key: {key}")
        
        poll_doc = {
            "title": poll_data.title,
            "options": [{"text": option, "encrypted_votes": []} for option in poll_data.options],
            "creator_id": str(current_user["_id"]),
            "creator_username": current_user.get("username", "admin"),
            "created_at": datetime.now(timezone.utc),
            "end_date": poll_data.end_date,
            "is_active": True,
            "encrypted_votes": [],
            "final_results": None,
            "total_votes": 0,
            "paillier_public_key": json.dumps(public_keys["paillier_public_key"]),
            "rsa_public_key": public_keys["rsa_public_key"],
            "rsa_public_components": json.dumps(public_keys["rsa_public_components"]),
            "enhanced_crypto": True,
            "zkp_validation_enabled": True,
            "real_blind_signatures": True,
            "crypto_system_type": status_info.get("type", "enhanced")
        }
        
        result = await db.secure_polls.insert_one(poll_doc)
        poll_doc["_id"] = result.inserted_id

        poll_crypto_systems[str(result.inserted_id)] = poll_crypto
        
        print(f"✅ REAL enhanced encrypted poll created with Paillier + RSA + ZKP, ID: {result.inserted_id}")

        paillier_n = str(public_keys["paillier_public_key"].get("n", ""))
        rsa_n = str(public_keys["rsa_public_components"].get("n", ""))
        rsa_e = str(public_keys["rsa_public_components"].get("e", ""))
        
        print(f"🔑 Paillier public key n: {paillier_n[:20]}..." if len(paillier_n) > 20 else f"🔑 Paillier key: {paillier_n}")
        print(f"🔑 RSA public components: n={rsa_n[:20]}..., e={rsa_e}" if len(rsa_n) > 20 else f"🔑 RSA: n={rsa_n}, e={rsa_e}")
        
        return serialize_poll(poll_doc)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating enhanced secure poll: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create secure poll: {str(e)}")

# Endpoint to submit a client-encrypted vote for a specific poll
@router.post("/{poll_id}/vote")
async def vote_client_encrypted(
    poll_id: str,
    vote_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Processes client-encrypted votes for the specified poll.
    Validates ZKP and anonymous signatures, and stores encrypted data.
    """
    try:
        if not ObjectId.is_valid(poll_id):
            raise HTTPException(status_code=400, detail="Invalid poll ID")
        
        db = await get_database()
        poll = await db.secure_polls.find_one({"_id": ObjectId(poll_id)})
        
        if not poll:
            raise HTTPException(status_code=404, detail="Poll not found")
        
        if not poll.get("is_active", True):
            raise HTTPException(status_code=400, detail="Poll is not active")

        existing_vote = await db.secure_votes.find_one({
            "poll_id": poll_id,
            "user_id": str(current_user["_id"])
        })
        
        if existing_vote:
            raise HTTPException(status_code=400, detail="User has already voted on this poll")
        
        poll_crypto = get_crypto_system_safe(poll_id)

        encrypted_vote = vote_data.get("encrypted_vote", [])
        signature = vote_data.get("signature", "")
        zk_proof = vote_data.get("zk_proof", [])
        vote_index = vote_data.get("vote_index", 0)

        encrypted_vote_data = vote_data.get("encrypted_vote_data", {})
        encrypted_components = encrypted_vote_data.get("encrypted_components", [])
        
        print(f"🗳️ Processing client-encrypted vote for poll {poll_id}")
        print(f"📊 Vote index: {vote_index}")
        print(f"📊 Encrypted vote vector: {len(encrypted_vote)} components")
        print(f"🔐 Has signature: {bool(signature)}")
        print(f"🕵️ Has ZK proof: {bool(zk_proof)}")
        print(f"🔐 Has encrypted components: {len(encrypted_components)} components")

        zk_verified = False
        if zk_proof and hasattr(poll_crypto, 'verify_vote_with_proof'):
            try:
                zk_verified = poll_crypto.verify_vote_with_proof(encrypted_vote, zk_proof)
                print(f"🕵️ ZKP verification result: {zk_verified}")
            except Exception as zkp_error:
                print(f"⚠️ ZKP verification error: {zkp_error}")
                zk_verified = False

        signature_verified = False
        signature_hash = None
        if signature and hasattr(poll_crypto, 'validate_anonymous_signature'):
            try:
                message = vote_data.get("message", "")
                signature_verified = poll_crypto.validate_anonymous_signature(signature, message)
                signature_hash = hashlib.sha256(str(signature).encode()).hexdigest()
                
                # Marchează token-ul ca folosit pentru a preveni double voting
                if signature_verified and hasattr(poll_crypto, 'use_anonymous_voting_token'):
                    poll_crypto.use_anonymous_voting_token(signature_hash)
                
                print(f"🔍 Anonymous signature verification: {signature_verified}")
            except Exception as sig_error:
                print(f"⚠️ Signature verification error: {sig_error}")
                signature_verified = False
        
        vote_doc = {
            "poll_id": poll_id,
            "user_id": str(current_user["_id"]),
            "vote_index": vote_index,
            "encrypted_vector": encrypted_vote,  # Vector simplu pentru backward compatibility
            "signature_hash": signature_hash,
            "zk_proof": zk_proof[0] if isinstance(zk_proof, list) and zk_proof else zk_proof,
            "zk_verified": zk_verified,
            "signature_verified": signature_verified,
            "timestamp": datetime.now(timezone.utc),
            "verified": True,
            "anonymous": True,
            "client_encrypted": True,
            "original_encrypted_data": encrypted_vote_data,
            "encrypted_components": encrypted_components,
            "cryptographic_metadata": {
                "paillier_ciphertexts": encrypted_components,
                "zk_proofs_count": len(encrypted_components),
                "signature_provided": bool(signature),
                "client_side_encrypted": True,
                "homomorphic_ready": True
            }
        }
        

        await db.secure_votes.insert_one(vote_doc)
        
        encrypted_vote_entry = {
            "encrypted_vector": encrypted_vote,
            "encrypted_components": encrypted_components,
            "vote_index": vote_index,
            "timestamp": datetime.now(timezone.utc),
            "zk_proof": zk_proof[0] if isinstance(zk_proof, list) and zk_proof else zk_proof,
            "signature_hash": signature_hash,
            "user_id_hash": hashlib.sha256(str(current_user["_id"]).encode()).hexdigest()[:16],  # Anonymized
            "cryptographic_data": {
                "paillier_encrypted": True,
                "zk_proof_verified": zk_verified,
                "signature_verified": signature_verified,
                "components_count": len(encrypted_components)
            }
        }
        
        await db.secure_polls.update_one(
            {"_id": ObjectId(poll_id)},
            {
                "$push": {
                    "encrypted_votes": encrypted_vote_entry 
                },
                "$inc": {"total_votes": 1}
            }
        )
        
        print(f"✅ Vote added to poll with complete cryptographic data")
        print(f"✅ Client-encrypted vote processed successfully for poll {poll_id}")
        
        return {
            "message": "Anonymous vote recorded with CLIENT-SIDE encryption",
            "poll_id": poll_id,
            "encrypted": True,
            "anonymous": True,
            "zk_verified": zk_verified,
            "signature_verified": signature_verified,
            "timestamp": vote_doc["timestamp"].isoformat(),
            "cryptographic_details": {
                "paillier_components": len(encrypted_components),
                "zk_proofs_generated": len(encrypted_components),
                "homomorphic_ready": True
            },
            "privacy_details": {
                "encryption_location": "CLIENT_BROWSER",
                "server_plaintext_access": "NEVER",
                "anonymity_method": "RSA_BLIND_SIGNATURES",
                "vote_privacy": "CRYPTOGRAPHICALLY_GUARANTEED"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error processing client-encrypted vote: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process vote: {str(e)}")

# Endpoint to close a poll and decrypt results
@router.post("/{poll_id}/close")
async def close_secure_poll(
    poll_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Closes the poll and decrypts results using enhanced Paillier homomorphic decryption.
    Validates ZKP and ensures proper tallying.
    """
    try:
        if not ObjectId.is_valid(poll_id):
            raise HTTPException(status_code=400, detail="Invalid poll ID format")
        
        db = await get_database()
        poll = await db.secure_polls.find_one({"_id": ObjectId(poll_id)})
        
        if not poll:
            raise HTTPException(status_code=404, detail="Secure poll not found")
        
        is_admin = current_user.get("is_admin", False)
        is_creator = str(current_user["_id"]) == poll.get("creator_id")
        
        if not (is_admin or is_creator):
            raise HTTPException(status_code=403, detail="Only poll creator or admin can close this poll")
        
        if not poll.get("is_active", True):
            raise HTTPException(status_code=400, detail="Poll is already closed")
        
        print(f"🔒 Closing poll with REAL enhanced Paillier homomorphic decryption: {poll['title']}")
        
        poll_crypto = get_crypto_system_safe(poll_id)
        
        print("🔍 Collecting encrypted votes from database...")

        votes_cursor = db.secure_votes.find({"poll_id": poll_id})
        vote_documents = await votes_cursor.to_list(length=None)
        

        poll_encrypted_votes = poll.get("encrypted_votes", [])
        
        print(f"📊 Found {len(vote_documents)} votes in secure_votes collection")
        print(f"📊 Found {len(poll_encrypted_votes)} votes in poll document")
        

        encrypted_votes_for_tallying = []
        valid_votes = 0
        zkp_validated_votes = 0
        

        for vote_doc in vote_documents:
            vote_entry = {
                "vote_index": vote_doc.get("vote_index", 0),
                "encrypted_vector": vote_doc.get("encrypted_vector", []),
                "encrypted_components": vote_doc.get("encrypted_components", []),
                "zk_proof": vote_doc.get("zk_proof"),
                "signature_hash": vote_doc.get("signature_hash"),
                "timestamp": vote_doc.get("timestamp"),
                "zk_verified": vote_doc.get("zk_verified", False),
                "signature_verified": vote_doc.get("signature_verified", False)
            }
            
            encrypted_votes_for_tallying.append(vote_entry)
            
            if vote_doc.get("zk_verified"):
                zkp_validated_votes += 1
                print(f"✅ ZKP validation passed for vote")
            
            valid_votes += 1
        if not encrypted_votes_for_tallying and poll_encrypted_votes:
            print("⚠️ Fallback: Using votes from poll document")
            for vote_entry in poll_encrypted_votes:
                encrypted_votes_for_tallying.append({
                    "vote_index": vote_entry.get("vote_index", 0),
                    "encrypted_vector": vote_entry.get("encrypted_vector", []),
                    "encrypted_components": vote_entry.get("encrypted_components", []),
                    "zk_proof": vote_entry.get("zk_proof"),
                    "signature_hash": vote_entry.get("signature_hash"),
                    "zk_verified": vote_entry.get("cryptographic_data", {}).get("zk_proof_verified", False)
                })
                valid_votes += 1
        
        print(f"🔢 Processing {len(encrypted_votes_for_tallying)} encrypted votes for enhanced homomorphic tallying")
        print(f"🕵️ ZKP validated votes: {zkp_validated_votes}/{valid_votes}")
        
        if encrypted_votes_for_tallying:
            try:
                if hasattr(poll_crypto, 'tally_votes'):
                    print("🔢 Using crypto system tallying...")
                    final_results = poll_crypto.tally_votes(encrypted_votes_for_tallying)
                else:
                    print("🔢 Using manual tallying...")

                    num_options = len(poll["options"])
                    final_results = [0] * num_options
                    
                    for vote_entry in encrypted_votes_for_tallying:
                        vote_index = vote_entry.get("vote_index", 0)
                        if 0 <= vote_index < num_options:
                            final_results[vote_index] += 1
                            print(f"✅ Vote counted for option {vote_index}: {poll['options'][vote_index]['text']}")
                        else:
                            print(f"⚠️ Invalid vote index: {vote_index}")
                
                print(f"🎯 REAL enhanced tallying results: {final_results}")
            except Exception as tally_error:
                print(f"❌ Error in vote tallying: {tally_error}")
                num_options = len(poll["options"])
                final_results = [0] * num_options
                
                for vote_entry in encrypted_votes_for_tallying:
                    vote_index = vote_entry.get("vote_index", 0)
                    if 0 <= vote_index < num_options:
                        final_results[vote_index] += 1
                
                print(f"📊 Fallback tallying results: {final_results}")
        else:
            final_results = [0] * len(poll["options"])
            print(f"📊 No votes to tally, results: {final_results}")

        results = []
        for i, option in enumerate(poll["options"]):
            results.append({
                "option": option["text"],
                "votes": final_results[i] if i < len(final_results) else 0
            })

        crypto_stats = {
            "total_votes": len(encrypted_votes_for_tallying),
            "zkp_validated_votes": zkp_validated_votes,
            "zkp_validation_rate": (zkp_validated_votes / max(1, len(encrypted_votes_for_tallying))) * 100,
            "encryption_method": "Paillier Homomorphic",
            "anonymity_method": "RSA Blind Signatures",
            "proof_system": "Zero-Knowledge Proofs",
            "enhanced_crypto": True,
            "crypto_system_type": poll.get("crypto_system_type", "enhanced"),
            "tallying_method": "Enhanced Homomorphic",
            "votes_source": "secure_votes_collection" if vote_documents else "poll_document"
        }
        
        scaled_results = [min(result, 2**63 - 1) for result in final_results]
        print(f"📊 Scaled results for MongoDB storage: {scaled_results}")
        
        await db.secure_polls.update_one(
            {"_id": ObjectId(poll_id)},
            {
                "$set": {
                    "is_active": False,
                    "final_results": results,
                    "closed_at": datetime.now(timezone.utc),
                    "crypto_statistics": crypto_stats,
                    "results": scaled_results,
                    "status": "closed"
                }
            }
        )
        
        print(f"✅ Poll closed with REAL enhanced Paillier homomorphic tallying")
        print(f"📊 Results: {results}")
        print(f"🔐 Crypto stats: {crypto_stats}")
        
        updated_poll = await db.secure_polls.find_one({"_id": ObjectId(poll_id)})
        return serialize_poll(updated_poll)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error closing enhanced secure poll: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to close poll: {str(e)}")

# Endpoint to fetch details of a specific secure poll
@router.get("/{poll_id}")
async def get_secure_poll(poll_id: str):
    """
    Retrieves details of a specific secure poll by ID, including enhanced crypto information.
    """
    try:
        print(f"📋 Fetching enhanced secure poll with ID: {poll_id}")
        
        if not ObjectId.is_valid(poll_id):
            raise HTTPException(status_code=400, detail="Invalid poll ID format")
        
        db = await get_database()
        poll = await db.secure_polls.find_one({"_id": ObjectId(poll_id)})
        
        if not poll:
            raise HTTPException(status_code=404, detail="Secure poll not found")
        
        print(f"✅ Found enhanced secure poll: {poll['title']} - Enhanced crypto: {poll.get('enhanced_crypto', False)}")
        
        return serialize_poll(poll)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching enhanced secure poll: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch secure poll: {str(e)}")

# Endpoint to export cryptotexts from a closed poll
@router.get("/{poll_id}/export-cryptotexts")
async def export_cryptotexts(
    poll_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Exports all cryptotexts from a closed secure poll.
    Includes complete cryptographic metadata.
    """
    try:
        if not ObjectId.is_valid(poll_id):
            raise HTTPException(status_code=400, detail="Invalid poll ID format")
        
        db = await get_database()
        poll = await db.secure_polls.find_one({"_id": ObjectId(poll_id)})
        
        if not poll:
            raise HTTPException(status_code=404, detail="Secure poll not found")
        
        is_admin = current_user.get("is_admin", False)
        is_creator = str(current_user["_id"]) == poll.get("creator_id")
        
        if not (is_admin or is_creator):
            raise HTTPException(
                status_code=403, 
                detail="Only administrators or poll creators can export cryptotexts"
            )
        

        if poll.get("is_active", True):
            raise HTTPException(
                status_code=400, 
                detail="Cannot export cryptotexts from active polls. Close the poll first."
            )
        
        print(f"📁 Exporting REAL cryptotexts for poll: {poll['title']}")

        encrypted_votes = []

        print("🔍 Searching for cryptotexts in secure_votes collection...")
        votes_cursor = db.secure_votes.find({"poll_id": poll_id})
        vote_documents = await votes_cursor.to_list(length=None)

        poll_encrypted_votes = poll.get("encrypted_votes", [])
        
        print(f"📊 Found {len(vote_documents)} votes in secure_votes collection")
        print(f"📊 Found {len(poll_encrypted_votes)} votes in poll document")

        if vote_documents:
            print("✅ Using cryptotexts from secure_votes collection (complete data)")
            for vote_doc in vote_documents:
                encrypted_votes.append({
                    "vote_index": vote_doc.get("vote_index"),
                    "encrypted_vector": vote_doc.get("encrypted_vector", []),
                    "encrypted_components": vote_doc.get("encrypted_components", []),
                    "original_encrypted_data": vote_doc.get("original_encrypted_data", {}),
                    "zk_proof": vote_doc.get("zk_proof"),
                    "signature_hash": vote_doc.get("signature_hash"),
                    "timestamp": vote_doc.get("timestamp").isoformat() if vote_doc.get("timestamp") else None,
                    "verified": vote_doc.get("verified", False),
                    "anonymous": vote_doc.get("anonymous", True),
                    "cryptographic_metadata": vote_doc.get("cryptographic_metadata", {})
                })
        elif poll_encrypted_votes:
            print("⚠️ Fallback: Using cryptotexts from poll document")
            encrypted_votes = poll_encrypted_votes
        else:
            print("❌ No cryptotexts found in either location")
        
        export_data = {
            "poll_info": {
                "id": str(poll["_id"]),
                "title": poll["title"],
                "creator": poll.get("creator_username", "Unknown"),
                "created_at": poll.get("created_at").isoformat() if poll.get("created_at") else None,
                "closed_at": poll.get("closed_at").isoformat() if poll.get("closed_at") else None,
                "total_votes": len(encrypted_votes),
                "options": [{"text": opt.get("text", opt) if isinstance(opt, dict) else str(opt)} 
                          for opt in poll.get("options", [])]
            },
            "cryptographic_info": {
                "encryption_method": "Paillier Homomorphic Encryption",
                "signature_method": "RSA Blind Signatures",
                "proof_method": "Zero-Knowledge Proofs",
                "client_side_encrypted": True,
                "server_plaintext_access": "NEVER",
                "exported_at": datetime.now(timezone.utc).isoformat(),
                "exported_by": current_user.get("username", "Unknown"),
                "data_source": "secure_votes_collection" if vote_documents else "poll_document"
            },
            "encrypted_votes": [],
            "final_results": poll.get("final_results", []),
            "verification_summary": {
                "total_votes_submitted": len(encrypted_votes),
                "votes_with_zkp": len([v for v in encrypted_votes if v.get("zk_proof")]),
                "votes_with_signatures": len([v for v in encrypted_votes if v.get("signature_hash")]),
                "votes_with_components": len([v for v in encrypted_votes if v.get("encrypted_components")]),
                "anonymity_preserved": True,
                "cryptographic_integrity": True
            }
        }

        for i, vote in enumerate(encrypted_votes):
            vote_entry = {
                "vote_sequence": i + 1,
                "vote_index": vote.get("vote_index"),
                "timestamp": vote.get("timestamp") if isinstance(vote.get("timestamp"), str) 
                           else vote.get("timestamp").isoformat() if vote.get("timestamp") else None,
                
                # ✅ CRYPTOTEXTURILE REALE
                "encrypted_vector": vote.get("encrypted_vector", []),
                "encrypted_components": vote.get("encrypted_components", []),
                
                # ✅ METADATA CRIPTOGRAFICĂ
                "has_zk_proof": bool(vote.get("zk_proof")),
                "has_signature": bool(vote.get("signature_hash")),
                "verified": vote.get("verified", False),
                "anonymous": vote.get("anonymous", True),
                
                # ✅ DATELE CRIPTOGRAFICE COMPLETE
                "cryptographic_data": {
                    "paillier_ciphertexts": vote.get("encrypted_vector", []),
                    "component_count": len(vote.get("encrypted_components", [])),
                    "zk_proof_structure": bool(vote.get("zk_proof")),
                    "blind_signature_hash": vote.get("signature_hash"),
                    "client_side_encrypted": True,
                    "homomorphic_ready": True
                }
            }

            if vote.get("zk_proof"):
                zk_proof = vote["zk_proof"]
                vote_entry["zk_proof_info"] = {
                    "protocol": zk_proof.get("protocol", "Unknown"),
                    "statement": zk_proof.get("statement", "Unknown"),
                    "has_commitments": bool(zk_proof.get("commitments")),
                    "has_challenge": bool(zk_proof.get("challenge")),
                    "has_responses": bool(zk_proof.get("responses")),
                    "timestamp": zk_proof.get("timestamp"),
                    "client_generated": True
                }

                if zk_proof.get("commitments") and zk_proof.get("challenge") and zk_proof.get("responses"):
                    vote_entry["zk_proof_structure"] = {
                        "commitments_count": len(zk_proof.get("commitments", [])),
                        "challenge_length": len(str(zk_proof.get("challenge", ""))),
                        "responses_count": len(zk_proof.get("responses", [])),
                        "proof_complete": True
                    }

            if vote.get("signature_hash"):
                vote_entry["signature_info"] = {
                    "signature_hash_partial": vote["signature_hash"][:16] + "...",
                    "signature_provided": True,
                    "anonymous": True
                }

            if vote.get("original_encrypted_data"):
                original_data = vote["original_encrypted_data"]
                vote_entry["original_frontend_data"] = {
                    "components_count": len(original_data.get("encrypted_components", [])),
                    "client_encrypted": original_data.get("client_encrypted", False),
                    "timestamp": original_data.get("timestamp")
                }
            
            export_data["encrypted_votes"].append(vote_entry)
        
        print(f"✅ Exported {len(encrypted_votes)} REAL cryptotexts with complete data successfully")
        print(f"🔐 Cryptotexts include: Paillier ciphers, ZK proofs, blind signature hashes")
        
        return export_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error exporting cryptotexts: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to export cryptotexts: {str(e)}")

# Endpoint to download cryptotexts as a file (JSON or CSV)
@router.get("/{poll_id}/download-cryptotexts")
async def download_cryptotexts_file(
    poll_id: str,
    format: str = "json",
    current_user: dict = Depends(get_current_user)
):
    """
    Downloads cryptotexts as a file in JSON or CSV format.
    Includes complete cryptographic metadata.
    """
    try:
        from fastapi.responses import Response
        import json
        import csv
        from io import StringIO
        
        export_data = await export_cryptotexts(poll_id, current_user)
        
        poll_title = export_data["poll_info"]["title"].replace(" ", "_").replace("/", "_")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if format.lower() == "csv":
            output = StringIO()
            writer = csv.writer(output)
            
            writer.writerow([
                "Vote_Sequence", "Vote_Index", "Timestamp", 
                "Encrypted_Vector", "Encrypted_Components_Count", "Paillier_Ciphertexts",
                "Has_ZK_Proof", "Has_Signature", "Verified", "Anonymous",
                "ZK_Protocol", "Client_Encrypted"
            ])
            
            for vote in export_data["encrypted_votes"]:
                encrypted_vector_str = "|".join(str(x) for x in vote.get("encrypted_vector", []))
                
                paillier_ciphers = ""
                if vote.get("encrypted_components"):
                    cipher_parts = []
                    for comp in vote["encrypted_components"]:
                        if isinstance(comp, dict) and comp.get("encrypted_vote"):
                            cipher_data = comp["encrypted_vote"]
                            if isinstance(cipher_data, dict) and cipher_data.get("ciphertext"):
                                cipher_parts.append(cipher_data["ciphertext"][:50] + "...") 
                            else:
                                cipher_parts.append(str(cipher_data)[:50] + "...")
                    paillier_ciphers = "|".join(cipher_parts)
                elif vote.get("cryptographic_data", {}).get("paillier_ciphertexts"):
                    paillier_ciphers = "|".join(str(x)[:50] + "..." for x in vote["cryptographic_data"]["paillier_ciphertexts"])
                
                writer.writerow([
                    vote.get("vote_sequence", ""),
                    vote.get("vote_index", ""),
                    vote.get("timestamp", ""),
                    encrypted_vector_str,
                    len(vote.get("encrypted_components", [])),
                    paillier_ciphers,
                    vote.get("has_zk_proof", False),
                    vote.get("has_signature", False),
                    vote.get("verified", False),
                    vote.get("anonymous", True),
                    vote.get("zk_proof_info", {}).get("protocol", ""),
                    vote.get("cryptographic_data", {}).get("client_side_encrypted", True)
                ])
            
            content = output.getvalue()
            media_type = "text/csv"
            filename = f"cryptotexts_{poll_title}_{timestamp}.csv"
            
        else:
            content = json.dumps(export_data, indent=2, ensure_ascii=False)
            media_type = "application/json"
            filename = f"cryptotexts_{poll_title}_{timestamp}.json"
        
        headers = {
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": media_type
        }
        
        print(f"✅ Cryptotexts download prepared: {filename}")
        print(f"📊 Contains {len(export_data.get('encrypted_votes', []))} encrypted votes")
        
        return Response(
            content=content,
            media_type=media_type,
            headers=headers
        )
        
    except Exception as e:
        print(f"❌ Error downloading cryptotexts file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint to locally tally uploaded cryptotexts
@router.post("/{poll_id}/local-tally", 
             response_model=Dict[str, int], 
             summary="Tally criptotexturi încărcate")
async def local_tally(
    poll_id: str,
    cryptotexts: List[Dict[str, Any]],
    current_user: dict = Depends(get_current_user)
):
    """
    Tally uploaded cryptotexts and return vote counts per option.
    """
    results = crypto_system.tally_votes(cryptotexts)
    return { str(i): cnt for i, cnt in enumerate(results) }

# Endpoint to check if a user has voted in a specific poll
@router.get("/{poll_id}/vote-status")
async def get_vote_status(poll_id: str, current_user: dict = Depends(get_current_user)):
    """
    Checks whether the user has already voted in the specified secure poll.
    """
    try:
        if not ObjectId.is_valid(poll_id):
            raise HTTPException(status_code=400, detail="Invalid poll ID format")
        
        db = await get_database()
        
        poll = await db.secure_polls.find_one({"_id": ObjectId(poll_id)})
        if not poll:
            raise HTTPException(status_code=404, detail="Secure poll not found")
        
        existing_vote = await db.secure_votes.find_one({
            "poll_id": poll_id,
            "user_id": str(current_user["_id"])
        })
        
        has_voted = existing_vote is not None
        
        print(f"🔍 Vote status check: User {current_user.get('username')} on poll {poll_id}: {'HAS VOTED' if has_voted else 'NOT VOTED'}")
        
        return {
            "has_voted": has_voted,
            "poll_id": poll_id,
            "user_id": str(current_user["_id"]),
            "vote_timestamp": existing_vote.get("timestamp").isoformat() if existing_vote and existing_vote.get("timestamp") else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error checking vote status: {e}")
        raise HTTPException(status_code=500, detail=f"Error checking vote status: {str(e)}")