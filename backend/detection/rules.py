import os
import json
import asyncio
from datetime import datetime
from backend.api.main import connections
from backend.utils.entropy import calculate_entropy

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
EVENT_LOG = os.path.join(BASE_DIR, "logs/events.json")
BLACKLIST_FILE = os.path.join(BASE_DIR, "malicious_domains.txt")

os.makedirs(os.path.dirname(EVENT_LOG), exist_ok=True)

query_counter = {}

def load_blacklist():
    try:
        with open(BLACKLIST_FILE, "r") as f:
            return set(line.strip() for line in f if line.strip())
    except FileNotFoundError:
        return set()

BLACKLIST = load_blacklist()

def log_event(event):
    with open(EVENT_LOG, "a") as f:
        f.write(json.dumps(event) + "\n")

async def broadcast_to_websocket(event):
    dead = []
    for ws in connections:
        try:
            await ws.send_text(json.dumps(event))
        except Exception as e:
            print(f"[WARN] WebSocket failed: {e}")
            dead.append(ws)
    for ws in dead:
        if ws in connections:
            connections.remove(ws)

def analyze_dns(domain, src_ip):
    alerts_list = []
    key = f"{src_ip}:{domain}"
    query_counter[key] = query_counter.get(key, 0) + 1

    # Detection rules
    rules = [
        {
            "check": len(domain) > 50,
            "type": "DNS Tunneling",
            "description": "Detected unusually long domain name, possible DNS tunneling.",
            "severity": "High"
        },
        {
            "check": calculate_entropy(domain) > 4.0,
            "type": "DGA Domain",
            "description": "Domain exhibits high entropy, possible malware DGA usage.",
            "severity": "High"
        },
        {
            "check": domain in BLACKLIST,
            "type": "Malicious Domain",
            "description": "Domain is present in the known malicious domains blacklist.",
            "severity": "Critical"
        },
        {
            "check": query_counter[key] > 20,
            "type": "High Frequency Queries",
            "description": "DNS queries from this IP are occurring at high frequency.",
            "severity": "Medium"
        },
    ]

    severity_levels = ["Low", "Medium", "High", "Critical"]
    max_severity = "Low"

    for rule in rules:
        if rule["check"]:
            alerts_list.append({
                "type": rule["type"],
                "description": rule["description"]
            })
            if severity_levels.index(rule["severity"]) > severity_levels.index(max_severity):
                max_severity = rule["severity"]

    if alerts_list:
        event = {
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "src_ip": src_ip,
            "domain": domain,
            "alerts": alerts_list,
            "severity": max_severity
        }

        # Broadcast to all WebSocket clients
        try:
            asyncio.get_event_loop().create_task(broadcast_to_websocket(event))
        except RuntimeError:
            print("[WARN] No running event loop, cannot broadcast WebSocket")

        log_event(event)
        print("[ALERT]", event)

