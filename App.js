import React, { useState } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';

import Home from './src/screens/Inicio';
import CadastrarMorador from './src/screens/CadastrarMorador';
import ListaMoradores from './src/screens/ListaMoradores';
import CadastrarDespesa from './src/screens/CadastrarDespesa';
import ExtratoDespesas from './src/screens/ExtratoDespesas';
import RegrasCasa from './src/screens/RegrasCasa';
import ConfigRepublica from './src/screens/ConfigRepublica';

export default function App() {
  const [telaAtual, setTelaAtual] = useState('Home');
  
  const [nomeRepublica, setNomeRepublica] = useState('Rappublica');

  const [moradores, setMoradores] = useState([
    { id: '1', nome: 'Lucas Fagundes', quarto: 'Suíte', email: 'lucas@gmail.com', aceitouRegras: true },
    { id: '2', nome: 'Caio Monte Alegre', quarto: 'Individual 1', email: 'caio@gmail.com', aceitouRegras: true },
    { id: '3', nome: 'Ricardo Lazarini', quarto: 'Duplo', email: 'ricardo@gmail.com', aceitouRegras: true },
  ]);

  const [despesas, setDespesas] = useState([
    { id: '1', descricao: 'Aluguel + IPTU', valor: 1500.0, tipo: 'Fixa', categoria: 'Moradia', paga: true },
    { id: '2', descricao: 'Internet Fibra', valor: 120.0, tipo: 'Fixa', categoria: 'Internet', paga: true },
    { id: '3', descricao: 'Energia Elétrica', valor: 270.0, tipo: 'Variável', categoria: 'Energia', paga: false },
  ]);

  const [regras, setRegras] = useState([
    { id: '1', titulo: 'Horário de Silêncio', texto: 'Silêncio absoluto entre 22h e 07h em dias úteis.' },
    { id: '2', titulo: 'Limpeza da Cozinha', texto: 'Louça limpa imediatamente após o uso.' },
  ]);

  function editarMorador(id, dadosAtualizados) {
    setMoradores((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...dadosAtualizados } : m))
    );
  }

  function editarDespesa(id, dadosAtualizados) {
    setDespesas((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...dadosAtualizados } : d))
    );
  }

  function adicionarMorador(novo) {
    setMoradores((prev) => [...prev, { id: String(Date.now()), ...novo, aceitouRegras: false }]);
    setTelaAtual('ListaMoradores');
  }

  function removerMorador(id) {
    setMoradores((prev) => prev.filter((m) => m.id !== id));
  }

  function adicionarDespesa(nova) {
    setDespesas((prev) => [...prev, { id: String(Date.now()), ...nova }]);
    setTelaAtual('ExtratoDespesas');
  }

  function removerDespesa(id) {
    setDespesas((prev) => prev.filter((d) => d.id !== id));
  }

  function alternarStatusDespesa(id) {
    setDespesas((prev) =>
      prev.map((d) => (d.id === id ? { ...d, paga: !d.paga } : d))
    );
  }

  function adicionarRegra(nova) {
    setRegras((prev) => [...prev, { id: String(Date.now()), ...nova }]);
  }

  function removerRegra(id) {
    setRegras((prev) => prev.filter((r) => r.id !== id));
  }

  function editarRegra(id, titulo, texto) {
    setRegras((prev) =>
      prev.map((r) => (r.id === id ? { ...r, titulo, texto } : r))
    );
  }

  function alternarAceiteRegras(id) {
    setMoradores((prev) =>
      prev.map((m) => (m.id === id ? { ...m, aceitouRegras: !m.aceitouRegras } : m))
    );
  }

  function renderizarTela() {
    switch (telaAtual) {
      case 'Home':
        return <Home setTela={setTelaAtual} moradores={moradores} despesas={despesas} nomeRepublica={nomeRepublica}/>;
      case 'CadastrarMorador':
        return <CadastrarMorador onSalvar={adicionarMorador} />;
      case 'ListaMoradores':
        return (
          <ListaMoradores
            moradores={moradores}
            onEditar={editarMorador}
            onRemover={removerMorador}
          />
        );
      case 'CadastrarDespesa':
        return <CadastrarDespesa onSalvar={adicionarDespesa} moradoresCount={moradores.length} />;
      case 'ExtratoDespesas':
        return (
          <ExtratoDespesas
            despesas={despesas}
            moradoresCount={moradores.length}
            onTogglePaga={alternarStatusDespesa}
            onEditar={editarDespesa}
            onRemover={removerDespesa}
          />
        );
      case 'RegrasCasa':
        return (
          <RegrasCasa
            regras={regras}
            moradores={moradores}
            onAdicionar={adicionarRegra}
            onEditar={editarRegra}
            onRemover={removerRegra}
            onToggleAceite={alternarAceiteRegras}
          />
        );
      case 'ConfigRepublica':
        return <ConfigRepublica nomeAtual={nomeRepublica} onSalvar={setNomeRepublica} />;
      default:
        return <Home setTela={setTelaAtual} moradores={moradores} despesas={despesas} nomeRepublica={nomeRepublica}/>;
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>{nomeRepublica}</Text>
        {telaAtual !== 'Home' && (
          <Pressable style={styles.btnVoltar} onPress={() => setTelaAtual('Home')}>
            <Text style={styles.txtVoltar}>← Voltar</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.conteudo}>{renderizarTela()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  topBar: {
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  btnVoltar: { backgroundColor: '#334155', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  txtVoltar: { color: '#38BDF8', fontWeight: 'bold', fontSize: 13 },
  conteudo: { flex: 1 },
});