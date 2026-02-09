"""
Follow-up Engine - Intelligent suggestion system for proactive agent actions
"""
import asyncio
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import uuid


class FollowUpType(Enum):
    """Types of follow-up suggestions"""
    CAB_PICKUP = "cab_pickup"
    HOTEL_CHECKOUT_CAB = "hotel_checkout_cab"
    RESTAURANT_NEARBY = "restaurant_nearby"
    CALENDAR_REMINDER = "calendar_reminder"
    RETURN_FLIGHT = "return_flight"
    AIRPORT_LOUNGE = "airport_lounge"


@dataclass
class FollowUpSuggestion:
    """A proactive follow-up suggestion"""
    id: str
    type: FollowUpType
    title: str
    description: str
    emoji: str
    parent_booking_id: str
    parent_booking_type: str
    suggested_parameters: Dict
    priority: int = 1  # 1 = high, 2 = medium, 3 = low
    expires_at: Optional[datetime] = None
    
    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "type": self.type.value,
            "title": self.title,
            "description": self.description,
            "emoji": self.emoji,
            "parent_booking_id": self.parent_booking_id,
            "parent_booking_type": self.parent_booking_type,
            "suggested_parameters": self.suggested_parameters,
            "priority": self.priority,
        }


@dataclass
class DependentBooking:
    """A booking that depends on another booking"""
    id: str
    type: str  # cab, hotel, etc.
    parent_booking_id: str
    parent_type: str
    linked_time_field: str  # e.g., "arrival_time" from parent
    booking_details: Dict
    auto_adjust: bool = True  # Automatically adjust when parent changes


