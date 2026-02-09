"""
Flight Monitor - Simulated flight status monitoring service
Demonstrates autonomous agent behavior by tracking flights and triggering adjustments
"""
import asyncio
from typing import Dict, List, Callable, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import random
import uuid


class FlightStatus(Enum):
    """Flight status types"""
    SCHEDULED = "scheduled"
    ON_TIME = "on_time"
    DELAYED = "delayed"
    BOARDING = "boarding"
    DEPARTED = "departed"
    IN_FLIGHT = "in_flight"
    LANDED = "landed"
    CANCELLED = "cancelled"
    DIVERTED = "diverted"


@dataclass
class FlightInfo:
    """Tracked flight information"""
    booking_id: str
    flight_number: str
    airline: str
    origin: str
    destination: str
    scheduled_departure: str
    scheduled_arrival: str
    current_status: FlightStatus = FlightStatus.SCHEDULED
    delay_minutes: int = 0
    gate: str = "TBD"
    terminal: str = "TBD"
    updated_departure: Optional[str] = None
    updated_arrival: Optional[str] = None
    status_history: List[Dict] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "booking_id": self.booking_id,
            "flight_number": self.flight_number,
            "airline": self.airline,
            "origin": self.origin,
            "destination": self.destination,
            "scheduled_departure": self.scheduled_departure,
            "scheduled_arrival": self.scheduled_arrival,
            "current_status": self.current_status.value,
            "status_display": self._get_status_display(),
            "delay_minutes": self.delay_minutes,
            "gate": self.gate,
            "terminal": self.terminal,
            "updated_departure": self.updated_departure or self.scheduled_departure,
            "updated_arrival": self.updated_arrival or self.scheduled_arrival,
        }
    
    def _get_status_display(self) -> Dict:
        """Get display-friendly status with emoji and color"""
        status_map = {
            FlightStatus.SCHEDULED: {"emoji": "📅", "text": "Scheduled", "color": "#64748B"},
            FlightStatus.ON_TIME: {"emoji": "✅", "text": "On Time", "color": "#10B981"},
            FlightStatus.DELAYED: {"emoji": "⚠️", "text": f"Delayed {self.delay_minutes}min", "color": "#F59E0B"},
            FlightStatus.BOARDING: {"emoji": "🚶", "text": "Boarding", "color": "#3B82F6"},
            FlightStatus.DEPARTED: {"emoji": "🛫", "text": "Departed", "color": "#8B5CF6"},
            FlightStatus.IN_FLIGHT: {"emoji": "✈️", "text": "In Flight", "color": "#3B82F6"},
            FlightStatus.LANDED: {"emoji": "🛬", "text": "Landed", "color": "#10B981"},
            FlightStatus.CANCELLED: {"emoji": "❌", "text": "Cancelled", "color": "#EF4444"},
            FlightStatus.DIVERTED: {"emoji": "↩️", "text": "Diverted", "color": "#F59E0B"},
        }
        return status_map.get(self.current_status, {"emoji": "❓", "text": "Unknown", "color": "#64748B"})


