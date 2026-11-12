import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { styles } from './styles'; // 👈 Importação relativa da mesma pasta

export default function Header({ titulo, mostrarVoltar, onVoltar }) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{titulo}</Text>
      {mostrarVoltar && (
        <Pressable style={styles.btnVoltar} onPress={onVoltar}>
          <Text style={styles.txtVoltar}>← Voltar</Text>
        </Pressable>
      )}
    </View>
  );
}