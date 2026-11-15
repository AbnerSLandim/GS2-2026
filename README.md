# AlertaClima — Big Data

Módulo de Big Data e Visualização do projeto **AlertaClima**, desenvolvido para a Global Solution FIAP 2026/2.

O objetivo deste módulo é coletar, armazenar, processar e analisar dados meteorológicos e ocorrências por região, permitindo acompanhar previsões climáticas e identificar níveis experimentais de risco.

## 1. Tecnologias utilizadas

- **Python:** ingestão e processamento dos dados.
- **Pandas:** tratamento e organização dos dados.
- **Oracle Database:** armazenamento das informações.
- **SQL Developer:** execução e administração das consultas SQL.
- **Open-Meteo API:** obtenção de previsões meteorológicas.
- **Streamlit:** interface web do dashboard.
- **Plotly:** criação de gráficos e visualizações.
- **python-oracledb:** conexão entre Python e Oracle.
- **python-dotenv:** gerenciamento das variáveis de ambiente.

## 2. Estrutura do projeto

```text
big-data/
│
├── .venv/
│
├── .env
├── .gitignore
├── README.md
│
├── ingestao_climatica.py
├── dashboard.py
│
├── 04_indicadores.sql
├── 05_dashboard.sql
├── 06_funcoes_analiticas.sql
│
└── processamento/
    └── calcular_risco.py
```

## 3. Pré-requisitos

Antes de executar o projeto, é necessário ter:

- Python 3 instalado.
- Oracle Database em execução.
- SQL Developer ou outro cliente Oracle.
- Acesso à internet para consultar a API Open-Meteo.

O banco Oracle deve possuir as tabelas:

- `REGIOES`
- `DADOS_CLIMATICOS`
- `OCORRENCIAS`
- `ANALISE_RISCO`

As cinco regiões monitoradas são:

- Centro
- Mooca
- Ipiranga
- Vila Mariana
- Butanta

## 4. Configuração do ambiente Python

Acesse a pasta do projeto:

```bash
cd ~/Projetos/AlertaClima/big-data
```

Crie o ambiente virtual:

```bash
python3 -m venv .venv
```

Ative o ambiente:

```bash
source .venv/bin/activate
```

Instale as dependências:

```bash
pip install pandas requests oracledb python-dotenv streamlit plotly
```

## 5. Configuração da conexão Oracle

Crie um arquivo chamado `.env` na raiz da pasta `big-data`.

Configure as credenciais de conexão:

```env
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_DSN=localhost:1521/XEPDB1
```

Substitua os valores pelos dados da conexão Oracle utilizada no SQL Developer.

**Importante:** não compartilhe o arquivo `.env` e não o envie para o GitHub.

## 6. Execução do projeto

A execução do módulo segue três etapas principais.

### Etapa 1 — Ingestão dos dados meteorológicos

Execute:

```bash
python ingestao_climatica.py
```

O script realiza as seguintes operações:

1. Consulta a API Open-Meteo.
2. Obtém previsões meteorológicas para os bairros monitorados.
3. Organiza os dados utilizando Pandas.
4. Realiza o tratamento dos registros.
5. Estabelece conexão com o Oracle.
6. Insere ou atualiza os registros na tabela `DADOS_CLIMATICOS`.

São coletadas informações como:

- Precipitação.
- Velocidade do vento.
- Temperatura.
- Umidade.
- Data e horário da previsão.

A ingestão utiliza a operação `MERGE` para evitar duplicações de previsões para a mesma região e horário.

### Etapa 2 — Cálculo dos níveis de risco

Execute:

```bash
python processamento/calcular_risco.py
```

O script consulta as previsões meteorológicas das próximas 24 horas e o histórico de ocorrências de cada região.

A pontuação experimental considera três fatores:

| Fator | Peso |
|---|---:|
| Chuva prevista | 50% |
| Velocidade máxima do vento | 20% |
| Histórico de ocorrências | 30% |

