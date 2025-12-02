from pydantic import BaseModel
from typing import Optional

class JobsBase(BaseModel):
    title: str
    description: Optional[str] = None

class JobsCreate(JobsBase):
    pass

class JobsResponse(JobsBase):
    id: int
    profile_id: str
    
    class Config:
        from_attributes = True
