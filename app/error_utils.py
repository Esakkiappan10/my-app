"""
Error Utilities - Centralized error handling with user-friendly messages
"""
from enum import Enum
from typing import Dict, Optional, List
from dataclasses import dataclass


class ErrorCode(Enum):
    """Standardized error codes for the application"""
    # General errors
    UNKNOWN = "ERR_UNKNOWN"
    TIMEOUT = "ERR_TIMEOUT"
    NETWORK = "ERR_NETWORK"
    
    # Booking errors
    UNAVAILABLE = "ERR_UNAVAILABLE"
    SOLD_OUT = "ERR_SOLD_OUT"
    PRICE_CHANGED = "ERR_PRICE_CHANGED"
    
    # Payment errors
    PAYMENT_DECLINED = "ERR_PAYMENT_DECLINED"
    INSUFFICIENT_FUNDS = "ERR_INSUFFICIENT_FUNDS"
    CARD_EXPIRED = "ERR_CARD_EXPIRED"
    FRAUD_SUSPECTED = "ERR_FRAUD_SUSPECTED"
    
    # User input errors
    INVALID_INPUT = "ERR_INVALID_INPUT"
    MISSING_INFO = "ERR_MISSING_INFO"
    
    # External service errors
    SERVICE_DOWN = "ERR_SERVICE_DOWN"
    API_ERROR = "ERR_API_ERROR"
    RATE_LIMITED = "ERR_RATE_LIMITED"


class ErrorCategory(Enum):
    """Categories for error handling behavior"""
    RECOVERABLE = "recoverable"          # Can retry automatically
    NEEDS_USER_INPUT = "needs_input"     # Requires user action
    FATAL = "fatal"                      # Cannot proceed
    INFORMATIONAL = "info"               # Just FYI, can continue


@dataclass
class ErrorInfo:
    """Structured error information"""
    code: ErrorCode
    category: ErrorCategory
    user_message: str
    technical_message: str
    suggestions: List[str]
    retry_allowed: bool = True
    max_retries: int = 3


# Error definitions with user-friendly messages
ERROR_DEFINITIONS: Dict[ErrorCode, ErrorInfo] = {
    ErrorCode.UNKNOWN: ErrorInfo(
        code=ErrorCode.UNKNOWN,
        category=ErrorCategory.RECOVERABLE,
        user_message="Something went wrong. Please try again.",
        technical_message="Unknown error occurred",
        suggestions=["Try again in a few moments", "Contact support if the issue persists"],
    ),
    ErrorCode.TIMEOUT: ErrorInfo(
        code=ErrorCode.TIMEOUT,
        category=ErrorCategory.RECOVERABLE,
        user_message="The request took too long. Please try again.",
        technical_message="Request timeout",
        suggestions=["Check your internet connection", "Try again"],
    ),
    ErrorCode.NETWORK: ErrorInfo(
        code=ErrorCode.NETWORK,
        category=ErrorCategory.RECOVERABLE,
        user_message="Connection issue. Please check your network.",
        technical_message="Network error",
        suggestions=["Check your internet connection", "Try switching between WiFi and mobile data"],
    ),
    ErrorCode.UNAVAILABLE: ErrorInfo(
        code=ErrorCode.UNAVAILABLE,
        category=ErrorCategory.NEEDS_USER_INPUT,
        user_message="This option is no longer available.",
        technical_message="Resource unavailable",
        suggestions=["Choose a different option", "Search again for updated availability"],
    ),
    ErrorCode.SOLD_OUT: ErrorInfo(
        code=ErrorCode.SOLD_OUT,
        category=ErrorCategory.NEEDS_USER_INPUT,
        user_message="Sorry, this is sold out.",
        technical_message="Item sold out",
        suggestions=["Try different dates", "Look for alternative options", "Join the waitlist"],
    ),
    ErrorCode.PRICE_CHANGED: ErrorInfo(
        code=ErrorCode.PRICE_CHANGED,
        category=ErrorCategory.NEEDS_USER_INPUT,
        user_message="The price has changed since you started.",
        technical_message="Price changed during checkout",
        suggestions=["Review the new price", "Search again for current prices"],
    ),
    ErrorCode.PAYMENT_DECLINED: ErrorInfo(
        code=ErrorCode.PAYMENT_DECLINED,
        category=ErrorCategory.NEEDS_USER_INPUT,
        user_message="Payment was declined. Please try a different payment method.",
        technical_message="Payment declined by processor",
        suggestions=["Try a different card", "Check your card details", "Contact your bank"],
        retry_allowed=True,
        max_retries=2,
    ),
    ErrorCode.INSUFFICIENT_FUNDS: ErrorInfo(
        code=ErrorCode.INSUFFICIENT_FUNDS,
        category=ErrorCategory.NEEDS_USER_INPUT,
        user_message="Insufficient funds. Please use a different payment method.",
        technical_message="Insufficient funds",
        suggestions=["Use a different card", "Add funds to your account"],
    ),
    ErrorCode.CARD_EXPIRED: ErrorInfo(
        code=ErrorCode.CARD_EXPIRED,
        category=ErrorCategory.NEEDS_USER_INPUT,
        user_message="Your card has expired. Please use a different card.",
        technical_message="Card expired",
        suggestions=["Update your card details", "Use a different payment method"],
        retry_allowed=False,
    ),
    ErrorCode.FRAUD_SUSPECTED: ErrorInfo(
        code=ErrorCode.FRAUD_SUSPECTED,
        category=ErrorCategory.FATAL,
        user_message="We couldn't process this payment. Please contact support.",
        technical_message="Fraud check failed",
        suggestions=["Contact customer support", "Verify your identity"],
        retry_allowed=False,
    ),
    ErrorCode.INVALID_INPUT: ErrorInfo(
        code=ErrorCode.INVALID_INPUT,
        category=ErrorCategory.NEEDS_USER_INPUT,
        user_message="Please check your information and try again.",
        technical_message="Invalid input provided",
        suggestions=["Review the information you entered", "Make sure all required fields are filled"],
    ),
    ErrorCode.MISSING_INFO: ErrorInfo(
        code=ErrorCode.MISSING_INFO,
        category=ErrorCategory.NEEDS_USER_INPUT,
        user_message="Some information is missing. Please complete all required fields.",
        technical_message="Required information missing",
        suggestions=["Fill in all required fields", "Check for any highlighted errors"],
    ),
    ErrorCode.SERVICE_DOWN: ErrorInfo(
        code=ErrorCode.SERVICE_DOWN,
        category=ErrorCategory.RECOVERABLE,
        user_message="This service is temporarily unavailable. Please try again later.",
        technical_message="External service unavailable",
        suggestions=["Try again in a few minutes", "We're working to restore service"],
        max_retries=5,
    ),
    ErrorCode.API_ERROR: ErrorInfo(
        code=ErrorCode.API_ERROR,
        category=ErrorCategory.RECOVERABLE,
        user_message="We're having trouble connecting. Please try again.",
        technical_message="External API error",
        suggestions=["Try again", "If the issue persists, contact support"],
    ),
    ErrorCode.RATE_LIMITED: ErrorInfo(
        code=ErrorCode.RATE_LIMITED,
        category=ErrorCategory.RECOVERABLE,
        user_message="Too many requests. Please wait a moment and try again.",
        technical_message="Rate limit exceeded",
        suggestions=["Wait a few seconds before trying again"],
        max_retries=3,
    ),
}


