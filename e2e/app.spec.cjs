const { test, expect } = require("@playwright/test");
const tab = (page, name) =>
  page.getByRole("tab", { name, exact: true }).click();
const back = (page) =>
  page
    .getByRole("link", { name: /back|voltar/i })
    .first()
    .click();
test("fluxo mobile: moradores, divisão, pagamentos, regras, preferências e cache offline", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByText(/3 moradores ativos/)).toBeVisible();
  await page.screenshot({
    path: "test-results/inicio-mobile.png",
    fullPage: true,
  });
  await tab(page, "Moradores");
  await page.getByRole("button", { name: "Novo morador", exact: true }).click();
  await page.getByLabel("Nome completo", { exact: true }).fill("Ana Teste");
  await page
    .getByLabel("E-mail", { exact: true })
    .fill("ana.teste@example.com");
  await page
    .getByRole("button", { name: "Salvar morador", exact: true })
    .click();
  await expect(page.getByText("Ana Teste", { exact: true })).toBeVisible();
  await tab(page, "Despesas");
  await page.getByRole("button", { name: "Nova despesa", exact: true }).click();
  await page
    .getByLabel("Descrição", { exact: true })
    .fill("Mercado para dividir");
  await page.getByLabel("Valor total (R$)", { exact: true }).fill("100,00");
  await page
    .getByRole("switch", { name: "Incluir Ana Teste", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Salvar despesa", exact: true })
    .click();
  await expect(
    page.getByText("Mercado para dividir", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("R$ 33,34", { exact: true })).toBeVisible();
  const switches = page.getByRole("switch");
  await expect(switches).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await switches.nth(i).click();
    await expect(switches.nth(i)).toBeChecked();
    await expect(switches.nth(i)).toBeEnabled();
  }
  await expect(
    page.getByTestId("detalhe-despesa").getByText("Quitada", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/divisao-mobile.png",
    fullPage: true,
  });
  await page.reload();
  await expect(page.getByText(/4 moradores ativos/)).toBeVisible();
  await tab(page, "Despesas");
  await page
    .getByRole("button", {
      name: "Ver despesa Mercado para dividir",
      exact: true,
    })
    .click();
  await expect(
    page.getByTestId("detalhe-despesa").getByText("Quitada", { exact: true }),
  ).toBeVisible();
  await back(page);
  await tab(page, "Casa");
  await page
    .getByRole("button", { name: "Regras da casa", exact: true })
    .click();
  await page
    .getByLabel("Título da regra", { exact: true })
    .fill("Lixo reciclável");
  await page
    .getByLabel("Descrição da regra", { exact: true })
    .fill("Separar as embalagens às quartas.");
  await page
    .getByRole("button", { name: "Adicionar regra", exact: true })
    .click();
  await expect(
    page.getByText("Lixo reciclável", { exact: true }),
  ).toBeVisible();
  const aceite = page.getByRole("switch", {
    name: "Aceite de Ana Teste para Lixo reciclável",
    exact: true,
  });
  await aceite.click();
  await expect(aceite).toBeChecked();
  await back(page);
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await page
    .getByLabel("Nome da república", { exact: true })
    .fill("República Aurora");
  await page
    .getByRole("button", { name: "Salvar configurações", exact: true })
    .click();
  await expect(
    page.getByText("Dados da república salvos.", { exact: true }),
  ).toBeVisible();
  await back(page);
  await expect(
    page.getByText("República Aurora", { exact: true }),
  ).toBeVisible();
  await tab(page, "Início");
  await expect(
    page.getByText(/República Aurora · 4 moradores ativos/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mês anterior", exact: true }).click();
  const selected = await page.locator("body").innerText();
  await page.reload();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("@rappublica/v1/preferencias")),
  );
  expect(saved.mes).toMatch(/^\d{4}-\d{2}$/);
  await expect(page.getByText(/4 moradores ativos/)).toBeVisible();
  const monthText = await page
    .getByRole("button", { name: "Mês anterior", exact: true })
    .locator("..")
    .innerText();
  expect(selected).toContain(monthText.trim());
  // Falha real de rede apenas para a API; o JS e o documento continuam disponíveis.
  await page.route("http://localhost:3101/api/**", (route) => route.abort());
  await page.reload();
  await expect(
    page.getByText(/Sem conexão • exibindo cópia salva/),
  ).toBeVisible();
  await expect(
    page.getByText(/República Aurora · 4 moradores ativos/),
  ).toBeVisible();
  await tab(page, "Casa");
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Salvar configurações", exact: true }),
  ).toBeDisabled();
  await page.unroute("http://localhost:3101/api/**");
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Salvar configurações", exact: true }),
  ).toBeEnabled();
  expect(errors).toEqual([]);
});

test("edição e exclusão de despesas; erro de exclusão de morador permanece visível no diálogo", async ({
  page,
  request,
}) => {
  const response = await request.post("http://localhost:3101/api/despesas", {
    data: {
      descricao: "Conta para editar",
      valorCentavos: 1200,
      categoria: "Outros",
      tipo: "Variável",
      vencimento: new Date().toISOString().slice(0, 10),
      participantes: ["lucas", "caio"],
    },
  });
  expect(response.status()).toBe(201);
  await page.goto("/");
  await tab(page, "Despesas");
  await page
    .getByRole("button", { name: "Ver despesa Conta para editar", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Editar despesa", exact: true })
    .click();
  await page.getByLabel("Descrição", { exact: true }).fill("Conta ajustada");
  await page.getByLabel("Valor total (R$)", { exact: true }).fill("12,01");
  await page
    .getByRole("button", { name: "Salvar despesa", exact: true })
    .click();
  const detail = page.getByTestId("detalhe-despesa");
  await expect(
    detail.getByText("Conta ajustada", { exact: true }),
  ).toBeVisible();
  await expect(detail.getByText("R$ 6,01", { exact: true })).toBeVisible();
  await expect(detail.getByText("R$ 6,00", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Excluir despesa", exact: true })
    .click();
  await page.getByRole("button", { name: "Excluir", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Nova despesa", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Ver despesa Conta ajustada",
      exact: true,
    }),
  ).toHaveCount(0);
  await tab(page, "Moradores");
  await page
    .getByRole("button", { name: "Excluir Lucas Fagundes", exact: true })
    .click();
  await page.getByRole("button", { name: "Excluir", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Este morador participa de despesas.",
  );
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Editar Lucas Fagundes", exact: true }),
  ).toBeVisible();
});

test("troca de endereço da API recarrega o formulário e persiste a preferência", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await tab(page, "Casa");
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await expect(
    page.getByLabel("Nome da república", { exact: true }),
  ).not.toHaveValue("");
  const changed = await request.put("http://localhost:3101/api/republica", {
    data: { nome: "República Horizonte", cep: "", endereco: "", numero: "" },
  });
  expect(changed.status()).toBe(200);
  await page
    .getByLabel("Endereço do serviço", { exact: true })
    .fill("http://127.0.0.1:3101/api");
  await page
    .getByRole("button", { name: "Verificar e salvar conexão", exact: true })
    .click();
  await expect(
    page.getByText("Conexão verificada e endereço salvo neste dispositivo.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Nome da república", { exact: true }),
  ).toHaveValue("República Horizonte");
  await page.reload();
  await expect(page.getByText(/República Horizonte/)).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("@rappublica/v1/preferencias")),
  );
  expect(saved.apiUrl).toBe("http://127.0.0.1:3101/api");
});
