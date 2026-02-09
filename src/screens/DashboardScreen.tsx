import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen({ navigation }: any) {
  const features = [
    // --- Original 5 Features ---
    { id: 'FollowUp', name: 'Follow Ups', icon: 'time', color: '#DAA520', bg: '#FFF8DC', desc: 'Task Lists' },
    { id: 'Reminder', name: 'Reminders', icon: 'notifications', color: '#00BFFF', bg: '#E0F7FA', desc: 'Habit Tracking' },
    { id: 'Status', name: 'Status Monitor', icon: 'pulse', color: '#9C27B0', bg: '#F3E5F5', desc: 'Live Tracking' },
    { id: 'Decision', name: 'Decision AI', icon: 'git-network', color: '#4CAF50', bg: '#E8F5E9', desc: 'Smart Choices' },
    { id: 'Email', name: 'Email Drafts', icon: 'mail', color: '#FF5722', bg: '#FBE9E7', desc: 'Auto-Scheduling' },
    
    // --- NEW 3 Features Added ---
    { id: 'Checklist', name: 'Checklists', icon: 'checkbox', color: '#FFD700', bg: '#FFFDE7', desc: 'Documents' },
    { id: 'Booking', name: 'Bookings', icon: 'airplane', color: '#1a2a6c', bg: '#E3F2FD', desc: 'Mock Automation' },
    { id: 'Payment', name: 'Payments', icon: 'card', color: '#D32F2F', bg: '#FFEBEE', desc: 'Mock Automation' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a2a6c', '#b21f1f', '#fdbb2d']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome Back,</Text>
            <Text style={styles.username}>User</Text>
          </View>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color="#1a2a6c" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Automation Hub</Text>
        <View style={styles.grid}>
          {features.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.card}
              onPress={() => navigation.navigate(item.id)}
            >
              <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  username: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#FFF', padding: 15, borderRadius: 20, marginBottom: 15, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  iconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4, textAlign: 'center' },
  cardDesc: { fontSize: 11, color: '#888', textAlign: 'center' },
});