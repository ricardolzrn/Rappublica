# Rappublica

O Rappublica ajuda a organizar as contas e a convivência em repúblicas universitárias. Cada despesa pode ser dividida entre os moradores que participaram, com controle individual de pagamento e um resumo das contas do mês.

## Funcionalidades

- Cadastro de moradores, com contato e quarto.
- Despesas com categoria, vencimento, busca e filtros por mês e situação.
- Divisão de custos entre os moradores selecionados e registro dos pagamentos.
- Resumo mensal com valores pagos e pendentes.
- Regras da casa e registro de aceite por morador.
- Configuração do nome e endereço da república, com consulta de CEP pelo ViaCEP.
- Consulta dos últimos dados carregados quando não há conexão.

## Tecnologias

O app usa React Native com Expo e React Navigation. As preferências e o cache local são salvos com AsyncStorage. A API foi feita com Node.js e Express, usando SQLite para armazenar os dados.

## Como executar

É necessário ter **Node.js 22.13 ou superior**, pois o backend utiliza o SQLite nativo do Node.

Na pasta do projeto, instale as dependências:

```bash
npm ci
```

Inicie a API:

```bash
npm run api
```

Em outro terminal, na mesma pasta, inicie o app:

```bash
npm start
```

Para usar a versão web:

```bash
npm run web
```

A API usa a porta `3001`, e o Expo normalmente usa a `8081`.

### No celular

Instale o Expo Go e conecte o celular à mesma rede do computador. Com o Expo em execução, escaneie o QR Code exibido no terminal.

O app tenta encontrar a API pelo endereço do servidor Expo. Caso precise configurar manualmente, informe o IP do computador:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.10:3001/api npm start
```

Substitua o IP do exemplo pelo endereço da sua máquina. Também é possível alterar a conexão em **Casa → Configurações**. No celular, `localhost` aponta para o próprio aparelho, não para o computador.

Se a API estiver hospedada em outro servidor, use um endereço acessível pelo aparelho. Para acessar o app por uma página HTTPS, a API também precisa usar HTTPS.

## Dados e divisão das contas

O banco é criado em `server/data/rappublica.sqlite` na primeira execução, com três moradores, três despesas do mês atual e duas regras de exemplo. Os dados são mantidos ao reiniciar a API. O arquivo do banco não é versionado no Git.

Os valores são armazenados em centavos. Ao dividir R$ 100,00 entre três moradores, as parcelas ficam em R$ 33,34, R$ 33,33 e R$ 33,33. Assim, a soma sempre corresponde ao valor da conta.

Para alterar o valor ou os participantes de uma despesa com parcelas pagas, é necessário desmarcar os pagamentos antes. Moradores vinculados a despesas não podem ser excluídos, para preservar o histórico. Despesas fixas precisam ser lançadas a cada mês; essa classificação não gera cobranças automaticamente.

Ao editar uma regra da casa, os aceites anteriores são removidos para que os moradores confirmem o novo texto.

### Sem conexão

As telas já visitadas podem exibir uma cópia dos dados, com a data da última atualização. Cadastros, edições e pagamentos precisam de conexão com a API. O mês selecionado e o endereço do serviço ficam salvos no dispositivo.

## Estrutura

```text
src/
  components/    Componentes compartilhados
  contexts/      Preferências e acesso à API
  hooks/         Consulta de dados e cache
  navigation/    Abas e navegação entre telas
  screens/       Telas do app
  services/      Cliente HTTP e consulta de CEP
  storage/       Persistência com AsyncStorage
  theme/         Cores e estilos
  utils/         Formatação de valores e datas
server/
  routes/        Rotas de moradores, despesas, regras e república
  database.cjs   Criação do banco e dados iniciais
  repository.cjs Consultas ao banco
  app.cjs        Configuração do Express
  index.cjs      Inicialização da API
e2e/             Testes de interface
```

## API

O endereço local é `http://localhost:3001/api`. As rotas atendem ao resumo mensal, moradores, despesas, parcelas, regras e configurações da república. Valores monetários usam o campo `valorCentavos`, e as datas seguem o formato `AAAA-MM-DD`. Erros retornam o status HTTP e uma mensagem no campo `message`.

A porta e o caminho do banco podem ser definidos pelas variáveis `PORT` e `DB_PATH`. O valor `DB_PATH=:memory:` usa um banco temporário.

## Testes

```bash
npm test
npm run test:e2e
npm run format:check
```

Os testes de interface iniciam uma API com banco em memória na porta `3101` e o Expo na `8082`, sem alterar o banco de desenvolvimento. Se não houver Chromium disponível, instale o navegador com `npx playwright install chromium`. Capturas de tela e arquivos de diagnóstico ficam em `test-results/`.

Para gerar os bundles Android e iOS:

```bash
npx expo export --platform android --platform ios --output-dir dist/native
```

## Estado atual

O app trabalha com uma única república e ainda não possui login ou permissões por morador. Os pagamentos e aceites são registros feitos por quem opera o aplicativo. Antes de hospedar o serviço com dados reais, é necessário implementar autenticação e controle de acesso.
