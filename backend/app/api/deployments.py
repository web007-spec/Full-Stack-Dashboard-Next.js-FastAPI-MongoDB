from fastapi import APIRouter, Depends, Query, Response
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongodb import get_db
from app.models.deployment import (
    DeploymentEnvironment,
    DeploymentListResponse,
    DeploymentResponse,
    DeploymentStatus,
    DeploymentType,
    PatchDeploymentRequest,
)
from app.services import deployments as svc

router = APIRouter(prefix="/deployments", tags=["deployments"])


@router.get("", response_model=DeploymentListResponse)
async def list_deployments(
    q: str | None = Query(None, description="Full-text search across id, name, description, creator"),
    status: DeploymentStatus | None = Query(None),
    deployment_type: DeploymentType | None = Query(None, alias="type"),
    environment: DeploymentEnvironment | None = Query(None),
    sort: str = Query("created_at", pattern="^(created_at|updated_at|name|status|type|environment)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    include_deleted: bool = Query(False),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> DeploymentListResponse:
    return await svc.list_deployments(
        db,
        q=q,
        status=status,
        deployment_type=deployment_type,
        environment=environment,
        sort_by=sort,
        order=order,
        page=page,
        limit=limit,
        include_deleted=include_deleted,
    )


@router.get("/{deployment_id}", response_model=DeploymentResponse)
async def get_deployment(
    deployment_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> DeploymentResponse:
    return await svc.get_deployment(db, deployment_id)


@router.patch("/{deployment_id}", response_model=DeploymentResponse)
async def patch_deployment(
    deployment_id: str,
    body: PatchDeploymentRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> DeploymentResponse:
    return await svc.patch_deployment(db, deployment_id, body)


@router.delete("/{deployment_id}", status_code=204)
async def delete_deployment(
    deployment_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Response:
    await svc.delete_deployment(db, deployment_id)
    return Response(status_code=204)


@router.post("/{deployment_id}/restore", response_model=DeploymentResponse)
async def restore_deployment(
    deployment_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> DeploymentResponse:
    return await svc.restore_deployment(db, deployment_id)
