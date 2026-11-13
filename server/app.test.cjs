const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { createApp } = require("./app.cjs");
async function fixture(t, options = {}) {
  const { noBootstrap = false, ...databaseOptions } = options;
  const { app, db } = createApp({
    ...databaseOptions,
    ...(noBootstrap
      ? { bootstrapAdmin: false }
      : {
          bootstrapAdmin: {
            email: "ricardo@example.com",
            password: "senha-segura-123",
          },
        }),
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  t.after(async () => {
    await new Promise((r) => server.close(r));
    db.close();
  });
  const api = async (path, method = "GET", body, token = api.adminToken) => {
    const res = await fetch(
      `http://127.0.0.1:${server.address().port}/api${path}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      },
    );
    return {
      status: res.status,
      data: res.status === 204 ? null : await res.json(),
    };
  };
  if (noBootstrap) {
    api.db = db;
    return api;
  }
  const login = await api(
    "/auth/login",
    "POST",
    { email: "ricardo@example.com", senha: "senha-segura-123" },
    null,
  );
  assert.equal(login.status, 200);
  api.adminToken = login.data.token;
  api.db = db;
  return api;
}
async function activate(api, moradorId, papel = "morador") {
  const invite = await api("/convites", "POST", { moradorId, papel });
  assert.equal(invite.status, 201);
  const accepted = await api(
    "/auth/convites/aceitar",
    "POST",
    { token: invite.data.token, senha: "senha-segura-456" },
    null,
  );
  assert.equal(accepted.status, 201);
  return accepted.data.token;
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
  const tokens = {
    ricardo: api.adminToken,
    lucas: await activate(api, "lucas"),
    caio: await activate(api, "caio"),
  };
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
    tokens[d.parcelas[0].moradorId],
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
    await api(
      `/despesas/${d.id}/parcelas/${p.moradorId}`,
      "PATCH",
      {
        paga: true,
      },
      tokens[p.moradorId],
    );
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
  assert.equal((await api(`/despesas/${d.id}`, "DELETE")).status, 409);
  const unpaid = await api("/despesas", "POST", expense(["lucas"]));
  assert.equal(
    (await api(`/despesas/${unpaid.data.id}`, "DELETE")).status,
    204,
  );
  assert.equal((await api(`/despesas/${unpaid.data.id}`)).status, 404);
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
    (await api("/despesas/energia/parcelas/ricardo", "PATCH", { paga: "sim" }))
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
  const lucasToken = await activate(api, "lucas");
  const body = { titulo: "Lixo", texto: "Retirar às terças." };
  const rule = (await api("/regras", "POST", body)).data;
  const accept = await api(
    `/regras/${rule.id}/aceites/lucas`,
    "PATCH",
    {
      aceitou: true,
    },
    lucasToken,
  );
  assert.deepEqual(accept.data.aceites, ["lucas"]);
  assert.equal(
    (
      await api(
        `/regras/${rule.id}/aceites/lucas`,
        "PATCH",
        { aceitou: true },
        lucasToken,
      )
    ).data.aceites.length,
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

test("primeiro acesso cria administrador no app uma única vez e permite trocar de conta", async (t) => {
  const api = await fixture(t, {
    dbPath: ":memory:",
    seed: false,
    noBootstrap: true,
  });
  const body = {
    nome: "Ana Souza",
    email: "ana@example.com",
    quarto: "Duplo",
    senha: "senha-segura-123",
  };
  assert.equal((await api("/auth/estado")).data.primeiroAcessoDisponivel, true);
  assert.equal(
    (await api("/auth/primeiro-acesso", "POST", { ...body, senha: "curta" }))
      .status,
    400,
  );
  const attempts = await Promise.all(
    [1, 2].map(() => api("/auth/primeiro-acesso", "POST", body)),
  );
  assert.deepEqual(attempts.map((result) => result.status).sort(), [201, 409]);
  const session = attempts.find((result) => result.status === 201).data;
  assert.equal(session.usuario.papel, "administrador");
  assert.equal(session.usuario.nome, "Ana Souza");
  assert.equal(
    (await api("/auth/estado")).data.primeiroAcessoDisponivel,
    false,
  );
  assert.equal(
    api.db.prepare("SELECT COUNT(*) AS n FROM moradores").get().n,
    1,
  );
  assert.equal(
    (
      await api("/auth/primeiro-acesso", "POST", {
        ...body,
        email: "outra@example.com",
      })
    ).status,
    409,
  );
  assert.equal(
    (await api("/auth/logout", "POST", {}, session.token)).status,
    204,
  );
  assert.equal(
    (await api("/auth/me", "GET", undefined, session.token)).status,
    401,
  );
  const login = await api("/auth/login", "POST", {
    email: body.email,
    senha: body.senha,
  });
  assert.equal(login.status, 200);
  assert.equal(login.data.usuario.moradorId, session.usuario.moradorId);
  assert.ok(
    (await api("/auditoria", "GET", undefined, login.data.token)).data.some(
      (event) =>
        event.entidade === "morador" && event.autorNome === "Ana Souza",
    ),
  );
});

test("primeira conta aproveita cadastro e histórico de morador existente", async (t) => {
  const api = await fixture(t, { dbPath: ":memory:", noBootstrap: true });
  api.db
    .prepare("INSERT INTO aceites (regraId,moradorId) VALUES (?,?)")
    .run("silencio", "lucas");
  const initialCount = api.db
    .prepare("SELECT COUNT(*) AS n FROM moradores")
    .get().n;
  const signup = await api("/auth/primeiro-acesso", "POST", {
    nome: "Lucas Fagundes",
    email: "LUCAS@example.com",
    quarto: "Suíte",
    senha: "senha-segura-123",
  });
  assert.equal(signup.status, 201);
  assert.equal(signup.data.usuario.moradorId, "lucas");
  assert.equal(
    api.db.prepare("SELECT COUNT(*) AS n FROM moradores").get().n,
    initialCount,
  );
  assert.equal(
    (
      await api("/despesas/aluguel", "GET", undefined, signup.data.token)
    ).data.parcelas.find((p) => p.moradorId === "lucas").paga,
    true,
  );
  assert.ok(
    (await api("/regras", "GET", undefined, signup.data.token)).data.regras
      .find((r) => r.id === "silencio")
      .aceites.includes("lucas"),
  );
  const caioInvite = await api(
    "/convites",
    "POST",
    { moradorId: "caio" },
    signup.data.token,
  );
  assert.equal(caioInvite.status, 201);
  const caio = await api("/auth/convites/aceitar", "POST", {
    token: caioInvite.data.token,
    senha: "senha-segura-456",
  });
  assert.equal(caio.status, 201);
  assert.equal(caio.data.usuario.papel, "morador");
  assert.equal(
    (await api("/auth/logout", "POST", {}, signup.data.token)).status,
    204,
  );
  assert.equal(
    (
      await api("/auth/login", "POST", {
        email: "caio@example.com",
        senha: "senha-segura-456",
      })
    ).status,
    200,
  );
});

test("login, perfis e permissões impedem alterações em nome de outra pessoa", async (t) => {
  const api = await fixture(t, { dbPath: ":memory:" });
  const lucas = await activate(api, "lucas");
  assert.equal((await api("/moradores", "GET", undefined, null)).status, 401);
  assert.equal(
    (
      await api(
        "/auth/login",
        "POST",
        { email: "lucas@example.com", senha: "errada" },
        null,
      )
    ).status,
    401,
  );
  assert.equal(
    (await api("/auth/me", "GET", undefined, lucas)).data.usuario.moradorId,
    "lucas",
  );
  assert.equal((await api("/convites", "GET", undefined, lucas)).status, 403);
  assert.equal((await api("/auditoria", "GET", undefined, lucas)).status, 403);
  assert.equal(
    (await api("/formularios/despesa", "GET", undefined, lucas)).status,
    403,
  );
  assert.equal(
    (
      await api(
        "/moradores",
        "POST",
        { nome: "Novo", email: "novo@example.com", quarto: "Duplo" },
        lucas,
      )
    ).status,
    403,
  );
  assert.equal(
    (await api("/republica", "PUT", { nome: "Outra" }, lucas)).status,
    403,
  );
  assert.equal(
    (await api("/despesas", "POST", expense(["lucas"]), lucas)).status,
    403,
  );
  const created = await api("/despesas", "POST", expense(["lucas", "ricardo"]));
  assert.equal(
    (
      await api(
        `/despesas/${created.data.id}/parcelas/ricardo`,
        "PATCH",
        { paga: true },
        lucas,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await api(`/despesas/${created.data.id}/parcelas/lucas`, "PATCH", {
        paga: true,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await api(
        `/despesas/${created.data.id}/parcelas/lucas`,
        "PATCH",
        { paga: true },
        lucas,
      )
    ).status,
    200,
  );
  const parcela = (
    await api(`/despesas/${created.data.id}`)
  ).data.parcelas.find((p) => p.moradorId === "lucas");
  assert.ok(parcela.alteradoEm);
  assert.equal(
    parcela.alteradoPor,
    (await api("/auth/me", "GET", undefined, lucas)).data.usuario.id,
  );
  const rule = (
    await api("/regras", "POST", { titulo: "Visitas", texto: "Avisar antes." })
  ).data;
  assert.equal(
    (
      await api(
        `/regras/${rule.id}/aceites/ricardo`,
        "PATCH",
        { aceitou: true },
        lucas,
      )
    ).status,
    403,
  );
  assert.equal(
    (await api(`/regras/${rule.id}/aceites/lucas`, "PATCH", { aceitou: true }))
      .status,
    403,
  );
  assert.equal(
    (
      await api(
        `/regras/${rule.id}/aceites/lucas`,
        "PATCH",
        { aceitou: true },
        lucas,
      )
    ).status,
    200,
  );
  const accepted = (await api("/regras")).data.regras.find(
    (r) => r.id === rule.id,
  ).detalhesAceites[0];
  assert.equal(accepted.moradorId, "lucas");
  assert.ok(accepted.aceitoEm);
  const events = (await api("/auditoria")).data;
  assert.ok(
    events.some(
      (e) =>
        e.autorNome === "Lucas Fagundes" && e.acao === "pagar" && e.criadoEm,
    ),
  );
  assert.ok(
    events.some(
      (e) =>
        e.autorNome === "Lucas Fagundes" && e.acao === "aceitar" && e.criadoEm,
    ),
  );
  assert.equal((await api("/auth/logout", "POST", {}, lucas)).status, 204);
  assert.equal((await api("/auth/me", "GET", undefined, lucas)).status, 401);
  const again = await api(
    "/auth/login",
    "POST",
    { email: "lucas@example.com", senha: "senha-segura-456" },
    null,
  );
  assert.equal(again.status, 200);
  api.db
    .prepare(
      "UPDATE sessoes SET expiraEm='2000-01-01T00:00:00.000Z' WHERE usuarioId=(SELECT id FROM usuarios WHERE moradorId='lucas')",
    )
    .run();
  assert.equal(
    (await api("/auth/me", "GET", undefined, again.data.token)).status,
    401,
  );
  for (let i = 0; i < 8; i++)
    assert.equal(
      (
        await api(
          "/auth/login",
          "POST",
          { email: "inexistente@example.com", senha: "incorreta" },
          null,
        )
      ).status,
      401,
    );
  assert.equal(
    (
      await api(
        "/auth/login",
        "POST",
        { email: "inexistente@example.com", senha: "incorreta" },
        null,
      )
    ).status,
    429,
  );
});

test("convites são individuais, expiram, são revogáveis e aceitos uma vez", async (t) => {
  const api = await fixture(t, { dbPath: ":memory:" });
  const first = await api("/convites", "POST", {
    moradorId: "lucas",
    validadeHoras: 1,
  });
  assert.equal(first.status, 201);
  assert.equal(
    (await api(`/auth/convites/${first.data.token}`, "GET", undefined, null))
      .data.email,
    "lucas@example.com",
  );
  const replacement = await api("/convites", "POST", {
    moradorId: "lucas",
    validadeHoras: 72,
  });
  assert.equal(
    (await api(`/auth/convites/${first.data.token}`, "GET", undefined, null))
      .status,
    410,
  );
  assert.equal(
    (
      await api(
        "/auth/convites/aceitar",
        "POST",
        { token: first.data.token, senha: "senha-segura-456" },
        null,
      )
    ).status,
    410,
  );
  const results = await Promise.all(
    [1, 2].map(() =>
      api(
        "/auth/convites/aceitar",
        "POST",
        { token: replacement.data.token, senha: "senha-segura-456" },
        null,
      ),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 410]);
  assert.equal(
    (await api("/convites", "POST", { moradorId: "lucas" })).status,
    409,
  );
  const caio = await api("/convites", "POST", {
    moradorId: "caio",
    papel: "administrador",
    validadeHoras: 1,
  });
  api.db
    .prepare(
      "UPDATE convites SET expiraEm='2000-01-01T00:00:00.000Z' WHERE id=?",
    )
    .run(caio.data.id);
  assert.equal(
    (await api(`/auth/convites/${caio.data.token}`, "GET", undefined, null))
      .status,
    410,
  );
  const renewed = await api("/convites", "POST", { moradorId: "caio" });
  assert.equal(
    (await api(`/convites/${renewed.data.id}`, "DELETE")).status,
    204,
  );
  assert.equal(
    (
      await api(
        "/auth/convites/aceitar",
        "POST",
        { token: renewed.data.token, senha: "senha-segura-456" },
        null,
      )
    ).status,
    410,
  );
  const adminInvite = await api("/convites", "POST", {
    moradorId: "caio",
    papel: "administrador",
  });
  const admin = await api(
    "/auth/convites/aceitar",
    "POST",
    { token: adminInvite.data.token, senha: "senha-segura-456" },
    null,
  );
  assert.equal(admin.data.usuario.papel, "administrador");
  assert.equal(
    (await api("/convites", "GET", undefined, admin.data.token)).status,
    200,
  );
  assert.equal(
    (await api("/moradores")).data.find((m) => m.id === "lucas").id,
    "lucas",
  );
});

test("migração preserva parcelas e aceites anteriores e vínculo do morador", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "rappublica-legado-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const dbPath = join(dir, "legacy.sqlite");
  const old = new DatabaseSync(dbPath);
  old.exec(`CREATE TABLE republica (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, cep TEXT NOT NULL DEFAULT '', endereco TEXT NOT NULL DEFAULT '', numero TEXT NOT NULL DEFAULT '');
    CREATE TABLE moradores (id TEXT PRIMARY KEY, nome TEXT NOT NULL, email TEXT NOT NULL, quarto TEXT NOT NULL);
    CREATE TABLE despesas (id TEXT PRIMARY KEY, descricao TEXT NOT NULL, valorCentavos INTEGER NOT NULL, categoria TEXT NOT NULL, tipo TEXT NOT NULL, vencimento TEXT NOT NULL);
    CREATE TABLE parcelas (despesaId TEXT NOT NULL, moradorId TEXT NOT NULL, valorCentavos INTEGER NOT NULL, paga INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(despesaId,moradorId));
    CREATE TABLE regras (id TEXT PRIMARY KEY, titulo TEXT NOT NULL, texto TEXT NOT NULL);
    CREATE TABLE aceites (regraId TEXT NOT NULL, moradorId TEXT NOT NULL, PRIMARY KEY(regraId,moradorId));
    INSERT INTO republica(id,nome) VALUES(1,'Casa antiga');
    INSERT INTO moradores VALUES('ricardo','Ricardo Lazarini','ricardo@example.com','Duplo');
    INSERT INTO moradores VALUES('lucas','Lucas Fagundes','lucas@example.com','Suíte');
    INSERT INTO despesas VALUES('antiga','Conta antiga',1000,'Outros','Variável','2026-11-10');
    INSERT INTO parcelas VALUES('antiga','lucas',1000,1);
    INSERT INTO regras VALUES('antiga','Regra antiga','Convivência.');
    INSERT INTO aceites VALUES('antiga','lucas');`);
  old.close();
  const api = await fixture(t, { dbPath });
  const lucas = await activate(api, "lucas");
  const me = (await api("/auth/me", "GET", undefined, lucas)).data.usuario;
  assert.equal(me.moradorId, "lucas");
  const parcela = (await api("/despesas/antiga")).data.parcelas[0];
  assert.equal(parcela.paga, true);
  assert.equal(parcela.alteradoPor, null);
  const regra = (await api("/regras")).data.regras[0];
  assert.deepEqual(regra.aceites, ["lucas"]);
  assert.equal(regra.detalhesAceites[0].aceitoEm, null);
  assert.equal((await api("/republica")).data.nome, "Casa antiga");
  assert.equal(
    (
      await api("/regras/antiga", "PUT", {
        titulo: "Regra antiga",
        texto: "Texto revisado.",
      })
    ).status,
    200,
  );
  const edit = (await api("/auditoria")).data.find(
    (e) => e.entidade === "regra" && e.acao === "editar",
  );
  assert.equal(edit.detalhes.aceitesAnteriores[0].moradorId, "lucas");
});
