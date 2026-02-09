"""
FastAPI Application - REST API and WebSocket for Autonomous Agent
"""
import json
import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from contextlib import asynccontextmanager

from .models import TaskStatus
from .orchestrator import orchestrator
from .state_manager import state_manager
from .follow_up_engine import follow_up_engine, FollowUpSuggestion, DependentBooking
from .flight_monitor import flight_monitor, FlightInfo


# Request/Response Models
class CreateTaskRequest(BaseModel):
    user_id: str
    goal: str
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)


class TaskResponse(BaseModel):
    task_id: str
    status: str
    message: str


class UserInterruptionResponse(BaseModel):
    response: Dict[str, Any]


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, task_id: str):
        await websocket.accept()
        self.active_connections[task_id] = websocket
        print(f"WebSocket connected for task: {task_id}")
    
    def disconnect(self, task_id: str):
        if task_id in self.active_connections:
            del self.active_connections[task_id]
            print(f"WebSocket disconnected for task: {task_id}")
    
    async def send_update(self, task_id: str, message: Dict):
        if task_id in self.active_connections:
            try:
                await self.active_connections[task_id].send_json(message)
            except Exception as e:
                print(f"Error sending WebSocket message: {e}")
    
    async def broadcast(self, message: Dict):
        for task_id, connection in self.active_connections.items():
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to {task_id}: {e}")


manager = ConnectionManager()


# Progress callback for WebSocket updates
async def websocket_progress_callback(update: Dict):
    """Send progress updates via WebSocket"""
    task_id = update.get("task_id")
    if task_id:
        await manager.send_update(task_id, update)


# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("="*60)
    print("AUTONOMOUS AGENT API STARTING")
    print("="*60)
    yield
    # Shutdown
    print("\nShutting down...")


