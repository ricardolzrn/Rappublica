import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Icon } from "./index";
import { colors, s } from "../../theme";
import { moeda, dataBR, statusDespesa } from "../../utils/format";
export default function DespesaCard({ item, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver despesa ${item.descricao}`}
      onPress={onPress}
      style={[s.card, { marginBottom: 12 }]}
    >
      <View style={s.row}>
        <Icon
          name={
            item.categoria === "Moradia"
              ? "home-outline"
              : item.categoria === "Mercado"
                ? "basket-outline"
                : "receipt-outline"
          }
        />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[s.text, { fontWeight: "700" }]}>{item.descricao}</Text>
          <Text style={s.small}>
            {item.categoria} · {dataBR(item.vencimento)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </View>
      <View style={s.between}>
        <Text style={[s.section, { fontSize: 21 }]}>
          {moeda(item.valorCentavos)}
        </Text>
        <Badge label={statusDespesa(item)} good={item.paga} />
      </View>
      <Text style={s.small}>
        {item.parcelas.filter((p) => p.paga).length} de {item.parcelas.length}{" "}
        parcelas pagas
      </Text>
    </Pressable>
  );
}
