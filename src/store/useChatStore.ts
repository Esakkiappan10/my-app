// Chat State Store (Zustand)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type MessageRole = 'user' | 'agent' | 'system';
export type TaskStatusType = 'idle' | 'analyzing' | 'planning' | 'executing' | 'validating' | 'completed' | 'failed' | 'interrupted';

export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: Date;
    metadata?: {
        taskId?: string;
        stepNumber?: number;
        totalSteps?: number;
        isThinking?: boolean;
        interruptData?: any;
        steps?: Array<{ number: number; description: string; status: 'completed' | 'failed' | 'pending' | 'running' }>;
        type?: 'progress' | 'text' | 'error' | 'success';
        result?: any;
    };
}

export interface ChatState {
    // Messages
    messages: ChatMessage[];

    // Current Task
    currentTaskId: string | null;
    taskStatus: TaskStatusType;
    currentStep: number;
    totalSteps: number;

    // UI State
    isConnected: boolean;
    isProcessing: boolean;

    // Actions
    addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    updateLastMessage: (updates: Partial<ChatMessage>) => void;
    appendStepToLastMessage: (step: { number: number; description: string; status: 'completed' | 'failed' }) => void;
    setTaskId: (taskId: string | null) => void;
    setTaskStatus: (status: TaskStatusType) => void;
    setProgress: (current: number, total: number) => void;
    setConnected: (connected: boolean) => void;
    setProcessing: (processing: boolean) => void;
    clearMessages: () => void;
    reset: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            // Initial State
            messages: [],
            currentTaskId: null,
            taskStatus: 'idle',
            currentStep: 0,
            totalSteps: 0,
            isConnected: false,
            isProcessing: false,

            // Actions
            addMessage: (message) => {
                const newMessage: ChatMessage = {
                    ...message,
                    id: generateId(),
                    timestamp: new Date(),
                };
                set((state) => ({
                    messages: [...state.messages, newMessage],
                }));
            },

            updateLastMessage: (updates: Partial<ChatMessage>) => {
                set((state) => {
                    const messages = [...state.messages];
                    if (messages.length > 0) {
                        const lastIdx = messages.length - 1;
                        const oldMetadata = messages[lastIdx].metadata || {};

                        // Deep merge metadata if present in updates
                        const newMetadata = updates.metadata
                            ? { ...oldMetadata, ...updates.metadata }
                            : oldMetadata;

                        messages[lastIdx] = {
                            ...messages[lastIdx],
                            ...updates,
                            metadata: newMetadata
                        };
                        return { messages };
                    }
                    return state;
                });
            },

            appendStepToLastMessage: (step) => {
                set((state) => {
                    const messages = [...state.messages];
                    if (messages.length > 0) {
                        const lastIdx = messages.length - 1;
                        const msg = messages[lastIdx];
                        const oldMetadata = msg.metadata || {};
                        const oldSteps = oldMetadata.steps || [];

                        // Check if step already exists to avoid duplicates
                        const exists = oldSteps.find(s => s.number === step.number);
                        let newSteps;

                        if (exists) {
                            newSteps = oldSteps.map(s => s.number === step.number ? { ...s, ...step } : s);
                        } else {
                            newSteps = [...oldSteps, { ...step, status: step.status as any }];
                        }

                        messages[lastIdx] = {
                            ...msg,
                            metadata: {
                                ...oldMetadata,
                                steps: newSteps,
                                type: 'progress'
                            }
                        };
                        return { messages };
                    }
                    return state;
                });
            },

            setTaskId: (taskId) => {
                set({ currentTaskId: taskId });
            },

            setTaskStatus: (status) => {
                set({ taskStatus: status });
            },

            setProgress: (current, total) => {
                set({ currentStep: current, totalSteps: total });
            },

            setConnected: (connected) => {
                set({ isConnected: connected });
            },

            setProcessing: (processing) => {
                set({ isProcessing: processing });
            },

            clearMessages: () => {
                set({ messages: [] });
            },

            reset: () => {
                set({
                    messages: [],
                    currentTaskId: null,
                    taskStatus: 'idle',
                    currentStep: 0,
                    totalSteps: 0,
                    isConnected: false,
                    isProcessing: false,
                });
            },
        }),
        {
            name: 'chat-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                messages: state.messages,
                currentTaskId: state.currentTaskId,
                taskStatus: state.taskStatus === 'executing' ? 'executing' : state.taskStatus,
            }),
        }
    )
);
