// NotificationBanner - Animated notification component for real-time alerts
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { colors, shadows } from '../theme';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'flight_delay' | 'auto_adjust';

interface NotificationBannerProps {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    details?: {
        oldValue?: string;
        newValue?: string;
        actionTaken?: string;
    };
    onDismiss?: (id: string) => void;
    autoDismiss?: number; // ms to auto-dismiss, 0 = no auto-dismiss
}

const notificationConfig: Record<NotificationType, {
    icon: string;
    colors: [string, string];
    borderColor: string;
    iconColor: string;
}> = {
    info: {
        icon: 'information-circle',
        colors: ['#EFF6FF', '#DBEAFE'],
        borderColor: '#93C5FD',
        iconColor: '#3B82F6',
    },
    success: {
        icon: 'checkmark-circle',
        colors: ['#ECFDF5', '#D1FAE5'],
        borderColor: '#6EE7B7',
        iconColor: '#10B981',
    },
    warning: {
        icon: 'warning',
        colors: ['#FFFBEB', '#FEF3C7'],
        borderColor: '#FCD34D',
        iconColor: '#F59E0B',
    },
    error: {
        icon: 'close-circle',
        colors: ['#FEF2F2', '#FEE2E2'],
        borderColor: '#FCA5A5',
        iconColor: '#EF4444',
    },
    flight_delay: {
        icon: 'airplane',
        colors: ['#FFFBEB', '#FEF3C7'],
        borderColor: '#FCD34D',
        iconColor: '#F59E0B',
    },
    auto_adjust: {
        icon: 'refresh-circle',
        colors: ['#EFF6FF', '#DBEAFE'],
        borderColor: '#93C5FD',
        iconColor: '#3B82F6',
    },
};

export default function NotificationBanner({
    id,
    type,
    title,
    message,
    details,
    onDismiss,
    autoDismiss = 0,
}: NotificationBannerProps) {
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [isVisible, setIsVisible] = useState(true);

    const config = notificationConfig[type];

    useEffect(() => {
        // Slide in
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 9,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto dismiss
        if (autoDismiss > 0) {
            const timer = setTimeout(() => handleDismiss(), autoDismiss);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setIsVisible(false);
            onDismiss?.(id);
        });
    };

    if (!isVisible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY: slideAnim }],
                    opacity: fadeAnim,
                },
            ]}
        >
            <LinearGradient
                colors={config.colors}
                style={[styles.banner, { borderColor: config.borderColor }]}
            >
                {/* Icon */}
                <View style={[styles.iconContainer, { backgroundColor: `${config.iconColor}20` }]}>
                    <Ionicons
                        name={config.icon as any}
                        size={24}
                        color={config.iconColor}
                    />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    {/* Details (for auto-adjust notifications) */}
                    {details && (
                        <View style={styles.detailsContainer}>
                            {details.oldValue && details.newValue && (
                                <View style={styles.changeRow}>
                                    <Text style={styles.oldValue}>{details.oldValue}</Text>
                                    <Ionicons name="arrow-forward" size={14} color={config.iconColor} />
                                    <Text style={styles.newValue}>{details.newValue}</Text>
                                </View>
                            )}
                            {details.actionTaken && (
                                <View style={styles.actionRow}>
                                    <Ionicons name="checkmark" size={14} color={colors.success} />
                                    <Text style={styles.actionText}>{details.actionTaken}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Dismiss button */}
                <Pressable
                    onPress={handleDismiss}
                    style={({ pressed }) => [
                        styles.dismissButton,
                        pressed && { opacity: 0.6 },
                    ]}
                >
                    <Ionicons name="close" size={20} color={colors.textMuted} />
                </Pressable>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        zIndex: 1000,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        ...shadows.md,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 2,
    },
    message: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    detailsContainer: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    changeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    oldValue: {
        fontSize: 13,
        color: colors.textMuted,
        textDecorationLine: 'line-through',
    },
    newValue: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 4,
    },
    actionText: {
        fontSize: 13,
        color: colors.success,
        fontWeight: '500',
    },
    dismissButton: {
        padding: 4,
    },
});
