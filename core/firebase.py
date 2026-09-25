"""
Firebase Admin SDK Initialization & Development Stub for LearnLens.

Provides seamless fallback for local development when live Firebase credentials 
are not provisioned, ensuring backend developers can proceed without blockers.
"""
import os
import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("learnlens.firebase")

_firebase_app = None
_is_stub_mode = False


class FirebaseStubAuth:
    """Mock authentication handler when live Firebase credentials are not supplied."""
    
    @staticmethod
    def verify_id_token(id_token: str, check_revoked: bool = False) -> Dict[str, Any]:
        """
        Verify an auth token in development stub mode.
        Returns a mock decoded claims dictionary.
        """
        logger.warning(
            "Firebase is operating in STUB MODE. Token '%s...' accepted as mock student.",
            id_token[:10] if id_token else ""
        )
        return {
            "uid": "dev-student-user-001",
            "email": "dev.student@learnlens.internal",
            "name": "Dev Student",
            "firebase": {
                "sign_in_provider": "anonymous",
                "identities": {}
            },
            "is_stub": True
        }


def initialize_firebase() -> Optional[Any]:
    """
    Initialize Firebase Admin SDK with credentials if present,
    otherwise gracefully initialize local development stub.
    """
    global _firebase_app, _is_stub_mode

    if _firebase_app is not None:
        return _firebase_app

    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")

    try:
        import firebase_admin
        from firebase_admin import credentials

        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            _firebase_app = firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK successfully initialized via Certificate path: %s", cred_path)
            _is_stub_mode = False
            return _firebase_app

        if cred_json:
            cred_dict = json.loads(cred_json)
            cred = credentials.Certificate(cred_dict)
            _firebase_app = firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK successfully initialized via JSON environment variable.")
            _is_stub_mode = False
            return _firebase_app

        # No credentials provided: Fall back to stub
        logger.warning(
            "Firebase credentials not detected (FIREBASE_CREDENTIALS_PATH or FIREBASE_CREDENTIALS_JSON). "
            "Initializing Firebase Admin in STUB MODE for local development."
        )
        _is_stub_mode = True
        return None

    except ImportError:
        logger.warning(
            "firebase_admin package is not installed in the current environment. "
            "Initializing Firebase Admin in STUB MODE."
        )
        _is_stub_mode = True
        return None
    except Exception as exc:
        logger.error("Failed to initialize Firebase Admin SDK: %s. Falling back to STUB MODE.", exc)
        _is_stub_mode = True
        return None


def get_auth_client():
    """
    Returns the Firebase auth module if live, or FirebaseStubAuth if in stub mode.
    """
    initialize_firebase()
    if not _is_stub_mode:
        try:
            from firebase_admin import auth
            return auth
        except (ImportError, Exception):
            pass
    return FirebaseStubAuth


def is_stub_mode() -> bool:
    """Returns True if Firebase is currently running in development stub mode."""
    return _is_stub_mode
