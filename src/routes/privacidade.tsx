import { createFileRoute } from "@tanstack/react-router";
import { LegalContact, LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/privacidade")({
  head: () => ({ meta: [
    { title: "Política de Privacidade | RUMO" },
    { name: "description", content: "Saiba como o RUMO utiliza dados da conta, trilhas de estudo e serviços externos." },
  ] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage title="Política de Privacidade">
      <section>
        <h2>1. Sobre o RUMO</h2>
        <p>O RUMO é um projeto escolar que ajuda a estudar programação por meio de trilhas, conteúdos e exercícios gerados com inteligência artificial. A equipe responsável pelo projeto utiliza os dados descritos aqui para oferecer essas funcionalidades.</p>
      </section>
      <section>
        <h2>2. Dados que utilizamos</h2>
        <ul>
          <li>Dados da conta: nome informado, email e identificador do usuário. A autenticação e as credenciais de acesso são gerenciadas pelo Supabase Auth.</li>
          <li>Quando você utiliza o login Google, recebemos os dados básicos autorizados, como nome, email e foto de perfil, para identificar a conta e apresentá-la no site. Não recebemos a senha da sua conta Google.</li>
          <li>Dados de estudo: temas e níveis escolhidos, trilhas, módulos, respostas dos exercícios e progresso.</li>
          <li>Registros de solicitações de geração, usados para aplicar o limite diário, além de dados técnicos de acesso que podem ser tratados pelos provedores de hospedagem e autenticação para operação e segurança.</li>
        </ul>
        <p>Não inclua dados pessoais sensíveis, senhas ou chaves de API nos temas das trilhas nem nas respostas dos exercícios.</p>
      </section>
      <section>
        <h2>3. Finalidades e serviços externos</h2>
        <p>Utilizamos os dados para autenticar usuários, guardar estudos, acompanhar o progresso, gerar conteúdo e controlar o uso do serviço. Não vendemos dados pessoais.</p>
        <ul>
          <li><strong>Supabase:</strong> autenticação e armazenamento dos dados da conta, trilhas, respostas e progresso.</li>
          <li><strong>Google Gemini:</strong> recebe os temas, níveis e instruções de geração necessários para produzir conteúdos e exercícios. Não enviamos deliberadamente o nome, email ou senha da conta nos pedidos de geração.</li>
          <li><strong>Vercel:</strong> hospeda o site e executa suas funções de servidor, podendo processar informações técnicas das requisições.</li>
          <li><strong>YouTube API Services:</strong> usamos assuntos das trilhas para buscar recomendações e armazenamos temporariamente dados públicos dos vídeos, como identificador, título e canal. Não acessamos sua conta, inscrições ou histórico do YouTube.</li>
        </ul>
        <p>Ao carregar miniaturas ou reproduzir vídeos, seu navegador se conecta aos serviços do Google/YouTube. Esses serviços podem tratar dados técnicos, usar cookies e apresentar publicidade conforme suas próprias políticas. Também carregamos fontes fornecidas pelo Google Fonts e Fontshare.</p>
        <p>Os fornecedores podem processar dados em outros países. Consulte a <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Política de Privacidade do Google</a>, a <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Política de Privacidade do Supabase</a> e a <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Política de Privacidade da Vercel</a>.</p>
      </section>
      <section>
        <h2>4. Armazenamento e segurança</h2>
        <p>O navegador utiliza armazenamento local para manter a sessão de login. Não adicionamos ferramentas próprias de publicidade ou análise de comportamento. Serviços externos podem utilizar suas próprias tecnologias de armazenamento.</p>
        <p>Os dados de estudo ficam associados à sua conta, com regras de acesso destinadas a separar os dados dos usuários. Mantemos os dados necessários à operação da conta; solicitações de exclusão serão avaliadas pela equipe, considerando obrigações aplicáveis e necessidades de segurança. Registros técnicos e cópias de segurança também seguem os prazos dos respectivos fornecedores.</p>
        <p>Adotamos medidas de proteção, mas nenhum sistema oferece segurança absoluta.</p>
      </section>
      <section>
        <h2>5. Seus dados e contato</h2>
        <p>Você pode solicitar informações, acesso, correção ou exclusão dos dados da sua conta pelo <LegalContact />. Podemos precisar confirmar que a conta pertence a você antes de atender a solicitação.</p>
        <p>Não publique dados pessoais, senhas ou tokens em mensagens públicas no GitHub. Use o canal para pedir orientação sobre como encaminhar sua solicitação de forma reservada.</p>
        <p>Você pode revogar a conexão Google nas <a href="https://myaccount.google.com/connections" target="_blank" rel="noopener noreferrer">configurações da sua conta Google</a>. Revogar essa conexão não apaga automaticamente os dados já armazenados no RUMO.</p>
      </section>
      <section>
        <h2>6. Atualizações</h2>
        <p>Esta política poderá ser atualizada quando o funcionamento do projeto mudar. A data no início da página identifica a última revisão.</p>
      </section>
    </LegalPage>
  );
}
