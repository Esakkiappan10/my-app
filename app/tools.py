"""
Tool Registry - Manages available tools for task execution
"""
import asyncio
import random
import uuid
from typing import Dict, Callable, Any, List
from abc import ABC, abstractmethod
from datetime import datetime


class Tool(ABC):
    """Base class for all tools"""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
    
    @abstractmethod
    async def execute(self, **params) -> Dict:
        pass


class MockSearchInventoryTool(Tool):
    """Mock tool for searching flights/hotels with realistic data"""
    
    # Realistic airline data
    AIRLINES = [
        {"code": "EK", "name": "Emirates", "logo": "emirates", "hub": "Dubai"},
        {"code": "QR", "name": "Qatar Airways", "logo": "qatar", "hub": "Doha"},
        {"code": "SQ", "name": "Singapore Airlines", "logo": "singapore", "hub": "Singapore"},
        {"code": "NH", "name": "ANA (All Nippon Airways)", "logo": "ana", "hub": "Tokyo"},
        {"code": "JL", "name": "Japan Airlines", "logo": "jal", "hub": "Tokyo"},
        {"code": "CX", "name": "Cathay Pacific", "logo": "cathay", "hub": "Hong Kong"},
        {"code": "TK", "name": "Turkish Airlines", "logo": "turkish", "hub": "Istanbul"},
        {"code": "LH", "name": "Lufthansa", "logo": "lufthansa", "hub": "Frankfurt"},
        {"code": "BA", "name": "British Airways", "logo": "british", "hub": "London"},
        {"code": "AF", "name": "Air France", "logo": "airfrance", "hub": "Paris"},
    ]
    
    AIRCRAFT = ["Boeing 777-300ER", "Airbus A380", "Boeing 787-9 Dreamliner", "Airbus A350-900", "Boeing 777-200LR"]
    
    HOTELS = [
        {"chain": "Marriott Bonvoy", "brands": ["The Ritz-Carlton", "W Hotels", "JW Marriott", "Marriott"]},
        {"chain": "Hilton Honors", "brands": ["Waldorf Astoria", "Conrad", "Hilton", "DoubleTree"]},
        {"chain": "IHG", "brands": ["InterContinental", "Kimpton", "Crowne Plaza", "Holiday Inn"]},
        {"chain": "Hyatt", "brands": ["Park Hyatt", "Grand Hyatt", "Hyatt Regency", "Andaz"]},
        {"chain": "Accor", "brands": ["Raffles", "Fairmont", "Sofitel", "Novotel"]},
    ]
    
    AMENITIES = {
        "luxury": ["🏊 Infinity Pool", "🧖 Spa & Wellness", "🍽️ Michelin Restaurant", "🏋️ Fitness Center", "🛎️ 24/7 Concierge", "🚗 Valet Parking", "📶 High-Speed WiFi"],
        "standard": ["🏊 Pool", "🏋️ Gym", "📶 Free WiFi", "☕ Breakfast Included", "🅿️ Parking"],
        "budget": ["📶 Free WiFi", "☕ Continental Breakfast", "🅿️ Free Parking"],
    }
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(1.2)  # Simulate API call
        
        destination = params.get("destination", "Tokyo")
        budget = params.get("budget", 2000)
        category = params.get("category") or params.get("type", "flight")
        
        results = []
        
        if category.lower() in ["hotel", "stay"]:
            results = self._generate_hotels(destination, budget)
        elif category.lower() in ["cab", "taxi", "ride"]:
            results = self._generate_cabs(destination)
        else:
            results = self._generate_flights(destination, budget)
        
        return {
            "success": True,
            "results": results,
            "count": len(results),
            "search_summary": f"Found {len(results)} options matching your criteria",
            "context_updates": {
                "search_results": results,
                "current_category": category,
                "search_criteria": params,
                "destination": destination
            }
        }
    
    def _generate_flights(self, destination: str, budget: int) -> List[Dict]:
        """Generate realistic flight options"""
        dest_code = destination[:3].upper() if destination else "NRT"
        
        flights = []
        selected_airlines = random.sample(self.AIRLINES, min(4, len(self.AIRLINES)))
        
        base_prices = [random.randint(650, 1800) for _ in range(4)]
        base_prices.sort()
        
        departure_times = ["06:45", "10:30", "14:15", "22:40"]
        durations = ["14h 25m", "15h 10m", "13h 55m", "16h 30m"]
        
        for i, airline in enumerate(selected_airlines):
            flight_num = f"{airline['code']}{random.randint(100, 999)}"
            price = min(base_prices[i], int(budget * 0.95))
            
            flights.append({
                "id": f"flight_{uuid.uuid4().hex[:8]}",
                "type": "flight",
                "flight_number": flight_num,
                "airline": airline["name"],
                "airline_code": airline["code"],
                "aircraft": random.choice(self.AIRCRAFT),
                "origin": {"code": "LAX", "city": "Los Angeles", "terminal": f"Terminal {random.choice(['B', '4', '5', '7'])}"},
                "destination": {"code": dest_code, "city": destination or "Tokyo", "terminal": f"Terminal {random.randint(1, 3)}"},
                "departure": f"2024-02-15T{departure_times[i]}:00",
                "arrival": f"2024-02-16T{random.randint(10, 23):02d}:{random.randint(0, 59):02d}:00",
                "duration": durations[i],
                "stops": random.choice([0, 0, 0, 1]),  # 75% direct
                "class": "Economy",
                "price": price,
                "currency": "USD",
                "baggage": {"carry_on": "1 x 7kg", "checked": "2 x 23kg"},
                "amenities": ["In-flight Entertainment", "USB Power", "WiFi Available", "Meal Included"],
                "seats_left": random.randint(3, 28),
                "refundable": random.choice([True, False]),
            })
        
        return flights
    
    def _generate_hotels(self, destination: str, budget: int) -> List[Dict]:
        """Generate realistic hotel options"""
        hotels = []
        
        hotel_data = [
            {"tier": "luxury", "stars": 5, "price_mult": 1.0},
            {"tier": "luxury", "stars": 5, "price_mult": 0.85},
            {"tier": "standard", "stars": 4, "price_mult": 0.6},
            {"tier": "standard", "stars": 4, "price_mult": 0.45},
        ]
        
        for i, data in enumerate(hotel_data):
            chain = random.choice(self.HOTELS)
            brand = chain["brands"][min(i, len(chain["brands"]) - 1)]
            
            base_price = random.randint(180, 450)
            price = int(base_price * data["price_mult"]) + random.randint(20, 80)
            
            room_types = ["Deluxe King Room", "Premium Suite", "Ocean View Suite", "Executive Room", "Grand Suite"]
            
            hotels.append({
                "id": f"hotel_{uuid.uuid4().hex[:8]}",
                "type": "hotel",
                "name": f"{brand} {destination or 'Tokyo'}",
                "chain": chain["chain"],
                "location": f"{random.choice(['Downtown', 'Midtown', 'Waterfront', 'Central'])} {destination or 'Tokyo'}",
                "address": f"{random.randint(1, 999)} {random.choice(['Grand', 'Park', 'Ocean', 'Central'])} {random.choice(['Avenue', 'Boulevard', 'Street'])}",
                "stars": data["stars"],
                "rating": round(random.uniform(4.2, 4.9), 1),
                "reviews": random.randint(850, 5600),
                "price_per_night": price,
                "currency": "USD",
                "room_type": random.choice(room_types),
                "amenities": self.AMENITIES[data["tier"]],
                "check_in": "3:00 PM",
                "check_out": "11:00 AM",
                "cancellation": "Free cancellation until 24h before check-in",
                "breakfast": random.choice([True, True, False]),
                "distance_to_center": f"{round(random.uniform(0.2, 3.5), 1)} km",
            })
        
        return hotels
    
    def _generate_cabs(self, destination: str) -> List[Dict]:
        """Generate realistic cab/ride options"""
        drivers = ["Michael T.", "Sarah K.", "David L.", "Jennifer M.", "Robert C."]
        vehicles = [
            {"type": "UberX", "name": "Toyota Camry", "capacity": 4, "provider": "Uber"},
            {"type": "UberXL", "name": "Honda Pilot", "capacity": 6, "provider": "Uber"},
            {"type": "Uber Black", "name": "Mercedes E-Class", "capacity": 4, "provider": "Uber"},
            {"type": "Lyft", "name": "Honda Accord", "capacity": 4, "provider": "Lyft"},
            {"type": "Lyft XL", "name": "Chevrolet Suburban", "capacity": 6, "provider": "Lyft"},
        ]
        
        cabs = []
        selected = random.sample(vehicles, 4)
        
        for i, vehicle in enumerate(selected):
            base_price = random.randint(25, 45)
            surge = random.choice([1.0, 1.0, 1.0, 1.2, 1.5])  # 40% chance of surge
            
            cabs.append({
                "id": f"cab_{uuid.uuid4().hex[:8]}",
                "type": "cab",
                "provider": vehicle["provider"],
                "service_type": vehicle["type"],
                "vehicle": vehicle["name"],
                "vehicle_color": random.choice(["Black", "White", "Silver", "Gray"]),
                "license_plate": f"{random.choice(['ABC', 'XYZ', 'DEF'])}-{random.randint(1000, 9999)}",
                "capacity": vehicle["capacity"],
                "driver": random.choice(drivers),
                "driver_rating": round(random.uniform(4.7, 5.0), 1),
                "eta": f"{random.randint(2, 12)} mins",
                "price": int(base_price * surge),
                "surge_multiplier": surge,
                "currency": "USD",
                "payment_methods": ["Card ending ****4242", "Apple Pay", "PayPal"],
            })
        
        cabs.sort(key=lambda x: x["eta"])
        return cabs



