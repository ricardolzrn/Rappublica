const { fail, texto } = require("../validation.cjs");
module.exports = function register(app, store) {
  const { get, run, tx, requireAdmin, audit } = store;
  app.get("/api/republica", (req, res) =>
    res.json(get("SELECT * FROM republica WHERE id=1")),
  );
  app.put("/api/republica", requireAdmin, (req, res) => {
    const { nome, cep = "", endereco = "", numero = "" } = req.body;
    if (typeof cep !== "string" || (cep && !/^\d{8}$/.test(cep)))
      fail("CEP deve ter 8 dígitos.");
    if (
      typeof endereco !== "string" ||
      endereco.length > 250 ||
      typeof numero !== "string" ||
      numero.length > 20
    )
      fail("Endereço inválido.");
    const validName = texto(nome, "Nome");
    tx(() => {
      run(
        "UPDATE republica SET nome=?,cep=?,endereco=?,numero=? WHERE id=1",
        validName,
        cep,
        endereco.trim(),
        numero.trim(),
      );
      audit(req.actor, "editar", "republica", "1");
    });
    res.json(get("SELECT * FROM republica WHERE id=1"));
  });
};
