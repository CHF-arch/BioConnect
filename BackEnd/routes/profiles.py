from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, status
from sqlalchemy.orm import Session
from pathlib import Path
import shutil
import uuid
import os
from database import get_db
from models import Profile
from schemas import ProfileCreate, ProfileResponse
from auth import get_token_data, get_user_id_from_token, get_user_email_from_token, get_or_create_profile

router = APIRouter()

# Allowed image extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# IMPORTANT: More specific routes must come FIRST
@router.get("/api/profile/me", response_model=ProfileResponse)
async def get_my_profile(
    token_data: dict = Depends(get_token_data),
    db: Session = Depends(get_db)
):
    """Get current user's profile - auto-creates if doesn't exist"""
    try:
        profile = get_or_create_profile(token_data, db)
        return profile
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user data: {str(e)}"
        )
    except Exception as e:
        print(f"❌ Error getting profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get profile: {str(e)}"
        )

# Then the parameterized route
@router.get("/api/profile/{profile_id}", response_model=ProfileResponse)
async def get_profile(
    profile_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    try:
        user_id = get_user_id_from_token(token_data)
        if profile_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view this profile"
            )
        
        profile = db.query(Profile).filter(Profile.id == profile_id).first()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Profile with ID '{profile_id}' not found"
            )
        
        return profile
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get profile: {str(e)}"
        )

@router.get("/api/profile")
async def get_profile_root(
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    """Redirect to /api/profile/me - handles trailing slash redirects"""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/api/profile/me", status_code=307)

@router.post("/api/profile", response_model=ProfileResponse)
async def create_profile(
    profile: ProfileCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    try:
        user_id = get_user_id_from_token(token_data)
        
        # Check if profile already exists
        existing = db.query(Profile).filter(Profile.id == user_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Profile already exists. Use PUT to update."
            )
        
        email = get_user_email_from_token(token_data)
        db_profile = Profile(
            id=user_id,
            email=email,
            FirstName=profile.FirstName or "",
            LastName=profile.LastName or "",
            avatar_url=profile.avatar_url,
            phone=profile.phone
        )
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
        return db_profile
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create profile: {str(e)}"
        )

@router.put("/api/profile/{profile_id}", response_model=ProfileResponse)
async def update_profile(
    profile_id: str,
    profile: ProfileCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    try:
        user_id = get_user_id_from_token(token_data)
        if profile_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to update this profile"
            )
        
        db_profile = db.query(Profile).filter(Profile.id == profile_id).first()
        if not db_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Profile with ID '{profile_id}' not found"
            )
        
        db_profile.FirstName = profile.FirstName
        db_profile.LastName = profile.LastName
        db_profile.avatar_url = profile.avatar_url
        db_profile.phone = profile.phone
        
        db.commit()
        db.refresh(db_profile)
        return db_profile
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error updating profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )

@router.delete("/api/profile/{profile_id}")
async def delete_profile(
    profile_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    """Delete profile - only user can delete their own profile"""
    try:
        user_id = get_user_id_from_token(token_data)
        if profile_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to delete this profile"
            )
        
        db_profile = db.query(Profile).filter(Profile.id == profile_id).first()
        if not db_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Profile with ID '{profile_id}' not found"
            )
        
        # Delete avatar file if exists
        if db_profile.avatar_url:
            try:
                avatar_path = db_profile.avatar_url.replace("http://localhost:8000/", "")
                if os.path.exists(avatar_path):
                    os.remove(avatar_path)
            except Exception as e:
                print(f"⚠️ Warning: Could not delete avatar file: {e}")
        
        db.delete(db_profile)
        db.commit()
        return {"message": "Profile deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error deleting profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete profile: {str(e)}"
        )

@router.post("/api/profile/{profile_id}/avatar")
async def upload_avatar(
    profile_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    """Upload avatar image - saves to local storage"""
    try:
        # Decode URL-encoded profile_id (handles %7C -> |)
        from urllib.parse import unquote
        profile_id = unquote(profile_id)
        
        user_id = get_user_id_from_token(token_data)
        
        print(f"🔍 Avatar upload - profile_id: {profile_id}, user_id: {user_id}")
        
        if profile_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to upload avatar for this profile"
            )
        
        db_profile = db.query(Profile).filter(Profile.id == profile_id).first()
        if not db_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Profile with ID '{profile_id}' not found"
            )
        
        # Validate file extension
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No filename provided"
            )
        
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Read file content
        contents = await file.read()
        
        # Validate file size
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024*1024):.1f}MB"
            )
        
        # Create uploads directory if it doesn't exist (use absolute path for Windows)
        upload_dir = Path("uploads/avatars").resolve()
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"📁 Upload directory: {upload_dir}")
        
        # Generate unique filename: user_id + uuid + extension
        # Replace | with _ in filename for filesystem compatibility
        safe_user_id = profile_id.replace("|", "_").replace("/", "_").replace("\\", "_")
        unique_filename = f"{safe_user_id}_{uuid.uuid4().hex[:8]}{file_ext}"
        file_path = upload_dir / unique_filename
        
        print(f"💾 Saving file to: {file_path}")
        
        # Delete old avatar if exists
        if db_profile.avatar_url:
            try:
                # Extract filename from URL
                old_url = db_profile.avatar_url
                if "uploads/avatars/" in old_url:
                    old_filename = old_url.split("uploads/avatars/")[-1]
                    old_path = upload_dir / old_filename
                    if old_path.exists():
                        old_path.unlink()
                        print(f"🗑️ Deleted old avatar: {old_filename}")
            except Exception as e:
                print(f"⚠️ Warning: Could not delete old avatar: {e}")
        
        # Save file
        try:
            with open(file_path, "wb") as f:
                f.write(contents)
            print(f"✅ File saved successfully: {file_path}")
        except Exception as e:
            print(f"❌ Error saving file: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save file: {str(e)}"
            )
        
        # Update profile with new avatar URL
        avatar_url = f"http://localhost:8000/uploads/avatars/{unique_filename}"
        db_profile.avatar_url = avatar_url
        db.commit()
        db.refresh(db_profile)
        
        print(f"✅ Avatar URL updated: {avatar_url}")
        
        return {"avatarUrl": avatar_url, "message": "Avatar uploaded successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error uploading avatar: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload avatar: {str(e)}"
        )

@router.delete("/api/profile/{profile_id}/force-recreate")
async def force_recreate_profile(
    profile_id: str,
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_token_data)
):
    """Temporary endpoint to delete and recreate profile - for testing"""
    user_id = get_user_id_from_token(token_data)
    if profile_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if db_profile:
        db.delete(db_profile)
        db.commit()
    
    # Recreate using current token data
    from auth import get_or_create_profile
    profile = get_or_create_profile(token_data, db)
    
    return {"message": "Profile recreated", "profile": profile}
