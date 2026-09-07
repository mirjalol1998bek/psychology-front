import type { SingleChoiceQuiz } from '@/types/assessment'

/**
 * Temperament (ru) — тест «Какой у тебя темперамент?». A different form
 * from the uz handout: 14 single-choice questions. Option А → Flegmatik,
 * Б → Melanxolik, В → Xolerik, Г → Sangvinik. The category chosen most
 * often is the result. Assigned to Russian-language groups.
 */
export const temperamentRu: SingleChoiceQuiz = {
  id: 'temperament-ru',
  instrumentType: 'FREQUENCY_BASED',
  format: 'single_choice',
  language: 'ru',
  title: 'Тест на темперамент',
  description: 'Выберите один вариант, который лучше всего вам подходит. Правильных или неправильных ответов нет.',
  questions: [
    {
      text: 'Какой у вас характер?',
      options: [
        { text: 'Спокойный, медлительный, обстоятельный, сдержанный, миролюбивый', category: 'Flegmatik' },
        { text: 'Робкий, застенчивый, обидчивый, впечатлительный, нерешительный', category: 'Melanxolik' },
        { text: 'Энергичный, неугомонный, шаловливый, горячий, задиристый', category: 'Xolerik' },
        { text: 'Жизнелюбивый, оптимистичный, компромиссный, общительный, склонный к риску', category: 'Sangvinik' },
      ],
    },
    {
      text: 'Какие эмоции вы наиболее часто испытываете?',
      options: [
        { text: 'Положительные, бурных реакций нет', category: 'Flegmatik' },
        { text: 'Страх', category: 'Melanxolik' },
        { text: 'Гнев, бурные эмоции', category: 'Xolerik' },
        { text: 'Положительные эмоции, много смеюсь', category: 'Sangvinik' },
      ],
    },
    {
      text: 'Какие игры вам нравятся?',
      options: [
        { text: 'Уединённые, тихие, спокойные', category: 'Flegmatik' },
        { text: 'Уединённые, тихие; подвижные и шумные — только с близкими', category: 'Melanxolik' },
        { text: 'Азартные, шумные, подвижные, даже агрессивные', category: 'Xolerik' },
        { text: 'Всякие, но чтобы было весело', category: 'Sangvinik' },
      ],
    },
    {
      text: 'Как реагируете на наказание?',
      options: [
        { text: 'Практически без эмоций', category: 'Flegmatik' },
        { text: 'Негативно, с обидой', category: 'Melanxolik' },
        { text: 'На словесные — спокойно, на другие — с бурным протестом', category: 'Xolerik' },
        { text: 'Спокойно', category: 'Sangvinik' },
      ],
    },
    {
      text: 'Как ведёте себя в неожиданных ситуациях?',
      options: [
        { text: 'Малоэмоционально', category: 'Flegmatik' },
        { text: 'Пытаюсь избежать этой ситуации (инстинкт самосохранения)', category: 'Melanxolik' },
        { text: 'Пытаюсь сопротивляться (потребность борьбы)', category: 'Xolerik' },
        { text: 'Проявляю любопытство (выраженное позитивное отношение)', category: 'Sangvinik' },
      ],
    },
    {
      text: 'Насколько вы общительны?',
      options: [
        { text: 'Предпочитаю уединение', category: 'Flegmatik' },
        { text: 'Предпочитаю уединение, общителен только с близкими', category: 'Melanxolik' },
        { text: 'Нуждаюсь в зрителях и сподвижниках', category: 'Xolerik' },
        { text: 'Люблю общество и взрослых, и детей, знакомлюсь быстро', category: 'Sangvinik' },
      ],
    },
    {
      text: 'Какое положение вы занимаете среди сверстников, есть ли лидерские качества?',
      options: [
        { text: 'Авторитета и качеств лидера не имею', category: 'Flegmatik' },
        { text: 'Не лидер, авторитет имею в узком кругу друзей', category: 'Melanxolik' },
        { text: 'Сам себя выдвигаю лидером, но сверстники по-разному к этому относятся', category: 'Xolerik' },
        { text: 'Прирождённый лидер, душа компании', category: 'Sangvinik' },
      ],
    },
    {
      text: 'Особенности памяти',
      options: [
        { text: 'Запоминаю медленно, но запоминаю и почти не забываю (хорошая долговременная память)', category: 'Flegmatik' },
        { text: 'Запоминаю по-разному, больше вникаю в мелочи', category: 'Melanxolik' },
        { text: 'Быстро запоминаю детали, но быстро забываю', category: 'Xolerik' },
        { text: 'Быстро и легко схватываю целое и долго помню', category: 'Sangvinik' },
      ],
    },
    {
      text: 'Как усваивается новое?',
      options: [
        { text: 'Медленно, зато обстоятельно', category: 'Flegmatik' },
        { text: 'Зависит от обстоятельств', category: 'Melanxolik' },
        { text: 'Схватываю на лету, но быстро забываю', category: 'Xolerik' },
        { text: 'Быстро и легко', category: 'Sangvinik' },
      ],
    },
    {
      text: 'Утомляемость',
      options: [
        { text: 'Очень низкая, почти не устаю', category: 'Flegmatik' },
        { text: 'Высокая, любая деятельность вызывает упадок сил', category: 'Melanxolik' },
        { text: 'Иногда средняя, а иногда высокая, зависит от эмоций', category: 'Xolerik' },
        { text: 'Средняя, устаю соразмерно деятельности', category: 'Sangvinik' },
      ],
    },
    {
      text: 'Особенности речи',
      options: [
        { text: 'Медленная, без жестов, невыразительная', category: 'Flegmatik' },
        { text: 'Тихая и неуверенная, но выразительная', category: 'Melanxolik' },
        { text: 'Эмоциональная, отрывистая, быстрая, переходит в крик; тараторю, глотаю слова', category: 'Xolerik' },
        { text: 'С жестами и мимикой, выразительная, живая', category: 'Sangvinik' },
      ],
    },
    {
      text: 'Движения',
      options: [
        { text: 'Солидные, неторопливые, нерасторопные', category: 'Flegmatik' },
        { text: 'Суетливые, неточные, неуверенные', category: 'Melanxolik' },
        { text: 'Резкие, порывистые', category: 'Xolerik' },
        { text: 'Ритмичные, точные, уверенные', category: 'Sangvinik' },
      ],
    },
    {
      text: 'Привыкание к новой обстановке',
      options: [
        { text: 'Боязнь нового, нежелание перемен, долгая адаптация', category: 'Flegmatik' },
        { text: 'Долгое привыкание, трудная адаптация', category: 'Melanxolik' },
        { text: 'Лёгкое привыкание, неохотное подчинение требованиям', category: 'Xolerik' },
        { text: 'Адаптация лёгкая и быстрая', category: 'Sangvinik' },
      ],
    },
    {
      text: 'Особенности сна',
      options: [
        { text: 'Засыпаю быстро, сплю спокойно, после сна состояние вялое, сонное', category: 'Flegmatik' },
        { text: 'Укладываюсь спать долго, но засыпаю быстро, после сна состояние весёлое', category: 'Melanxolik' },
        { text: 'Засыпаю долго и трудно, сон беспокойный, после сна состояние самое разное', category: 'Xolerik' },
        { text: 'Засыпаю быстро, сон крепкий, после сна состояние весёлое', category: 'Sangvinik' },
      ],
    },
  ],
}
