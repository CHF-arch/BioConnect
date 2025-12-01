from fastapi import HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyCookie
from jose import jwt, JWTError
from typing import Optional
import httpx
from config import AUTH0_DOMAIN, AUTH0_AUDIENCE, ALGORITHMS
from database import SessionLocal
from models import Profile
from sqlalchemy.orm import Session

# Make security optional for Swagger
security = HTTPBearer(auto_error=False)  # auto_error=False makes it optional
cookie_security = APIKeyCookie(name="access_token", auto_error=False)

# Cache for JWKS
_jwks_cache = None

def get_jwks():
    global _jwks_cache
    if _jwks_cache is None:
        url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
        response = httpx.get(url)
        _jwks_cache = response.json()
    return _jwks_cache

def get_token_from_request(request: Request) -> Optional[str]:
    """Get token from HTTP-only cookie first, then from Authorization header as fallback"""
    # Debug: Print all cookies
    print(f"All cookies received: {request.cookies}")
    print(f"Cookie 'access_token': {request.cookies.get('access_token')}")
    
    # Priority 1: HTTP-only cookie (most secure)
    token = request.cookies.get("access_token")
    if token:
        print("Token found in cookie!")
        return token
    
    # Priority 2: Authorization header (fallback for API clients)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        print("Token found in Authorization header")
        return auth_header.split(" ")[1]
    
    print("No token found!")
    return None

async def verify_token(request: Request = None, credentials: HTTPAuthorizationCredentials = None):
    """Verify token from cookie or Authorization header"""
    token = None
    
    if request:
        token = get_token_from_request(request)
    
    if not token and credentials:
        token = credentials.credentials
    
    if not token:
        raise HTTPException(status_code=401, detail="Token is missing")
    
    token_parts = token.split('.')
    if len(token_parts) != 3:
        raise HTTPException(status_code=401, detail=f"Invalid token format. Expected 3 parts, got {len(token_parts)}")
    
    try:
        jwks = get_jwks()
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
        if not rsa_key:
            raise HTTPException(status_code=401, detail="Unable to find appropriate key")
        
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=ALGORITHMS,
            audience=AUTH0_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/"
        )
        return payload
    except jwt.DecodeError as e:
        raise HTTPException(status_code=401, detail=f"Token decode error: {str(e)}")
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification error: {str(e)}")

# Update the get_token_data function to work better with Swagger
async def get_token_data(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    cookie_token: Optional[str] = Depends(cookie_security)
) -> dict:
    """Dependency to get token data from cookie or header - works with Swagger"""
    token = None
    
    # Priority 1: Cookie (for frontend)
    if cookie_token:
        token = cookie_token
    else:
        # Try to get from request cookies directly
        token = request.cookies.get("access_token")
    
    # Priority 2: Authorization header (for Swagger/testing)
    if not token and credentials:
        token = credentials.credentials
    
    if not token:
        raise HTTPException(status_code=401, detail="Token is missing")
    
    # Verify the token
    return await verify_token(request=request if token else None, credentials=HTTPAuthorizationCredentials(scheme="Bearer", credentials=token) if token else None)

def get_user_id_from_token(token_data: dict) -> str:
    """Extract user ID (sub) from Auth0 token"""
    return token_data.get("sub", "")

def get_user_email_from_token(token_data: dict) -> str:
    """Extract user email from Auth0 token"""
    email = token_data.get("email", "")
    print(f"🔍 Extracting email: '{email}'")
    return email

def get_user_name_from_token(token_data: dict) -> tuple[str, str]:
    """Extract user name from Auth0 token/userinfo and split into first/last"""
    # Debug: Print what we're receiving
    print(f"🔍 Extracting name from token_data keys: {list(token_data.keys())}")
    
    # Try given_name and family_name first (from /userinfo endpoint)
    given_name = token_data.get("given_name", "")
    family_name = token_data.get("family_name", "")
    
    print(f"   given_name: '{given_name}', family_name: '{family_name}'")
    
    if given_name or family_name:
        result = (given_name or "", family_name or "")
        print(f"   ✅ Using given_name/family_name: {result}")
        return result
    
    # Fallback to name field
    name = token_data.get("name", "")
    print(f"   name field: '{name}'")
    
    if name:
        parts = name.split(" ", 1)
        result = (parts[0], parts[1] if len(parts) > 1 else "")
        print(f"   ✅ Using name field (split): {result}")
        return result
    
    print(f"   ⚠️ No name found in token data")
    return ("", "")

def get_or_create_profile(token_data: dict, db: Session) -> Profile:
    """Automatically create profile if it doesn't exist, using Auth0 token/userinfo data"""
    user_id = get_user_id_from_token(token_data)
    
    if not user_id:
        raise ValueError("User ID (sub) not found in token/userinfo data")
    
    print(f"\n🔍 Looking for profile with user_id: {user_id}")
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    
    if not profile:
        # Extract data BEFORE creating profile
        email = get_user_email_from_token(token_data)
        first_name, last_name = get_user_name_from_token(token_data)
        
        print(f"\n📝 CREATING NEW PROFILE:")
        print(f"   User ID: {user_id}")
        print(f"   Email: '{email}'")
        print(f"   First Name: '{first_name}'")
        print(f"   Last Name: '{last_name}'")
        
        # Verify we have the data
        if not email:
            print(f"   ⚠️ WARNING: Email is empty!")
        if not first_name and not last_name:
            print(f"   ⚠️ WARNING: Both first and last name are empty!")
        
        profile = Profile(
            id=user_id,
            email=email if email else None,  # Use None if empty string
            FirstName=first_name,
            LastName=last_name,
            avatar_url=None,
            phone=None
        )
        
        print(f"   Profile object created:")
        print(f"     - id: {profile.id}")
        print(f"     - email: {profile.email}")
        print(f"     - FirstName: '{profile.FirstName}'")
        print(f"     - LastName: '{profile.LastName}'")
        
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
        print(f"\n✅ Profile saved to database:")
        print(f"   ID: {profile.id}")
        print(f"   Email: {profile.email}")
        print(f"   FirstName: '{profile.FirstName}'")
        print(f"   LastName: '{profile.LastName}'")
    else:
        print(f"✅ Profile already exists for user: {user_id}")
        print(f"   Current - Email: {profile.email}, Name: {profile.FirstName} {profile.LastName}")
        
        # If profile exists but is empty, update it
        if not profile.email or (not profile.FirstName and not profile.LastName):
            print(f"   ⚠️ Profile exists but is missing data. Updating...")
            email = get_user_email_from_token(token_data)
            first_name, last_name = get_user_name_from_token(token_data)
            
            if email:
                profile.email = email
            if first_name:
                profile.FirstName = first_name
            if last_name:
                profile.LastName = last_name
            
            db.commit()
            db.refresh(profile)
            print(f"   ✅ Profile updated:")
            print(f"     - Email: {profile.email}")
            print(f"     - FirstName: '{profile.FirstName}'")
            print(f"     - LastName: '{profile.LastName}'")
    
    return profile
