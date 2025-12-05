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

@router.get("/api/auth/callback", tags=["Auth"])
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
        refresh_token = token_data.get("refresh_token")
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No access token received from Auth0"
            )
        
        userinfo_url = f"https://{AUTH0_DOMAIN}/userinfo"
        try:
            async with httpx.AsyncClient() as client:
                userinfo_response = await client.get(
                    userinfo_url,
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=10.0
                )
            
            if userinfo_response.status_code != 200:
                verified_token = await verify_token(credentials=HTTPAuthorizationCredentials(
                    scheme="Bearer",
                    credentials=access_token
                ))
                user_data = verified_token
            else:
                user_data = userinfo_response.json()
        except Exception as e:
            verified_token = await verify_token(credentials=HTTPAuthorizationCredentials(
                scheme="Bearer",
                credentials=access_token
            ))
            user_data = verified_token
        
        db = next(get_db())
        try:
            profile = get_or_create_profile(user_data, db)
        except Exception as e:
            import traceback
            traceback.print_exc()
        finally:
            db.close()
        
        redirect_response = RedirectResponse(url="http://localhost:5173/")
        redirect_response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=3600,
            path="/",
            domain="localhost"
        )
        
        if refresh_token:
            redirect_response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=False,
                samesite="lax",
                max_age=86400 * 30,
                path="/",
                domain="localhost"
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
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

@router.get("/api/auth/login", tags=["Auth"])
async def login():
    """Redirect to Auth0 login"""
    from config import AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_AUDIENCE
    
    auth_url = (
        f"https://{AUTH0_DOMAIN}/authorize?"
        f"response_type=code&"
        f"client_id={AUTH0_CLIENT_ID}&"
        f"redirect_uri=http://localhost:8000/api/auth/callback&"
        f"scope=openid profile email offline_access&" 
        f"audience={AUTH0_AUDIENCE}"
    )
    
    return RedirectResponse(url=auth_url)

@router.post("/api/auth/set-cookie", tags=["Auth"])
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
            samesite="none",
            max_age=3600,
            path="/"
        )
        
        return {"message": "Cookie set successfully"}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

@router.delete("/api/auth/logout", tags=["Auth"])
async def logout(response: Response):
    """Clear auth cookies on logout"""
    response.delete_cookie(
        key="access_token", 
        path="/",
        httponly=True,
        secure=False,
        samesite="none",
        domain="localhost"
    )
    response.delete_cookie(
        key="refresh_token",
        path="/",
        httponly=True,
        secure=False,
        samesite="none",
        domain="localhost"
    )
    return {"message": "Logged out successfully"}

@router.get("/api/protected", tags=["Auth"])
async def protected_route(token_data: dict = Depends(get_token_data)):
    return {"message": "You are authenticated!", "user": token_data}


@router.post("/api/auth/refresh", tags=["Auth"])
async def refresh_token(request: Request, response: Response):
    """Refresh access token using refresh token"""
    refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token:
        response.delete_cookie(
            key="access_token",
            path="/",
            httponly=True,
            secure=False,
            samesite="lax",
            domain="localhost"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is missing. Please log in again."
        )
    
    try:
        token_url = f"https://{AUTH0_DOMAIN}/oauth/token"
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                token_url,
                json={
                    "grant_type": "refresh_token",
                    "client_id": AUTH0_CLIENT_ID,
                    "client_secret": AUTH0_CLIENT_SECRET,
                    "refresh_token": refresh_token
                },
                timeout=10.0
            )
        
        if token_response.status_code != 200:
            error_data = token_response.json() if token_response.headers.get("content-type", "").startswith("application/json") else {}
            error_message = error_data.get("error_description", "Failed to refresh token")
            error_code = error_data.get("error", "unknown_error")
            
            if error_code in ["invalid_grant", "invalid_request", "invalid_refresh_token"]:
                response.delete_cookie(
                    key="refresh_token",
                    path="/",
                    httponly=True,
                    secure=False,
                    samesite="lax",
                    domain="localhost"
                )
                response.delete_cookie(
                    key="access_token",
                    path="/",
                    httponly=True,
                    secure=False,
                    samesite="lax",
                    domain="localhost"
                )
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token refresh failed: {error_message}"
            )
        
        token_data = token_response.json()
        new_access_token = token_data.get("access_token")
        new_refresh_token = token_data.get("refresh_token") 
        
        if not new_access_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No access token received from Auth0"
            )
        
        
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=3600,
            path="/",
            domain="localhost"
        )
        
        if new_refresh_token:
            response.set_cookie(
                key="refresh_token",
                value=new_refresh_token,
                httponly=True,
                secure=False,
                samesite="lax",
                max_age=86400 * 30,
                path="/",
                domain="localhost"
            )
        
        return {"message": "Token refreshed successfully"}
        
    except HTTPException:
        raise
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Token refresh service timeout. Please try again."
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}"
        )
