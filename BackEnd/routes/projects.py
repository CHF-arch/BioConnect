from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from Models.ProjectModel import Project
from Schemas.ProjectSchema import ProjectCreate, ProjectResponse
from auth import get_token_data, get_user_id_from_token

router = APIRouter()

# Get projects by profile_id - use query parameter to avoid conflict
@router.get("/api/projects", response_model=List[ProjectResponse], tags=["Projects"])
async def get_projects(
    profile_id: str = Query(..., description="Profile ID to get projects for"),
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    projects = db.query(Project).filter(Project.profile_id == profile_id).order_by(Project.sort_order).all()
    return projects

# Get current user's projects - convenience endpoint
@router.get("/api/projects/me", response_model=List[ProjectResponse], tags=["Projects"])
async def get_my_projects(
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    """Get all projects for the current authenticated user"""
    user_id = get_user_id_from_token(token_data)
    projects = db.query(Project).filter(Project.profile_id == user_id).order_by(Project.sort_order).all()
    return projects

@router.post("/api/projects", response_model=ProjectResponse, tags=["Projects"])
async def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    user_id = get_user_id_from_token(token_data)
    
    db_project = Project(
        profile_id=user_id,
        title=project.title,
        description=project.description,
        project_link=project.project_link,
        sort_order=project.sort_order or 0
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

# Get single project by ID - this route now works correctly
@router.get("/api/projects/{project_id}", response_model=ProjectResponse, tags=["Projects"])
async def get_project_by_id(
    project_id: int,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    """Get a single project by its ID"""
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@router.put("/api/projects/{project_id}", response_model=ProjectResponse, tags=["Projects"])
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
    db_project.project_link = project.project_link
    db_project.sort_order = project.sort_order or 0
    
    db.commit()
    db.refresh(db_project)
    return db_project

@router.delete("/api/projects/{project_id}", tags=["Projects"])
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
