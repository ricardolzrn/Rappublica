const {
  randomBytes,
  randomUUID,
  createHash,
  scryptSync,
  timingSafeEqual,
} = require("node:crypto");
const { fail, quartos, texto } = require("./validation.cjs");

const tokenHash = (token) => createHash("sha256").update(token).digest("hex");
const timestamp = (date) => date.toISOString();
const expires = (date, hours) =>
  timestamp(new Date(date.getTime() + hours * 3600000));

function passwordHash(password) {
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  )
    fail("A senha deve ter entre 12 e 128 caracteres.");
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}
function verifyPassword(password, stored) {
  if (typeof password !== "string" || !stored) return false;
  const [algorithm, salt, digest] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !digest) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function publicUser(row) {
  return {
    id: row.id,
    moradorId: row.moradorId,
    nome: row.nome,
    email: row.email,
    papel: row.papel,
  };
}
function createAuth(store, { bootstrapAdmin, now = () => new Date() } = {}) {
  const { get, all, run, tx } = store;
  const current = () => now();
  const loginAttempts = new Map();
  const userById = (id) =>
    get(
      "SELECT u.id,u.moradorId,u.senhaHash,u.papel,m.nome,m.email FROM usuarios u JOIN moradores m ON m.id=u.moradorId WHERE u.id=?",
      id,
    );
  const audit = (actor, acao, entidade, entidadeId, detalhes = null) =>
    run(
      "INSERT INTO auditoria (id,autorUsuarioId,autorMoradorId,autorNome,acao,entidade,entidadeId,detalhes,criadoEm) VALUES (?,?,?,?,?,?,?,?,?)",
      randomUUID(),
      actor.id,
      actor.moradorId,
      actor.nome,
      acao,
      entidade,
      entidadeId,
      detalhes === null ? null : JSON.stringify(detalhes),
      timestamp(current()),
    );

  const setup =
    bootstrapAdmin === undefined
      ? process.env.ADMIN_EMAIL || process.env.ADMIN_PASSWORD
        ? {
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
          }
        : null
      : bootstrapAdmin;
  if (
    setup &&
    !get("SELECT id FROM usuarios WHERE papel='administrador' LIMIT 1")
  ) {
    if (!setup.email || !setup.password)
      throw new Error(
        "Defina ADMIN_EMAIL e ADMIN_PASSWORD para criar o administrador inicial.",
      );
    const morador = get(
      "SELECT id FROM moradores WHERE lower(email)=?",
      setup.email.trim().toLowerCase(),
    );
    if (!morador)
      throw new Error("ADMIN_EMAIL deve pertencer a um morador já cadastrado.");
    if (get("SELECT id FROM usuarios WHERE moradorId=?", morador.id))
      throw new Error(
        "O morador inicial já possui uma conta sem perfil de administrador.",
      );
    run(
      "INSERT INTO usuarios (id,moradorId,senhaHash,papel,criadoEm) VALUES (?,?,?,?,?)",
      randomUUID(),
      morador.id,
      passwordHash(setup.password),
      "administrador",
      timestamp(current()),
    );
  }

  const authenticate = (req, res, next) => {
    const match = /^Bearer ([A-Za-z0-9_-]{30,})$/.exec(
      req.get("Authorization") || "",
    );
    if (!match)
      return res
        .status(401)
        .json({ message: "Entre na sua conta para continuar." });
    const session = get(
      "SELECT usuarioId FROM sessoes WHERE tokenHash=? AND revogadoEm IS NULL AND expiraEm>?",
      tokenHash(match[1]),
      timestamp(current()),
    );
    if (!session)
      return res
        .status(401)
        .json({ message: "Sessão expirada. Entre novamente." });
    const user = userById(session.usuarioId);
    if (!user) return res.status(401).json({ message: "Conta indisponível." });
    req.actor = publicUser(user);
    req.sessionHash = tokenHash(match[1]);
    next();
  };
  const requireAdmin = (req, res, next) =>
    req.actor.papel === "administrador"
      ? next()
      : res.status(403).json({
          message: "Apenas administradores podem fazer esta alteração.",
        });
  const requireOwnMorador = (req, res, next) =>
    req.actor.moradorId === req.params.moradorId
      ? next()
      : res
          .status(403)
          .json({ message: "Você só pode alterar seus próprios registros." });
  const makeSession = (user) => {
    const token = randomBytes(32).toString("base64url");
    const expiraEm = expires(current(), 24 * 7);
    run(
      "INSERT INTO sessoes (tokenHash,usuarioId,criadoEm,expiraEm) VALUES (?,?,?,?)",
      tokenHash(token),
      user.id,
      timestamp(current()),
      expiraEm,
    );
    return { token, expiraEm, usuario: publicUser(user) };
  };
  const invitation = (token) => {
    if (typeof token !== "string" || !/^[A-Za-z0-9_-]{30,}$/.test(token))
      fail("Convite inválido.", 404);
    const row = get(
      "SELECT c.*,m.nome,m.email FROM convites c JOIN moradores m ON m.id=c.moradorId WHERE c.tokenHash=?",
      tokenHash(token),
    );
    if (!row) fail("Convite inválido.", 404);
    if (row.usadoEm || row.revogadoEm || row.expiraEm <= timestamp(current()))
      fail("Este convite expirou ou já foi usado.", 410);
    if (get("SELECT id FROM usuarios WHERE moradorId=?", row.moradorId))
      fail("Este morador já possui uma conta.", 409);
    return row;
  };
  function registerPublic(app) {
    app.get("/api/auth/estado", (req, res) =>
      res.json({
        primeiroAcessoDisponivel: !get("SELECT 1 FROM usuarios LIMIT 1"),
        quartos,
      }),
    );
    app.post("/api/auth/primeiro-acesso", (req, res) => {
      if (get("SELECT 1 FROM usuarios LIMIT 1"))
        fail(
          "O primeiro acesso já foi concluído. Peça um convite ao administrador.",
          409,
        );
      const nome = texto(req.body.nome, "Nome", 80);
      const email = texto(req.body.email, "E-mail", 150).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        fail("Informe um e-mail válido.");
      if (!quartos.includes(req.body.quarto))
        fail("Selecione um quarto válido.");
      const hash = passwordHash(req.body.senha);
      const result = tx(() => {
        if (get("SELECT 1 FROM usuarios LIMIT 1"))
          fail(
            "O primeiro acesso já foi concluído. Peça um convite ao administrador.",
            409,
          );
        let morador = get(
          "SELECT id FROM moradores WHERE lower(email)=?",
          email,
        );
        const novoMorador = !morador;
        if (!morador) {
          morador = { id: randomUUID() };
          run(
            "INSERT INTO moradores (id,nome,email,quarto) VALUES (?,?,?,?)",
            morador.id,
            nome,
            email,
            req.body.quarto,
          );
        }
        const id = randomUUID();
        run(
          "INSERT INTO usuarios (id,moradorId,senhaHash,papel,criadoEm) VALUES (?,?,?,?,?)",
          id,
          morador.id,
          hash,
          "administrador",
          timestamp(current()),
        );
        const user = userById(id);
        if (novoMorador)
          audit(publicUser(user), "criar", "morador", morador.id);
        audit(publicUser(user), "criar", "conta", id, {
          origem: "primeiro_acesso",
        });
        return makeSession(user);
      });
      res.status(201).json(result);
    });
    app.post("/api/auth/login", (req, res) => {
      const email =
        typeof req.body.email === "string"
          ? req.body.email.trim().toLowerCase()
          : "";
      const attemptKey = `${req.ip}:${email}`;
      const prior = loginAttempts.get(attemptKey);
      const attempt =
        prior && prior.until > current().getTime()
          ? prior
          : { count: 0, until: current().getTime() + 10 * 60000 };
      if (attempt.count >= 8)
        fail("Muitas tentativas. Tente novamente em dez minutos.", 429);
      const user = get(
        "SELECT u.id,u.moradorId,u.senhaHash,u.papel,m.nome,m.email FROM usuarios u JOIN moradores m ON m.id=u.moradorId WHERE lower(m.email)=?",
        email,
      );
      if (!user || !verifyPassword(req.body.senha, user.senhaHash)) {
        loginAttempts.set(attemptKey, { ...attempt, count: attempt.count + 1 });
        fail("E-mail ou senha inválidos.", 401);
      }
      loginAttempts.delete(attemptKey);
      res.json(makeSession(user));
    });
    app.get("/api/auth/convites/:token", (req, res) => {
      const row = invitation(req.params.token);
      res.json({
        nome: row.nome,
        email: row.email,
        expiraEm: row.expiraEm,
        papel: row.papel,
      });
    });
    app.post("/api/auth/convites/aceitar", (req, res) => {
      const hash = passwordHash(req.body.senha);
      const result = tx(() => {
        const row = invitation(req.body.token);
        const used = run(
          "UPDATE convites SET usadoEm=? WHERE id=? AND usadoEm IS NULL AND revogadoEm IS NULL AND expiraEm>?",
          timestamp(current()),
          row.id,
          timestamp(current()),
        );
        if (!used.changes) fail("Este convite expirou ou já foi usado.", 410);
        const id = randomUUID();
        run(
          "INSERT INTO usuarios (id,moradorId,senhaHash,papel,criadoEm) VALUES (?,?,?,?,?)",
          id,
          row.moradorId,
          hash,
          row.papel,
          timestamp(current()),
        );
        const user = userById(id);
        audit(publicUser(user), "criar", "conta", id, { conviteId: row.id });
        return makeSession(user);
      });
      res.status(201).json(result);
    });
  }
  function registerPrivate(app) {
    app.get("/api/auth/me", (req, res) => res.json({ usuario: req.actor }));
    app.post("/api/auth/logout", (req, res) => {
      run(
        "UPDATE sessoes SET revogadoEm=? WHERE tokenHash=?",
        timestamp(current()),
        req.sessionHash,
      );
      res.sendStatus(204);
    });
    app.get("/api/convites", requireAdmin, (req, res) =>
      res.json(
        all(
          "SELECT c.id,c.moradorId,c.papel,c.criadoEm,c.expiraEm,c.usadoEm,c.revogadoEm,m.nome,m.email FROM convites c JOIN moradores m ON m.id=c.moradorId ORDER BY c.criadoEm DESC",
        ),
      ),
    );
    app.post("/api/convites", requireAdmin, (req, res) => {
      const { moradorId, papel = "morador", validadeHoras = 72 } = req.body;
      if (
        typeof moradorId !== "string" ||
        !["morador", "administrador"].includes(papel) ||
        !Number.isInteger(validadeHoras) ||
        validadeHoras < 1 ||
        validadeHoras > 720
      )
        fail("Informe morador, perfil e validade de 1 a 720 horas.");
      const morador = get(
        "SELECT id,nome,email FROM moradores WHERE id=?",
        moradorId,
      );
      if (!morador) fail("Morador não encontrado.", 404);
      if (get("SELECT id FROM usuarios WHERE moradorId=?", moradorId))
        fail("Este morador já possui uma conta.", 409);
      const token = randomBytes(32).toString("base64url"),
        id = randomUUID();
      const created = timestamp(current()),
        expiraEm = expires(current(), validadeHoras);
      tx(() => {
        run(
          "UPDATE convites SET revogadoEm=? WHERE moradorId=? AND usadoEm IS NULL AND revogadoEm IS NULL",
          created,
          moradorId,
        );
        run(
          "INSERT INTO convites (id,moradorId,tokenHash,papel,criadoPor,criadoEm,expiraEm) VALUES (?,?,?,?,?,?,?)",
          id,
          moradorId,
          tokenHash(token),
          papel,
          req.actor.id,
          created,
          expiraEm,
        );
        audit(req.actor, "criar", "convite", id, {
          moradorId,
          papel,
          expiraEm,
        });
      });
      res.status(201).json({
        id,
        moradorId,
        nome: morador.nome,
        email: morador.email,
        papel,
        expiraEm,
        token,
      });
    });
    app.delete("/api/convites/:id", requireAdmin, (req, res) => {
      const row = get("SELECT * FROM convites WHERE id=?", req.params.id);
      if (!row) fail("Convite não encontrado.", 404);
      if (row.usadoEm || row.revogadoEm) fail("Convite já encerrado.", 409);
      tx(() => {
        run(
          "UPDATE convites SET revogadoEm=? WHERE id=?",
          timestamp(current()),
          row.id,
        );
        audit(req.actor, "revogar", "convite", row.id);
      });
      res.sendStatus(204);
    });
    app.get("/api/auditoria", requireAdmin, (req, res) =>
      res.json(
        all(
          "SELECT id,autorUsuarioId,autorMoradorId,autorNome,acao,entidade,entidadeId,detalhes,criadoEm FROM auditoria ORDER BY criadoEm DESC,rowid DESC LIMIT 100",
        ).map((row) => ({
          ...row,
          detalhes: row.detalhes ? JSON.parse(row.detalhes) : null,
        })),
      ),
    );
  }
  return {
    authenticate,
    requireAdmin,
    requireOwnMorador,
    audit,
    registerPublic,
    registerPrivate,
    current,
  };
}
module.exports = { createAuth };
