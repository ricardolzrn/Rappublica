import React, { useState } from "react";
import { FlatList, View } from "react-native";
import useResource from "../../hooks/useResource";
import { useApp } from "../../contexts/AppContext";
import {
  Button,
  Heading,
  MonthPicker,
  Field,
  Chip,
  Empty,
  Feedback,
} from "../../components/ui";
import DespesaCard from "../../components/ui/DespesaCard";
import { s } from "../../theme";
import { statusDespesa } from "../../utils/format";
export default function ExtratoDespesas({ navigation }) {
  const { mes, session } = useApp();
  const r = useResource(`/despesas?mes=${mes}`);
  const [busca, setBusca] = useState(""),
    [filtro, setFiltro] = useState("Todas");
  const lista = (r.data || []).filter(
    (d) =>
      d.descricao
        .toLocaleLowerCase("pt-BR")
        .includes(busca.toLocaleLowerCase("pt-BR")) &&
      (filtro === "Todas" ||
        statusDespesa(d) === filtro ||
        (filtro === "Pendentes" && !d.paga)),
  );
  return (
    <FlatList
      style={s.page}
      contentContainerStyle={s.content}
      data={lista}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      refreshing={r.loading && !!r.data}
      onRefresh={r.reload}
      ListHeaderComponent={
        <View style={{ gap: 18, marginBottom: 18 }}>
          <Heading
            title="Despesas"
            subtitle="Cada conta no seu lugar. Cada parcela transparente."
          />
          <MonthPicker />
          {session.usuario.papel === "administrador" ? (
            <Button
              title="Nova despesa"
              icon="add"
              onPress={() => navigation.navigate("CadastrarDespesa")}
            />
          ) : null}
          <Field
            label="Buscar despesa"
            placeholder="Aluguel, luz, mercado…"
            value={busca}
            onChangeText={setBusca}
          />
          <View style={s.chips}>
            {["Todas", "Pendentes", "Quitada", "Vencida"].map((label) => (
              <Chip
                key={label}
                label={label}
                active={filtro === label}
                onPress={() => setFiltro(label)}
              />
            ))}
          </View>
          <Feedback resource={r} />
        </View>
      }
      ListEmptyComponent={
        !r.loading && r.data ? (
          <Empty
            title="Nenhuma despesa encontrada"
            text="Experimente outro filtro ou cadastre uma nova conta."
          />
        ) : null
      }
      renderItem={({ item }) => (
        <DespesaCard
          item={item}
          onPress={() => navigation.navigate("DetalheDespesa", { id: item.id })}
        />
      )}
    />
  );
}
