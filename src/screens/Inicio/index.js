import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useResource from "../../hooks/useResource";
import { useApp } from "../../contexts/AppContext";
import { Button, Heading, MonthPicker, Page, Empty } from "../../components/ui";
import DespesaCard from "../../components/ui/DespesaCard";
import { colors, s } from "../../theme";
import { moeda } from "../../utils/format";
export default function Inicio({ navigation }) {
  const { mes } = useApp();
  const resource = useResource(`/resumo?mes=${mes}`);
  const d = resource.data;
  return (
    <Page resource={resource}>
      <Heading
        title="Sua casa, em dia."
        subtitle={
          d
            ? `${d.republica.nome} · ${d.moradores} moradores ativos`
            : "Um lugar para organizar a vida em república."
        }
      />
      <MonthPicker />
      {d ? (
        <>
          <View
            style={{
              backgroundColor: colors.ink,
              borderRadius: 24,
              padding: 24,
              gap: 16,
              overflow: "hidden",
            }}
          >
            <View style={s.between}>
              <Text
                style={{ color: "#C3D0EF", fontWeight: "600", fontSize: 13 }}
              >
                DESPESAS DO MÊS
              </Text>
              <Ionicons name="wallet-outline" size={24} color="#AFC3FF" />
            </View>
            <Text
              style={{
                color: "#fff",
                fontSize: 38,
                fontWeight: "800",
                letterSpacing: -1,
              }}
            >
              {moeda(d.totalCentavos)}
            </Text>
            <View
              style={{
                height: 6,
                backgroundColor: "#3C4C68",
                borderRadius: 10,
              }}
            >
              <View
                style={{
                  height: 6,
                  borderRadius: 10,
                  width: `${d.totalCentavos ? Math.round((d.pagoCentavos / d.totalCentavos) * 100) : 0}%`,
                  backgroundColor: "#71D9B1",
                }}
              />
            </View>
            <Text style={{ color: "#C3D0EF", fontSize: 12 }}>
              {d.quantidade} despesas ·{" "}
              {d.totalCentavos
                ? Math.round((d.pagoCentavos / d.totalCentavos) * 100)
                : 0}
              % quitado
            </Text>
          </View>
          <View style={[s.row, { alignItems: "stretch" }]}>
            <View
              style={[
                s.card,
                {
                  flex: 1,
                  backgroundColor: colors.greenSoft,
                  borderColor: colors.greenSoft,
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color={colors.green}
              />
              <Text style={s.small}>Já pago</Text>
              <Text
                style={{ fontSize: 20, fontWeight: "800", color: colors.green }}
              >
                {moeda(d.pagoCentavos)}
              </Text>
            </View>
            <View
              style={[
                s.card,
                {
                  flex: 1,
                  backgroundColor: colors.amberSoft,
                  borderColor: colors.amberSoft,
                },
              ]}
            >
              <Ionicons name="time-outline" size={22} color={colors.amber} />
              <Text style={s.small}>Falta acertar</Text>
              <Text
                style={{ fontSize: 20, fontWeight: "800", color: colors.amber }}
              >
                {moeda(d.pendenteCentavos)}
              </Text>
            </View>
          </View>
          <Button
            title="Nova despesa"
            icon="add"
            onPress={() => navigation.navigate("CadastrarDespesa")}
          />
          <View style={s.between}>
            <Text style={s.section}>Contas a acertar</Text>
            <Text style={s.small}>Por vencimento</Text>
          </View>
          {d.proximas.length ? (
            d.proximas.map((item) => (
              <DespesaCard
                key={item.id}
                item={item}
                onPress={() =>
                  navigation.navigate("DetalheDespesa", { id: item.id })
                }
              />
            ))
          ) : (
            <Empty
              title="Tudo em dia"
              text="Nenhuma parcela pendente neste mês."
            />
          )}
          <View
            style={[
              s.card,
              { backgroundColor: colors.soft, borderColor: colors.soft },
            ]}
          >
            <Text style={[s.text, { fontWeight: "700" }]}>
              Dividir fica mais fácil.
            </Text>
            <Text style={s.subtitle}>
              Escolha quem participa de cada despesa e acompanhe os acertos
              individualmente.
            </Text>
          </View>
        </>
      ) : null}
    </Page>
  );
}
