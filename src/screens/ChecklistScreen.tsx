import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const MOCK_CHECKLIST = [
  { id: 1, title: 'Upload ID Proof', completed: true },
  { id: 2, title: 'Verify Email Address', completed: true },
  { id: 3, title: 'Submit Tax Documents', completed: false },
  { id: 4, title: 'Sign Digital Contract', completed: false },
];

export default function ChecklistScreen({ navigation }: any) {
  const [items, setItems] = useState(MOCK_CHECKLIST);

  const toggleItem = (id: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#B8860B', '#FFD700']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Document Checklist</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Passport Application</Text>
        {items.map((item) => (
          <TouchableOpacity key={item.id} style={styles.card} onPress={() => toggleItem(item.id)}>
            <View style={[styles.checkbox, item.completed && styles.checked]}>
              {item.completed && <Ionicons name="checkmark" size={18} color="#FFF" />}
            </View>
            <Text style={[styles.itemText, item.completed && styles.strikethrough]}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 15, marginBottom: 10 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#FFD700', marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  checked: { backgroundColor: '#FFD700' },
  itemText: { fontSize: 16, color: '#333' },
  strikethrough: { textDecorationLine: 'line-through', color: '#AAA' },
});