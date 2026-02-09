// Interruption Card Component - For handling agent interruptions
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface InterruptionCardProps {
    reason: string;
    data: any;
    onRespond: (response: Record<string, any>) => void;
}

export default function InterruptionCard({ reason, data, onRespond }: InterruptionCardProps) {
    const [inputValue, setInputValue] = useState('');

    const renderContent = () => {
        switch (reason) {
            case 'payment_required':
                return (
                    <View style={styles.cardContent}>
                        <View style={styles.paymentHeader}>
                            <Text style={styles.currencyLabel}>Total Due</Text>
                            <Text style={styles.amount}>${data.amount?.toLocaleString()}</Text>
                        </View>

                        <Text style={styles.description}>{data.description}</Text>

                        <Text style={styles.sectionLabel}>Select Payment Method</Text>
                        {data.payment_methods?.map((method: string, index: number) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.paymentOption}
                                onPress={() => onRespond({ approved: true, payment_method: method })}
                            >
                                <View style={styles.paymentIcon}>
                                    <Ionicons name="card-outline" size={24} color="#1a2a6c" />
                                </View>
                                <Text style={styles.optionText}>{method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                                <Ionicons name="chevron-forward" size={20} color="#CCC" />
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.declineLink}
                            onPress={() => onRespond({ approved: false })}
                        >
                            <Text style={styles.declineText}>Decline Transaction</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'approval_needed':
                return (
                    <View style={styles.cardContent}>
                        <View style={styles.approvalHeader}>
                            <View style={styles.securityIcon}>
                                <Ionicons name="shield-checkmark" size={32} color="#4CAF50" />
                            </View>
                            <Text style={styles.approvalTitle}>{data.message || 'Signature Required'}</Text>
                        </View>

                        <View style={styles.detailsBox}>
                            <Text style={styles.detailsText}>{data.details}</Text>
                            {data.timeout_hours && (
                                <View style={styles.timeoutBadge}>
                                    <Ionicons name="time-outline" size={14} color="#666" />
                                    <Text style={styles.timeoutText}>Expires in {data.timeout_hours}h</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.rejectButton]}
                                onPress={() => onRespond({ approved: false })}
                            >
                                <Text style={styles.rejectText}>Reject</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.approveButton]}
                                onPress={() => onRespond({ approved: true })}
                            >
                                <Text style={styles.approveText}>Approve</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            case 'clarification_needed':
                return (
                    <View style={styles.cardContent}>
                        <Text style={styles.questionText}>{data.question || 'Please provide more details.'}</Text>

                        {data.error && (
                            <View style={styles.errorBox}>
                                <Ionicons name="alert-circle" size={20} color="#D32F2F" />
                                <Text style={styles.errorText}>{data.error}</Text>
                            </View>
                        )}

                        <TextInput
                            style={styles.input}
                            placeholder="Type your answer here..."
                            placeholderTextColor="#999"
                            value={inputValue}
                            onChangeText={setInputValue}
                            multiline
                            autoFocus
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, !inputValue.trim() && styles.disabledButton]}
                            onPress={() => onRespond({ answer: inputValue })}
                            disabled={!inputValue.trim()}
                        >
                            <Text style={styles.submitText}>Submit Response</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFF" />
                        </TouchableOpacity>

                        {data.step && (
                            <Text style={styles.contextLabel} numberOfLines={1}>Related to step: {data.step}</Text>
                        )}
                    </View>
                );

            default:
                return (
                    <View style={styles.cardContent}>
                        <Text style={styles.description}>Please review the following:</Text>
                        <View style={styles.jsonBox}>
                            <Text style={styles.jsonText}>{JSON.stringify(data, null, 2)}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={() => onRespond({ acknowledged: true })}
                        >
                            <Text style={styles.submitText}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                );
        }
    };

    const getHeaderColor = () => {
        switch (reason) {
            case 'payment_required': return '#1a2a6c';
            case 'approval_needed': return '#2E7D32'; // Green
            case 'clarification_needed': return '#FF8F00'; // Amber
            default: return '#546E7A';
        }
    };

    const getIcon = () => {
        switch (reason) {
            case 'payment_required': return 'wallet';
            case 'approval_needed': return 'finger-print'; // Biometric style
            case 'clarification_needed': return 'chatbubbles';
            default: return 'notifications';
        }
    };

    const getTitle = () => {
        switch (reason) {
            case 'payment_required': return 'Payment Request';
            case 'approval_needed': return 'Approval Required';
            case 'clarification_needed': return 'Input Needed';
            default: return 'Notification';
        }
    };

    return (
        <View style={styles.wrapper}>
            <View style={styles.container}>
                <View style={[styles.header, { backgroundColor: getHeaderColor() }]}>
                    <View style={styles.headerRow}>
                        <Ionicons name={getIcon() as any} size={24} color="#FFF" />
                        <Text style={styles.headerTitle}>{getTitle()}</Text>
                    </View>
                </View>

                {renderContent()}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        padding: 16,
        paddingBottom: 32,
    },
    container: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    header: {
        padding: 20,
        paddingBottom: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        marginLeft: 12,
        letterSpacing: 0.5,
    },
    cardContent: {
        padding: 24,
        paddingTop: 8,
        backgroundColor: '#FFF',
        marginTop: -16,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },

    // Payment Styles
    paymentHeader: {
        alignItems: 'center',
        marginVertical: 16,
    },
    currencyLabel: {
        fontSize: 14,
        color: '#888',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    amount: {
        fontSize: 42,
        fontWeight: '800',
        color: '#1a2a6c',
        marginTop: 4,
    },
    description: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
        marginLeft: 4,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    paymentIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#E8EAF6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
        marginLeft: 16,
    },
    declineLink: {
        alignItems: 'center',
        padding: 16,
        marginTop: 8,
    },
    declineText: {
        color: '#FF5252',
        fontWeight: '600',
        fontSize: 15,
    },

    // Approval Styles
    approvalHeader: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 8,
    },
    securityIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    approvalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2E7D32',
        textAlign: 'center',
    },
    detailsBox: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        marginBottom: 24,
    },
    detailsText: {
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
    },
    timeoutBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: '#ECEFF1',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    timeoutText: {
        fontSize: 12,
        color: '#546E7A',
        marginLeft: 4,
        fontWeight: '600',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    approveButton: {
        backgroundColor: '#4CAF50',
    },
    rejectButton: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    approveText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    rejectText: {
        color: '#D32F2F',
        fontSize: 16,
        fontWeight: '700',
    },

    // Clarification Styles
    questionText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
        lineHeight: 26,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    errorText: {
        color: '#D32F2F',
        marginLeft: 8,
        fontSize: 14,
        flex: 1,
    },
    input: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        color: '#333',
        minHeight: 120,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#EFEFEF',
        marginBottom: 16,
    },
    submitButton: {
        backgroundColor: '#1a2a6c',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1a2a6c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    disabledButton: {
        backgroundColor: '#B0BEC5',
        shadowOpacity: 0,
        elevation: 0,
    },
    submitText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 8,
    },
    contextLabel: {
        marginTop: 16,
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },

    // Generic
    jsonBox: {
        backgroundColor: '#263238',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    jsonText: {
        color: '#FFF',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 12,
    },
});
