import React, { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { defaultUrl, normalizeUrl, request } from "../services/api";
import { read, write } from "../storage";
import { mesAtual } from "../utils/format";
import { colors } from "../theme";
const Context = createContext(null);
export function AppProvider({ children }) {
  const [ready, setReady] = useState(false),
    [apiUrl, setApiUrl] = useState(defaultUrl),
    [mes, setMes] = useState(mesAtual),
    [storageError, setStorageError] = useState("");
  useEffect(() => {
    read("preferencias")
      .then((p) => {
        if (p?.apiUrl) setApiUrl(normalizeUrl(p.apiUrl));
        if (/^\d{4}-(0[1-9]|1[0-2])$/.test(p?.mes)) setMes(p.mes);
      })
      .catch(() =>
        setStorageError("Não foi possível ler as preferências salvas."),
      )
      .finally(() => setReady(true));
  }, []);
  const preferences = async (changes) => {
    const next = { apiUrl, mes, ...changes };
    try {
      await write("preferencias", next);
      setStorageError("");
    } catch {
      throw new Error(
        "Não foi possível salvar as preferências neste dispositivo.",
      );
    }
    setApiUrl(next.apiUrl);
    setMes(next.mes);
  };
  if (!ready)
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  return (
    <Context.Provider
      value={{
        apiUrl,
        mes,
        preferences,
        mutate: (path, method, body) => request(apiUrl, path, { method, body }),
      }}
    >
      {storageError ? (
        <Text
          accessibilityRole="alert"
          style={{ padding: 12, color: colors.red }}
        >
          {storageError}
        </Text>
      ) : null}
      {children}
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
