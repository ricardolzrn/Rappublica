export const moeda = (centavos) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    centavos / 100,
  );
export const hoje = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const mesAtual = () => hoje().slice(0, 7);
export const dataBR = (data) =>
  data ? data.split("-").reverse().join("/") : "";
export const mesNome = (mes) =>
  new Date(`${mes}-15T12:00:00`).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
export function centavos(input) {
  const value = input.trim();
  if (!/^(\d+|\d{1,3}(\.\d{3})+)(,\d{1,2})?$/.test(value)) return null;
  const [inteiro, decimal = ""] = value.replace(/\./g, "").split(",");
  const total = Number(inteiro) * 100 + Number(decimal.padEnd(2, "0"));
  return Number.isSafeInteger(total) && total > 0 && total <= 100000000
    ? total
    : null;
}
export const statusDespesa = (d) =>
  d.paga ? "Quitada" : d.vencimento < hoje() ? "Vencida" : "Pendente";
