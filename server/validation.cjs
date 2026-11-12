const categorias = [
  "Moradia",
  "Energia",
  "Água",
  "Internet",
  "Mercado",
  "Outros",
];
const quartos = ["Suíte", "Individual 1", "Individual 2", "Duplo"];
const mesAtual = () => new Date().toISOString().slice(0, 7);
function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}
function texto(value, nome, max = 150) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    fail(`${nome}: preencha entre 1 e ${max} caracteres.`);
  return value.trim();
}
function dataValida(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

module.exports = { categorias, quartos, mesAtual, fail, texto, dataValida };
