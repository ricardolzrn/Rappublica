const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { createApp } = require("./app.cjs");
async function fixture(t, options = {}) {
  const { app, db } = createApp(options);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  t.after(async () => {
    await new Promise((r) => server.close(r));
    db.close();
  });
  return async (path, method = "GET", body) => {
    const res = await fetch(
      `http://127.0.0.1:${server.address().port}/api${path}`,
      {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      },
    );
    return {
      status: res.status,
      data: res.status === 204 ? null : await res.json(),
    };
  };
}
const expense = (participantes, extra = {}) => ({
  descricao: "Mercado compartilhado",
  valorCentavos: 10000,
  categoria: "Mercado",
  tipo: "Variável",
  vencimento: "2026-11-25",
  participantes,
  ...extra,
});
test("divisão exata, pagamento individual e resumo mensal", async (t) => {
  const api = await fixture(t, { dbPath: ":memory:" });
  const moradores = (await api("/moradores")).data;
  const ids = moradores.map((m) => m.id);
  const created = await api("/despesas", "POST", expense(ids));
  assert.equal(created.status, 201);
  const d = created.data;
  assert.equal(
    d.parcelas.reduce((s, p) => s + p.valorCentavos, 0),
    10000,
  );
  assert.deepEqual(
    d.parcelas.map((p) => p.valorCentavos).sort(),
    [3333, 3333, 3334],
  );
  let paid = await api(
    `/despesas/${d.id}/parcelas/${d.parcelas[0].moradorId}`,
    "PATCH",
    { paga: true },
  );
  assert.equal(paid.status, 200);
  assert.equal(paid.data.paga, false);
  const blocked = await api(
    `/despesas/${d.id}`,
    "PUT",
    expense(ids, { valorCentavos: 12000 }),
  );
  assert.equal(blocked.status, 409);
  const edit = await api(
    `/despesas/${d.id}`,
    "PUT",
    expense(ids, { descricao: "Compra revisada" }),
  );
  assert.equal(edit.status, 200);
  assert.equal(edit.data.parcelas.filter((p) => p.paga).length, 1);
  for (const p of d.parcelas)
    await api(`/despesas/${d.id}/parcelas/${p.moradorId}`, "PATCH", {
      paga: true,
    });
  const final = (await api(`/despesas/${d.id}`)).data;
  assert.equal(final.paga, true);
  assert.equal(final.pendenteCentavos, 0);
  const summary = (await api("/resumo?mes=2026-11")).data;
  const list = (await api("/despesas?mes=2026-11")).data;
  assert.equal(
    summary.totalCentavos,
    list.reduce((s, d) => s + d.valorCentavos, 0),
  );
  assert.equal(
    summary.pagoCentavos + summary.pendenteCentavos,
    summary.totalCentavos,
  );
  assert.equal((await api(`/moradores/${ids[0]}`, "DELETE")).status, 409);
  assert.equal((await api(`/despesas/${d.id}`, "DELETE")).status, 204);
  assert.equal((await api(`/despesas/${d.id}`)).status, 404);
});
test("valida dinheiro, datas, participantes e formato do mês", async (t) => {
  const api = await fixture(t, { dbPath: ":memory:" });
  for (const extra of [
    { valorCentavos: 0 },
    { valorCentavos: 1.5 },
    { valorCentavos: -200 },
    { valorCentavos: 1 },
    { participantes: [] },
    { participantes: ["lucas", "lucas"] },
    { vencimento: "2026-02-30" },
    { categoria: "Inválida" },
  ])
    assert.equal(
      (await api("/despesas", "POST", expense(["lucas", "caio"], extra)))
        .status,
      400,
    );
  assert.equal(
    (await api("/despesas", "POST", expense(["inexistente"]))).status,
    404,
  );
  assert.equal((await api("/despesas?mes=2026-13")).status, 400);
  assert.equal(
    (await api("/despesas/energia/parcelas/lucas", "PATCH", { paga: "sim" }))
      .status,
    400,
  );
});
test("cadastro e edição de moradores, e-mail único e exclusão sem vínculos", async (t) => {
  const api = await fixture(t, { dbPath: ":memory:" });
  const body = { nome: "Ana Souza", email: "ana@example.com", quarto: "Duplo" };
  assert.equal(
    (await api("/moradores", "POST", { ...body, email: "errado" })).status,
    400,
  );
  const created = await api("/moradores", "POST", body);
  assert.equal(created.status, 201);
  assert.equal(
    (await api("/moradores", "POST", { ...body, email: "ANA@example.com" }))
      .status,
    409,
  );
  assert.equal(
    (
      await api(`/moradores/${created.data.id}`, "PUT", {
        ...body,
        nome: "Ana Silva",
      })
    ).data.nome,
    "Ana Silva",
  );
  assert.equal(
    (await api(`/moradores/${created.data.id}`, "DELETE")).status,
    204,
  );
});
test("aceite pertence à regra e edição exige novos aceites", async (t) => {
  const api = await fixture(t, { dbPath: ":memory:" });
  const body = { titulo: "Lixo", texto: "Retirar às terças." };
  const rule = (await api("/regras", "POST", body)).data;
  const accept = await api(`/regras/${rule.id}/aceites/lucas`, "PATCH", {
    aceitou: true,
  });
  assert.deepEqual(accept.data.aceites, ["lucas"]);
  assert.equal(
    (await api(`/regras/${rule.id}/aceites/lucas`, "PATCH", { aceitou: true }))
      .data.aceites.length,
    1,
  );
  assert.equal(
    (
      await api(`/regras/${rule.id}`, "PUT", {
        ...body,
        texto: "Retirar às quartas.",
      })
    ).data.aceites.length,
    0,
  );
  assert.equal((await api(`/regras/${rule.id}`, "DELETE")).status, 204);
});
test("SQLite persiste dados após reabrir o banco; não repopula registros excluídos", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "rappublica-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const dbPath = join(dir, "test.sqlite");
  let current = createApp({ dbPath, seed: false });
  current.db.prepare("UPDATE republica SET nome=?").run("República Teste");
  current.db.close();
  current = createApp({ dbPath });
  assert.equal(
    current.db.prepare("SELECT nome FROM republica").get().nome,
    "República Teste",
  );
  assert.equal(
    current.db.prepare("SELECT COUNT(*) AS total FROM moradores").get().total,
    0,
  );
  current.db.close();
});
test("formulários recebem dados da API e república pode ser atualizada", async (t) => {
  const api = await fixture(t, { dbPath: ":memory:" });
  assert.ok((await api("/formularios/despesa")).data.categorias.length);
  assert.ok((await api("/formularios/morador")).data.quartos.length);
  assert.equal(
    (
      await api("/republica", "PUT", {
        nome: "República Aurora",
        cep: "01001000",
        endereco: "Praça da Sé, São Paulo - SP",
        numero: "10",
      })
    ).status,
    200,
  );
  assert.equal((await api("/republica")).data.nome, "República Aurora");
  assert.equal((await api("/republica", "PUT", { nome: "" })).status, 400);
});
test("valores brasileiros são interpretados sem truncar centavos", async () => {
  const { centavos } = await import("../src/utils/format.js");
  assert.equal(centavos("150,50"), 15050);
  assert.equal(centavos("1.234,56"), 123456);
  assert.equal(centavos("0,01"), 1);
  for (const v of ["0", "-1", "abc", "1,234", "1.23", "1,2,3", "1000000,01"])
    assert.equal(centavos(v), null);
});
