import asyncio
from supabase import create_client, Client
import uuid

# Your Supabase credentials
SUPABASE_URL = "https://pbwbehkzvlgtbruqmgux.supabase.co"
SUPABASE_SERVICE_KEY = "your-service-role-key"  # Get from Supabase Dashboard → Settings → API

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async def create_users():
    users = [
        {
            "email": "superadmin@primekingdom.com",
            "password": "password123",
            "user_metadata": {
                "full_name": "System Super Admin",
                "role": "super_admin"
            }
        },
        {
            "email": "admin@primekingdom.com",
            "password": "password123",
            "user_metadata": {
                "full_name": "Manager Admin",
                "role": "admin"
            }
        },
        {
            "email": "employee@primekingdom.com",
            "password": "password123",
            "user_metadata": {
                "full_name": "John Agent",
                "role": "employee"
            }
        }
    ]
    
    for user_data in users:
        try:
            # Create user in Supabase Auth
            response = supabase.auth.admin.create_user({
                "email": user_data["email"],
                "password": user_data["password"],
                "user_metadata": user_data["user_metadata"],
                "email_confirm": True  # Auto-confirm email
            })
            
            print(f"✅ Created user: {user_data['email']} with ID: {response.user.id}")
            
            # Check if profile exists, if not create it
            profile = supabase.table('profiles').select('*').eq('id', response.user.id).execute()
            
            if not profile.data:
                # Create profile with correct role
                supabase.table('profiles').insert({
                    'id': response.user.id,
                    'full_name': user_data['user_metadata']['full_name'],
                    'role': user_data['user_metadata']['role'],
                    'password_hash': 'supabase_handles_auth'  # Placeholder
                }).execute()
                print(f"✅ Created profile for: {user_data['email']}")
                
        except Exception as e:
            print(f"❌ Error creating {user_data['email']}: {e}")

if __name__ == "__main__":
    asyncio.run(create_users())