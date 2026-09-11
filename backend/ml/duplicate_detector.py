import sys
import json
import math
from collections import defaultdict

def haversine(lat1, lon1, lat2, lon2):
    """Calculate geographic distance in km between two lat/lon pairs."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 9999.0
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def text_similarity(text1, text2):
    """Compute token Jaccard & N-gram TF-IDF approximation vector similarity score."""
    if not text1 or not text2:
        return 0.0
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    # Filter stopwords
    stopwords = {"in", "my", "the", "for", "is", "a", "an", "on", "at", "near", "and", "to", "has", "been", "there", "of"}
    w1 = words1 - stopwords
    w2 = words2 - stopwords
    
    if not w1 or not w2:
        return 0.0
        
    intersection = w1.intersection(w2)
    union = w1.union(w2)
    jaccard = len(intersection) / len(union)
    
    # Key phrase matching (e.g. "water supply", "pothole", "wire", "garbage", "leakage")
    keywords = ["water", "supply", "leak", "pothole", "light", "garbage", "drain", "electricity", "outage", "pipeline", "wire"]
    kw_matches = sum(1 for kw in keywords if kw in text1.lower() and kw in text2.lower())
    kw_bonus = min(0.3, kw_matches * 0.1)
    
    return min(1.0, jaccard + kw_bonus)

def detect_duplicates(target_grievance, candidates):
    """Detect potential duplicate complaints using similarity scoring."""
    results = []
    
    for item in candidates:
        if item.get('id') == target_grievance.get('id'):
            continue
            
        category_match = item.get('category') == target_grievance.get('category')
        sim_score = text_similarity(target_grievance.get('description', ''), item.get('description', ''))
        geo_dist = haversine(
            target_grievance.get('latitude'), target_grievance.get('longitude'),
            item.get('latitude'), item.get('longitude')
        )
        
        # Distance score penalty
        geo_score = 1.0 if geo_dist < 1.0 else (0.7 if geo_dist < 5.0 else 0.2)
        
        # Combined Confidence Formula
        if category_match:
            combined_confidence = (sim_score * 0.7) + (geo_score * 0.3)
        else:
            combined_confidence = sim_score * 0.4
            
        if combined_confidence >= 0.45 or (category_match and sim_score > 0.35):
            results.append({
                "duplicate_grievance_id": item.get('id'),
                "tracking_number": item.get('tracking_number'),
                "category": item.get('category'),
                "location_text": item.get('location_text'),
                "description": item.get('description'),
                "similarity_score": round(sim_score, 3),
                "geo_distance_km": round(geo_dist, 2) if geo_dist < 9000 else None,
                "confidence": round(combined_confidence, 3),
                "recommendation": "POSSIBLE DUPLICATE"
            })
            
    # Sort by confidence score descending
    results.sort(key=lambda x: x['confidence'], reverse=True)
    return results

if __name__ == "__main__":
    try:
        if len(sys.argv) > 1:
            input_json = sys.argv[1]
        else:
            input_json = sys.stdin.read()
            
        data = json.loads(input_json)
        target = data.get("target")
        candidates = data.get("candidates", [])
        
        duplicates = detect_duplicates(target, candidates)
        print(json.dumps({"success": True, "duplicates": duplicates}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
