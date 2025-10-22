#!/usr/bin/env python3
import requests
import json
import time

BASE_URL = "http://localhost:8000"


def test_health():
    print("Testing /health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


def test_status():
    print("Testing /status endpoint...")
    response = requests.get(f"{BASE_URL}/status")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()
    return response.json()


def test_suggestions():
    print("Testing /api/v1/suggestions endpoint...")
    response = requests.get(f"{BASE_URL}/api/v1/suggestions", params={"query": "article"})
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


def test_query_without_indexing():
    print("Testing /api/v1/legal-query without indexing (should fail)...")
    response = requests.post(
        f"{BASE_URL}/api/v1/legal-query",
        json={"query": "What is Article 21?", "use_agentic": False}
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


def main():
    print("=" * 80)
    print("NyayaSahayak Backend API Test Suite")
    print("=" * 80)
    print()
    
    test_health()
    
    status = test_status()
    
    test_suggestions()
    
    if not status.get("system_ready"):
        print("⚠️  System is not ready. Indexing is required.")
        print("   Run: curl -X POST http://localhost:8000/api/v1/index")
        print()
        test_query_without_indexing()
    else:
        print("✅ System is ready for queries!")
        print()
    
    print("=" * 80)
    print("Test suite completed!")
    print("=" * 80)


if __name__ == "__main__":
    main()
