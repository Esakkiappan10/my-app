import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function IntroductionScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a2a6c', '#b21f1f', '#fdbb2d']}
        style={styles.background}
      />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.iconContainer}>
          <Ionicons name="infinite" size={80} color="#FFD700" />
        </View>
        
        <Text style={styles.title}>ZeroMode</Text>
        <Text style={styles.subtitle}>Outcome-Based Life Automation</Text>
        
        <View style={styles.featureList}>
          <FeatureItem icon="flash" text="Instant Automations" />
          <FeatureItem icon="shield-checkmark" text="Secure & Local" />
          <FeatureItem icon="stats-chart" text="Smart Tracking" />
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.replace('ManualInput')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#1a2a6c" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: any, text: string }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon} size={24} color="#FFD700" style={{ marginRight: 10 }} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  content: { alignItems: 'center', width: '100%', padding: 20 },
  iconContainer: { marginBottom: 20, shadowColor: '#FFD700', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  title: { fontSize: 42, fontWeight: 'bold', color: '#FFF', marginBottom: 5, letterSpacing: 1 },
  subtitle: { fontSize: 18, color: '#DDD', marginBottom: 40, letterSpacing: 0.5 },
  featureList: { alignSelf: 'stretch', paddingHorizontal: 40, marginBottom: 50 },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  featureText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  button: { flexDirection: 'row', backgroundColor: '#FFD700', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  buttonText: { color: '#1a2a6c', fontSize: 18, fontWeight: 'bold', marginRight: 10 },
});