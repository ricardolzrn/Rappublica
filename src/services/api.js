import { Platform } from "react-native";
import Constants from "expo-constants";
export function defaultUrl() {
  if (process.env.EXPO_PUBLIC_API_URL)
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  const host =
    Platform.OS === "web"
      ? globalThis.location?.hostname
      : Constants.expoConfig?.hostUri?.split(":")[0];
  return `http://${host || (Platform.OS === "android" ? "10.0.2.2" : "localhost")}:3001/api`;
}
export function normalizeUrl(value) {
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Informe um endereço HTTP ou HTTPS válido para a API.");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error("Use uma URL HTTP ou HTTPS sem credenciais ou parâmetros.");
  return url.toString().replace(/\/$/, "");
}
export async function request(
  base,
  path,
  { method = "GET", body, token } = {},
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const error = new Error(
        payload.message || `Falha na API (${response.status}).`,
      );
      error.status = response.status;
      throw error;
    }
    return response.status === 204 ? null : await response.json();
  } catch (error) {
    if (error.status) throw error;
    const offline = new Error(
      "Não foi possível acessar a API. Confira a conexão e o endereço em Casa → Configurações.",
    );
    offline.offline = true;
    throw offline;
  } finally {
    clearTimeout(timer);
  }
}
