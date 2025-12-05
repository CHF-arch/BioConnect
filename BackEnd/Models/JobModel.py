from sqlalchemy import Column, Integer, String, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(String, ForeignKey("profiles.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    appear = Column(Boolean, default=True)

    profile = relationship("Profile", back_populates="jobs")