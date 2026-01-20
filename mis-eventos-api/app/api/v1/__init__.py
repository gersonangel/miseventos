from app.api.v1 import auth, users
from fastapi import APIRouter

api_router = APIRouter(prefix="/v1")

# Registrar routers
api_router.include_router(auth.router)
api_router.include_router(users.router)
