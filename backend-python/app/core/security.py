import bcrypt
import jwt
import os
from datetime import datetime, timedelta, timezone

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode('utf-8'), bcrypt.gensalt(10)).decode('utf-8')

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=8)
    to_encode.update({"exp": expire})
    
    secret = os.environ.get("JWT_SECRET", "default_secret")
    encoded_jwt = jwt.encode(to_encode, secret, algorithm="HS256")
    return encoded_jwt
