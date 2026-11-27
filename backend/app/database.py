from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# SQLite requires check_same_thread=False for FastAPI multithreaded requests.
# PostgreSQL (e.g., Supabase) benefits from TCP keepalives + pool_pre_ping to avoid
# intermittent 500 errors when idle pooled connections are closed by the server/proxy.
is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = (
    {"check_same_thread": False}
    if is_sqlite
    else {
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }
)

engine_kwargs = {
    "connect_args": connect_args,
    "echo": False,
    "pool_pre_ping": True,
}
if not is_sqlite:
    engine_kwargs["pool_recycle"] = 300
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
