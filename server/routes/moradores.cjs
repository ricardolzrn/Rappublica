const { randomUUID } = require("node:crypto");
const { quartos, fail, texto } = require("../validation.cjs");
module.exports = function register(app, store) {
  const { get, run, exists, moradores } = store;
  app.get("/api/moradores", (req, res) => res.json(moradores()));
  app.get("/api/formularios/morador", (req, res) =>
    res.json({
      quartos,
      morador: req.query.id ? exists("moradores", req.query.id) : null,
    }),
  );
  function moradorBody(body, id) {
    const nome = texto(body.nome, "Nome", 80),
      email = texto(body.email, "E-mail", 150).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      fail("Informe um e-mail válido.");
    if (!quartos.includes(body.quarto)) fail("Selecione um quarto válido.");
    if (
      get(
        "SELECT id FROM moradores WHERE lower(email)=? AND id<>?",
        email,
        id || "",
      )
    )
      fail("Este e-mail já está cadastrado.", 409);
    return [nome, email, body.quarto];
  }
  app.post("/api/moradores", (req, res) => {
    const row = moradorBody(req.body);
    const id = randomUUID();
    run("INSERT INTO moradores VALUES (?,?,?,?)", id, ...row);
    res.status(201).json(exists("moradores", id));
  });
  app.put("/api/moradores/:id", (req, res) => {
    exists("moradores", req.params.id);
    run(
      "UPDATE moradores SET nome=?,email=?,quarto=? WHERE id=?",
      ...moradorBody(req.body, req.params.id),
      req.params.id,
    );
    res.json(exists("moradores", req.params.id));
  });
  app.delete("/api/moradores/:id", (req, res) => {
    exists("moradores", req.params.id);
    if (get("SELECT 1 FROM parcelas WHERE moradorId=?", req.params.id))
      fail(
        "Este morador participa de despesas. Preserve o histórico ou exclua essas despesas antes.",
        409,
      );
    run("DELETE FROM moradores WHERE id=?", req.params.id);
    res.sendStatus(204);
  });
};
