from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import Base, engine
from app.ws_manager import active_connections
import asyncio
import app.models

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import auth, users, messages, conversations

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(messages.router)
app.include_router(conversations.router)



@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await websocket.accept()
    active_connections[user_id] = websocket
    print(f"WS CONNECT: {user_id} | {list(active_connections.keys())}")
    try:
        while True:
            data = await websocket.receive_text()
            print(f"WS RECEIVED from {user_id}: {data}")
    except WebSocketDisconnect:
        print(f"WS DISCONNECT: {user_id} | {list(active_connections.keys())}")
        active_connections.pop(user_id, None)
    except Exception as e:
        print(f"WS ERROR for {user_id}: {e}")
        active_connections.pop(user_id, None)