import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'de-DE',
  title: 'Schwerathletik Mannheim Slack Service Bot',
  description:
    'Slack Bot für administrative Aufgaben innerhalb Schwerathletik Mannheim 2018 e.V.',
  cleanUrls: true,
  base: '/slack-service-bot/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: {
      light: '/logo-light.png',
      dark: '/logo-dark.png'
    },
    siteTitle: 'SAM Slack Service Bot',
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Docs',
        items: [
          {
            text: 'Getting started',
            link: '/getting-started',
            activeMatch: '/getting-started/'
          },
          { text: 'Setup', link: '/setup', activeMatch: '/setup/' },
          {
            text: 'Contributions',
            link: '/contributions',
            activeMatch: '/contributions/'
          }
        ]
      },
      { text: 'Functions', link: '/functions' }
    ],

    sidebar: {
      '/getting-started/': [
        {
          text: 'Introduction',
          link: '/getting-started/'
        },
        {
          text: 'Getting started',
          base: '/getting-started/',
          items: [
            {
              text: 'Google APIs einrichten',
              link: 'googleapis'
            },
            {
              text: 'Zugangsdaten holen',
              link: 'get-secrets.md'
            },
            {
              text: 'AWS Lambda aufsetzen',
              link: 'aws-lambda'
            },
            { text: 'Slack App Konfiguration', link: 'slack-app-config' }
          ]
        }
      ],
      '/setup/': [
        {
          text: 'Introduction',
          link: '/setup/'
        },
        {
          text: 'Komponenten',
          base: '/setup/components/',
          collapsed: false,
          items: [
            { text: 'Arbeitsstunden', link: 'arbeitsstunden' },
            { text: 'Meldungen', link: 'meldungen' },
            { text: 'Pollz', link: 'pollz' },
            { text: 'Signaturen', link: 'signatures' },
            { text: 'Stätte', link: 'staette' },
            { text: 'Stammdaten', link: 'stammdaten' }
          ]
        },
        {
          text: 'Workflows',
          base: '/setup/workflows/',
          collapsed: false,
          items: [
            { text: 'Konfiguration', link: 'configuration' },
            { text: 'Workflows anlegen', link: 'create' }
          ]
        }
      ],
      '/contributions/': [
        {
          text: 'Contributions',
          base: '/contributions/',
          collapsed: false,
          items: [{ text: 'Contributions', link: '/' }]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Roy0815/slack-service-bot' }
    ],
    search: { provider: 'local' },
    editLink: {
      pattern:
        'https://github.com/Roy0815/slack-service-bot/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  }
});
