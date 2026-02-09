// Typing Indicator - Premium Thinking Animation (Next-Gen Light Mode)
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, gradients, shadows } from '../theme';

interface TypingIndicatorProps {
    status: string;
    visible: boolean;
}

const STATUS_CONFIG: Record<string, { icon: string; text: string; color: string }> = {
    analyzing: { icon: 'search', text: 'Analyzing your request...', color: colors.primary },
    planning: { icon: 'map-outline', text: 'Creating execution plan...', color: colors.secondary },
    executing: { icon: 'rocket-outline', text: 'Working on it...', color: colors.accent },
    validating: { icon: 'shield-checkmark-outline', text: 'Verifying results...', color: colors.warning },
    default: { icon: 'sparkles', text: 'Thinking...', color: colors.textMuted },
};

export default function TypingIndicator({ status, visible }: TypingIndicatorProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (visible) {
            // Fade in
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();

            // Dot animations
            const animateDot = (dot: Animated.Value, delay: number) => {
                return Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
                        Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
                    ])
                );
            };

            // Pulse animation for icon
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                ])
            );

            const anim1 = animateDot(dot1, 0);
            const anim2 = animateDot(dot2, 150);
            const anim3 = animateDot(dot3, 300);

            anim1.start();
            anim2.start();
            anim3.start();
            pulse.start();

            return () => {
                anim1.stop();
                anim2.stop();
                anim3.stop();
                pulse.stop();
            };
        } else {
            fadeAnim.setValue(0);
        }
    }, [visible]);

    if (!visible) return null;

    const config = STATUS_CONFIG[status] || STATUS_CONFIG.default;

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            {/* Avatar */}
            <View style={styles.avatarWrapper}>
                <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatar}
                >
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <Ionicons name="sparkles" size={12} color="#FFF" />
                    </Animated.View>
                </LinearGradient>
            </View>

            {/* Bubble */}
            <View style={styles.bubble}>
                {/* Status row */}
                <View style={styles.statusRow}>
                    <View style={[styles.statusIcon, { backgroundColor: `${config.color}15` }]}>
                        <Ionicons name={config.icon as any} size={14} color={config.color} />
                    </View>
                    <Text style={[styles.statusText, { color: config.color }]}>
                        {config.text}
                    </Text>
                </View>

                {/* Animated dots */}
                <View style={styles.dotsContainer}>
                    {[dot1, dot2, dot3].map((dot, index) => (
                        <Animated.View
                            key={index}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: config.color,
                                    transform: [{
                                        translateY: dot.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, -6],
                                        })
                                    }],
                                    opacity: dot.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.4, 1],
                                    }),
                                }
                            ]}
                        />
                    ))}
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        marginVertical: 8,
    },
    avatarWrapper: {
        marginRight: 10,
        marginBottom: 4,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.sm,
    },
    bubble: {
        backgroundColor: colors.surface,
        borderRadius: 18,
        borderBottomLeftRadius: 6,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: colors.border,
        maxWidth: '75%',
        ...shadows.xs,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
    },
    statusIcon: {
        width: 28,
        height: 28,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: -0.2,
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 16,
        gap: 6,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
});
