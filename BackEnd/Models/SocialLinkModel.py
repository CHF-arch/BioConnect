from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class SocialLink(Base):
    __tablename__ = "social_links"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(String, ForeignKey("profiles.id"), nullable=False)
    platform = Column(String, nullable=False)
    url = Column(String, nullable=False)
    appear = Column(Boolean, default=True)
    profile = relationship("Profile", back_populates="social_links")