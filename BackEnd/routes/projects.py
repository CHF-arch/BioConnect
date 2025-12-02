from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from Models.ProjectModel import Project
from Schemas.ProjectSchema import ProjectCreate, ProjectResponse
from auth import get_token_data, get_user_id_from_token

router = APIRouter()

@router.get("/api/projects/{profile_id}", response_model=List[ProjectResponse])
async def get_projects(
    profile_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    projects = db.query(Project).filter(Project.profile_id == profile_id).order_by(Project.sort_order).all()
    return projects

@router.post("/api/projects", response_model=ProjectResponse)
async def create_project(
    profile_id: str,
    project: ProjectCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    db_project = Project(
        profile_id=profile_id,
        title=project.title,
        description=project.description,
        project_url=project.project_url,
        sort_order=project.sort_order or 0
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.put("/api/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project: ProjectCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_project.title = project.title
    db_project.description = project.description
    db_project.project_url = project.project_url
    db_project.sort_order = project.sort_order or 0
    
    db.commit()
    db.refresh(db_project)
    return db_project

@router.delete("/api/projects/{project_id}")
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(db_project)
    db.commit()
    return {"message": "Project deleted"}
