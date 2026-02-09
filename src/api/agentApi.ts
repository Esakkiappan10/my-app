// API Configuration for connecting to FastAPI backend
// Supports both local development (WebSocket) and Vercel deployment (polling)

// Environment detection
const IS_PRODUCTION = false; // Set to true after deploying to Vercel

// Update this with your Vercel deployment URL after deploying
const VERCEL_URL = 'https://zeromode.vercel.app';

// Local development URLs (use your computer's IP for device testing)
const LOCAL_API_URL = 'http://10.176.150.65:8000';
const LOCAL_WS_URL = 'ws://10.176.150.65:8000';

// Active URLs
const API_BASE_URL = IS_PRODUCTION ? VERCEL_URL : LOCAL_API_URL;
const WS_BASE_URL = LOCAL_WS_URL; // WebSocket only works locally

export interface CreateTaskRequest {
    user_id: string;
    goal: string;
    context?: Record<string, any>;
}

export interface TaskResponse {
    task_id: string;
    status: string;
    message: string;
}

export interface TaskStatus {
    task_id: string;
    user_id: string;
    status: string;
    outcome?: any;
    plan?: any[];
    current_step_index: number;
    context: Record<string, any>;
    history: any[];
    created_at: string;
    updated_at: string;
    completed_at?: string;
    interrupt_reason?: string;
    interrupt_data?: any;
}

export interface PollResponse {
    task_id: string;
    status: string;
    current_step: number;
    total_steps: number;
    plan: any[];
    outcome?: any;
    error?: string;
    updated_at: string;
}

export interface WebSocketMessage {
    type: 'status_change' | 'step_complete' | 'step_failed' | 'interrupted' | 'completed' | 'failed';
    task_id: string;
    timestamp: string;
    status?: string;
    step?: number;
    total_steps?: number;
    description?: string;
    result?: any;
    error?: string;
    reason?: string;
    data?: any;
    validation?: any;
}

// API Functions
export const api = {
    // Create a new task
    async createTask(request: CreateTaskRequest): Promise<TaskResponse> {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`Failed to create task: ${response.statusText}`);
        }

        return response.json();
    },

    // Get all tasks
    async getTasks(): Promise<{ tasks: TaskStatus[] }> {
        const response = await fetch(`${API_BASE_URL}/tasks`);

        if (!response.ok) {
            throw new Error(`Failed to get tasks: ${response.statusText}`);
        }

        return response.json();
    },

    // Create demo task
    async createDemoTask(type: 'flight' | 'appointment' | 'approval'): Promise<TaskResponse> {
        const endpoints = {
            flight: '/demo/book-flight',
            appointment: '/demo/schedule-appointment',
            approval: '/demo/get-approval'
        };
        const response = await fetch(`${API_BASE_URL}${endpoints[type]}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`Failed to create demo task: ${response.statusText}`);
        }

        return response.json();
    },

    // Get task status
    async getTaskStatus(taskId: string): Promise<TaskStatus> {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`);

        if (!response.ok) {
            throw new Error(`Failed to get task status: ${response.statusText}`);
        }

        return response.json();
    },

    // Poll for task updates (for Vercel/serverless deployment)
    async pollTask(taskId: string): Promise<PollResponse> {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/poll`);

        if (!response.ok) {
            throw new Error(`Failed to poll task: ${response.statusText}`);
        }

        return response.json();
    },

    // Respond to interruption
    async respondToInterruption(taskId: string, userResponse: Record<string, any>): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/respond`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ response: userResponse }),
        });

        if (!response.ok) {
            throw new Error(`Failed to respond: ${response.statusText}`);
        }

        return response.json();
    },

    // Get task result
    async getTaskResult(taskId: string): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/result`);

        if (!response.ok) {
            throw new Error(`Failed to get result: ${response.statusText}`);
        }

        return response.json();
    },

    // Health check
    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            return response.ok;
        } catch {
            return false;
        }
    },
};

// WebSocket connection (for local development)
export class TaskWebSocket {
    private ws: WebSocket | null = null;
    private taskId: string;
    private onMessage: (message: WebSocketMessage) => void;
    private onClose?: () => void;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    constructor(
        taskId: string,
        onMessage: (message: WebSocketMessage) => void,
        onClose?: () => void
    ) {
        this.taskId = taskId;
        this.onMessage = onMessage;
        this.onClose = onClose;
    }

    connect() {
        this.ws = new WebSocket(`${WS_BASE_URL}/ws/tasks/${this.taskId}`);

        this.ws.onopen = () => {
            console.log(`WebSocket connected for task: ${this.taskId}`);
            this.reconnectAttempts = 0;
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.onMessage(message);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        this.ws.onclose = () => {
            console.log(`WebSocket closed for task: ${this.taskId}`);
            if (this.onClose) {
                this.onClose();
            }
            this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    private attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
            setTimeout(() => this.connect(), delay);
        }
    }

    sendPing() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send('ping');
        }
    }

    requestStatus() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send('status');
        }
    }

    disconnect() {
        this.maxReconnectAttempts = 0;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

// Polling-based task monitor (for Vercel/serverless deployment)
export class TaskPoller {
    private taskId: string;
    private onUpdate: (message: WebSocketMessage) => void;
    private onComplete?: () => void;
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private pollInterval = 1500; // 1.5 seconds
    private lastStatus: string = '';
    private lastStep: number = 0;

    constructor(
        taskId: string,
        onUpdate: (message: WebSocketMessage) => void,
        onComplete?: () => void
    ) {
        this.taskId = taskId;
        this.onUpdate = onUpdate;
        this.onComplete = onComplete;
    }

    start() {
        // Initial poll
        this.poll();

        // Start polling interval
        this.intervalId = setInterval(() => this.poll(), this.pollInterval);
    }

    private async poll() {
        try {
            const response = await api.pollTask(this.taskId);

            // Detect status changes
            if (response.status !== this.lastStatus) {
                this.onUpdate({
                    type: 'status_change',
                    task_id: this.taskId,
                    timestamp: response.updated_at,
                    status: response.status,
                });
                this.lastStatus = response.status;
            }

            // Detect step progress
            if (response.current_step > this.lastStep && response.plan.length > 0) {
                const currentPlanStep = response.plan[response.current_step - 1];
                this.onUpdate({
                    type: 'step_complete',
                    task_id: this.taskId,
                    timestamp: response.updated_at,
                    step: response.current_step,
                    total_steps: response.total_steps,
                    description: currentPlanStep?.description || `Step ${response.current_step}`,
                });
                this.lastStep = response.current_step;
            }

            // Check for completion
            if (response.status === 'completed') {
                this.onUpdate({
                    type: 'completed',
                    task_id: this.taskId,
                    timestamp: response.updated_at,
                    result: response.outcome,
                });
                this.stop();
            } else if (response.status === 'failed') {
                this.onUpdate({
                    type: 'failed',
                    task_id: this.taskId,
                    timestamp: response.updated_at,
                    error: response.error,
                });
                this.stop();
            } else if (response.status === 'interrupted') {
                this.onUpdate({
                    type: 'interrupted',
                    task_id: this.taskId,
                    timestamp: response.updated_at,
                    reason: 'User input required',
                });
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.onComplete) {
            this.onComplete();
        }
    }
}

// Helper to determine which connection method to use
export const isProductionMode = () => IS_PRODUCTION;

export { API_BASE_URL, WS_BASE_URL };

