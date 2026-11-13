import React, { useState } from "react";
import { Platform, Share, Text, View } from "react-native";
import useResource from "../../hooks/useResource";
import { useApp } from "../../contexts/AppContext";
import {
  Button,
  Chip,
  Feedback,
  Heading,
  Page,
  useAction,
} from "../../components/ui";
import { s } from "../../theme";

const dateTime = (value) =>
  value ? new Date(value).toLocaleString("pt-BR") : "";
export default function Acessos() {
  const moradores = useResource("/moradores");
  const convites = useResource("/convites");
  const auditoria = useResource("/auditoria");
  const { mutate } = useApp();
  const action = useAction();
  const [moradorId, setMoradorId] = useState("");
  const [papel, setPapel] = useState("morador");
  const [validadeHoras, setValidadeHoras] = useState(72);
  const [novo, setNovo] = useState(null);
  const [copied, setCopied] = useState(false);
  const create = () =>
    action.run(async () => {
      if (!moradorId) throw new Error("Escolha um morador sem conta.");
      const result = await mutate("/convites", "POST", {
        moradorId,
        papel,
        validadeHoras,
      });
      setNovo(result);
      setCopied(false);
      await convites.reload();
      await auditoria.reload();
    });
  const revoke = (id) =>
    action.run(async () => {
      await mutate(`/convites/${id}`, "DELETE");
      await convites.reload();
      await auditoria.reload();
    });
  const share = () =>
    action.run(async () => {
      if (Platform.OS === "web") {
        if (!globalThis.navigator?.clipboard?.writeText)
          throw new Error("Selecione e copie o código acima.");
        try {
          await globalThis.navigator.clipboard.writeText(novo.token);
        } catch {
          throw new Error("Não foi possível copiar. Selecione o código acima.");
        }
        setCopied(true);
      } else {
        await Share.share({
          message: `Convite Rappublica para ${novo.nome}: ${novo.token}`,
        });
      }
    });
  const available = (moradores.data || []).filter((m) => !m.papel);
  return (
    <Page>
      <Heading
        title="Acessos e convites"
        subtitle="Cada convite ativa a conta de um morador já cadastrado."
      />
      <Feedback resource={moradores} />
      <Feedback resource={convites} />
      <Feedback resource={auditoria} />
      <View style={s.card}>
        <Text style={s.section}>Novo convite</Text>
        <Text style={s.subtitle}>
          Escolha a pessoa antes de gerar o código. Um novo convite revoga os
          anteriores que ainda não foram usados.
        </Text>
        {available.map((m) => (
          <Chip
            key={m.id}
            label={`${m.nome} · ${m.email}`}
            active={moradorId === m.id}
            onPress={() => setMoradorId(m.id)}
          />
        ))}
        {!available.length && moradores.data ? (
          <Text style={s.small}>Todos os moradores já possuem conta.</Text>
        ) : null}
        <Text style={s.label}>Perfil</Text>
        <View style={s.chips}>
          <Chip
            label="Morador"
            active={papel === "morador"}
            onPress={() => setPapel("morador")}
          />
          <Chip
            label="Administrador"
            active={papel === "administrador"}
            onPress={() => setPapel("administrador")}
          />
        </View>
        <Text style={s.label}>Validade</Text>
        <View style={s.chips}>
          {[24, 72, 168].map((hours) => (
            <Chip
              key={hours}
              label={`${hours / 24} ${hours === 24 ? "dia" : "dias"}`}
              active={validadeHoras === hours}
              onPress={() => setValidadeHoras(hours)}
            />
          ))}
        </View>
        <Button
          title="Gerar convite"
          loading={action.busy}
          disabled={!moradorId || moradores.offline || convites.offline}
          onPress={create}
        />
        {novo ? (
          <View style={s.card}>
            <Text style={s.section}>Código para {novo.nome}</Text>
            <Text style={s.subtitle}>
              Compartilhe apenas com esta pessoa. O código aparece somente agora
              e expira em {dateTime(novo.expiraEm)}.
            </Text>
            <Text selectable style={s.text}>
              {novo.token}
            </Text>
            <Button
              title={
                Platform.OS === "web" ? "Copiar código" : "Compartilhar código"
              }
              secondary
              onPress={share}
            />
            {copied ? <Text style={s.small}>Código copiado.</Text> : null}
          </View>
        ) : null}
        {action.error ? (
          <Text accessibilityRole="alert" style={s.error}>
            {action.error}
          </Text>
        ) : null}
      </View>
      <View style={s.card}>
        <Text style={s.section}>Contas</Text>
        {(moradores.data || []).map((m) => (
          <Text key={m.id} style={s.text}>
            {m.nome} · {m.papel || "sem conta"}
          </Text>
        ))}
      </View>
      <View style={s.card}>
        <Text style={s.section}>Convites emitidos</Text>
        {(convites.data || []).map((c) => {
          const status = c.usadoEm
            ? "Usado"
            : c.revogadoEm
              ? "Revogado"
              : new Date(c.expiraEm) <= new Date()
                ? "Expirado"
                : "Pendente";
          return (
            <View key={c.id} style={{ gap: 5 }}>
              <Text style={s.text}>
                {c.nome} · {c.papel}
              </Text>
              <Text style={s.small}>
                {status} · criado em {dateTime(c.criadoEm)} · expira em{" "}
                {dateTime(c.expiraEm)}
              </Text>
              {status === "Pendente" ? (
                <Button
                  title={`Revogar convite de ${c.nome}`}
                  secondary
                  loading={action.busy}
                  onPress={() => revoke(c.id)}
                />
              ) : null}
              <View style={s.separator} />
            </View>
          );
        })}
      </View>
      <View style={s.card}>
        <Text style={s.section}>Alterações recentes</Text>
        {(auditoria.data || []).map((event) => (
          <Text key={event.id} style={s.small}>
            {dateTime(event.criadoEm)} · {event.autorNome} ·{" "}
            {event.acao.replaceAll("_", " ")} {event.entidade}{" "}
            {event.entidadeId}
          </Text>
        ))}
      </View>
    </Page>
  );
}
