from app.api.v1 import auth, users, events, sessions
from app.config import settings
from app.services.cache_service import cache_service
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    await cache_service.close()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API para la gestión de eventos corporativos",
    lifespan=lifespan,
)

# Crear directorio de uploads si no existe
os.makedirs("uploads", exist_ok=True)

# Montar archivos estáticos
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list, # En producción cambiar por dominios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(events.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Bienvenido a MisEventos API"}


@app.get("/health", tags=["Health"])
async def health_check():

    return {"status": "healthy"}


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
