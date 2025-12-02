from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from Models.ServiceModel import Service
from Schemas.ServiceSchema import ServiceCreate, ServiceResponse
from auth import get_token_data, get_user_id_from_token

router = APIRouter()

@router.get("/api/services", response_model=List[ServiceResponse])
async def get_services(
    profile_id: str = Query(...),
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    services = db.query(Service).filter(Service.profile_id == profile_id).order_by(Service.sort_order).all()
    return services

@router.post("/api/services", response_model=ServiceResponse)
async def create_service(
    service: ServiceCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    user_id = get_user_id_from_token(token_data)
    
    db_service = Service(
        profile_id=user_id,
        title=service.title,
        description=service.description,
        sort_order=service.sort_order or 0
    )
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

@router.put("/api/services/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: int,
    service: ServiceCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    db_service = db.query(Service).filter(Service.id == service_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    db_service.title = service.title
    db_service.description = service.description
    db_service.sort_order = service.sort_order or 0
    
    db.commit()
    db.refresh(db_service)
    return db_service

@router.delete("/api/services/{service_id}")
async def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    db_service = db.query(Service).filter(Service.id == service_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    db.delete(db_service)
    db.commit()
    return {"message": "Service deleted"}
