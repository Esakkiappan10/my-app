import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function ManualInputScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');

  const handleContinue = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name to continue.');
      return;
    }
    navigation.replace('Dashboard');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a2a6c', '#b21f1f']} style={styles.header}>
        <Text style={styles.headerTitle}>Profile Setup</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>What should we call you?</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Enter your name" 
            value={name}
            onChangeText={setName}
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>What is your main focus?</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g., Productivity, Health, Work" 
            value={goal}
            onChangeText={setGoal}
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <LinearGradient
            colors={['#FFD700', '#FDB931']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Enter Dashboard</Text>
            <Ionicons name="enter-outline" size={24} color="#1a2a6c" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { height: 150, justifyContent: 'flex-end', padding: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginBottom: 10 },
  content: { padding: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginBottom: 30 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10, marginTop: 10 },
  input: { backgroundColor: '#F9F9F9', borderRadius: 10, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#EEE' },
  button: { borderRadius: 15, overflow: 'hidden', shadowColor: '#FFD700', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18 },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#1a2a6c', marginRight: 10 },
});