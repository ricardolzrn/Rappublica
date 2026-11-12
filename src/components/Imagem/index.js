import React from 'react';
import { View, Image, Text } from 'react-native';
import { styles } from './styles';

export default function Imagem({ url, largura = 150, altura = 150, legenda }) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: url }}
        style={[styles.imagem, { width: largura, height: altura }]}
      />
      {legenda ? <Text style={styles.legenda}>{legenda}</Text> : null}
    </View>
  );
}