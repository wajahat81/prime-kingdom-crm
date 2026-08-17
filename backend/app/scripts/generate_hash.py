import bcrypt

def generate_hash(password):
    """Generate bcrypt hash for a password"""
    password_bytes = password.encode('utf-8')
    # Truncate to 72 bytes if needed (bcrypt limit)
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

if __name__ == "__main__":
    password = "password123"
    hashed = generate_hash(password)
    print(f"Password: {password}")
    print(f"Hash: {hashed}")
    print("\nCopy this hash and update your database:")
    print(f"UPDATE public.profiles SET password_hash = '{hashed}' WHERE email IN ('superadmin@primekingdom.com', 'admin@primekingdom.com', 'employee@primekingdom.com');")