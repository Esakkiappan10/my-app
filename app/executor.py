"""
Executor Engine - Executes individual steps and manages plan execution
"""
import asyncio
from typing import Dict, Callable, List, Set
from datetime import datetime

from .models import ExecutionStep, TaskState, StepStatus, ExecutionError, HumanInterruptionRequired


class ExecutorEngine:
    """
    Executes steps using appropriate handlers.
    Manages concurrency and dependencies.
    """
    
    def __init__(self, tool_registry):
        self.tools = tool_registry
        self.active_executions: Dict[str, asyncio.Task] = {}
    
    async def execute_step(self, step: ExecutionStep, context: Dict) -> Dict:
        """
        Execute a single step with the appropriate tool.
        
        Args:
            step: The execution step to run
            context: Shared context across steps
            
        Returns:
            Dict with execution results and context updates
        """
        step.status = StepStatus.IN_PROGRESS
        step.started_at = datetime.utcnow()
        
        try:
            # Get the tool handler
            handler = self.tools.get_handler(step.action_type)
            
            # Resolve template parameters from context
            params = self._resolve_parameters(step.parameters, context)
            
            print(f"Executing step: {step.description}")
            print(f"  Action: {step.action_type}")
            print(f"  Parameters: {params}")
            
            # Execute with timeout
            result = await asyncio.wait_for(
                handler(**params),
                timeout=300  # 5 minute timeout per step
            )
            
            step.status = StepStatus.COMPLETED
            step.completed_at = datetime.utcnow()
            step.result = result
            
            print(f"  ✓ Step completed successfully")
            
            return {
                "success": True,
                "result": result,
                "context_updates": result.get("context_updates", {})
            }
            
        except asyncio.TimeoutError:
            step.status = StepStatus.FAILED
            step.error = "Step execution timed out (5 minutes)"
            raise ExecutionError(f"Step {step.id} timed out")
        
        except HumanInterruptionRequired:
            # Re-raise interruption - don't wrap in ExecutionError
            raise
            
        except Exception as e:
            step.status = StepStatus.FAILED
            step.error = str(e)
            raise ExecutionError(f"Step {step.id} failed: {e}")
    
    def _resolve_parameters(self, params: Dict, context: Dict) -> Dict:
        """
        Replace {{variable}} placeholders with values from context.
        Also handles nested dictionaries.
        """
        resolved = {}
        
        for key, value in params.items():
            if isinstance(value, str):
                if value.startswith("{{") and value.endswith("}}"):
                    # Direct template variable
                    var_name = value[2:-2]
                    resolved[key] = context.get(var_name)
                elif "{{" in value and "}}" in value:
                    # String with embedded template variables
                    import re
                    def replace_var(match):
                        var_name = match.group(1)
                        return str(context.get(var_name, match.group(0)))
                    resolved[key] = re.sub(r'\{\{(\w+)\}\}', replace_var, value)
                else:
                    resolved[key] = value
            elif isinstance(value, dict):
                # Recursively resolve nested dictionaries
                resolved[key] = self._resolve_parameters(value, context)
            elif isinstance(value, list):
                # Resolve items in lists
                resolved_list = []
                for item in value:
                    if isinstance(item, str) and item.startswith("{{") and item.endswith("}}"):
                        var_name = item[2:-2]
                        resolved_list.append(context.get(var_name))
                    else:
                        resolved_list.append(item)
                resolved[key] = resolved_list
            else:
                resolved[key] = value
        
        return resolved
    
    async def execute_plan(
        self,
        plan: List[ExecutionStep],
        context: Dict,
        progress_callback: Callable = None
    ) -> Dict:
        """
        Execute full plan respecting dependencies.
        
        Args:
            plan: List of execution steps
            context: Shared context
            progress_callback: Optional callback for progress updates
            
        Returns:
            Dict with success status and final context
        """
        completed_steps: Set[str] = set()
        step_index_map = {step.id: i for i, step in enumerate(plan)}
        
        while len(completed_steps) < len(plan):
            # Find ready steps (dependencies met and not yet completed)
            ready_steps = [
                step for step in plan
                if step.id not in completed_steps
                and step.status != StepStatus.COMPLETED
                and all(dep in completed_steps for dep in step.dependencies)
            ]
            
            if not ready_steps:
                # Check for deadlocks
                pending = [s for s in plan if s.id not in completed_steps]
                if pending:
                    pending_info = [
                        f"{s.id} (depends on: {s.dependencies})" 
                        for s in pending
                    ]
                    raise ExecutionError(f"Deadlock detected: {pending_info}")
                break
            
            print(f"\nExecuting batch of {len(ready_steps)} step(s)...")
            
            # Execute ready steps (can be parallel if independent)
            tasks = []
            for step in ready_steps:
                task = self.execute_step(step, context)
                tasks.append((step, task))
            
            # Wait for all to complete
            results = await asyncio.gather(
                *[t[1] for t in tasks],
                return_exceptions=True
            )
            
            # Process results
            for (step, _), result in zip(tasks, results):
                if isinstance(result, Exception):
                    step.status = StepStatus.FAILED
                    step.error = str(result)
                    
                    # Call progress callback if provided
                    if progress_callback:
                        await progress_callback({
                            "type": "step_failed",
                            "step_id": step.id,
                            "step_index": step_index_map.get(step.id, 0),
                            "error": str(result)
                        })
                    
                    return {
                        "success": False,
                        "failed_step": step,
                        "error": result,
                        "step_index": step_index_map.get(step.id, 0)
                    }
                else:
                    # Success - mark completed and update context
                    completed_steps.add(step.id)
                    context.update(result.get("context_updates", {}))
                    
                    # Call progress callback if provided
                    if progress_callback:
                        await progress_callback({
                            "type": "step_complete",
                            "step_id": step.id,
                            "step_index": step_index_map.get(step.id, 0),
                            "description": step.description,
                            "result": result
                        })
            
            print(f"  Progress: {len(completed_steps)}/{len(plan)} steps completed")
        
        return {
            "success": True,
            "context": context,
            "completed_steps": len(completed_steps)
        }
    
    async def execute_step_at_index(
        self,
        task: TaskState,
        step_index: int,
        progress_callback: Callable = None
    ) -> Dict:
        """
        Execute a single step by index and update task state.
        
        Args:
            task: The task state
            step_index: Index of step to execute
            progress_callback: Optional callback for progress
            
        Returns:
            Dict with execution result
        """
        if step_index >= len(task.plan):
            return {"success": False, "error": "Step index out of range"}
        
        step = task.plan[step_index]
        
        try:
            result = await self.execute_step(step, task.context)
            task.context.update(result.get("context_updates", {}))
            
            if progress_callback:
                await progress_callback({
                    "type": "step_complete",
                    "step_id": step.id,
                    "step_index": step_index,
                    "description": step.description,
                    "result": result
                })
            
            return {"success": True, "result": result}
            
        except Exception as e:
            if progress_callback:
                await progress_callback({
                    "type": "step_failed",
                    "step_id": step.id,
                    "step_index": step_index,
                    "error": str(e)
                })
            
            return {"success": False, "error": str(e)}
