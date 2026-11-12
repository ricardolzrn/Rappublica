import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, Pressable } from 'react-native';
import Input from '../../components/Input';
import Botao from '../../components/Botao';
import { styles } from './styles';

export default function RegrasCasa({
  regras,
  moradores,
  onAdicionar,
  onEditar,
  onRemover,
  onToggleAceite,
}) {
  
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoTexto, setNovoTexto] = useState('');

  const [idEdicao, setIdEdicao] = useState(null);
  const [tituloEditado, setTituloEditado] = useState('');
  const [textoEditado, setTextoEditado] = useState('');

  function handleAdicionar() {
    if (!novoTitulo.trim() || !novoTexto.trim()) {
      alert('Preencha o título e a descrição da regra!');
      return;
    }
    onAdicionar({ titulo: novoTitulo, texto: novoTexto });
    setNovoTitulo('');
    setNovoTexto('');
  }

  function iniciarEdicao(regra) {
    setIdEdicao(regra.id);
    setTituloEditado(regra.titulo);
    setTextoEditado(regra.texto);
  }

  function salvarEdicao(id) {
    if (!tituloEditado.trim() || !textoEditado.trim()) {
      alert('O título e a descrição não podem estar vazios!');
      return;
    }
    onEditar(id, tituloEditado, textoEditado);
    setIdEdicao(null);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.titulo}>Estatuto e Regras Internas</Text>

      <View style={styles.boxFormAdicionar}>
        <Text style={styles.subtituloSecao}>➕ Adicionar Nova Regra</Text>
        <Input
          label="Título da Regra"
          placeholder="Ex: Uso da Garagem"
          value={novoTitulo}
          onChangeText={setNovoTitulo}
        />
        <Input
          label="Descrição/Instruções"
          placeholder="Ex: Respeitar as vagas demarcadas..."
          value={novoTexto}
          onChangeText={setNovoTexto}
        />
        <Botao titulo="Salvar Regra" onPress={handleAdicionar} />
      </View>

      <Text style={styles.subtituloSecao}>Regras Ativas ({regras.length})</Text>

      {regras.map((item, index) => {
        const estaEditando = idEdicao === item.id;

        return (
          <View key={item.id} style={styles.cardRegra}>
            {estaEditando ? (
              <View>
                <Input label="Título" value={tituloEditado} onChangeText={setTituloEditado} />
                <Input label="Descrição" value={textoEditado} onChangeText={setTextoEditado} />
                <View style={styles.rowAcoesEdicao}>
                  <Pressable style={styles.btnSalvar} onPress={() => salvarEdicao(item.id)}>
                    <Text style={styles.txtBtnBranco}>✓ Salvar</Text>
                  </Pressable>
                  <Pressable style={styles.btnCancelar} onPress={() => setIdEdicao(null)}>
                    <Text style={styles.txtBtnCinza}>Cancelar</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.tituloRegra}>
                  {index + 1}. {item.titulo}
                </Text>
                <Text style={styles.textoRegra}>{item.texto}</Text>

                <View style={styles.rowAcoes}>
                  <Pressable onPress={() => iniciarEdicao(item)}>
                    <Text style={styles.txtAcaoEditar}>✏️ Editar</Text>
                  </Pressable>
                  <Pressable onPress={() => onRemover(item.id)}>
                    <Text style={styles.txtAcaoExcluir}>🗑️️ Eliminar</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        );
      })}

      <Text style={[styles.subtituloSecao, { marginTop: 25 }]}>
        Adesão dos Integrantes ({moradores.length})
      </Text>

      {moradores.map((m) => (
        <View key={m.id} style={styles.cardAdesao}>
          <View>
            <Text style={styles.nomeMorador}>{m.nome}</Text>
            <Text
              style={[
                styles.statusAdesao,
                { color: m.aceitouRegras ? '#16A34A' : '#DC2626' },
              ]}
            >
              {m.aceitouRegras ? '✓ Assinado' : '⏳ Pendente'}
            </Text>
          </View>
          <Switch
            value={m.aceitouRegras}
            onValueChange={() => onToggleAceite(m.id)}
            thumbColor={m.aceitouRegras ? '#2563EB' : '#CCC'}
          />
        </View>
      ))}
    </ScrollView>
  );
}