import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalContact, LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/termos")({
  head: () => ({ meta: [
    { title: "Termos de Serviço | RUMO" },
    { name: "description", content: "Conheça as condições de uso do RUMO e suas trilhas de programação." },
  ] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage title="Termos de Serviço">
      <section>
        <h2>1. Finalidade e condições de uso</h2>
        <p>O RUMO é um projeto escolar e gratuito de apoio ao aprendizado de programação. Ao utilizar o serviço, você concorda com estes termos. O tratamento dos dados da conta está descrito na <Link to="/privacidade">Política de Privacidade</Link>.</p>
      </section>
      <section>
        <h2>2. Sua conta</h2>
        <p>Informe dados de cadastro corretos, mantenha suas credenciais protegidas e utilize apenas contas às quais você tenha acesso autorizado. O login pode ocorrer por email e senha ou por Google, quando essa opção estiver disponível.</p>
      </section>
      <section>
        <h2>3. Conteúdo gerado por IA</h2>
        <p>Trilhas, explicações e exercícios são gerados com inteligência artificial e podem conter erros, informações desatualizadas ou exemplos incompletos. A correção automática de exercícios também pode ter limitações. Confira o conteúdo em fontes confiáveis antes de aplicá-lo em projetos reais.</p>
        <p>O RUMO é uma ferramenta complementar de estudo e não garante certificação, domínio de uma tecnologia ou resultado profissional.</p>
      </section>
      <section>
        <h2>4. Limites e uso responsável</h2>
        <p>O limite atual é de até duas solicitações de geração de trilhas por usuário por dia, com reinício à meia-noite no horário de Brasília. Uma solicitação que falhe pode consumir uma dessas oportunidades. Limites podem ser alterados conforme os recursos disponíveis.</p>
        <p>Não utilize o serviço para atividades ilegais, violar direitos de terceiros, enviar conteúdo malicioso, acessar dados de outras pessoas ou contornar os limites de uso com automação ou múltiplas contas.</p>
      </section>
      <section>
        <h2>5. Vídeos e serviços de terceiros</h2>
        <p>As recomendações de vídeos utilizam os serviços de API do YouTube. Ao utilizar essas funcionalidades, você também concorda com os <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">Termos de Serviço do YouTube</a>. Os vídeos pertencem aos respectivos criadores e podem deixar de estar disponíveis.</p>
        <p>Google, Supabase e Vercel possuem condições próprias para seus serviços. Links e conteúdos externos são oferecidos como complemento ao estudo.</p>
      </section>
      <section>
        <h2>6. Disponibilidade e alterações</h2>
        <p>O projeto pode apresentar interrupções, mudanças ou limitações por manutenção, falhas técnicas ou indisponibilidade de fornecedores. Não garantimos funcionamento contínuo. Essas condições não afastam direitos previstos na legislação aplicável.</p>
        <p>Estes termos poderão ser atualizados. Consulte a data da última revisão no início da página.</p>
      </section>
      <section>
        <h2>7. Contato</h2>
        <p>Para dúvidas, sugestões ou solicitações relacionadas à conta, utilize o <LegalContact />. Não publique credenciais nem dados pessoais nesse canal público.</p>
      </section>
    </LegalPage>
  );
}
