import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function DecisionScreen({ navigation }: any) {
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const analyzeDecision = () => {
    if (!optionA || !optionB) {
      Alert.alert("Input Required", "Please enter both options.");
      return;
    }
    // Mock Logic: Randomly pick one to simulate AI
    const winner = Math.random() > 0.5 ? optionA : optionB;
    setResult(`Based on automated outcome analysis, **${winner}** appears to be the more favorable path for your current goals.`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#B8860B', '#FFD700']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Decision Support</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>Option A (e.g., Buy Car)</Text>
        <TextInput style={styles.input} placeholder="Enter Option A" value={optionA} onChangeText={setOptionA} />

        <Text style={styles.label}>Option B (e.g., Lease Car)</Text>
        <TextInput style={styles.input} placeholder="Enter Option B" value={optionB} onChangeText={setOptionB} />

        <TouchableOpacity onPress={analyzeDecision}>
          <LinearGradient colors={['#333', '#555']} style={styles.analyzeButton}>
            <Text style={styles.analyzeText}>Analyze Decision</Text>
          </LinearGradient>
        </TouchableOpacity>

        {result && (
          <View style={styles.resultCard}>
            <Ionicons name="bulb" size={30} color="#FFD700" style={{ marginBottom: 10 }} />
            <Text style={styles.resultTitle}>Recommendation:</Text>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  backButton: { padding: 5 },
  content: { padding: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 15, marginBottom: 5 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#DDD' },
  analyzeButton: { marginTop: 30, padding: 18, borderRadius: 12, alignItems: 'center' },
  analyzeText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  resultCard: { marginTop: 30, backgroundColor: '#FFF', padding: 20, borderRadius: 15, alignItems: 'center', borderLeftWidth: 5, borderLeftColor: '#FFD700', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  resultText: { fontSize: 16, color: '#555', textAlign: 'center', lineHeight: 22 }
});