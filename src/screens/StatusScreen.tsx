import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Mock Data for demonstration (No backend needed)
const MOCK_STATUSES = [
  { id: 1, title: "Passport Application", status: "In Progress", progress: 0.6, color: "#FFD700" },
  { id: 2, title: "Utility Bill Payment", status: "Completed", progress: 1.0, color: "#4CAF50" },
  { id: 3, title: "Doctor Appointment", status: "Pending Action", progress: 0.3, color: "#FF9800" },
  { id: 4, title: "Weekly Grocery Order", status: "Scheduled", progress: 0.1, color: "#2196F3" },
];

export default function StatusScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      {/* Golden Header */}
      <LinearGradient
        colors={['#B8860B', '#FFD700']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Status Monitor</Text>
        <View style={{ width: 40 }} /> 
      </LinearGradient>

      <ScrollView style={styles.content}>
        {MOCK_STATUSES.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={[styles.statusText, { color: item.color }]}>{item.status}</Text>
            </View>
            
            {/* Progress Bar Visual */}
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${item.progress * 100}%`, backgroundColor: item.color }
                ]} 
              />
            </View>
            <Text style={styles.percentage}>{(item.progress * 100).toFixed(0)}% Complete</Text>
          </View>
        ))}
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
  card: { backgroundColor: '#FFF', borderRadius: 15, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statusText: { fontWeight: 'bold', fontSize: 14 },
  progressBarBackground: { height: 8, backgroundColor: '#EEE', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  percentage: { marginTop: 8, fontSize: 12, color: '#888', textAlign: 'right' }
});