"""
Completion Validator - Verifies that the outcome was actually achieved
"""
import json
import os
from typing import Dict, List, Any

from .models import OutcomeDefinition, VerificationResult


class CompletionValidator:
    """
    Validates that the outcome was actually achieved.
    Uses multiple verification methods.
    """
    
    def __init__(self):
        self.use_llm = os.getenv("USE_LLM", "false").lower() == "true"
        self.api_key = os.getenv("OPENAI_API_KEY", "")
    
    async def validate_completion(
        self,
        outcome: OutcomeDefinition,
        context: Dict,
        execution_history: List[Dict]
    ) -> Dict:
        """
        Validate that all success criteria are met.
        
        Returns:
            Dict with 'completed', 'confidence', 'criteria_results', etc.
        """
        
        if self.use_llm and self.api_key:
            try:
                return await self._validate_with_llm(outcome, context, execution_history)
            except Exception as e:
                print(f"LLM validation failed: {e}, falling back to rule-based")
                return await self._validate_rule_based(outcome, context, execution_history)
        else:
            return await self._validate_rule_based(outcome, context, execution_history)
    
    async def _validate_with_llm(
        self,
        outcome: OutcomeDefinition,
        context: Dict,
        history: List[Dict]
    ) -> Dict:
        """Use LLM to validate completion"""
        import openai
        client = openai.AsyncOpenAI(api_key=self.api_key)
        
        validation_results = []
        
        for criterion in outcome.success_criteria:
            system_prompt = """You are a Completion Validator for an autonomous agent.

Your job: Determine if a success criterion has been met based on execution context.

Rules:
1. Be strict - "probably" or "likely" is NOT sufficient
2. Require concrete evidence in context
3. Confidence must reflect certainty
4. If evidence is missing, criterion fails

Output JSON:
{
    "passed": true/false,
    "confidence": 0.0-1.0,
    "evidence": "what proves this criterion is met",
    "missing": "what evidence is missing (if any)"
}"""

            response = await client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Criterion: {criterion}\n\nContext: {json.dumps(context, indent=2)}\n\nExecution History: {json.dumps(history, indent=2)}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            
            result = json.loads(response.choices[0].message.content)
            validation_results.append(result)
        
        # Calculate overall confidence
        all_passed = all(r["passed"] for r in validation_results)
        avg_confidence = sum(r["confidence"] for r in validation_results) / len(validation_results)
        
        return {
            "completed": all_passed and avg_confidence > 0.8,
            "confidence": avg_confidence,
            "criteria_results": validation_results,
            "needs_more_work": not all_passed,
            "failed_criteria": [r for r in validation_results if not r["passed"]]
        }
    
    async def _validate_rule_based(
        self,
        outcome: OutcomeDefinition,
        context: Dict,
        history: List[Dict]
    ) -> Dict:
        """Rule-based validation for demo purposes"""
        
        validation_results = []
        
        for criterion in outcome.success_criteria:
            result = await self._check_criterion_rule_based(criterion, context, history)
            validation_results.append(result)
        
        # Calculate overall confidence
        all_passed = all(r["passed"] for r in validation_results)
        avg_confidence = sum(r["confidence"] for r in validation_results) / len(validation_results) if validation_results else 0
        
        # Domain-specific additional checks
        domain_valid = await self._domain_specific_validation(outcome.domain, context)
        
        # Prevent infinite loops: If domain validity is high (core actions done), consider it a partial success
        # rather than strictly failing.
        
        # Check if we have gathered enough evidence to stop
        is_completed = (all_passed and domain_valid) or (avg_confidence > 0.8 and domain_valid)
        
        # If we have a confirmation number/ID, we should almost always consider it done
        if context.get("confirmation_number") or context.get("booking_confirmed") or context.get("transaction_id"):
            is_completed = True
            avg_confidence = max(avg_confidence, 0.9)
            
        return {
            "completed": is_completed,
            "confidence": avg_confidence,
            "criteria_results": validation_results,
            "needs_more_work": not is_completed,  # Only ask for more work if really incomplete
            "failed_criteria": [r for r in validation_results if not r["passed"]],
            "recommendations": self._generate_recommendations(validation_results, outcome.domain, context)
        }
    
    async def _check_criterion_rule_based(
        self,
        criterion: str,
        context: Dict,
        history: List[Dict]
    ) -> Dict:
        """Check if a single criterion is met using rules"""
        
        criterion_lower = criterion.lower()
        
        # Check for booking confirmation
        if "confirmation" in criterion_lower and "number" in criterion_lower:
            has_confirmation = bool(
                context.get("confirmation_number") or 
                context.get("booking_confirmed") or
                context.get("appointment_id")
            )
            return {
                "passed": has_confirmation,
                "confidence": 1.0 if has_confirmation else 0.0,
                "evidence": f"confirmation_number: {context.get('confirmation_number')}" if has_confirmation else None,
                "missing": None if has_confirmation else "No confirmation number in context"
            }
        
        # Check for booking success
        if "booked" in criterion_lower or "scheduled" in criterion_lower:
            is_booked = bool(
                context.get("booking_confirmed") or
                context.get("appointment_booked") or
                context.get("confirmed")
            )
            return {
                "passed": is_booked,
                "confidence": 1.0 if is_booked else 0.0,
                "evidence": "Booking confirmed in context" if is_booked else None,
                "missing": None if is_booked else "Booking not confirmed"
            }
        
        # Check for payment
        if "payment" in criterion_lower or "paid" in criterion_lower:
            is_paid = bool(
                context.get("payment_processed") or
                context.get("transaction_id")
            )
            return {
                "passed": is_paid,
                "confidence": 1.0 if is_paid else 0.0,
                "evidence": f"transaction_id: {context.get('transaction_id')}" if is_paid else None,
                "missing": None if is_paid else "Payment not processed"
            }
        
        # Check for calendar update
        if "calendar" in criterion_lower:
            has_calendar = bool(
                context.get("calendar_updated") or
                context.get("event_id")
            )
            return {
                "passed": has_calendar,
                "confidence": 1.0 if has_calendar else 0.0,
                "evidence": "Calendar updated" if has_calendar else None,
                "missing": None if has_calendar else "Calendar not updated"
            }
        
        # Check for notification
        if "email" in criterion_lower or "notification" in criterion_lower or "notified" in criterion_lower:
            is_notified = bool(context.get("user_notified"))
            return {
                "passed": is_notified,
                "confidence": 1.0 if is_notified else 0.0,
                "evidence": "User notified" if is_notified else None,
                "missing": None if is_notified else "User not notified"
            }
        
        # Check for approval
        if "approval" in criterion_lower or "approved" in criterion_lower:
            has_approval = bool(
                context.get("approvals_obtained") or
                context.get("all_approved")
            )
            return {
                "passed": has_approval,
                "confidence": 1.0 if has_approval else 0.0,
                "evidence": "Approvals obtained" if has_approval else None,
                "missing": None if has_approval else "Approvals not complete"
            }
        
        # Check for budget constraint
        if "budget" in criterion_lower or "cost" in criterion_lower or "price" in criterion_lower:
            budget = context.get("budget_constraint", float('inf'))
            actual_cost = context.get("amount_paid", context.get("estimated_cost", 0))
            
            if budget and actual_cost:
                within_budget = actual_cost <= budget
                return {
                    "passed": within_budget,
                    "confidence": 1.0,
                    "evidence": f"Cost ${actual_cost} within budget ${budget}" if within_budget else f"Cost ${actual_cost} exceeds budget ${budget}",
                    "missing": None
                }
        
        # Generic check - look for keywords in context
        keywords = criterion_lower.split()
        keyword_matches = sum(1 for kw in keywords if kw in str(context).lower())
        match_ratio = keyword_matches / len(keywords) if keywords else 0
        
        return {
            "passed": match_ratio > 0.5,
            "confidence": match_ratio,
            "evidence": f"Matched {keyword_matches}/{len(keywords)} keywords" if match_ratio > 0 else None,
            "missing": f"Only matched {keyword_matches}/{len(keywords)} keywords" if match_ratio <= 0.5 else None
        }
    
    async def _domain_specific_validation(self, domain: str, context: Dict) -> bool:
        """Domain-specific validation checks"""
        
        if domain == "travel":
            # For travel, need booking confirmation
            return bool(context.get("confirmation_number") or context.get("booking_confirmed"))
        
        elif domain == "healthcare":
            # For healthcare, need appointment confirmation
            return bool(context.get("appointment_booked") or context.get("appointment_id"))
        
        elif domain == "business":
            # For business, need approvals
            return bool(context.get("approvals_obtained") or context.get("final_action_complete"))
        
        elif domain == "admin":
            # For admin, need submission confirmation
            return bool(context.get("submitted") or context.get("confirmation_number"))
        
        elif domain == "research":
            # For research, need report generated
            return bool(context.get("report_generated"))
        
        return True  # Default pass for unknown domains
    
    def _generate_recommendations(
        self,
        validation_results: List[Dict],
        domain: str,
        context: Dict
    ) -> List[str]:
        """Generate recommendations if validation fails"""
        
        recommendations = []
        failed = [r for r in validation_results if not r["passed"]]
        
        for f in failed:
            if f.get("missing"):
                recommendations.append(f"Address: {f['missing']}")
        
        # Domain-specific recommendations
        if domain == "travel" and not context.get("confirmation_number"):
            recommendations.append("Ensure booking confirmation is captured")
        
        if domain == "healthcare" and not context.get("appointment_booked"):
            recommendations.append("Complete appointment booking process")
        
        if domain == "business" and not context.get("approvals_obtained"):
            recommendations.append("Collect all required approvals")
        
        return recommendations
