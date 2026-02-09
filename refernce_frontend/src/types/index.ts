/**
 * Type definitions for the Autonomous Agent frontend
 */

export type TaskStatus = 
  | 'pending'
  | 'analyzing'
  | 'planning'
  | 'executing'
  | 'waiting'
  | 'retrying'
  | 'interrupted'
  | 'validating'
  | 'completed'
  | 'failed';

export interface ExecutionStep {
  id: string;
  description: string;
  action_type: string;
  parameters: Record<string, any>;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  retry_count: number;
  max_retries: number;
  started_at?: string;
  completed_at?: string;
}

export interface OutcomeDefinition {
  original_goal: string;
  success_criteria: string[];
  validation_method: string;
  deadline?: string;
  domain: string;
  constraints: Record<string, any>;
  potential_risks: string[];
  requires_human_approval_for: string[];
}

export interface Task {
  task_id: string;
  user_id: string;
  status: TaskStatus;
  outcome?: OutcomeDefinition;
  plan: ExecutionStep[];
  current_step_index: number;
  context: Record<string, any>;
  history: any[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
  interrupt_reason?: string;
  interrupt_data?: any;
}

export interface TaskProgress {
  current_step: number;
  total_steps: number;
  current_action?: string;
}

export interface WebSocketMessage {
  type: 'status_change' | 'step_complete' | 'step_failed' | 'interrupted' | 'completed' | 'failed' | 'status';
  task_id: string;
  timestamp: string;
  status?: TaskStatus;
  step?: number;
  total_steps?: number;
  description?: string;
  reason?: string;
  data?: any;
  result?: any;
  error?: string;
}

export interface CreateTaskRequest {
  user_id: string;
  goal: string;
  context?: Record<string, any>;
}

export interface CreateTaskResponse {
  task_id: string;
  status: string;
  message: string;
}

export interface InterruptionResponse {
  response: Record<string, any>;
}
