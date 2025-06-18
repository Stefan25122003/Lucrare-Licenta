# routers/polls.py - FIXED cu transformarea corectă a datelor
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models import PollCreate, PollResponse, VoteRequest, MessageResponse, PollStatistics, UserVoteStats, DemographicBreakdown, PollAnalytics
from database import get_database
from datetime import datetime
from bson import ObjectId
from .auth import get_current_user
from collections import defaultdict, Counter

router = APIRouter(prefix="/polls", tags=["polls"])

# async def transform_poll_document(poll_doc, db):
#     """Transformă un document din MongoDB în PollResponse"""
#     if not poll_doc:
#         return None
    
#     # Găsește username-ul creatorului
#     creator = await db.users.find_one({"_id": ObjectId(poll_doc["created_by"])})
#     creator_username = creator["username"] if creator else "Unknown"
    
#     # Calculează total voturi
#     total_votes = sum(option.get("votes", 0) for option in poll_doc.get("options", []))
    
#     return PollResponse(
#         id=str(poll_doc["_id"]),
#         title=poll_doc["title"],
#         options=poll_doc.get("options", []),
#         creator_id=str(poll_doc["created_by"]),
#         creator_username=creator_username,
#         created_at=poll_doc["created_at"],
#         end_date=poll_doc.get("end_date"),
#         is_active=poll_doc.get("is_active", True),
#         total_votes=total_votes
#     )
async def transform_poll_document(poll_doc, db, current_user_id=None):
    """Transformă un document din MongoDB în PollResponse"""
    if not poll_doc:
        return None
    
    # Găsește username-ul creatorului
    creator = await db.users.find_one({"_id": ObjectId(poll_doc["created_by"])})
    creator_username = creator["username"] if creator else "Unknown"
    
    # Calculează total voturi
    total_votes = sum(option.get("votes", 0) for option in poll_doc.get("options", []))
    
    # Verifică dacă utilizatorul curent a votat
    user_has_voted = False
    if current_user_id:
        user_has_voted = ObjectId(current_user_id) in poll_doc.get("voters", [])
    
    return PollResponse(
        id=str(poll_doc["_id"]),
        title=poll_doc["title"],
        options=poll_doc.get("options", []),
        creator_id=str(poll_doc["created_by"]),
        creator_username=creator_username,
        created_at=poll_doc["created_at"],
        end_date=poll_doc.get("end_date"),
        is_active=poll_doc.get("is_active", True),
        total_votes=total_votes,
        user_has_voted=user_has_voted
    )

@router.get("/", response_model=List[PollResponse])
async def get_polls():
    """Obține toate sondajele active"""
    try:
        db = await get_database()
        
        # Găsește toate sondajele active
        # polls_cursor = db.polls.find({"is_active": True}).sort("created_at", -1)
        polls_cursor = db.polls.find({}).sort("created_at", -1)
        polls_docs = await polls_cursor.to_list(length=100)
        
        # Transformă fiecare document
        polls = []
        for poll_doc in polls_docs:
            transformed_poll = await transform_poll_document(poll_doc, db)
            if transformed_poll:
                polls.append(transformed_poll)
        
        print(f"✅ Found {len(polls)} active polls")
        return polls
        
    except Exception as e:
        print(f"❌ Error fetching polls: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Eroare la încărcarea sondajelor"
        )

@router.get("/{poll_id}", response_model=PollResponse)
async def get_poll(poll_id: str):
    """Obține un sondaj specific"""
    try:
        db = await get_database()
        
        # Validează ObjectId
        if not ObjectId.is_valid(poll_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID-ul sondajului este invalid"
            )
        
        poll_doc = await db.polls.find_one({"_id": ObjectId(poll_id)})
        
        if not poll_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sondajul nu a fost găsit"
            )
        
        poll = await transform_poll_document(poll_doc, db)
        return poll
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching poll {poll_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Eroare la încărcarea sondajului"
        )

