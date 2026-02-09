// Status Header - Premium Floating Glass Header (Next-Gen Light Mode)
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, shadows } from '../theme';

interface StatusHeaderProps {
    status: string;
    currentStep: number;
    totalSteps: number;
    isConnected: boolean;
    onNewChat?: () => void;
    onShowHistory?: () => void;
}

const STATUS_CONFIG: Record<string, { color: string; icon: string; text: string; gradient?: readonly [string, string] }> = {
    idle: { color: colors.textMuted, icon: 'sparkles', text: 'Ready', gradient: ['#94A3B8', '#64748B'] },
    analyzing: { color: colors.primary, icon: 'search', text: 'Analyzing', gradient: gradients.primary },
    planning: { color: colors.secondary, icon: 'map-outline', text: 'Planning', gradient: gradients.violet },
    executing: { color: colors.accent, icon: 'rocket-outline', text: 'Running', gradient: gradients.success },
    validating: { color: colors.warning, icon: 'shield-checkmark-outline', text: 'Verifying', gradient: ['#F59E0B', '#D97706'] },
    completed: { color: colors.success, icon: 'checkmark-circle', text: 'Done', gradient: gradients.success },
    failed: { color: colors.error, icon: 'alert-circle', text: 'Failed', gradient: ['#EF4444', '#DC2626'] },
    interrupted: { color: colors.warning, icon: 'pause-circle-outline', text: 'Paused', gradient: ['#F59E0B', '#D97706'] },
};

export default function StatusHeader({
    status,
    currentStep,
    totalSteps,
    isConnected,
    onNewChat,
    onShowHistory
}: StatusHeaderProps) {
    const insets = useSafeAreaInsets();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
    const progress = totalSteps > 0 ? currentStep / totalSteps : 0;
    const isActive = ['analyzing', 'planning', 'executing', 'validating'].includes(status);

    // Pulse animation for active states
    useEffect(() => {
        if (isActive) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isActive]);

    // Progress bar animation
    useEffect(() => {
        Animated.spring(progressAnim, {
            toValue: progress,
            tension: 40,
            friction: 10,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    const HeaderContainer = Platform.OS === 'ios' ? BlurView : View;
    const headerProps = Platform.OS === 'ios' ? { intensity: 90, tint: 'light' } : {};

    return (
        <View style={[styles.wrapper, { paddingTop: insets.top }]}>
            <HeaderContainer {...(headerProps as any)} style={styles.container}>
                <View style={styles.content}>
                    {/* Left: History Button */}
                    <Pressable
                        onPress={onShowHistory}
                        style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
                    >
                        <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                    </Pressable>

                    {/* Center: Status & Progress */}
                    <View style={styles.centerSection}>
                        <View style={styles.statusRow}>
                            {/* Animated status indicator */}
                            <Animated.View style={[
                                styles.statusIndicator,
                                { backgroundColor: `${config.color}20`, transform: [{ scale: pulseAnim }] }
                            ]}>
                                <Ionicons name={config.icon as any} size={14} color={config.color} />
                            </Animated.View>

                            <Text style={[styles.statusText, { color: config.color }]}>
                                {config.text}
                            </Text>

                            {/* Step counter */}
                            {status === 'executing' && totalSteps > 0 && (
                                <View style={styles.stepCounter}>
                                    <Text style={styles.stepText}>{currentStep}/{totalSteps}</Text>
                                </View>
                            )}
                        </View>

                        {/* Progress bar */}
                        {status === 'executing' && totalSteps > 0 && (
                            <View style={styles.progressContainer}>
                                <View style={styles.progressTrack}>
                                    <Animated.View style={[
                                        styles.progressFill,
                                        {
                                            width: progressAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '100%'],
                                            })
                                        }
                                    ]}>
                                        <LinearGradient
                                            colors={config.gradient || gradients.primary}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.progressGradient}
                                        />
                                    </Animated.View>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Right: Connection + New Chat */}
                    <View style={styles.rightSection}>
                        {/* Connection indicator */}
                        <View style={[
                            styles.connectionBadge,
                            { backgroundColor: isConnected ? colors.successLight : colors.errorLight }
                        ]}>
                            <View style={[
                                styles.connectionDot,
                                { backgroundColor: isConnected ? colors.success : colors.error }
                            ]} />
                        </View>

                        {/* New Chat Button */}
                        <Pressable
                            onPress={onNewChat}
                            style={({ pressed }) => [
                                styles.newChatButton,
                                pressed && styles.newChatButtonPressed
                            ]}
                        >
                            <LinearGradient
                                colors={gradients.primary}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.newChatGradient}
                            >
                                <Ionicons name="add" size={22} color="#FFF" />
                            </LinearGradient>
                        </Pressable>
                    </View>
                </View>
            </HeaderContainer>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingHorizontal: 16,
    },
    container: {
        backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.85)' : colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        marginTop: 8,
        ...shadows.lg,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconButtonPressed: {
        backgroundColor: colors.border,
        transform: [{ scale: 0.96 }],
    },
    centerSection: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 12,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusIndicator: {
        width: 28,
        height: 28,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    stepCounter: {
        backgroundColor: colors.surfaceLight,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    stepText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    progressContainer: {
        width: '85%',
        marginTop: 8,
    },
    progressTrack: {
        height: 4,
        backgroundColor: colors.surfaceLight,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressGradient: {
        flex: 1,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    connectionBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    connectionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    newChatButton: {
        width: 40,
        height: 40,
        borderRadius: 14,
        overflow: 'hidden',
        ...shadows.glow,
    },
    newChatButtonPressed: {
        transform: [{ scale: 0.95 }],
    },
    newChatGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
