import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/src/theme/colors';

interface Props {
  hour: string;
  minute: string;
  isPM: boolean;
  onHourChange: (h: string) => void;
  onMinuteChange: (m: string) => void;
  onTogglePeriod: () => void;
}

export function CustomTimePicker({ hour, minute, isPM, onHourChange, onMinuteChange, onTogglePeriod }: Props) {
  function handleHour(t: string) {
    const cleaned = t.replace(/[^0-9]/g, '');
    onHourChange(cleaned);
  }

  function handleMinute(t: string) {
    const cleaned = t.replace(/[^0-9]/g, '');
    onMinuteChange(cleaned);
  }

  function formatBlurHour() {
    let num = parseInt(hour, 10);
    if (isNaN(num) || num < 1) num = 12;
    if (num > 12) num = 12;
    onHourChange(num.toString().padStart(2, '0'));
  }

  function formatBlurMinute() {
    let num = parseInt(minute, 10);
    if (isNaN(num) || num < 0) num = 0;
    if (num > 59) num = 59;
    onMinuteChange(num.toString().padStart(2, '0'));
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          maxLength={2}
          value={hour}
          onChangeText={handleHour}
          onBlur={formatBlurHour}
          selectTextOnFocus
        />
      </View>
      
      <Text style={styles.colon}>:</Text>
      
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          maxLength={2}
          value={minute}
          onChangeText={handleMinute}
          onBlur={formatBlurMinute}
          selectTextOnFocus
        />
      </View>

      <TouchableOpacity style={styles.periodBox} onPress={onTogglePeriod} activeOpacity={0.7}>
        <Text style={styles.periodText}>{isPM ? 'PM' : 'AM'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  inputBox: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    width: 60,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  colon: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingBottom: 4,
  },
  periodBox: {
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    width: 60,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  periodText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
  },
});
