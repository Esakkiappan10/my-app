import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function EmailScreen({ navigation }: any) {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const scheduleEmail = () => {
    if (!recipient || !subject) return Alert.alert("Error", "Please fill in details.");
    Alert.alert("Success", "Email has been scheduled for automated delivery tomorrow morning.");
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#B8860B', '#FFD700']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Email Automation</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <TextInput style={styles.input} placeholder="To: (e.g., HR Manager)" value={recipient} onChangeText={setRecipient} />
          <View style={styles.divider} />
          <TextInput style={styles.input} placeholder="Subject: (e.g., Follow up)" value={subject} onChangeText={setSubject} />
          <View style={styles.divider} />
          <TextInput 
            style={[styles.input, { height: 150, textAlignVertical: 'top' }]} 
            placeholder="Write your automation draft here..." 
            value={body} 
            onChangeText={setBody} 
            multiline 
          />
        </View>

        <TouchableOpacity onPress={scheduleEmail}>
          <LinearGradient colors={['#B8860B', '#FFD700']} style={styles.sendButton}>
            <Text style={styles.sendText}>Schedule Automation</Text>
            <Ionicons name="send" size={20} color="#FFF" style={{ marginLeft: 10 }} />
          </LinearGradient>
        </TouchableOpacity>
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
  card: { backgroundColor: '#FFF', borderRadius: 15, padding: 5, marginBottom: 20 },
  input: { padding: 15, fontSize: 16 },
  divider: { height: 1, backgroundColor: '#EEE' },
  sendButton: { flexDirection: 'row', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});