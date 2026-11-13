import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useResource from "../../hooks/useResource";
import { Heading, Icon, Page } from "../../components/ui";
import { colors, s } from "../../theme";
import { useApp } from "../../contexts/AppContext";
export default function Casa({ navigation }) {
  const r = useResource("/republica");
  const { session, logout } = useApp();
  return (
    <Page resource={r}>
      <Heading
        title="Nosso lugar"
        subtitle="Acordos claros fazem a convivência funcionar."
      />
      {r.data ? (
        <View
          style={[
            s.card,
            {
              padding: 26,
              backgroundColor: colors.ink,
              borderColor: colors.ink,
            },
          ]}
        >
          <Ionicons name="home-outline" color="#AFC3FF" size={36} />
          <Text style={{ fontSize: 27, fontWeight: "800", color: "#fff" }}>
            {r.data.nome}
          </Text>
          <Text style={{ fontSize: 14, color: "#C3D0EF", lineHeight: 22 }}>
            {r.data.endereco
              ? `${r.data.endereco}${r.data.numero ? `, ${r.data.numero}` : ""}`
              : "Seu ponto de encontro. Seu lar compartilhado."}
          </Text>
        </View>
      ) : null}
      {[
        {
          title: "Regras da casa",
          text: "Combinados e aceite dos moradores",
          icon: "document-text-outline",
          route: "RegrasCasa",
        },
        {
          title: "Configurações",
          text: "Nome, endereço e preferências",
          icon: "settings-outline",
          route: "ConfigRepublica",
        },
        ...(session.usuario.papel === "administrador"
          ? [
              {
                title: "Acessos e convites",
                text: "Contas, convites e alterações recentes",
                icon: "key-outline",
                route: "Acessos",
              },
            ]
          : []),
      ].map((item) => (
        <Pressable
          key={item.route}
          accessibilityRole="button"
          accessibilityLabel={item.title}
          style={[s.card, s.row]}
          onPress={() => navigation.navigate(item.route)}
        >
          <Icon name={item.icon} />
          <View style={{ flex: 1 }}>
            <Text style={[s.text, { fontWeight: "700" }]}>{item.title}</Text>
            <Text style={s.small}>{item.text}</Text>
          </View>
          <Ionicons name="chevron-forward" color={colors.muted} size={20} />
        </Pressable>
      ))}
      <View style={s.card}>
        <Text style={s.section}>{session.usuario.nome}</Text>
        <Text style={s.subtitle}>
          {session.usuario.email} · {session.usuario.papel}
        </Text>
        <Text style={s.small}>
          Pagamentos e aceites só podem ser registrados para sua própria conta.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
          onPress={logout}
          style={[s.chip, { alignItems: "center" }]}
        >
          <Text style={s.chipText}>Sair da conta</Text>
        </Pressable>
      </View>
      <Text style={[s.small, { textAlign: "center", marginTop: 10 }]}>
        Rappublica · vida compartilhada, contas organizadas.
      </Text>
    </Page>
  );
}
