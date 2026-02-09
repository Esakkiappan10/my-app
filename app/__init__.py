"""
Autonomous Agent System

An outcome-driven autonomous AI agent that executes tasks end-to-end.
"""

from .models import (
    TaskState,
    TaskStatus,
    OutcomeDefinition,
    ExecutionStep,
    HumanInterruptionRequired
)
from .orchestrator import orchestrator

__version__ = "1.0.0"
__all__ = [
    "TaskState",
    "TaskStatus",
    "OutcomeDefinition",
    "ExecutionStep",
    "HumanInterruptionRequired",
    "orchestrator"
]
