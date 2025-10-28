import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'de-DE',
  title: 'Schwerathletik Mannheim Slack Service Bot',
  description:
    'Slack Bot für administrative Aufgaben innerhalb Schwerathletik Mannheim 2018 e.V.',
  cleanUrls: true,
  base: '/slack-service-bot/',
  head: [
    [
      'link',
      {
        rel: 'icon',
        href: '/slack-service-bot/favicon.ico'
      }
    ],
    [
      'link',
      {
        rel: 'shortcut icon',
        href: '/slack-service-bot/favicon.ico'
      }
    ]
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: {
      light: '/logo-sam-light.svg',
      dark: '/logo-sam-dark.svg'
    },
    siteTitle: 'SAM Slack Service Bot',
    outline: { level: [2, 3], label: 'Auf dieser Seite' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Roy0815/slack-service-bot' }
    ],
    search: { provider: 'local' },
    docFooter: { next: 'Nächste Seite', prev: 'Vorherige Seite' },
    editLink: {
      pattern:
        'https://github.com/Roy0815/slack-service-bot/edit/dev/docs/:path',
      text: 'Auf GitHub editieren'
    },
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Setup',
        activeMatch: '^/hosting-and-slack/|^/functions-setup/|^/contributions/',
        items: [
          {
            text: 'Einführung',
            link: '/introduction'
          },
          {
            text: 'Hosting und Slack Setup',
            link: '/hosting-and-slack/googleapis',
            activeMatch: '/hosting-and-slack/'
          },
          {
            text: 'Funktionen Setup',
            link: '/functions-setup',
            activeMatch: '/functions-setup/'
          },
          {
            text: 'Contribution',
            link: '/contribution',
            activeMatch: '/contribution/'
          }
        ]
      },
      { text: 'Funktionen', link: '/functions', activeMatch: '/functions/' }
    ],

    sidebar: [
      {
        text: 'Einführung',
        link: '/introduction.md'
      },
      {
        text: 'Hosting und Slack Setup',
        base: '/hosting-and-slack/',
        collapsed: true,
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
            text: 'Entwicklungsumgebung einrichten',
            link: 'dev-environment-setup'
          },
          {
            text: 'AWS Lambda aufsetzen',
            link: 'aws-lambda'
          },
          { text: 'Slack App Konfiguration', link: 'slack-app-config' }
        ]
      },
      {
        text: 'Funktionen Setup',
        base: '/functions-setup/',
        collapsed: true,
        items: [
          { text: 'Einführung', link: '/' },
          {
            text: 'Komponenten',
            link: 'components',
            collapsed: true,
            items: [
              { text: 'Arbeitsstunden', link: 'components#arbeitsstunden' },
              { text: 'Meldungen', link: 'components#meldungen' },
              { text: 'Pollz', link: 'components#pollz' },
              { text: 'Signaturen', link: 'components#signaturen' },
              { text: 'Stätte', link: 'components#statte' },
              { text: 'Stammdaten', link: 'components#stammdaten' }
            ]
          },
          { text: 'Workflow Schritte', link: 'workflow-steps' },
          {
            text: 'Workflows',
            link: 'workflows',
            collapsed: true,
            items: [
              {
                text: 'ADMIN Neues Mitglied',
                link: 'workflows#admin-neues-mitglied'
              },
              {
                text: 'Austritt einplanen',
                link: 'workflows#austritt-einplanen'
              },
              {
                text: 'Meldeaufforderung KDK Wettkampf',
                link: 'workflows#meldeaufforderung-kdk-wettkampf'
              },
              {
                text: 'Rechnung einreichen',
                link: 'workflows#rechnung-einreichen'
              },
              {
                text: 'Vereinscoaching anpassen',
                link: 'workflows#vereinscoaching-anpassen'
              },
              {
                text: 'Vereinscoaching kündigen',
                link: 'workflows#vereinscoaching-kundigen'
              }
            ]
          }
        ]
      },
      {
        text: 'Contribution',
        link: '/',
        base: '/contribution/',
        collapsed: true,
        items: [
          { text: 'Projektstrukur', link: '#projektstrukur' },
          {
            text: 'Komponenten und Workflow Schritte',
            link: '#komponenten-und-workflow-schritte'
          },
          {
            text: 'Design Pattern',
            link: '#design-pattern'
          },
          {
            text: 'Entwicklung starten',
            link: 'start-development.md'
          },
          {
            text: 'Dokumentation',
            link: 'documentation.md'
          }
        ]
      },
      {
        text: 'Funktionen',
        link: '/functions'
      }
    ]
  }
});
