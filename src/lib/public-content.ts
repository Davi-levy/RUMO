export type DemoTopic = "python" | "react" | "sql";

export interface DemoLesson {
  id: DemoTopic;
  technology: string;
  title: string;
  description: string;
  goal: string;
  objectives: string[];
  concepts: string[];
  language: string;
  code: string;
  walkthrough: string;
  commonMistake: string;
  question: string;
  choices: { id: string; text: string }[];
  correctId: string;
  hint: string;
  explanation: string;
  tutor: { question: string; answer: string }[];
  table?: { headers: string[]; rows: string[][] };
}

// Conteúdo público fixo e revisado. Não é carregado do banco de exercícios privados.
export const demoLessons: Record<DemoTopic, DemoLesson> = {
  python: {
    id: "python",
    technology: "Python",
    title: "Uma mensagem, suas primeiras variáveis.",
    description:
      "Entenda como guardar um nome e construir uma mensagem em Python.",
    goal: "Quero criar um bot para Discord com Python. Por onde começo?",
    objectives: [
      "Reconhecer uma variável e o valor que ela guarda.",
      "Ler uma mensagem construída com uma f-string.",
    ],
    concepts: [
      "Uma variável associa um nome a um valor. Na primeira linha, nome recebe o texto Ada. As aspas delimitam o texto; elas não fazem parte do nome guardado. Escolher nomes claros ajuda a entender a intenção do programa quando ele começa a crescer.",
      "Uma f-string é um texto com a letra f antes das aspas. Dentro dele, as chaves indicam onde inserir um valor. Ao encontrar {nome}, Python consulta a variável e coloca Ada nessa posição. A expressão à direita do sinal de igual é avaliada antes de seu resultado ser guardado em mensagem.",
      "print exibe um valor na saída do programa. Este é um primeiro passo para trabalhar com mensagens: aqui, a saída é o terminal. Conectar um bot ao Discord exige outras etapas, como configurar eventos e permissões. O exemplo abaixo não envia mensagens para nenhum serviço.",
    ],
    language: "python",
    code: 'nome = "Ada"\nmensagem = f"Olá, {nome}!"\nprint(mensagem)',
    walkthrough:
      "Leia de cima para baixo: guarde Ada em nome, construa Olá, Ada! e exiba a mensagem. O espaço depois da vírgula e a exclamação vêm do texto da f-string. Agora tente prever a saída antes de olhar as alternativas.",
    commonMistake:
      'Sem o f antes das aspas, "Olá, {nome}!" seria um texto comum, com as chaves aparecendo literalmente. Outra diferença importante: = atribui um valor; == compara dois valores.',
    question: "Qual texto este programa exibe?",
    choices: [
      { id: "a", text: "Olá, {nome}!" },
      { id: "b", text: "Olá, Ada!" },
      { id: "c", text: "Olá, nome!" },
      { id: "d", text: "Ada" },
    ],
    correctId: "b",
    hint: "O f antes das aspas faz Python substituir o que está entre chaves pelo valor da variável.",
    explanation:
      "A variável nome guarda Ada. Na f-string, {nome} é substituído por esse valor. Por isso, print exibe Olá, Ada!, sem as aspas.",
    tutor: [
      {
        question: "Para que serve o f antes das aspas?",
        answer:
          'Ele indica uma f-string. Python insere os valores das expressões entre chaves dentro do texto. Por exemplo: com cor = "azul", f"Cor: {cor}" produz Cor: azul.',
      },
      {
        question: "E se eu trocar Ada por outro nome?",
        answer:
          "Se você alterar a primeira linha antes de executar o programa inteiro, a mensagem usará o novo nome. A variável mensagem guarda o texto construído naquele momento; ela não acompanha automaticamente mudanças feitas em nome depois disso.",
      },
      {
        question: "Esse código já funciona como um bot?",
        answer:
          "Ele só mostra uma mensagem no terminal. Um bot precisa também se conectar ao Discord e responder a eventos. Dominar variáveis e textos ajuda a entender essas próximas etapas.",
      },
    ],
  },
  react: {
    id: "react",
    technology: "React",
    title: "Um clique que muda a interface.",
    description:
      "Veja como um estado guarda o número de cliques e atualiza um componente.",
    goal: "Como fazer um contador de cliques em React?",
    objectives: [
      "Identificar o valor inicial de um estado.",
      "Relacionar um clique à atualização do componente.",
    ],
    concepts: [
      "Um componente React descreve uma parte da interface. Contador é uma função que retorna o botão. O texto entre as tags mistura a palavra Cliques com o valor da expressão cliques, colocada entre chaves no JSX.",
      "useState cria um estado: um valor que React mantém entre renderizações. O zero passado a useState é o valor inicial. cliques permite ler o estado atual e setCliques solicita uma atualização. Uma variável comum, sozinha, não oferece esse mesmo comportamento de atualização da interface.",
      "onClick recebe uma função para executar quando o botão é clicado. O código usa uma atualização funcional: o argumento atual representa o estado que React deve usar para calcular o próximo. A função devolve atual + 1. Este exemplo pressupõe uma aplicação React configurada; aqui vamos apenas ler o código, sem executá-lo.",
    ],
    language: "jsx",
    code: 'import { useState } from "react";\n\nexport function Contador() {\n  const [cliques, setCliques] = useState(0);\n\n  return (\n    <button onClick={() => setCliques(atual => atual + 1)}>\n      Cliques: {cliques}\n    </button>\n  );\n}',
    walkthrough:
      "Na primeira renderização, o botão mostra Cliques: 0. Quando a função de onClick é chamada, ela solicita a soma de uma unidade. React renderiza novamente o componente com o estado atualizado. Observe que a função é passada ao evento: ela não é chamada enquanto o JSX está sendo criado.",
    commonMistake:
      "Alterar diretamente uma variável não substitui a função de atualização do estado. Também evite chamar setCliques diretamente durante a renderização: nesse caso, queremos atualizar o valor apenas quando ocorrer o clique.",
    question: "Após um único clique, o que o botão passa a mostrar?",
    choices: [
      { id: "a", text: "Cliques: 0" },
      { id: "b", text: "Cliques: atual" },
      { id: "c", text: "Cliques: 1" },
      { id: "d", text: "Cliques: 2" },
    ],
    correctId: "c",
    hint: "O estado começa em zero. Cada execução da função do evento acrescenta uma unidade.",
    explanation:
      "O primeiro clique transforma o estado 0 em 1. React atualiza o componente, e a expressão {cliques} passa a mostrar 1.",
    tutor: [
      {
        question: "Por que usar useState?",
        answer:
          "Ele permite guardar um valor entre renderizações e solicitar que a interface seja atualizada. É útil para informações que mudam, como um contador, a abertura de um menu ou o texto de um campo.",
      },
      {
        question: "O que significa atual => atual + 1?",
        answer:
          "É uma função que recebe o estado anterior relevante para aquela atualização e devolve o próximo. Neste exemplo, ela sempre acrescenta um. Esse formato também ajuda quando várias atualizações são enfileiradas.",
      },
      {
        question: "Por que a função está dentro de onClick?",
        answer:
          "Assim, a atualização ocorre em resposta ao clique. Passar uma função para onClick é diferente de executar a atualização enquanto o componente está sendo renderizado.",
      },
    ],
  },
  sql: {
    id: "sql",
    technology: "SQL",
    title: "Encontre as linhas que importam.",
    description:
      "Leia uma consulta simples e descubra como filtrar dados com WHERE.",
    goal: "Como consultar apenas os alunos com 80 pontos ou mais?",
    objectives: [
      "Distinguir a coluna selecionada da condição de filtro.",
      "Interpretar uma comparação com >= em uma consulta.",
    ],
    concepts: [
      "Uma tabela organiza dados em linhas e colunas. Neste exemplo fictício, alunos possui duas colunas: nome e pontos. Cada linha representa uma pessoa. Para acompanhar a consulta, use somente os três registros mostrados abaixo; não é necessário acessar um banco de dados.",
      "SELECT define quais colunas estarão no resultado. FROM informa a tabela consultada. WHERE estabelece uma condição para selecionar linhas. Aqui, pontos >= 80 inclui valores maiores que 80 e também o próprio 80. A comparação usa a coluna pontos, mesmo que essa coluna não seja exibida pelo SELECT.",
      "ORDER BY nome pede que o resultado seja ordenado pelo nome, em ordem crescente por padrão. Não confunda filtrar linhas com escolher colunas: WHERE decide quais registros permanecem, enquanto SELECT decide quais informações desses registros serão apresentadas.",
    ],
    table: {
      headers: ["nome", "pontos"],
      rows: [
        ["Ana", "70"],
        ["Bea", "80"],
        ["Caio", "95"],
      ],
    },
    language: "sql",
    code: "SELECT nome\nFROM alunos\nWHERE pontos >= 80\nORDER BY nome;",
    walkthrough:
      "Compare cada pontuação com 80. Ana tem 70 e fica de fora. Bea tem exatamente 80 e permanece. Caio tem 95 e também permanece. O SELECT apresenta somente os nomes, e ORDER BY os coloca em ordem crescente. A consulta lê os dados; ela não altera a tabela.",
    commonMistake:
      "Trocar >= por > muda o filtro: Bea deixaria de aparecer. Outra confusão comum é pensar que SELECT nome impede usar pontos no filtro. A condição pode consultar uma coluna da tabela sem incluí-la no resultado.",
    question: "Quais nomes aparecem no resultado desta consulta?",
    choices: [
      { id: "a", text: "Ana, Bea e Caio" },
      { id: "b", text: "Bea e Caio" },
      { id: "c", text: "Apenas Caio" },
      { id: "d", text: "Apenas Bea" },
    ],
    correctId: "b",
    hint: "O operador >= inclui o valor que está no limite da comparação.",
    explanation:
      "Bea tem 80 pontos e Caio tem 95. Ambos atendem a pontos >= 80; Ana, com 70, não atende. O resultado apresenta os nomes Bea e Caio, nessa ordem.",
    tutor: [
      {
        question: "Qual a diferença entre > e >=?",
        answer:
          "> significa maior que, sem incluir o limite. >= significa maior ou igual. Se o limite for 10, o valor 10 passa no segundo filtro, mas não no primeiro.",
      },
      {
        question: "Posso filtrar uma coluna que não aparece no resultado?",
        answer:
          "Sim. Nesta consulta, pontos é usado para selecionar as linhas, e nome é a coluna apresentada. WHERE e SELECT têm funções diferentes.",
      },
      {
        question: "Essa consulta muda os dados?",
        answer:
          "Não. Este SELECT consulta a tabela. Comandos como UPDATE e DELETE têm outras finalidades e exigem cuidado porque podem modificar dados.",
      },
    ],
  },
};

