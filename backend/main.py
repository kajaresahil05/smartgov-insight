from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Import the new native FastAPI routers
from routers.auth import router as auth_router
from routers.core_api import router as core_router
from routers.location import router as location_router
from routers.vendor_api import router as vendor_router
from routers.government_api import router as government_router

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
app.include_router(location_router, prefix="/api")
app.include_router(vendor_router)
app.include_router(government_router)

from fastapi.responses import FileResponse
import os

frontend_dist = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
assets_dir = os.path.join(frontend_dist, 'assets')
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

if os.path.exists(frontend_dist):
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            return {"detail": "Not Found"}
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"detail": "Not Found"}
else:
    @app.get("/")
    def index():
        return {"message": "Frontend not built yet. Run 'npm run build' inside /frontend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
