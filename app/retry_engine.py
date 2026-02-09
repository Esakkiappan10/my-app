"""
Retry Engine - Handles failures and retries with intelligent strategies
"""
import random
import asyncio
import time
from typing import Dict, Callable, Any
from enum import Enum

from .models import ExecutionStep, HumanInterruptionRequired


class RetryStrategy(Enum):
    """Available retry strategies"""
    IMMEDIATE = "immediate"
    EXPONENTIAL = "exponential"
    LINEAR = "linear"
    CIRCUIT_BREAK = "circuit_break"
    ALTERNATIVE = "alternative"
    HUMAN_ESCALATE = "human"


class CircuitBreaker:
    """Circuit breaker pattern to prevent cascade failures"""
    
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 300):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failures: Dict[str, int] = {}
        self.last_failure_time: Dict[str, float] = {}
        self.state: Dict[str, str] = {}  # 'closed', 'open', 'half-open'
    
    def is_open(self, service: str) -> bool:
        """Check if circuit breaker is open for a service"""
        if service not in self.state:
            return False
        
        if self.state[service] == 'open':
            # Check if recovery timeout has passed
            last_fail = self.last_failure_time.get(service, 0)
            if time.time() - last_fail > self.recovery_timeout:
                self.state[service] = 'half-open'
                print(f"Circuit for {service}: HALF-OPEN (testing)")
                return False
            return True
        
        return False
    
    def record_success(self, service: str):
        """Record a successful call"""
        self.failures[service] = max(0, self.failures.get(service, 0) - 1)
        if service in self.state and self.state[service] == 'half-open':
            self.state[service] = 'closed'
            print(f"Circuit for {service}: CLOSED (recovered)")
    
    def record_failure(self, service: str):
        """Record a failed call"""
        self.failures[service] = self.failures.get(service, 0) + 1
        self.last_failure_time[service] = time.time()
        
        if self.failures[service] >= self.failure_threshold:
            self.state[service] = 'open'
            print(f"Circuit for {service}: OPEN (too many failures)")


class RetryEngine:
    """
    Intelligent retry logic with backoff and strategy selection.
    """
    
    def __init__(self):
        self.circuit_breaker = CircuitBreaker()
        self.base_delay = 2.0
    
    async def execute_with_retry(
        self,
        step: ExecutionStep,
        executor: Callable,
        context: Dict
    ) -> Dict:
        """
        Execute step with intelligent retry logic.
        
        Returns:
            Dict with 'success', 'result', 'attempts', 'error', 'needs_replan', 'exhausted'
        """
        last_error = None
        service_name = step.action_type
        
        for attempt in range(step.max_retries + 1):
            step.retry_count = attempt
            
            try:
                # Check circuit breaker
                if self.circuit_breaker.is_open(service_name):
                    print(f"Circuit open for {service_name}, waiting...")
                    await asyncio.sleep(self.circuit_breaker.recovery_timeout)
                
                # Execute the step
                result = await executor(step, context)
                
                # Success - reset failure count
                self.circuit_breaker.record_success(service_name)
                
                return {
                    "success": True,
                    "result": result,
                    "attempts": attempt + 1
                }
                
            except HumanInterruptionRequired:
                # Re-raise interruption - don't retry
                raise
                
            except Exception as e:
                last_error = e
                self.circuit_breaker.record_failure(service_name)
                
                # Determine retry strategy based on error type
                strategy = self._select_strategy(e, attempt, step)
                
                print(f"Step {step.action_type} failed (attempt {attempt + 1}): {e}")
                print(f"Selected strategy: {strategy.value}")
                
                if strategy == RetryStrategy.HUMAN_ESCALATE:
                    raise HumanInterruptionRequired(
                        f"Step failed after {attempt + 1} attempts: {str(e)}",
                        {"step": step.id, "error": str(e), "context": context}
                    )
                
                if strategy == RetryStrategy.ALTERNATIVE:
                    return {
                        "success": False,
                        "needs_replan": True,
                        "error": str(e),
                        "attempts": attempt + 1
                    }
                
                # Calculate and apply delay before retry
                if attempt < step.max_retries:
                    delay = self._calculate_delay(strategy, attempt)
                    print(f"Retrying in {delay:.1f} seconds...")
                    await asyncio.sleep(delay)
        
        # Exhausted all retries
        return {
            "success": False,
            "error": str(last_error),
            "exhausted": True,
            "attempts": step.max_retries + 1
        }
    
    def _select_strategy(self, error: Exception, attempt: int, step: ExecutionStep) -> RetryStrategy:
        """Select retry strategy based on error type."""
        error_str = str(error).lower()
        
        # Network errors - exponential backoff
        if any(x in error_str for x in ["timeout", "connection", "network", "503", "502", "504"]):
            return RetryStrategy.EXPONENTIAL
        
        # Rate limiting - exponential with longer delays
        if any(x in error_str for x in ["rate limit", "429", "too many requests"]):
            return RetryStrategy.EXPONENTIAL
        
        # Authentication errors - try immediate then escalate
        if any(x in error_str for x in ["auth", "unauthorized", "401", "403", "forbidden"]):
            if attempt < 2:
                return RetryStrategy.IMMEDIATE
            return RetryStrategy.HUMAN_ESCALATE
        
        # Not found errors - might need replanning
        if any(x in error_str for x in ["not found", "404", "unavailable", "no longer available"]):
            return RetryStrategy.ALTERNATIVE
        
        # Business logic errors - escalate to human
        if any(x in error_str for x in ["insufficient funds", "invalid", "rejected", "declined"]):
            return RetryStrategy.HUMAN_ESCALATE
        
        # Temporary unavailability - retry with backoff
        if any(x in error_str for x in ["temporarily", "unavailable", "maintenance", "busy"]):
            return RetryStrategy.EXPONENTIAL
        
        # Default - exponential backoff
        return RetryStrategy.EXPONENTIAL
    
    def _calculate_delay(self, strategy: RetryStrategy, attempt: int) -> float:
        """Calculate delay before retry."""
        
        if strategy == RetryStrategy.IMMEDIATE:
            return 0.5
        
        elif strategy == RetryStrategy.EXPONENTIAL:
            # Exponential backoff: 2^attempt * base_delay
            delay = (2 ** attempt) * self.base_delay
            # Add jitter (±25%) to prevent thundering herd
            jitter = delay * 0.25 * (2 * random.random() - 1)
            return delay + jitter
        
        elif strategy == RetryStrategy.LINEAR:
            return attempt * self.base_delay
        
        elif strategy == RetryStrategy.CIRCUIT_BREAK:
            return self.circuit_breaker.recovery_timeout
        
        return self.base_delay
    
    def get_circuit_status(self) -> Dict[str, Any]:
        """Get current circuit breaker status"""
        return {
            "states": self.circuit_breaker.state,
            "failure_counts": self.circuit_breaker.failures
        }
