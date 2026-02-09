"""
State Management - Handles persistence of task state
Uses Redis for short-term state and JSON files for demo (PostgreSQL in production)
"""
import json
import os
from datetime import datetime, timedelta
from typing import Optional, Dict
from pathlib import Path

from .models import TaskState, TaskStatus


class StateManager:
    """Manages task state persistence"""
    
    def __init__(self, storage_path: str = "/tmp/agent_states"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self._memory_cache: Dict[str, TaskState] = {}
    
    async def save_state(self, task: TaskState) -> None:
        """Save task state to storage"""
        task.updated_at = datetime.utcnow()
        
        # Save to memory cache
        self._memory_cache[task.task_id] = task
        
        # Save to file for persistence
        file_path = self.storage_path / f"{task.task_id}.json"
        with open(file_path, 'w') as f:
            json.dump(task.to_dict(), f, indent=2, default=str)
    
    async def load_state(self, task_id: str) -> Optional[TaskState]:
        """Load task state from storage"""
        # Check memory cache first
        if task_id in self._memory_cache:
            return self._memory_cache[task_id]
        
        # Load from file
        file_path = self.storage_path / f"{task_id}.json"
        if not file_path.exists():
            return None
        
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        # Reconstruct TaskState
        task = self._dict_to_task_state(data)
        self._memory_cache[task_id] = task
        return task
    
    async def get_all_tasks(self) -> list:
        """Get all task IDs"""
        tasks = []
        for file_path in self.storage_path.glob("*.json"):
            task_id = file_path.stem
            task = await self.load_state(task_id)
            if task:
                tasks.append(task.to_dict())
        return tasks
    
    def _dict_to_task_state(self, data: Dict) -> TaskState:
        """Convert dictionary back to TaskState"""
        from .models import OutcomeDefinition, ExecutionStep, StepStatus
        
        # Parse outcome
        outcome_data = data.get('outcome')
        outcome = None
        if outcome_data:
            outcome = OutcomeDefinition(**outcome_data)
        
        # Parse plan
        plan = []
        for step_data in data.get('plan', []):
            step = ExecutionStep(**step_data)
            plan.append(step)
        
        # Parse dates
        created_at = datetime.fromisoformat(data['created_at']) if data.get('created_at') else datetime.utcnow()
        updated_at = datetime.fromisoformat(data['updated_at']) if data.get('updated_at') else datetime.utcnow()
        completed_at = datetime.fromisoformat(data['completed_at']) if data.get('completed_at') else None
        
        return TaskState(
            task_id=data['task_id'],
            user_id=data['user_id'],
            status=TaskStatus(data['status']),
            outcome=outcome,
            plan=plan,
            current_step_index=data.get('current_step_index', 0),
            context=data.get('context', {}),
            history=data.get('history', []),
            created_at=created_at,
            updated_at=updated_at,
            completed_at=completed_at,
            interrupt_reason=data.get('interrupt_reason'),
            interrupt_data=data.get('interrupt_data')
        )
    
    async def delete_state(self, task_id: str) -> None:
        """Delete task state"""
        if task_id in self._memory_cache:
            del self._memory_cache[task_id]
        
        file_path = self.storage_path / f"{task_id}.json"
        if file_path.exists():
            file_path.unlink()


# Global state manager instance
state_manager = StateManager()
