const { randomUUID } = require("node:crypto");
const { fail, texto } = require("../validation.cjs");
module.exports = function register(app, store) {
  const {
    all,
    get,
    run,
    tx,
    exists,
    rules,
    moradores,
    requireAdmin,
    requireOwnMorador,
    audit,
    current,
  } = store;
  app.get("/api/regras", (req, res) =>
    res.json({ regras: rules(), moradores: moradores() }),
  );
  app.post("/api/regras", requireAdmin, (req, res) => {
    const id = randomUUID();
    const titulo = texto(req.body.titulo, "Título", 100),
      t = texto(req.body.texto, "Regra", 1000);
    tx(() => {
      run("INSERT INTO regras VALUES (?,?,?)", id, titulo, t);
      audit(req.actor, "criar", "regra", id);
    });
    res.status(201).json(rules().find((r) => r.id === id));
  });
  app.put("/api/regras/:id", requireAdmin, (req, res) => {
    exists("regras", req.params.id);
    const titulo = texto(req.body.titulo, "Título", 100),
      t = texto(req.body.texto, "Regra", 1000);
    const aceitesAnteriores = all(
      "SELECT moradorId,aceitoPor,aceitoEm FROM aceites WHERE regraId=?",
      req.params.id,
    );
    tx(() => {
      run(
        "UPDATE regras SET titulo=?,texto=? WHERE id=?",
        titulo,
        t,
        req.params.id,
      );
      run("DELETE FROM aceites WHERE regraId=?", req.params.id);
      audit(req.actor, "editar", "regra", req.params.id, { aceitesAnteriores });
    });
    res.json(rules().find((r) => r.id === req.params.id));
  });
  app.delete("/api/regras/:id", requireAdmin, (req, res) => {
    exists("regras", req.params.id);
    if (get("SELECT 1 FROM aceites WHERE regraId=?", req.params.id))
      fail("Uma regra com aceites registrados não pode ser excluída.", 409);
    tx(() => {
      run("DELETE FROM regras WHERE id=?", req.params.id);
      audit(req.actor, "excluir", "regra", req.params.id);
    });
    res.sendStatus(204);
  });
  app.patch(
    "/api/regras/:id/aceites/:moradorId",
    requireOwnMorador,
    (req, res) => {
      exists("regras", req.params.id);
      exists("moradores", req.params.moradorId);
      if (typeof req.body.aceitou !== "boolean") fail("Informe o aceite.");
      const old = get(
        "SELECT 1 FROM aceites WHERE regraId=? AND moradorId=?",
        req.params.id,
        req.params.moradorId,
      );
      if (!!old !== req.body.aceitou)
        tx(() => {
          if (req.body.aceitou)
            run(
              "INSERT INTO aceites (regraId,moradorId,aceitoPor,aceitoEm) VALUES (?,?,?,?)",
              req.params.id,
              req.params.moradorId,
              req.actor.id,
              current().toISOString(),
            );
          else
            run(
              "DELETE FROM aceites WHERE regraId=? AND moradorId=?",
              req.params.id,
              req.params.moradorId,
            );
          audit(
            req.actor,
            req.body.aceitou ? "aceitar" : "retirar_aceite",
            "regra",
            req.params.id,
          );
        });
      res.json(rules().find((r) => r.id === req.params.id));
    },
  );
};
