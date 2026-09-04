export default {
  app: {
    name: 'Психодиагностика',
  },
  nav: {
    dashboard: 'Главная',
    tests: 'Тесты',
    assignments: 'Прикреплённые группы',
    results: 'Результаты',
    statistics: 'Статистика',
    calendar: 'Календарь приёма',
    settings: 'Настройки',
  },
  auth: {
    title: 'Вход в систему',
    subtitle: 'Добро пожаловать на платформу психологической диагностики',
    hemisLogin: 'Войти через Hemis',
    hemisHint: 'Логин и пароль не требуются — вы будете авторизованы через ваш университетский аккаунт Hemis.',
    signingIn: 'Вход...',
  },
  dashboard: {
    greeting: 'Добро пожаловать',
    assignedTests: 'Назначенные тесты',
    completed: 'Завершено',
    upcomingAppointment: 'Ближайший приём',
    noAppointment: 'Вы не записаны на приём',
    recentResults: 'Последние результаты',
    bookAppointment: 'Записаться на приём',
    startTest: 'Начать',
  },
  common: {
    faculty: 'Факультет',
    group: 'Группа',
    language: 'Язык',
    logout: 'Выйти',
    comingSoon: 'Этот раздел скоро будет доступен.',
    back: 'Назад',
  },
} as const
