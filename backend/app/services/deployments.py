from datetime import datetime, timezone

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, ReturnDocument

from app.models.deployment import (
    DeploymentEnvironment,
    DeploymentListResponse,
    DeploymentResponse,
    DeploymentStatus,
    DeploymentType,
    PatchDeploymentRequest,
)

_SORT_FIELD_MAP: dict[str, str] = {
    "created_at": "created_at",
    "updated_at": "updated_at",
    "name": "attributes.name",
    "status": "status",
    "type": "type",
    "environment": "environment",
}


def _doc_to_response(doc: dict) -> DeploymentResponse:
    doc.pop("_id", None)
    return DeploymentResponse.model_validate(doc)


def _not_found(deployment_id: str) -> HTTPException:
    return HTTPException(status_code=404, detail=f"Deployment '{deployment_id}' not found")


async def list_deployments(
    db: AsyncIOMotorDatabase,
    *,
    q: str | None,
    status: DeploymentStatus | None,
    deployment_type: DeploymentType | None,
    environment: DeploymentEnvironment | None,
    sort_by: str,
    order: str,
    page: int,
    limit: int,
    include_deleted: bool,
) -> DeploymentListResponse:
    filt: dict = {}

    if not include_deleted:
        filt["deleted_at"] = None

    if q:
        filt["$text"] = {"$search": q}

    if status:
        filt["status"] = status
    if deployment_type:
        filt["type"] = deployment_type
    if environment:
        filt["environment"] = environment

    sort_field = _SORT_FIELD_MAP.get(sort_by, "created_at")
    sort_dir = ASCENDING if order == "asc" else DESCENDING

    skip = (page - 1) * limit

    collection = db["deployments"]
    total = await collection.count_documents(filt)
    cursor = collection.find(filt, {"_id": 0}).sort(sort_field, sort_dir).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)

    items = [_doc_to_response(doc) for doc in docs]

    return DeploymentListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_more=(skip + len(items)) < total,
    )


async def get_deployment(
    db: AsyncIOMotorDatabase,
    deployment_id: str,
    *,
    allow_deleted: bool = False,
) -> DeploymentResponse:
    filt: dict = {"deployment_id": deployment_id}
    if not allow_deleted:
        filt["deleted_at"] = None

    doc = await db["deployments"].find_one(filt, {"_id": 0})
    if doc is None:
        raise _not_found(deployment_id)
    return _doc_to_response(doc)


async def patch_deployment(
    db: AsyncIOMotorDatabase,
    deployment_id: str,
    patch: PatchDeploymentRequest,
) -> DeploymentResponse:
    updates: dict = {}

    if patch.version is not None:
        updates["version"] = patch.version
    if patch.status is not None:
        updates["status"] = patch.status
    if patch.type is not None:
        updates["type"] = patch.type
    if patch.environment is not None:
        updates["environment"] = patch.environment
    if patch.name is not None:
        updates["attributes.name"] = patch.name
    if patch.description is not None:
        updates["attributes.description"] = patch.description

    if not updates:
        return await get_deployment(db, deployment_id)

    updates["updated_at"] = datetime.now(timezone.utc)

    doc = await db["deployments"].find_one_and_update(
        {"deployment_id": deployment_id, "deleted_at": None},
        {"$set": updates},
        projection={"_id": 0},
        return_document=ReturnDocument.AFTER,
    )
    if doc is None:
        raise _not_found(deployment_id)
    return _doc_to_response(doc)


async def delete_deployment(db: AsyncIOMotorDatabase, deployment_id: str) -> None:
    result = await db["deployments"].update_one(
        {"deployment_id": deployment_id, "deleted_at": None},
        {"$set": {"deleted_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise _not_found(deployment_id)


async def restore_deployment(
    db: AsyncIOMotorDatabase,
    deployment_id: str,
) -> DeploymentResponse:
    doc = await db["deployments"].find_one_and_update(
        {"deployment_id": deployment_id, "deleted_at": {"$ne": None}},
        {"$set": {"deleted_at": None, "updated_at": datetime.now(timezone.utc)}},
        projection={"_id": 0},
        return_document=ReturnDocument.AFTER,
    )
    if doc is None:
        # Either doesn't exist or isn't deleted — both are 404 from the client's view
        raise _not_found(deployment_id)
    return _doc_to_response(doc)


async def upsert_attribute(
    db: AsyncIOMotorDatabase,
    deployment_id: str,
    key: str,
    value: str,
) -> DeploymentResponse:
    doc = await db["deployments"].find_one_and_update(
        {"deployment_id": deployment_id, "deleted_at": None},
        {"$set": {f"attributes.{key}": value, "updated_at": datetime.now(timezone.utc)}},
        projection={"_id": 0},
        return_document=ReturnDocument.AFTER,
    )
    if doc is None:
        raise _not_found(deployment_id)
    return _doc_to_response(doc)


async def delete_attribute(
    db: AsyncIOMotorDatabase,
    deployment_id: str,
    key: str,
) -> DeploymentResponse:
    doc = await db["deployments"].find_one_and_update(
        {"deployment_id": deployment_id, "deleted_at": None},
        {
            "$unset": {f"attributes.{key}": ""},
            "$set": {"updated_at": datetime.now(timezone.utc)},
        },
        projection={"_id": 0},
        return_document=ReturnDocument.AFTER,
    )
    if doc is None:
        raise _not_found(deployment_id)
    return _doc_to_response(doc)
