"""
reindex_elasticsearch.py — Trigger ES reindex (Temporarily Public)
Usage: python scripts/reindex_elasticsearch.py
"""

import urllib.request
import urllib.error
import json

BACKEND_URL = "http://localhost:8088/api"

def post_json(url, data=None, headers=None):
    body = json.dumps(data).encode("utf-8") if data else b""
    req = urllib.request.Request(url, data=body, headers=headers or {}, method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=600) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        print(f"  HTTP {e.code}: {body}")
        return None
    except Exception as e:
        print(f"  Error: {e}")
        return None

def main():
    print("=" * 50)
    print("  Elasticsearch Reindex Tool (Public Access)")
    print("=" * 50)

    print(f"\n[1] Triggering full reindex (48k products)...")
    print("    Please wait, this will take some time...")

    reindex_resp = post_json(f"{BACKEND_URL}/search/reindex")

    if reindex_resp and reindex_resp.get("result"):
        print(f"\n  [SUCCESS] {reindex_resp['result']}")
        print("\n  Elasticsearch index is ready! Search should now work correctly.")
    else:
        print(f"\n  [FAILED] Reindex failed. Make sure Backend is running and SecurityConfig is updated.")

    print("=" * 50)

if __name__ == "__main__":
    main()
