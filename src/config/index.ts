import dotenv from 'dotenv';
dotenv.config();

export const config = {
  bot: {
    token: process.env.BOT_TOKEN || '',
    username: process.env.BOT_USERNAME || '',
    mode: (process.env.BOT_MODE || 'polling') as 'polling' | 'webhook',
    webhookDomain: process.env.WEBHOOK_DOMAIN || '',
  },
  health: {
    port: parseInt(process.env.HEALTH_PORT || '3000', 10),
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    },
    xai: {
      apiKey: process.env.XAI_API_KEY || '',
    },
    replicate: {
      apiToken: process.env.REPLICATE_API_TOKEN || '',
    },
    elevenlabs: {
      apiKey: process.env.ELEVENLABS_API_KEY || '',
    },
  },
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
  },
  webapp: {
    url: process.env.WEBAPP_URL || '',
  },
  tokens: {
    freeOnRegistration: parseInt(process.env.FREE_TOKENS_ON_REGISTRATION || '5', 10),
    referralBonus: parseInt(process.env.REFERRAL_BONUS_TOKENS || '3', 10),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },
  yookassa: {
    shopId: process.env.YOOKASSA_SHOP_ID || '',
    secretKey: process.env.YOOKASSA_SECRET_KEY || '',
    defaultEmail: process.env.YOOKASSA_DEFAULT_EMAIL || 'support@vseonix.com',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@vseonix.com',
  },
};

export function validateConfig(): void {
  const required = [
    ['BOT_TOKEN', config.bot.token],
    ['DATABASE_URL', config.database.url],
  ];

  const missing = required.filter(([, value]) => !value);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.map(([name]) => name).join(', ')}`);
  }
}
