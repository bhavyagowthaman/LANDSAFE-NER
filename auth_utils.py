"""Shared authentication helpers: token generation & verification decorator."""
import secrets
from functools import wraps
from datetime import datetime
from flask import request, jsonify
from database import get_db


def create_session(user_id):
    token = secrets.token_hex(32)
    conn = get_db()
    conn.execute("INSERT INTO sessions (token, user_id, created_at) VALUES (?,?,?)",
                 (token, user_id, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()
    return token


def get_user_from_token(token):
    if not token:
        return None
    conn = get_db()
    row = conn.execute(
        """SELECT u.* FROM users u JOIN sessions s ON u.id = s.user_id WHERE s.token = ?""",
        (token,)
    ).fetchone()
    conn.close()
    return row


def extract_token():
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return request.headers.get("X-Auth-Token")


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = extract_token()
        user = get_user_from_token(token)
        if not user:
            return jsonify({"error": "Unauthorized. Please log in."}), 401
        request.current_user = user
        return f(*args, **kwargs)
    return wrapper


def destroy_session(token):
    conn = get_db()
    conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()
