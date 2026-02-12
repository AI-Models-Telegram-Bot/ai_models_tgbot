export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-display font-bold text-content-primary mb-2">
        ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ
      </h1>
      <p className="text-sm text-content-tertiary mb-8">Сервиса Vseonix AI</p>
      <p className="text-xs text-content-tertiary mb-10">
        Дата публикации: 12 февраля 2026 г.
      </p>

      <div className="prose-legal">
        <Section title="1. ОБЩИЕ ПОЛОЖЕНИЯ">
          <P>
            1.1. Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует
            отношения между Индивидуальным предпринимателем Демченко Иосифом Юрьевичем
            (далее — «Администрация») и пользователем сети Интернет (далее — «Пользователь»)
            при использовании сервиса Vseonix AI.
          </P>
          <P>
            1.2. Сервис доступен по адресу https://vseonix.com/ и через Telegram-бот
            https://t.me/Vseonix_bot.
          </P>
          <P>1.3. Начиная использовать Сервис, Пользователь подтверждает, что:</P>
          <Ul>
            <li>Ознакомился и согласен с условиями настоящего Соглашения</li>
            <li>Достиг возраста 18 лет или имеет согласие законного представителя</li>
            <li>Обладает необходимыми правами для заключения данного Соглашения</li>
          </Ul>
        </Section>

        <Section title="2. ОПИСАНИЕ СЕРВИСА">
          <P>
            2.1. Vseonix AI — это онлайн-сервис, предоставляющий доступ к функциям
            искусственного интеллекта:
          </P>
          <Ul>
            <li>Генерация текстов (GPT-4, Claude, Grok и др.)</li>
            <li>Генерация изображений (Flux, SDXL и др.)</li>
            <li>Генерация видео (Kling, Luma и др.)</li>
            <li>Генерация аудио (ElevenLabs, Suno и др.)</li>
          </Ul>
          <P>
            2.2. Перечень доступных функций и моделей может изменяться без предварительного
            уведомления.
          </P>
        </Section>

        <Section title="3. РЕГИСТРАЦИЯ И АККАУНТ">
          <P>
            3.1. Для использования Сервиса необходима авторизация через Telegram или
            регистрация на сайте.
          </P>
          <P>3.2. Пользователь обязуется:</P>
          <Ul>
            <li>Предоставить достоверную информацию при регистрации</li>
            <li>Не передавать доступ к аккаунту третьим лицам</li>
            <li>Немедленно уведомить Администрацию о несанкционированном доступе</li>
          </Ul>
          <P>
            3.3. Администрация вправе заблокировать или удалить аккаунт при нарушении
            условий Соглашения.
          </P>
        </Section>

        <Section title="4. ПРАВИЛА ИСПОЛЬЗОВАНИЯ">
          <P><Strong>4.1. Запрещается использовать Сервис для:</Strong></P>
          <Ul>
            <li>Создания контента, нарушающего законодательство РФ</li>
            <li>Генерации порнографического контента</li>
            <li>Создания контента, разжигающего ненависть</li>
            <li>Распространения вредоносного ПО</li>
            <li>Нарушения прав интеллектуальной собственности</li>
            <li>Мошенничества и обмана</li>
            <li>Спама и массовых рассылок</li>
          </Ul>
          <P><Strong>4.2. При использовании Сервиса Пользователь обязуется:</Strong></P>
          <Ul>
            <li>Соблюдать законодательство Российской Федерации</li>
            <li>Уважать права других пользователей</li>
            <li>Не создавать чрезмерную нагрузку на Сервис</li>
            <li>Не пытаться получить несанкционированный доступ</li>
          </Ul>
          <P>
            4.3. Администрация оставляет за собой право модерации контента и блокировки
            нарушителей.
          </P>
        </Section>

        <Section title="5. ОПЛАТА И ТАРИФЫ">
          <P>
            5.1. Часть функций Сервиса доступна бесплатно. Расширенный функционал
            предоставляется на платной основе.
          </P>
          <P>
            5.2. Актуальные тарифы опубликованы на странице https://vseonix.com/
            и в Telegram-боте.
          </P>
          <P>
            5.3. Оплата производится через платежную систему ЮКасса. Условия возврата
            средств определены в Публичной оферте.
          </P>
        </Section>

        <Section title="6. ИНТЕЛЛЕКТУАЛЬНАЯ СОБСТВЕННОСТЬ">
          <P>
            6.1. Все права на Сервис (код, дизайн, логотип, товарные знаки) принадлежат
            Администрации.
          </P>
          <P>
            6.2. Контент, созданный Пользователем с помощью Сервиса, принадлежит
            Пользователю с учетом:
          </P>
          <Ul>
            <li>Условий использования базовых AI-моделей</li>
            <li>Законодательства об авторском праве</li>
          </Ul>
          <P>
            6.3. Пользователь самостоятельно несет ответственность за использование
            созданного контента.
          </P>
        </Section>

        <Section title="7. ОТКАЗ ОТ ГАРАНТИЙ">
          <P>7.1. Сервис предоставляется «как есть» (as is).</P>
          <P>7.2. Администрация не гарантирует:</P>
          <Ul>
            <li>Бесперебойную работу Сервиса</li>
            <li>Соответствие результатов ожиданиям Пользователя</li>
            <li>Пригодность для конкретных целей</li>
          </Ul>
          <P>7.3. Пользователь использует Сервис на свой страх и риск.</P>
        </Section>

        <Section title="8. ОГРАНИЧЕНИЕ ОТВЕТСТВЕННОСТИ">
          <P>8.1. Администрация не несет ответственности за:</P>
          <Ul>
            <li>Убытки, возникшие при использовании Сервиса</li>
            <li>Действия третьих лиц</li>
            <li>Качество интернет-соединения Пользователя</li>
            <li>Контент, созданный Пользователем</li>
          </Ul>
          <P>
            8.2. Максимальная ответственность Администрации ограничена суммой, уплаченной
            Пользователем за последний месяц.
          </P>
        </Section>

        <Section title="9. ИЗМЕНЕНИЕ СОГЛАШЕНИЯ">
          <P>
            9.1. Администрация вправе изменять настоящее Соглашение в любое время.
          </P>
          <P>
            9.2. Актуальная версия публикуется на странице https://vseonix.com/terms.
          </P>
          <P>
            9.3. Продолжение использования Сервиса после изменений означает согласие
            с новой редакцией.
          </P>
        </Section>

        <Section title="10. ПРИМЕНИМОЕ ПРАВО И СПОРЫ">
          <P>
            10.1. Настоящее Соглашение регулируется законодательством Российской Федерации.
          </P>
          <P>
            10.2. Споры разрешаются путем переговоров. При невозможности — в суде по месту
            нахождения Администрации.
          </P>
        </Section>

        <section className="mt-12 pt-8 border-t border-white/[0.06]">
          <h2 className="text-lg font-semibold text-content-primary mb-4">
            РЕКВИЗИТЫ АДМИНИСТРАЦИИ
          </h2>
          <div className="text-sm text-content-secondary leading-relaxed" style={{ display: 'flex', flexDirection: 'column', rowGap: 4 }}>
            <p className="text-content-primary font-medium">ИП Демченко Иосиф Юрьевич</p>
            <p>ИНН: 010407932910</p>
            <p>ОГРНИП: 322010000030074</p>
            <p className="mt-2">
              Электронная почта:{' '}
              <a href="mailto:support@vseonix.com" className="text-brand-primary hover:underline">
                support@vseonix.com
              </a>
            </p>
            <p>
              Сайт:{' '}
              <a href="https://vseonix.com/" className="text-brand-primary hover:underline">
                https://vseonix.com/
              </a>
            </p>
            <p>
              Telegram:{' '}
              <a href="https://t.me/Vseonix_bot" className="text-brand-primary hover:underline" target="_blank" rel="noopener noreferrer">
                https://t.me/Vseonix_bot
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-content-primary mb-4">{title}</h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-content-secondary leading-relaxed mb-3">{children}</p>;
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="text-content-primary font-medium">{children}</strong>;
}

function Ul({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc list-inside text-sm text-content-secondary leading-relaxed mb-3 ml-4" style={{ display: 'flex', flexDirection: 'column', rowGap: 4 }}>
      {children}
    </ul>
  );
}
