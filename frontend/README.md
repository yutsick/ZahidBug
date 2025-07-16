# Тендерна система - Frontend (Next.js)

Сучасний веб-додаток для управління переможцями тендерів з інтеграцією в 1С.

## Технології

- **Next.js 14** - React фреймворк з App Router
- **TypeScript** - типізація
- **Ant Design** - UI компоненти
- **Tailwind CSS** - стилізація
- **Axios** - HTTP клієнт
- **Zod** - валідація форм

## Встановлення

```bash
# Встановити залежності
npm install

# Запустити в dev режимі
npm run dev

# Зібрати для продакшена
npm run build

# Запустити продакшен
npm run start
```

## Структура проекту

```
src/
├── app/                 # Next.js App Router
│   ├── login/          # Сторінка входу
│   ├── register/       # Сторінка реєстрації
│   ├── activate/       # Активація акаунту
│   ├── cabinet/        # Кабінет користувача
│   └── admin/          # Адмін панель
├── components/         # React компоненти
│   ├── forms/          # Форми
│   ├── layout/         # Лейаут компоненти
│   └── providers/      # Провайдери контексту
├── lib/                # Утиліти та сервіси
│   ├── api.ts          # API клієнт
│   ├── auth.ts         # Авторизація
│   ├── utils.ts        # Допоміжні функції
│   └── validations.ts  # Схеми валідації
├── types/              # TypeScript типи
└── hooks/              # React хуки
```

## Особливості

### Авторизація
- JWT токени
- Ролі користувачів (user, admin, superadmin)
- Захищені маршрути

### UI/UX
- Адаптивний дизайн
- Ant Design компоненти
- Українська локалізація
- Темна/світла тема

### Функціональність
- Реєстрація переможців тендерів
- Завантаження документів
- Адмін панель для управління
- Звіти та аналітика

## Змінні середовища

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

## Розробка

1. Переконайтесь, що Django backend запущений на порту 8000
2. Запустіть `npm run dev`
3. Відкрийте http://localhost:3000

## Деплой

```bash
# Зібрати проект
npm run build

# Запустити в продакшені
npm run start
```

## API Endpoints

- `POST /api/auth/register/` - Реєстрація
- `POST /api/auth/login/` - Авторизація
- `POST /api/auth/logout/` - Вихід
- `GET /api/auth/users/` - Список користувачів
- `POST /api/auth/users/{id}/approve/` - Схвалення
- `POST /api/auth/users/{id}/decline/` - Відхилення

## Тестування

```bash
# Тести
npm run test

# Лінтинг
npm run lint
```