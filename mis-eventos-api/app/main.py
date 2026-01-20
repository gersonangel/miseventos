from app.api.v1 import auth, users, events
from app.config import settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API para la gestión de eventos corporativos",
)

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción cambiar por dominios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(events.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Bienvenido a MisEventos API"}


@app.get("/health", tags=["Health"])
async def health_check():

    return {"status": "healthy"}


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
