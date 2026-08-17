import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # NEVER use the Anon key here

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials are missing in the environment variables.")

# Initialize the secure client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)