# Create FastAPI app
app = FastAPI(
    title="Autonomous Agent API",
    description="Outcome-driven autonomous AI agent system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# REST Endpoints

@app.post("/tasks", response_model=TaskResponse)
async def create_task(request: CreateTaskRequest):
    """
    Create a new autonomous task.
    
    The agent will:
    1. Interpret the goal into measurable success criteria
    2. Generate an execution plan
    3. Execute steps autonomously
    4. Handle interruptions if needed
    5. Validate completion
    
    Example:
    ```json
    {
        "user_id": "user_123",
        "goal": "Book me a flight to Tokyo next week under $800",
        "context": {
            "home_airport": "LAX",
            "passenger_details": {"name": "John Doe"}
        }
    }
    ```
    """
    try:
        task_id = await orchestrator.create_task(
            user_id=request.user_id,
            goal=request.goal,
            context=request.context
        )
        
        # Register WebSocket callback
        orchestrator.register_progress_callback(task_id, websocket_progress_callback)
        
        return TaskResponse(
            task_id=task_id,
            status="pending",
            message="Task created and processing started"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tasks")
async def list_tasks():
    """List all tasks."""
    tasks = await orchestrator.get_all_tasks()
    return {"tasks": tasks, "count": len(tasks)}


@app.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    """
    Get current status and progress of a task.
    
    Returns:
    - task_id: Task identifier
    - status: Current state (pending, analyzing, planning, executing, etc.)
    - progress: Current step and total steps
    - outcome: Success criteria and validation method
    - context: Execution context
    - history: Execution history
    - interrupt_reason: If interrupted, the reason why
    """
    task = await orchestrator.get_task_status(task_id)
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return task


@app.post("/tasks/{task_id}/respond")
async def respond_to_interruption(task_id: str, request: UserInterruptionResponse):
    """
    Provide user response to an interrupted task.
    
    This resumes task execution after a human interruption.
    
    Example for payment approval:
    ```json
    {
        "response": {
            "approved": true,
            "payment_method": "card_ending_4242"
        }
    }
    ```
    
    Example for clarification:
    ```json
    {
        "response": {
            "answer": "Yes, I prefer the morning flight"
        }
    }
    ```
    """
    try:
        result = await orchestrator.resume_after_interruption(
            task_id=task_id,
            user_response=request.response
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error"))
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tasks/{task_id}/result")
async def get_task_result(task_id: str):
    """
    Get final result of a completed task.
    
    Only available when status is 'completed'.
    """
    task = await orchestrator.get_task_status(task_id)
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Task not completed. Current status: {task['status']}"
        )
    
    return {
        "task_id": task_id,
        "status": "completed",
        "outcome": task.get("outcome"),
        "result_summary": task.get("context", {}).get("final_result"),
        "validation": task.get("context", {}).get("validation_result"),
        "completed_at": task.get("completed_at"),
        "execution_time_seconds": (
            datetime.fromisoformat(task["completed_at"]) - 
            datetime.fromisoformat(task["created_at"])
        ).total_seconds() if task.get("completed_at") else None
    }


@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """Delete a task."""
    await state_manager.delete_state(task_id)
    return {"success": True, "message": f"Task {task_id} deleted"}


# WebSocket endpoint for real-time updates
@app.websocket("/ws/tasks/{task_id}")
async def task_websocket(websocket: WebSocket, task_id: str):
    """
    WebSocket connection for real-time task updates.
    
    Events sent:
    - `status_change`: {status: "executing", timestamp: "..."}
    - `step_complete`: {step: 3, description: "...", result: {...}}
    - `step_failed`: {step: 3, error: "...", retrying: true}
    - `interrupted`: {reason: "...", data: {...}}
    - `completed`: {result: {...}, validation: {...}}
    - `failed`: {error: "..."}
    """
    await manager.connect(websocket, task_id)
    
    # Register this WebSocket for progress updates
    orchestrator.register_progress_callback(task_id, websocket_progress_callback)
    
    try:
        while True:
            # Receive client messages (ping/keepalive)
            data = await websocket.receive_text()
            
            if data == "ping":
                await websocket.send_text("pong")
            elif data == "status":
                # Send current status
                task = await orchestrator.get_task_status(task_id)
                if task:
                    await websocket.send_json({
                        "type": "status",
                        "data": task
                    })
            
    except WebSocketDisconnect:
        manager.disconnect(task_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(task_id)


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "autonomous-agent-api",
        "timestamp": datetime.utcnow().isoformat(),
        "components": {
            "orchestrator": "active",
            "state_manager": "active"
        }
    }


# Demo endpoints

@app.post("/demo/book-flight")
async def demo_book_flight():
    """Demo endpoint to book a flight."""
    request = CreateTaskRequest(
        user_id="demo_user",
        goal="Book me a flight to Tokyo next week under $800",
        context={
            "home_airport": "LAX",
            "passenger_details": {"name": "John Doe", "email": "john@example.com"}
        }
    )
    return await create_task(request)


@app.post("/demo/schedule-appointment")
async def demo_schedule_appointment():
    """Demo endpoint to schedule a healthcare appointment."""
    request = CreateTaskRequest(
        user_id="demo_user",
        goal="Schedule my annual physical checkup for next week",
        context={
            "preferred_provider": "Dr. Smith",
            "insurance": {"provider": "Blue Cross", "policy": "BC123456"}
        }
    )
    return await create_task(request)


@app.post("/demo/get-approval")
async def demo_get_approval():
    """Demo endpoint for multi-step approval."""
    request = CreateTaskRequest(
        user_id="demo_user",
        goal="Get approval for $50K vendor payment",
        context={
            "vendor": "Acme Corp",
            "invoice_number": "INV-2024-001",
            "approval_type": "payment"
        }
    )
    return await create_task(request)


# ========================================
# Follow-up & Flight Monitoring Endpoints
# ========================================

class AcceptFollowUpRequest(BaseModel):
    suggestion_id: str
    
class TriggerDelayRequest(BaseModel):
    delay_minutes: int = 45


@app.get("/tasks/{task_id}/follow-ups")
async def get_follow_up_suggestions(task_id: str):
    """Get follow-up suggestions for a completed task."""
    suggestions = follow_up_engine.get_pending_suggestions(task_id)
    return {
        "task_id": task_id,
        "suggestions": [s.to_dict() for s in suggestions],
        "count": len(suggestions)
    }


@app.post("/tasks/{task_id}/follow-ups/accept")
async def accept_follow_up(task_id: str, request: AcceptFollowUpRequest):
    """Accept a follow-up suggestion and start the action."""
    suggestion = follow_up_engine.accept_suggestion(task_id, request.suggestion_id)
    
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    # Create a new task for the follow-up action
    new_task = await orchestrator.create_task(
        user_id="demo_user",
        goal=f"{suggestion.title} - {suggestion.description}",
        context={
            "follow_up_type": suggestion.type.value,
            "parent_booking_id": suggestion.parent_booking_id,
            **suggestion.suggested_parameters
        }
    )
    
    # Register WebSocket callback
    orchestrator.register_progress_callback(new_task, websocket_progress_callback)
    
    return {
        "success": True,
        "new_task_id": new_task,
        "message": f"Started: {suggestion.title}",
        "suggestion": suggestion.to_dict()
    }


@app.post("/tasks/{task_id}/follow-ups/dismiss")
async def dismiss_follow_up(task_id: str, request: AcceptFollowUpRequest):
    """Dismiss a follow-up suggestion."""
    success = follow_up_engine.dismiss_suggestion(task_id, request.suggestion_id)
    return {"success": success, "message": "Suggestion dismissed"}


@app.get("/flight-status/{booking_id}")
async def get_flight_status(booking_id: str):
    """Get current flight status."""
    flight = flight_monitor.get_flight_status(booking_id)
    
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not being monitored")
    
    return {
        "success": True,
        "flight": flight.to_dict()
    }


@app.get("/flight-status")
async def get_all_monitored_flights():
    """Get all monitored flights."""
    flights = flight_monitor.get_all_tracked()
    return {
        "flights": [f.to_dict() for f in flights],
        "count": len(flights)
    }


@app.post("/flight-status/{booking_id}/trigger-delay")
async def trigger_demo_delay(booking_id: str, request: TriggerDelayRequest):
    """
    Trigger a simulated flight delay for demo purposes.
    This will send notifications and auto-adjust dependent bookings.
    """
    result = await flight_monitor.trigger_demo_delay(booking_id, request.delay_minutes)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    # Handle dependent booking adjustments
    async def notify_callback(update):
        await manager.broadcast(update)
    
    adjustments = await follow_up_engine.handle_parent_change(
        parent_booking_id=booking_id,
        change_type="delayed",
        change_details={"delay_minutes": request.delay_minutes},
        notify_callback=notify_callback
    )
    
    result["adjustments"] = adjustments
    return result


@app.post("/tasks/{task_id}/start-monitoring")
async def start_flight_monitoring(task_id: str):
    """Start monitoring a flight after booking."""
    task = await orchestrator.get_task_status(task_id)
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    context = task.get("context", {})
    confirmation = context.get("confirmation_details", {})
    
    # Create flight info from booking
    flight_info = flight_monitor.create_flight_from_booking({
        "booking_id": context.get("booking_id") or task_id,
        **confirmation
    })
    
    # Start monitoring with simulation
    flight_monitor.start_monitoring(flight_info, simulate_delay=True)
    
    # Register callback to forward updates via WebSocket
    async def ws_callback(update):
        await manager.broadcast(update)
    
    flight_monitor.register_callback(ws_callback)
    
    return {
        "success": True,
        "message": f"Now monitoring {flight_info.flight_number}",
        "flight": flight_info.to_dict()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