class MockSelectBestOptionTool(Tool):
    """Mock tool for selecting best option"""
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(0.5)
        
        # In real implementation, this would use criteria to select
        # For demo, we select based on category or ID
        category = params.get("category", "flight")
        option_id = params.get("option_id", "")
        
        selected_option = {}
        
        if category == "hotel" or option_id.startswith("hotel"):
            selected_option = {
                "id": option_id or "hotel_001",
                "type": "hotel",
                "name": "Grand Hyatt Tokyo",
                "price_per_night": 250,
                "check_in": "2024-02-15",
                "check_out": "2024-02-20"
            }
        elif category == "cab" or option_id.startswith("cab"):
            selected_option = {
                "id": option_id or "cab_001",
                "type": "cab",
                "provider": "Uber",
                "vehicle": "Sedan",
                "price": 45,
                "eta": "5 mins"
            }
        else:
            selected_option = {
                "id": "flight_002",
                "type": "flight",
                "airline": "ANA",
                "price": 680,
                "departure": "2024-02-15T14:00:00Z"
            }
        
        return {
            "success": True,
            "selected_option": selected_option,
            "context_updates": {
                "selected_option": selected_option,
                "estimated_cost": selected_option.get("price", 0),
                "booking_type": selected_option.get("type")
            }
        }


