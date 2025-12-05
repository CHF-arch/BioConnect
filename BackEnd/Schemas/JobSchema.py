from pydantic import BaseModel
from typing import Optional

class JobsBase(BaseModel):
    title: str
    description: Optional[str] = None
    appear: bool = True

class JobsCreate(JobsBase):
    pass

class JobsResponse(JobsBase):
    id: int
    profile_id: str
    appear: bool
    class Config:
        from_attributes = True
