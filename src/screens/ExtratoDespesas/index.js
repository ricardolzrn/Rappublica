import React, { useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Input from '../../components/Input';
import { styles } from './styles';

export default function ExtratoDespesas({ despesas, moradoresCount, onTogglePaga, onEditar, onRemover }) {
  const [busca, setBusca] = useState('');

  // Estados locais para edição
  const [idEdicao, setIdEdicao] = useState(null);
  const [descEditada, setDescEditada] = useState('');
  const [valorEditado, setValorEditado] = useState('');
  const [catEditada, setCatEditada] = useState('Energia');

  const listaFiltrada = despesas.filter((d) =>
    d.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  function iniciarEdicao(item) {
    setIdEdicao(item.id);
    setDescEditada(item.descricao);
    setValorEditado(String(item.valor));
    setCatEditada(item.categoria);
  }

  function salvarEdicao(id) {
    const valorNum = parseFloat(valorEditado);
    if (!descEditada.trim() || isNaN(valorNum)) {
      alert('Informe uma descrição e um valor numérico válido!');
      return;
    }
    onEditar(id, {
      descricao: descEditada,
      valor: valorNum,
      categoria: catEditada,
    });
    setIdEdicao(null);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Extrato & Quotas ({despesas.length} contas)</Text>
      <Input placeholder="Buscar por conta..." value={busca} onChangeText={setBusca} />

      <FlatList
        data={listaFiltrada}
        extraData={despesas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const estaEditando = idEdicao === item.id;
          const quota = (item.valor / (moradoresCount || 1)).toFixed(2);

          return (
            <View style={styles.card}>
              {estaEditando ? (
                <View style={{ flex: 1 }}>
                  <Input label="Descrição" value={descEditada} onChangeText={setDescEditada} />
                  <Input label="Valor Total (R$)" value={valorEditado} onChangeText={setValorEditado} keyboardType="numeric" />
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#333', marginTop: 4 }}>
                    Categoria:
                  </Text>
                  <Picker selectedValue={catEditada} onValueChange={setCatEditada} style={{ backgroundColor: '#F1F5F9' }}>
                    <Picker.Item label="Energia Elétrica" value="Energia" />
                    <Picker.Item label="Água e Esgoto" value="Água" />
                    <Picker.Item label="Internet Fibra" value="Internet" />
                    <Picker.Item label="Mercado / Limpeza" value="Mercado" />
                  </Picker>

                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                    <Pressable
                      onPress={() => salvarEdicao(item.id)}
                      style={{ backgroundColor: '#16A34A', padding: 8, borderRadius: 6, marginRight: 8 }}
                    >
                      <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>✓ Salvar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setIdEdicao(null)}
                      style={{ backgroundColor: '#CBD5E1', padding: 8, borderRadius: 6 }}
                    >
                      <Text style={{ color: '#334155', fontWeight: 'bold', fontSize: 12 }}>Cancelar</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.desc}>{item.descricao}</Text>
                    <Text style={styles.cat}>
                      {item.categoria} • <Text style={{ fontWeight: 'bold' }}>[{item.tipo}]</Text>
                    </Text>
                    <Text style={{ fontSize: 13, color: '#2563EB', fontWeight: 'bold', marginTop: 4 }}>
                      Quota por morador: R$ {quota}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginTop: 2 }}>
                      Total: R$ {item.valor.toFixed(2)}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <Pressable
                      onPress={() => onTogglePaga(item.id)}
                      style={{
                        backgroundColor: item.paga ? '#DCFCE7' : '#FEE2E2',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ color: item.paga ? '#16A34A' : '#DC2626', fontWeight: 'bold', fontSize: 12 }}>
                        {item.paga ? '✓ Paga' : '⏳ Pendente'}
                      </Text>
                    </Pressable>

                    <View style={{ flexDirection: 'row', marginTop: 10 }}>
                      <Pressable onPress={() => iniciarEdicao(item)} style={{ marginRight: 12 }}>
                        <Text style={{ color: '#0284C7', fontSize: 12, fontWeight: 'bold' }}>✏️ Editar</Text>
                      </Pressable>
                      <Pressable onPress={() => onRemover(item.id)}>
                        <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: 'bold' }}>🗑️ Excluir</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}