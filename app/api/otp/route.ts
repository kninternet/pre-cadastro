import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const otpStore = new Map<string, { code: string; expires: number }>()

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

function buildEmailHtml(code: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:#0c1e3d;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#f97316;font-size:22px;font-weight:800;letter-spacing:-0.5px;">KN Internet</p>
            <p style="margin:6px 0 0;color:#ffffff;font-size:13px;opacity:0.7;">Fibra Óptica no Rio de Janeiro</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0c1e3d;">Confirme seu e-mail</p>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
              Use o código abaixo para concluir seu pré-cadastro. Ele é válido por <strong>10 minutos</strong>.
            </p>

            <!-- OTP box -->
            <div style="background:#f97316;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.8);letter-spacing:2px;text-transform:uppercase;">Seu código</p>
              <p style="margin:0;font-size:42px;font-weight:800;color:#ffffff;letter-spacing:12px;">${code}</p>
            </div>

            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
              Se você não solicitou este código, pode ignorar este e-mail com segurança.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              © ${new Date().getFullYear()} KN Internet · atendimento@kninternet.com.br
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const code = generateOTP()
    const expires = Date.now() + 10 * 60 * 1000 // 10 minutos

    otpStore.set(email, { code, expires })

    await transporter.sendMail({
      from: '"KN Internet" <atendimento@kninternet.com.br>',
      to: email,
      subject: `${code} é seu código de verificação – KN Internet`,
      html: buildEmailHtml(code),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[OTP] Erro ao enviar e-mail:', err)
    return NextResponse.json({ error: 'Erro ao enviar código' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const stored = otpStore.get(email)

    if (!stored) {
      return NextResponse.json({ error: 'Código não encontrado. Solicite um novo.' }, { status: 400 })
    }

    if (Date.now() > stored.expires) {
      otpStore.delete(email)
      return NextResponse.json({ error: 'Código expirado. Solicite um novo.' }, { status: 400 })
    }

    if (stored.code !== code) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
    }

    otpStore.delete(email)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao verificar código' }, { status: 500 })
  }
}
