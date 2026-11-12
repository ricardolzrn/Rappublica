const { randomUUID } = require("node:crypto");
const { categorias, fail, texto, dataValida } = require("../validation.cjs");
module.exports = function register(app, store) {
  const { run, tx, exists, moradores, expense, despesas, mes } = store;
  app.get("/api/despesas", (req, res) =>
    res.json(despesas(mes(req.query.mes))),
  );
  app.get("/api/despesas/:id", (req, res) =>
    res.json(expense(exists("despesas", req.params.id))),
  );
  app.get("/api/formularios/despesa", (req, res) =>
    res.json({
      categorias,
      moradores: moradores(),
      despesa: req.query.id ? expense(exists("despesas", req.query.id)) : null,
    }),
  );
  function expenseBody(body) {
    const descricao = texto(body.descricao, "Descrição");
    if (
      !Number.isSafeInteger(body.valorCentavos) ||
      body.valorCentavos < 1 ||
      body.valorCentavos > 100000000
    )
      fail("Valor deve ser positivo e de até R$ 1.000.000,00.");
    if (
      !categorias.includes(body.categoria) ||
      !["Fixa", "Variável"].includes(body.tipo)
    )
      fail("Categoria ou tipo inválido.");
    if (!dataValida(body.vencimento)) fail("Vencimento inválido.");
    if (
      !Array.isArray(body.participantes) ||
      !body.participantes.length ||
      body.participantes.some((id) => typeof id !== "string") ||
      new Set(body.participantes).size !== body.participantes.length
    )
      fail("Selecione os moradores participantes sem duplicatas.");
    body.participantes.forEach((id) => exists("moradores", id));
    if (body.valorCentavos < body.participantes.length)
      fail("O valor deve permitir pelo menos um centavo por participante.");
    return [
      descricao,
      body.valorCentavos,
      body.categoria,
      body.tipo,
      body.vencimento,
    ];
  }
  function split(id, body) {
    const ids = [...body.participantes].sort();
    const base = Math.floor(body.valorCentavos / ids.length),
      resto = body.valorCentavos % ids.length;
    ids.forEach((mid, i) =>
      run(
        "INSERT INTO parcelas VALUES (?,?,?,0)",
        id,
        mid,
        base + (i < resto ? 1 : 0),
      ),
    );
  }
  app.post("/api/despesas", (req, res) => {
    const values = expenseBody(req.body),
      id = randomUUID();
    tx(() => {
      run("INSERT INTO despesas VALUES (?,?,?,?,?,?)", id, ...values);
      split(id, req.body);
    });
    res.status(201).json(expense(exists("despesas", id)));
  });
  app.put("/api/despesas/:id", (req, res) => {
    const id = req.params.id,
      old = expense(exists("despesas", id)),
      values = expenseBody(req.body);
    const changed =
      old.valorCentavos !== req.body.valorCentavos ||
      JSON.stringify(old.parcelas.map((p) => p.moradorId).sort()) !==
        JSON.stringify([...req.body.participantes].sort());
    if (changed && old.parcelas.some((p) => p.paga))
      fail(
        "Desmarque os pagamentos antes de alterar o valor ou os participantes.",
        409,
      );
    tx(() => {
      run(
        "UPDATE despesas SET descricao=?,valorCentavos=?,categoria=?,tipo=?,vencimento=? WHERE id=?",
        ...values,
        id,
      );
      if (changed) {
        run("DELETE FROM parcelas WHERE despesaId=?", id);
        split(id, req.body);
      }
    });
    res.json(expense(exists("despesas", id)));
  });
  app.patch("/api/despesas/:id/parcelas/:moradorId", (req, res) => {
    if (typeof req.body.paga !== "boolean")
      fail("Informe o estado do pagamento.");
    const result = run(
      "UPDATE parcelas SET paga=? WHERE despesaId=? AND moradorId=?",
      Number(req.body.paga),
      req.params.id,
      req.params.moradorId,
    );
    if (!result.changes) fail("Parcela não encontrada.", 404);
    res.json(expense(exists("despesas", req.params.id)));
  });
  app.delete("/api/despesas/:id", (req, res) => {
    exists("despesas", req.params.id);
    run("DELETE FROM despesas WHERE id=?", req.params.id);
    res.sendStatus(204);
  });
};
