from fastapi import FastAPI
from fastapi.requests import Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from db import Base, engine
from models import worker, assessment, decision, audit_log
from routers import identity, ingest, decision as decision_router
from routers import assessment as assessment_router

# Create tables on startup
Base.metadata.create_all(bind=engine)

# Create the app FIRST
app = FastAPI(
    title="GigScore Backend API",
    description="Backend and ML infrastructure for GigScore — gig worker credit scoring, identity, and lending decisions.",
    version="1.0.0"
)

# --- CORS: allow the frontend (Vite dev server) to call this API ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
    "https://gig-score-two.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Rate limiting setup ---
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- Global error handler ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

# --- Register routers ---
app.include_router(identity.router)
app.include_router(ingest.router)
app.include_router(assessment_router.router)
app.include_router(decision_router.router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "GigScore Backend"}