@router.post("/", response_model=PollResponse)
async def create_poll(poll_data: PollCreate, current_user: dict = Depends(get_current_user)):
    """Creează un sondaj nou"""
    try:
        db = await get_database()
        
        # Validează datele
        if not poll_data.title.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Titlul este obligatoriu"
            )
        
        if len(poll_data.options) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sunt necesare cel puțin 2 opțiuni"
            )
        
        # Verifică opțiunile duplicate
        unique_options = list(set(opt.strip() for opt in poll_data.options if opt.strip()))
        if len(unique_options) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Trebuie să ai cel puțin 2 opțiuni unice"
            )
        
        # Creează structura pentru opțiuni
        options = [{"text": opt, "votes": 0} for opt in unique_options]
        
        # Document pentru MongoDB
        poll_doc = {
            "title": poll_data.title.strip(),
            "options": options,
            "created_by": ObjectId(current_user["_id"]),
            "created_at": datetime.utcnow(),
            "end_date": poll_data.end_date,
            "is_active": True,
            "voters": []  # Lista utilizatorilor care au votat
        }
        
        # Inserează în baza de date
        result = await db.polls.insert_one(poll_doc)
        
        # Returnează sondajul creat
        created_poll_doc = await db.polls.find_one({"_id": result.inserted_id})
        poll = await transform_poll_document(created_poll_doc, db)
        
        print(f"✅ Poll created: {poll.title} by {current_user['username']}")
        return poll
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating poll: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Eroare la crearea sondajului"
        )

@router.post("/{poll_id}/vote", response_model=MessageResponse)
async def vote_on_poll(poll_id: str, vote_data: VoteRequest, current_user: dict = Depends(get_current_user)):
    """Votează într-un sondaj"""
    try:
        db = await get_database()
        
        # Validează ObjectId
        if not ObjectId.is_valid(poll_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID-ul sondajului este invalid"
            )
        
        poll_doc = await db.polls.find_one({"_id": ObjectId(poll_id)})
        
        if not poll_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sondajul nu a fost găsit"
            )
        
        # Verifică dacă sondajul este activ
        if not poll_doc.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Acest sondaj nu mai este activ"
            )
        
        # Verifică dacă utilizatorul a votat deja
        user_id = ObjectId(current_user["_id"])
        if user_id in poll_doc.get("voters", []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ai votat deja în acest sondaj"
            )
        
        # Validează index-ul opțiunii
        if vote_data.option_index < 0 or vote_data.option_index >= len(poll_doc["options"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Opțiunea selectată este invalidă"
            )
        
        # Actualizează votul și adaugă utilizatorul la lista de votanți
        await db.polls.update_one(
            {"_id": ObjectId(poll_id)},
            {
                "$inc": {f"options.{vote_data.option_index}.votes": 1},
                "$push": {"voters": user_id}
            }
        )
        
        print(f"✅ Vote recorded: User {current_user['username']} voted option {vote_data.option_index} in poll {poll_id}")
        
        return MessageResponse(message="Votul tău a fost înregistrat cu succes!")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error voting in poll {poll_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Eroare la înregistrarea votului"
        )

@router.delete("/{poll_id}", response_model=MessageResponse)
async def delete_poll(poll_id: str, current_user: dict = Depends(get_current_user)):
    """Șterge un sondaj (doar creatorul sau admin)"""
    try:
        db = await get_database()
        
        # Validează ObjectId
        if not ObjectId.is_valid(poll_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID-ul sondajului este invalid"
            )
        
        poll_doc = await db.polls.find_one({"_id": ObjectId(poll_id)})
        
        if not poll_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sondajul nu a fost găsit"
            )
        
        # Verifică permisiunile (creator sau admin)
        user_id = ObjectId(current_user["_id"])
        is_creator = poll_doc["created_by"] == user_id
        is_admin = current_user.get("is_admin", False)
        
        if not (is_creator or is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Nu ai permisiunea să ștergi acest sondaj"
            )
        
        # Șterge sondajul
        await db.polls.delete_one({"_id": ObjectId(poll_id)})
        
        print(f"✅ Poll deleted: {poll_doc['title']} by {current_user['username']}")
        
        return MessageResponse(message="Sondajul a fost șters cu succes!")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting poll {poll_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Eroare la ștergerea sondajului"
        )

