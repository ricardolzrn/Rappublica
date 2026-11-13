import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import Inicio from "../screens/Inicio";
import ExtratoDespesas from "../screens/ExtratoDespesas";
import ListaMoradores from "../screens/ListaMoradores";
import Casa from "../screens/Casa";
import CadastrarDespesa from "../screens/CadastrarDespesa";
import DetalheDespesa from "../screens/DetalheDespesa";
import CadastrarMorador from "../screens/CadastrarMorador";
import RegrasCasa from "../screens/RegrasCasa";
import ConfigRepublica from "../screens/ConfigRepublica";
import Autenticacao from "../screens/Autenticacao";
import Acessos from "../screens/Acessos";
import { useApp } from "../contexts/AppContext";
const Tab = createBottomTabNavigator(),
  Stack = createNativeStackNavigator();
const icons = {
  Inicio: "grid-outline",
  Despesas: "wallet-outline",
  Moradores: "people-outline",
  Casa: "home-outline",
};
function Tabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitle: "rappublica",
        tabBarAccessibilityLabel:
          route.name === "Inicio" ? "Início" : route.name,
        headerTitleStyle: {
          fontWeight: "800",
          fontSize: 21,
          color: colors.primary,
        },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          borderTopColor: colors.line,
          height: 64 + Math.max(insets.bottom, 12),
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 12),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={icons[route.name]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={Inicio}
        options={{ title: "Início" }}
      />
      <Tab.Screen name="Despesas" component={ExtratoDespesas} />
      <Tab.Screen name="Moradores" component={ListaMoradores} />
      <Tab.Screen name="Casa" component={Casa} />
    </Tab.Navigator>
  );
}
export default function Navigation() {
  const { session } = useApp();
  if (!session) return <Autenticacao />;
  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: colors.primary,
          background: colors.bg,
          card: colors.card,
          text: colors.ink,
          border: colors.line,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerTintColor: colors.primary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
          headerBackTitle: "Voltar",
        }}
      >
        <Stack.Screen
          name="Principal"
          component={Tabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CadastrarDespesa"
          component={CadastrarDespesa}
          options={({ route }) => ({
            title: route.params?.id ? "Editar despesa" : "Nova despesa",
          })}
        />
        <Stack.Screen
          name="DetalheDespesa"
          component={DetalheDespesa}
          options={{ title: "Detalhes da despesa" }}
        />
        <Stack.Screen
          name="CadastrarMorador"
          component={CadastrarMorador}
          options={({ route }) => ({
            title: route.params?.id ? "Editar morador" : "Novo morador",
          })}
        />
        <Stack.Screen
          name="RegrasCasa"
          component={RegrasCasa}
          options={{ title: "Regras da casa" }}
        />
        <Stack.Screen
          name="ConfigRepublica"
          component={ConfigRepublica}
          options={{ title: "Configurações" }}
        />
        {session.usuario.papel === "administrador" ? (
          <Stack.Screen
            name="Acessos"
            component={Acessos}
            options={{ title: "Acessos e convites" }}
          />
        ) : null}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
