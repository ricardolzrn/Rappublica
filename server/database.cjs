const { DatabaseSync } = require("node:sqlite");
const { mkdirSync } = require("node:fs");
const { dirname, join } = require("node:path");
const { mesAtual } = require("./validation.cjs");
function createDatabase({
  dbPath = process.env.DB_PATH || join(__dirname, "data", "rappublica.sqlite"),
  seed = true,
} = {}) {
  if (dbPath !== ":memory:") mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS republica (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, cep TEXT NOT NULL DEFAULT '', endereco TEXT NOT NULL DEFAULT '', numero TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS moradores (id TEXT PRIMARY KEY, nome TEXT NOT NULL, email TEXT NOT NULL, quarto TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS despesas (id TEXT PRIMARY KEY, descricao TEXT NOT NULL, valorCentavos INTEGER NOT NULL, categoria TEXT NOT NULL, tipo TEXT NOT NULL, vencimento TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS parcelas (despesaId TEXT NOT NULL REFERENCES despesas(id) ON DELETE CASCADE, moradorId TEXT NOT NULL REFERENCES moradores(id), valorCentavos INTEGER NOT NULL, paga INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (despesaId, moradorId));
    CREATE TABLE IF NOT EXISTS regras (id TEXT PRIMARY KEY, titulo TEXT NOT NULL, texto TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS aceites (regraId TEXT NOT NULL REFERENCES regras(id) ON DELETE CASCADE, moradorId TEXT NOT NULL REFERENCES moradores(id) ON DELETE CASCADE, PRIMARY KEY (regraId, moradorId));`);
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  const get = (sql, ...args) => db.prepare(sql).get(...args);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const tx = (fn) => {
    db.exec("BEGIN");
    try {
      const result = fn();
      db.exec("COMMIT");
      return result;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  };
  if (!get("SELECT id FROM republica"))
    tx(() => {
      run("INSERT INTO republica (id,nome) VALUES (1,?)", "Rappublica");
      if (seed) {
        [
          ["lucas", "Lucas Fagundes", "lucas@example.com", "Suíte"],
          ["caio", "Caio Monte Alegre", "caio@example.com", "Individual 1"],
          ["ricardo", "Ricardo Lazarini", "ricardo@example.com", "Duplo"],
        ].forEach((row) =>
          run("INSERT INTO moradores VALUES (?,?,?,?)", ...row),
        );
        const m = mesAtual();
        [
          ["aluguel", "Aluguel + IPTU", 150000, "Moradia", "Fixa", `${m}-10`],
          ["internet", "Internet Fibra", 12000, "Internet", "Fixa", `${m}-15`],
          [
            "energia",
            "Energia elétrica",
            27000,
            "Energia",
            "Variável",
            `${m}-20`,
          ],
        ].forEach((row) => {
          run("INSERT INTO despesas VALUES (?,?,?,?,?,?)", ...row);
          ["lucas", "caio", "ricardo"].forEach((id) =>
            run(
              "INSERT INTO parcelas VALUES (?,?,?,?)",
              row[0],
              id,
              row[2] / 3,
              row[0] === "energia" ? 0 : 1,
            ),
          );
        });
        run(
          "INSERT INTO regras VALUES (?,?,?)",
          "silencio",
          "Horário de silêncio",
          "Respeitar o silêncio entre 22h e 7h em dias úteis.",
        );
        run(
          "INSERT INTO regras VALUES (?,?,?)",
          "cozinha",
          "Cozinha organizada",
          "Lavar a louça e limpar a bancada após o uso.",
        );
      }
    });
  return { db, all, get, run, tx };
}
module.exports = { createDatabase };
