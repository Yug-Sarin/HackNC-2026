from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random

from backend.XP import Event, Profile
from backend.cardPacks import Shop

from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
from XP import Profile

app = FastAPI(title="HackNC-2026 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

profiles_db = {}
events_db = {}
user_cards = {}
user_money = {}

class EventCreate(BaseModel):
    name: str
    event_id: int
    duration: float

class ProfileCreate(BaseModel):
    username: str

class CardPackRequest(BaseModel):
    pack_type: str

class ChatMessage(BaseModel):
    message: str

@app.get("/api/health")
def health():
    return {"status": "ok", "message": "HackNC-2026 API is running"}

@app.post("/api/events/create")
def create_event(payload: EventCreate):
    event = Event(payload.name, payload.event_id, payload.duration)
    events_db[event.event_id] = event
    return {
        "name": event.name,
        "event_id": event.event_id,
        "duration": event.duration,
        "difficulty": event.calculate_difficulty(),
        "xp": event.calculate_xp(),
        "money": event.calculate_money(),
        "description": event.description(),
    }

@app.get("/api/events")
def list_events():
    results = []
    for event in events_db.values():
        results.append({
            "name": event.name,
            "event_id": event.event_id,
            "duration": event.duration,
            "difficulty": event.calculate_difficulty(),
            "xp": event.calculate_xp(),
            "money": event.calculate_money(),
            "description": event.description(),
        })
    return results

@app.get("/api/events/{event_id}")
def get_event(event_id: int):
    if event_id not in events_db:
        raise HTTPException(status_code=404, detail="Event not found")
    event = events_db[event_id]
    return {
        "name": event.name,
        "event_id": event.event_id,
        "duration": event.duration,
        "difficulty": event.calculate_difficulty(),
        "xp": event.calculate_xp(),
        "description": event.description(),
    }

@app.post("/api/profile/create")
def create_profile(payload: ProfileCreate):
    username = payload.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")
    if username in profiles_db:
        raise HTTPException(status_code=400, detail="Profile already exists")

    profile = Profile(username)
    profiles_db[username] = profile
    user_cards[username] = []
    user_money[username] = 100.0
    return {
        "username": profile.username,
        "xp": 0,
        "rsvped_events": profile.rsvped_events,
        "completed_events": profile.completed_events,
    }

@app.get("/api/profile/{username}")
def get_profile(username: str):
    if username not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile = profiles_db[username]
    total_xp = 0
    for event_id in profile.completed_events:
        if event_id in events_db:
            total_xp += events_db[event_id].calculate_xp()
    return {
        "username": profile.username,
        "xp": total_xp,
        "rsvped_events": profile.rsvped_events,
        "completed_events": profile.completed_events,
    }

@app.post("/api/profile/{username}/rsvp/{event_id}")
def rsvp_event(username: str, event_id: int):
    if username not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    if event_id not in events_db:
        raise HTTPException(status_code=404, detail="Event not found")

    profile = profiles_db[username]
    event = events_db[event_id]
    message = profile.rsvp_to_event(event)
    return {"message": message, "rsvped_events": profile.rsvped_events}

@app.post("/api/profile/{username}/complete/{event_id}")
def complete_event(username: str, event_id: int):
    if username not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    if event_id not in events_db:
        raise HTTPException(status_code=404, detail="Event not found")

    profile = profiles_db[username]
    event = events_db[event_id]

    if event_id not in profile.rsvped_events:
        raise HTTPException(status_code=400, detail="You must RSVP first")
    if event_id in profile.completed_events:
        raise HTTPException(status_code=400, detail="Already completed")

    earned_xp = event.calculate_xp()
    profile.completed_events.append(event_id)

    total_xp = 0
    for completed_id in profile.completed_events:
        if completed_id in events_db:
            total_xp += events_db[completed_id].calculate_xp()

    return {
        "message": f"You earned {earned_xp} XP!",
        "total_xp": total_xp,
        "completed_events": profile.completed_events,
    }

@app.get("/api/profile/{username}/cards")
def get_cards(username: str):
    if username not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"cards": user_cards.get(username, [])}

@app.get("/api/profile/{username}/money")
def get_money(username: str):
    if username not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"money": user_money.get(username, 0.0)}

@app.post("/api/shop/buy-pack/{username}")
def buy_pack(username: str, payload: CardPackRequest):
    if username not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")

    pack_type = payload.pack_type.lower()
    pack_prices = {"basic": 10.0, "premium": 25.0, "legendary": 50.0}
    if pack_type not in pack_prices:
        raise HTTPException(status_code=400, detail="Invalid pack type")

    shop = Shop()
    money = user_money[username]
    cost = pack_prices[pack_type]

    if money < cost:
        return {
            "success": False,
            "message": "You don't have enough money for the pack!",
            "card_gained": None,
            "money_remaining": money,
            "cards": user_cards[username],
        }

    user_money[username] = money - cost
    cards = shop.openPack(pack_type, user_cards[username])
    user_cards[username] = cards
    card_gained = cards[-1] if cards else None

    return {
        "success": True,
        "message": f"You opened a {pack_type} Pack!",
        "card_gained": card_gained,
        "money_remaining": user_money[username],
        "cards": cards,
    }

@app.post("/api/delphin/chat")
def chat_delphin(payload: ChatMessage):
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


    response = client.models.generate_content(
        model="gemini-2.0-flash",
        config=types.GenerateContentConfig(
            system_instruction=f"look through {profiles_db} and generate a helpful tip, fact about the enviroement, or give encoruagement "
        ),
    )
        
    return {"response": random.choice(response)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
