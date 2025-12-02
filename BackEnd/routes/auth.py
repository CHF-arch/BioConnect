from fastapi import APIRouter, HTTPException, Request, Response, Depends, Query, status
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
from Schemas.TokenSchema import TokenRequest
from auth import verify_token, get_token_data, security, get_or_create_profile
from config import AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET
from database import get_db
import httpx
from typing import Optional

router = APIRouter()

@router.get("/api/auth/callback")
async def auth_callback(
    code: str = Query(...)
):
    """Auth0 callback - exchanges code for token, sets cookie, and creates profile"""
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code is missing"
        )
    
    try:
        token_url = f"https://{AUTH0_DOMAIN}/oauth/token"
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                token_url,
                json={
                    "grant_type": "authorization_code",
                    "client_id": AUTH0_CLIENT_ID,
                    "client_secret": AUTH0_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": "http://localhost:8000/api/auth/callback"
                },
                timeout=10.0
            )
        
        if token_response.status_code != 200:
            error_data = token_response.json() if token_response.headers.get("content-type", "").startswith("application/json") else {}
            error_message = error_data.get("error_description", "Failed to exchange authorization code for token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Authentication failed: {error_message}"
            )
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No access token received from Auth0"
            )
        
        # Get user info from Auth0 /userinfo endpoint
        userinfo_url = f"https://{AUTH0_DOMAIN}/userinfo"
        try:
            async with httpx.AsyncClient() as client:
                userinfo_response = await client.get(
                    userinfo_url,
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=10.0
                )
            
            if userinfo_response.status_code != 200:
                print(f"⚠️ Failed to get userinfo: {userinfo_response.status_code}")
                # Fallback to access token
                verified_token = await verify_token(credentials=HTTPAuthorizationCredentials(
                    scheme="Bearer",
                    credentials=access_token
                ))
                user_data = verified_token
            else:
                user_data = userinfo_response.json()
        except Exception as e:
            print(f"⚠️ Error getting userinfo: {e}")
            # Fallback to access token
            verified_token = await verify_token(credentials=HTTPAuthorizationCredentials(
                scheme="Bearer",
                credentials=access_token
            ))
            user_data = verified_token
        
        # Auto-create profile if it doesn't exist
        db = next(get_db())
        try:
            profile = get_or_create_profile(user_data, db)
        except Exception as e:
            print(f"❌ Error creating profile: {e}")
            import traceback
            traceback.print_exc()
            # Don't fail auth if profile creation fails - user can create it later
        finally:
            db.close()
        
        # Create redirect response and set cookie
        redirect_response = RedirectResponse(url="http://localhost:5173/")
        redirect_response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=3600,
            path="/",
            domain=None
        )
        
        return redirect_response
        
    except HTTPException:
        raise
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Authentication service timeout. Please try again."
        )
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

@router.get("/api/auth/login")
async def login():
    """Redirect to Auth0 login"""
    from config import AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_AUDIENCE
    
    auth_url = (
        f"https://{AUTH0_DOMAIN}/authorize?"
        f"response_type=code&"
        f"client_id={AUTH0_CLIENT_ID}&"
        f"redirect_uri=http://localhost:8000/api/auth/callback&"
        f"scope=openid profile email&"
        f"audience={AUTH0_AUDIENCE}"
    )
    
    return RedirectResponse(url=auth_url)

# Keep existing endpoints
@router.post("/api/auth/set-cookie")
async def set_auth_cookie(
    token_request: TokenRequest,
    response: Response,
    request: Request
):
    """Set Auth0 token as HTTP-only cookie - token is never stored in frontend"""
    try:
        token = token_request.token
        
        token_data = await verify_token(credentials=HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=token
        ))
        
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=3600,
            path="/"
        )
        
        return {"message": "Cookie set successfully"}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

@router.delete("/api/auth/logout")
async def logout(response: Response):
    """Clear auth cookie on logout"""
    response.delete_cookie(
        key="access_token", 
        path="/",
        httponly=True,
        secure=False,
        samesite="lax"
    )
    return {"message": "Logged out successfully"}

@router.get("/api/protected")
async def protected_route(token_data: dict = Depends(get_token_data)):
    return {"message": "You are authenticated!", "user": token_data}

@router.post("/api/auth/test-set-cookie")
async def test_set_cookie(
    token: str = Query(..., description="Auth0 token for testing"),
    response: Response = None
):
    """Test endpoint to set cookie from Swagger - paste your token here"""
    try:
        # Verify token is valid
        verified_token = await verify_token(credentials=HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=token
        ))
        
        # Set HTTP-only cookie
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=3600,
            path="/"
        )
        
        return {"message": "Cookie set successfully. Now you can test other endpoints."}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
