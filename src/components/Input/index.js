import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { styles } from './styles';

export default function Input({ label, placeholder, value, onChangeText, secureTextEntry }) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}