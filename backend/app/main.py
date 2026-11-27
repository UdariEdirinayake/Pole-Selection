import datetime
import logging
import os
from pathlib import Path
from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db, Base, engine
from app.schemas import HealthResponse
from app.api.master import router as master_router
from app.api.auth import router as auth_router
from app.api.projects import router as projects_router
from app.api.results import router as results_router
from app.api.engine import router as engine_router

# Initialize schema tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LineDesign API",
    description="Backend API for LineDesign – overhead electrical line design with SQLite, Alembic, Auth, and Project Management",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(master_router)
app.include_router(projects_router)
app.include_router(results_router)
app.include_router(engine_router)

logger = logging.getLogger("linedesign.api")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled server error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {type(exc).__name__}"},
    )


@app.get("/health", response_model=HealthResponse, tags=["System"])
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint verifying application and database connectivity."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"unhealthy: {str(exc)}"

    return HealthResponse(
        status="ok",
        database=db_status,
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat()
    )


@app.get("/", tags=["Root"])
def root():
    index_file = Path(__file__).resolve().parents[2] / "frontend" / "dist" / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)
    return {"message": "LineDesign API is running", "docs": "/docs"}


_FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if (_FRONTEND_DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=_FRONTEND_DIST / "assets"), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
def serve_spa(full_path: str):
    """Serve built frontend SPA routes when frontend/dist is present."""
    if full_path.startswith(("api/", "docs", "openapi.json", "redoc", "health")):
        raise HTTPException(status_code=404, detail="Not found")
    candidate = _FRONTEND_DIST / full_path
    if full_path and candidate.is_file():
        return FileResponse(candidate)
    index_file = _FRONTEND_DIST / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="Not found")
