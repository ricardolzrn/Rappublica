import React, { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { defaultUrl, normalizeUrl, request } from "../services/api";
import { read, write, remove } from "../storage";
import { mesAtual } from "../utils/format";
import { colors } from "../theme";
const Context = createContext(null);
export function AppProvider({ children }) {
  const [ready, setReady] = useState(false),
    [apiUrl, setApiUrl] = useState(defaultUrl),
    [mes, setMes] = useState(mesAtual),
    [session, setSession] = useState(null),
    [storageError, setStorageError] = useState("");
  useEffect(() => {
    Promise.all([read("preferencias"), read("sessao")])
      .then(async ([p, saved]) => {
        if (p?.apiUrl) setApiUrl(normalizeUrl(p.apiUrl));
        if (/^\d{4}-(0[1-9]|1[0-2])$/.test(p?.mes)) setMes(p.mes);
        if (saved?.token) {
          try {
            const result = await request(
              p?.apiUrl || defaultUrl(),
              "/auth/me",
              { token: saved.token },
            );
            setSession({ ...saved, usuario: result.usuario });
          } catch {
            await remove("sessao");
          }
        }
      })
      .catch(() =>
        setStorageError("Não foi possível ler as preferências salvas."),
      )
      .finally(() => setReady(true));
  }, []);
  const preferences = async (changes) => {
    const next = { apiUrl, mes, ...changes };
    try {
      if (next.apiUrl !== apiUrl) await remove("sessao");
      await write("preferencias", next);
      setStorageError("");
    } catch {
      throw new Error(
        "Não foi possível salvar as preferências neste dispositivo.",
      );
    }
    if (next.apiUrl !== apiUrl) {
      setSession(null);
    }
    setApiUrl(next.apiUrl);
    setMes(next.mes);
  };
  const enter = async (path, body) => {
    const result = await request(apiUrl, path, { method: "POST", body });
    const next = {
      token: result.token,
      expiraEm: result.expiraEm,
      usuario: result.usuario,
    };
    try {
      await write("sessao", next);
    } catch {
      await request(apiUrl, "/auth/logout", {
        method: "POST",
        token: result.token,
      }).catch(() => {});
      throw new Error("Não foi possível salvar a sessão neste dispositivo.");
    }
    setSession(next);
  };
  const logout = async () => {
    if (session?.token) {
      try {
        await request(apiUrl, "/auth/logout", {
          method: "POST",
          token: session.token,
        });
      } catch {}
    }
    await remove("sessao");
    setSession(null);
  };
  const expireSession = async () => {
    await remove("sessao").catch(() => {});
    setSession(null);
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
        session,
        login: (email, senha) => enter("/auth/login", { email, senha }),
        createFirstAccount: (form) => enter("/auth/primeiro-acesso", form),
        acceptInvite: (token, senha) =>
          enter("/auth/convites/aceitar", { token, senha }),
        logout,
        expireSession,
        preferences,
        mutate: async (path, method, body) => {
          try {
            return await request(apiUrl, path, {
              method,
              body,
              token: session?.token,
            });
          } catch (error) {
            if (error.status === 401) await expireSession();
            throw error;
          }
        },
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
