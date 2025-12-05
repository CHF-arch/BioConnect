from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from Models.SocialLinkModel import SocialLink
from Schemas.SocialLinksSchema import SocialLinkCreate, SocialLinkResponse
from auth import get_token_data, get_user_id_from_token

router = APIRouter()

# Remove trailing slash to match frontend calls
@router.get("/api/social-links", response_model=List[SocialLinkResponse], tags=["Social Links"])
async def get_social_links(
    profile_id: str = Query(..., description="Profile ID to get social links for"),
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    links = db.query(SocialLink).filter(SocialLink.profile_id == profile_id).all()
    return links

@router.get("/api/social-links/{link_id}", response_model=SocialLinkResponse, tags=["Social Links"])
async def get_social_link_by_id(
    link_id: int,
    db: Session = Depends(get_db)
):
    db_link = db.query(SocialLink).filter(SocialLink.id == link_id).first()
    if not db_link:
        raise HTTPException(status_code=404, detail="Social link not found")
    return db_link

@router.post("/api/social-links", response_model=SocialLinkResponse, tags=["Social Links"])
async def create_social_link(
    link: SocialLinkCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    user_id = get_user_id_from_token(token_data)
    db_link = SocialLink(
        profile_id=user_id,
        platform=link.platform,
        url=link.url
    )
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return db_link

@router.put("/api/social-links/{link_id}", response_model=SocialLinkResponse, tags=["Social Links"])
async def update_social_link(
    link_id: int,
    link: SocialLinkCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    db_link = db.query(SocialLink).filter(SocialLink.id == link_id).first()
    if not db_link:
        raise HTTPException(status_code=404, detail="Social link not found")
    
    db_link.platform = link.platform
    db_link.url = link.url
    
    db.commit()
    db.refresh(db_link)
    return db_link

@router.delete("/api/social-links/{link_id}", tags=["Social Links"])
async def delete_social_link(
    link_id: int,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    db_link = db.query(SocialLink).filter(SocialLink.id == link_id).first()
    if not db_link:
        raise HTTPException(status_code=404, detail="Social link not found")
    
    db.delete(db_link)
    db.commit()
    return {"message": "Social link deleted"}
