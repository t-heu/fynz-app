import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function ConfirmModal({ 
  visible, 
  title, 
  message, 
  onConfirm, 
  onCancel 
}: { 
  visible: boolean; 
  title: string; 
  message: string; 
  onConfirm: () => void; 
  onCancel: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Não</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={styles.confirmBtn}>
              <Text style={styles.confirmText}>Sim</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  container: { backgroundColor: 'white', padding: 24, borderRadius: 20 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  message: { fontSize: 14, color: '#666', marginBottom: 20 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#f0f0f0' },
  confirmBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#ef4444' },
  cancelText: { fontWeight: 'bold' },
  confirmText: { color: 'white', fontWeight: 'bold' }
});
