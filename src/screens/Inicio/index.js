import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import Card from '../../components/Card';
import { styles } from './styles';

export default function Home({ setTela, moradores, despesas, nomeRepublica }) {
  const qtdMoradores = moradores.length;
  const despesasPendentes = despesas.filter(d => !d.paga).length;

  return (
    <ScrollView style={styles.container}>
      
      <View style={styles.headerBanner}>
        <View style={styles.headerInfo}>
          <Text style={styles.nomeRepublica}>{nomeRepublica}</Text>
          <Text style={styles.badgeMoradores}>👥 {qtdMoradores} moradores ativos</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <Card 
          titulo="Gerenciar Moradores 💁‍♂️​" 
          subtitulo={`${qtdMoradores} cadastrados na casa`}
          onPress={() => setTela('ListaMoradores')} 
        />

        <Card 
          titulo="Cadastrar despesa 💳​" 
          subtitulo={`cadastre uma despesa`}
          onPress={() => setTela('CadastrarDespesa')} 
        />
        
        <Card 
          titulo="Despesas da Casa 💵​" 
          subtitulo={despesasPendentes > 0 ? `${despesasPendentes} contas pendentes` : 'Tudo pago!'}
          onPress={() => setTela('ExtratoDespesas')} 
        />

        <Card 
          titulo="Regras da República ​📄​" 
          subtitulo="Ver e editar regras de convivência"
          onPress={() => setTela('RegrasCasa')} 
        />

        <Card 
          titulo="Configurações ⚙️​" 
          subtitulo="Alterar nome e preferências"
          onPress={() => setTela('ConfigRepublica')} 
        />
      </View>

    </ScrollView>
  );
}