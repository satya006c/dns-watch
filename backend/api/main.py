from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json

app = FastAPI(title="DNS SOC Dashboard API")

# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict to your frontend domain in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active WebSocket connections
connections: list[WebSocket] = []

@app.websocket("/ws/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connections.append(websocket)
    print("New WebSocket connected. Total connections:", len(connections))
    try:
        while True:
            # Keep connection alive by waiting for a message
            await websocket.receive_text()
    except WebSocketDisconnect:
        connections.remove(websocket)
        print("WebSocket disconnected. Total connections:", len(connections))
    except Exception as e:
        # Remove connection in case of any unexpected error
        connections.remove(websocket)
        print(f"WebSocket error: {e}. Total connections:", len(connections))

async def broadcast_alert(alert: dict):
    """Send alert to all connected clients"""
    dead_connections = []
    for ws in connections:
        try:
            await ws.send_text(json.dumps(alert))
        except Exception:
            dead_connections.append(ws)
    # Remove dead connections
    for ws in dead_connections:
        if ws in connections:
            connections.remove(ws)

@app.get("/")
async def root():
    return {"status": "running"}

# Background task to generate fake alerts every 5 seconds
async def fake_alert_generator():
    while True:
        alert = {
            "severity": "HIGH",
            "message": "Suspicious login detected"
        }
        await broadcast_alert(alert)
        await asyncio.sleep(5)

# Start the background task on startup
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(fake_alert_generator())

