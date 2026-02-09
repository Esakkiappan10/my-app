// Message Bubble - Premium Chat Bubbles (Next-Gen Light Mode)
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { ChatMessage } from '../store/useChatStore';
import { colors, gradients, shadows } from '../theme';

interface MessageBubbleProps {
    message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(10)).current;

    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    const metadata = message.metadata || {};
    const result = metadata.result;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
    }, []);

    if (isSystem) {
        return (
            <View style={styles.systemContainer}>
                <View style={styles.systemBadge}>
                    <Ionicons name="information-circle" size={12} color={colors.textMuted} />
                    <Text style={styles.systemText}>{message.content}</Text>
                </View>
            </View>
        );
    }

    // Helper to render Task Result Card
    const renderResultCard = () => {
        if (!result) return null;

        const details = result.confirmation_details || {};

        const getFlightInfo = () => {
            if (result.flight_details?.flight) return result.flight_details.flight;
            if (typeof details.flight === 'string') return details.flight;
            if (details.flight?.number) return `${details.flight.airline} ${details.flight.number}`;
            return null;
        };

        const getRouteInfo = () => {
            if (result.flight_details?.route) return result.flight_details.route;
            if (typeof details.route === 'string') return details.route;
            if (details.route?.origin && details.route?.destination) {
                return `${details.route.origin.code} → ${details.route.destination.code}`;
            }
            return null;
        };

        const getHotelName = () => {
            if (typeof details.hotel === 'string') return details.hotel;
            if (details.hotel?.name) return details.hotel.name;
            return null;
        };

        const getHotelDates = () => {
            if (details.check_in && details.check_out) return `${details.check_in} - ${details.check_out}`;
            if (details.reservation?.check_in) return `${details.reservation.check_in}`;
            return null;
        };

        const getVehicleInfo = () => {
            if (typeof details.vehicle === 'string') return details.vehicle;
            if (details.ride?.vehicle) return `${details.ride.provider} - ${details.ride.vehicle}`;
            return null;
        };

        const getDriverInfo = () => {
            if (typeof details.driver === 'string') return `${details.driver} (${details.pickup || ''})`;
            if (details.driver?.name) return `${details.driver.name} (${details.driver.rating}★)`;
            return null;
        };

        const getPrice = () => {
            if (result.amount_paid) return result.amount_paid;
            if (typeof details.price === 'number' || typeof details.price === 'string') return details.price;
            if (details.fare?.total) return details.fare.total;
            if (details.total_price) return details.total_price;
            return null;
        };

        const flightInfo = getFlightInfo();
        const routeInfo = getRouteInfo();
        const hotelName = getHotelName();
        const hotelDates = getHotelDates();
        const vehicleInfo = getVehicleInfo();
        const driverInfo = getDriverInfo();
        const price = getPrice();

        const isFlight = !!flightInfo || !!result.flight_details;
        const isHotel = !!hotelName;
        const isCab = !!vehicleInfo || !!details.ride;
        const isMedical = !!result.appointment_details;

        const cardIcon = isFlight ? 'airplane' : isHotel ? 'bed-outline' : isCab ? 'car-sport' : isMedical ? 'medical' : 'checkmark-done';
        const cardTitle = isFlight ? 'Flight Confirmed' : isHotel ? 'Hotel Booked' : isCab ? 'Ride Confirmed' : isMedical ? 'Appointment Set' : 'Task Completed';
        const cardGradient: readonly [string, string] = isFlight
            ? ['#0EA5E9', '#0284C7']
            : isHotel ? ['#8B5CF6', '#7C3AED']
                : isCab ? ['#10B981', '#059669']
                    : ['#3B82F6', '#2563EB'];

        return (
            <View style={styles.cardContainer}>
                <LinearGradient
                    colors={cardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardHeader}
                >
                    <View style={styles.cardIconContainer}>
                        <Ionicons name={cardIcon as any} size={18} color="#FFF" />
                    </View>
                    <Text style={styles.cardTitle}>{cardTitle}</Text>
                    <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.9)" />
                </LinearGradient>

                <View style={styles.cardBody}>
                    {details.confirmation_number && (
                        <View style={styles.confirmationRow}>
                            <Text style={styles.confirmationLabel}>Confirmation</Text>
                            <Text style={styles.confirmationNumber}>{details.confirmation_number}</Text>
                        </View>
                    )}

                    <View style={styles.cardDetails}>
                        {flightInfo && (
                            <DetailRow icon="airplane" label="Flight" value={flightInfo} />
                        )}
                        {routeInfo && (
                            <DetailRow icon="location" label="Route" value={routeInfo} />
                        )}
                        {hotelName && (
                            <DetailRow icon="business" label="Hotel" value={hotelName} />
                        )}
                        {hotelDates && (
                            <DetailRow icon="calendar" label="Dates" value={hotelDates} />
                        )}
                        {vehicleInfo && (
                            <DetailRow icon="car" label="Vehicle" value={vehicleInfo} />
                        )}
                        {driverInfo && (
                            <DetailRow icon="person" label="Driver" value={driverInfo} />
                        )}
                    </View>

                    {price && (
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Total Paid</Text>
                            <Text style={styles.priceValue}>
                                {typeof price === 'number' ? `$${price.toLocaleString()}` : price}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <Animated.View
            style={[
                styles.container,
                isUser ? styles.userContainer : styles.agentContainer,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
        >
            {/* Agent Avatar */}
            {!isUser && (
                <View style={styles.avatarWrapper}>
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatar}
                    >
                        <Ionicons name="sparkles" size={12} color="#FFF" />
                    </LinearGradient>
                </View>
            )}

            {/* Message Bubble */}
            <View style={[styles.bubble, isUser ? styles.userBubble : styles.agentBubble]}>
                {isUser ? (
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.userBubbleGradient}
                    >
                        <Text style={styles.userText}>
                            {message.content.replace(/\*\*(.*?)\*\*/g, '$1')}
                        </Text>
                        <Text style={styles.userTimestamp}>
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </LinearGradient>
                ) : (
                    <>
                        <Text style={styles.agentText}>
                            {message.content.replace(/\*\*(.*?)\*\*/g, '$1')}
                        </Text>

                        {/* Progress Steps */}
                        {metadata.steps && metadata.steps.length > 0 && (
                            <View style={styles.stepsContainer}>
                                {metadata.steps.map((step: any, index: number) => (
                                    <View key={index} style={styles.stepRow}>
                                        <View style={[
                                            styles.stepIcon,
                                            step.status === 'completed' && styles.stepIconComplete,
                                            step.status === 'failed' && styles.stepIconFailed,
                                            step.status === 'running' && styles.stepIconRunning,
                                        ]}>
                                            <Ionicons
                                                name={step.status === 'completed' ? 'checkmark' : step.status === 'failed' ? 'close' : 'ellipse'}
                                                size={10}
                                                color={step.status === 'completed' ? colors.success : step.status === 'failed' ? colors.error : colors.textMuted}
                                            />
                                        </View>
                                        <Text style={[
                                            styles.stepText,
                                            step.status === 'completed' && styles.stepTextComplete,
                                            step.status === 'running' && styles.stepTextRunning,
                                        ]}>
                                            {step.description}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Result Card */}
                        {renderResultCard()}

                        <Text style={styles.agentTimestamp}>
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </>
                )}
            </View>
        </Animated.View>
    );
}

// Helper component for detail rows
function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
                <Ionicons name={icon as any} size={14} color={colors.textMuted} />
                <Text style={styles.detailLabel}>{label}</Text>
            </View>
            <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    systemContainer: {
        alignItems: 'center',
        marginVertical: 12,
    },
    systemBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceLight,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    systemText: {
        fontSize: 12,
        color: colors.textMuted,
    },
    userContainer: {
        alignSelf: 'flex-end',
        justifyContent: 'flex-end',
    },
    agentContainer: {
        alignSelf: 'flex-start',
    },
    avatarWrapper: {
        marginRight: 10,
        alignSelf: 'flex-end',
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
        maxWidth: '82%',
        borderRadius: 18,
        overflow: 'hidden',
    },
    userBubble: {
        ...shadows.sm,
    },
    userBubbleGradient: {
        padding: 14,
        paddingBottom: 10,
    },
    agentBubble: {
        backgroundColor: colors.surface,
        padding: 14,
        paddingBottom: 10,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.xs,
    },
    userText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#FFF',
        letterSpacing: -0.2,
    },
    agentText: {
        fontSize: 15,
        lineHeight: 22,
        color: colors.text,
        letterSpacing: -0.2,
    },
    userTimestamp: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'right',
        marginTop: 6,
    },
    agentTimestamp: {
        fontSize: 10,
        color: colors.textMuted,
        textAlign: 'right',
        marginTop: 6,
    },
    stepsContainer: {
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
        gap: 8,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    stepIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepIconComplete: {
        backgroundColor: colors.successLight,
    },
    stepIconFailed: {
        backgroundColor: colors.errorLight,
    },
    stepIconRunning: {
        backgroundColor: colors.infoLight,
    },
    stepText: {
        flex: 1,
        fontSize: 13,
        color: colors.textSecondary,
    },
    stepTextComplete: {
        color: colors.text,
    },
    stepTextRunning: {
        color: colors.primary,
        fontWeight: '500',
    },
    cardContainer: {
        marginTop: 14,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 10,
    },
    cardIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: -0.3,
    },
    cardBody: {
        backgroundColor: colors.surface,
        padding: 12,
        gap: 10,
    },
    confirmationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    confirmationLabel: {
        fontSize: 12,
        color: colors.textMuted,
    },
    confirmationNumber: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.primary,
        letterSpacing: 0.5,
    },
    cardDetails: {
        gap: 6,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailLabel: {
        fontSize: 12,
        color: colors.textMuted,
    },
    detailValue: {
        fontSize: 13,
        color: colors.text,
        fontWeight: '500',
        maxWidth: '55%',
        textAlign: 'right',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        marginTop: 4,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
    },
    priceLabel: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    priceValue: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.success,
        letterSpacing: -0.3,
    },
});
