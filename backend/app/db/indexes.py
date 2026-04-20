from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, TEXT, IndexModel

# 30 days in seconds — TTL for soft-deleted records (requirement 7)
_SOFT_DELETE_TTL = 2_592_000


async def ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    collection = db["deployments"]
    await collection.create_indexes([
        # Default list query: filter non-deleted, order by created_at desc
        IndexModel([("deleted_at", ASCENDING), ("created_at", DESCENDING)]),
        # Filter combinations with deleted_at
        IndexModel([("deleted_at", ASCENDING), ("status", ASCENDING)]),
        IndexModel([("deleted_at", ASCENDING), ("type", ASCENDING)]),
        IndexModel([("deleted_at", ASCENDING), ("environment", ASCENDING)]),
        # Sort by name from list view
        IndexModel([("attributes.name", ASCENDING)]),
        # Full-text search across id, name, description, creator (requirement 2)
        IndexModel(
            [
                ("deployment_id", TEXT),
                ("attributes.name", TEXT),
                ("attributes.description", TEXT),
                ("created_by", TEXT),
            ],
            name="deployments_text_search",
        ),
        # TTL: MongoDB auto-purges records where deleted_at is older than 30 days
        IndexModel([("deleted_at", ASCENDING)], expireAfterSeconds=_SOFT_DELETE_TTL),
    ])
