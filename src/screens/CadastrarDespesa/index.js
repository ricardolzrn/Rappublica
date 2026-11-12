import React, { useState } from 'react';
import { View, Text, Switch, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import Input from '../../components/Input';
import Botao from '../../components/Botao';
import { styles } from './styles';

export default function CadastrarDespesa({ onSalvar, moradoresCount }) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [tipoConta, setTipoConta] = useState('Fixa');
  const [categoria, setCategoria] = useState('Energia');
  const [urgencia, setUrgencia] = useState(1);
  const [estaPaga, setEstaPaga] = useState(false);

  const totalMoradores = moradoresCount || 1;
  const valorNumerico = parseFloat(valor) || 0;
  const valorPorMorador = valorNumerico > 0 ? (valorNumerico / totalMoradores).toFixed(2) : '0.00';

  function handleSalvar() {
    if (!descricao.trim() || !valor.trim() || isNaN(valorNumerico)) {
      alert('Informe uma descrição e um valor numérico válido!');
      return;
    }

    onSalvar({
      descricao,
      valor: valorNumerico,
      tipo: tipoConta,
      categoria,
      urgencia,
      paga: estaPaga,
    });

    setDescricao('');
    setValor('');
    setEstaPaga(false);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Lançar Nova Conta</Text>

      <Input label="Descrição" placeholder="Ex: Aluguel, Luz, Internet" value={descricao} onChangeText={setDescricao} />
      <Input label="Valor Total (R$)" placeholder="Ex: 300.00" value={valor} onChangeText={setValor} keyboardType="numeric" />

      <View style={{ backgroundColor: '#E0F2FE', padding: 12, borderRadius: 8, marginVertical: 10 }}>
        <Text style={{ color: '#0369A1', fontWeight: 'bold' }}>
          💡 Divisão Per Capita ({totalMoradores} moradores):
        </Text>
        <Text style={{ color: '#0284C7', fontSize: 16, fontWeight: '800', marginTop: 4 }}>
          R$ {valorPorMorador} / morador
        </Text>
      </View>

      <Text style={styles.label}>Tipo de Despesa:</Text>
      <Picker selectedValue={tipoConta} onValueChange={setTipoConta} style={styles.picker}>
        <Picker.Item label="Fixo Mensal (Recorrente)" value="Fixa" />
        <Picker.Item label="Variável / Eventual" value="Variável" />
      </Picker>

      <Text style={styles.label}>Categoria:</Text>
      <Picker selectedValue={categoria} onValueChange={setCategoria} style={styles.picker}>
        <Picker.Item label="Energia Elétrica" value="Energia" />
        <Picker.Item label="Água e Esgoto" value="Água" />
        <Picker.Item label="Internet Fibra" value="Internet" />
        <Picker.Item label="Mercado / Limpeza" value="Mercado" />
      </Picker>

      <Text style={styles.label}>Nível de Prioridade (1 a 5):</Text>
      <Slider minimumValue={1} maximumValue={5} step={1} value={urgencia} onValueChange={setUrgencia} minimumTrackTintColor="#2563EB" />
      <Text style={styles.valorSlider}>Prioridade: {urgencia}</Text>

      <View style={styles.rowSwitch}>
        <Text style={styles.label}>Conta Paga?</Text>
        <Switch value={estaPaga} onValueChange={setEstaPaga} thumbColor={estaPaga ? '#2563EB' : '#CCC'} />
      </View>

      <Botao titulo="Confirmar Lançamento" onPress={handleSalvar} />
    </ScrollView>
  );
}