import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MissionProgressIconProps {
  currentStep: number;
  totalSteps: number;
}

export const MissionProgressIcon: React.FC<MissionProgressIconProps> = ({ currentStep, totalSteps }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{currentStep} / {totalSteps}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});
