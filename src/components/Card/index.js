import React from 'react';
import { Text, Pressable } from 'react-native';
import { styles } from './styles';

export default function Card({ titulo, subtitulo, onPress }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.titulo}>{titulo}</Text>
      {subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}
    </Pressable>
  );
}