def get_error_info(code: ErrorCode) -> ErrorInfo:
    """Get error info for a given error code"""
    return ERROR_DEFINITIONS.get(code, ERROR_DEFINITIONS[ErrorCode.UNKNOWN])


def parse_technical_error(error_message: str) -> ErrorInfo:
    """
    Parse a technical error message and return user-friendly error info.
    This helps convert Python exceptions and raw errors into user-friendly messages.
    """
    error_lower = error_message.lower()
    
    # Pattern matching for common errors
    if "timeout" in error_lower or "timed out" in error_lower:
        return get_error_info(ErrorCode.TIMEOUT)
    
    if "connection" in error_lower or "network" in error_lower:
        return get_error_info(ErrorCode.NETWORK)
    
    if "not found" in error_lower or "unavailable" in error_lower:
        return get_error_info(ErrorCode.UNAVAILABLE)
    
    if "sold out" in error_lower or "no availability" in error_lower:
        return get_error_info(ErrorCode.SOLD_OUT)
    
    if "payment declined" in error_lower or "declined" in error_lower:
        return get_error_info(ErrorCode.PAYMENT_DECLINED)
    
    if "insufficient" in error_lower:
        return get_error_info(ErrorCode.INSUFFICIENT_FUNDS)
    
    if "expired" in error_lower:
        return get_error_info(ErrorCode.CARD_EXPIRED)
    
    if "rate limit" in error_lower or "too many" in error_lower:
        return get_error_info(ErrorCode.RATE_LIMITED)
    
    if "service" in error_lower and ("down" in error_lower or "unavailable" in error_lower):
        return get_error_info(ErrorCode.SERVICE_DOWN)
    
    # Python-specific errors that shouldn't be shown to users
    python_indicators = [
        "name '", "' is not defined",
        "attributeerror", "typeerror", "keyerror", "valueerror",
        "traceback", "file \"", "line ", "exception",
    ]
    if any(indicator in error_lower for indicator in python_indicators):
        return ErrorInfo(
            code=ErrorCode.UNKNOWN,
            category=ErrorCategory.RECOVERABLE,
            user_message="A system error occurred. Our team has been notified.",
            technical_message=error_message,
            suggestions=["Please try again", "If the issue persists, contact support"],
        )
    
    # Default: return the error with a cleaned message
    return ErrorInfo(
        code=ErrorCode.UNKNOWN,
        category=ErrorCategory.RECOVERABLE,
        user_message=f"An error occurred: {error_message[:100]}..." if len(error_message) > 100 else f"An error occurred: {error_message}",
        technical_message=error_message,
        suggestions=["Please try again"],
    )


def format_error_response(error_info: ErrorInfo) -> Dict:
    """Format error info as a response dictionary"""
    return {
        "success": False,
        "error": {
            "code": error_info.code.value,
            "message": error_info.user_message,
            "category": error_info.category.value,
            "suggestions": error_info.suggestions,
            "can_retry": error_info.retry_allowed,
        }
    }