class MockCheckAvailabilityTool(Tool):
    """Mock tool for checking availability"""
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(0.5)
        
        # Simulate occasional unavailability
        if random.random() < 0.1:  # 10% chance of unavailable
            return {
                "success": False,
                "error": "Selected option no longer available",
                "context_updates": {}
            }
        
        return {
            "success": True,
            "available": True,
            "seats_remaining": random.randint(5, 50),
            "context_updates": {
                "availability_confirmed": True
            }
        }


class MockInitiateBookingTool(Tool):
    """Mock tool for initiating booking"""
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(0.5)
        
        return {
            "success": True,
            "booking_session_id": f"session_{random.randint(10000, 99999)}",
            "context_updates": {
                "booking_started": True,
                "booking_session": f"session_{random.randint(10000, 99999)}"
            }
        }


class MockFillDetailsTool(Tool):
    """Mock tool for filling passenger details"""
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(0.5)
        
        passenger_info = params.get("passenger_info", {})
        
        return {
            "success": True,
            "details_filled": True,
            "context_updates": {
                "passenger_name": passenger_info.get("name", "John Doe"),
                "details_complete": True
            }
        }


class MockRequestPaymentApprovalTool(Tool):
    """Mock tool that triggers human interruption for payment"""
    
    async def execute(self, **params) -> Dict:
        # This tool always "fails" to trigger interruption
        amount = params.get("amount", "{{estimated_cost}}")
        description = params.get("description", "Payment required")
        
        # If amount is a template, use a default
        if isinstance(amount, str) and amount.startswith("{{"):
            amount = 680
        
        from .models import HumanInterruptionRequired
        
        raise HumanInterruptionRequired(
            "payment_required",
            {
                "amount": amount,
                "description": description,
                "currency": "USD",
                "payment_methods": ["card_ending_4242", "card_ending_8888"]
            }
        )


class MockProcessPaymentTool(Tool):
    """Mock tool for processing payment"""
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(1)
        
        payment_method = params.get("payment_method", "card_ending_4242")
        
        # Simulate occasional payment failure
        if random.random() < 0.05:  # 5% chance of failure
            return {
                "success": False,
                "error": "Payment declined by bank",
                "context_updates": {}
            }
        
        return {
            "success": True,
            "transaction_id": f"txn_{random.randint(100000, 999999)}",
            "amount_charged": 680,
            "payment_method": payment_method,
            "context_updates": {
                "payment_processed": True,
                "transaction_id": f"txn_{random.randint(100000, 999999)}",
                "amount_paid": 680
            }
        }


class MockRequestUserHelpTool(Tool):
    """Mock tool for requesting user help when stuck"""
    
    async def execute(self, **params) -> Dict:
        error = params.get("error", "Unknown error")
        step_description = params.get("step_description", "Unknown step")
        
        from .models import HumanInterruptionRequired
        
        raise HumanInterruptionRequired(
            "clarification_needed",
            {
                "question": params.get("question", f"I need your help with the step: '{step_description}'. How should I proceed?"),
                "error": error,
                "step": step_description
            }
        )


