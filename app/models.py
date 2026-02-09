"""
Core data models for the Autonomous Agent System
"""
from enum import Enum
from typing import List, Dict, Optional, Any, Callable
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import uuid4


class TaskStatus(str, Enum):
    """Task lifecycle states"""
    PENDING = "pending"
    ANALYZING = "analyzing"
    PLANNING = "planning"
    EXECUTING = "executing"
    WAITING = "waiting"
    RETRYING = "retrying"
    INTERRUPTED = "interrupted"
    VALIDATING = "validating"
    COMPLETED = "completed"
    FAILED = "failed"


class StepStatus(str, Enum):
    """Step execution states"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class OutcomeDefinition(BaseModel):
    """Clear definition of what 'done' looks like"""
    original_goal: str
    success_criteria: List[str]
    validation_method: str
    deadline: Optional[datetime] = None
    domain: str
    constraints: Dict[str, Any] = Field(default_factory=dict)
    potential_risks: List[str] = Field(default_factory=list)
    requires_human_approval_for: List[str] = Field(default_factory=list)


class ExecutionStep(BaseModel):
    """Single unit of work in the execution plan"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    description: str
    action_type: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    dependencies: List[str] = Field(default_factory=list)
    status: StepStatus = StepStatus.PENDING
    result: Optional[Any] = None
    error: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class TaskState(BaseModel):
    """Full state of a task execution"""
    task_id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    status: TaskStatus = TaskStatus.PENDING
    outcome: Optional[OutcomeDefinition] = None
    plan: List[ExecutionStep] = Field(default_factory=list)
    current_step_index: int = 0
    context: Dict[str, Any] = Field(default_factory=dict)
    history: List[Dict] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    interrupt_reason: Optional[str] = None
    interrupt_data: Optional[Dict] = None

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "task_id": self.task_id,
            "user_id": self.user_id,
            "status": self.status.value,
            "outcome": self.outcome.dict() if self.outcome else None,
            "plan": [step.dict() for step in self.plan],
            "current_step_index": self.current_step_index,
            "context": self.context,
            "history": self.history,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "interrupt_reason": self.interrupt_reason,
            "interrupt_data": self.interrupt_data
        }


class HumanInterruptionRequired(Exception):
    """Exception raised when human input is required"""
    def __init__(self, reason: str, data: Dict = None):
        self.reason = reason
        self.data = data or {}
        super().__init__(reason)


class ExecutionError(Exception):
    """Exception raised when step execution fails"""
    pass


class StateTransitionError(Exception):
    """Exception raised for invalid state transitions"""
    pass


class TaskNotFoundError(Exception):
    """Exception raised when task is not found"""
    pass


# Valid state transitions
STATE_TRANSITIONS = {
    TaskStatus.PENDING: [TaskStatus.ANALYZING],
    TaskStatus.ANALYZING: [TaskStatus.PLANNING, TaskStatus.INTERRUPTED, TaskStatus.FAILED],
    TaskStatus.PLANNING: [TaskStatus.EXECUTING, TaskStatus.INTERRUPTED, TaskStatus.FAILED],
    TaskStatus.EXECUTING: [TaskStatus.WAITING, TaskStatus.RETRYING, TaskStatus.VALIDATING, 
                           TaskStatus.INTERRUPTED, TaskStatus.FAILED],
    TaskStatus.WAITING: [TaskStatus.EXECUTING, TaskStatus.INTERRUPTED],
    TaskStatus.RETRYING: [TaskStatus.EXECUTING, TaskStatus.FAILED],
    TaskStatus.INTERRUPTED: [TaskStatus.EXECUTING, TaskStatus.FAILED],
    TaskStatus.VALIDATING: [TaskStatus.COMPLETED, TaskStatus.EXECUTING, TaskStatus.FAILED],
}


class VerificationResult(BaseModel):
    """Result of completion verification"""
    completed: bool
    confidence: float
    criteria_results: List[Dict] = Field(default_factory=list)
    needs_more_work: bool = False
    failed_criteria: List[Dict] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
