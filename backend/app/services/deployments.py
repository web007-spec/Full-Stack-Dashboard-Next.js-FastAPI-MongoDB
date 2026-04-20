from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING

from app.models.deployment import (
    DeploymentEnvironment,
    DeploymentListResponse,
    DeploymentResponse,
    DeploymentStatus,
    DeploymentType,
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
