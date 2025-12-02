from pydantic import BaseModel
from typing import Optional

class SocialLinkBase(BaseModel):
    platform: str
    url: str

class SocialLinkCreate(SocialLinkBase):
    pass

class SocialLinkResponse(SocialLinkBase):
    id: int
    profile_id: str
    
    class Config:
        from_attributes = True
