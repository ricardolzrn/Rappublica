import React, { useState } from "react";
import { Text, View, Switch } from "react-native";
import useResource from "../../hooks/useResource";
import { useApp } from "../../contexts/AppContext";
import {
  Button,
  Heading,
  Page,
  Badge,
  Confirm,
  useAction,
} from "../../components/ui";
import { colors, s } from "../../theme";
import { moeda, dataBR, statusDespesa } from "../../utils/format";
export default function DetalheDespesa({ route, navigation }) {
  const { id } = route.params;
  const r = useResource(`/despesas/${id}`),
    { mutate } = useApp(),
    a = useAction();
  const [confirm, setConfirm] = useState(false);
  const d = r.data;
  const pagar = (p) =>
    a.run(async () => {
      await mutate(`/despesas/${id}/parcelas/${p.moradorId}`, "PATCH", {
        paga: !p.paga,
      });
      await r.reload();
    });
  const excluir = () =>
    a.run(async () => {
      await mutate(`/despesas/${id}`, "DELETE");
      setConfirm(false);
      navigation.goBack();
    });
  return (
    <Page resource={r} testID="detalhe-despesa">
      {d ? (
        <>
          <Heading
            title={d.descricao}
            subtitle={`${d.categoria} · ${d.tipo} · vence em ${dataBR(d.vencimento)}`}
          />
          <View style={s.card}>
            <Badge label={statusDespesa(d)} good={d.paga} />
            <Text style={[s.title, { fontSize: 38 }]}>
              {moeda(d.valorCentavos)}
            </Text>
            <Text style={s.subtitle}>
              Falta acertar: {moeda(d.pendenteCentavos)}
            </Text>
          </View>
          <Heading
            title="Divisão da conta"
            subtitle="Marque cada parcela quando o morador acertar sua parte."
          />
          {d.parcelas.map((p) => (
            <View key={p.moradorId} style={[s.card, s.between]}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[s.text, { fontWeight: "700" }]}>{p.nome}</Text>
                <Text style={s.section}>{moeda(p.valorCentavos)}</Text>
                <Badge label={p.paga ? "Pago" : "Pendente"} good={p.paga} />
              </View>
              <Switch
                accessibilityLabel={`Pagamento de ${p.nome}`}
                value={p.paga}
                disabled={a.busy || r.offline}
                onValueChange={() => pagar(p)}
                trackColor={{ true: colors.green, false: colors.line }}
              />
            </View>
          ))}
          {a.error && !confirm ? (
            <Text accessibilityRole="alert" style={s.error}>
              {a.error}
            </Text>
          ) : null}
          <Button
            title="Editar despesa"
            secondary
            icon="create-outline"
            disabled={r.offline || a.busy}
            onPress={() => navigation.navigate("CadastrarDespesa", { id })}
          />
          <Button
            title="Excluir despesa"
            danger
            icon="trash-outline"
            disabled={r.offline || a.busy}
            onPress={() => setConfirm(true)}
          />
          <Confirm
            error={a.error}
            visible={confirm}
            title="Excluir esta despesa?"
            text="A conta e todas as suas parcelas serão removidas. Essa ação não pode ser desfeita."
            onCancel={() => setConfirm(false)}
            busy={a.busy}
            onConfirm={excluir}
          />
        </>
      ) : null}
    </Page>
  );
}
