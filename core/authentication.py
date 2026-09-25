"""
Firebase Authentication Backend for LearnLens DRF API (core/authentication.py).
Extracts and validates Firebase Auth Bearer tokens from incoming HTTP Authorization headers.
Prevents identity spoofing by binding request.user.uid to the authenticated Firebase token.
"""

import logging
from typing import Optional, Tuple
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed
from core.firebase import verify_id_token

logger = logging.getLogger("learnlens.authentication")


class FirebaseUser:
    """
    Lightweight user object representing an authenticated Firebase user.
    """

    def __init__(self, uid: str, email: str = "", decoded_token: Optional[dict] = None):
        self.uid = uid
        self.email = email
        self.decoded_token = decoded_token or {}

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return False

    @property
    def pk(self) -> str:
        return self.uid

    @property
    def id(self) -> str:
        return self.uid

    def __str__(self) -> str:
        return f"FirebaseUser(uid={self.uid}, email={self.email})"


class FirebaseAuthentication(BaseAuthentication):
    """
    DRF Authentication class for Firebase ID Token verification.
    Expected header:
        Authorization: Bearer <firebase_id_token>
    """

    def authenticate_header(self, request) -> str:
        return 'Bearer realm="api"'

    def authenticate(self, request) -> Optional[Tuple[FirebaseUser, str]]:

        auth_header = get_authorization_header(request).split()

        # No auth header provided: return None to allow permission classes to handle (e.g. 401 Unauthorized)
        if not auth_header:
            return None

        if len(auth_header) == 1:
            raise AuthenticationFailed("Invalid Authorization header. Bearer token missing.")
        elif len(auth_header) > 2:
            raise AuthenticationFailed("Invalid Authorization header. Token string contains spaces.")

        prefix = auth_header[0].decode("utf-8").lower()
        if prefix != "bearer":
            return None

        token = auth_header[1].decode("utf-8")

        try:
            # First attempt verification via official firebase_admin.auth if available
            decoded_token = None
            try:
                import firebase_admin
                from firebase_admin import auth
                if firebase_admin._apps:
                    decoded_token = auth.verify_id_token(token)
            except Exception:
                decoded_token = None

            # If unverified or in stub/dev mode, verify through core.firebase handler
            if not decoded_token:
                decoded_token = verify_id_token(token)

            if not decoded_token or not isinstance(decoded_token, dict):
                raise AuthenticationFailed("Firebase ID token verification returned empty payload.")

            uid = decoded_token.get("uid") or decoded_token.get("sub")
            if not uid:
                raise AuthenticationFailed("Firebase ID token payload missing 'uid'.")

            user = FirebaseUser(
                uid=str(uid),
                email=decoded_token.get("email", ""),
                decoded_token=decoded_token,
            )
            return (user, token)

        except Exception as exc:
            logger.warning(f"[Authentication] Token verification failed: {exc}")
            raise AuthenticationFailed(f"Invalid or expired Firebase ID token: {exc}")
