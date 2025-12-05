from pydantic import BaseModel
from typing import Optional
class ServiceBase(BaseModel):
    title: str
    description: Optional[str] = None
    sort_order: Optional[int] = 0
    appear: bool = True
class ServiceCreate(ServiceBase):
    pass

class ServiceResponse(ServiceBase):
    id: int
    profile_id: str
    appear: bool
    class Config:
        from_attributes = True