class MockCaptureConfirmationTool(Tool):
    """Mock tool for capturing booking confirmation with detailed ticket info"""
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(0.6)
        
        booking_type = params.get("booking_type", "flight")
        confirmation_number = f"{random.choice(['EK', 'QR', 'SQ', 'NH'])}{random.randint(100000, 999999)}"
        
        confirmation_details = {}
        
        if booking_type == "hotel":
            confirmation_details = {
                "booking_id": f"HTL-{uuid.uuid4().hex[:8].upper()}",
                "confirmation_number": confirmation_number,
                "status": "✅ Confirmed",
                "hotel": {
                    "name": "The Ritz-Carlton Tokyo",
                    "address": "9-7-1 Akasaka, Minato-ku, Tokyo 107-6245",
                    "phone": "+81 3-3423-8000",
                    "stars": 5,
                },
                "reservation": {
                    "check_in": "Saturday, February 15, 2024 • 3:00 PM",
                    "check_out": "Wednesday, February 20, 2024 • 11:00 AM",
                    "nights": 5,
                    "room_type": "Deluxe King Room with City View",
                    "guests": "2 Adults",
                },
                "amenities_included": ["🍳 Breakfast buffet", "📶 Premium WiFi", "🏊 Pool & Spa access", "🏋️ Fitness center"],
                "total_price": "$1,945",
                "payment_status": "Paid in full",
                "cancellation": "Free cancellation until Feb 13, 2024",
                "special_requests": "High floor, away from elevator",
            }
        elif booking_type == "cab":
            confirmation_details = {
                "booking_id": f"RIDE-{random.randint(10000, 99999)}",
                "confirmation_number": confirmation_number,
                "status": "✅ Driver Assigned",
                "ride": {
                    "provider": "Uber Black",
                    "vehicle": "Mercedes-Benz E-Class",
                    "color": "Black",
                    "license_plate": "8ABC123",
                },
                "driver": {
                    "name": "Michael Thompson",
                    "rating": 4.95,
                    "trips": "5,000+ trips",
                    "phone": "(555) 123-4567",
                },
                "trip": {
                    "pickup": "Los Angeles International Airport (LAX)",
                    "dropoff": "Downtown Los Angeles",
                    "eta": "Arriving in 4 minutes",
                    "estimated_duration": "35-45 mins",
                },
                "fare": {
                    "base": "$45.00",
                    "estimated_total": "$52.50",
                    "payment_method": "Visa ****4242",
                },
            }
        else:  # Flight
            confirmation_details = {
                "booking_id": f"FLT-{uuid.uuid4().hex[:8].upper()}",
                "confirmation_number": confirmation_number,
                "pnr": f"{random.choice(['A', 'B', 'C', 'D'])}{uuid.uuid4().hex[:5].upper()}",
                "status": "✅ E-Ticket Confirmed",
                "flight": {
                    "number": f"EK{random.randint(100, 999)}",
                    "airline": "Emirates",
                    "aircraft": "Airbus A380-800",
                    "operated_by": "Emirates",
                },
                "route": {
                    "origin": {"code": "LAX", "city": "Los Angeles", "airport": "Los Angeles International Airport", "terminal": "Terminal B"},
                    "destination": {"code": "DXB", "city": "Dubai", "airport": "Dubai International Airport", "terminal": "Terminal 3"},
                },
                "schedule": {
                    "departure": "Saturday, February 15, 2024 • 4:25 PM PST",
                    "arrival": "Sunday, February 16, 2024 • 7:30 PM GST",
                    "duration": "16h 5m",
                    "stops": "Non-stop",
                },
                "passenger": {
                    "name": "John Doe",
                    "seat": random.choice(["14A", "22F", "35K", "41C"]),
                    "class": "Economy",
                    "meal": "Standard meal",
                },
                "baggage": {
                    "carry_on": "1 × 7kg",
                    "checked": "2 × 23kg included",
                },
                "fare": {
                    "base_fare": "$1,125.00",
                    "taxes_fees": "$156.50",
                    "total": "$1,281.50",
                    "payment_status": "Paid",
                },
                "important_info": [
                    "✈️ Online check-in opens 48 hours before departure",
                    "🛂 Valid passport required with 6+ months validity",
                    "📱 Download Emirates app for mobile boarding pass",
                ],
            }
        
        return {
            "success": True,
            "confirmation_number": confirmation_number,
            "confirmation_details": confirmation_details,
            "message": f"Booking confirmed! Your confirmation number is {confirmation_number}",
            "context_updates": {
                "confirmation_number": confirmation_number,
                "booking_confirmed": True,
                "confirmation_details": confirmation_details
            }
        }


class MockAddToCalendarTool(Tool):
    """Mock tool for adding to calendar"""
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(0.5)
        
        return {
            "success": True,
            "calendar_event_id": f"evt_{random.randint(10000, 99999)}",
            "context_updates": {
                "calendar_updated": True,
                "event_id": f"evt_{random.randint(10000, 99999)}"
            }
        }


