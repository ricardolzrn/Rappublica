import React, { useEffect, useState } from "react";
import { Text, View, Switch } from "react-native";
import useResource from "../../hooks/useResource";
import { useApp } from "../../contexts/AppContext";
import {
  Button,
  Heading,
  Field,
  Chip,
  Page,
  Empty,
  useAction,
} from "../../components/ui";
import { colors, s } from "../../theme";
import { centavos, moeda, hoje, dataBR } from "../../utils/format";
export default function CadastrarDespesa({ route, navigation }) {
  const id = route.params?.id;
  const r = useResource(`/formularios/despesa${id ? `?id=${id}` : ""}`);
  const { mutate, preferences } = useApp();
  const a = useAction();
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    categoria: "Moradia",
    tipo: "Variável",
    vencimento: dataBR(hoje()),
    participantes: [],
  });
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (r.data && !initialized) {
      const d = r.data.despesa;
      setForm(
        d
          ? {
              ...d,
              valor: (d.valorCentavos / 100).toFixed(2).replace(".", ","),
              vencimento: dataBR(d.vencimento),
              participantes: d.parcelas.map((p) => p.moradorId),
            }
          : (f) => ({ ...f, participantes: r.data.moradores.map((m) => m.id) }),
      );
      setInitialized(true);
    }
  }, [r.data, initialized]);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const total = centavos(form.valor);
  const save = () =>
    a.run(async () => {
      if (!form.descricao.trim())
        throw new Error("Informe a descrição da despesa.");
      if (total === null)
        throw new Error("Informe um valor positivo em reais. Exemplo: 150,50.");
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(form.vencimento))
        throw new Error("Informe o vencimento no formato DD/MM/AAAA.");
      if (!form.participantes.length)
        throw new Error("Selecione pelo menos um morador.");
      const vencimento = form.vencimento.split("/").reverse().join("-");
      const d = await mutate(
        `/despesas${id ? `/${id}` : ""}`,
        id ? "PUT" : "POST",
        {
          descricao: form.descricao,
          valorCentavos: total,
          categoria: form.categoria,
          tipo: form.tipo,
          vencimento,
          participantes: form.participantes,
        },
      );
      // A despesa já foi salva mesmo se o dispositivo não conseguir guardar o filtro.
      try {
        await preferences({ mes: vencimento.slice(0, 7) });
      } catch {}
      if (id) navigation.goBack();
      else navigation.replace("DetalheDespesa", { id: d.id });
    });
  return (
    <Page resource={r}>
      <Heading
        title={id ? "Ajustar despesa" : "Uma conta, bem dividida."}
        subtitle="Escolha os participantes. A API calcula cada parcela em centavos."
      />
      {r.data && initialized ? (
        <>
          <Field
            label="Descrição"
            placeholder="Ex.: Compra do mês"
            maxLength={150}
            value={form.descricao}
            onChangeText={(v) => set("descricao", v)}
          />
          <Field
            label="Valor total (R$)"
            placeholder="0,00"
            keyboardType="decimal-pad"
            value={form.valor}
            onChangeText={(v) => set("valor", v)}
          />
          <Field
            label="Vencimento (DD/MM/AAAA)"
            placeholder="20/11/2026"
            maxLength={10}
            value={form.vencimento}
            onChangeText={(v) => set("vencimento", v)}
          />
          <View>
            <Text style={s.label}>Categoria</Text>
            <View style={s.chips}>
              {r.data.categorias.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  active={form.categoria === c}
                  onPress={() => set("categoria", c)}
                />
              ))}
            </View>
          </View>
          <View>
            <Text style={s.label}>Tipo de despesa</Text>
            <View style={s.chips}>
              {["Fixa", "Variável"].map((c) => (
                <Chip
                  key={c}
                  label={c}
                  active={form.tipo === c}
                  onPress={() => set("tipo", c)}
                />
              ))}
            </View>
            <Text style={[s.small, { marginTop: 8 }]}>
              Fixa é uma classificação; novos meses devem ser lançados
              manualmente.
            </Text>
          </View>
          <Text style={s.section}>Quem participa?</Text>
          {r.data.moradores.length ? (
            r.data.moradores.map((m) => (
              <View key={m.id} style={[s.card, s.between]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.text}>{m.nome}</Text>
                  <Text style={s.small}>{m.quarto}</Text>
                </View>
                <Switch
                  accessibilityLabel={`Incluir ${m.nome}`}
                  value={form.participantes.includes(m.id)}
                  onValueChange={(v) =>
                    set(
                      "participantes",
                      v
                        ? [...form.participantes, m.id]
                        : form.participantes.filter((i) => i !== m.id),
                    )
                  }
                  trackColor={{ true: colors.primary, false: colors.line }}
                />
              </View>
            ))
          ) : (
            <Empty
              title="Cadastre um morador primeiro"
              text="A despesa precisa de pelo menos um participante."
            />
          )}
          {total && form.participantes.length ? (
            <View style={[s.card, { backgroundColor: colors.soft }]}>
              <Text style={s.section}>
                {moeda(Math.floor(total / form.participantes.length))} por
                pessoa
              </Text>
              <Text style={s.subtitle}>
                {form.participantes.length} participantes
                {total % form.participantes.length
                  ? " · Algumas parcelas terão R$ 0,01 a mais para fechar o total."
                  : "."}
              </Text>
            </View>
          ) : null}
          {id ? (
            <Text style={s.small}>
              Para alterar o valor ou os participantes de uma conta com
              pagamentos, primeiro desmarque os pagamentos nos detalhes.
            </Text>
          ) : null}
          {a.error ? (
            <Text accessibilityRole="alert" style={s.error}>
              {a.error}
            </Text>
          ) : null}
          <Button
            title="Salvar despesa"
            icon="checkmark"
            loading={a.busy}
            disabled={r.offline || !r.data.moradores.length}
            onPress={save}
          />
        </>
      ) : null}
    </Page>
  );
}
