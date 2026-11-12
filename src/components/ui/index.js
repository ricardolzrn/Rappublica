import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, s } from "../../theme";
import { useApp } from "../../contexts/AppContext";
import { mesNome } from "../../utils/format";
export function Button({
  title,
  accessibilityLabel,
  onPress,
  icon,
  secondary = false,
  danger = false,
  disabled = false,
  loading = false,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        borderRadius: 13,
        paddingHorizontal: 18,
        paddingVertical: 13,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        backgroundColor: danger
          ? colors.red
          : secondary
            ? colors.soft
            : colors.primary,
        opacity: disabled || loading ? 0.45 : pressed ? 0.8 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.primary : "#fff"} />
      ) : icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={secondary ? colors.primary : "#fff"}
        />
      ) : null}
      <Text
        style={{
          fontWeight: "700",
          fontSize: 14,
          color: secondary ? colors.primary : "#fff",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({ label, error, ...props }) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[
          s.field,
          props.multiline && { minHeight: 100, textAlignVertical: "top" },
        ]}
        {...props}
      />
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}
export function Heading({ title, subtitle }) {
  return (
    <View style={{ gap: 5 }}>
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}
export function Icon({ name, color = colors.primary }) {
  return (
    <View style={s.icon}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}
export function Chip({ label, active, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={[s.chip, active && s.chipActive]}
    >
      <Text style={[s.chipText, active && { color: "#fff" }]}>{label}</Text>
    </Pressable>
  );
}
export function Badge({ label, good = false }) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: good ? colors.greenSoft : colors.amberSoft,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: good ? colors.green : colors.amber,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
export function Empty({
  title = "Nada por aqui ainda",
  text = "Os registros aparecerão aqui.",
}) {
  return (
    <View style={[s.card, { alignItems: "center", paddingVertical: 30 }]}>
      <Icon name="file-tray-outline" />
      <Text style={s.section}>{title}</Text>
      <Text style={[s.subtitle, { textAlign: "center" }]}>{text}</Text>
    </View>
  );
}
export function Feedback({ resource }) {
  if (resource.loading && !resource.data)
    return (
      <View style={{ padding: 30 }}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[s.subtitle, { textAlign: "center", marginTop: 12 }]}>
          Carregando…
        </Text>
      </View>
    );
  if (resource.error || resource.notice)
    return (
      <View
        style={[
          s.card,
          {
            backgroundColor: resource.offline ? colors.amberSoft : colors.card,
          },
        ]}
      >
        <Text
          accessibilityRole="alert"
          style={resource.offline ? s.text : s.error}
        >
          {resource.offline
            ? `Sem conexão • exibindo cópia salva em ${new Date(resource.cachedAt).toLocaleString("pt-BR")}. Alterações exigem conexão.`
            : resource.error || resource.notice}
        </Text>
        <Button title="Tentar novamente" secondary onPress={resource.reload} />
      </View>
    );
  return null;
}
export function Page({ children, resource, testID }) {
  return (
    <KeyboardAvoidingView
      style={s.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={96}
    >
      <ScrollView
        testID={testID}
        style={s.page}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
        refreshControl={
          resource ? (
            <RefreshControl
              refreshing={!!resource.loading && !!resource.data}
              onRefresh={resource.reload}
              tintColor={colors.primary}
            />
          ) : undefined
        }
      >
        {resource ? <Feedback resource={resource} /> : null}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export function MonthPicker() {
  const { mes, preferences } = useApp();
  const [error, setError] = useState("");
  const change = async (offset) => {
    const date = new Date(`${mes}-15T12:00:00`);
    date.setMonth(date.getMonth() + offset);
    try {
      await preferences({
        mes: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      });
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <View>
      <View
        style={[
          s.between,
          {
            backgroundColor: colors.card,
            padding: 6,
            borderRadius: 13,
            borderWidth: 1,
            borderColor: colors.line,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          onPress={() => change(-1)}
          style={{ padding: 12 }}
        >
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
        </Pressable>
        <Text
          style={{
            color: colors.ink,
            fontWeight: "700",
            textTransform: "capitalize",
          }}
        >
          {mesNome(mes)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
          onPress={() => change(1)}
          style={{ padding: 12 }}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Pressable>
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}
export function Confirm({
  visible,
  title,
  text,
  onCancel,
  onConfirm,
  busy,
  error,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#172B4D99",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View
          style={[
            s.card,
            { maxWidth: 430, width: "100%", alignSelf: "center" },
          ]}
        >
          <Text style={s.section}>{title}</Text>
          <Text style={s.subtitle}>{text}</Text>
          {error ? (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          ) : null}
          <Button title="Excluir" danger loading={busy} onPress={onConfirm} />
          <Button
            title="Cancelar"
            secondary
            disabled={busy}
            onPress={onCancel}
          />
        </View>
      </View>
    </Modal>
  );
}
export function useAction() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = React.useRef(false);
  const run = async (fn) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return { busy, error, run, setError };
}
