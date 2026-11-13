import React, { useState } from "react";
import { Text, View } from "react-native";
import { Button, Field, Heading, Page, useAction } from "../../components/ui";
import { useApp } from "../../contexts/AppContext";
import { normalizeUrl, request } from "../../services/api";
import { s } from "../../theme";

export default function Autenticacao() {
  const { apiUrl, preferences, login, acceptInvite } = useApp();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [token, setToken] = useState("");
  const [convite, setConvite] = useState(null);
  const [showConnection, setShowConnection] = useState(false);
  const [url, setUrl] = useState(apiUrl);
  const [connectionMessage, setConnectionMessage] = useState("");
  const action = useAction();
  const connection = useAction();
  const activate = () =>
    action.run(async () => {
      if (senha !== confirmacao) throw new Error("As senhas não coincidem.");
      await acceptInvite(token.trim(), senha);
    });
  const inspect = () =>
    action.run(async () => {
      const value = token.trim();
      const result = await request(
        apiUrl,
        `/auth/convites/${encodeURIComponent(value)}`,
      );
      setConvite(result);
    });
  const connect = () =>
    connection.run(async () => {
      setConnectionMessage("");
      const next = normalizeUrl(url);
      const health = await request(next, "/health");
      if (health?.status !== "ok")
        throw new Error("O endereço não corresponde à API Rappublica.");
      await preferences({ apiUrl: next });
      setConnectionMessage("Conexão salva neste dispositivo.");
    });
  return (
    <Page>
      <Heading
        title="Rappublica"
        subtitle="Sua casa, suas contas e seus combinados."
      />
      <View style={s.card}>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Button
              title="Entrar"
              secondary={mode !== "login"}
              onPress={() => {
                setMode("login");
                action.setError("");
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Ativar convite"
              secondary={mode !== "convite"}
              onPress={() => {
                setMode("convite");
                action.setError("");
              }}
            />
          </View>
        </View>
        {mode === "login" ? (
          <>
            <Text style={s.section}>Entre na sua conta</Text>
            <Field
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field
              label="Senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />
            <Button
              title="Acessar república"
              loading={action.busy}
              onPress={() => action.run(() => login(email, senha))}
            />
          </>
        ) : (
          <>
            <Text style={s.section}>Ative sua conta</Text>
            <Text style={s.subtitle}>
              Peça um convite individual ao administrador. O código só pode ser
              usado uma vez.
            </Text>
            <Field
              label="Código do convite"
              value={token}
              onChangeText={(value) => {
                setToken(value);
                setConvite(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {convite ? (
              <>
                <Text style={s.text}>
                  {convite.nome} · {convite.email}
                </Text>
                <Text style={s.small}>
                  Perfil:{" "}
                  {convite.papel === "administrador"
                    ? "administrador"
                    : "morador"}{" "}
                  · Expira em{" "}
                  {new Date(convite.expiraEm).toLocaleString("pt-BR")}
                </Text>
                <Field
                  label="Crie uma senha"
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry
                />
                <Field
                  label="Confirme a senha"
                  value={confirmacao}
                  onChangeText={setConfirmacao}
                  secureTextEntry
                />
                <Text style={s.small}>Use de 12 a 128 caracteres.</Text>
                <Button
                  title="Ativar conta"
                  loading={action.busy}
                  onPress={activate}
                />
              </>
            ) : (
              <Button
                title="Verificar convite"
                loading={action.busy}
                onPress={inspect}
              />
            )}
          </>
        )}
        {action.error ? (
          <Text accessibilityRole="alert" style={s.error}>
            {action.error}
          </Text>
        ) : null}
      </View>
      <View style={s.card}>
        <Button
          title={showConnection ? "Ocultar conexão" : "Configurar conexão"}
          secondary
          onPress={() => setShowConnection((v) => !v)}
        />
        {showConnection ? (
          <>
            <Field
              label="Endereço do serviço"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Button
              title="Verificar e salvar conexão"
              secondary
              loading={connection.busy}
              onPress={connect}
            />
            {connection.error ? (
              <Text accessibilityRole="alert" style={s.error}>
                {connection.error}
              </Text>
            ) : null}
            {connectionMessage ? (
              <Text style={s.text}>{connectionMessage}</Text>
            ) : null}
          </>
        ) : null}
      </View>
    </Page>
  );
}
