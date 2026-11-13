import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import useResource from "../../hooks/useResource";
import { useApp } from "../../contexts/AppContext";
import { request, normalizeUrl } from "../../services/api";
import { consultarCep } from "../../services/cep";
import { Button, Heading, Field, Page, useAction } from "../../components/ui";
import { s } from "../../theme";
export default function ConfigRepublica() {
  const r = useResource("/republica"),
    { apiUrl, preferences, mutate, session } = useApp();
  const a = useAction(),
    connection = useAction(),
    cepAction = useAction();
  const [form, setForm] = useState({
      nome: "",
      cep: "",
      endereco: "",
      numero: "",
    }),
    [url, setUrl] = useState(apiUrl),
    [message, setMessage] = useState(""),
    [connectionMessage, setConnectionMessage] = useState("");
  useEffect(() => {
    if (r.data) setForm(r.data);
  }, [r.data]);
  const set = (key, value) => {
    setMessage("");
    setForm((f) => ({ ...f, [key]: value }));
  };
  const save = () =>
    a.run(async () => {
      setMessage("");
      await mutate("/republica", "PUT", {
        nome: form.nome,
        cep: form.cep.replace(/\D/g, ""),
        endereco: form.endereco,
        numero: form.numero,
      });
      setMessage("Dados da república salvos.");
      await r.reload();
    });
  const lookup = () =>
    cepAction.run(async () => {
      const address = await consultarCep(form.cep);
      setForm((f) => ({ ...f, ...address }));
    });
  const connect = () =>
    connection.run(async () => {
      setConnectionMessage("");
      const next = normalizeUrl(url);
      const health = await request(next, "/health");
      if (health?.status !== "ok")
        throw new Error("O endereço não corresponde à API Rappublica.");
      await preferences({ apiUrl: next });
      setConnectionMessage(
        "Conexão verificada e endereço salvo neste dispositivo.",
      );
    });
  return (
    <Page resource={r}>
      <Heading
        title="Do seu jeito."
        subtitle="Os dados da casa ficam na API. As preferências ficam neste dispositivo."
      />
      {r.data && session.usuario.papel === "administrador" ? (
        <View style={s.card}>
          <Text style={s.section}>Dados da república</Text>
          <Field
            label="Nome da república"
            value={form.nome}
            onChangeText={(v) => set("nome", v)}
            maxLength={150}
          />
          <Field
            label="CEP"
            value={form.cep}
            placeholder="00000-000"
            keyboardType="numeric"
            maxLength={9}
            onChangeText={(v) => set("cep", v)}
          />
          <Button
            title="Consultar CEP"
            secondary
            icon="search-outline"
            loading={cepAction.busy}
            disabled={r.offline}
            onPress={lookup}
          />
          {cepAction.error ? (
            <Text accessibilityRole="alert" style={s.error}>
              {cepAction.error}
            </Text>
          ) : null}
          <Field
            label="Endereço"
            placeholder="Rua, bairro, cidade e estado"
            value={form.endereco}
            maxLength={250}
            onChangeText={(v) => set("endereco", v)}
          />
          <Field
            label="Número / complemento"
            value={form.numero}
            maxLength={20}
            onChangeText={(v) => set("numero", v)}
          />
          {a.error ? (
            <Text accessibilityRole="alert" style={s.error}>
              {a.error}
            </Text>
          ) : null}
          {message ? (
            <Text accessibilityRole="alert" style={s.text}>
              {message}
            </Text>
          ) : null}
          <Button
            title="Salvar configurações"
            loading={a.busy || cepAction.busy}
            disabled={r.offline}
            onPress={save}
          />
        </View>
      ) : null}
      <View style={s.card}>
        <Text style={s.section}>Conexão com a república</Text>
        <Text style={s.subtitle}>
          Use o endereço fornecido para sua república. No celular, ele precisa
          estar acessível pela rede do aparelho.
        </Text>
        <Field
          label="Endereço do serviço"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        {connection.error ? (
          <Text accessibilityRole="alert" style={s.error}>
            {connection.error}
          </Text>
        ) : null}
        {connectionMessage ? (
          <Text accessibilityRole="alert" style={s.text}>
            {connectionMessage}
          </Text>
        ) : null}
        <Button
          title="Verificar e salvar conexão"
          secondary
          loading={connection.busy}
          onPress={connect}
        />
      </View>
      <View style={s.card}>
        <Text style={s.section}>Preferências e modo offline</Text>
        <Text style={s.subtitle}>
          O mês selecionado e o endereço do serviço são salvos com AsyncStorage.
          As telas visitadas ficam disponíveis para consulta sem internet, com
          indicação da última atualização.
        </Text>
        <Text style={s.small}>
          Cadastros e pagamentos exigem conexão para manter os dados da casa
          consistentes.
        </Text>
      </View>
    </Page>
  );
}
