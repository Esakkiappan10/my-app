// Chat Input - Premium Floating Glass Input (Next-Gen Light Mode)
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, shadows } from '../theme';

interface ChatInputProps {
    onSend: (text: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
    const [text, setText] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const insets = useSafeAreaInsets();
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handleSend = () => {
        if (text.trim() && !disabled) {
            // Button press animation
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();

            onSend(text.trim());
            setText('');
        }
    };

    const canSend = text.trim().length > 0 && !disabled;

    const InputContainer = Platform.OS === 'ios' ? BlurView : View;
    const containerProps = Platform.OS === 'ios' ? { intensity: 90, tint: 'light' } : {};

    return (
        <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 8) + 8 }]}>
            <InputContainer {...(containerProps as any)} style={[
                styles.container,
                isFocused && styles.containerFocused
            ]}>
                {/* Subtle glow effect when focused */}
                {isFocused && (
                    <View style={styles.focusGlow} />
                )}

                {/* Input field */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder={placeholder || "Ask me anything..."}
                        placeholderTextColor={colors.textMuted}
                        value={text}
                        onChangeText={setText}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onSubmitEditing={handleSend}
                        returnKeyType="send"
                        editable={!disabled}
                        multiline
                        maxLength={500}
                    />
                </View>

                {/* Send Button */}
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <Pressable
                        onPress={handleSend}
                        disabled={!canSend}
                        style={({ pressed }) => [
                            styles.sendButton,
                            canSend ? styles.sendButtonActive : styles.sendButtonDisabled,
                            pressed && canSend && styles.sendButtonPressed,
                        ]}
                    >
                        {canSend ? (
                            <LinearGradient
                                colors={gradients.primary}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.sendButtonGradient}
                            >
                                <Ionicons name="arrow-up" size={20} color="#FFF" />
                            </LinearGradient>
                        ) : (
                            <Ionicons name="arrow-up" size={20} color={colors.textMuted} />
                        )}
                    </Pressable>
                </Animated.View>
            </InputContainer>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 16,
        right: 16,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 6,
        paddingLeft: 16,
        borderRadius: 28,
        backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.85)' : colors.surface,
        borderWidth: 1.5,
        borderColor: colors.border,
        overflow: 'hidden',
        ...shadows.lg,
    },
    containerFocused: {
        borderColor: colors.primary,
        ...shadows.glow,
    },
    focusGlow: {
        position: 'absolute',
        top: -20,
        left: -20,
        right: -20,
        bottom: -20,
        backgroundColor: 'rgba(59, 130, 246, 0.03)',
        borderRadius: 48,
    },
    inputWrapper: {
        flex: 1,
        paddingVertical: 4,
    },
    input: {
        fontSize: 16,
        lineHeight: 22,
        color: colors.text,
        maxHeight: 100,
        paddingVertical: 10,
        letterSpacing: -0.2,
    },
    sendButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        marginLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    sendButtonActive: {
        // Gradient applied via child
    },
    sendButtonDisabled: {
        backgroundColor: colors.surfaceLight,
    },
    sendButtonPressed: {
        opacity: 0.9,
    },
    sendButtonGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
