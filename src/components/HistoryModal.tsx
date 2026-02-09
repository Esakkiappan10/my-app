// History Modal - Premium Light Mode Design
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { api, TaskStatus } from '../api/agentApi';
import { colors, gradients, shadows } from '../theme';

interface HistoryModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function HistoryModal({ visible, onClose }: HistoryModalProps) {
    const [tasks, setTasks] = useState<TaskStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = async () => {
        try {
            setError(null);
            const data = await api.getTasks();
            const sortedTasks = (data.tasks || []).sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setTasks(sortedTasks);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch tasks');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (visible) {
            setLoading(true);
            fetchTasks();
        }
    }, [visible]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTasks();
    };

    const getStatusConfig = (status: string): { color: string; icon: string; bg: string } => {
        switch (status) {
            case 'completed': return { color: colors.success, icon: 'checkmark-circle', bg: colors.successLight };
            case 'failed': return { color: colors.error, icon: 'close-circle', bg: colors.errorLight };
            case 'interrupted': return { color: colors.warning, icon: 'pause-circle', bg: colors.warningLight };
            case 'executing': return { color: colors.accent, icon: 'rocket', bg: colors.infoLight };
            default: return { color: colors.textMuted, icon: 'ellipse', bg: colors.surfaceLight };
        }
    };

    const renderItem = ({ item }: { item: TaskStatus }) => {
        const config = getStatusConfig(item.status);

        return (
            <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                {/* Status indicator bar */}
                <View style={[styles.statusBar, { backgroundColor: config.color }]} />

                <View style={styles.cardContent}>
                    {/* Header */}
                    <View style={styles.cardHeader}>
                        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                            <Ionicons name={config.icon as any} size={12} color={config.color} />
                            <Text style={[styles.statusText, { color: config.color }]}>
                                {item.status.toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.dateText}>
                            {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Text>
                    </View>

                    {/* Goal */}
                    <Text style={styles.goalText} numberOfLines={2}>
                        {item.outcome?.original_goal || item.context?.goal || 'No goal specified'}
                    </Text>

                    {/* Footer */}
                    <View style={styles.cardFooter}>
                        <Text style={styles.idText}>
                            <Ionicons name="finger-print-outline" size={12} color={colors.textMuted} /> {item.task_id.substring(0, 8)}
                        </Text>
                        {item.plan && (
                            <View style={styles.stepsContainer}>
                                <Text style={styles.stepsText}>
                                    {item.plan.filter((s: any) => s.status === 'completed').length}/{item.plan.length} steps
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Pressable>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTitle}>
                            <Ionicons name="time-outline" size={22} color={colors.textSecondary} />
                            <Text style={styles.title}>Task History</Text>
                        </View>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
                        >
                            <Ionicons name="close" size={22} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    {/* Content */}
                    {loading && !refreshing ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={styles.loadingText}>Loading tasks...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.centerContainer}>
                            <View style={styles.errorIcon}>
                                <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
                            </View>
                            <Text style={styles.errorText}>{error}</Text>
                            <Pressable style={styles.retryButton} onPress={fetchTasks}>
                                <LinearGradient
                                    colors={gradients.primary}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.retryGradient}
                                >
                                    <Ionicons name="refresh" size={16} color="#FFF" />
                                    <Text style={styles.retryText}>Retry</Text>
                                </LinearGradient>
                            </Pressable>
                        </View>
                    ) : (
                        <FlatList
                            data={tasks}
                            renderItem={renderItem}
                            keyExtractor={item => item.task_id}
                            contentContainerStyle={styles.listContent}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    tintColor={colors.primary}
                                />
                            }
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <View style={styles.emptyIcon}>
                                        <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
                                    </View>
                                    <Text style={styles.emptyTitle}>No Tasks Yet</Text>
                                    <Text style={styles.emptyText}>Your completed tasks will appear here</Text>
                                </View>
                            }
                        />
                    )}
                </SafeAreaView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        letterSpacing: -0.3,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonPressed: {
        backgroundColor: colors.border,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: colors.textSecondary,
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        ...shadows.sm,
    },
    cardPressed: {
        opacity: 0.8,
    },
    statusBar: {
        width: 4,
    },
    cardContent: {
        flex: 1,
        padding: 14,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    dateText: {
        fontSize: 12,
        color: colors.textMuted,
    },
    goalText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 12,
        lineHeight: 21,
        letterSpacing: -0.2,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    idText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    stepsContainer: {
        backgroundColor: colors.surfaceLight,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    stepsText: {
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    errorIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.errorLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    errorText: {
        color: colors.text,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    retryGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    retryText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 15,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 6,
    },
    emptyText: {
        fontSize: 14,
        color: colors.textMuted,
    },
});