class MockSendNotificationTool(Tool):
    """Mock tool for sending notifications"""
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(0.3)
        
        notification_type = params.get("type", "general")
        
        return {
            "success": True,
            "notification_sent": True,
            "type": notification_type,
            "context_updates": {
                "user_notified": True,
                "notification_type": notification_type
            }
        }


class MockSearchAppointmentsTool(Tool):
    """Mock tool for searching healthcare appointments with realistic data"""
    
    DOCTORS = [
        {"name": "Dr. Sarah Chen", "credentials": "MD, FACP", "specialty": "Internal Medicine", "years_exp": 15},
        {"name": "Dr. Michael Rodriguez", "credentials": "MD, PhD", "specialty": "Cardiology", "years_exp": 20},
        {"name": "Dr. Emily Thompson", "credentials": "MD, FACOG", "specialty": "OB/GYN", "years_exp": 12},
        {"name": "Dr. James Wilson", "credentials": "MD, FACS", "specialty": "General Surgery", "years_exp": 18},
        {"name": "Dr. Priya Patel", "credentials": "MD, FAAD", "specialty": "Dermatology", "years_exp": 10},
        {"name": "Dr. David Kim", "credentials": "MD, FACEP", "specialty": "Emergency Medicine", "years_exp": 14},
        {"name": "Dr. Lisa Anderson", "credentials": "DPM, FACFAS", "specialty": "Podiatry", "years_exp": 8},
        {"name": "Dr. Robert Martinez", "credentials": "MD, FAAN", "specialty": "Neurology", "years_exp": 22},
    ]
    
    CLINICS = [
        {"name": "City Medical Center", "address": "500 Healthcare Blvd, Suite 200"},
        {"name": "Westside Family Practice", "address": "1234 Wellness Drive"},
        {"name": "Downtown Health Partners", "address": "789 Medical Plaza, Floor 3"},
        {"name": "Valley Care Clinic", "address": "2100 Hospital Road"},
    ]
    
    INSURANCE_NETWORKS = ["Blue Cross Blue Shield", "Aetna", "UnitedHealthcare", "Cigna", "Kaiser Permanente", "Humana"]
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(0.8)
        
        service_type = params.get("service", "annual_physical")
        
        # Generate realistic appointment slots
        slots = []
        selected_doctors = random.sample(self.DOCTORS, min(4, len(self.DOCTORS)))
        
        dates = ["2024-02-12", "2024-02-13", "2024-02-14", "2024-02-15"]
        times = ["09:00 AM", "10:30 AM", "02:00 PM", "03:30 PM", "04:45 PM"]
        
        for i, doctor in enumerate(selected_doctors):
            clinic = random.choice(self.CLINICS)
            
            slots.append({
                "id": f"slot_{uuid.uuid4().hex[:8]}",
                "date": dates[i % len(dates)],
                "time": random.choice(times),
                "provider": {
                    "name": doctor["name"],
                    "credentials": doctor["credentials"],
                    "specialty": doctor["specialty"],
                    "experience": f"{doctor['years_exp']} years experience",
                    "rating": round(random.uniform(4.5, 5.0), 1),
                    "reviews": random.randint(120, 850),
                    "photo": "doctor_placeholder"
                },
                "clinic": {
                    "name": clinic["name"],
                    "address": clinic["address"],
                    "phone": f"(555) {random.randint(100, 999)}-{random.randint(1000, 9999)}"
                },
                "visit_type": service_type.replace("_", " ").title(),
                "duration": f"{random.choice([15, 30, 45, 60])} minutes",
                "insurance_accepted": random.sample(self.INSURANCE_NETWORKS, 4),
                "copay_estimate": f"${random.choice([25, 30, 40, 50])}",
                "telehealth_available": random.choice([True, True, False]),
            })
        
        return {
            "success": True,
            "available_slots": slots,
            "total_found": len(slots),
            "search_summary": f"Found {len(slots)} available appointments in your area",
            "context_updates": {
                "available_slots": slots,
                "service_type": service_type
            }
        }