A pontuação final é calculada por:

```text
Risco = (Chuva × 0,50)
      + (Vento × 0,20)
      + (Histórico × 0,30)
```

Classificação utilizada:

| Pontuação | Nível |
|---|---|
| Menor que 25 | BAIXO |
| 25 até menor que 50 | MODERADO |
| 50 até menor que 75 | ALTO |
| 75 ou superior | CRITICO |

O resultado é armazenado na tabela `ANALISE_RISCO`, preservando o histórico das análises realizadas.

### Etapa 3 — Execução do dashboard

Com o ambiente virtual ativado, execute:

```bash
streamlit run dashboard.py
```

O dashboard será disponibilizado localmente, normalmente em:

```text
http://localhost:8501
```

A interface apresenta:

- Indicadores gerais.
- Quantidade de bairros monitorados e analisados.
- Total de ocorrências cadastradas.
- Maior precipitação prevista.
- Ranking de risco por bairro.
- Evolução da pontuação de risco.
- Comparação com análises anteriores.
- Previsão de chuva e temperatura.
- Histórico de ocorrências por gravidade.
- Tabela detalhada dos bairros.

O usuário pode filtrar os dados por bairro, nível de risco e período de previsão (24 ou 48 horas).

## 7. Scripts SQL

Os arquivos SQL complementam o processamento e as visualizações.

| Arquivo | Finalidade |
|---|---|
| `04_indicadores.sql` | Consultas de indicadores e análises gerais |
| `05_dashboard.sql` | Consultas utilizadas como referência para o dashboard |
| `06_funcoes_analiticas.sql` | Ranking, evolução, correlação e análise de ocorrências |

Os scripts podem ser executados individualmente pelo SQL Developer.

O arquivo `06_funcoes_analiticas.sql` utiliza funções analíticas do Oracle, como:

- `ROW_NUMBER()`
- `RANK()`
- `LAG()`
- `CORR()`

## 8. Fluxo de processamento

O funcionamento do módulo pode ser representado pelo seguinte fluxo:

```text
       API Open-Meteo
              |
              v
     Ingestão com Python
              |
              v
       Tratamento Pandas
              |
              v
        Oracle Database
              |
              v
       Cálculo de risco
              |
              v
      Tabela ANALISE_RISCO
              |
              v
       Dashboard Streamlit
              |
              v
     Visualização e análise
```

## 9. Observações importantes

- As previsões meteorológicas são obtidas por meio da API Open-Meteo.
- As análises de risco são experimentais e utilizam pesos definidos para o projeto acadêmico.
- Os registros de ocorrências atualmente cadastrados são ilustrativos e não devem ser apresentados como dados históricos oficiais.
- A pontuação de risco não representa um alerta oficial da Defesa Civil ou de órgãos meteorológicos.
- O dashboard consulta diretamente o Oracle Database.
- A execução da ingestão e do cálculo de risco atualiza os dados que serão apresentados no dashboard.

## 10. Segurança e boas práticas

- Credenciais armazenadas em arquivo `.env`.
- Arquivo `.env` excluído do versionamento.
- Ambiente virtual Python isolado.
- Consultas SQL parametrizadas no acesso pelo Python.
- Conexões e cursores Oracle fechados após as consultas.

Exemplo de `.gitignore`:

```gitignore
.venv/
.env
__pycache__/
*.pyc
```

## 11. Resumo dos comandos

Com o ambiente já configurado:

```bash
# Acessar o projeto
cd ~/Projetos/AlertaClima/big-data

# Ativar ambiente virtual
source .venv/bin/activate

# Coletar previsões meteorológicas
python ingestao_climatica.py

# Calcular níveis de risco
python processamento/calcular_risco.py

# Iniciar dashboard
streamlit run dashboard.py
```

---

**AlertaClima — Não basta prever o tempo. Precisamos antecipar os riscos.**

Projeto acadêmico desenvolvido para a FIAP Global Solution 2026/2.