import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a2a6c', '#b21f1f']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Mock Card */}
        <LinearGradient colors={['#333', '#000']} style={styles.creditCard}>
          <Text style={styles.cardLabel}>ZeroMode Secure</Text>
          <Text style={styles.cardNumber}>•••• •••• •••• 4242</Text>
          <View style={styles.cardBottom}>
            <Text style={styles.cardName}>JOHN DOE</Text>
            <Text style={styles.cardExpiry}>12/28</Text>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Recent Auto-Payments</Text>
        
        <View style={styles.transaction}>
          <View style={styles.iconBox}><Ionicons name="tv" size={20} color="#FFF" /></View>
          <View style={styles.transInfo}>
            <Text style={styles.transTitle}>Netflix Subscription</Text>
            <Text style={styles.transDate}>Today, 10:00 AM</Text>
          </View>
          <Text style={styles.transAmount}>-$15.99</Text>
        </View>

        <View style={styles.transaction}>
          <View style={[styles.iconBox, { backgroundColor: '#4CAF50' }]}><Ionicons name="flash" size={20} color="#FFF" /></View>
          <View style={styles.transInfo}>
            <Text style={styles.transTitle}>Electricity Bill</Text>
            <Text style={styles.transDate}>Yesterday</Text>
          </View>
          <Text style={styles.transAmount}>-$124.50</Text>
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
  creditCard: { height: 200, borderRadius: 20, padding: 25, justifyContent: 'space-between', marginBottom: 30 },
  cardLabel: { color: '#AAA', fontSize: 14, textTransform: 'uppercase' },
  cardNumber: { color: '#FFF', fontSize: 24, letterSpacing: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardName: { color: '#FFF', fontWeight: 'bold' },
  cardExpiry: { color: '#FFF', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  transaction: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E50914', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  transInfo: { flex: 1 },
  transTitle: { fontWeight: 'bold', color: '#333' },
  transDate: { color: '#888', fontSize: 12 },
  transAmount: { fontWeight: 'bold', color: '#333' },
});