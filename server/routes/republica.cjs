const { fail, texto } = require("../validation.cjs");
module.exports = function register(app, store) {
  const { get, run } = store;
  app.get("/api/republica", (req, res) =>
    res.json(get("SELECT * FROM republica WHERE id=1")),
  );
  app.put("/api/republica", (req, res) => {
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
    run(
      "UPDATE republica SET nome=?,cep=?,endereco=?,numero=? WHERE id=1",
      texto(nome, "Nome"),
      cep,
      endereco.trim(),
      numero.trim(),
    );
    res.json(get("SELECT * FROM republica WHERE id=1"));
  });
};
