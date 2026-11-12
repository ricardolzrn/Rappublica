import React, { useState } from "react";
import { FlatList, Text, View } from "react-native";
import useResource from "../../hooks/useResource";
import { useApp } from "../../contexts/AppContext";
import {
  Button,
  Heading,
  Empty,
  Feedback,
  Badge,
  Confirm,
  useAction,
} from "../../components/ui";
import { colors, s } from "../../theme";
import { moeda } from "../../utils/format";
export default function ListaMoradores({ navigation }) {
  const r = useResource("/moradores"),
    { mutate } = useApp(),
    a = useAction();
  const [selected, setSelected] = useState(null);
  const excluir = () =>
    a.run(async () => {
      await mutate(`/moradores/${selected.id}`, "DELETE");
      setSelected(null);
      await r.reload();
    });
  return (
    <View style={s.page}>
      <FlatList
        contentContainerStyle={s.content}
        data={r.data || []}
        keyExtractor={(item) => item.id}
        refreshing={r.loading && !!r.data}
        onRefresh={r.reload}
        ListHeaderComponent={
          <View style={{ gap: 18 }}>
            <Heading
              title="Quem divide a casa"
              subtitle="Moradores, quartos e acertos em um só lugar."
            />
            <Button
              title="Novo morador"
              icon="person-add-outline"
              onPress={() => navigation.navigate("CadastrarMorador")}
            />
            <Feedback resource={r} />
            {a.error && !selected ? (
              <Text accessibilityRole="alert" style={s.error}>
                {a.error}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !r.loading && r.data ? (
            <Empty
              title="A casa está vazia"
              text="Cadastre o primeiro morador para começar a dividir despesas."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.row}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  backgroundColor: colors.soft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    color: colors.primary,
                    fontWeight: "800",
                  }}
                >
                  {item.nome
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.text, { fontWeight: "700" }]}>{item.nome}</Text>
                <Text style={s.small}>{item.quarto}</Text>
              </View>
            </View>
            <Text style={s.subtitle}>{item.email}</Text>
            <Badge
              label={
                item.pendenteCentavos
                  ? `${moeda(item.pendenteCentavos)} pendente no histórico`
                  : "Sem parcelas pendentes"
              }
              good={!item.pendenteCentavos}
            />
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Editar"
                  accessibilityLabel={`Editar ${item.nome}`}
                  secondary
                  disabled={r.offline || a.busy}
                  onPress={() =>
                    navigation.navigate("CadastrarMorador", { id: item.id })
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Excluir"
                  accessibilityLabel={`Excluir ${item.nome}`}
                  secondary
                  disabled={r.offline || a.busy}
                  onPress={() => {
                    a.setError("");
                    setSelected(item);
                  }}
                />
              </View>
            </View>
          </View>
        )}
      />
      <Confirm
        error={a.error}
        visible={!!selected}
        title="Excluir morador?"
        text="Moradores que participam de despesas não podem ser removidos, para preservar o histórico."
        onCancel={() => setSelected(null)}
        onConfirm={excluir}
        busy={a.busy}
      />
    </View>
  );
}
