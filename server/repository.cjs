const { fail, mesAtual } = require("./validation.cjs");
function createRepository({ all, get }) {
  const exists = (table, id) => {
    const row = get(`SELECT * FROM ${table} WHERE id=?`, id);
    if (!row) fail("Registro não encontrado.", 404);
    return row;
  };
  const moradores = () =>
    all(
      `SELECT m.*,u.papel,COALESCE((SELECT SUM(p.valorCentavos) FROM parcelas p WHERE p.moradorId=m.id AND p.paga=0),0) AS pendenteCentavos FROM moradores m LEFT JOIN usuarios u ON u.moradorId=m.id ORDER BY m.nome`,
    );
  const expense = (row) => {
    const parcelas = all(
      "SELECT p.*,m.nome,autor.nome AS alteradoPorNome FROM parcelas p JOIN moradores m ON m.id=p.moradorId LEFT JOIN usuarios u ON u.id=p.alteradoPor LEFT JOIN moradores autor ON autor.id=u.moradorId WHERE despesaId=? ORDER BY m.id",
      row.id,
    ).map((p) => ({ ...p, paga: !!p.paga }));
    return {
      ...row,
      parcelas,
      paga: parcelas.every((p) => p.paga),
      pendenteCentavos: parcelas
        .filter((p) => !p.paga)
        .reduce((s, p) => s + p.valorCentavos, 0),
    };
  };
  const mes = (value) => {
    const v = value || mesAtual();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(v)) fail("Mês inválido. Use AAAA-MM.");
    return v;
  };
  const despesas = (month) =>
    all(
      "SELECT * FROM despesas WHERE substr(vencimento,1,7)=? ORDER BY vencimento,descricao",
      month,
    ).map(expense);
  const rules = () =>
    all("SELECT * FROM regras ORDER BY rowid").map((r) => {
      const detalhesAceites = all(
        "SELECT moradorId,aceitoPor,aceitoEm FROM aceites WHERE regraId=?",
        r.id,
      );
      return {
        ...r,
        aceites: detalhesAceites.map((a) => a.moradorId),
        detalhesAceites,
      };
    });
  return { exists, moradores, expense, mes, despesas, rules };
}
module.exports = { createRepository };
