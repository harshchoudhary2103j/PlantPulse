import logging
from typing import Generator
from sqlmodel import SQLModel, create_engine, Session
from app.config import settings

logger = logging.getLogger("plantpulse.database")

def get_engine():
    db_url = settings.DATABASE_URL
    # Try primary database URL
    try:
        if db_url.startswith("sqlite"):
            engine = create_engine(
                db_url, 
                connect_args={"check_same_thread": False, "timeout": 30}
            )
        else:
            engine = create_engine(db_url, pool_pre_ping=True)
            # Test connection
            with engine.connect():
                pass
        return engine
    except Exception as e:
        logger.warning(f"Could not connect to primary DATABASE_URL ({db_url}): {e}. Falling back to SQLite.")
        fallback_url = "sqlite:///./plantpulse.db"
        return create_engine(
            fallback_url, 
            connect_args={"check_same_thread": False, "timeout": 30}
        )

engine = get_engine()

def init_db():
    logger.info("Initializing database tables...")
    if str(engine.url).startswith("sqlite"):
        try:
            with engine.connect() as conn:
                conn.exec_driver_sql("PRAGMA journal_mode=WAL")
                conn.exec_driver_sql("PRAGMA busy_timeout=30000")
        except Exception as e:
            logger.warning(f"Could not set SQLite WAL mode: {e}")
    SQLModel.metadata.create_all(engine)
    logger.info("Database tables initialized successfully.")

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
