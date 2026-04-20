from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class DeploymentStatus(StrEnum):
    active = "active"
    failed = "failed"
    stopped = "stopped"


class DeploymentType(StrEnum):
    web_service = "web_service"
    worker = "worker"
    cron_job = "cron_job"


class DeploymentEnvironment(StrEnum):
    production = "production"
    staging = "staging"
    development = "development"


class DeploymentResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    deployment_id: str
    version: str
    status: DeploymentStatus
    type: DeploymentType
    environment: DeploymentEnvironment
    attributes: dict[str, str]
    created_at: datetime
    created_by: str
    updated_at: datetime
    deleted_at: datetime | None = None


class DeploymentListResponse(BaseModel):
    items: list[DeploymentResponse]
    total: int
    page: int
    limit: int
    has_more: bool


class PatchDeploymentRequest(BaseModel):
    """Partial update for top-level fields and the two inline-editable attributes."""

    version: str | None = None
    status: DeploymentStatus | None = None
    type: DeploymentType | None = None
    environment: DeploymentEnvironment | None = None
    # Convenience shortcuts — written to attributes.name / attributes.description
    name: str | None = None
    description: str | None = None


class AttributeUpsertRequest(BaseModel):
    value: str