class FlightMonitor:
    """
    Simulates real-time flight monitoring.
    In production, this would connect to flight APIs like FlightAware, AeroAPI, etc.
    """
    
    def __init__(self):
        self.tracked_flights: Dict[str, FlightInfo] = {}
        self.status_callbacks: List[Callable] = []
        self.monitoring_tasks: Dict[str, asyncio.Task] = {}
        self._running = False
    
    def register_callback(self, callback: Callable):
        """Register callback for status updates"""
        self.status_callbacks.append(callback)
    
    def start_monitoring(self, flight: FlightInfo, simulate_delay: bool = True):
        """Start monitoring a flight"""
        self.tracked_flights[flight.booking_id] = flight
        
        # Start simulation task
        if simulate_delay:
            task = asyncio.create_task(
                self._simulate_flight_updates(flight.booking_id)
            )
            self.monitoring_tasks[flight.booking_id] = task
        
        return flight
    
    def stop_monitoring(self, booking_id: str):
        """Stop monitoring a flight"""
        if booking_id in self.monitoring_tasks:
            self.monitoring_tasks[booking_id].cancel()
            del self.monitoring_tasks[booking_id]
        if booking_id in self.tracked_flights:
            del self.tracked_flights[booking_id]
    
    def get_flight_status(self, booking_id: str) -> Optional[FlightInfo]:
        """Get current flight status"""
        return self.tracked_flights.get(booking_id)
    
    def get_all_tracked(self) -> List[FlightInfo]:
        """Get all tracked flights"""
        return list(self.tracked_flights.values())
    
    async def _simulate_flight_updates(self, booking_id: str):
        """
        Simulate flight status changes for demo purposes.
        This creates a realistic progression of status updates.
        """
        try:
            flight = self.tracked_flights.get(booking_id)
            if not flight:
                return
            
            # Wait a bit before first update
            await asyncio.sleep(5)
            
            # Update to "On Time" status
            await self._update_status(booking_id, FlightStatus.ON_TIME, gate="B42")
            
            # Simulate potential delay (70% chance for demo)
            await asyncio.sleep(8)
            
            if random.random() < 0.7:  # 70% chance of delay for demo
                delay_minutes = random.choice([15, 30, 45, 60, 90])
                await self._update_status(
                    booking_id, 
                    FlightStatus.DELAYED,
                    delay_minutes=delay_minutes
                )
                
                # Notify about delay
                await self._notify_delay(booking_id, delay_minutes)
            
            # Continue with boarding after some time
            await asyncio.sleep(10)
            await self._update_status(booking_id, FlightStatus.BOARDING)
            
            # Depart
            await asyncio.sleep(5)
            await self._update_status(booking_id, FlightStatus.DEPARTED)
            
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Flight monitoring error: {e}")
    
    async def _update_status(
        self,
        booking_id: str,
        new_status: FlightStatus,
        delay_minutes: int = 0,
        gate: str = None
    ):
        """Update flight status and notify callbacks"""
        flight = self.tracked_flights.get(booking_id)
        if not flight:
            return
        
        old_status = flight.current_status
        flight.current_status = new_status
        
        if delay_minutes:
            flight.delay_minutes = delay_minutes
        
        if gate:
            flight.gate = gate
        
        # Record in history
        flight.status_history.append({
            "timestamp": datetime.now().isoformat(),
            "old_status": old_status.value,
            "new_status": new_status.value,
            "delay_minutes": delay_minutes,
        })
        
        # Notify all callbacks
        update = {
            "type": "flight_status_update",
            "booking_id": booking_id,
            "flight": flight.to_dict(),
            "change": {
                "from": old_status.value,
                "to": new_status.value,
                "delay_minutes": delay_minutes,
            }
        }
        
        for callback in self.status_callbacks:
            try:
                await callback(update)
            except Exception as e:
                print(f"Callback error: {e}")
    
    async def _notify_delay(self, booking_id: str, delay_minutes: int):
        """Send delay notification with adjustment info"""
        flight = self.tracked_flights.get(booking_id)
        if not flight:
            return
        
        notification = {
            "type": "flight_delay_notification",
            "booking_id": booking_id,
            "flight_number": flight.flight_number,
            "delay_minutes": delay_minutes,
            "message": f"Your flight {flight.flight_number} is now delayed by {delay_minutes} minutes",
            "new_arrival": flight.updated_arrival,
            "action_taken": None,  # Will be filled by follow-up engine
        }
        
        for callback in self.status_callbacks:
            try:
                await callback(notification)
            except Exception as e:
                print(f"Notification callback error: {e}")
    
    async def trigger_demo_delay(self, booking_id: str, delay_minutes: int = 45):
        """
        Manually trigger a delay for demo purposes.
        Call this from the API to demonstrate the delay handling flow.
        """
        flight = self.tracked_flights.get(booking_id)
        if not flight:
            return {"error": "Flight not found"}
        
        await self._update_status(
            booking_id,
            FlightStatus.DELAYED,
            delay_minutes=delay_minutes
        )
        await self._notify_delay(booking_id, delay_minutes)
        
        return {
            "success": True,
            "flight": flight.to_dict(),
            "message": f"Triggered {delay_minutes} minute delay for demo"
        }
    
    def create_flight_from_booking(self, booking_details: Dict) -> FlightInfo:
        """Create a FlightInfo from booking confirmation details"""
        # Extract info from various possible structures
        flight_data = booking_details.get("flight", {})
        route_data = booking_details.get("route", {})
        schedule_data = booking_details.get("schedule", {})
        
        flight_number = (
            flight_data.get("number") or 
            booking_details.get("flight_number") or
            f"XX{random.randint(100, 999)}"
        )
        
        airline = (
            flight_data.get("airline") or
            booking_details.get("airline") or
            "Unknown Airline"
        )
        
        origin = (
            route_data.get("origin", {}).get("code") or
            booking_details.get("origin", "LAX")
        )
        
        destination = (
            route_data.get("destination", {}).get("code") or
            booking_details.get("destination", "TYO")
        )
        
        return FlightInfo(
            booking_id=booking_details.get("booking_id", f"bk_{uuid.uuid4().hex[:8]}"),
            flight_number=flight_number,
            airline=airline,
            origin=origin,
            destination=destination,
            scheduled_departure=schedule_data.get("departure", "2024-02-15 4:25 PM"),
            scheduled_arrival=schedule_data.get("arrival", "2024-02-16 7:30 PM"),
            gate=random.choice(["A12", "B24", "C8", "D15"]),
            terminal=f"Terminal {random.choice(['1', '2', '3', 'B'])}",
        )


# Global instance
flight_monitor = FlightMonitor()
