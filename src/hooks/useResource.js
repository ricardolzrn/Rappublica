import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useApp } from "../contexts/AppContext";
import { request } from "../services/api";
import { read, write } from "../storage";
export default function useResource(path) {
  const { apiUrl, session, expireSession } = useApp();
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: "",
    offline: false,
    cachedAt: null,
    notice: "",
  });
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const id = ++generation.current;
    const key = `cache/${apiUrl}/${session?.usuario.id}${path}`;
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const data = await request(apiUrl, path, { token: session?.token });
      if (id !== generation.current) return;
      const cachedAt = new Date().toISOString();
      let notice = "";
      try {
        await write(key, { data, cachedAt });
      } catch {
        notice =
          "Dados carregados, mas não foi possível salvar a cópia offline.";
      }
      if (id === generation.current)
        setState({
          data,
          loading: false,
          error: "",
          offline: false,
          cachedAt,
          notice,
        });
    } catch (error) {
      if (error.status === 401) await expireSession();
      let cache = null;
      if (error.offline)
        try {
          cache = await read(key);
        } catch {}
      if (id === generation.current)
        setState({
          data: cache?.data ?? null,
          loading: false,
          error: error.message,
          offline: !!cache,
          cachedAt: cache?.cachedAt,
          notice: "",
        });
    }
  }, [apiUrl, path, session?.token, session?.usuario.id]);
  useFocusEffect(
    useCallback(() => {
      setState({ data: null, loading: true, error: "", offline: false });
      reload();
      return () => {
        generation.current++;
      };
    }, [reload]),
  );
  return { ...state, reload };
}
