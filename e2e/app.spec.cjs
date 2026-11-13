const { test, expect } = require("@playwright/test");

const tab = (page, name) =>
  page.getByRole("tab", { name, exact: true }).click();
const back = (page) =>
  page
    .getByRole("link", { name: /back|voltar/i })
    .first()
    .click();
async function login(page, email, senha) {
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(senha);
  await page.getByRole("button", { name: "Acessar república" }).click();
  await expect(page.getByRole("tab", { name: "Casa" })).toBeVisible();
}
async function logout(page) {
  await tab(page, "Casa");
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(
    page.getByRole("button", { name: "Acessar república" }),
  ).toBeVisible();
}

test("administrador convida morador existente; cada conta registra apenas seus pagamentos e aceites", async ({
  page,
  request,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await login(page, "ricardo@example.com", "senha-segura-123");
  await expect(page.getByText(/3 moradores ativos/)).toBeVisible();
  await tab(page, "Casa");
  await page.getByRole("button", { name: "Acessos e convites" }).click();
  await page
    .getByRole("button", { name: "Lucas Fagundes · lucas@example.com" })
    .click();
  await page.getByRole("button", { name: "Gerar convite" }).click();
  const token = await page.getByText(/^[A-Za-z0-9_-]{43}$/).innerText();
  expect(token).toHaveLength(43);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copiar código" }).click();
  await expect(page.getByText("Código copiado.")).toBeVisible();
  await expect(page.getByText(/Lucas Fagundes · sem conta/)).toBeVisible();
  await page.reload();
  await logout(page);

  await page.getByRole("button", { name: "Ativar convite" }).click();
  await page.getByLabel("Código do convite").fill(token);
  await page.getByRole("button", { name: "Verificar convite" }).click();
  await expect(
    page.getByText("Lucas Fagundes · lucas@example.com"),
  ).toBeVisible();
  await page.getByLabel("Crie uma senha").fill("senha-lucas-456");
  await page.getByLabel("Confirme a senha").fill("senha-lucas-456");
  await page.getByRole("button", { name: "Ativar conta" }).click();
  await expect(page.getByRole("tab", { name: "Despesas" })).toBeVisible();
  await tab(page, "Moradores");
  await expect(page.getByText("Lucas Fagundes", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Novo morador" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Editar Lucas Fagundes" }),
  ).toHaveCount(0);
  await tab(page, "Despesas");
  await expect(page.getByRole("button", { name: "Nova despesa" })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "Ver despesa Energia elétrica" })
    .click();
  await expect(
    page.getByRole("switch", { name: "Pagamento de Lucas Fagundes" }),
  ).toBeVisible();
  await expect(
    page.getByRole("switch", { name: "Pagamento de Caio Monte Alegre" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Editar despesa" }),
  ).toHaveCount(0);
  await page
    .getByRole("switch", { name: "Pagamento de Lucas Fagundes" })
    .click();
  await expect(
    page.getByRole("switch", { name: "Pagamento de Lucas Fagundes" }),
  ).toBeChecked();
  await back(page);
  await tab(page, "Casa");
  await expect(
    page.getByRole("button", { name: "Acessos e convites" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Regras da casa" }).click();
  await expect(
    page.getByRole("button", { name: "Adicionar regra" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("switch", {
      name: "Aceite de Caio Monte Alegre para Horário de silêncio",
    }),
  ).toHaveCount(0);
  await page
    .getByRole("switch", {
      name: "Aceite de Lucas Fagundes para Horário de silêncio",
    })
    .click();
  await expect(
    page.getByRole("switch", {
      name: "Aceite de Lucas Fagundes para Horário de silêncio",
    }),
  ).toBeChecked();
  await page.reload();
  await tab(page, "Casa");
  await page.getByRole("button", { name: "Regras da casa" }).click();
  await expect(
    page.getByRole("switch", {
      name: "Aceite de Lucas Fagundes para Horário de silêncio",
    }),
  ).toBeChecked();
  await back(page);
  await logout(page);

  await login(page, "ricardo@example.com", "senha-segura-123");
  await tab(page, "Casa");
  await page.getByRole("button", { name: "Acessos e convites" }).click();
  await expect(page.getByText(/Lucas Fagundes · pagar parcela/)).toBeVisible();
  await expect(page.getByText(/Lucas Fagundes · aceitar regra/)).toBeVisible();
  const adminSession = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("@rappublica/v1/sessao")),
  );
  const forbidden = await request.patch(
    "http://localhost:3101/api/despesas/energia/parcelas/lucas",
    {
      data: { paga: false },
      headers: { Authorization: `Bearer ${adminSession.token}` },
    },
  );
  expect(forbidden.status()).toBe(403);
  await page.route("http://localhost:3101/api/**", (route) => route.abort());
  await back(page);
  await tab(page, "Início");
  await expect(
    page.getByText(/Sem conexão • exibindo cópia salva/),
  ).toBeVisible();
  await expect(page.getByText(/3 moradores ativos/)).toBeVisible();
  await page.unroute("http://localhost:3101/api/**");
  expect(errors).toEqual([]);
});
