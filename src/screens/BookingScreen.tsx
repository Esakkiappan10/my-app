import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function BookingScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#B8860B', '#FFD700']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Mock Booking 1 */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="airplane" size={24} color="#FFD700" />
            <Text style={styles.date}>Aug 24, 2026</Text>
          </View>
          <Text style={styles.title}>Flight to New York</Text>
          <Text style={styles.subtitle}>Automation: Price Watch & Auto-Book</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>CONFIRMED</Text>
          </View>
        </View>

        {/* Mock Booking 2 */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="medical" size={24} color="#FFD700" />
            <Text style={styles.date}>Sep 12, 2026</Text>
          </View>
          <Text style={styles.title}>Dentist Appointment</Text>
          <Text style={styles.subtitle}>Automation: Recurring Schedule</Text>
          <View style={[styles.badge, { backgroundColor: '#E0F7FA' }]}>
            <Text style={[styles.badgeText, { color: '#006064' }]}>PENDING</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  content: { padding: 20 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  date: { color: '#888', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 5, marginBottom: 15 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 12 },
});