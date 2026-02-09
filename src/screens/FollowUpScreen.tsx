import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SHADOWS } from '../theme/colors';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';

// FIX: We use 'export default' here to match your index.tsx
export default function FollowUpScreen({ navigation }: any) {
  const { followUps, addFollowUp, completeFollowUp } = useStore();
  
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [followUpDate, setFollowUpDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    const newFollowUp = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      followUpDate,
      notified: false,
      completed: false,
    };

    addFollowUp(newFollowUp);
    
    // Reset form
    setTitle('');
    setDescription('');
    setFollowUpDate(new Date());
    setShowModal(false);
    
    Alert.alert('Success', 'Follow-up created successfully!');
  };

  const activeFollowUps = followUps.filter(f => !f.completed);
  const completedFollowUps = followUps.filter(f => f.completed);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.golden, COLORS.goldenDark]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Follow-Up Automation</Text>
        <View style={styles.headerRight} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.golden} />
          <Text style={styles.infoText}>
            Never miss a follow-up again. Set it once and we'll remind you automatically.
          </Text>
        </View>

        {/* Active Follow-ups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Follow-ups ({activeFollowUps.length})</Text>
          
          {activeFollowUps.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>No active follow-ups</Text>
              <Text style={styles.emptySubtext}>Create your first follow-up below</Text>
            </View>
          ) : (
            activeFollowUps.map((followUp) => (
              <View key={followUp.id} style={styles.followUpCard}>
                <View style={styles.followUpHeader}>
                  <View style={styles.followUpIcon}>
                    <Ionicons name="time" size={24} color={COLORS.golden} />
                  </View>
                  <View style={styles.followUpContent}>
                    <Text style={styles.followUpTitle}>{followUp.title}</Text>
                    {followUp.description ? (
                      <Text style={styles.followUpDescription}>{followUp.description}</Text>
                    ) : null}
                    <View style={styles.followUpDate}>
                      <Ionicons name="calendar" size={16} color={COLORS.darkGray} />
                      <Text style={styles.followUpDateText}>
                        {format(new Date(followUp.followUpDate), 'MMM dd, yyyy')}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => completeFollowUp(followUp.id)}
                >
                  <Ionicons name="checkmark-circle-outline" size={28} color={COLORS.success} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Completed Follow-ups */}
        {completedFollowUps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed ({completedFollowUps.length})</Text>
            {completedFollowUps.map((followUp) => (
              <View key={followUp.id} style={[styles.followUpCard, styles.completedCard]}>
                <View style={styles.followUpHeader}>
                  <View style={[styles.followUpIcon, styles.completedIcon]}>
                    <Ionicons name="checkmark" size={24} color={COLORS.success} />
                  </View>
                  <View style={styles.followUpContent}>
                    <Text style={[styles.followUpTitle, styles.completedText]}>
                      {followUp.title}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowModal(true)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[COLORS.golden, COLORS.goldenDark]}
          style={styles.createButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="add" size={28} color={COLORS.white} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Follow-up</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Follow up with client"
                  value={title}
                  onChangeText={setTitle}
                  placeholderTextColor={COLORS.gray}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add more details..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor={COLORS.gray}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Follow-up Date *</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color={COLORS.golden} />
                  <Text style={styles.dateButtonText}>
                    {format(followUpDate, 'MMM dd, yyyy')}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.darkGray} />
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={followUpDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) setFollowUpDate(date);
                  }}
                  minimumDate={new Date()}
                />
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreate}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[COLORS.golden, COLORS.goldenDark]}
                  style={styles.submitButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.submitButtonText}>Create Follow-up</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  headerRight: { width: 40 },
  content: { flex: 1, paddingHorizontal: 20 },
  infoCard: { flexDirection: 'row', backgroundColor: COLORS.goldenLight, borderRadius: 12, padding: 16, marginTop: 20, marginBottom: 24 },
  infoText: { flex: 1, marginLeft: 12, fontSize: 14, color: COLORS.goldenDark, lineHeight: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black, marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.darkGray, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: COLORS.gray, marginTop: 8 },
  followUpCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, ...SHADOWS.medium },
  completedCard: { opacity: 0.7 },
  followUpHeader: { flexDirection: 'row', flex: 1 },
  followUpIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.goldenLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  completedIcon: { backgroundColor: COLORS.success + '20' },
  followUpContent: { flex: 1 },
  followUpTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 4 },
  completedText: { textDecorationLine: 'line-through' },
  followUpDescription: { fontSize: 14, color: COLORS.darkGray, marginBottom: 8 },
  followUpDate: { flexDirection: 'row', alignItems: 'center' },
  followUpDateText: { fontSize: 13, color: COLORS.darkGray, marginLeft: 6 },
  completeButton: { padding: 8 },
  createButton: { position: 'absolute', bottom: 30, right: 20, borderRadius: 30, overflow: 'hidden', ...SHADOWS.large },
  createButtonGradient: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.black },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 8 },
  input: { backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 16, fontSize: 16, color: COLORS.black },
  textArea: { height: 100, textAlignVertical: 'top' },
  dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 16 },
  dateButtonText: { flex: 1, marginLeft: 12, fontSize: 16, color: COLORS.black },
  submitButton: { marginTop: 24, borderRadius: 12, overflow: 'hidden' },
  submitButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  submitButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },
});