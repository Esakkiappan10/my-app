// FollowUpCard - Beautiful suggestion card for proactive agent actions
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { colors, shadows } from '../theme';

interface FollowUpSuggestion {
    id: string;
    type: string;
    title: string;
    description: string;
    emoji: string;
    parent_booking_id: string;
    parent_booking_type: string;
    priority: number;
}

interface FollowUpCardProps {
    suggestion: FollowUpSuggestion;
    onAccept: (suggestionId: string) => void;
    onDismiss: (suggestionId: string) => void;
    visible?: boolean;
}

export default function FollowUpCard({
    suggestion,
    onAccept,
    onDismiss,
    visible = true,
}: FollowUpCardProps) {
    const scaleAnim = React.useRef(new Animated.Value(0)).current;
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleAccept = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => onAccept(suggestion.id));
    };

    const handleDismiss = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => onDismiss(suggestion.id));
    };

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                },
            ]}
        >
            <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.card}
            >
                {/* Glow Effect */}
                <View style={styles.glowContainer}>
                    <LinearGradient
                        colors={['rgba(59, 130, 246, 0.15)', 'transparent']}
                        style={styles.glow}
                    />
                </View>

                {/* Header with emoji and sparkle */}
                <View style={styles.header}>
                    <View style={styles.emojiContainer}>
                        <Text style={styles.emoji}>{suggestion.emoji}</Text>
                    </View>
                    <View style={styles.sparkle}>
                        <Ionicons name="sparkles" size={16} color={colors.primary} />
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>{suggestion.title}</Text>

                {/* Description */}
                <Text style={styles.description}>{suggestion.description}</Text>

                {/* Context Info */}
                <View style={styles.contextRow}>
                    <Ionicons name="link-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.contextText}>
                        Linked to your {suggestion.parent_booking_type} booking
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.dismissButton,
                            pressed && styles.buttonPressed,
                        ]}
                        onPress={handleDismiss}
                    >
                        <Text style={styles.dismissText}>No thanks</Text>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.acceptButton,
                            pressed && styles.buttonPressed,
                        ]}
                        onPress={handleAccept}
                    >
                        <LinearGradient
                            colors={['#3B82F6', '#2563EB']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.acceptGradient}
                        >
                            <Ionicons name="checkmark" size={18} color="#FFF" />
                            <Text style={styles.acceptText}>Yes, book it</Text>
                        </LinearGradient>
                    </Pressable>
                </View>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
        marginHorizontal: 16,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.md,
        overflow: 'hidden',
    },
    glowContainer: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
    },
    glow: {
        width: '100%',
        height: '100%',
        borderRadius: 75,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    emojiContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emoji: {
        fontSize: 24,
    },
    sparkle: {
        marginLeft: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    description: {
        fontSize: 15,
        color: colors.textSecondary,
        lineHeight: 22,
        marginBottom: 12,
    },
    contextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
    },
    contextText: {
        fontSize: 12,
        color: colors.textMuted,
        marginLeft: 6,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    dismissButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dismissText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    acceptButton: {
        flex: 1.5,
        borderRadius: 14,
        overflow: 'hidden',
    },
    acceptGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 6,
    },
    acceptText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
});