class MockBookAppointmentTool(Tool):
    """Mock tool for booking appointments with detailed confirmation"""
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(0.7)
        
        appointment_id = f"APT-{random.randint(100000, 999999)}"
        confirmation_code = f"HC{uuid.uuid4().hex[:6].upper()}"
        
        appointment_details = {
            "appointment_id": appointment_id,
            "confirmation_code": confirmation_code,
            "status": "Confirmed",
            "date": "Monday, February 12, 2024",
            "time": "09:00 AM",
            "duration": "30 minutes",
            "provider": {
                "name": "Dr. Sarah Chen",
                "credentials": "MD, FACP",
                "specialty": "Internal Medicine",
            },
            "clinic": {
                "name": "City Medical Center",
                "address": "500 Healthcare Blvd, Suite 200",
                "phone": "(555) 234-5678",
                "parking": "Free parking available in Lot B"
            },
            "visit_type": "Annual Physical Exam",
            "preparation_instructions": [
                "📋 Bring photo ID and insurance card",
                "💊 Bring list of current medications",
                "🍽️ Fast for 8-12 hours if blood work required",
                "⏰ Arrive 15 minutes early for paperwork"
            ],
            "estimated_copay": "$30",
            "telehealth_option": False,
            "cancellation_policy": "Free cancellation up to 24 hours before appointment",
        }
        
        return {
            "success": True,
            "appointment_id": appointment_id,
            "confirmation_code": confirmation_code,
            "appointment_details": appointment_details,
            "message": "Your appointment has been successfully booked!",
            "context_updates": {
                "appointment_booked": True,
                "appointment_id": appointment_id,
                "appointment_details": appointment_details,
                "appointment_time": "2024-02-12T09:00:00"
            }
        }



class MockIdentifyStakeholdersTool(Tool):
    """Mock tool for identifying approval stakeholders"""
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(0.3)
        
        amount = params.get("amount", 0)
        
        stakeholders = [
            {"name": "Department Head", "email": "dept.head@company.com", "level": 1},
        ]
        
        if amount > 10000:
            stakeholders.append({"name": "CFO", "email": "cfo@company.com", "level": 2})
        
        if amount > 50000:
            stakeholders.append({"name": "CEO", "email": "ceo@company.com", "level": 3})
        
        context_updates = {
            "stakeholders": stakeholders,
            "approval_levels": len(stakeholders)
        }
        
        # Set individual approvers for easy template access
        if len(stakeholders) > 0:
            context_updates["first_approver"] = stakeholders[0]
        if len(stakeholders) > 1:
            context_updates["second_approver"] = stakeholders[1]
        if len(stakeholders) > 2:
            context_updates["third_approver"] = stakeholders[2]
            
        return {
            "success": True,
            "stakeholders": stakeholders,
            "context_updates": context_updates
        }


class MockSendApprovalRequestTool(Tool):
    """Mock tool for sending approval requests"""
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(0.3)
        
        approver = params.get("approver")
        # Handle cases where approver is None or not a dict
        if not approver:
            approver = {"name": "Unknown Stakeholder"}
        elif isinstance(approver, str):
            approver = {"name": approver}
        
        return {
            "success": True,
            "request_sent": True,
            "approver": approver.get("name", "Unknown"),
            "context_updates": {
                "approval_request_sent": True,
                "pending_approver": approver.get("name", "Unknown")
            }
        }


class MockWaitForApprovalTool(Tool):
    """Mock tool that waits for approval - triggers interruption"""
    
    async def execute(self, **params) -> Dict:
        from .models import HumanInterruptionRequired
        
        approver_param = params.get("approver")
        
        # Extract name if approver is a dict
        if isinstance(approver_param, dict):
            approver_name = approver_param.get("name", "Stakeholder")
        elif approver_param:
            approver_name = str(approver_param)
        else:
            approver_name = "Stakeholder"
            
        timeout = params.get("timeout", 48)
        
        raise HumanInterruptionRequired(
            "approval_needed",
            {
                "message": f"Waiting for approval from {approver_name}",
                "approver": approver_name,
                "timeout_hours": timeout,
                "details": "Please review and approve the request"
            }
        )

class MockCreateWorkflowTool(Tool):
    """Mock tool for creating approval workflows"""
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(0.5)
        
        return {
            "success": True,
            "workflow_id": f"wf_{random.randint(1000, 9999)}",
            "context_updates": {
                "workflow_created": True,
                "workflow_id": f"wf_{random.randint(1000, 9999)}"
            }
        }


class MockProcessFinalActionTool(Tool):
    """Mock tool for processing the final action of a workflow"""
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(1)
        action_type = params.get("action_type", "payment")
        
        return {
            "success": True,
            "action_completed": True,
            "action_type": action_type,
            "confirmation_id": f"act_{random.randint(10000, 99999)}",
            "context_updates": {
                "final_action_complete": True,
                "confirmation_id": f"act_{random.randint(10000, 99999)}"
            }
        }
class MockSearchInformationTool(Tool):
    """Mock tool for searching information"""
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(1)
        
        query = params.get("query", "")
        num_results = params.get("num_results", 10)
        
        # Mock search results
        results = [
            {"title": f"Result {i}", "source": f"source{i}.com", "relevance": random.uniform(0.7, 0.95)}
            for i in range(1, min(num_results + 1, 11))
        ]
        
        return {
            "success": True,
            "results": results,
            "context_updates": {
                "search_results": results,
                "sources_found": len(results)
            }
        }


