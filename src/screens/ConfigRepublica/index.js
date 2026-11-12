import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { styles } from './styles';
import Input from '../../components/Input';
import Botao from '../../components/Botao';

export default function ConfigRepublica({ nomeAtual, onSalvar }) {
  const [novoNome, setNovoNome] = useState(nomeAtual);

  function handleSalvar() {
    if (!novoNome.trim()) {
      alert('O nome da república não pode ficar vazio!');
      return;
    }
    
    onSalvar(novoNome);
    alert('Nome da república atualizado com sucesso!');
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Configurações da Casa</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nome da República</Text>
        <Input 
          placeholder="Ex: República Toca do Rato" 
          value={novoNome} 
          onChangeText={setNovoNome} 
        />
        
        <View style={{ marginTop: 10 }}>
          <Botao titulo="Salvar Alterações" onPress={handleSalvar} />
        </View>
      </View>

    </ScrollView>
  );
}