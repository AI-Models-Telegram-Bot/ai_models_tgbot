export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-display font-bold text-content-primary mb-2">
        ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ
      </h1>
      <p className="text-sm text-content-tertiary mb-8">Сервиса Vseonix AI</p>
      <p className="text-xs text-content-tertiary mb-10">
        Дата публикации: 12 февраля 2026 г.
      </p>

      <div className="prose-legal">
        <Section title="1. ОБЩИЕ ПОЛОЖЕНИЯ">
          <P>
            1.1. Настоящая Политика конфиденциальности (далее — «Политика») определяет
            порядок сбора, хранения, обработки и защиты персональных данных пользователей
            сервиса Vseonix (далее — «Сервис»).
          </P>
          <P>
            1.2. Оператором персональных данных является Индивидуальный предприниматель
            Демченко Иосиф Юрьевич (ИНН: 010407932910, ОГРНИП: 322010000030074).
          </P>
          <P>
            1.3. Используя Сервис, вы соглашаетесь с условиями настоящей Политики. Если
            вы не согласны с условиями, пожалуйста, не используйте Сервис.
          </P>
          <P>1.4. Политика разработана в соответствии с:</P>
          <Ul>
            <li>Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных»</li>
            <li>
              Федеральным законом от 27.07.2006 № 149-ФЗ «Об информации, информационных
              технологиях и о защите информации»
            </li>
          </Ul>
        </Section>

        <Section title="2. СОБИРАЕМЫЕ ДАННЫЕ">
          <P><Strong>2.1. Данные, предоставляемые пользователем:</Strong></P>
          <Ul>
            <li>Telegram ID и имя пользователя</li>
            <li>Адрес электронной почты (при регистрации на сайте)</li>
            <li>Информация о платежах (не включая данные банковских карт)</li>
          </Ul>
          <P><Strong>2.2. Данные, собираемые автоматически:</Strong></P>
          <Ul>
            <li>IP-адрес</li>
            <li>Тип браузера и устройства</li>
            <li>Дата и время доступа к Сервису</li>
            <li>История использования Сервиса (запросы, генерации)</li>
            <li>Файлы cookie</li>
          </Ul>
          <P><Strong>2.3. Данные о платежах:</Strong></P>
          <Ul>
            <li>Информация о транзакциях обрабатывается платежным провайдером ЮКасса</li>
            <li>Мы не храним данные банковских карт</li>
            <li>Мы получаем только информацию о статусе платежа</li>
          </Ul>
        </Section>

        <Section title="3. ЦЕЛИ ОБРАБОТКИ ДАННЫХ">
          <P>3.1. Персональные данные обрабатываются в следующих целях:</P>
          <Ul>
            <li>Предоставление доступа к Сервису</li>
            <li>Идентификация пользователя</li>
            <li>Обработка платежей</li>
            <li>Техническая поддержка</li>
            <li>Улучшение качества Сервиса</li>
            <li>Отправка уведомлений о Сервисе</li>
            <li>Выполнение требований законодательства</li>
          </Ul>
        </Section>

        <Section title="4. ПРАВОВЫЕ ОСНОВАНИЯ ОБРАБОТКИ">
          <P>4.1. Обработка персональных данных осуществляется на следующих основаниях:</P>
          <Ul>
            <li>Согласие пользователя (ст. 6 ч. 1 п. 1 ФЗ-152)</li>
            <li>Исполнение договора (ст. 6 ч. 1 п. 5 ФЗ-152)</li>
            <li>Законные интересы оператора (ст. 6 ч. 1 п. 7 ФЗ-152)</li>
          </Ul>
        </Section>

        <Section title="5. ПЕРЕДАЧА ДАННЫХ ТРЕТЬИМ ЛИЦАМ">
          <P>5.1. Персональные данные могут передаваться:</P>
          <Ul>
            <li><Strong>ЮКасса</Strong> — для обработки платежей</li>
            <li><Strong>Telegram</Strong> — для работы бота</li>
            <li><Strong>Хостинг-провайдеры</Strong> — для хранения данных</li>
            <li><Strong>Правоохранительные органы</Strong> — по официальному запросу</li>
          </Ul>
          <P>5.2. Мы не продаем персональные данные третьим лицам.</P>
          <P>
            5.3. При передаче данных обеспечивается их защита в соответствии
            с законодательством РФ.
          </P>
        </Section>

        <Section title="6. ХРАНЕНИЕ ДАННЫХ">
          <P>6.1. Персональные данные хранятся:</P>
          <Ul>
            <li>На серверах, расположенных на территории Российской Федерации</li>
            <li>В течение срока действия договора и 3 лет после его прекращения</li>
            <li>Или до отзыва согласия пользователем</li>
          </Ul>
          <P>6.2. После истечения срока хранения данные уничтожаются.</P>
        </Section>

        <Section title="7. ЗАЩИТА ДАННЫХ">
          <P>7.1. Для защиты персональных данных применяются:</P>
          <Ul>
            <li>Шифрование данных при передаче (SSL/TLS)</li>
            <li>Ограничение доступа к персональным данным</li>
            <li>Регулярное резервное копирование</li>
            <li>Мониторинг безопасности</li>
          </Ul>
          <P>7.2. Доступ к персональным данным имеют только уполномоченные лица.</P>
        </Section>

        <Section title="8. ПРАВА ПОЛЬЗОВАТЕЛЯ">
          <P>8.1. Пользователь имеет право:</P>
          <Ul>
            <li>Получить информацию об обрабатываемых данных</li>
            <li>Требовать уточнения, блокирования или уничтожения данных</li>
            <li>Отозвать согласие на обработку данных</li>
            <li>Обжаловать действия оператора в Роскомнадзор</li>
          </Ul>
          <P>
            8.2. Для реализации своих прав обратитесь по адресу:{' '}
            <a href="mailto:support@vseonix.com" className="text-brand-primary hover:underline">
              support@vseonix.com
            </a>
          </P>
        </Section>

        <Section title="9. COOKIES">
          <P>9.1. Сервис использует файлы cookie для:</P>
          <Ul>
            <li>Идентификации пользователя</li>
            <li>Сохранения настроек</li>
            <li>Аналитики использования</li>
          </Ul>
          <P>
            9.2. Вы можете отключить cookie в настройках браузера, однако это может повлиять
            на функциональность Сервиса.
          </P>
        </Section>

        <Section title="10. ИЗМЕНЕНИЯ В ПОЛИТИКЕ">
          <P>
            10.1. Мы можем обновлять настоящую Политику. Актуальная версия всегда доступна
            по адресу https://vseonix.com/privacy-policy
          </P>
          <P>
            10.2. Продолжение использования Сервиса после изменения Политики означает согласие
            с новой редакцией.
          </P>
        </Section>

        <Section title="11. КОНТАКТЫ">
          <P>
            По вопросам, связанным с обработкой персональных данных, обращайтесь:
          </P>
          <Requisites />
        </Section>
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

function Requisites() {
  return (
    <div className="mt-4 text-sm text-content-secondary leading-relaxed" style={{ display: 'flex', flexDirection: 'column', rowGap: 4 }}>
      <p className="text-content-primary font-medium">ИП Демченко Иосиф Юрьевич</p>
      <p>
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
    </div>
  );
}
