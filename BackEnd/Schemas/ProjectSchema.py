from pydantic import BaseModel
from typing import Optional


class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    project_link: Optional[str] = None
    sort_order: Optional[int] = 0
    appear: bool = True

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    profile_id: str
    appear: bool
    class Config:
        from_attributes = True
