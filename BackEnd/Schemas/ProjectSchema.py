from pydantic import BaseModel
from typing import Optional


class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    project_link: Optional[str] = None
    sort_order: Optional[int] = 0

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    profile_id: str
    
    class Config:
        from_attributes = True
