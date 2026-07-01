import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const TrainingPanelLab = () => {
  return (
    <View style={styles.panel}>
      <Text style={styles.titleText}>Training Progress</Text>
      
      <View style={styles.scoreBox}>
        <Text style={styles.scoreLabel}>Score</Text>
        <Text style={styles.scoreValue}>0</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Tap the center to interact</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    width: 250,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10, // 안드로이드 그림자
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1,
  },
  scoreBox: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
  },
  scoreLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 5,
  },
  scoreValue: {
    color: '#00FFAA', // 사이버펑크 민트색 포인트
    fontSize: 32,
    fontWeight: '900',
  },
  infoBox: {
    alignItems: 'center',
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  }
});
