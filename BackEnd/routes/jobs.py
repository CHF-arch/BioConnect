from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from Models.JobModel import Job
from Schemas.JobSchema import JobsCreate, JobsResponse
from auth import get_token_data, get_user_id_from_token

router = APIRouter()

@router.get("/api/jobs", response_model=List[JobsResponse], tags=["Jobs"])
async def get_jobs(
    profile_id: str = Query(..., description="Profile ID to get jobs for"),
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    jobs = db.query(Job).filter(Job.profile_id == profile_id).all()
    return jobs

@router.post("/api/jobs", response_model=JobsResponse, tags=["Jobs"])
async def create_job(
    job: JobsCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    user_id = get_user_id_from_token(token_data)
    
    db_job = Job(
        profile_id=user_id,
        title=job.title,
        description=job.description
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


@router.get("/api/jobs/{job_id}", response_model=JobsResponse, tags=["Jobs"])
async def get_job_by_id(
    job_id: int,
    db: Session = Depends(get_db)
):
    db_job = db.query(Job).filter(Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    return db_job

@router.put("/api/jobs/{job_id}", response_model=JobsResponse, tags=["Jobs"])
async def update_job(
    job_id: int,
    job: JobsCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    db_job = db.query(Job).filter(Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    db_job.title = job.title
    db_job.description = job.description
    
    db.commit()
    db.refresh(db_job)
    return db_job

@router.delete("/api/jobs/{job_id}", tags=["Jobs"])
async def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    db_job = db.query(Job).filter(Job.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    db.delete(db_job)
    db.commit()
    return {"message": "Job deleted"}
