import requests
import time

def test_assist():
    print("Testing /ai/complaint-assist")
    cases = [
        {"title": "potholes on road", "description": "potholes on road", "category": "Roads & Potholes"},
        {"title": "garbage not collected", "description": "garbage piled up near residential buildings", "category": "Garbage & Sanitation"},
        {"title": "street light not working", "description": "street light is off at night", "category": "Street Lights"}
    ]
    for c in cases:
        r = requests.post("http://127.0.0.1:5000/api/ai/complaint-assist", json={
            "title": c["title"],
            "text": c["description"],
            "category": c["category"]
        })
        print(f"Input: {c['title']} -> {r.json().get('suggestion')}")

def test_classify():
    print("\nTesting /ai/classify-complaint")
    cases = [
        {"title": "potholes on road", "description": "bike accident can happen"}
    ]
    for c in cases:
        r = requests.post("http://127.0.0.1:5000/api/ai/classify-complaint", json={
            "title": c["title"],
            "description": c["description"]
        })
        print(f"Input: {c['title']} -> {r.json()}")

def test_urgency():
    print("\nTesting /ai/predict-urgency")
    cases = [
        {"title": "exposed live electrical wire", "description": "Kids are playing directly below it."},
        {"title": "pothole on dead end", "description": "small pothole near the dead end"}
    ]
    for c in cases:
        r = requests.post("http://127.0.0.1:5000/api/ai/predict-urgency", json={
            "title": c["title"],
            "description": c["description"]
        })
        print(f"Input: {c['title']} -> {r.json()}")

if __name__ == "__main__":
    time.sleep(1)
    try:
        test_assist()
        test_classify()
        test_urgency()
    except Exception as e:
        print("Error:", e)
