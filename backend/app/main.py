import datetime
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
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
    title="Pole Select API",
    description="Backend API for pole selection with SQLite, Alembic, Auth, and Project Management",
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
    return {"message": "Pole Select API is running", "docs": "/docs"}
