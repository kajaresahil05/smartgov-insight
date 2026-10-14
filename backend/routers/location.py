import math
import time
import json
import urllib.request
import urllib.parse
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database_fastapi import get_db
from models_fastapi import Complaint, Project, User

router = APIRouter(prefix="/location", tags=["Location & Geocoding"])

# In-memory LRU-like cache for reverse geocoding and search queries
# To respect OpenStreetMap/Nominatim Usage Policy and prevent redundant requests
REVERSE_GEOCODE_CACHE: Dict[str, Dict[str, Any]] = {}
SEARCH_GEOCODE_CACHE: Dict[str, List[Dict[str, Any]]] = {}
CACHE_EXPIRY_SECONDS = 3600  # 1 hour cache

USER_AGENT = "SmartGov-Insight-CivicPlatform/1.0 (contact: support@smartgov.in)"

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points on the earth in kilometers."""
    R = 6371.0  # Earth radius in kilometers
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def format_distance(dist_km: float) -> str:
    """Format distance into human readable string (e.g. 350 m or 2.4 km)."""
    if dist_km < 1.0:
        return f"{int(round(dist_km * 1000))} m away"
    return f"{dist_km:.1f} km away"

def clean_address(address_dict: dict, display_name: str) -> str:
    """Assemble a concise, clean civic address from Nominatim address parts."""
    parts = []
    # Key parts in order of specificity
    road = address_dict.get('road') or address_dict.get('pedestrian') or address_dict.get('path')
    suburb = address_dict.get('suburb') or address_dict.get('neighbourhood') or address_dict.get('residential')
    city = address_dict.get('city') or address_dict.get('town') or address_dict.get('village') or address_dict.get('municipality')
    postcode = address_dict.get('postcode')
    state = address_dict.get('state')

    if road: parts.append(road)
    if suburb and suburb != road: parts.append(suburb)
    if city and city not in parts: parts.append(city)
    if state and state not in parts: parts.append(state)
    if postcode: parts.append(postcode)

    if parts:
        return ", ".join(parts)
    # Fallback to truncated display_name
    return display_name.split(',')[0:4] and ", ".join([p.strip() for p in display_name.split(',')[0:4]]) or display_name

@router.get("/reverse-geocode")
def reverse_geocode(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude")
):
    """
    Reverse geocodes coordinates to a human-readable address.
    Uses backend caching and conforms to Nominatim usage policies.
    """
    # Round to 4 decimal places (~11 meters) for cache key
    cache_key = f"{round(lat, 4)}_{round(lon, 4)}"
    current_time = time.time()
    
    if cache_key in REVERSE_GEOCODE_CACHE:
        entry = REVERSE_GEOCODE_CACHE[cache_key]
        if current_time - entry['cached_at'] < CACHE_EXPIRY_SECONDS:
            return {"success": True, "cached": True, **entry['data']}

    # Query Nominatim API with compliant User-Agent
    url = f"https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat}&lon={lon}&addressdetails=1"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json"
        }
    )
    
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                raw_address = data.get('address', {})
                display_name = data.get('display_name', '')
                formatted = clean_address(raw_address, display_name)
                
                result = {
                    "formatted_address": formatted,
                    "display_name": display_name,
                    "latitude": lat,
                    "longitude": lon,
                    "details": {
                        "road": raw_address.get('road', ''),
                        "suburb": raw_address.get('suburb', raw_address.get('neighbourhood', '')),
                        "city": raw_address.get('city', raw_address.get('town', 'Pune')),
                        "state": raw_address.get('state', 'Maharashtra'),
                        "postcode": raw_address.get('postcode', '')
                    }
                }
                
                REVERSE_GEOCODE_CACHE[cache_key] = {
                    "cached_at": current_time,
                    "data": result
                }
                return {"success": True, "cached": False, **result}
    except Exception as e:
        # Graceful fallback: construct location from coordinates if external geocoder is unreachable
        pass

    fallback_addr = f"Civic Location near {lat:.4f}°N, {lon:.4f}°E, Pune"
    result = {
        "formatted_address": fallback_addr,
        "display_name": fallback_addr,
        "latitude": lat,
        "longitude": lon,
        "details": {
            "city": "Pune",
            "state": "Maharashtra"
        }
    }
    return {"success": True, "cached": False, "fallback": True, **result}

@router.get("/search")
def search_location(
    q: str = Query(..., min_length=2, description="Address or landmark search query")
):
    """
    Forward geocode address search query to coordinates and suggestions.
    """
    clean_q = q.strip().lower()
    current_time = time.time()
    
    if clean_q in SEARCH_GEOCODE_CACHE:
        return {"success": True, "cached": True, "results": SEARCH_GEOCODE_CACHE[clean_q]}

    encoded_q = urllib.parse.quote(q)
    url = f"https://nominatim.openstreetmap.org/search?q={encoded_q}&format=jsonv2&addressdetails=1&limit=5&countrycodes=in"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                results = []
                for item in data:
                    results.append({
                        "display_name": item.get('display_name', ''),
                        "latitude": float(item.get('lat')),
                        "longitude": float(item.get('lon')),
                        "type": item.get('type', 'location')
                    })
                
                SEARCH_GEOCODE_CACHE[clean_q] = results
                return {"success": True, "cached": False, "results": results}
    except Exception:
        pass

    # Fallback to empty list or known landmarks in Pune
    return {"success": True, "cached": False, "results": []}

@router.get("/projects/nearby")
def get_nearby_projects(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0),
    category: Optional[str] = Query(None),
    max_distance_km: float = Query(50.0),
    db: Session = Depends(get_db)
):
    """
    Returns government projects sorted by actual Haversine distance from user's coordinates.
    """
    q = db.query(Project)
    if category and category != 'All':
        q = q.filter(Project.category == category)
    
    projects = q.all()
    results = []
    
    for p in projects:
        p_dict = p.to_dict()
        p_lat = p.latitude or 18.5074
        p_lon = p.longitude or 73.8077
        
        dist_km = haversine_distance(lat, lon, p_lat, p_lon)
        if dist_km <= max_distance_km:
            p_dict['distance_km'] = round(dist_km, 2)
            p_dict['distance_formatted'] = format_distance(dist_km)
            p_dict['distance_meters'] = int(round(dist_km * 1000))
            results.append(p_dict)
            
    # Sort by nearest first
    results.sort(key=lambda x: x['distance_km'])
    return {"success": True, "origin": {"latitude": lat, "longitude": lon}, "projects": results}

@router.get("/community-issues/nearby")
def get_nearby_community_issues(
    lat: float = Query(18.5074, ge=-90.0, le=90.0),
    lon: float = Query(73.8077, ge=-180.0, le=180.0),
    max_distance_km: float = Query(25.0),
    db: Session = Depends(get_db)
):
    """
    Returns civic complaints/issues sorted by distance from specified coordinates.
    """
    all_c = db.query(Complaint).order_by(Complaint.id.desc()).all()
    results = []
    
    for c in all_c:
        c_dict = c.to_dict()
        c_lat = c.latitude if c.latitude is not None else 18.5074
        c_lon = c.longitude if c.longitude is not None else 73.8077
        
        dist_km = haversine_distance(lat, lon, c_lat, c_lon)
        c_dict['distance_km'] = round(dist_km, 2)
        c_dict['distance_formatted'] = format_distance(dist_km)
        results.append(c_dict)

    # Sort nearest first
    results.sort(key=lambda x: x['distance_km'])
    
    return {
        "success": True,
        "origin": {"latitude": lat, "longitude": lon},
        "stats": {
            "total_issues": len(all_c),
            "categories": len(set(c.category for c in all_c)),
            "citizens_involved": len(set(c.user_id for c in all_c)),
            "this_month": len([c for c in all_c if c.created_at])
        },
        "issues": results
    }

class UpdateSavedLocationReq(BaseModel):
    user_id: int
    location: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)

@router.put("/saved-location")
def update_user_saved_location(req: UpdateSavedLocationReq, db: Session = Depends(get_db)):
    """
    Updates the citizen's preferred/saved home/work location in their profile.
    Keeps it distinct from live temporary GPS readings.
    """
    user = db.query(User).get(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.location = req.location
    user.preferred_latitude = req.latitude
    user.preferred_longitude = req.longitude
    db.commit()
    db.refresh(user)
    
    return {
        "success": True,
        "message": "Saved location updated successfully",
        "user": user.to_dict()
    }