class MockGenerateReportTool(Tool):
    """Mock tool for generating reports"""
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(1)
        
        report_format = params.get("format", "summary")
        
        return {
            "success": True,
            "report_generated": True,
            "format": report_format,
            "report_id": f"rpt_{random.randint(10000, 99999)}",
            "context_updates": {
                "report_generated": True,
                "report_id": f"rpt_{random.randint(10000, 99999)}"
            }
        }



class MockVerifyInsuranceTool(Tool):
    """Mock tool for verifying insurance coverage"""
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(0.5)
        
        provider = params.get("provider", "Unknown Provider")
        member_id = params.get("member_id", "Unknown ID")
        
        return {
            "success": True,
            "verified": True,
            "coverage_details": {
                "plan": "Premium Health",
                "copay": 25,
                "deductible_met": True
            },
            "context_updates": {
                "insurance_verified": True,
                "copay_amount": 25
            }
        }



class MockSetReminderTool(Tool):
    """Mock tool for setting reminders"""
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(0.5)
        
        return {
            "success": True,
            "reminder_id": f"rem_{uuid.uuid4().hex[:8]}",
            "context_updates": {
                "reminder_set": True,
                "reminder_time": params.get("appointment_time", "default")
            }
        }


class MockBookDependentCabTool(Tool):
    """Mock tool for booking a cab linked to a flight arrival"""
    
    VEHICLES = [
        {"provider": "Uber", "type": "UberX", "name": "Toyota Camry"},
        {"provider": "Uber", "type": "Uber Black", "name": "Mercedes E-Class"},
        {"provider": "Lyft", "type": "Lyft XL", "name": "Honda Pilot"},
    ]
    
    DRIVERS = ["Michael T.", "Sarah K.", "James L.", "Emma R.", "David M."]
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(0.8)
        
        linked_booking_id = params.get("linked_booking_id")
        pickup_location = params.get("pickup_location", "Airport Terminal")
        pickup_time = params.get("pickup_time", "7:30 PM")
        
        vehicle = random.choice(self.VEHICLES)
        driver = random.choice(self.DRIVERS)
        booking_id = f"CAB-{uuid.uuid4().hex[:8].upper()}"
        
        cab_details = {
            "booking_id": booking_id,
            "status": "✅ Confirmed",
            "linked_to": {
                "booking_id": linked_booking_id,
                "type": "flight",
            },
            "ride": {
                "provider": vehicle["provider"],
                "service_type": vehicle["type"],
                "vehicle": vehicle["name"],
                "color": random.choice(["Black", "White", "Silver"]),
                "license_plate": f"{random.randint(1, 9)}ABC{random.randint(100, 999)}",
            },
            "driver": {
                "name": driver,
                "rating": round(random.uniform(4.8, 5.0), 2),
                "photo": "driver_placeholder",
            },
            "pickup": {
                "location": pickup_location,
                "time": pickup_time,
                "terminal": f"Terminal {random.choice(['1', '2', '3', 'B'])}",
                "meeting_point": "Arrivals Hall, near baggage claim",
            },
            "fare": {
                "estimated": f"${random.randint(35, 65)}.00",
                "payment_method": "Visa ****4242",
            },
            "auto_adjust": True,
            "notes": "Driver will track your flight and adjust pickup time if delayed",
        }
        
        return {
            "success": True,
            "booking_id": booking_id,
            "cab_details": cab_details,
            "message": f"🚗 Cab booked! {driver} will pick you up at {pickup_time}",
            "context_updates": {
                "cab_booked": True,
                "cab_booking_id": booking_id,
                "cab_details": cab_details,
                "linked_flight_id": linked_booking_id,
            }
        }


class MockReschedulePickupTool(Tool):
    """Mock tool for rescheduling a pickup due to flight delay"""
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(0.5)
        
        cab_booking_id = params.get("cab_booking_id")
        new_pickup_time = params.get("new_pickup_time")
        delay_reason = params.get("delay_reason", "Flight delayed")
        
        return {
            "success": True,
            "booking_id": cab_booking_id,
            "rescheduled": True,
            "new_pickup_time": new_pickup_time,
            "message": f"✅ Pickup rescheduled to {new_pickup_time}",
            "notification_sent": True,
            "context_updates": {
                "pickup_rescheduled": True,
                "new_pickup_time": new_pickup_time,
                "reschedule_reason": delay_reason,
            }
        }


class MockMonitorFlightTool(Tool):
    """Mock tool for starting flight monitoring"""
    
    async def execute(self, **params) -> Dict:
        await asyncio.sleep(0.3)
        
        flight_booking_id = params.get("flight_booking_id")
        flight_number = params.get("flight_number", "EK215")
        
        return {
            "success": True,
            "monitoring_started": True,
            "flight_booking_id": flight_booking_id,
            "flight_number": flight_number,
            "message": f"📡 Now monitoring {flight_number} for status updates",
            "context_updates": {
                "flight_monitoring": True,
                "monitored_flight_id": flight_booking_id,
            }
        }



