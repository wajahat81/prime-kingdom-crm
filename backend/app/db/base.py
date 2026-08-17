# Base database exports for cleaner imports across the app
from .session import supabase

# If using SQLAlchemy in the future, declarative_base would be exported here.
# For Supabase, we expose the client and common table strings.
TABLE_PROFILES = 'profiles'
TABLE_CALLS = 'calls'
TABLE_ATTENDANCE = 'attendance'
TABLE_COMMISSIONS = 'commissions'
TABLE_ANNOUNCEMENTS = 'announcements'