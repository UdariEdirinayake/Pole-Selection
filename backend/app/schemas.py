from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class HealthResponse(BaseModel):
    status: str
    database: str
    timestamp: str


class PoleCatalogItemBase(BaseModel):
    catalog_code: str
    description: Optional[str] = None


class PoleCatalogItemResponse(PoleCatalogItemBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
