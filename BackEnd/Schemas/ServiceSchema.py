from pydantic import BaseModel
from typing import Optional
class ServiceBase(BaseModel):
    title: str
    description: Optional[str] = None
    sort_order: Optional[int] = 0

class ServiceCreate(ServiceBase):
    pass

class ServiceResponse(ServiceBase):
    id: int
    profile_id: str
    
    class Config:
        from_attributes = True
