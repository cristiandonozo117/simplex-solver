from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes.simplex_routes import router as simplex_router


def create_app() -> FastAPI:
    app = FastAPI(title="Programación lineal - Método Simplex", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://simplex-frontend.fly.dev",
            "https://simplex-frontend.fly.dev/",
        ], # Rutas desde donde deberá arrancar el frontend
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(simplex_router, prefix="/simplex", tags=["simplex"])

    @app.get("/")
    async def root():
        return {"status": "ok", "service": "simplex"}

    return app


app = create_app()