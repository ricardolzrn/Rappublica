import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Input from '../../components/Input';
import Botao from '../../components/Botao';
import { styles } from './styles';

export default function CadastrarMorador({ onSalvar }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [quarto, setQuarto] = useState('Suíte');

  function handleSalvar() {
    if (!nome.trim() || !email.trim()) {
      alert('Preencha nome e e-mail!');
      return;
    }
    onSalvar({ nome, email, quarto });
    setNome('');
    setEmail('');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Cadastrar Novo Morador</Text>
      <Input label="Nome Completo" placeholder="Digite o nome..." value={nome} onChangeText={setNome} />
      <Input label="E-mail" placeholder="Digite o e-mail..." value={email} onChangeText={setEmail} />

      <Text style={styles.labelPicker}>Selecione o Quarto:</Text>
      <Picker selectedValue={quarto} onValueChange={setQuarto} style={styles.picker}>
        <Picker.Item label="Suíte Presidencial" value="Suíte" />
        <Picker.Item label="Quarto Individual 1" value="Individual 1" />
        <Picker.Item label="Quarto Duplo" value="Duplo" />
      </Picker>

      <Botao titulo="Adicionar Morador" onPress={handleSalvar} />
    </View>
  );
}