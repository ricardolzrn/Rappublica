import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import useResource from "../../hooks/useResource";
import { useApp } from "../../contexts/AppContext";
import {
  Button,
  Heading,
  Field,
  Chip,
  Page,
  useAction,
} from "../../components/ui";
import { s } from "../../theme";
export default function CadastrarMorador({ route, navigation }) {
  const id = route.params?.id;
  const r = useResource(`/formularios/morador${id ? `?id=${id}` : ""}`),
    { mutate } = useApp(),
    a = useAction();
  const [form, setForm] = useState({ nome: "", email: "", quarto: "" }),
    [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (r.data && !initialized) {
      setForm(
        r.data.morador || { nome: "", email: "", quarto: r.data.quartos[0] },
      );
      setInitialized(true);
    }
  }, [r.data, initialized]);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const save = () =>
    a.run(async () => {
      if (!form.nome.trim()) throw new Error("Informe o nome do morador.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
        throw new Error("Informe um e-mail válido.");
      await mutate(`/moradores${id ? `/${id}` : ""}`, id ? "PUT" : "POST", {
        nome: form.nome,
        email: form.email,
        quarto: form.quarto,
      });
      navigation.goBack();
    });
  return (
    <Page resource={r}>
      <Heading
        title={id ? "Dados do morador" : "Mais alguém para dividir."}
        subtitle="Mantenha os contatos e a organização dos quartos atualizados."
      />
      {r.data && initialized ? (
        <>
          <Field
            label="Nome completo"
            placeholder="Como o morador se chama?"
            maxLength={80}
            value={form.nome}
            onChangeText={(v) => set("nome", v)}
          />
          <Field
            label="E-mail"
            placeholder="nome@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={150}
            value={form.email}
            onChangeText={(v) => set("email", v)}
          />
          <View>
            <Text style={s.label}>Quarto</Text>
            <View style={s.chips}>
              {r.data.quartos.map((q) => (
                <Chip
                  key={q}
                  label={q}
                  active={form.quarto === q}
                  onPress={() => set("quarto", q)}
                />
              ))}
            </View>
            <Text style={[s.small, { marginTop: 8 }]}>
              Os quartos podem ser compartilhados por mais de um morador.
            </Text>
          </View>
          {a.error ? (
            <Text accessibilityRole="alert" style={s.error}>
              {a.error}
            </Text>
          ) : null}
          <Button
            title="Salvar morador"
            icon="checkmark"
            loading={a.busy}
            disabled={r.offline}
            onPress={save}
          />
        </>
      ) : null}
    </Page>
  );
}
