import re
from datetime import datetime
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db
from auth_utils import create_session, login_required, extract_token, destroy_session

auth_bp = Blueprint("auth", __name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    confirm = data.get("confirmPassword") or data.get("confirm_password") or ""

    if not name or not email or not password:
        return jsonify({"error": "Full name, email, and password are required."}), 400
    if not EMAIL_RE.match(email):
        return jsonify({"error": "Please enter a valid email address."}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters long."}), 400
    if password != confirm:
        return jsonify({"error": "Passwords do not match."}), 400

    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({"error": "An account with this email already exists."}), 409

    now = datetime.utcnow().isoformat()
    cur = conn.execute(
        "INSERT INTO users (name, email, password_hash, created_at) VALUES (?,?,?,?)",
        (name, email, generate_password_hash(password), now)
    )
    conn.commit()
    user_id = cur.lastrowid
    conn.close()

    token = create_session(user_id)
    return jsonify({
        "message": "Account created successfully.",
        "token": token,
        "user": {"id": user_id, "name": name, "email": email, "created_at": now}
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password."}), 401

    token = create_session(user["id"])
    return jsonify({
        "message": "Login successful.",
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"],
                  "created_at": user["created_at"]}
    }), 200


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    token = extract_token()
    destroy_session(token)
    return jsonify({"message": "Logged out successfully."}), 200


@auth_bp.route("/user", methods=["GET"])
@login_required
def get_user():
    u = request.current_user
    return jsonify({
        "id": u["id"], "name": u["name"], "email": u["email"],
        "created_at": u["created_at"],
        "notifications": {
            "sms": bool(u["notif_sms"]), "email": bool(u["notif_email"]), "push": bool(u["notif_push"])
        }
    }), 200


@auth_bp.route("/user", methods=["PUT"])
@login_required
def update_user():
    data = request.get_json(silent=True) or {}
    u = request.current_user
    name = (data.get("name") or u["name"]).strip()
    notif = data.get("notifications", {})
    conn = get_db()
    conn.execute(
        "UPDATE users SET name=?, notif_sms=?, notif_email=?, notif_push=? WHERE id=?",
        (name,
         int(notif.get("sms", u["notif_sms"])),
         int(notif.get("email", u["notif_email"])),
         int(notif.get("push", u["notif_push"])),
         u["id"])
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Profile updated."}), 200


@auth_bp.route("/change-password", methods=["POST"])
@login_required
def change_password():
    data = request.get_json(silent=True) or {}
    current = data.get("currentPassword") or ""
    new = data.get("newPassword") or ""
    u = request.current_user
    if not check_password_hash(u["password_hash"], current):
        return jsonify({"error": "Current password is incorrect."}), 400
    if len(new) < 8:
        return jsonify({"error": "New password must be at least 8 characters."}), 400
    conn = get_db()
    conn.execute("UPDATE users SET password_hash=? WHERE id=?", (generate_password_hash(new), u["id"]))
    conn.commit()
    conn.close()
    return jsonify({"message": "Password changed successfully."}), 200
