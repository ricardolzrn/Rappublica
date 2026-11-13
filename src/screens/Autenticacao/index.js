import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import {
  Button,
  Chip,
  Field,
  Heading,
  Page,
  useAction,
} from "../../components/ui";
import { useApp } from "../../contexts/AppContext";
import { normalizeUrl, request } from "../../services/api";
import { colors, s } from "../../theme";

export default function Autenticacao() {
  const { apiUrl, preferences, login, createFirstAccount, acceptInvite } =
    useApp();
  const [mode, setMode] = useState("login");
  const [setup, setSetup] = useState(null);
  const [setupError, setSetupError] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [quarto, setQuarto] = useState("Duplo");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [token, setToken] = useState("");
  const [convite, setConvite] = useState(null);
  const [showConnection, setShowConnection] = useState(false);
  const [url, setUrl] = useState(apiUrl);
  const [connectionMessage, setConnectionMessage] = useState("");
  const action = useAction();
  const connection = useAction();
  useEffect(() => {
    let active = true;
    setSetup(null);
    setSetupError("");
    request(apiUrl, "/auth/estado")
      .then((result) => {
        if (!active) return;
        setSetup(result);
        setMode((current) =>
          result.primeiroAcessoDisponivel
            ? "cadastro"
            : current === "cadastro"
              ? "login"
              : current,
        );
      })
      .catch((error) => {
        if (active) setSetupError(error.message);
      });
    return () => {
      active = false;
    };
  }, [apiUrl]);
  const selectMode = (value) => {
    setMode(value);
    action.setError("");
  };
  const create = () =>
    action.run(async () => {
      if (senha !== confirmacao) throw new Error("As senhas não coincidem.");
      await createFirstAccount({ nome, email, quarto, senha });
    });
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
        {setup === null && !setupError ? (
          <ActivityIndicator color={colors.primary} />
        ) : null}
        {setupError ? (
          <Text accessibilityRole="alert" style={s.error}>
            {setupError}
          </Text>
        ) : null}
        <View style={s.chips}>
          <Chip
            label="Entrar"
            active={mode === "login"}
            onPress={() => selectMode("login")}
          />
          <Chip
            label="Criar conta com convite"
            active={mode === "convite"}
            onPress={() => selectMode("convite")}
          />
          {setup?.primeiroAcessoDisponivel ? (
            <Chip
              label="Primeira conta"
              active={mode === "cadastro"}
              onPress={() => selectMode("cadastro")}
            />
          ) : null}
        </View>
        {mode === "cadastro" && setup?.primeiroAcessoDisponivel ? (
          <>
            <Text style={s.section}>Crie a primeira conta</Text>
            <Text style={s.subtitle}>
              Esta será a conta de administrador. Se o e-mail já pertence a um
              morador cadastrado, a conta será ligada ao histórico dele.
            </Text>
            <Field
              label="Nome completo"
              value={nome}
              onChangeText={setNome}
              maxLength={80}
            />
            <Field
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              maxLength={150}
            />
            <Text style={s.label}>Quarto</Text>
            <View style={s.chips}>
              {setup.quartos.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  active={quarto === item}
                  onPress={() => setQuarto(item)}
                />
              ))}
            </View>
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
              title="Criar conta de administrador"
              loading={action.busy}
              onPress={create}
            />
          </>
        ) : mode === "login" ? (
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
        ) : mode === "convite" ? (
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
        ) : null}
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