interface PublicFaqItem {
  id: string;
  question: string;
  answer: string;
  link?: { href: string; label: string };
}

export const publicFaqs: PublicFaqItem[] = [
  {
    id: "comecar",
    question: "Preciso saber programar para começar?",
    answer:
      "Não. Você pode escolher o nível iniciante e descrever seu objetivo. Os níveis intermediário e avançado atendem a quem já tem alguma base.",
  },
  {
    id: "codigo-aberto",
    question: "O projeto e o site do RUMO são de código aberto?",
    answer:
      "Sim! O código do projeto e do site está disponível no GitHub. Você pode conhecer como o RUMO foi construído, acompanhar as mudanças e contribuir com sugestões e melhorias.",
    link: {
      href: "https://github.com/Davi-levy/RUMO",
      label: "Ver o código no GitHub",
    },
  },
  {
    id: "temas",
    question: "O que posso estudar no RUMO?",
    answer:
      "Linguagens, frameworks e assuntos relacionados a programação e desenvolvimento. Um pedido específico, como criar um bot com Python, ajuda a dar direção à trilha. Temas fora desse escopo são recusados.",
  },
  {
    id: "limites",
    question: "Quais são os limites de uso?",
    answer:
      "Atualmente, cada conta tem até 2 gerações de trilha e 5 avaliações de tema por dia. O tutor Atlas tem um limite separado de 5 mensagens por dia. Os limites são renovados à meia-noite no horário de Brasília. Gerações interrompidas e mensagens enviadas ao tutor contam no limite, inclusive quando ocorre uma falha. Temas recusados não gastam uma geração de trilha.",
  },
  {
    id: "atlas",
    question: "Como funciona o Rumo Atlas? Ele é baseado em quê?",
    answer:
      "O Rumo Atlas é o assistente de aprendizagem do RUMO, baseado no Gemini, a inteligência artificial do Google. Ele combina esse modelo com orientações educacionais do projeto e o contexto do módulo aberto, do histórico da conversa e das suas respostas recentes aos exercícios. Assim, pode explicar conceitos, esclarecer dúvidas e oferecer pistas durante o estudo. As respostas podem conter erros. Nesta demonstração pública, as perguntas e respostas são fixas e não consultam a IA.",
  },
  {
    id: "videos",
    question: "As trilhas também têm vídeos?",
    answer:
      "Sim. A seção Vídeos de apoio busca conteúdos complementares no YouTube relacionados à trilha. Nem sempre há resultados adequados ou disponíveis. A leitura dos módulos e os exercícios continuam disponíveis mesmo sem os vídeos.",
  },
  {
    id: "custo",
    question: "Preciso pagar para usar?",
    answer:
      "O RUMO está disponível sem cobrança nesta versão do projeto, com limites diários de uso. Não é necessário informar cartão para criar conta.",
  },
  {
    id: "precisao",
    question: "O conteúdo e os gabaritos podem ter erros?",
    answer:
      "Sim. As trilhas são geradas por IA. A correção objetiva aplica o gabarito salvo, mas não garante a precisão técnica desse gabarito. Confira informações importantes e use Reportar exercício com erro quando encontrar um problema.",
  },
  {
    id: "conta",
    question: "Preciso criar conta para usar o RUMO?",
    answer:
      "Sim. Para gerar suas trilhas, guardar respostas e usar o tutor Atlas, entre ou crie uma conta com email e senha ou com Google.",
  },
];
