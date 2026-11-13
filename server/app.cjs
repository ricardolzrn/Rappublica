const express = require("express");
const { createDatabase } = require("./database.cjs");
const { createRepository } = require("./repository.cjs");
const { createAuth } = require("./auth.cjs");
function createApp(options = {}) {
  const store = createDatabase(options);
  const { db } = store;
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
  app.use(express.json({ limit: "32kb" }));
  const auth = createAuth(store, options);
  const dependencies = { ...store, ...createRepository(store), ...auth };
  app.use((req, res, next) => {
    if (
      ["POST", "PUT", "PATCH"].includes(req.method) &&
      (!req.body || Array.isArray(req.body) || typeof req.body !== "object")
    )
      return res.status(400).json({ message: "Envie um objeto JSON válido." });
    next();
  });
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  auth.registerPublic(app);
  app.use("/api", auth.authenticate);
  auth.registerPrivate(app);
  for (const name of ["republica", "moradores", "despesas", "regras", "resumo"])
    require(`./routes/${name}.cjs`)(app, dependencies);
  app.use((req, res) =>
    res.status(404).json({ message: "Rota não encontrada." }),
  );
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (status === 500) console.error(err);
    res.status(status).json({
      message: status === 500 ? "Erro interno. Tente novamente." : err.message,
    });
  });
  return { app, db };
}
module.exports = { createApp };
