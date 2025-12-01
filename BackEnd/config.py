import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# Auth0 Config
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")
AUTH0_CLIENT_ID = os.getenv("AUTH0_CLIENT_ID")
AUTH0_CLIENT_SECRET = os.getenv("AUTH0_CLIENT_SECRET")  # Add this
ALGORITHMS = ["RS256"]

if not AUTH0_DOMAIN or not AUTH0_AUDIENCE or not AUTH0_CLIENT_ID or not AUTH0_CLIENT_SECRET:
    raise ValueError("AUTH0_DOMAIN, AUTH0_AUDIENCE, AUTH0_CLIENT_ID, and AUTH0_CLIENT_SECRET must be set in .env file")

# Database Config
DATABASE_URL = "sqlite:///./app.db"
