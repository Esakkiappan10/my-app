"""
Agent Orchestrator - Main coordination engine for the autonomous agent
Production-level with comprehensive error handling and state management
"""
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, Callable

from .models import (
    TaskState, TaskStatus, OutcomeDefinition, ExecutionStep,
    HumanInterruptionRequired, StateTransitionError, STATE_TRANSITIONS
)
from .state_manager import state_manager
from .interpreter import OutcomeInterpreter
from .planner import PlannerEngine
from .executor import ExecutorEngine
from .retry_engine import RetryEngine
from .validator import CompletionValidator
from .tools import tool_registry


class AgentOrchestrator:
    """
    Main orchestrator that coordinates all components.
    Manages task lifecycle from start to completion.
    """
    
    def __init__(self):
        # Initialize components
        self.interpreter = OutcomeInterpreter()
        self.planner = PlannerEngine()
        self.executor = ExecutorEngine(tool_registry)
        self.retry_engine = RetryEngine()
        self.validator = CompletionValidator()
        
        # Progress callbacks
        self.progress_callbacks: Dict[str, Callable] = {}
    
    async def create_task(self, user_id: str, goal: str, context: Dict = None) -> str:
        """
        Entry point: User submits a goal.
        
        Args:
            user_id: Unique user identifier
            goal: User's goal description
            context: Optional additional context
            
        Returns:
            task_id: Unique task identifier for tracking
        """
        # Validate input
        if not goal or not goal.strip():
            raise ValueError("Goal cannot be empty. Please describe what you need done.")
        
        if len(goal.strip()) < 10:
            raise ValueError("Please provide more details about what you need done.")
        
        task = TaskState(
            user_id=user_id,
            context=context or {}
        )
        task.context["goal"] = goal.strip()
        
        # Save initial state
        await state_manager.save_state(task)
        
        # Start processing in background
        asyncio.create_task(self._process_task(task.task_id))
        
        return task.task_id
    
    async def _process_task(self, task_id: str):
        """
        Main processing loop for a task.
        Implements the state machine.
        """
        task = await state_manager.load_state(task_id)
        if not task:
            print(f"Task {task_id} not found")
            return
        
        try:
            print(f"\n{'='*60}")
            print(f"Processing task: {task_id}")
            print(f"Goal: {task.context.get('goal', 'Unknown')}")
            print(f"{'='*60}\n")
            
            # State: ANALYZING
            await self._transition_state(task, TaskStatus.ANALYZING)
            await self._broadcast_update(task, {"type": "status_change", "status": "analyzing"})
            
            task.outcome = await self.interpreter.interpret(
                task.context["goal"],
                task.context
            )
            
            # Check if clarification is needed
            if task.outcome.constraints.get("needs_clarification"):
                await self._request_clarification(task, task.outcome.constraints.get("clarification_question"))
                return
            
            print(f"Outcome interpreted:")
            print(f"  Domain: {task.outcome.domain}")
            print(f"  Success criteria: {task.outcome.success_criteria}")
            await state_manager.save_state(task)
            
            # State: PLANNING
            await self._transition_state(task, TaskStatus.PLANNING)
            await self._broadcast_update(task, {"type": "status_change", "status": "planning"})
            
            task.plan = await self.planner.create_plan(task.outcome, task.context)
            print(f"Plan generated with {len(task.plan)} steps")
            for i, step in enumerate(task.plan):
                print(f"  {i+1}. {step.description}")
            await state_manager.save_state(task)
            
            # State: EXECUTING
            await self._transition_state(task, TaskStatus.EXECUTING)
            await self._broadcast_update(task, {"type": "status_change", "status": "executing"})
            
            # Execute the plan
            await self._execute_plan(task)
            
        except HumanInterruptionRequired as e:
            await self._handle_interruption(task, e)
            
        except StateTransitionError as e:
            print(f"\nState transition error: {e}")
            await self._notify_failure(task, str(e))
            
        except Exception as e:
            print(f"\nTask failed with error: {e}")
            import traceback
            traceback.print_exc()
            
            try:
                await self._transition_state(task, TaskStatus.FAILED)
            except StateTransitionError:
                task.status = TaskStatus.FAILED  # Force state change on failure
            
            await self._notify_failure(task, str(e))
        
        finally:
            await state_manager.save_state(task)
    
    async def _execute_plan(self, task: TaskState):
        """
        Execute the task plan from current step index.
        Handles interruptions and failures gracefully.
        """
        while task.current_step_index < len(task.plan):
            step_idx = task.current_step_index
            step = task.plan[step_idx]
            
            # Skip already completed steps
            if step.status.value == "completed":
                task.current_step_index += 1
                continue
            
            print(f"\n--- Step {step_idx + 1}/{len(task.plan)} ---")
            print(f"Description: {step.description}")
            print(f"Action: {step.action_type}")
            
            try:
                # Execute with retry
                result = await self.retry_engine.execute_with_retry(
                    step,
                    self.executor.execute_step,
                    task.context
                )
                
                if result["success"]:
                    # Update context with results
                    task.context.update(result["result"].get("context_updates", {}))
                    task.history.append({
                        "step": step_idx,
                        "action": step.action_type,
                        "result": "success",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                    
                    # Broadcast progress
                    await self._broadcast_update(task, {
                        "type": "step_complete",
                        "step": step_idx + 1,
                        "total_steps": len(task.plan),
                        "description": step.description
                    })
                    
                    # Move to next step
                    task.current_step_index += 1
                    await state_manager.save_state(task)
                    
                elif result.get("needs_replan"):
                    # Replan from this point
                    print(f"Step needs replanning, generating alternative plan...")
                    new_plan = await self.planner.replan(task, step_idx, result["error"])
                    task.plan = new_plan
                    await state_manager.save_state(task)
                    continue
                    
                elif result.get("exhausted"):
                    # All retries exhausted
                    raise Exception(f"Step {step_idx + 1} exhausted all retries: {result.get('error', 'Unknown error')}")
                    
            except HumanInterruptionRequired as e:
                # Re-raise to be handled by caller
                raise
        
        # All steps completed - validate
        await self._validate_and_complete(task)
    
    async def _validate_and_complete(self, task: TaskState):
        """Validate task completion and notify user."""
        # State: VALIDATING
        await self._transition_state(task, TaskStatus.VALIDATING)
        await self._broadcast_update(task, {"type": "status_change", "status": "validating"})
        
        validation = await self.validator.validate_completion(
            task.outcome,
            task.context,
            task.history
        )
        
        print(f"\nValidation result:")
        print(f"  Completed: {validation['completed']}")
        print(f"  Confidence: {validation['confidence']:.2%}")
        
        if validation["completed"]:
            # Task complete!
            await self._transition_state(task, TaskStatus.COMPLETED)
            await self._notify_completion(task, validation)
        else:
            # Need to do more work
            # Need to do more work
            print(f"Validation failed, replanning...")
            
            # Check for infinite loop/max replans
            replan_count = task.context.get("_replan_count", 0)
            if replan_count >= 3:
                print(f"Max replan attempts ({replan_count}) reached. Forcing completion.")
                # Consider it partial success or just stop
                await self._transition_state(task, TaskStatus.COMPLETED)
                validation["note"] = "Forced completion after max retries"
                await self._notify_completion(task, validation)
                return

            if validation.get("needs_more_work"):
                task.context["_replan_count"] = replan_count + 1
                
                # Generate additional steps
                new_steps = await self.planner.create_plan(task.outcome, task.context)
                task.plan.extend(new_steps)
                task.status = TaskStatus.EXECUTING  # Direct assignment to avoid transition issues
                await state_manager.save_state(task)
                # Continue execution
                await self._execute_plan(task)
            else:
                await self._transition_state(task, TaskStatus.FAILED)
                await self._notify_failure(task, "Validation failed and cannot replan")
    
    async def _handle_interruption(self, task: TaskState, e: HumanInterruptionRequired):
        """Handle interruption by pausing task and notifying user."""
        try:
            await self._transition_state(task, TaskStatus.INTERRUPTED)
        except StateTransitionError:
            task.status = TaskStatus.INTERRUPTED  # Force if needed
        
        task.interrupt_reason = e.reason
        task.interrupt_data = e.data
        await state_manager.save_state(task)
        
        print(f"\nTask interrupted: {e.reason}")
        await self._broadcast_update(task, {
            "type": "interrupted",
            "reason": e.reason,
            "data": e.data
        })
    
    async def _request_clarification(self, task: TaskState, question: str):
        """Request clarification from user."""
        task.status = TaskStatus.INTERRUPTED
        task.interrupt_reason = "clarification_needed"
        task.interrupt_data = {"question": question}
        await state_manager.save_state(task)
        
        print(f"\nClarification needed: {question}")
        await self._broadcast_update(task, {
            "type": "interrupted",
            "reason": "clarification_needed",
            "data": {"question": question}
        })
    
    async def _transition_state(self, task: TaskState, new_state: TaskStatus):
        """Validate and execute state transition."""
        allowed = STATE_TRANSITIONS.get(task.status, [])
        if new_state not in allowed:
            raise StateTransitionError(
                f"Invalid transition: {task.status.value} → {new_state.value}"
            )
        
        old_state = task.status
        task.status = new_state
        task.updated_at = datetime.utcnow()
        
        print(f"State transition: {old_state.value} → {new_state.value}")
    
    async def _notify_completion(self, task: TaskState, validation: Dict):
        """Notify user of task completion."""
        task.completed_at = datetime.utcnow()
        
        # Build result summary
        result_summary = self._build_result_summary(task)
        task.context["final_result"] = result_summary
        task.context["validation_result"] = validation
        
        print(f"\n{'='*60}")
        print(f"TASK COMPLETED: {task.task_id}")
        print(f"{'='*60}")
        print(f"Result: {result_summary}")
        
        await self._broadcast_update(task, {
            "type": "completed",
            "result": result_summary,
            "validation": validation
        })
    
    async def _notify_failure(self, task: TaskState, error: str):
        """Notify user of task failure."""
        print(f"\n{'='*60}")
        print(f"TASK FAILED: {task.task_id}")
        print(f"Error: {error}")
        print(f"{'='*60}")
        
        await self._broadcast_update(task, {
            "type": "failed",
            "error": error
        })
    
    def _build_result_summary(self, task: TaskState) -> Dict:
        """Build a summary of the completed task."""
        context = task.context
        
        summary = {
            "task_id": task.task_id,
            "goal": task.outcome.original_goal if task.outcome else context.get("goal"),
            "domain": task.outcome.domain if task.outcome else "unknown",
            "completed_at": task.completed_at.isoformat() if task.completed_at else None,
            "total_steps": len(task.plan),
            "completed_steps": sum(1 for s in task.plan if s.status.value == "completed")
        }
        
        # Add domain-specific details
        if task.outcome and task.outcome.domain == "travel":
            summary.update({
                "confirmation_number": context.get("confirmation_number"),
                "flight_details": context.get("confirmation_details"),
                "amount_paid": context.get("amount_paid"),
                "calendar_updated": context.get("calendar_updated", False)
            })
        
        elif task.outcome and task.outcome.domain == "healthcare":
            summary.update({
                "appointment_id": context.get("appointment_id"),
                "appointment_details": context.get("appointment_details"),
                "provider": context.get("appointment_details", {}).get("provider") if context.get("appointment_details") else None
            })
        
        elif task.outcome and task.outcome.domain == "business":
            summary.update({
                "approvals_obtained": context.get("approvals_obtained", True),
                "final_action": context.get("final_action", "completed")
            })
        
        return summary
    
    async def resume_after_interruption(self, task_id: str, user_response: Dict) -> Dict:
        """
        Resume task after human provides input.
        
        Args:
            task_id: Task to resume
            user_response: User's response to the interruption
            
        Returns:
            Dict with status
        """
        task = await state_manager.load_state(task_id)
        if not task:
            return {"success": False, "error": "Task not found"}
        
        if task.status != TaskStatus.INTERRUPTED:
            return {"success": False, "error": f"Task not interrupted (status: {task.status.value})"}
        
        print(f"\nResuming task {task_id} after interruption")
        print(f"User response: {user_response}")
        
        # Inject user response into context
        task.context["user_response"] = user_response
        
        # Handle specific interruption types
        if task.interrupt_reason == "payment_required":
            if user_response.get("approved"):
                task.context["user_payment_method"] = user_response.get("payment_method", "default")
                task.context["payment_approved"] = True
                # Mark payment step as done and move to next
                if task.current_step_index < len(task.plan):
                    current_step = task.plan[task.current_step_index]
                    current_step.status = StepStatus.COMPLETED
                    current_step.result = {"approved": True, "method": user_response.get("payment_method")}
                    task.current_step_index += 1
            else:
                # User declined payment
                task.status = TaskStatus.FAILED
                task.context["failure_reason"] = "Payment declined by user"
                await state_manager.save_state(task)
                await self._notify_failure(task, "Payment declined by user")
                return {"success": False, "error": "Payment declined"}
        
        elif task.interrupt_reason == "approval_needed":
            if user_response.get("approved"):
                task.context["approval_response"] = user_response
                task.context["approval_received"] = True
                # Mark approval step as done
                if task.current_step_index < len(task.plan):
                    current_step = task.plan[task.current_step_index]
                    current_step.status = StepStatus.COMPLETED
                    current_step.result = {"approved": True}
                    task.current_step_index += 1
            else:
                task.status = TaskStatus.FAILED
                await state_manager.save_state(task)
                await self._notify_failure(task, "Approval denied by user")
                return {"success": False, "error": "Approval denied"}
        
        elif task.interrupt_reason == "clarification_needed":
            task.context["clarification_answer"] = user_response.get("answer")
            # Re-analyze with new info
            task.context["goal"] = f"{task.context.get('goal', '')} - Additional info: {user_response.get('answer', '')}"
            
            # Use user answer for current step if it exists
            if task.plan and task.current_step_index < len(task.plan):
                current_step = task.plan[task.current_step_index]
                if current_step.action_type == "request_user_help":
                    current_step.status = StepStatus.COMPLETED
                    current_step.result = {"user_response": user_response.get("answer")}
                    task.current_step_index += 1
        
        # Clear interruption state
        task.interrupt_reason = None
        task.interrupt_data = None
        
        # If we have a plan, we are executing
        if task.plan:
            task.status = TaskStatus.EXECUTING
            await state_manager.save_state(task)
            asyncio.create_task(self._resume_execution(task_id))
        else:
            # We were likely analyzing/planning, restart process
            task.status = TaskStatus.PENDING # Reset to pending to allow clean start
            await state_manager.save_state(task)
            asyncio.create_task(self._process_task(task_id))
        
        return {"success": True, "status": "resumed"}
    
    async def _resume_execution(self, task_id: str):
        """
        Resume task execution from current step.
        Called after interruption is resolved.
        """
        task = await state_manager.load_state(task_id)
        if not task:
            print(f"Task {task_id} not found for resume")
            return
        
        try:
            print(f"\n{'='*60}")
            print(f"Resuming task: {task_id}")
            print(f"From step: {task.current_step_index + 1}/{len(task.plan)}")
            print(f"{'='*60}\n")
            
            await self._broadcast_update(task, {"type": "status_change", "status": "executing"})
            
            # Continue execution from current step
            await self._execute_plan(task)
            
        except HumanInterruptionRequired as e:
            await self._handle_interruption(task, e)
            
        except Exception as e:
            print(f"\nResume failed with error: {e}")
            import traceback
            traceback.print_exc()
            
            task.status = TaskStatus.FAILED
            await state_manager.save_state(task)
            await self._notify_failure(task, str(e))
    
    async def get_task_status(self, task_id: str) -> Optional[Dict]:
        """Get current status of a task."""
        task = await state_manager.load_state(task_id)
        if not task:
            return None
        
        return task.to_dict()
    
    async def get_all_tasks(self) -> list:
        """Get all tasks."""
        return await state_manager.get_all_tasks()
    
    def register_progress_callback(self, task_id: str, callback: Callable):
        """Register a callback for task progress updates."""
        self.progress_callbacks[task_id] = callback
    
    def unregister_progress_callback(self, task_id: str):
        """Unregister a callback for task progress updates."""
        self.progress_callbacks.pop(task_id, None)
    
    async def _broadcast_update(self, task: TaskState, update: Dict):
        """Broadcast update to registered callbacks."""
        update["task_id"] = task.task_id
        update["timestamp"] = datetime.utcnow().isoformat()
        
        callback = self.progress_callbacks.get(task.task_id)
        if callback:
            try:
                await callback(update)
            except Exception as e:
                print(f"Error calling progress callback: {e}")


# Import StepStatus for use in resume method
from .models import StepStatus

# Global orchestrator instance
orchestrator = AgentOrchestrator()
