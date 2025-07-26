import os
import uvicorn
import json
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from uuid import uuid4
from google.adk.cli.fast_api import get_fast_api_app
from google.adk.sessions import DatabaseSessionService
from google.adk.runners import Runner
from agents.orchestrator_agent.agent import root_agent
from google.genai import types

# === LOGGING SETUP ===
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('edu_ai_agent.log')
    ]
)

# Create loggers for different components
logger = logging.getLogger("edu_ai_agent")
api_logger = logging.getLogger("edu_ai_agent.api")
session_logger = logging.getLogger("edu_ai_agent.session")
agent_logger = logging.getLogger("edu_ai_agent.agent")

load_dotenv()

# Verify API key is loaded
if not os.getenv("GOOGLE_API_KEY"):
    logger.warning("⚠️  WARNING: GOOGLE_API_KEY not found in environment variables!")
    logger.warning("   Please add GOOGLE_API_KEY to your .env file")
else:
    logger.info("✅ GOOGLE_API_KEY loaded successfully")

# === CONFIG ===
APP_NAME = "orchestrator_agent"
AGENT_DIR = os.path.join(os.path.dirname(__file__), "agents/")
SESSION_DB_URL = "sqlite:///./sessions.db"

# === SERVICES ===
session_service = DatabaseSessionService(db_url=SESSION_DB_URL)
runner = Runner(agent=root_agent, 
                app_name=APP_NAME, 
                session_service=session_service)

# === FASTAPI ===
app = FastAPI()

# === SETUP CORS ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === ROUTES ===
@app.post("/run")
async def run_agent(payload: dict):
    user_id = payload["user_id"]
    session_id = payload["session_id"]
    message = payload["new_message"]
    
    api_logger.info(f"🔄 Received payload for user {user_id[:8]}..., session {session_id[:8]}...")
    api_logger.debug(f"Full payload: {payload}")

    content = types.Content(
        role=message["role"],
        parts=[types.Part(**part) for part in message["parts"]]
    )

    response_str = None
    agent_logger.info("🧠 Agent thinking process:")
    agent_logger.info("=" * 80)
    
    step_counter = 0
    current_agent = None
    
    async for event in runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=content
    ):
        # Track which agent is currently active
        if hasattr(event, 'agent_name') and event.agent_name:
            if current_agent != event.agent_name:
                current_agent = event.agent_name
                agent_logger.info(f"\n🤖 {current_agent} is now thinking...")
        
        # Log the agent's reasoning/content
        if hasattr(event, 'content') and event.content and event.content.parts:
            for part in event.content.parts:
                # Agent's text reasoning/thinking
                if hasattr(part, 'text') and part.text:
                    step_counter += 1
                    thinking_text = part.text.strip()
                    
                    # Only log substantial thinking (not just short responses)
                    if len(thinking_text) > 20:
                        agent_logger.info(f"\n💭 Step {step_counter} - Agent Reasoning:")
                        agent_logger.info(f"   {thinking_text}")
                
                # When agent decides to use a tool
                elif hasattr(part, 'function_call') and part.function_call:
                    step_counter += 1
                    agent_logger.info(f"\n🔧 Step {step_counter} - Agent Decision: Use tool '{part.function_call.name}'")
                    if hasattr(part.function_call, 'args') and part.function_call.args:
                        # Show the agent's decision-making
                        args_preview = str(part.function_call.args)[:200]
                        agent_logger.info(f"   💡 Tool arguments: {args_preview}...")
                
                # Tool results that inform the agent's next steps
                elif hasattr(part, 'function_response') and part.function_response:
                    agent_logger.info(f"\n📥 Tool '{part.function_response.name}' returned data to agent")
                    if hasattr(part.function_response, 'response'):
                        response_preview = str(part.function_response.response)[:300]
                        agent_logger.info(f"   📄 Agent received: {response_preview}...")
        
        # Capture final response - FIXED LOGIC
        if event.is_final_response() and event.content and event.content.parts:
            for part in event.content.parts:
                if hasattr(part, 'text') and part.text:
                    response_str = part.text
                    agent_logger.info(f"\n✅ Agent's final text response:")
                    agent_logger.info(f"   {response_str[:300]}...")
                    break
                elif hasattr(part, 'function_call') and part.function_call:
                    # Convert function call args to JSON string
                    response_data = part.function_call.args
                    response_str = json.dumps(response_data, ensure_ascii=False, indent=2)
                    agent_logger.info(f"\n✅ Agent's final structured response:")
                    agent_logger.info(f"   {response_str[:300]}...")
                    break

    agent_logger.info("=" * 80)
    agent_logger.info(f"🎯 Total reasoning steps: {step_counter}")
    
    # Ensure we always return a string, never None
    if response_str is None:
        agent_logger.warning("⚠️ No response generated, returning empty JSON")
        response_str = "{}"
    
    # Ensure response is always a string
    if not isinstance(response_str, str):
        agent_logger.warning(f"⚠️ Response was not a string (type: {type(response_str)}), converting...")
        response_str = str(response_str)
    
    agent_logger.info(f"📤 Final response type: {type(response_str)}, length: {len(response_str)}")
    
    return {
        "response": response_str
    }
    

@app.post("/initiate-session/{user_id}")
async def create_session(user_id: str):
    session_logger.info(f"🚀 Creating session for user {user_id}")
    session_id = str(uuid4())
    
    try:
        stateful_session = await session_service.create_session(
            app_name=APP_NAME,
            user_id=user_id,
            session_id=session_id,
            state={"user_name": user_id}
        )
        session_logger.info(f"✅ Session created successfully: {stateful_session.id}")
        session_logger.debug(f"Session details: {stateful_session}")
        
        return {
            "id": stateful_session.id,
            "user_id": stateful_session.user_id,
            "state": stateful_session.state,
        }
    except Exception as e:
        session_logger.error(f"❌ Failed to create session for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Session creation failed: {str(e)}")
    
@app.get("/apps/{app_name}/users/{user_id}/sessions/{session_id}/state")
async def get_user_state(app_name: str, user_id: str, session_id: str):
    session_logger.info(f"📋 Retrieving state for user {user_id[:8]}..., session {session_id[:8]}...")
    
    try:
        state = await session_service.get_session(app_name=app_name, user_id=user_id, session_id=session_id)
        session_logger.info("✅ User state retrieved successfully")
        return state
    except Exception as e:
        session_logger.error(f"❌ User state not found: {str(e)}")
        raise HTTPException(status_code=404, detail=f"User state not found: {str(e)}")
    

@app.get("/hello", include_in_schema=True)
async def root():
    api_logger.debug("🏠 Health check endpoint called")
    return {"Hello": "World"}

if __name__ == "__main__":
    logger.info("🚀 Starting FastAPI server...")
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8080, 
        reload=False
    )