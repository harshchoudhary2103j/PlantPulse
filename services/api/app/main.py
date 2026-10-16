import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.seed import seed_database
from app.services.telemetry_engine import telemetry_engine
from app.routers import health, assets, telemetry, simulation, tickets, erp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("plantpulse.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize tables and seed ontology
    logger.info("Initializing PlantPulse database & enterprise seed data...")
    init_db()
    seed_database()
    
    # Start real-time telemetry streaming engine
    logger.info("Starting background IoT telemetry streaming engine...")
    await telemetry_engine.start()
    
    logger.info("PlantPulse Industrial AI Operations API fully started.")
    yield
    # Shutdown
    logger.info("Shutting down PlantPulse background workers...")
    await telemetry_engine.stop()
    logger.info("PlantPulse API shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Deployment-Ready Decoupled Industrial AI Operations & Predictive Maintenance SaaS API",
    lifespan=lifespan
)

# CORS configuration for cross-service Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev/docker preview
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register core routers
app.include_router(health.router)
app.include_router(assets.router)
app.include_router(telemetry.router)
app.include_router(simulation.router)
app.include_router(tickets.router)
app.include_router(erp.router)

@app.get("/")
def root():
    return {
        "service": "PlantPulse Industrial AI Operations Platform",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_url": "/health",
        "assets_url": "/api/v1/assets",
        "telemetry_stream_url": "/api/v1/stream/telemetry",
        "tickets_url": "/api/v1/tickets",
        "inventory_url": "/api/v1/inventory",
        "manuals_url": "/api/v1/manuals"
    }
