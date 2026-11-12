import React from 'react';
import { Pressable, Text } from 'react-native';
import { styles } from './styles';

export default function Botao({ titulo, onPress }) {
  return (
    <Pressable style={styles.botao} onPress={onPress}>
      <Text style={styles.textoBotao}>{titulo}</Text>
    </Pressable>
  );
}