"""
Outcome Interpreter - Converts vague user goals into measurable success criteria
"""
import json
import os
from typing import Dict, Any

from .models import OutcomeDefinition


class OutcomeInterpreter:
    """
    Converts user goal into measurable success criteria.
    Uses LLM for structured extraction to define 'done' state.
    """
    
    def __init__(self):
        # For demo, we'll use a mock implementation
        # In production, this would use OpenAI or similar
        self.use_llm = os.getenv("USE_LLM", "false").lower() == "true"
        self.api_key = os.getenv("OPENAI_API_KEY", "")
    
    async def interpret(self, user_input: str, user_context: Dict) -> OutcomeDefinition:
        """
        Convert user goal into measurable success criteria.
        
        Example:
        Input: "Book me a flight to Tokyo next week under $800"
        Output: OutcomeDefinition with success criteria, validation method, domain
        """
        
        if self.use_llm and self.api_key:
            return await self._interpret_with_llm(user_input, user_context)
        else:
            return await self._interpret_mock(user_input, user_context)
    
    async def _interpret_with_llm(self, user_input: str, user_context: Dict) -> OutcomeDefinition:
        """Use LLM to interpret the goal"""
        try:
            import openai
            client = openai.AsyncOpenAI(api_key=self.api_key)
            
            system_prompt = """You are an Outcome Interpreter for an autonomous agent system.

Your job: Convert vague user goals into precise, measurable success criteria.

Rules:
1. Success criteria must be binary (yes/no verifiable)
2. Include all implicit requirements (confirmations, notifications, etc.)
3. Define validation method that can programmatically verify completion
4. Extract constraints (budget, deadlines, preferences)
5. Identify domain for tool selection

Output JSON format:
{
    "success_criteria": ["criterion 1", "criterion 2", ...],
    "validation_method": "description of how to verify",
    "domain": "travel|healthcare|admin|business|research|other",
    "constraints": {"budget": "...", "deadline": "...", "preferences": [...]},
    "potential_risks": ["risk 1", "risk 2"],
    "requires_human_approval_for": ["financial transactions", "legal agreements", ...]
}"""

            response = await client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"User context: {json.dumps(user_context)}\n\nGoal: {user_input}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            
            parsed = json.loads(response.choices[0].message.content)
            
            return OutcomeDefinition(
                original_goal=user_input,
                success_criteria=parsed.get("success_criteria", []),
                validation_method=parsed.get("validation_method", "manual_verification"),
                domain=parsed.get("domain", "other"),
                constraints=parsed.get("constraints", {}),
                potential_risks=parsed.get("potential_risks", []),
                requires_human_approval_for=parsed.get("requires_human_approval_for", [])
            )
        except Exception as e:
            print(f"LLM interpretation failed: {e}, falling back to mock")
            return await self._interpret_mock(user_input, user_context)
    
    async def _interpret_mock(self, user_input: str, user_context: Dict) -> OutcomeDefinition:
        """Mock interpretation for demo purposes"""
        user_input_lower = user_input.lower()
        
        # Travel domain detection
        if any(word in user_input_lower for word in ["flight", "book", "hotel", "travel", "trip", "vacation"]):
            # Check for missing critical info
            missing_info = []
            if "destination" not in user_context and not any(city in user_input_lower for city in ["tokyo", "paris", "london", "new york", "dubai"]):
                # Simple city check for demo - in real app would use NER
                # If we don't know where to go and input doesn't look like it has a destination
                pass # For now assume they might be in context or just generic search
            
            # If input is very short, ask for details
            if len(user_input.split()) < 4 and not user_context.get("clarification_answer"):
                return OutcomeDefinition(
                    original_goal=user_input,
                    success_criteria=[],
                    validation_method="manual",
                    domain="travel",
                    constraints={
                        "needs_clarification": True,
                        "clarification_question": "Where would you like to go and when?"
                    }
                )

            return OutcomeDefinition(
                original_goal=user_input,
                success_criteria=[
                    "Flight/hotel booked successfully",
                    "Booking confirmation number obtained",
                    "Confirmation email received",
                    "Added to user's calendar",
                    "All travel details documented"
                ],
                validation_method="verify_booking_confirmation",
                domain="travel",
                constraints=self._extract_constraints(user_input),
                potential_risks=["Price changes", "Availability issues"],
                requires_human_approval_for=["payments_above_500"]
            )
        
        # Healthcare domain detection
        elif any(word in user_input_lower for word in ["appointment", "doctor", "physical", "checkup", "medical", "health"]):
            return OutcomeDefinition(
                original_goal=user_input,
                success_criteria=[
                    "Appointment scheduled with provider",
                    "Date and time confirmed",
                    "Calendar invite sent",
                    "Reminder set",
                    "Insurance verified if needed"
                ],
                validation_method="verify_appointment_confirmation",
                domain="healthcare",
                constraints=self._extract_constraints(user_input),
                potential_risks=["No available slots", "Insurance issues"],
                requires_human_approval_for=[]
            )
        
        # Business/Approval domain detection
        elif any(word in user_input_lower for word in ["approval", "approve", "payment", "sign", "contract", "vendor"]):
            return OutcomeDefinition(
                original_goal=user_input,
                success_criteria=[
                    "All required approvals obtained",
                    "Signatures collected from stakeholders",
                    "Payment processed or contract signed",
                    "Confirmation sent to all parties",
                    "Documentation archived"
                ],
                validation_method="verify_approval_completion",
                domain="business",
                constraints=self._extract_constraints(user_input),
                potential_risks=["Approval delays", "Stakeholder unavailable"],
                requires_human_approval_for=["all_approvals", "payments"]
            )
        
        # Admin domain detection
        elif any(word in user_input_lower for word in ["renew", "license", "form", "apply", "document", "submit"]):
            return OutcomeDefinition(
                original_goal=user_input,
                success_criteria=[
                    "Application/form submitted successfully",
                    "Confirmation received",
                    "Payment processed if required",
                    "Tracking number obtained",
                    "Completion documented"
                ],
                validation_method="verify_submission_confirmation",
                domain="admin",
                constraints=self._extract_constraints(user_input),
                potential_risks=["Missing documents", "Processing delays"],
                requires_human_approval_for=["payments"]
            )
        
        # Research domain detection
        elif any(word in user_input_lower for word in ["research", "find", "summarize", "papers", "report", "analysis"]):
            return OutcomeDefinition(
                original_goal=user_input,
                success_criteria=[
                    "Required information gathered",
                    "Sources verified and documented",
                    "Summary/report generated",
                    "Deliverable shared with user",
                    "Quality criteria met"
                ],
                validation_method="verify_deliverable_quality",
                domain="research",
                constraints=self._extract_constraints(user_input),
                potential_risks=["Insufficient sources", "Information quality"],
                requires_human_approval_for=[]
            )
        
        # Default/generic domain
        else:
            return OutcomeDefinition(
                original_goal=user_input,
                success_criteria=[
                    "Task completed as requested",
                    "Results verified and documented",
                    "User notified of completion"
                ],
                validation_method="manual_verification",
                domain="other",
                constraints=self._extract_constraints(user_input),
                potential_risks=["Unclear requirements"],
                requires_human_approval_for=[]
            )
    
    def _extract_constraints(self, user_input: str) -> Dict[str, Any]:
        """Extract constraints like budget, deadline from user input"""
        constraints = {}
        user_input_lower = user_input.lower()
        
        # Extract budget
        import re
        budget_match = re.search(r'\$(\d+(?:,\d+)*)', user_input)
        if budget_match:
            constraints['budget'] = int(budget_match.group(1).replace(',', ''))
        
        # Extract time constraints
        if 'next week' in user_input_lower:
            constraints['timeframe'] = 'next_week'
        elif 'this week' in user_input_lower:
            constraints['timeframe'] = 'this_week'
        elif 'tomorrow' in user_input_lower:
            constraints['timeframe'] = 'tomorrow'
        elif 'today' in user_input_lower:
            constraints['timeframe'] = 'today'
        
        # Extract deadline
        if 'before' in user_input_lower:
            constraints['has_deadline'] = True
        
        return constraints
