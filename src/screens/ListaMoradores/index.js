import React, { useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Imagem from '../../components/Imagem';
import Input from '../../components/Input';
import { styles } from './styles';

export default function ListaMoradores({ moradores, onEditar, onRemover }) {
  const [idEdicao, setIdEdicao] = useState(null);
  const [nomeEditado, setNomeEditado] = useState('');
  const [emailEditado, setEmailEditado] = useState('');
  const [quartoEditado, setQuartoEditado] = useState('Suíte');

  function iniciarEdicao(morador) {
    setIdEdicao(morador.id);
    setNomeEditado(morador.nome);
    setEmailEditado(morador.email);
    setQuartoEditado(morador.quarto);
  }

  function salvarEdicao(id) {
    if (!nomeEditado.trim() || !emailEditado.trim()) {
      alert('Preencha o nome e o e-mail!');
      return;
    }
    onEditar(id, { nome: nomeEditado, email: emailEditado, quarto: quartoEditado });
    setIdEdicao(null);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Moradores Ativos ({moradores.length})</Text>

      <FlatList
        data={moradores}
        extraData={moradores}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const estaEditando = idEdicao === item.id;

          return (
            <View style={styles.cardItem}>
              {estaEditando ? (
                <View style={{ flex: 1 }}>
                  <Input label="Nome" value={nomeEditado} onChangeText={setNomeEditado} />
                  <Input label="E-mail" value={emailEditado} onChangeText={setEmailEditado} />
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#333', marginTop: 6 }}>
                    Quarto:
                  </Text>
                  <Picker
                    selectedValue={quartoEditado}
                    onValueChange={setQuartoEditado}
                    style={{ backgroundColor: '#F1F5F9', marginVertical: 6 }}
                  >
                    <Picker.Item label="Suíte Presidencial" value="Suíte" />
                    <Picker.Item label="Quarto Individual 1" value="Individual 1" />
                    <Picker.Item label="Quarto Duplo" value="Duplo" />
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
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Imagem url="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" largura={45} altura={45} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.nome}>{item.nome}</Text>
                    <Text style={styles.detalhe}>Quarto: {item.quarto}</Text>
                    <Text style={styles.detalhe}>{item.email}</Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Pressable onPress={() => iniciarEdicao(item)} style={{ marginBottom: 8 }}>
                      <Text style={{ color: '#0284C7', fontWeight: 'bold', fontSize: 13 }}>✏️ Editar</Text>
                    </Pressable>
                    <Pressable onPress={() => onRemover(item.id)}>
                      <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 13 }}>🗑️ Excluir</Text>
                    </Pressable>
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