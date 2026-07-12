import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react-native';
import React, { createContext, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type ToastType = 'success' | 'error' | 'alert' | 'info';

interface ToastContextData {
  showToast: (type: ToastType, message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toast, setToast] = useState<{ type: ToastType; message: string; title: string } | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showToast = (type: ToastType, message: string, title?: string) => {
    setToast({ type, message, title: title || type.toUpperCase() });
    
    // Animação de entrada
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start(() => setToast(null));
  };

  const getIcon = () => {
    switch (toast?.type) {
      case 'success': return <CheckCircle color="#fff" size={24} />;
      case 'error': return <XCircle color="#fff" size={24} />;
      case 'alert': return <AlertTriangle color="#fff" size={24} />;
      default: return <Info color="#fff" size={24} />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast?.type) {
      case 'success': return '#22c55e';
      case 'error': return '#ef4444';
      case 'alert': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View style={[styles.container, { opacity: fadeAnim, backgroundColor: getBackgroundColor() }]}>
          <View style={styles.icon}>{getIcon()}</View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{toast.title}</Text>
            <Text style={styles.message}>{toast.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  icon: { marginRight: 12 },
  textContainer: { flex: 1 },
  title: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  message: { color: '#fff', fontSize: 12, opacity: 0.9 },
});