const { randomUUID } = require("node:crypto");
const { fail, texto } = require("../validation.cjs");
module.exports = function register(app, store) {
  const { run, tx, exists, rules, moradores } = store;
  app.get("/api/regras", (req, res) =>
    res.json({ regras: rules(), moradores: moradores() }),
  );
  app.post("/api/regras", (req, res) => {
    const id = randomUUID();
    run(
      "INSERT INTO regras VALUES (?,?,?)",
      id,
      texto(req.body.titulo, "Título", 100),
      texto(req.body.texto, "Regra", 1000),
    );
    res.status(201).json(rules().find((r) => r.id === id));
  });
  app.put("/api/regras/:id", (req, res) => {
    exists("regras", req.params.id);
    const titulo = texto(req.body.titulo, "Título", 100),
      t = texto(req.body.texto, "Regra", 1000);
    tx(() => {
      run(
        "UPDATE regras SET titulo=?,texto=? WHERE id=?",
        titulo,
        t,
        req.params.id,
      );
      run("DELETE FROM aceites WHERE regraId=?", req.params.id);
    });
    res.json(rules().find((r) => r.id === req.params.id));
  });
  app.delete("/api/regras/:id", (req, res) => {
    exists("regras", req.params.id);
    run("DELETE FROM regras WHERE id=?", req.params.id);
    res.sendStatus(204);
  });
  app.patch("/api/regras/:id/aceites/:moradorId", (req, res) => {
    exists("regras", req.params.id);
    exists("moradores", req.params.moradorId);
    if (typeof req.body.aceitou !== "boolean") fail("Informe o aceite.");
    if (req.body.aceitou)
      run(
        "INSERT OR IGNORE INTO aceites VALUES (?,?)",
        req.params.id,
        req.params.moradorId,
      );
    else
      run(
        "DELETE FROM aceites WHERE regraId=? AND moradorId=?",
        req.params.id,
        req.params.moradorId,
      );
    res.json(rules().find((r) => r.id === req.params.id));
  });
};