class ToolRegistry:
    """Registry of all available tools"""
    
    def __init__(self):
        self.tools: Dict[str, Tool] = {}
        self._register_default_tools()
    
    def register(self, tool: Tool):
        """Register a tool"""
        self.tools[tool.name] = tool
    
    def get_handler(self, tool_name: str) -> Callable:
        """Get the handler function for a tool"""
        tool = self.tools.get(tool_name)
        if not tool:
            # Try to find a similar tool
            for name, t in self.tools.items():
                if tool_name in name or name in tool_name:
                    return t.execute
            raise ValueError(f"Tool '{tool_name}' not found")
        return tool.execute
    
    def get_tool(self, tool_name: str) -> Tool:
        """Get a tool instance"""
        return self.tools.get(tool_name)
    
    def list_tools(self) -> List[str]:
        """List all registered tool names"""
        return list(self.tools.keys())
    
    def _register_default_tools(self):
        """Register default mock tools"""
        # Travel tools
        self.register(MockSearchInventoryTool("search_inventory", "Search flights/hotels"))
        self.register(MockSelectBestOptionTool("select_best_option", "Select best option"))
        self.register(MockCheckAvailabilityTool("check_availability", "Check availability"))
        self.register(MockInitiateBookingTool("initiate_booking", "Initiate booking"))
        self.register(MockFillDetailsTool("fill_details", "Fill passenger details"))
        self.register(MockRequestPaymentApprovalTool("request_payment_approval", "Request payment approval"))
        self.register(MockProcessPaymentTool("process_payment", "Process payment"))
        self.register(MockCaptureConfirmationTool("capture_confirmation", "Capture confirmation"))
        self.register(MockAddToCalendarTool("add_to_calendar", "Add to calendar"))
        self.register(MockSendNotificationTool("send_notification", "Send notification"))
        
        # Healthcare tools
        self.register(MockSearchAppointmentsTool("search_appointments", "Search appointments"))
        self.register(MockBookAppointmentTool("book_appointment", "Book appointment"))
        self.register(MockVerifyInsuranceTool("verify_insurance", "Verify insurance coverage"))
        
        # Alias for planner compatibility
        self.register(MockSelectBestOptionTool("select-appointment", "Select an appointment slot"))
        self.register(MockSelectBestOptionTool("select_appointment", "Select an appointment slot"))
        
        # Reminder/Calendar tools
        self.register(MockAddToCalendarTool("add_to_calendar", "Add to calendar"))
        self.register(MockSetReminderTool("set_reminder", "Set a reminder"))
        
        # Business tools
        self.register(MockIdentifyStakeholdersTool("identify_stakeholders", "Identify stakeholders"))
        self.register(MockSendApprovalRequestTool("send_approval_request", "Send approval request"))
        self.register(MockWaitForApprovalTool("wait_for_approval", "Wait for approval"))
        self.register(MockCreateWorkflowTool("create_workflow", "Create workflow"))
        self.register(MockProcessFinalActionTool("process_final_action", "Process final action"))
        
        # Research tools
        self.register(MockSearchInformationTool("search_information", "Search information"))
        self.register(MockGenerateReportTool("generate_report", "Generate report"))
        
        # Dependent booking tools
        self.register(MockBookDependentCabTool("book_dependent_cab", "Book cab linked to flight"))
        self.register(MockReschedulePickupTool("reschedule_pickup", "Reschedule pickup time"))
        self.register(MockMonitorFlightTool("monitor_flight", "Start flight monitoring"))
        
        # Generic tools
        self.register(MockRequestUserHelpTool("request_user_help", "Request user help"))
        
        for tool in ToolRegistry._create_generic_tools():
            self.register(tool)
    
    @staticmethod
    def _create_generic_tools():
        """Create generic tools that can be used across domains"""
        
        class GenericAnalyzeTool(Tool):
            async def execute(self, **params):
                await asyncio.sleep(0.3)
                return {
                    "success": True,
                    "analysis_complete": True,
                    "context_updates": {"analyzed": True}
                }
        
        class GenericExecuteTool(Tool):
            async def execute(self, **params):
                await asyncio.sleep(0.5)
                return {
                    "success": True,
                    "executed": True,
                    "context_updates": {"executed": True}
                }
        
        class GenericVerifyTool(Tool):
            async def execute(self, **params):
                await asyncio.sleep(0.3)
                return {
                    "success": True,
                    "verified": True,
                    "context_updates": {"verified": True}
                }
        
        return [
            GenericAnalyzeTool("analyze_task", "Analyze task"),
            GenericExecuteTool("execute_action", "Execute action"),
            GenericVerifyTool("verify_results", "Verify results")
        ]


# Global tool registry instance
tool_registry = ToolRegistry()
