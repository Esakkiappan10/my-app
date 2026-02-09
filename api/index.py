# Vercel Serverless API Handler
# This adapts the FastAPI app for Vercel's serverless environment

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime
import uuid
import asyncio
import sys
import os

# Add app directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import core modules
from app.planner import PlannerEngine
from app.executor import ExecutorEngine
from app.validator import ValidatorEngine
from app.tools import ToolRegistry

# Create FastAPI app
app = FastAPI(
    title="Autonomous Agent API",
    description="Serverless API for the Autonomous Agent",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory task storage (Note: Vercel functions are stateless, 
# so tasks won't persist between cold starts)
tasks_db: Dict[str, Dict] = {}

# Initialize engines
tool_registry = ToolRegistry()
planner = PlannerEngine(tool_registry)
executor = ExecutorEngine(tool_registry)
validator = ValidatorEngine()


class CreateTaskRequest(BaseModel):
    user_id: str
    goal: str
    context: Optional[Dict[str, Any]] = {}


class TaskResponse(BaseModel):
    task_id: str
    status: str
    message: str


class InterruptResponse(BaseModel):
    response: Dict[str, Any]


@app.get("/")
async def root():
    return {"message": "Autonomous Agent API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.post("/tasks")
async def create_task(request: CreateTaskRequest):
    """Create and execute a new task"""
    task_id = str(uuid.uuid4())
    
    task = {
        "task_id": task_id,
        "user_id": request.user_id,
        "goal": request.goal,
        "context": request.context or {},
        "status": "analyzing",
        "plan": [],
        "current_step_index": 0,
        "history": [],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "outcome": None,
        "error": None,
    }
    
    tasks_db[task_id] = task
    
    # Execute task in background (limited by Vercel's timeout)
    asyncio.create_task(execute_task(task_id))
    
    return TaskResponse(
        task_id=task_id,
        status="analyzing",
        message="Task created and processing"
    )


async def execute_task(task_id: str):
    """Execute the full task pipeline"""
    task = tasks_db.get(task_id)
    if not task:
        return
    
    try:
        # Planning phase
        task["status"] = "planning"
        task["updated_at"] = datetime.utcnow().isoformat()
        
        plan = await planner.create_plan(task["goal"], task["context"])
        task["plan"] = [
            {"step": i+1, "action": step.action, "description": step.description, "status": "pending"}
            for i, step in enumerate(plan.steps)
        ]
        
        # Execution phase
        task["status"] = "executing"
        task["updated_at"] = datetime.utcnow().isoformat()
        
        for i, step in enumerate(plan.steps):
            task["current_step_index"] = i
            task["plan"][i]["status"] = "running"
            task["updated_at"] = datetime.utcnow().isoformat()
            
            try:
                result = await executor.execute_step(step, task["context"])
                task["plan"][i]["status"] = "completed"
                task["plan"][i]["result"] = result
                task["context"].update(result.get("context_updates", {}))
                task["history"].append({
                    "step": i + 1,
                    "action": step.action,
                    "status": "completed",
                    "timestamp": datetime.utcnow().isoformat()
                })
            except Exception as e:
                task["plan"][i]["status"] = "failed"
                task["plan"][i]["error"] = str(e)
                task["history"].append({
                    "step": i + 1,
                    "action": step.action,
                    "status": "failed",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                })
        
        # Validation phase
        task["status"] = "validating"
        task["updated_at"] = datetime.utcnow().isoformat()
        
        validation = await validator.validate(task["goal"], task["history"], task["context"])
        
        if validation.success:
            task["status"] = "completed"
            task["outcome"] = {
                "success": True,
                "goal": task["goal"],
                "confirmation_details": task["context"],
                "completed_at": datetime.utcnow().isoformat()
            }
        else:
            task["status"] = "failed"
            task["error"] = validation.reason
            
        task["completed_at"] = datetime.utcnow().isoformat()
        task["updated_at"] = datetime.utcnow().isoformat()
        
    except Exception as e:
        task["status"] = "failed"
        task["error"] = str(e)
        task["updated_at"] = datetime.utcnow().isoformat()


@app.get("/tasks")
async def get_tasks():
    """Get all tasks"""
    return {"tasks": list(tasks_db.values())}


@app.get("/tasks/{task_id}")
async def get_task(task_id: str):
    """Get task status (for polling)"""
    task = tasks_db.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.get("/tasks/{task_id}/poll")
async def poll_task(task_id: str):
    """Poll for task updates (replaces WebSocket)"""
    task = tasks_db.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {
        "task_id": task_id,
        "status": task["status"],
        "current_step": task["current_step_index"] + 1,
        "total_steps": len(task["plan"]),
        "plan": task["plan"],
        "outcome": task.get("outcome"),
        "error": task.get("error"),
        "updated_at": task["updated_at"]
    }


@app.post("/tasks/{task_id}/respond")
async def respond_to_interrupt(task_id: str, response: InterruptResponse):
    """Respond to an interruption"""
    task = tasks_db.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task["status"] != "interrupted":
        raise HTTPException(status_code=400, detail="Task is not interrupted")
    
    task["context"]["user_response"] = response.response
    task["status"] = "executing"
    task["updated_at"] = datetime.utcnow().isoformat()
    
    asyncio.create_task(execute_task(task_id))
    
    return {"status": "resumed", "task_id": task_id}


@app.get("/tasks/{task_id}/result")
async def get_task_result(task_id: str):
    """Get final task result"""
    task = tasks_db.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task["status"] not in ["completed", "failed"]:
        return {"status": task["status"], "message": "Task still in progress"}
    
    return {
        "task_id": task_id,
        "status": task["status"],
        "outcome": task.get("outcome"),
        "error": task.get("error")
    }


# Demo endpoints
@app.post("/demo/book-flight")
async def demo_book_flight():
    """Demo: Book a flight"""
    return await create_task(CreateTaskRequest(
        user_id="demo_user",
        goal="Book a flight from New York to Los Angeles for next Friday",
        context={"demo_mode": True}
    ))


@app.post("/demo/schedule-appointment")
async def demo_schedule_appointment():
    """Demo: Schedule a medical appointment"""
    return await create_task(CreateTaskRequest(
        user_id="demo_user",
        goal="Schedule a doctor's appointment for a general checkup",
        context={"demo_mode": True}
    ))


@app.post("/demo/get-approval")
async def demo_get_approval():
    """Demo: Get manager approval"""
    return await create_task(CreateTaskRequest(
        user_id="demo_user",
        goal="Get manager approval for a $500 equipment purchase",
        context={"demo_mode": True, "requires_approval": True}
    ))


# Vercel handler
handler = app
