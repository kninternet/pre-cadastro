import type { Metadata, Viewport } from 'next'
import { Inter, Sora } from 'next/font/google'
import { Toaster } from 'sonner'
import Script from 'next/script'
import './globals.css'

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
  // Não indexar em buscadores — esta página é distribuída pelo atendimento
  robots: { index: false, follow: false },

  title: 'Falta pouco! Cadastre-se e navegue rápido – KN',
  description:
    'Internet de fibra óptica de alta velocidade no Rio de Janeiro. Preencha o formulário e venha para a KN Internet.',

  // Open Graph (WhatsApp, Facebook, LinkedIn, Telegram…)
  openGraph: {
    type: 'website',
    url: BASE_URL,
    siteName: 'KN Internet',
    title: 'Falta pouco! Cadastre-se e navegue rápido – KN',
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

  // Twitter Card (também usado por algumas redes)
  twitter: {
    card: 'summary_large_image',
    title: 'Falta pouco! Cadastre-se e navegue rápido – KN',
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
        {/* ── Google Tag Manager ── */}
        <Script id="gtm-head" strategy="beforeInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `}</Script>

        {/* ── Meta Pixel ── */}
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
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
      </body>
    </html>
  )
}