@router.put("/{poll_id}/close", response_model=MessageResponse)
async def close_poll(poll_id: str, current_user: dict = Depends(get_current_user)):
    """Închide un sondaj (doar creatorul sau admin)"""
    try:
        db = await get_database()
        
        # Validează ObjectId
        if not ObjectId.is_valid(poll_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID-ul sondajului este invalid"
            )
        
        poll_doc = await db.polls.find_one({"_id": ObjectId(poll_id)})
        
        if not poll_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sondajul nu a fost găsit"
            )
        
        # Verifică permisiunile (creator sau admin)
        user_id = ObjectId(current_user["_id"])
        is_creator = poll_doc["created_by"] == user_id
        is_admin = current_user.get("is_admin", False)
        
        if not (is_creator or is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Nu ai permisiunea să închizi acest sondaj"
            )
        
        # Închide sondajul
        await db.polls.update_one(
            {"_id": ObjectId(poll_id)},
            {"$set": {"is_active": False}}
        )
        
        print(f"✅ Poll closed: {poll_doc['title']} by {current_user['username']}")
        
        return MessageResponse(message="Sondajul a fost închis cu succes!")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error closing poll {poll_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Eroare la închiderea sondajului"
        )

async def calculate_poll_statistics(poll_doc, db):
    """Calculează statistici detaliate pentru un sondaj"""
    try:
        poll_id = str(poll_doc["_id"])
        voters = poll_doc.get("voters", [])
        
        # Obține informații complete despre votanți
        user_votes = []
        demographic_data = {
            "ages": [],
            "cities": [],
            "age_groups": defaultdict(int),
            "city_counts": defaultdict(int)
        }
        
        # Pentru fiecare votant, găsește detaliile și opțiunea votată
        for i, voter_id in enumerate(voters):
            user = await db.users.find_one({"_id": voter_id})
            if user:
                # Găsește ce opțiune a votat (prin ordinea în care a votat)
                vote_option_index = i % len(poll_doc["options"])  # Simplificat - în realitate ai nevoie de o structură mai bună
                
                user_vote = UserVoteStats(
                    user_id=str(user["_id"]),
                    username=user.get("username", "Unknown"),
                    first_name=user.get("first_name"),
                    last_name=user.get("last_name"),
                    city=user.get("city"),
                    age=user.get("age"),
                    vote_option_index=vote_option_index,
                    vote_option_text=poll_doc["options"][vote_option_index]["text"],
                    voted_at=poll_doc.get("created_at", datetime.utcnow())  # Simplificat
                )
                user_votes.append(user_vote)
                
                # Colectează date demografice
                if user.get("age"):
                    age = user["age"]
                    demographic_data["ages"].append(age)
                    
                    # Grupuri de vârstă
                    if age < 18:
                        demographic_data["age_groups"]["<18"] += 1
                    elif age < 25:
                        demographic_data["age_groups"]["18-24"] += 1
                    elif age < 35:
                        demographic_data["age_groups"]["25-34"] += 1
                    elif age < 50:
                        demographic_data["age_groups"]["35-49"] += 1
                    else:
                        demographic_data["age_groups"]["50+"] += 1
                
                if user.get("city"):
                    city = user["city"]
                    demographic_data["cities"].append(city)
                    demographic_data["city_counts"][city] += 1
        
        # Calculează distribuția voturilor
        vote_distribution = []
        for i, option in enumerate(poll_doc["options"]):
            vote_distribution.append({
                "option_index": i,
                "option_text": option["text"],
                "votes": option["votes"],
                "percentage": (option["votes"] / max(1, len(voters))) * 100
            })
        
        # Statistici demografice
        total_votes = len(voters)
        demographic_stats = {
            "total_votes": total_votes,
            "average_age": sum(demographic_data["ages"]) / max(1, len(demographic_data["ages"])) if demographic_data["ages"] else 0,
            "age_range": {
                "min": min(demographic_data["ages"]) if demographic_data["ages"] else 0,
                "max": max(demographic_data["ages"]) if demographic_data["ages"] else 0
            },
            "unique_cities": len(demographic_data["city_counts"]),
            "most_active_city": max(demographic_data["city_counts"].items(), key=lambda x: x[1])[0] if demographic_data["city_counts"] else "N/A"
        }
        
        # Engagement metrics
        engagement_metrics = {
            "participation_rate": (total_votes / 100) * 100,  # Placeholder - ai nevoie de total utilizatori activi
            "completion_rate": 100.0,  # Pentru sondaje simple e 100%
            "average_time_to_vote": "Instantan",  # Placeholder
            "most_popular_option": max(poll_doc["options"], key=lambda x: x["votes"])["text"] if poll_doc["options"] else "N/A"
        }
        
        statistics = PollStatistics(
            poll_id=poll_id,
            poll_title=poll_doc["title"],
            total_votes=total_votes,
            vote_distribution=vote_distribution,
            demographic_stats=demographic_stats,
            city_distribution=dict(demographic_data["city_counts"]),
            age_distribution=dict(demographic_data["age_groups"]),
            voting_timeline=[],  # Placeholder - ai nevoie de timestamp-uri pentru voturi
            engagement_metrics=engagement_metrics
        )
        
        return statistics, user_votes
        
    except Exception as e:
        print(f"❌ Error calculating statistics: {e}")
        return None, []

