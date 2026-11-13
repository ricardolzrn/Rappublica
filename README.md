# Rappublica

O Rappublica organiza as contas e os combinados de uma república universitária. As despesas são divididas entre os moradores participantes, cada pessoa registra o pagamento da própria parcela e confirma as regras da casa com sua conta.

## Funcionalidades

- Cadastro da primeira conta de administrador no app, login individual e perfis de **administrador** e **morador**.
- Convites para um morador já cadastrado, com prazo de 1 a 720 horas e uso único. Gerar outro convite para a mesma pessoa revoga os anteriores ainda pendentes.
- Gestão de moradores, despesas, regras e dados da república pelo administrador.
- Registro de pagamento e aceite somente pelo próprio morador, inclusive quando seu perfil é de administrador. Não há etapa de aprovação de pagamento.
- Histórico de alterações com autor, data e ação, visível ao administrador em **Casa → Acessos e convites**.
- Resumo mensal, busca e filtros de despesas, consulta de CEP pelo ViaCEP e leitura de dados já carregados quando a conexão cai.

## Tecnologias

O app usa React Native, Expo e React Navigation. A API usa Node.js, Express e SQLite nativo do Node. Preferências, sessão e cópias de leitura ficam no AsyncStorage do dispositivo.

## Como executar

Use **Node.js 22.13 ou superior**. Instale as dependências na pasta do projeto:

```bash
npm ci
```

Inicie a API:

```bash
npm run api
```

Ao abrir o app pela primeira vez, use **Primeira conta** para cadastrar o administrador. Esse cadastro fica disponível apenas enquanto não existe nenhuma conta. Se o e-mail já pertencer a um morador do banco, a conta é ligada ao cadastro existente e preserva seu histórico; caso contrário, o morador é criado. Conclua esse primeiro cadastro antes de expor uma instalação nova da API em uma rede pública.

Para instalações automatizadas, ainda é possível criar o primeiro administrador ao iniciar a API com `ADMIN_EMAIL` e `ADMIN_PASSWORD`. Nesse caso, o e-mail deve pertencer a um morador existente, e reiniciar a API não redefine a senha.

Em outro terminal, inicie o app:

```bash
npm start
```

Para abrir no navegador, use `npm run web`. A API usa a porta `3001` e o Expo normalmente usa a `8081`. O app tenta localizar a API pelo endereço do Expo. No celular, se necessário, configure o endereço na tela de login ou execute:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.10:3001/api npm start
```

Substitua o IP pelo endereço do computador na rede do celular. Em uma página HTTPS, a API também precisa estar acessível por HTTPS.

## Contas e convites

1. A primeira pessoa cria a conta de administrador em **Primeira conta**, com nome, e-mail, quarto e senha.
2. Em **Moradores**, cadastra quem ainda não consta na república.
3. Em **Casa → Acessos e convites**, escolhe um morador sem conta, o perfil e a validade do convite. O código aparece uma vez para ser compartilhado diretamente com a pessoa.
4. O morador abre **Criar conta com convite**, informa o código e cria sua senha de 12 a 128 caracteres. Sua conta é vinculada ao ID do cadastro existente; parcelas e aceites anteriores continuam associados a esse morador.
5. Depois da ativação, o morador entra com seu e-mail e senha. Um convite usado, revogado ou vencido não pode ser reutilizado.

O administrador pode consultar pagamentos e aceites de todos, mas não pode marcá-los por outras pessoas. Qualquer tentativa de alterar outro morador é recusada também pela API. O login limita tentativas repetidas por endereço de origem e e-mail. Sessões duram sete dias. Em **Casa → Sair e entrar com outra conta**, a pessoa encerra a sessão e volta à tela de entrada para usar outro e-mail. Alterar o endereço da API também encerra a sessão local.

## Dados e histórico

O banco padrão fica em `server/data/rappublica.sqlite` e não é versionado. A primeira execução cria três moradores, três despesas do mês atual e duas regras de exemplo. Reiniciar a API mantém os dados. Bancos criados antes do login recebem as tabelas e colunas novas sem recriar moradores, parcelas ou aceites. Para registros antigos, autor e data permanecem vazios porque não foram registrados na época.

Valores são armazenados em centavos. Ao dividir R$ 100,00 entre três pessoas, as parcelas ficam em R$ 33,34, R$ 33,33 e R$ 33,33. O valor ou os participantes de uma despesa com pagamentos registrados não podem ser alterados até que os próprios moradores desmarquem suas parcelas. Despesas com pagamentos e regras com aceites atuais não podem ser excluídas, para preservar os registros. Ao editar uma regra, os aceites atuais são reiniciados; os eventos anteriores continuam na auditoria.

As despesas classificadas como fixas precisam ser lançadas a cada mês. A classificação não cria cobranças automaticamente. Moradores ligados a despesas, contas ou convites não podem ser excluídos.

### Sem conexão

Depois de validar uma sessão online, telas visitadas podem exibir uma cópia de leitura, com data da última atualização. O cache é separado por conta e endereço da API. Login, ativação de convite, cadastros, edições, pagamentos e aceites precisam de conexão. O mês selecionado e o endereço do serviço ficam salvos no dispositivo.

## Estrutura

```text
src/
  components/    Componentes compartilhados
  contexts/      Sessão, preferências e acesso à API
  hooks/         Consulta de dados e cache
  navigation/    Abas e navegação entre telas
  screens/       Telas do app, login e convites
  services/      Cliente HTTP e consulta de CEP
  storage/       Persistência com AsyncStorage
server/
  auth.cjs       Login, convites, sessões, perfis e auditoria
  routes/        Rotas de moradores, despesas, regras e república
  database.cjs   Criação e migração do banco
  repository.cjs Consultas ao banco
  app.cjs        Configuração do Express
e2e/             Testes de interface
```

## API e testes

A API local fica em `http://localhost:3001/api`. `/health`, `/auth/estado`, `/auth/primeiro-acesso`, `/auth/login`, a consulta de convite e `/auth/convites/aceitar` são públicos. `/auth/primeiro-acesso` aceita cadastro somente antes da primeira conta. As demais rotas exigem `Authorization: Bearer <token>`. Criação e edição de cadastros, despesas, regras, república e convites exigem administrador. As rotas de parcelas e aceites conferem o ID do morador autenticado. Erros retornam status HTTP e `message`.

A porta e o caminho do banco podem ser definidos por `PORT` e `DB_PATH`. `DB_PATH=:memory:` cria um banco temporário. Para testar:

```bash
npm test
npm run test:e2e
npm run format:check
```

Os testes de API cobrem primeiro cadastro, troca de conta, login, perfis, permissões, convites vencidos e de uso único, auditoria e migração de dados antigos. O teste de interface usa API em memória na porta `3101` e Expo na `8082`, sem alterar o banco de desenvolvimento. Se o Chromium não estiver instalado, execute `npx playwright install chromium`.
