"""
SmartGov Insight - Duplicate Complaint Detection Service (Model 3).
Integrates the fine-tuned SentenceTransformer model with spatial-semantic decision logic
to compare candidate complaints against all existing complaints in the shared database.
"""

import os
import json
import re
import numpy as np
import torch
from sqlalchemy.orm import Session
from models_fastapi import Complaint

MODEL_DIR = os.path.join(os.path.dirname(__file__), "ML_models", "duplicate_complaint_detection")
TRANSFORMER_PATH = os.path.join(MODEL_DIR, "sentence_transformer")
METADATA_PATH = os.path.join(MODEL_DIR, "model_metadata.json")

# Lazy-loaded globals
_sentence_model = None
_model_metadata = None

def get_duplicate_model():
    global _sentence_model, _model_metadata
    if _sentence_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            if os.path.exists(TRANSFORMER_PATH):
                print(f"[DUPLICATE DETECTION] Loading fine-tuned model from {TRANSFORMER_PATH}...")
                _sentence_model = SentenceTransformer(TRANSFORMER_PATH)
            else:
                print(f"[DUPLICATE DETECTION] Fine-tuned model directory not found. Loading base all-MiniLM-L6-v2...")
                _sentence_model = SentenceTransformer("all-MiniLM-L6-v2")
            
            if os.path.exists(METADATA_PATH):
                with open(METADATA_PATH, "r") as f:
                    _model_metadata = json.load(f)
            else:
                _model_metadata = {
                    "calibrated_cosine_threshold": 0.54,
                    "spatial_parameters": {
                        "exact_duplicate_max_distance_meters": 150.0,
                        "nearby_cluster_max_distance_meters": 500.0,
                        "uncertain_similarity_range": [0.45, 0.54]
                    }
                }
            print("[DUPLICATE DETECTION] Model loaded successfully.")
        except Exception as e:
            print(f"[DUPLICATE DETECTION ERROR] Failed to load SentenceTransformer: {e}")
    return _sentence_model, _model_metadata

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculates geographic distance in meters between two lat/lon coordinates."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None
    try:
        lat1, lon1, lat2, lon2 = float(lat1), float(lon1), float(lat2), float(lon2)
        R = 6371000.0  # Earth radius in meters
        phi1, phi2 = np.radians(lat1), np.radians(lat2)
        delta_phi = np.radians(lat2 - lat1)
        delta_lambda = np.radians(lon2 - lon1)
        a = np.sin(delta_phi / 2.0) ** 2 + np.cos(phi1) * np.cos(phi2) * np.sin(delta_lambda / 2.0) ** 2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
        return float(R * c)
    except Exception:
        return None

def extract_tokens(text):
    """Normalize and tokenize location/text for substring or landmark comparison."""
    if not text:
        return set()
    cleaned = re.sub(r'[^a-zA-Z0-9\s]', ' ', text.lower())
    tokens = set(t.strip() for t in cleaned.split() if len(t.strip()) > 2)
    # Exclude generic words
    stopwords = {"pune", "maharashtra", "india", "road", "street", "near", "opposite", "chowk", "area", "lane"}
    return tokens - stopwords

def compare_locations(loc1_str, lat1, lon1, loc2_str, lat2, lon2, max_dist=150.0):
    """
    Evaluates physical location match using coordinates (Haversine) or textual landmark matching.
    """
    dist_m = haversine_distance(lat1, lon1, lat2, lon2)
    if dist_m is not None:
        if dist_m <= max_dist:
            return {
                "distance_meters": round(dist_m, 1),
                "is_match": True,
                "is_uncertain": False,
                "reason": f"Within {round(dist_m, 1)}m of existing report"
            }
        elif dist_m <= 500.0:
            return {
                "distance_meters": round(dist_m, 1),
                "is_match": False,
                "is_uncertain": True,
                "reason": f"Nearby location ({round(dist_m, 1)}m away, possible local cluster)"
            }
        else:
            return {
                "distance_meters": round(dist_m, 1),
                "is_match": False,
                "is_uncertain": False,
                "reason": f"Distant location ({round(dist_m, 1)}m away in a different area)"
            }
            
    # Fallback to textual landmark and address tokens when GPS is missing
    tok1 = extract_tokens(loc1_str)
    tok2 = extract_tokens(loc2_str)
    if not tok1 or not tok2:
        return {
            "distance_meters": None,
            "is_match": False,
            "is_uncertain": True,
            "reason": "Missing GPS coordinates and insufficient location text"
        }
        
    common = tok1.intersection(tok2)
    if len(common) >= 2:
        return {
            "distance_meters": None,
            "is_match": True,
            "is_uncertain": False,
            "reason": f"Matching landmarks/street: {', '.join(list(common)[:3])}"
        }
    elif len(common) == 1:
        return {
            "distance_meters": None,
            "is_match": False,
            "is_uncertain": True,
            "reason": f"Partial landmark match ({list(common)[0]}) with no exact GPS"
        }
    else:
        return {
            "distance_meters": None,
            "is_match": False,
            "is_uncertain": False,
            "reason": "Different geographic locations / landmarks"
        }

