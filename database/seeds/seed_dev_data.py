"""
Run this script to seed the database with test data for development.
Usage: python database/seeds/seed_dev_data.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))

from app.models.base import SessionLocal, init_db
from app.models.client import Client
from app.models.subscription import Subscription, TIERS

init_db()
db = SessionLocal()

clients_data = [
    {"name": "Test Salon", "email": "salon@test.com", "tier": "basic"},
    {"name": "Test Clinic", "email": "clinic@test.com", "tier": "pro"},
    {"name": "Test Gym", "email": "gym@test.com", "tier": "free"},
]

for c in clients_data:
    if not db.query(Client).filter(Client.email == c["email"]).first():
        client = Client(name=c["name"], email=c["email"])
        db.add(client)
        db.flush()
        sub = Subscription(client_id=client.id, tier=c["tier"], monthly_limit=TIERS[c["tier"]])
        db.add(sub)
        print(f"Created: {c['name']} ({c['tier']}) — API key: {client.api_key}")

db.commit()
db.close()
print("Seeding complete.")
