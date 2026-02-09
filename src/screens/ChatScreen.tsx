// Chat Screen - Main autonomous agent interface (Light Mode)
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, TaskWebSocket, WebSocketMessage } from '../api/agentApi';
import ChatInput from '../components/ChatInput';
import HistoryModal from '../components/HistoryModal';
import InterruptionCard from '../components/InterruptionCard';
import MessageBubble from '../components/MessageBubble';
import StatusHeader from '../components/StatusHeader';
import TypingIndicator from '../components/TypingIndicator';
import { ChatMessage, TaskStatusType, useChatStore } from '../store/useChatStore';
import { colors, gradients, layout, shadows } from '../theme';

const USER_ID = 'mobile_user_' + Math.random().toString(36).substring(2, 8);

export default function ChatScreen() {
    const flatListRef = useRef<FlatList>(null);
    const wsRef = useRef<TaskWebSocket | null>(null);
    const [interruptData, setInterruptData] = useState<{ reason: string; data: any } | null>(null);
    const [historyVisible, setHistoryVisible] = useState(false);
    const insets = useSafeAreaInsets();

    const {
        messages,
        currentTaskId,
        taskStatus,
        currentStep,
        totalSteps,
        isProcessing,
        isConnected,
        addMessage,
        appendStepToLastMessage,
        setTaskId,
        setTaskStatus,
        setProgress,
        setProcessing,
        setConnected,
        reset,
    } = useChatStore();

    // Check backend health on mount
    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        try {
            const healthy = await api.healthCheck();
            setConnected(healthy);
        } catch (e) {
            setConnected(false);
        }
    };

    // Handle WebSocket messages
    const handleWebSocketMessage = (message: WebSocketMessage) => {
        console.log('WS Message:', message);

        switch (message.type) {
            case 'status_change':
                setTaskStatus(message.status as TaskStatusType);
                if (message.status === 'executing') {
                    const lastMsg = messages[messages.length - 1];
                    if (!lastMsg || lastMsg.metadata?.type !== 'progress') {
                        addMessage({
                            role: 'agent',
                            content: '🚀 Executing Plan...',
                            metadata: {
                                type: 'progress',
                                steps: []
                            }
                        });
                    }
                }
                break;

            case 'step_complete':
                setProgress(message.step || 0, message.total_steps || 0);
                appendStepToLastMessage({
                    number: message.step || 0,
                    description: message.description || 'Processing...',
                    status: 'completed'
                });
                break;

            case 'step_failed':
                // Check if it's a critical error or just a retry
                // For select-appointment, we might want to hide it if it succeeds later
                // But for now, just show it as failed step
                appendStepToLastMessage({
                    number: currentStep,
                    description: message.error || 'Step failed',
                    status: 'failed'
                });
                break;

            case 'interrupted':
                setTaskStatus('interrupted');
                setInterruptData({
                    reason: message.reason || 'unknown',
                    data: message.data || {},
                });
                break;

            case 'completed':
                setTaskStatus('completed');
                setProcessing(false);
                const result = message.result || {};

                setTimeout(() => {
                    addMessage({
                        role: 'agent',
                        content: formatCompletionMessage(result),
                        metadata: { type: 'success', result: result }
                    });
                    wsRef.current?.disconnect();
                }, 1000);
                break;

            case 'failed':
                setTaskStatus('failed');
                setProcessing(false);
                addMessage({
                    role: 'agent',
                    content: `❌ ${parseErrorMessage(message.error)}`,
                    metadata: { type: 'error' }
                });
                wsRef.current?.disconnect();
                break;
        }
    };

    // Parse technical error messages into human-readable format
    const parseErrorMessage = (error?: string): string => {
        if (!error) return 'An unexpected error occurred. Please try again.';

        // Common Python/technical error patterns
        if (error.includes("name '") && error.includes("' is not defined")) {
            return 'A system configuration error occurred. Please try again or contact support.';
        }
        if (error.includes('exhausted all retries')) {
            return 'The operation failed after multiple attempts. Please try again later.';
        }
        if (error.includes('timeout') || error.includes('Timeout')) {
            return 'The request timed out. Please check your connection and try again.';
        }
        if (error.includes('connection') || error.includes('Connection')) {
            return 'Connection issue occurred. Please check your network and try again.';
        }
        if (error.includes('not found') || error.includes('NotFound')) {
            return 'The requested resource was not found. Please try a different request.';
        }
        if (error.includes('permission') || error.includes('Permission') || error.includes('unauthorized')) {
            return 'You don\'t have permission to perform this action.';
        }

        // If error is very long (technical stack trace), provide generic message
        if (error.length > 150) {
            return 'Task failed due to a system error. Please try again.';
        }

        // If error appears to be user-friendly already, return as-is
        return `Task failed: ${error}`;
    };

    const formatCompletionMessage = (result: any): string => {
        let message = '✅ **Task Completed Successfully!**\n';
        if (result.goal) message += `\n**Goal:** ${result.goal}`;
        return message;
    };

    // Handle user message send
    const handleSend = async (text: string) => {
        if (!isConnected) {
            Alert.alert('Not Connected', 'Backend server is not running. Please start it first.');
            return;
        }

        addMessage({
            role: 'user',
            content: text,
        });

        setProcessing(true);
        setTaskStatus('analyzing');

        try {
            const response = await api.createTask({
                user_id: USER_ID,
                goal: text,
                context: {},
            });

            setTaskId(response.task_id);

            addMessage({
                role: 'agent',
                content: 'Got it! I\'m analyzing your request...',
                metadata: { taskId: response.task_id },
            });

            wsRef.current = new TaskWebSocket(
                response.task_id,
                handleWebSocketMessage,
                () => setConnected(false)
            );
            wsRef.current.connect();

        } catch (error: any) {
            setProcessing(false);
            setTaskStatus('failed');
            addMessage({
                role: 'agent',
                content: `❌ Failed to start task: ${error.message}`,
            });
        }
    };

    const handleInterruptResponse = async (response: Record<string, any>) => {
        if (!currentTaskId) return;

        setInterruptData(null);
        setProcessing(true);

        try {
            await api.respondToInterruption(currentTaskId, response);
            addMessage({
                role: 'user',
                content: response.approved !== undefined
                    ? (response.approved ? 'Approved' : 'Declined')
                    : 'Response submitted',
            });

            wsRef.current = new TaskWebSocket(
                currentTaskId,
                handleWebSocketMessage,
                () => setConnected(false)
            );
            wsRef.current.connect();

        } catch (error: any) {
            addMessage({
                role: 'agent',
                content: `❌ Failed to submit response: ${error.message}`,
            });
            setProcessing(false);
        }
    };

    const handleNewChat = () => {
        wsRef.current?.disconnect();
        reset();
        setConnected(true);
        addMessage({
            role: 'agent',
            content: 'Hello! I\'m your autonomous agent. How can I help you today?',
        });
    };

    const handleDemoTask = async (type: 'flight' | 'appointment' | 'approval') => {
        if (!isConnected) {
            Alert.alert('Not Connected', 'Backend server is not running.');
            return;
        }

        if (isProcessing) return;

        setProcessing(true);
        setTaskStatus('analyzing');

        try {
            const response = await api.createDemoTask(type);

            setTaskId(response.task_id);

            addMessage({
                role: 'agent',
                content: `🚀 Starting ${type} demo...`,
                metadata: { taskId: response.task_id },
            });

            wsRef.current = new TaskWebSocket(
                response.task_id,
                handleWebSocketMessage,
                () => setConnected(false)
            );
            wsRef.current.connect();

        } catch (error: any) {
            setProcessing(false);
            setTaskStatus('failed');
            addMessage({
                role: 'agent',
                content: `❌ Failed to start demo: ${error.message}`,
            });
        }
    };

    const renderQuickDemos = () => {
        if (messages.length > 2 || currentTaskId) return null;

        const demos = [
            { id: 'flight', icon: 'airplane', label: 'Book a Flight', color: '#3B82F6' },
            { id: 'appointment', icon: 'medical', label: 'Health Appt', color: '#06B6D4' },
            { id: 'approval', icon: 'checkmark-done-circle', label: 'Get Approval', color: '#8B5CF6' },
        ];

        return (
            <View style={styles.demoContainer}>
                <Text style={styles.demoTitle}>✨ Quick Actions</Text>
                <View style={styles.demoGrid}>
                    {demos.map((demo) => (
                        <TouchableOpacity
                            key={demo.id}
                            style={styles.demoButton}
                            onPress={() => handleDemoTask(demo.id as any)}
                            disabled={isProcessing}
                            activeOpacity={0.7}
                        >
                            <LinearGradient
                                colors={[demo.color, `${demo.color}CC`]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.iconBox}
                            >
                                <Ionicons name={demo.icon as any} size={22} color="#FFF" />
                            </LinearGradient>
                            <Text style={styles.demoText}>{demo.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };


    useEffect(() => {
        if (messages.length === 0) {
            handleNewChat();
        }
    }, [messages.length]);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages.length]);

    const renderMessage = ({ item }: { item: ChatMessage }) => (
        <MessageBubble message={item} />
    );

    const isThinking = isProcessing && ['analyzing', 'planning', 'executing', 'validating'].includes(taskStatus);

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <LinearGradient
                colors={gradients.surface}
                style={StyleSheet.absoluteFill}
            />

            <StatusHeader
                status={taskStatus}
                currentStep={currentStep}
                totalSteps={totalSteps}
                isConnected={isConnected}
                onNewChat={handleNewChat}
                onShowHistory={() => setHistoryVisible(true)}
            />

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[
                        styles.messageList,
                        {
                            paddingTop: layout.headerHeight + insets.top + 20,
                            paddingBottom: insets.bottom + 80 // Input height + padding
                        }
                    ]}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={
                        <>
                            {renderQuickDemos()}
                            {isThinking && (
                                <TypingIndicator status={taskStatus} visible={true} />
                            )}
                            {interruptData && (
                                <InterruptionCard
                                    reason={interruptData.reason}
                                    data={interruptData.data}
                                    onRespond={handleInterruptResponse}
                                />
                            )}
                        </>
                    }
                />

                <ChatInput
                    onSend={handleSend}
                    disabled={isProcessing || !!interruptData}
                    placeholder={
                        interruptData
                            ? "Please respond to the request above..."
                            : "Type a command..."
                    }
                />
            </KeyboardAvoidingView>

            <HistoryModal
                visible={historyVisible}
                onClose={() => setHistoryVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
    },
    messageList: {
        paddingHorizontal: 12,
        paddingVertical: 16,
    },
    demoContainer: {
        marginTop: 16,
        marginBottom: 16,
        marginHorizontal: 4,
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.md,
    },
    demoTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 14,
    },
    demoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    demoButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderRadius: 16,
        backgroundColor: colors.surfaceLight,
        borderWidth: 1,
        borderColor: colors.border,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.sm,
    },
    demoText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.text,
        textAlign: 'center',
        marginTop: 10,
        letterSpacing: -0.2,
    },
});
