from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Import the new native FastAPI routers
from routers.auth import router as auth_router
from routers.core_api import router as core_router

# Initialize the new FastAPI application
app = FastAPI(title="SmartGov Insight API", description="Fully Migrated to FastAPI")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the new FastAPI native routers
app.include_router(auth_router)
app.include_router(core_router)

# Serve the compiled React application (dist folder) as static files
# In a real deployed environment, Nginx would handle this, but for local dev it's useful.
# We mount it at the very end so API routes are caught first.
import os
frontend_dist = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/")
    def index():
        return {"message": "Frontend not built yet. Run 'npm run build' inside /frontend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