@router.get("/{poll_id}/statistics", response_model=PollAnalytics)
async def get_poll_statistics(poll_id: str, current_user: dict = Depends(get_current_user)):
    """Obține statistici detaliate pentru un sondaj"""
    try:
        db = await get_database()
        
        # Validează ObjectId
        if not ObjectId.is_valid(poll_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID-ul sondajului este invalid"
            )
        
        poll_doc = await db.polls.find_one({"_id": ObjectId(poll_id)})
        
        if not poll_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sondajul nu a fost găsit"
            )
        
        # Verifică permisiunile (creator sau admin)
        user_id = ObjectId(current_user["_id"])
        is_creator = poll_doc["created_by"] == user_id
        is_admin = current_user.get("is_admin", False)
        
        if not (is_creator or is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Nu ai permisiunea să vezi statisticile acestui sondaj"
            )
        
        # Obține informații despre sondaj
        poll_info = await transform_poll_document(poll_doc, db)
        
        # Calculează statistici
        statistics, user_votes = await calculate_poll_statistics(poll_doc, db)
        
        if not statistics:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Eroare la calcularea statisticilor"
            )
        
        # Generează breakdown demografic pe opțiuni
        demographic_breakdown = []
        for i, option in enumerate(poll_doc["options"]):
            option_voters = [uv for uv in user_votes if uv.vote_option_index == i]
            
            age_groups = defaultdict(int)
            cities = defaultdict(int)
            
            for voter in option_voters:
                if voter.age:
                    if voter.age < 18:
                        age_groups["<18"] += 1
                    elif voter.age < 25:
                        age_groups["18-24"] += 1
                    elif voter.age < 35:
                        age_groups["25-34"] += 1
                    elif voter.age < 50:
                        age_groups["35-49"] += 1
                    else:
                        age_groups["50+"] += 1
                
                if voter.city:
                    cities[voter.city] += 1
            
            breakdown = DemographicBreakdown(
                option_index=i,
                option_text=option["text"],
                votes=option["votes"],
                percentage=(option["votes"] / max(1, statistics.total_votes)) * 100,
                age_groups=dict(age_groups),
                cities=dict(cities),
                gender_distribution={}  # Placeholder
            )
            demographic_breakdown.append(breakdown)
        
        # Generează insights automate
        insights = generate_poll_insights(statistics, demographic_breakdown)
        
        analytics = PollAnalytics(
            poll_info=poll_info,
            statistics=statistics,
            user_votes=user_votes,
            demographic_breakdown=demographic_breakdown,
            insights=insights
        )
        
        print(f"✅ Statistics generated for poll {poll_id}")
        return analytics
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting poll statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Eroare la obținerea statisticilor"
        )

