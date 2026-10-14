import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Complementa o app.json com o que depende do ambiente de build:
 *  - EAS_PROJECT_ID: ID do projeto no Expo (push notifications e builds EAS). `eas init` mostra o valor.
 *  - HTTP sem TLS só em builds de teste (development/preview ou AGORA_PERMITIR_HTTP=1), para
 *    falar com o Supabase local pela rede (http://192.168.x.x:54321). A versão de produção exige HTTPS.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const perfil = process.env.EAS_BUILD_PROFILE ?? '';
  const permitirHttp = process.env.AGORA_PERMITIR_HTTP === '1' || perfil === 'development' || perfil === 'preview';
  const projectId = process.env.EAS_PROJECT_ID;

  return {
    ...config,
    name: config.name ?? 'Ágora',
    slug: config.slug ?? 'agora',
    plugins: [
      ...(config.plugins ?? []),
      [
        'expo-build-properties',
        {
          android: { usesCleartextTraffic: permitirHttp },
          ios: {},
        },
      ],
    ],
    extra: {
      ...config.extra,
      ...(projectId ? { eas: { projectId } } : {}),
    },
  };
};
