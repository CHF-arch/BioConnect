from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from pathlib import Path
from database import init_db
from Routes import auth, profiles, services, social_links, projects, jobs
import traceback

# Initialize database
init_db()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads/avatars")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Create FastAPI app with redirect_slashes=False
app = FastAPI(redirect_slashes=False)

# Serve static files (avatars)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS - Important for cookies
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ========== ERROR HANDLERS ==========

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors (422)"""
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error.get("loc", []))
        message = error.get("msg", "Validation error")
        errors.append({
            "field": field,
            "message": message,
            "type": error.get("type", "validation_error")
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "Invalid request data",
            "details": errors
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail if isinstance(exc.detail, str) else "HTTP Error",
            "message": exc.detail if isinstance(exc.detail, str) else str(exc.detail),
            "status_code": exc.status_code
        }
    )

@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors"""
    print(f"❌ Database Error: {exc}")
    traceback.print_exc()
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Database Error",
            "message": "A database error occurred. Please try again later.",
            "status_code": 500
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions"""
    print(f"❌ Unhandled Error: {exc}")
    traceback.print_exc()
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later.",
            "status_code": 500
        }
    )

# Configure OpenAPI/Swagger to support both cookie and Bearer token
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="BioConnect API",
        version="1.0.0",
        description="BioConnect API with Auth0",
        routes=app.routes,
    )
    
    # Add security schemes for both cookie and Bearer token
    openapi_schema["components"]["securitySchemes"] = {
        "cookieAuth": {
            "type": "apiKey",
            "in": "cookie",
            "name": "access_token",
            "description": "HTTP-only cookie authentication (for frontend)"
        },
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Bearer token authentication (for Swagger testing). Enter token without 'Bearer' prefix."
        }
    }
    
    # Apply security to all paths that require authentication
    # This makes Swagger UI show the lock icon and allow Bearer token input
    for path, path_item in openapi_schema.get("paths", {}).items():
        for method, operation in path_item.items():
            if method in ["get", "post", "put", "delete", "patch"]:
                # Skip public endpoints
                if path in ["/", "/api/auth/login", "/api/auth/callback", "/api/auth/logout", "/openapi.json", "/docs", "/redoc"]:
                    continue
                # Add security requirements - allow both methods
                if "security" not in operation:
                    operation["security"] = [
                        {"bearerAuth": []},
                        {"cookieAuth": []}
                    ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Include routers
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(services.router)
app.include_router(social_links.router)
app.include_router(projects.router)
app.include_router(jobs.router)

@app.get("/")
def read_root():
    return {"Hello": "World"}
