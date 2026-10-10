export function buildEmailClienteHtml({
  nome,
  plano_velocidade,
  plano_preco,
  vencimento,
  cidade_cobertura,
  bairro_cobertura,
  marca = 'kn',
  taxa_instalacao,
}: {
  nome: string
  plano_velocidade: string
  plano_preco: string
  vencimento: string
  cidade_cobertura: string
  bairro_cobertura: string
  /** 'viva': POPs da Viva Net (remetente, visual e rodapé da MJP TELECOM). */
  marca?: 'kn' | 'viva'
  taxa_instalacao?: string
}): string {
  const primeiroNome = nome.trim().split(' ')[0]
  const year = new Date().getFullYear()

  const viva = marca === 'viva'
  const M = viva
    ? {
        nome: 'Viva Net', titulo: 'Viva Net', cor: '#4043B1', escuro: '#16184A',
        logo: 'https://vivanettelecom.com.br/marca/vivanet-logo.png', logoLargura: 200,
        contato: 'Qualquer dúvida, fale com a gente pelo Vivanet Chat: <a href="https://vivanettelecom.com.br/chat" style="color:#4043B1;font-weight:700;">vivanettelecom.com.br/chat</a>.',
        rodape: `© ${year} Viva Net Telecom · MJP TELECOM LTDA · CNPJ 34.676.479/0001-00`,
        taxa: taxa_instalacao ?? 'R$ 160,00',
      }
    : {
        nome: 'KN Internet', titulo: 'KN Internet', cor: '#f07800', escuro: '#0d1f3c',
        logo: 'https://cadastro.kninternet.com.br/assets/logo_kninternet.png', logoLargura: 180,
        contato: 'Qualquer dúvida, estamos à disposição pelo WhatsApp.',
        rodape: `© ${year} KN Internet · Fibra Óptica no Rio de Janeiro`,
        taxa: taxa_instalacao ?? 'R$ 150,00 via Pix',
      }
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${primeiroNome}, seu cadastro ${M.titulo} foi recebido!</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f2f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#ffffff;padding:20px 40px 12px 40px;text-align:center;">
              <img src="${M.logo}" alt="${M.nome}" width="${M.logoLargura}"
                style="display:block;margin:0 auto;height:auto;border:0;">
            </td>
          </tr>

          <!-- FAIXA -->
          <tr>
            <td style="background-color:${M.cor};padding:12px 40px;text-align:center;">
              <span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">
                CADASTRO RECEBIDO
              </span>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px 40px 32px 40px;">
              <p style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:${M.escuro};font-weight:700;">
                Olá, ${primeiroNome}, tudo bem?</p>
              <p style="margin:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#444444;line-height:1.6;">
                Recebemos seu cadastro e em breve nossa equipe entrará em contato para dar continuidade ao seu atendimento.</p>

              <!-- BOX DADOS -->
              <table border="0" cellpadding="0" cellspacing="0"
                style="background-color:#f5f7fa;border-left:4px solid ${M.cor};border-radius:4px;margin-bottom:28px;width:100%;">
                <tbody>
                  <tr><td style="padding:16px 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" style="width:100%">
                      <tbody>
                        <tr><td style="padding:6px 0;">
                          <span style="color:#888888;font-family:Arial,sans-serif;font-size:12px;">Plano contratado</span><br>
                          <strong style="font-family:Arial,sans-serif;font-size:15px;color:${M.escuro};">${plano_velocidade} — ${plano_preco}</strong>
                        </td></tr>
                        <tr><td style="padding:6px 0;">
                          <span style="color:#888888;font-family:Arial,sans-serif;font-size:12px;">Vencimento</span><br>
                          <strong style="font-family:Arial,sans-serif;font-size:15px;color:${M.escuro};">Todo dia ${vencimento} de cada mês</strong>
                        </td></tr>
                        <tr><td style="padding:6px 0;">
                          <span style="color:#888888;font-family:Arial,sans-serif;font-size:12px;">Localização</span><br>
                          <strong style="font-family:Arial,sans-serif;font-size:15px;color:${M.escuro};">${bairro_cobertura}, ${cidade_cobertura}</strong>
                        </td></tr>
                        <tr><td style="padding:6px 0;">
                          <span style="color:#888888;font-family:Arial,sans-serif;font-size:12px;">Taxa de instalação</span><br>
                          <strong style="font-family:Arial,sans-serif;font-size:15px;color:${M.escuro};">${M.taxa}</strong>
                        </td></tr>
                      </tbody>
                    </table>
                  </td></tr>
                </tbody>
              </table>

              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666666;line-height:1.6;">
                ${M.contato}</p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#ffffff;padding:20px 40px;text-align:center;">
              ${viva ? '' : `<img src="https://cadastro.kninternet.com.br/assets/footer-mail.webp" alt="KN Internet" width="600"
                style="display:block;width:600px;height:auto;border:0;margin-bottom:12px;">`}
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#252627;line-height:1.6;">
                ${M.rodape}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