def detect_duplicates_in_db(
    title: str,
    description: str,
    location: str,
    latitude: float = None,
    longitude: float = None,
    category: str = "",
    user_id: int = None,
    db: Session = None
):
    """
    Core duplicate complaint detection:
    1. Retrieves all searchable complaints across all citizens in the shared database.
    2. Computes semantic embeddings and cosine similarities.
    3. Evaluates physical location distance & address evidence.
    4. Applies multi-factor decision matrix (Cases A, B, C, D).
    """
    model, metadata = get_duplicate_model()
    threshold = metadata.get("calibrated_cosine_threshold", 0.54) if metadata else 0.54
    exact_max_dist = 150.0
    
    if not model or db is None:
        return {
            "success": True,
            "has_duplicate": False,
            "decision": "separate_issue",
            "similarity_score": 0.0,
            "similarity_percent": 0.0,
            "matched_complaint": None,
            "location_comparison": None,
            "recommendation": "Ready to submit as a new complaint.",
            "model_info": "Model offline or database session not provided."
        }

    # Query all candidate complaints from shared DB (canonical reports or root issues)
    # Compare against complaints submitted by ANY citizen!
    all_complaints = db.query(Complaint).order_by(Complaint.id.desc()).all()
    
    if not all_complaints:
        return {
            "success": True,
            "has_duplicate": False,
            "decision": "separate_issue",
            "similarity_score": 0.0,
            "similarity_percent": 0.0,
            "matched_complaint": None,
            "location_comparison": None,
            "recommendation": "No prior complaints in system. Will be recorded as a new issue.",
            "model_info": "SmartGov Model 3 (Fine-Tuned SentenceTransformer)"
        }

    query_text = f"{title.strip()}. {description.strip()}"
    query_emb = model.encode(query_text, convert_to_tensor=True)

    best_match = None
    best_sim = -1.0
    best_loc_comp = None
    best_decision = "separate_issue"
    best_rec = "Unique complaint. Ready to file as a new issue."

    # Compare against each candidate in database
    for c in all_complaints:
        candidate_text = f"{c.title}. {c.description or ''}"
        cand_emb = model.encode(candidate_text, convert_to_tensor=True)
        from sentence_transformers import util
        sim = float(util.cos_sim(query_emb, cand_emb)[0][0].cpu())
        
        loc_comp = compare_locations(
            location, latitude, longitude,
            c.location, c.latitude, c.longitude,
            max_dist=exact_max_dist
        )
        
        # Decision Matrix
        # Case A: Same issue, same location -> likely duplicate
        if sim >= threshold and loc_comp["is_match"]:
            decision = "likely_duplicate"
            rec = "Similar civic complaint already reported at this location. You can link your report to track and boost this existing issue."
        # Case B: Similar issue, different location -> separate issue
        elif sim >= threshold and not loc_comp["is_match"] and not loc_comp["is_uncertain"]:
            decision = "separate_issue"
            rec = "Similar issue exists in another area, but your report is at a distinct location. Will be registered as a new independent complaint."
        # Case C: Same location, different issue -> separate issue
        elif sim < threshold and loc_comp["is_match"]:
            decision = "separate_issue"
            rec = "Separate issue at the same physical location. Will be registered as a new complaint."
        # Case D: Uncertain match (moderate similarity or missing/uncertain location)
        elif (0.45 <= sim and loc_comp["is_uncertain"]) or (threshold <= sim and loc_comp["is_uncertain"]):
            decision = "possible_duplicate"
            rec = "Possible matching complaint found with partial location overlap. Please review before proceeding."
        else:
            decision = "separate_issue"
            rec = "No matching complaints found. Ready to submit as a new complaint."

        # Keep track of the most relevant match
        if sim > best_sim:
            best_sim = sim
            best_match = c
            best_loc_comp = loc_comp
            best_decision = decision
            best_rec = rec

    # Ensure best match exists and format response
    if best_match and best_sim >= 0.40 and best_decision in ["likely_duplicate", "possible_duplicate"]:
        # Sanitize candidate info to prevent exposing private user credentials
        matched_dict = {
            "id": best_match.id,
            "ticket_number": best_match.ticket_number,
            "title": best_match.title,
            "category": best_match.category,
            "location": best_match.location,
            "status": best_match.status,
            "urgency": best_match.urgency,
            "duplicate_count": best_match.duplicate_count or 0,
            "created_at": best_match.created_at.strftime('%d %b %Y, %I:%M %p') if best_match.created_at else ''
        }
        return {
            "success": True,
            "has_duplicate": True,
            "decision": best_decision,
            "similarity_score": round(best_sim, 4),
            "similarity_percent": round(best_sim * 100, 1),
            "matched_complaint": matched_dict,
            "location_comparison": best_loc_comp,
            "recommendation": best_rec,
            "model_info": "SmartGov Model 3 (Fine-Tuned SentenceTransformer + Spatial-Semantic Engine)"
        }
    else:
        return {
            "success": True,
            "has_duplicate": False,
            "decision": "separate_issue",
            "similarity_score": round(max(best_sim, 0.0), 4),
            "similarity_percent": round(max(best_sim * 100, 0.0), 1),
            "matched_complaint": None,
            "location_comparison": best_loc_comp,
            "recommendation": "No closely matching complaints found at this location.",
            "model_info": "SmartGov Model 3 (Fine-Tuned SentenceTransformer + Spatial-Semantic Engine)"
        }
