import React, { useState } from "react";
import { Text, View, Switch } from "react-native";
import useResource from "../../hooks/useResource";
import { useApp } from "../../contexts/AppContext";
import {
  Button,
  Heading,
  Field,
  Page,
  Empty,
  Badge,
  Confirm,
  useAction,
} from "../../components/ui";
import { colors, s } from "../../theme";
export default function RegrasCasa() {
  const r = useResource("/regras"),
    { mutate, session } = useApp(),
    a = useAction();
  const [form, setForm] = useState({ titulo: "", texto: "" }),
    [editing, setEditing] = useState(null),
    [selected, setSelected] = useState(null);
  const save = () =>
    a.run(async () => {
      if (!form.titulo.trim() || !form.texto.trim())
        throw new Error("Preencha o título e a descrição da regra.");
      await mutate(
        `/regras${editing ? `/${editing}` : ""}`,
        editing ? "PUT" : "POST",
        form,
      );
      setForm({ titulo: "", texto: "" });
      setEditing(null);
      await r.reload();
    });
  const remove = () =>
    a.run(async () => {
      await mutate(`/regras/${selected}`, "DELETE");
      if (editing === selected) {
        setEditing(null);
        setForm({ titulo: "", texto: "" });
      }
      setSelected(null);
      await r.reload();
    });
  const accept = (regra, id, value) =>
    a.run(async () => {
      await mutate(`/regras/${regra}/aceites/${id}`, "PATCH", {
        aceitou: value,
      });
      await r.reload();
    });
  return (
    <Page resource={r}>
      <Heading
        title="Combinado é combinado."
        subtitle="Registre as regras e acompanhe o aceite de cada morador."
      />
      {r.data ? (
        <>
          {session.usuario.papel === "administrador" ? (
            <View style={s.card}>
              <Text style={s.section}>
                {editing ? "Editar combinado" : "Novo combinado"}
              </Text>
              <Field
                label="Título da regra"
                placeholder="Ex.: Limpeza da cozinha"
                maxLength={100}
                value={form.titulo}
                onChangeText={(v) => setForm((f) => ({ ...f, titulo: v }))}
              />
              <Field
                label="Descrição da regra"
                placeholder="O que todos precisam saber?"
                multiline
                maxLength={1000}
                value={form.texto}
                onChangeText={(v) => setForm((f) => ({ ...f, texto: v }))}
              />
              {editing ? (
                <Text style={s.small}>
                  Ao salvar a edição, os aceites serão limpos para que todos
                  confirmem a nova versão.
                </Text>
              ) : null}
              <Button
                title={editing ? "Salvar regra" : "Adicionar regra"}
                icon="checkmark"
                loading={a.busy}
                disabled={r.offline}
                onPress={save}
              />
              {editing ? (
                <Button
                  title="Cancelar edição"
                  secondary
                  onPress={() => {
                    setEditing(null);
                    setForm({ titulo: "", texto: "" });
                  }}
                />
              ) : null}
            </View>
          ) : null}
          {a.error && !selected ? (
            <Text accessibilityRole="alert" style={s.error}>
              {a.error}
            </Text>
          ) : null}
          <Text style={s.section}>
            Regras em vigor ({r.data.regras.length})
          </Text>
          {!r.data.regras.length ? (
            <Empty
              title="Vamos combinar?"
              text="Adicione a primeira regra de convivência."
            />
          ) : null}
          {r.data.regras.map((regra) => (
            <View key={regra.id} style={s.card}>
              <Text style={s.section}>{regra.titulo}</Text>
              <Text style={s.text}>{regra.texto}</Text>
              <Badge
                label={`${regra.aceites.length} de ${r.data.moradores.length} aceites`}
                good={
                  r.data.moradores.length > 0 &&
                  regra.aceites.length === r.data.moradores.length
                }
              />
              {session.usuario.papel === "administrador" ? (
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Editar"
                      accessibilityLabel={`Editar regra: ${regra.titulo}`}
                      secondary
                      disabled={r.offline || a.busy}
                      onPress={() => {
                        setEditing(regra.id);
                        setForm({ titulo: regra.titulo, texto: regra.texto });
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Excluir"
                      accessibilityLabel={`Excluir regra: ${regra.titulo}`}
                      secondary
                      disabled={r.offline || a.busy}
                      onPress={() => {
                        a.setError("");
                        setSelected(regra.id);
                      }}
                    />
                  </View>
                </View>
              ) : null}
              <View style={s.separator} />
              {r.data.moradores.map((m) => (
                <View key={m.id} style={s.between}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.text}>
                      {m.nome} ·{" "}
                      {regra.aceites.includes(m.id) ? "Aceitou" : "Pendente"}
                    </Text>
                    {regra.detalhesAceites?.find(
                      (item) => item.moradorId === m.id,
                    )?.aceitoEm ? (
                      <Text style={s.small}>
                        Em{" "}
                        {new Date(
                          regra.detalhesAceites.find(
                            (item) => item.moradorId === m.id,
                          ).aceitoEm,
                        ).toLocaleString("pt-BR")}
                      </Text>
                    ) : null}
                  </View>
                  {m.id === session.usuario.moradorId ? (
                    <Switch
                      accessibilityLabel={`Aceite de ${m.nome} para ${regra.titulo}`}
                      value={regra.aceites.includes(m.id)}
                      disabled={r.offline || a.busy}
                      onValueChange={(v) => accept(regra.id, m.id, v)}
                      trackColor={{ true: colors.green, false: colors.line }}
                    />
                  ) : null}
                </View>
              ))}
            </View>
          ))}
          <Confirm
            error={a.error}
            visible={!!selected}
            title="Excluir regra?"
            text="O combinado e os aceites registrados serão removidos."
            onCancel={() => setSelected(null)}
            onConfirm={remove}
            busy={a.busy}
          />
        </>
      ) : null}
    </Page>
  );
}