def generate_poll_insights(statistics: PollStatistics, breakdown: List[DemographicBreakdown]) -> List[str]:
    """Generează insights automate bazate pe statistici"""
    insights = []
    
    try:
        # Insight despre participare
        if statistics.total_votes > 0:
            insights.append(f"🗳️ Sondajul a primit {statistics.total_votes} voturi în total")
        
        # Insight despre opțiunea câștigătoare
        if statistics.vote_distribution:
            winner = max(statistics.vote_distribution, key=lambda x: x["votes"])
            insights.append(f"🏆 Opțiunea '{winner['option_text']}' conduce cu {winner['percentage']:.1f}% din voturi")
        
        # Insight despre vârstă
        if statistics.demographic_stats.get("average_age", 0) > 0:
            avg_age = statistics.demographic_stats["average_age"]
            insights.append(f"👥 Vârsta medie a votanților este {avg_age:.1f} ani")
        
        # Insight despre orașe
        if statistics.demographic_stats.get("most_active_city") != "N/A":
            city = statistics.demographic_stats["most_active_city"]
            insights.append(f"🏙️ Cel mai activ oraș în votare este {city}")
        
        # Insight despre distribuția pe vârste
        if statistics.age_distribution:
            dominant_age_group = max(statistics.age_distribution.items(), key=lambda x: x[1])
            insights.append(f"📊 Grupa de vârstă dominantă este {dominant_age_group[0]} cu {dominant_age_group[1]} voturi")
        
        # Insight despre diversitate geografică
        unique_cities = statistics.demographic_stats.get("unique_cities", 0)
        if unique_cities > 1:
            insights.append(f"🌍 Votanții provin din {unique_cities} orașe diferite")
        
        # Insights despre preferințele demografice
        for option_breakdown in breakdown:
            if option_breakdown.votes > 0:
                dominant_city = max(option_breakdown.cities.items(), key=lambda x: x[1])[0] if option_breakdown.cities else None
                if dominant_city:
                    insights.append(f"📍 Opțiunea '{option_breakdown.option_text}' este preferată în {dominant_city}")
    
    except Exception as e:
        print(f"❌ Error generating insights: {e}")
        insights.append("❌ Eroare la generarea insights-urilor")
    
    return insights

@router.get("/{poll_id}/demographics", response_model=dict)
async def get_poll_demographics(poll_id: str, current_user: dict = Depends(get_current_user)):
    """Obține doar demografiile pentru un sondaj (versiune simplificată)"""
    try:
        db = await get_database()
        
        if not ObjectId.is_valid(poll_id):
            raise HTTPException(status_code=400, detail="ID invalid")
        
        poll_doc = await db.polls.find_one({"_id": ObjectId(poll_id)})
        if not poll_doc:
            raise HTTPException(status_code=404, detail="Sondaj negăsit")
        
        # Verifică permisiuni
        user_id = ObjectId(current_user["_id"])
        is_creator = poll_doc["created_by"] == user_id
        is_admin = current_user.get("is_admin", False)
        
        if not (is_creator or is_admin):
            raise HTTPException(status_code=403, detail="Fără permisiuni")
        
        # Colectează demografii simple
        voters = poll_doc.get("voters", [])
        demographics = {
            "total_votes": len(voters),
            "cities": defaultdict(int),
            "age_groups": defaultdict(int),
            "average_age": 0
        }
        
        ages = []
        for voter_id in voters:
            user = await db.users.find_one({"_id": voter_id})
            if user:
                if user.get("city"):
                    demographics["cities"][user["city"]] += 1
                if user.get("age"):
                    age = user["age"]
                    ages.append(age)
                    if age < 25:
                        demographics["age_groups"]["18-24"] += 1
                    elif age < 35:
                        demographics["age_groups"]["25-34"] += 1
                    elif age < 50:
                        demographics["age_groups"]["35-49"] += 1
                    else:
                        demographics["age_groups"]["50+"] += 1
        
        demographics["average_age"] = sum(ages) / len(ages) if ages else 0
        demographics["cities"] = dict(demographics["cities"])
        demographics["age_groups"] = dict(demographics["age_groups"])
        
        return demographics
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting demographics: {e}")
        raise HTTPException(status_code=500, detail="Eroare server")