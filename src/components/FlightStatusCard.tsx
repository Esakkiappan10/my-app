// FlightStatusCard - Live flight status tracker with visual indicators
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { colors, shadows } from '../theme';

interface FlightStatus {
    booking_id: string;
    flight_number: string;
    airline: string;
    origin: string;
    destination: string;
    scheduled_departure: string;
    scheduled_arrival: string;
    current_status: string;
    status_display: {
        emoji: string;
        text: string;
        color: string;
    };
    delay_minutes: number;
    gate: string;
    terminal: string;
    updated_arrival?: string;
}

interface FlightStatusCardProps {
    flight: FlightStatus;
    linkedBookings?: Array<{
        type: string;
        status: string;
    }>;
}

export default function FlightStatusCard({ flight, linkedBookings = [] }: FlightStatusCardProps) {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const planeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Pulse animation for status
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Plane animation
        if (flight.current_status === 'in_flight' || flight.current_status === 'departed') {
            Animated.loop(
                Animated.timing(planeAnim, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                })
            ).start();
        }
    }, [flight.current_status]);

    const isDelayed = flight.current_status === 'delayed';
    const statusColor = flight.status_display?.color || colors.success;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.card}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.airlineInfo}>
                        <View style={[styles.airlineLogo, { backgroundColor: `${statusColor}15` }]}>
                            <Ionicons name="airplane" size={20} color={statusColor} />
                        </View>
                        <View>
                            <Text style={styles.flightNumber}>{flight.flight_number}</Text>
                            <Text style={styles.airline}>{flight.airline}</Text>
                        </View>
                    </View>

                    {/* Status Badge */}
                    <Animated.View
                        style={[
                            styles.statusBadge,
                            { backgroundColor: `${statusColor}20` },
                            isDelayed && { transform: [{ scale: pulseAnim }] }
                        ]}
                    >
                        <Text style={styles.statusEmoji}>{flight.status_display?.emoji}</Text>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {flight.status_display?.text}
                        </Text>
                    </Animated.View>
                </View>

                {/* Route Visualization */}
                <View style={styles.routeContainer}>
                    <View style={styles.airport}>
                        <Text style={styles.airportCode}>{flight.origin}</Text>
                        <Text style={styles.airportLabel}>From</Text>
                    </View>

                    <View style={styles.routeLine}>
                        <View style={styles.lineDashed} />
                        <Animated.View
                            style={[
                                styles.planeIcon,
                                {
                                    transform: [{
                                        translateX: planeAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, 100],
                                        })
                                    }]
                                }
                            ]}
                        >
                            <Text style={styles.planeEmoji}>✈️</Text>
                        </Animated.View>
                    </View>

                    <View style={styles.airport}>
                        <Text style={styles.airportCode}>{flight.destination}</Text>
                        <Text style={styles.airportLabel}>To</Text>
                    </View>
                </View>

                {/* Times */}
                <View style={styles.timesContainer}>
                    <View style={styles.timeBlock}>
                        <Text style={styles.timeLabel}>Departure</Text>
                        <Text style={styles.time}>{flight.scheduled_departure}</Text>
                    </View>
                    <View style={styles.timeBlock}>
                        <Text style={styles.timeLabel}>Arrival</Text>
                        <Text style={[
                            styles.time,
                            isDelayed && styles.delayedTime
                        ]}>
                            {flight.updated_arrival || flight.scheduled_arrival}
                        </Text>
                        {isDelayed && (
                            <Text style={styles.delayNote}>
                                +{flight.delay_minutes} min
                            </Text>
                        )}
                    </View>
                </View>

                {/* Gate & Terminal */}
                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                        <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                        <Text style={styles.detailText}>{flight.terminal}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.gateLabel}>Gate</Text>
                        <Text style={styles.gateNumber}>{flight.gate}</Text>
                    </View>
                </View>

                {/* Linked Bookings */}
                {linkedBookings.length > 0 && (
                    <View style={styles.linkedSection}>
                        <Text style={styles.linkedTitle}>Linked Bookings</Text>
                        {linkedBookings.map((booking, index) => (
                            <View key={index} style={styles.linkedItem}>
                                <Ionicons
                                    name={booking.type === 'cab' ? 'car' : 'bed'}
                                    size={14}
                                    color={colors.primary}
                                />
                                <Text style={styles.linkedText}>
                                    {booking.type === 'cab' ? 'Pickup' : 'Hotel'} - {booking.status}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </LinearGradient>
        </View>
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    airlineInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    airlineLogo: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flightNumber: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.text,
        letterSpacing: -0.3,
    },
    airline: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    statusEmoji: {
        fontSize: 14,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingVertical: 16,
        backgroundColor: colors.surfaceLight,
        borderRadius: 14,
        paddingHorizontal: 16,
    },
    airport: {
        alignItems: 'center',
    },
    airportCode: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: 1,
    },
    airportLabel: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
    },
    routeLine: {
        flex: 1,
        height: 2,
        marginHorizontal: 16,
        position: 'relative',
        justifyContent: 'center',
    },
    lineDashed: {
        height: 2,
        backgroundColor: colors.border,
        borderStyle: 'dashed',
    },
    planeIcon: {
        position: 'absolute',
    },
    planeEmoji: {
        fontSize: 18,
    },
    timesContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    timeBlock: {
        flex: 1,
    },
    timeLabel: {
        fontSize: 12,
        color: colors.textMuted,
        marginBottom: 4,
    },
    time: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    delayedTime: {
        color: colors.warning,
    },
    delayNote: {
        fontSize: 12,
        color: colors.warning,
        fontWeight: '500',
        marginTop: 2,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    gateLabel: {
        fontSize: 12,
        color: colors.textMuted,
        marginRight: 4,
    },
    gateNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary,
    },
    linkedSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
    },
    linkedTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 8,
    },
    linkedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    linkedText: {
        fontSize: 14,
        color: colors.text,
    },
});