class FollowUpEngine:
    """
    Analyzes completed tasks and generates intelligent follow-up suggestions.
    Also manages dependencies between bookings.
    """
    
    # Define what follow-ups are relevant for each booking type
    FOLLOW_UP_RULES = {
        "flight": [
            {
                "type": FollowUpType.CAB_PICKUP,
                "title": "Book Cab Pickup",
                "emoji": "🚗",
                "description_template": "Would you like me to book a cab pickup at {destination}?",
                "condition": lambda ctx: ctx.get("destination") is not None,
                "priority": 1,
            },
            {
                "type": FollowUpType.HOTEL_CHECKOUT_CAB,
                "emoji": "🏨",
                "title": "Book Hotel Near Airport",
                "description_template": "Need a hotel near {destination} airport?",
                "condition": lambda ctx: True,
                "priority": 2,
            },
            {
                "type": FollowUpType.RETURN_FLIGHT,
                "emoji": "✈️",
                "title": "Book Return Flight",
                "description_template": "Book your return flight from {destination}?",
                "condition": lambda ctx: not ctx.get("round_trip", False),
                "priority": 3,
            },
        ],
        "hotel": [
            {
                "type": FollowUpType.RESTAURANT_NEARBY,
                "emoji": "🍽️",
                "title": "Reserve Restaurant",
                "description_template": "Make dinner reservations near your hotel?",
                "condition": lambda ctx: True,
                "priority": 2,
            },
            {
                "type": FollowUpType.CAB_PICKUP,
                "emoji": "🚗",
                "title": "Checkout Transportation",
                "description_template": "Book a cab for checkout on {checkout_date}?",
                "condition": lambda ctx: ctx.get("checkout_date") is not None,
                "priority": 1,
            },
        ],
        "appointment": [
            {
                "type": FollowUpType.CALENDAR_REMINDER,
                "emoji": "⏰",
                "title": "Set Additional Reminders",
                "description_template": "Add more reminders for your appointment?",
                "condition": lambda ctx: True,
                "priority": 2,
            },
            {
                "type": FollowUpType.CAB_PICKUP,
                "emoji": "🚗",
                "title": "Book Ride to Appointment",
                "description_template": "Book a ride to {clinic_name}?",
                "condition": lambda ctx: ctx.get("clinic_name") is not None,
                "priority": 1,
            },
        ],
    }
    
    def __init__(self):
        self.pending_suggestions: Dict[str, List[FollowUpSuggestion]] = {}
        self.dependent_bookings: Dict[str, List[DependentBooking]] = {}
        self.suggestion_callbacks: List[Callable] = []
    
    def register_callback(self, callback: Callable):
        """Register a callback for when suggestions are generated"""
        self.suggestion_callbacks.append(callback)
    
    async def analyze_completion(
        self,
        task_id: str,
        booking_type: str,
        booking_id: str,
        booking_details: Dict,
        context: Dict
    ) -> List[FollowUpSuggestion]:
        """
        Analyze a completed booking and generate follow-up suggestions.
        
        Args:
            task_id: The task that completed
            booking_type: Type of booking (flight, hotel, cab, appointment)
            booking_id: ID of the completed booking
            booking_details: Details of the booking
            context: Execution context with user preferences
            
        Returns:
            List of follow-up suggestions
        """
        suggestions = []
        rules = self.FOLLOW_UP_RULES.get(booking_type, [])
        
        # Merge booking details and context for condition checking
        combined_context = {**context, **booking_details}
        
        for rule in rules:
            # Check if condition is met
            if rule["condition"](combined_context):
                # Build the suggestion
                description = rule["description_template"].format(**combined_context)
                
                suggestion = FollowUpSuggestion(
                    id=f"followup_{uuid.uuid4().hex[:8]}",
                    type=rule["type"],
                    title=rule["title"],
                    description=description,
                    emoji=rule["emoji"],
                    parent_booking_id=booking_id,
                    parent_booking_type=booking_type,
                    suggested_parameters=self._build_parameters(rule["type"], combined_context),
                    priority=rule["priority"],
                )
                suggestions.append(suggestion)
        
        # Sort by priority
        suggestions.sort(key=lambda s: s.priority)
        
        # Store suggestions
        self.pending_suggestions[task_id] = suggestions
        
        # Notify callbacks
        for callback in self.suggestion_callbacks:
            await callback(task_id, suggestions)
        
        return suggestions
    
    def _build_parameters(self, follow_up_type: FollowUpType, context: Dict) -> Dict:
        """Build suggested parameters for a follow-up action"""
        if follow_up_type == FollowUpType.CAB_PICKUP:
            return {
                "pickup_location": context.get("destination_airport", context.get("destination")),
                "pickup_time": context.get("arrival_time"),
                "linked_booking_id": context.get("booking_id"),
                "linked_booking_type": "flight",
            }
        elif follow_up_type == FollowUpType.RESTAURANT_NEARBY:
            return {
                "location": context.get("hotel_address", context.get("destination")),
                "date": context.get("check_in_date"),
                "party_size": context.get("guests", 2),
            }
        elif follow_up_type == FollowUpType.RETURN_FLIGHT:
            return {
                "origin": context.get("destination"),
                "destination": context.get("origin", "LAX"),
                "date": context.get("return_date"),
            }
        return {}
    
    def get_pending_suggestions(self, task_id: str) -> List[FollowUpSuggestion]:
        """Get pending suggestions for a task"""
        return self.pending_suggestions.get(task_id, [])
    
    def get_top_suggestion(self, task_id: str) -> Optional[FollowUpSuggestion]:
        """Get the highest priority pending suggestion"""
        suggestions = self.pending_suggestions.get(task_id, [])
        return suggestions[0] if suggestions else None
    
    def accept_suggestion(self, task_id: str, suggestion_id: str) -> Optional[FollowUpSuggestion]:
        """Accept a suggestion and remove it from pending"""
        suggestions = self.pending_suggestions.get(task_id, [])
        for i, s in enumerate(suggestions):
            if s.id == suggestion_id:
                return suggestions.pop(i)
        return None
    
    def dismiss_suggestion(self, task_id: str, suggestion_id: str) -> bool:
        """Dismiss a suggestion"""
        suggestions = self.pending_suggestions.get(task_id, [])
        for i, s in enumerate(suggestions):
            if s.id == suggestion_id:
                suggestions.pop(i)
                return True
        return False
    
    def register_dependent_booking(
        self,
        booking: DependentBooking
    ):
        """Register a booking that depends on another"""
        parent_id = booking.parent_booking_id
        if parent_id not in self.dependent_bookings:
            self.dependent_bookings[parent_id] = []
        self.dependent_bookings[parent_id].append(booking)
    
    def get_dependent_bookings(self, parent_booking_id: str) -> List[DependentBooking]:
        """Get all bookings that depend on a parent booking"""
        return self.dependent_bookings.get(parent_booking_id, [])
    
    async def handle_parent_change(
        self,
        parent_booking_id: str,
        change_type: str,  # "delayed", "cancelled", "gate_change"
        change_details: Dict,
        notify_callback: Callable
    ) -> List[Dict]:
        """
        Handle changes to a parent booking and adjust dependents.
        
        Returns list of adjustments made.
        """
        adjustments = []
        dependents = self.get_dependent_bookings(parent_booking_id)
        
        for dependent in dependents:
            if not dependent.auto_adjust:
                continue
            
            if change_type == "delayed":
                # Calculate new time based on delay
                delay_minutes = change_details.get("delay_minutes", 0)
                new_time = self._calculate_new_time(
                    dependent.booking_details.get("pickup_time"),
                    delay_minutes
                )
                
                adjustment = {
                    "booking_id": dependent.id,
                    "booking_type": dependent.type,
                    "change": "rescheduled",
                    "reason": f"Parent flight delayed by {delay_minutes} minutes",
                    "new_pickup_time": new_time,
                    "old_pickup_time": dependent.booking_details.get("pickup_time"),
                }
                
                # Update the booking details
                dependent.booking_details["pickup_time"] = new_time
                adjustments.append(adjustment)
                
                # Notify about the adjustment
                await notify_callback({
                    "type": "booking_adjusted",
                    "adjustment": adjustment,
                })
            
            elif change_type == "cancelled":
                adjustment = {
                    "booking_id": dependent.id,
                    "booking_type": dependent.type,
                    "change": "needs_review",
                    "reason": "Parent booking was cancelled",
                    "action_required": True,
                }
                adjustments.append(adjustment)
                
                await notify_callback({
                    "type": "booking_needs_review",
                    "adjustment": adjustment,
                })
        
        return adjustments
    
    def _calculate_new_time(self, original_time: str, delay_minutes: int) -> str:
        """Calculate new time after delay (simplified)"""
        # For demo, just return a formatted string
        # In production, parse and add minutes properly
        try:
            # Simple time parsing for demo
            if ":" in str(original_time):
                parts = original_time.replace(" PM", "").replace(" AM", "").split(":")
                hour = int(parts[0])
                minute = int(parts[1]) + delay_minutes
                hour += minute // 60
                minute = minute % 60
                period = "PM" if hour >= 12 else "AM"
                if hour > 12:
                    hour -= 12
                return f"{hour}:{minute:02d} {period}"
        except:
            pass
        return f"{original_time} (+{delay_minutes}min)"


# Global instance
follow_up_engine = FollowUpEngine()
