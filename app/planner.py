"""
Planner Engine - Generates execution plans to achieve outcomes
"""
import json
import os
from typing import List, Dict, Any

from .models import OutcomeDefinition, ExecutionStep


class PlannerEngine:
    """
    Creates step-by-step plan to achieve outcome.
    Adapts plan based on available tools and domain.
    """
    
    def __init__(self):
        self.use_llm = os.getenv("USE_LLM", "false").lower() == "true"
        self.api_key = os.getenv("OPENAI_API_KEY", "")
    
    async def create_plan(self, outcome: OutcomeDefinition, context: Dict) -> List[ExecutionStep]:
        """
        Generate execution plan based on outcome and domain.
        """
        if self.use_llm and self.api_key:
            try:
                return await self._create_plan_with_llm(outcome, context)
            except Exception as e:
                print(f"LLM planning failed: {e}, falling back to template")
                return await self._create_plan_template(outcome, context)
        else:
            return await self._create_plan_template(outcome, context)
    
    async def _create_plan_with_llm(self, outcome: OutcomeDefinition, context: Dict) -> List[ExecutionStep]:
        """Use LLM to generate plan"""
        import openai
        client = openai.AsyncOpenAI(api_key=self.api_key)
        
        available_tools = self._get_tools_for_domain(outcome.domain)
        
        system_prompt = f"""You are a Planning Engine for an autonomous agent.

Available tools for {outcome.domain} domain:
{json.dumps(available_tools, indent=2)}

Create an execution plan where each step:
1. Uses exactly one tool/action
2. Has clear input parameters
3. Specifies dependencies (previous steps required)
4. Includes retry strategy
5. Has failure fallback

Output JSON format:
{{
    "steps": [
        {{
            "description": "what this step does",
            "action_type": "tool_name",
            "parameters": {{"key": "value"}},
            "dependencies": [],
            "max_retries": 3,
            "failure_strategy": "retry|skip|alternative|human"
        }}
    ]
}}"""

        response = await client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Success criteria: {json.dumps(outcome.success_criteria)}\nContext: {json.dumps(context)}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        
        plan_data = json.loads(response.choices[0].message.content)
        
        steps = []
        for step_data in plan_data.get("steps", []):
            steps.append(ExecutionStep(
                description=step_data["description"],
                action_type=step_data["action_type"],
                parameters=step_data.get("parameters", {}),
                dependencies=step_data.get("dependencies", []),
                max_retries=step_data.get("max_retries", 3)
            ))
        
        return steps
    
    async def _create_plan_template(self, outcome: OutcomeDefinition, context: Dict) -> List[ExecutionStep]:
        """Create plan using domain-specific templates"""
        
        domain_planners = {
            "travel": self._plan_travel,
            "healthcare": self._plan_healthcare,
            "business": self._plan_business,
            "admin": self._plan_admin,
            "research": self._plan_research,
            "other": self._plan_generic
        }
        
        planner = domain_planners.get(outcome.domain, self._plan_generic)
        return await planner(outcome, context)
    
    async def _plan_travel(self, outcome: OutcomeDefinition, context: Dict) -> List[ExecutionStep]:
        """Generate travel booking plan with detailed step descriptions"""
        steps = []
        destination = context.get("destination", "Tokyo")
        budget = outcome.constraints.get("budget", 2000)
        
        # Step 1: Search with detailed description
        steps.append(ExecutionStep(
            description=f"🔍 Searching 500+ flights across Emirates, Qatar Airways, Singapore Airlines to {destination}",
            action_type="search_inventory",
            parameters={
                "destination": destination,
                "dates": context.get("dates", "next_week"),
                "budget": budget
            },
            max_retries=3
        ))
        
        # Step 2: Select best option
        steps.append(ExecutionStep(
            description=f"📊 Analyzing options and selecting best flight based on price, duration, and reviews",
            action_type="select_best_option",
            parameters={
                "criteria": "price_preference"
            },
            dependencies=[steps[0].id],
            max_retries=2
        ))
        
        # Step 3: Check availability
        steps.append(ExecutionStep(
            description="✅ Verifying seat availability and current pricing with airline",
            action_type="check_availability",
            parameters={},
            dependencies=[steps[1].id],
            max_retries=3
        ))
        
        # Step 4: Initiate booking
        steps.append(ExecutionStep(
            description="📝 Starting secure booking session with airline",
            action_type="initiate_booking",
            parameters={},
            dependencies=[steps[2].id],
            max_retries=2
        ))
        
        # Step 5: Fill details
        steps.append(ExecutionStep(
            description="👤 Entering passenger details and preferences",
            action_type="fill_details",
            parameters={
                "passenger_info": context.get("passenger_details", {})
            },
            dependencies=[steps[3].id],
            max_retries=2
        ))
        
        # Step 6: Request payment approval
        steps.append(ExecutionStep(
            description=f"💳 Requesting payment approval for booking (up to ${budget})",
            action_type="request_payment_approval",
            parameters={
                "amount": "{{estimated_cost}}",
                "description": outcome.original_goal
            },
            dependencies=[steps[4].id],
            max_retries=1
        ))
        
        # Step 7: Process payment
        steps.append(ExecutionStep(
            description="🔒 Processing secure payment through encrypted gateway",
            action_type="process_payment",
            parameters={
                "payment_method": "{{user_payment_method}}"
            },
            dependencies=[steps[5].id],
            max_retries=2
        ))
        
        # Step 8: Capture confirmation
        steps.append(ExecutionStep(
            description="🎫 Generating e-ticket and booking confirmation",
            action_type="capture_confirmation",
            parameters={},
            dependencies=[steps[6].id],
            max_retries=3
        ))
        
        # Step 9: Add to calendar
        steps.append(ExecutionStep(
            description="📅 Adding flight to your calendar with reminders",
            action_type="add_to_calendar",
            parameters={
                "booking_details": "{{booking_details}}"
            },
            dependencies=[steps[7].id],
            max_retries=2
        ))
        
        # Step 10: Send confirmation
        steps.append(ExecutionStep(
            description="📧 Sending confirmation email with e-ticket and itinerary",
            action_type="send_notification",
            parameters={
                "type": "confirmation",
                "booking_details": "{{booking_details}}"
            },
            dependencies=[steps[7].id],
            max_retries=3
        ))
        
        return steps
    
    async def _plan_healthcare(self, outcome: OutcomeDefinition, context: Dict) -> List[ExecutionStep]:
        """Generate healthcare appointment plan with detailed descriptions"""
        steps = []
        service = context.get("service", "annual_physical").replace("_", " ").title()
        
        steps.append(ExecutionStep(
            description=f"🏥 Searching nearby clinics for {service} appointments",
            action_type="search_appointments",
            parameters={
                "provider": context.get("provider", "any"),
                "service": context.get("service", "annual_physical"),
                "timeframe": outcome.constraints.get("timeframe", "next_week")
            },
            max_retries=3
        ))
        
        steps.append(ExecutionStep(
            description="👨‍⚕️ Selecting best available doctor based on ratings and availability",
            action_type="select_appointment",
            parameters={},
            dependencies=[steps[0].id],
            max_retries=2
        ))
        
        steps.append(ExecutionStep(
            description="🔍 Verifying insurance coverage and estimating copay",
            action_type="verify_insurance",
            parameters={
                "insurance_info": context.get("insurance", {})
            },
            dependencies=[steps[1].id],
            max_retries=2
        ))
        
        steps.append(ExecutionStep(
            description="✅ Confirming appointment with clinic",
            action_type="book_appointment",
            parameters={},
            dependencies=[steps[2].id],
            max_retries=3
        ))
        
        steps.append(ExecutionStep(
            description="📅 Adding appointment to your calendar",
            action_type="add_to_calendar",
            parameters={
                "appointment_details": "{{appointment_details}}"
            },
            dependencies=[steps[3].id],
            max_retries=2
        ))
        
        steps.append(ExecutionStep(
            description="⏰ Setting reminder for 24 hours before appointment",
            action_type="set_reminder",
            parameters={
                "appointment_time": "{{appointment_time}}"
            },
            dependencies=[steps[3].id],
            max_retries=2
        ))
        
        steps.append(ExecutionStep(
            description="📧 Sending confirmation with preparation instructions",
            action_type="send_notification",
            parameters={
                "type": "appointment_confirmation"
            },
            dependencies=[steps[3].id],
            max_retries=3
        ))
        
        return steps
    
    async def _plan_business(self, outcome: OutcomeDefinition, context: Dict) -> List[ExecutionStep]:
        """Generate business approval workflow plan"""
        steps = []
        
        # Step 1: Identify stakeholders
        steps.append(ExecutionStep(
            description="Identify required approvers",
            action_type="identify_stakeholders",
            parameters={
                "approval_type": context.get("approval_type", "payment"),
                "amount": outcome.constraints.get("budget", 0)
            },
            max_retries=2
        ))
        
        # Step 2: Create approval workflow
        steps.append(ExecutionStep(
            description="Create sequential approval workflow",
            action_type="create_workflow",
            parameters={},
            dependencies=[steps[0].id],
            max_retries=2
        ))
        
        # Step 3: Send to first approver
        steps.append(ExecutionStep(
            description="Send approval request to first stakeholder",
            action_type="send_approval_request",
            parameters={
                "approver": "{{first_approver}}",
                "details": outcome.original_goal
            },
            dependencies=[steps[1].id],
            max_retries=3
        ))
        
        # Step 4: Wait for first approval
        steps.append(ExecutionStep(
            description="Wait for first approval (48h timeout)",
            action_type="wait_for_approval",
            parameters={
                "approver": "{{first_approver}}",
                "timeout": 48
            },
            dependencies=[steps[2].id],
            max_retries=1
        ))
        
        # Step 5: Send to second approver (if needed)
        steps.append(ExecutionStep(
            description="Send approval request to second stakeholder",
            action_type="send_approval_request",
            parameters={
                "approver": "{{second_approver}}",
                "details": outcome.original_goal
            },
            dependencies=[steps[3].id],
            max_retries=3
        ))
        
        # Step 6: Wait for second approval
        steps.append(ExecutionStep(
            description="Wait for second approval (48h timeout)",
            action_type="wait_for_approval",
            parameters={
                "approver": "{{second_approver}}",
                "timeout": 48
            },
            dependencies=[steps[4].id],
            max_retries=1
        ))
        
        # Step 7: Process final action
        steps.append(ExecutionStep(
            description="Process payment or sign contract",
            action_type="process_final_action",
            parameters={
                "action_type": context.get("final_action", "payment")
            },
            dependencies=[steps[5].id],
            max_retries=2
        ))
        
        # Step 8: Notify all parties
        steps.append(ExecutionStep(
            description="Send completion notification to all stakeholders",
            action_type="send_notification",
            parameters={
                "type": "approval_complete",
                "recipients": "{{all_stakeholders}}"
            },
            dependencies=[steps[6].id],
            max_retries=3
        ))
        
        return steps
    
    async def _plan_admin(self, outcome: OutcomeDefinition, context: Dict) -> List[ExecutionStep]:
        """Generate admin task plan"""
        steps = []
        
        steps.append(ExecutionStep(
            description="Check requirements and gather needed information",
            action_type="check_requirements",
            parameters={
                "task_type": context.get("task_type", "renewal")
            },
            max_retries=2
        ))
        
        steps.append(ExecutionStep(
            description="Prepare application/documents",
            action_type="prepare_documents",
            parameters={},
            dependencies=[steps[0].id],
            max_retries=2
        ))
        
        steps.append(ExecutionStep(
            description="Submit application",
            action_type="submit_application",
            parameters={},
            dependencies=[steps[1].id],
            max_retries=3
        ))
        
        steps.append(ExecutionStep(
            description="Process payment if required",
            action_type="process_payment",
            parameters={
                "amount": "{{fee_amount}}"
            },
            dependencies=[steps[2].id],
            max_retries=2
        ))
        
        steps.append(ExecutionStep(
            description="Capture confirmation/receipt",
            action_type="capture_confirmation",
            parameters={},
            dependencies=[steps[3].id],
            max_retries=3
        ))
        
        steps.append(ExecutionStep(
            description="Send confirmation to user",
            action_type="send_notification",
            parameters={
                "type": "completion_confirmation"
            },
            dependencies=[steps[4].id],
            max_retries=3
        ))
        
        return steps
    
    async def _plan_research(self, outcome: OutcomeDefinition, context: Dict) -> List[ExecutionStep]:
        """Generate research task plan"""
        steps = []
        
        steps.append(ExecutionStep(
            description="Search for relevant information/sources",
            action_type="search_information",
            parameters={
                "query": outcome.original_goal,
                "num_results": context.get("num_results", 10)
            },
            max_retries=3
        ))
        
        steps.append(ExecutionStep(
            description="Gather and extract key information",
            action_type="extract_information",
            parameters={},
            dependencies=[steps[0].id],
            max_retries=2
        ))
        
        steps.append(ExecutionStep(
            description="Analyze and synthesize findings",
            action_type="analyze_data",
            parameters={},
            dependencies=[steps[1].id],
            max_retries=2
        ))
        
        steps.append(ExecutionStep(
            description="Generate summary/report",
            action_type="generate_report",
            parameters={
                "format": context.get("format", "summary")
            },
            dependencies=[steps[2].id],
            max_retries=2
        ))
        
        steps.append(ExecutionStep(
            description="Deliver results to user",
            action_type="deliver_results",
            parameters={
                "delivery_method": context.get("delivery_method", "email")
            },
            dependencies=[steps[3].id],
            max_retries=3
        ))
        
        return steps
    
    async def _plan_generic(self, outcome: OutcomeDefinition, context: Dict) -> List[ExecutionStep]:
        """Generate generic task plan"""
        steps = []
        
        steps.append(ExecutionStep(
            description="Analyze task requirements",
            action_type="analyze_task",
            parameters={
                "goal": outcome.original_goal
            },
            max_retries=2
        ))
        
        steps.append(ExecutionStep(
            description="Execute primary action",
            action_type="execute_action",
            parameters={},
            dependencies=[steps[0].id],
            max_retries=3
        ))
        
        steps.append(ExecutionStep(
            description="Verify results",
            action_type="verify_results",
            parameters={},
            dependencies=[steps[1].id],
            max_retries=2
        ))
        
        steps.append(ExecutionStep(
            description="Notify user of completion",
            action_type="send_notification",
            parameters={
                "type": "task_complete"
            },
            dependencies=[steps[2].id],
            max_retries=3
        ))
        
        return steps
    
    def _get_tools_for_domain(self, domain: str) -> List[Dict]:
        """Get available tools for a domain"""
        tools = {
            "travel": [
                {"name": "search_inventory", "description": "Search flights/hotels"},
                {"name": "select_best_option", "description": "Select best option"},
                {"name": "check_availability", "description": "Check availability"},
                {"name": "initiate_booking", "description": "Begin booking"},
                {"name": "fill_details", "description": "Enter details"},
                {"name": "process_payment", "description": "Process payment"},
                {"name": "capture_confirmation", "description": "Get confirmation"},
                {"name": "add_to_calendar", "description": "Add to calendar"},
                {"name": "send_notification", "description": "Send notification"}
            ],
            "healthcare": [
                {"name": "search_appointments", "description": "Find available slots"},
                {"name": "select_appointment", "description": "Select slot"},
                {"name": "verify_insurance", "description": "Check insurance"},
                {"name": "book_appointment", "description": "Book appointment"},
                {"name": "set_reminder", "description": "Set reminder"}
            ],
            "business": [
                {"name": "identify_stakeholders", "description": "Find approvers"},
                {"name": "create_workflow", "description": "Create workflow"},
                {"name": "send_approval_request", "description": "Request approval"},
                {"name": "wait_for_approval", "description": "Wait for response"},
                {"name": "process_final_action", "description": "Process action"}
            ],
            "admin": [
                {"name": "check_requirements", "description": "Check requirements"},
                {"name": "prepare_documents", "description": "Prepare docs"},
                {"name": "submit_application", "description": "Submit"},
                {"name": "capture_confirmation", "description": "Get confirmation"}
            ],
            "research": [
                {"name": "search_information", "description": "Search sources"},
                {"name": "extract_information", "description": "Extract data"},
                {"name": "analyze_data", "description": "Analyze"},
                {"name": "generate_report", "description": "Create report"},
                {"name": "deliver_results", "description": "Deliver"}
            ]
        }
        return tools.get(domain, tools.get("travel", []))
    
    async def replan(self, task_state, failure_point: int, error: str) -> List[ExecutionStep]:
        """Adapt plan when something fails - try alternative approach or ask user"""
        completed_steps = task_state.plan[:failure_point]
        failed_step = task_state.plan[failure_point]
        
        print(f"Replanning due to failure in step: {failed_step.description}")
        
        # fallback to asking user for help
        alternative_step = ExecutionStep(
            description=f"Ask user for valid inputs to proceed. Error: {error}",
            action_type="request_user_help",
            parameters={
                "error": str(error),
                "step_description": failed_step.description,
                "original_params": failed_step.parameters
            },
            dependencies=[s.id for s in completed_steps if s.status.value == "completed"][-1:] if completed_steps else [],
            max_retries=2
        )
        
        # Add the alternative step
        new_plan = completed_steps + [alternative_step]
        
        # Add remaining steps with updated dependencies
        # We need to be careful with dependencies. The steps that depended on the failed step
        # should now depend on the help step.
        old_failed_id = failed_step.id
        new_help_id = alternative_step.id
        
        for step in task_state.plan[failure_point + 1:]:
            # Create a copy to avoid mutating original if we were using it (though here we are building new list)
            new_step = step.copy() # ExecutionStep is pydantic, has .copy()
            
            # Update dependencies
            if old_failed_id in new_step.dependencies:
                new_step.dependencies = [new_help_id if d == old_failed_id else d for d in new_step.dependencies]
            
            new_plan.append(new_step)
        
        return new_plan
