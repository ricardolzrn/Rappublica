const { randomUUID } = require("node:crypto");
const { categorias, fail, texto, dataValida } = require("../validation.cjs");
module.exports = function register(app, store) {
  const {
    get,
    run,
    tx,
    exists,
    moradores,
    expense,
    despesas,
    mes,
    requireAdmin,
    requireOwnMorador,
    audit,
    current,
  } = store;
  app.get("/api/despesas", (req, res) =>
    res.json(despesas(mes(req.query.mes))),
  );
  app.get("/api/despesas/:id", (req, res) =>
    res.json(expense(exists("despesas", req.params.id))),
  );
  app.get("/api/formularios/despesa", requireAdmin, (req, res) =>
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
        "INSERT INTO parcelas (despesaId,moradorId,valorCentavos,paga) VALUES (?,?,?,0)",
        id,
        mid,
        base + (i < resto ? 1 : 0),
      ),
    );
  }
  app.post("/api/despesas", requireAdmin, (req, res) => {
    const values = expenseBody(req.body),
      id = randomUUID();
    tx(() => {
      run("INSERT INTO despesas VALUES (?,?,?,?,?,?)", id, ...values);
      split(id, req.body);
      audit(req.actor, "criar", "despesa", id);
    });
    res.status(201).json(expense(exists("despesas", id)));
  });
  app.put("/api/despesas/:id", requireAdmin, (req, res) => {
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
      audit(req.actor, "editar", "despesa", id);
    });
    res.json(expense(exists("despesas", id)));
  });
  app.patch(
    "/api/despesas/:id/parcelas/:moradorId",
    requireOwnMorador,
    (req, res) => {
      if (typeof req.body.paga !== "boolean")
        fail("Informe o estado do pagamento.");
      const parcela = get(
        "SELECT paga FROM parcelas WHERE despesaId=? AND moradorId=?",
        req.params.id,
        req.params.moradorId,
      );
      if (!parcela) fail("Parcela não encontrada.", 404);
      if (!!parcela.paga !== req.body.paga)
        tx(() => {
          run(
            "UPDATE parcelas SET paga=?,alteradoPor=?,alteradoEm=? WHERE despesaId=? AND moradorId=?",
            Number(req.body.paga),
            req.actor.id,
            current().toISOString(),
            req.params.id,
            req.params.moradorId,
          );
          audit(
            req.actor,
            req.body.paga ? "pagar" : "desmarcar_pagamento",
            "parcela",
            `${req.params.id}:${req.params.moradorId}`,
            { anterior: !!parcela.paga, atual: req.body.paga },
          );
        });
      res.json(expense(exists("despesas", req.params.id)));
    },
  );
  app.delete("/api/despesas/:id", requireAdmin, (req, res) => {
    exists("despesas", req.params.id);
    if (
      get("SELECT 1 FROM parcelas WHERE despesaId=? AND paga=1", req.params.id)
    )
      fail(
        "Uma despesa com pagamentos registrados não pode ser excluída.",
        409,
      );
    tx(() => {
      run("DELETE FROM despesas WHERE id=?", req.params.id);
      audit(req.actor, "excluir", "despesa", req.params.id);
    });
    res.sendStatus(204);
  });
};
