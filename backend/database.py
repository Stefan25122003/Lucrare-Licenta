# database.py - Simple și funcțional
import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# Global variables
client = None
database = None

MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "voting_system"

async def connect_to_mongo():
    """Connect to MongoDB"""
    global client, database
    try:
        client = AsyncIOMotorClient(MONGODB_URL)
        database = client[DATABASE_NAME]
        
        # Test the connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB successfully!")
        return True
    except Exception as e:
        print(f"❌ Error connecting to MongoDB: {e}")
        return False

async def close_mongo_connection():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("✅ MongoDB connection closed")

async def get_database():
    """Get database instance"""
    global database
    if database is None:
        await connect_to_mongo()
    return database

async def ping_database():
    """Check database connection"""
    try:
        global client
        if client is None:
            await connect_to_mongo()
        await client.admin.command('ping')
        return True
    except Exception as e:
        print(f"Database ping failed: {e}")
        return False