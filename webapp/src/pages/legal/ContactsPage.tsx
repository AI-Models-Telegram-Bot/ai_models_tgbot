import { Link } from 'react-router-dom';

export default function ContactsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-display font-bold text-content-primary mb-8">
        Контакты
      </h1>

      <div className="grid md:grid-cols-2" style={{ gap: 0 }}>
        {/* Contact Info */}
        <div className="bg-surface-card rounded-2xl p-6 border border-white/[0.06] md:rounded-r-none md:border-r-0">
          <h2 className="text-lg font-semibold text-content-primary mb-5">
            Связаться с нами
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', rowGap: 16 }}>
            <div>
              <p className="text-xs text-content-tertiary mb-1">Email:</p>
              <a
                href="mailto:support@vseonix.com"
                className="text-sm text-brand-primary hover:underline"
              >
                support@vseonix.com
              </a>
            </div>

            <div>
              <p className="text-xs text-content-tertiary mb-1">Telegram:</p>
              <a
                href="https://t.me/Vseonix_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand-primary hover:underline"
              >
                @Vseonix_bot
              </a>
            </div>

            <div>
              <p className="text-xs text-content-tertiary mb-1">Сайт:</p>
              <a
                href="https://vseonix.com"
                className="text-sm text-brand-primary hover:underline"
              >
                vseonix.com
              </a>
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-brand-primary/5 border border-brand-primary/10">
            <p className="text-xs text-content-secondary">
              Время ответа на обращения: до 24 часов в рабочие дни.
            </p>
          </div>
        </div>

        {/* Requisites */}
        <div className="bg-surface-card rounded-2xl p-6 border border-white/[0.06] md:rounded-l-none">
          <h2 className="text-lg font-semibold text-content-primary mb-5">
            Реквизиты
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', rowGap: 16 }}>
            <div>
              <p className="text-xs text-content-tertiary mb-1">Наименование:</p>
              <p className="text-sm text-content-primary font-medium">
                ИП Демченко Иосиф Юрьевич
              </p>
            </div>

            <div>
              <p className="text-xs text-content-tertiary mb-1">ИНН:</p>
              <p className="text-sm text-content-primary font-mono">010407932910</p>
            </div>

            <div>
              <p className="text-xs text-content-tertiary mb-1">ОГРНИП:</p>
              <p className="text-sm text-content-primary font-mono">322010000030074</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            <p className="text-xs text-content-tertiary">
              Реквизиты для безналичной оплаты предоставляются по запросу на{' '}
              <a href="mailto:support@vseonix.com" className="text-brand-primary hover:underline">
                support@vseonix.com
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Legal Documents */}
      <div className="mt-8 bg-surface-card rounded-2xl p-6 border border-white/[0.06]">
        <h2 className="text-lg font-semibold text-content-primary mb-5">
          Юридические документы
        </h2>

        <div className="grid md:grid-cols-3" style={{ gap: 0 }}>
          <Link
            to="/public-offer"
            className="block p-4 rounded-xl border border-white/[0.06] hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-colors md:rounded-r-none md:border-r-0"
          >
            <h3 className="text-sm font-medium text-content-primary mb-1">
              Публичная оферта
            </h3>
            <p className="text-xs text-content-tertiary">Условия оказания услуг</p>
          </Link>

          <Link
            to="/privacy-policy"
            className="block p-4 rounded-xl border border-white/[0.06] hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-colors md:rounded-none"
          >
            <h3 className="text-sm font-medium text-content-primary mb-1">
              Политика конфиденциальности
            </h3>
            <p className="text-xs text-content-tertiary">Обработка персональных данных</p>
          </Link>

          <Link
            to="/terms"
            className="block p-4 rounded-xl border border-white/[0.06] hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-colors md:rounded-l-none md:border-l-0"
          >
            <h3 className="text-sm font-medium text-content-primary mb-1">
              Пользовательское соглашение
            </h3>
            <p className="text-xs text-content-tertiary">Правила использования сервиса</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
