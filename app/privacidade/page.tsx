import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Política de Privacidade — KN Internet",
  description: "Política de Privacidade e Proteção de Dados da KN Internet, em conformidade com a LGPD (Lei nº 13.709/2018).",
  robots: { index: true, follow: true },
}

const ATUALIZACAO = "25 de julho de 2026"

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-heading text-[19px] font-extrabold mb-3" style={{ color: "var(--foreground)" }}>
        {n}. {title}
      </h2>
      <div className="text-[15px] leading-relaxed space-y-3" style={{ color: "var(--foreground)" }}>
        {children}
      </div>
    </section>
  )
}

export default function PrivacidadePage() {
  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-8 pb-16">
      <div className="page-bg"><div className="dot-grid" /></div>

      <header className="w-full max-w-[760px] flex flex-col items-center py-6 pb-8 text-center gap-3">
        <Image src="/logo-kn-internet.jpeg" alt="KN Internet" width={160} height={96} className="object-contain" priority />
        <span className="text-[12px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
          style={{ background: "rgba(249,115,22,0.1)", color: "var(--primary)" }}>
          Política de Privacidade
        </span>
      </header>

      <main className="w-full max-w-[760px] bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="p-6 md:p-10">
          <p className="text-[13px] mb-8" style={{ color: "var(--muted-foreground)" }}>
            Última atualização: {ATUALIZACAO}
          </p>

          <p className="text-[15px] leading-relaxed mb-8" style={{ color: "var(--foreground)" }}>
            Esta Política de Privacidade descreve como a KN Internet trata os dados pessoais coletados por meio
            do seu formulário de cadastro, em conformidade com a Lei Geral de Proteção de Dados
            (Lei nº 13.709/2018 — LGPD). Ao preencher o formulário, você declara estar ciente das condições
            aqui descritas.
          </p>

          <Section n="1" title="Controladora dos dados">
            <p>
              A controladora responsável pelo tratamento dos seus dados pessoais é:
            </p>
            <div className="rounded-lg p-4 mt-1" style={{ background: "var(--muted)" }}>
              <p><strong>LARO Serviços de Informática e Telecomunicações LTDA</strong> (KN Internet)</p>
              <p>CNPJ: 47.311.331/0001-06</p>
              <p>Rua Haddock Lobo, nº 210, Sala 204 — Tijuca</p>
              <p>Rio de Janeiro/RJ — CEP 20260-142</p>
            </div>
          </Section>

          <Section n="2" title="Encarregado pelo tratamento de dados (DPO)">
            <p>
              Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento dos seus dados,
              entre em contato com nosso Encarregado de Proteção de Dados pelo e-mail:{" "}
              <a href="mailto:privacidade@kninternet.com.br" style={{ color: "var(--primary)", fontWeight: 600 }}>
                privacidade@kninternet.com.br
              </a>
            </p>
          </Section>

          <Section n="3" title="Dados que coletamos">
            <p>Ao preencher o formulário de cadastro, coletamos:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Dados de identificação:</strong> nome completo ou razão social, CPF ou CNPJ.</li>
              <li><strong>Dados de contato:</strong> e-mail e telefone/WhatsApp.</li>
              <li><strong>Dados de endereço:</strong> CEP, logradouro, número, complemento, bairro, cidade e estado do local de instalação.</li>
              <li><strong>Dados do plano:</strong> velocidade contratada, valor e dia de vencimento escolhido.</li>
              <li><strong>Dados de navegação:</strong> informações técnicas coletadas por cookies e tecnologias similares (ver seção 7).</li>
            </ul>
          </Section>

          <Section n="4" title="Finalidade e base legal do tratamento">
            <p>Seus dados são tratados para as seguintes finalidades:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Execução do cadastro e do contrato de prestação de serviço</strong> — base legal:
                execução de contrato e procedimentos preliminares (art. 7º, V, LGPD).
              </li>
              <li>
                <strong>Contato pela nossa equipe de atendimento</strong> para concluir a contratação e agendar a instalação —
                base legal: execução de contrato (art. 7º, V, LGPD).
              </li>
              <li>
                <strong>Cobrança e faturamento</strong> — base legal: execução de contrato e cumprimento de obrigação legal
                (art. 7º, II e V, LGPD).
              </li>
              <li>
                <strong>Métricas e melhoria da nossa comunicação e campanhas</strong> — base legal: consentimento
                (art. 7º, I, LGPD), fornecido por meio do banner de cookies.
              </li>
            </ul>
          </Section>

          <Section n="5" title="Compartilhamento de dados">
            <p>
              Seus dados podem ser compartilhados com os seguintes terceiros, exclusivamente para as finalidades
              descritas nesta política:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>SGP (TSMX Tecnologia):</strong> sistema de gestão de provedores utilizado para gerenciar seu cadastro e contrato.</li>
              <li><strong>Meta (Facebook/Instagram) e Google:</strong> plataformas de análise e publicidade, mediante seu consentimento, para medição de campanhas.</li>
              <li><strong>Plataforma de atendimento (chat do site):</strong> ferramenta utilizada para responder às mensagens que você nos envia pelo chat.</li>
            </ul>
            <p>
              Não vendemos nem cedemos seus dados pessoais a terceiros para fins não relacionados à prestação do serviço.
            </p>
          </Section>

          <Section n="6" title="Retenção e eliminação">
            <p>
              Os dados de clientes ativos são mantidos durante toda a vigência do contrato e pelo prazo legal
              exigido após seu término. Os dados de pessoas que preencheram o formulário mas
              <strong> não concluíram a contratação</strong> são mantidos por até <strong>12 meses</strong> e,
              após esse período, são eliminados ou anonimizados.
            </p>
          </Section>

          <Section n="7" title="Cookies e tecnologias de rastreamento">
            <p>
              Utilizamos cookies e tecnologias similares (Google Analytics, Google Tag Manager e Meta Pixel)
              para entender como você utiliza nosso site e melhorar nossas campanhas. Os cookies de análise e
              marketing só são ativados <strong>mediante o seu consentimento</strong>, coletado por meio do banner
              exibido ao acessar o site. Você pode revogar o consentimento a qualquer momento nas configurações do seu navegador.
            </p>
          </Section>

          <Section n="8" title="Seus direitos como titular">
            <p>Nos termos do art. 18 da LGPD, você tem direito a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Confirmar a existência de tratamento dos seus dados;</li>
              <li>Acessar seus dados;</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei;</li>
              <li>Solicitar a portabilidade dos dados;</li>
              <li>Revogar o consentimento;</li>
              <li>Ser informado sobre com quem seus dados foram compartilhados.</li>
            </ul>
            <p>
              Para exercer qualquer desses direitos, envie um e-mail para{" "}
              <a href="mailto:privacidade@kninternet.com.br" style={{ color: "var(--primary)", fontWeight: 600 }}>
                privacidade@kninternet.com.br
              </a>.
            </p>
          </Section>

          <Section n="9" title="Segurança">
            <p>
              Adotamos medidas técnicas e administrativas para proteger seus dados contra acessos não autorizados
              e situações de destruição, perda, alteração ou difusão indevida, incluindo transmissão criptografada (HTTPS)
              e controle de acesso aos sistemas.
            </p>
          </Section>

          <Section n="10" title="Alterações desta política">
            <p>
              Esta política pode ser atualizada a qualquer momento. A data da última atualização é indicada no topo
              deste documento. Recomendamos a consulta periódica.
            </p>
          </Section>

          <div className="mt-10 pt-6 border-t border-border text-center">
            <Link href="/" className="text-[14px] font-semibold" style={{ color: "var(--primary)" }}>
              ← Voltar ao cadastro
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}