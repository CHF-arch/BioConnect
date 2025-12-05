from pydantic import BaseModel
from typing import Optional

class SocialLinkBase(BaseModel):
    platform: str
    url: str
    appear: bool = True
class SocialLinkCreate(SocialLinkBase):
    pass

class SocialLinkResponse(SocialLinkBase):
    id: int
    profile_id: str
    appear: bool
    class Config:
        from_attributes = True
