import type { Metadata, Viewport } from 'next'
import { Inter, Sora } from 'next/font/google'
import { Toaster } from 'sonner'
import Script from 'next/script'
import './globals.css'
import { CookieConsent } from '@/components/cookie-consent'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
})

// ─── IDs de rastreamento ───────────────────────────────────────────────────────
const GTM_ID = 'GTM-M6DBCKND'
const META_PIXEL_ID = '999831345819625'
// GA4 é injetado pelo GTM — não precisamos de snippet separado aqui

// ─── Metadados Open Graph / WhatsApp / redes sociais ──────────────────────────
const BASE_URL = 'https://cadastro.kninternet.com.br'

export const metadata: Metadata = {
  robots: { index: false, follow: false },

  title: 'Formulário de Cadastro - KN Internet | Rio de Janeiro',
  description:
    'Internet de fibra óptica de alta velocidade no Rio de Janeiro. Preencha o formulário e venha para a KN Internet.',

  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/favicon.ico' },
    ],
  },

  openGraph: {
    type: 'website',
    url: BASE_URL,
    siteName: 'KN Internet',
    title: 'Formulário de Cadastro - KN Internet | Rio de Janeiro',
    description:
      'Internet de fibra óptica de alta velocidade no Rio de Janeiro. Preencha o formulário e venha para a KN Internet.',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'KN Internet – Fibra Óptica no Rio de Janeiro',
      },
    ],
    locale: 'pt_BR',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Formulário de Cadastro - KN Internet | Rio de Janeiro',
    description:
      'Internet de fibra óptica de alta velocidade no Rio de Janeiro. Preencha o formulário e venha para a KN Internet.',
    images: [`${BASE_URL}/og-image.png`],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0c1e3d',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${sora.variable} scroll-smooth`}>
      <head>
        {/* ── Google Consent Mode v2 — DEVE vir ANTES do GTM e do Pixel ──
            Tudo negado por padrão. O banner (CookieConsent) dispara o update
            quando o usuário decide. security_storage/functionality permanecem
            granted por serem essenciais. */}
        <Script id="consent-mode-default" strategy="beforeInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'analytics_storage': 'denied',
            'functionality_storage': 'granted',
            'security_storage': 'granted',
            'wait_for_update': 500
          });
          // Respeita navegadores com "Do Not Track" ativado
          gtag('set', 'ads_data_redaction', true);
        `}</Script>

        {/* ── Google Tag Manager ── */}
        <Script id="gtm-head" strategy="beforeInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `}</Script>

        {/* ── Meta Pixel — inicializa mas represa o rastreamento até consentimento ──
            fbq('consent','revoke') impede envio de eventos até o banner conceder. */}
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('consent', 'revoke');
          fbq('init', '${META_PIXEL_ID}');
        `}</Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      </head>

      <body className="font-sans antialiased bg-background">
        {/* ── GTM noscript (logo após <body>) ── */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        {children}
        <Toaster position="top-right" richColors />
        <CookieConsent metaPixelId={META_PIXEL_ID} />
      </body>
    </html>
  )
}