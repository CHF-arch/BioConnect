from sqlalchemy import Column, Integer, String, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(String, ForeignKey("profiles.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    project_link = Column(String, nullable=True)
    sort_order = Column(Integer, default=0)
    appear = Column(Boolean, default=True)
    profile = relationship("Profile", back_populates="projects")