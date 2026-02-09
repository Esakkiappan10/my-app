import { useState, useCallback } from 'react';
import type { CreateTaskRequest, CreateTaskResponse, Task, InterruptionResponse } from '@/types';

const API_BASE_URL = 'http://localhost:8000';

export function useApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTask = useCallback(async (request: CreateTaskRequest): Promise<CreateTaskResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create task');
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTaskStatus = useCallback(async (taskId: string): Promise<Task> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get task status');
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const respondToInterruption = useCallback(async (
    taskId: string,
    response: InterruptionResponse
  ): Promise<{ success: boolean; status?: string; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to respond');
      }

      return await res.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTaskResult = useCallback(async (taskId: string): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/result`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get task result');
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDemoTask = useCallback(async (demoType: 'flight' | 'appointment' | 'approval'): Promise<CreateTaskResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const endpoints = {
        flight: '/demo/book-flight',
        appointment: '/demo/schedule-appointment',
        approval: '/demo/get-approval'
      };

      const response = await fetch(`${API_BASE_URL}${endpoints[demoType]}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create demo task');
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    createTask,
    getTaskStatus,
    respondToInterruption,
    getTaskResult,
    createDemoTask
  };
}
