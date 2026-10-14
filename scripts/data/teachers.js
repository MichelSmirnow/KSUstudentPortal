/* Преподавательский состав */
const teachersData = {
  "Институт \"Высшая ИТ-школа\"": {
    "Администрация института": {
      "Борисов А.С.": {
        fullName: "Борисов Александр Сергеевич",
        image: "images/teachers/borisov_as.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "И.о. директора института",
        courses: ["Архитектура цифровых предприятий", "Основы информатизации предприятий", "Проектная деятельность", "Управление проектами обеспечения информационной безопасности"],
        sheduleCode: 946,
        education: "Высшее профессиональное образование"
      },
      "Чебунькина Т.А.": {
        fullName: "Чебунькина Татьяна Алексеевна",
        image: "images/teachers/chebunkina_ta.jpg",
        academicDegree: "кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Заместитель директора по учебно-методической и по научно-исследовательской деятельности",
        courses: ["Дополнительные главы высшей математики", "Численные методы и математическое моделирование", "Теория информации и кодирование", "Теория вероятностей и математическая статистика"],
        sheduleCode: 947,
        email: "ta_chebunkina@kosgos.ru"
      },
      "Козырева Т.В.": {
        fullName: "Козырева Татьяна Владимировна",
        image: "images/teachers/kozyreva_tv.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Заместитель директора по воспитательной деятельности",
        courses: [],
        email: "t_kozyreva@kosgos.ru"
      },
      "Сокова Г.Г.": {
        fullName: "Сокова Галина Георгиевна",
        image: "images/teachers/sokova_gg.jpg",
        academicDegree: "доктор технических наук",
        academicTitle: "Доцент",
        workPost: "Советник по развитию образовательных программ",
        courses: [],
        email: "g_sokova@kosgos.ru"
      },
      "Виноградов Е.В.": {
        fullName: "Виноградов Евгений Валентинович",
        image: "images/teachers/vinogradov_ev.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Информационно-коммуникационные технологии", "Информатика информационнокоммуникационные технологии в профессиональной деятельности", "Информатика и основы информационной безопасности", "Информационная безопасность", "Технические средства охраны и видеонаблюдения", "Аппаратные средства вычислительной техники"],
        sheduleCode: 605,
        email: "e_vinogradov@kosgos.ru",
        extra: ["ответственный за профориентационную работу"]
      },
      "Волков Е.А.": {
        fullName: "Волков Егор Алексеевич",
        image: "images/teachers/volkov_ea.jpg",
        academicDegree: "",
        workPost: "Помощник директора по воспитательной деятельности",
        courses: [],
        email: "ea_volkov@kosgos.ru"
      },
      "Киселёва А.В.": {
        fullName: "Киселёва Алёна Викторовна",
        image: "images/teachers/kiseleva_av.jpg",
        academicDegree: "",
        workPost: "Специалист по учебно-методической работе",
        courses: [],
        email: "e_kiseleva@kosgos.ru"
      },
      "Булюкина А.С.": {
        fullName: "Булюкина Анна Сергеевна",
        image: "images/teachers/bulyukina_as.jpg",
        academicDegree: "",
        workPost: "Специалист по учебно-методической работе",
        courses: [],
        email: "a_bulyukina@kosgos.ru"
      }
    },
    "Кафедра Прикладной математики и информационных технологий": {
      "Ивков В.А.": {
        fullName: "Ивков Владимир Анатольевич",
        image: "images/teachers/ivkov_va.jpg",
        academicDegree: "Кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Заведующий кафедрой",
        courses: ["Методы оптимизации", "Языки и методы программирования", "Системное программирование", "Программирование на С++", "Технологии программирования java", "Математика анализа данных", "Технологии интеллектуального анализа данных", "Анализ данных на python", "Теория игр исследование операций"],
        sheduleCode: 169
      },
      "Секованов В.С.": {
        fullName: "Секованов Валерий Сергеевич",
        image: "images/teachers/sekovanov_vs.jpg",
        academicDegree: "Доктор педагогических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедрой",
        courses: ["Основы синергетики", "Современные проблемы прикладной математики", "методика преподавания математики", "фрактальное моделирование", "элементы нелинейной динамики"],
        sheduleCode: 390
      },
      "Леготин Д.Л.": {
        fullName: "Леготин Денис Леонидович",
        image: "images/teachers/legotin_dl.jpg",
        academicDegree: "Кандидат физико-математических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Компьютерные сети", "Язык SQL и реляционные модели данных", "Разработка баз данных", "Математические основы компьютерной графики", "Вычисления на многопроцессорных системах", "Моделирование электронных схем", "Объектно-ориентированное программирование", "Системные платформы и оболочки", "Нейросетевое моделирование", "Моделирование искусственного интеллекта", "прикладная математика информатика"],
        sheduleCode: 268
      },
      "Козырев С.Б.": {
        fullName: "Козырев Сергей Борисович",
        image: "images/teachers/kozyrev_sb.jpg",
        academicDegree: "Кандидат физико-математических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Сухов А.К.": {
        fullName: "Сухов Андрей Константинович",
        image: "images/teachers/suhov_ak.jpg",
        academicDegree: "Кандидат физико-математических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Пигузов А.А.": {
        fullName: "Пигузов Алексей Александрович",
        image: "images/teachers/piguzov_aa.jpg",
        academicDegree: "Кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Информационные технологии", "Операционные системы", "Информационная безопасность", "Новые информационные технологии в образовании", "Системное и прикладное программное обеспечение", "Информатика и основы информационной безопасности"],
        sheduleCode: 339
      },
      "Кудряшова Ю.В.": {
        fullName: "Кудряшова Юлия Владимировна",
        image: "images/teachers/kudryashova_yv.jpg",
        academicDegree: "",
        workPost: "Старший преподватель кафедры",
        courses: []
      },
      "Селезнева Е.М.": {
        fullName: "Селезнева Елена Михайловна",
        image: "images/teachers/selezneva_em.jpg",
        academicDegree: "",
        workPost: "Старший преподватель кафедры",
        courses: []
      },
      "Виноградов Е.В.": {
        fullName: "Виноградов Евгений Валентинович",
        image: "images/teachers/vinogradov_ev2.jpg",
        academicDegree: "Кандидат педагогических наук",
        workPost: "Доцент кафедры",
        courses: ["Информационно-коммуникационные технологии", "Информатика информационнокоммуникационные технологии в профессиональной деятельности", "Информатика и основы информационной безопасности", "Информационная безопасность", "Технические средства охраны и видеонаблюдения", "Аппаратные средства вычислительной техники"],
        sheduleCode: 605
      },
      "Смирнова Е.С.": {
        fullName: "Смирнова Елена Сафаровна",
        image: "images/teachers/smirnova_es.jpg",
        academicDegree: "Кандидат педагогических наук",
        workPost: "Доцент кафедры",
        courses: ["Информатика и основы информационной безопасности", "Информатика", "Основы информационной безопасности", "Кибергигиена", "Основы проектной деятельности", "Защита информации в компьютерных системах"],
        sheduleCode: 417
      }
    },
    "Кафедра Информационных систем и технологий": {
      "Киприна Л.Ю.": {
        fullName: "Киприна Людмила Юрьевна",
        image: "images/teachers/kiprina_ly.jpg",
        academicDegree: "Доктор технических наук",
        academicTitle: "Доцент",
        workPost: "Заведующий кафедрой",
        courses: ["Технологии разработки программного обеспечения", "Управление качеством информационных систем", "Тестирование программного обеспечения информационных систем", "Юзабилити-тестирование"],
        sheduleCode: 190
      },
      "Барило И.И.": {
        fullName: "Барило Илья Иванович",
        image: "images/teachers/barilo_ii.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Технологии разработки программного обеспечения", "Инструменты графического дизайна", "Разработка мультимедиа приложений", "Компьютерная графика", "Основы проектной деятельности", "Информационные технологии управления знаниями", "Междисциплинарный проект", "Управление IT-проектами", "Управление проектами"],
        sheduleCode: 31
      },
      "Лустгартен Ю.Л.": {
        fullName: "Лустгартен Юрий Леонидович",
        image: "images/teachers/lustgarten_yl.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Алгоритмизация и программирование", "Теория принятия решений", "Теоретические основы программирования"],
        sheduleCode: 273
      },
      "Исаева М.В.": {
        fullName: "Исаева Мария Владимировна",
        image: "images/teachers/isaeva_mv.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Красавина М.С.": {
        fullName: "Красавина Мария Сергеевна",
        image: "images/teachers/krasavina_ms.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Интеллектуальные системы и технологии", "Технологии обработки данных", "Разработка игровых приложений", "Разработка игр на Unreal Engine"],
        sheduleCode: 231
      },
      "Прядкина Н.О.": {
        fullName: "Прядкина Нина Олеговна",
        image: "images/teachers/pryadkina_no.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Управление данными", "Базы данных"],
        sheduleCode: 352
      },
      "Смирнова С.Г.": {
        fullName: "Смирнова Светлана Геннадьевна",
        image: "images/teachers/smirnova_sg.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Модели и методы научных исследований", "Теория систем и системный анализ", "Стандартизация и сертификация программного обеспечения", "Информационные технологии"],
        sheduleCode: 427
      },
      "Демчинова Е.А.": {
        fullName: "Демчинова Елена Александровна",
        image: "images/teachers/demchinova_ea.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: ["Теоретические основы информатики", "Информационные технологии", "Web-разработка", "Управление цифровым контентом"],
        sheduleCode: 114
      },
      "Дорохова Ж.В.": {
        fullName: "Дорохова Жана Викторовна",
        image: "images/teachers/dorohova_zv.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: ["Мультимедиатехнологии", "Основы композиции и колористика", "История дизайна", "Дизайн и рекламные технологии", "Дизайн массовой информации", "3d моделирование", "Основы компьютерного дизайна", "Компьютерная геометрия"],
        sheduleCode: 121
      },
      "Орлов А.В.": {
        fullName: "Орлов Александр Валерьевич",
        image: "images/teachers/orlov_av.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Архитектура ЭВМ", "Технологии компьютерного зрения", "Методы и средства проектирования информационных систем", "Программная инженерия"],
        sheduleCode: 320
      },
      "Шатрова О.А.": {
        fullName: "Шатрова Ольга Антоновна",
        image: "images/teachers/shatrova_oa.jpg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: []
      },
      "Логинова А.А.": {
        fullName: "Логинова Анна Александровна",
        image: "images/teachers/loginova_aa.jpg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: [],
        sheduleCode: 653
      },
      "Силенок Ю.В.": {
        fullName: "Силенок Юрий Викторович",
        image: "images/teachers/silenok_yv.jpg",
        academicDegree: "",
        workPost: "Программист ООО \"Экзактпро\"",
        courses: ["Технологии разработки программного обеспечения", "Тестирование сложных интеллектуальных систем и беспилотных автомобилей"],
        sheduleCode: 654,
        extra: ["Программист ООО \"Экзактпро\""]
      },
      "Иваницкий В.В.": {
        fullName: "Иваницкий Виталий Викторович",
        image: "images/teachers/ivanitskiy_vv.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент",
        courses: ["Экономика", "Экономика машиностроительных производств", "Технико- экономический анализ эффективности принятия технических решений", "Маркетинг", "Основы научной организации труда", "Организация и планирование предприятий малого бизнеса", "Социология труда и управление персоналом", "Экономика и управление на деревообрабатывающих предприятиях", "Организация производства", "Бизнес-процессы и бизнес-планирование", "Экономика организации", "Экономическая информатика", "Финансовые технологии инновации"],
        sheduleCode: 164,
        extra: ["Иваницкий Витайлий Викторович"]
      },
      "Попова С.В.": {
        fullName: "Попова Светлана Валентиновна",
        image: "images/teachers/popova_sv.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры экономики и управления",
        courses: ["Ценообразование", "Конкурентное и потребительское право", "Организация коммуникационной деятельности предприятия", "Управление человеческими ресурсами", "Защита прав потребителей", "Тайм-менеджмент", "Интернет-коммуникации в государственном секторе", "Государственное регулирование рекламной деятельности", "Организация предпринимательской деятельности"],
        sheduleCode: 349
      },
      "Денисов А.Р.": {
        fullName: "Денисов Артем Руфимович",
        image: "images/teachers/denisov_ar.jpg",
        academicDegree: "доктор технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Панин И.Г.": {
        fullName: "Панин Игорь Григорьевич",
        image: "images/teachers/panin_ig.jpg",
        academicDegree: "доктор технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Численные методы", "Моделирование информационных систем", "Методы оптимизации", "Параллельные вычисления и высокопроизводительные системы"],
        sheduleCode: 331
      },
      "Дружинина А.Г.": {
        fullName: "Дружинина Анна Григорьевна",
        image: "images/teachers/druzhinina_ag.jpg",
        academicDegree: "кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Инфокоммуникационные системы и сети", "Операционные системы", "Информационная безопасность", "Обеспечение безопасности процессов разработки информационных систем", "Правовые основы информационной безопасности и управления персональными данными"],
        sheduleCode: 123
      },
      "Кириллова Е.С.": {
        fullName: "Кириллова Екатерина Сергеевна",
        image: "images/teachers/kirillova_es.jpg",
        academicDegree: "кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Основы информатизации предприятий", "Архитектура цифровых предприятий", "Основы вычислительной техники"],
        sheduleCode: 191
      },
      "Чувиляева А.С.": {
        fullName: "Чувиляева Александра Сергеевна",
        image: "images/teachers/chuvilyaeva_as.jpg",
        academicDegree: "кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Основы вычислительной техники", "Моделирование информационных систем", "Информационные технологии"],
        sheduleCode: 503
      },
      "Мозохин А.Е.": {
        fullName: "Мозохин Александр Евгеньевич",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Кандидат технических наук, доцент",
        workPost: "Доцент кафедры",
        courses: [],
        sheduleCode: 748
      }
    },
    "Кафедра Защиты информации": {
      "Виноградова Г.Л.": {
        fullName: "Виноградова Галина Леонидовна",
        image: "images/teachers/vinogradova_gl.jpg",
        academicDegree: "кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Заведующий кафедрой",
        courses: ["Информационные технологии в информационной безопасности", "теоретические основы процессов защиты информации", "моделирование процессов и систем защиты информации", "организационное и правовое обеспечение информационной безопасности", "нормативная база", "российские и международные стандарты по информационной безопасности", "информационный менеджмент"],
        sheduleCode: 73
      },
      "Землякова И.В.": {
        fullName: "Землякова Ирина Владимировна",
        image: "images/teachers/zemlyakova_iv.jpg",
        academicDegree: "доктор технических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: ["Информационная безопасность", "Автоматизация технологических процессов и производств"],
        sheduleCode: 156
      },
      "Волков А.А.": {
        fullName: "Волков Антон Андреевич",
        image: "images/teachers/volkov_aa.jpg",
        academicDegree: "кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Языки и методы программирования", "Базы данных (направления подготовки: 10.03.01–Информационная безопасность)"],
        sheduleCode: 75
      },
      "Пигузов А.А.": {
        fullName: "Пигузов Алексей Александрович",
        image: "images/teachers/piguzov_aa.jpg",
        academicDegree: "Кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Информационные технологии", "Операционные системы", "Информационная безопасность", "Новые информационные технологии в образовании", "Системное и прикладное программное обеспечение", "Информатика и основы информационной безопасности"],
        sheduleCode: 339
      },
      "Чередникова А.В.": {
        fullName: "Чередникова Алла Викторовна",
        image: "images/teachers/cherednikova_av.jpg",
        academicDegree: "кандидат физико-математических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Теория информации и кодирования", "дискретная математика", "численные методы и математическое моделирование", "дополнительные главы высшей математики", "математические основы криптологии", "методы и средства криптографической защиты информации (направление подготовки 10.03.01–Информационная безопасность)"],
        sheduleCode: 499
      },
      "Синкевич А.С.": {
        fullName: "Синкевич Александр Сергеевич",
        image: "images/teachers/sinkevich_as.jpg",
        academicDegree: "Полковник",
        workPost: "Cтарший преподаватель кафедры",
        courses: [],
        sheduleCode: 647,
        extra: ["полковник"]
      },
      "Смирнова Е.С.": {
        fullName: "Смирнова Елена Сафаровна",
        image: "images/teachers/smirnova_es.jpg",
        academicDegree: "кандидат педагогических наук",
        workPost: "Доцент кафедры",
        courses: ["Информатика и основы информационной безопасности", "Информатика", "Основы информационной безопасности", "Кибергигиена", "Основы проектной деятельности", "Защита информации в компьютерных системах"],
        sheduleCode: 417
      },
      "Соболев Д.А.": {
        fullName: "Соболев Денис Александрович",
        image: "images/teachers/sobolev_da.jpg",
        academicDegree: "аспирант ВИНИТИ РАН, ведущий специалист отдела защиты информации ОАО «Газпром. Газораспределение Кострома»",
        workPost: "Аспирант ВИНИТИ РАН, ведущий специалист отдела защиты информации ОАО «Газпром. Газораспределение Кострома»",
        courses: ["Сети и системы передачи информации", "безопасность компьютерных сетей (направления подготовки: 10.03.01–Информационная безопасность)"],
        sheduleCode: 646
      },
      "Виноградов Е.В.": {
        fullName: "Виноградов Евгений Валентинович",
        image: "images/teachers/vinogradov_ev.jpg",
        academicDegree: "Кандидат педагогических наук",
        workPost: "Доцент кафедры",
        courses: ["Информационно-коммуникационные технологии", "Информатика информационнокоммуникационные технологии в профессиональной деятельности", "Информатика и основы информационной безопасности", "Информационная безопасность", "Технические средства охраны и видеонаблюдения", "Аппаратные средства вычислительной техники"],
        sheduleCode: 605
      },
      "Чебунькина Т.А.": {
        fullName: "Чебунькина Татьяна Алексеевна",
        image: "images/teachers/chebunkina_ta.jpg",
        academicDegree: "Кандидат технических наук",
        workPost: "Доцент кафедры",
        courses: ["Дополнительные главы высшей математики", "Численные методы и математическое моделирование", "Теория информации и кодирование", "Теория вероятностей и математическая статистика"],
        sheduleCode: 947
      }
    },
    "Преподаватели НПР ДПО": {
      "Жбанов Е.А.": {
        fullName: "Жбанов Егор Андреевич",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Преподаватель ДПО",
        courses: ["Алгоритмизация и программирование(C#)"],
        sheduleCode: 1180
      },
      "Гурьев С.В.": {
        fullName: "Гурьев Сергей Владимирович",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Ассистент кафедры",
        courses: ["Алгоритмизация и программирование(C#)", "Инфокоммуникационные системы и сети", "Операционные системы", "Основы автоматизации сборки и развертывания приложений"],
        sheduleCode: 1128
      }
    }
  },
  "Институт промышленных технологий и дизайна": {
    "Администрация института": {
      "Шорохов С.А.": {
        fullName: "Шорохов Сергей Александрович",
        image: "images/teachers/shorohov_sa.jpg",
        academicDegree: "",
        workPost: "Директор института",
        courses: []
      },
      "Тихонова Е.Ю.": {
        fullName: "Тихонова Екатерина Юрьевна",
        image: "images/teachers/tihonova_ey.jpg",
        academicDegree: "",
        workPost: "Зам. директора ИПТД по учебной и воспитательной работе",
        courses: []
      },
      "Лебедева Т.В.": {
        fullName: "Лебедева Татьяна Викторовна",
        image: "images/teachers/lebedeva_tv.jpg",
        academicDegree: "",
        workPost: "Зам. директора ИПТД по науке",
        courses: []
      },
      "Красавчикова А.П.": {
        fullName: "Красавчикова Анна Павловна",
        image: "images/teachers/krasavchikova_ap.jpg",
        academicDegree: "",
        workPost: "Зам. директора ИПТД по профориентационной работе",
        courses: []
      },
      "Матюхина Е.Ю.": {
        fullName: "Матюхина Елена Юрьевна",
        image: "images/teachers/matyuhina_ey.jpg",
        academicDegree: "",
        workPost: "Специалист по учебно-методической работе ИПТД",
        courses: []
      },
      "Журавлева С.А.": {
        fullName: "Журавлева Светлана Алексеевна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "",
        workPost: "Специалист по учебно-методической работе ИПТД",
        courses: []
      },
      "Ступникова Л.Ю.": {
        fullName: "Ступникова Лариса Юрьевна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "",
        workPost: "Специалист дирекции по учебно-методической работе ИПТД",
        courses: []
      },
      "Минеева О.Г.": {
        fullName: "Минеева Ольга Геннадьевна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "",
        workPost: "Специалист дирекции по учебно-методической работе ИПТД",
        courses: []
      },
      "Волков Е.А.": {
        fullName: "Волков Егор Алексеевич",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "",
        workPost: "Специалист дирекции по учебно-методической работе ИПТД",
        courses: []
      },
      "Черепанова Е.И.": {
        fullName: "Черепанова Елена Игоревна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "",
        workPost: "Специалист дирекции по информационным системам",
        courses: []
      }
    },
    "Кафедра Теории механизмов и машин, деталей машин и проектирования технологических машин": {
      "Корабельников А.Р.": {
        fullName: "Корабельников Андрей Ростиславович",
        image: "images/teachers/korabelnikov_ar.jpg",
        academicDegree: "Доктор технических наук",
        academicTitle: "Профессор",
        workPost: "Заведующий кафедрой",
        courses: []
      },
      "Рудовский П.Н.": {
        fullName: "Рудовский Павел Николаевич",
        image: "images/teachers/rudovskiy_pn.jpg",
        academicDegree: "Доктор технических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Гречухин А.П.": {
        fullName: "Гречухин Александр Павлович",
        image: "images/teachers/grechuhin_ap.jpg",
        academicDegree: "Доктор технических наук",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Сокова Г.Г.": {
        fullName: "Сокова Галина Георгиевна",
        image: "images/teachers/sokova_gg2.jpeg",
        academicDegree: "Доктор технических наук",
        academicTitle: "Доцент",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Богатырева М.С.": {
        fullName: "Богатырева Марина Сергеевна",
        image: "images/teachers/bogatyreva_ms.jpeg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент",
        courses: []
      },
      "Чернышева Л.В.": {
        fullName: "Чернышева Любовь Владимировна",
        image: "images/teachers/chernysheva_lv.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Лебедев Д.А.": {
        fullName: "Лебедев Дмитрий Александрович",
        image: "images/teachers/lebedev_da.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Букина С.В.": {
        fullName: "Букина Светлана Васильевна",
        image: "images/teachers/bukina_sv.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Ситникова Т.А.": {
        fullName: "Ситникова Татьяна Александровна",
        image: "images/teachers/sitnikova_ta.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Громова Е.И.": {
        fullName: "Громова Екатерина Ивановна",
        image: "images/teachers/gromova_ei.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Делекторская И.А.": {
        fullName: "Делекторская Ирина Арнольдовна",
        image: "images/teachers/delektorskaya_ia.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      }
    },
    "Кафедра Технологии художественной обработки материалов, художественного проектирования, искусств и технического сервиса": {
      "Шорохов С.А.": {
        fullName: "Шорохов Сергей Александрович",
        image: "images/teachers/shorohov_sa.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Заведующий кафедрой",
        courses: []
      },
      "Безденежных А.Г.": {
        fullName: "Безденежных Алла Германовна",
        image: "images/teachers/bezdenezhnyh_ag.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Беляева И.Б.": {
        fullName: "Беляева Ирина Борисовна",
        image: "images/teachers/belyaeva_ib.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Галанин С.И.": {
        fullName: "Галанин Сергей Ильич",
        image: "images/teachers/galanin_si.jpg",
        academicDegree: "Доктор технических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Егорова М.Г.": {
        fullName: "Егорова Марина Германовна",
        image: "images/teachers/egorova_mg.jpg",
        academicDegree: "Кандидат исторических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Заева Н.А.": {
        fullName: "Заева Надежда Александровна",
        image: "images/teachers/zaeva_na.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Зяблова С.Л.": {
        fullName: "Зяблова Светлана Леонидовна",
        image: "images/teachers/zyablova_sl.jpg",
        academicDegree: "Кандидат исторических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Лебедева Т.В.": {
        fullName: "Лебедева Татьяна Викторовна",
        image: "images/teachers/lebedeva_tv2.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Петровская Л.М.": {
        fullName: "Петровская Людмила Михайловна",
        image: "images/teachers/petrovskaya_lm.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Каргина С.И.": {
        fullName: "Каргина Светлана Игоревна",
        image: "images/teachers/kargina_si.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Тихонова Е.Ю.": {
        fullName: "Тихонова Екатерина Юрьевна",
        image: "images/teachers/tihonova_ey.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Трошина О.А.": {
        fullName: "Трошина Ольга Александровна",
        image: "images/teachers/troshina_oa.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Усина И.Б.": {
        fullName: "Усина Ирина Борисовна",
        image: "images/teachers/usina_ib.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Юзенков Ю.О.": {
        fullName: "Юзенков Юрий Олегович",
        image: "images/teachers/yuzenkov_yo.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Черепанова Е.И.": {
        fullName: "Черепанова Елена Игоревна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: []
      },
      "Зимницкий О.В.": {
        fullName: "Зимницкий Олег Владиславович",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Краснов О.А.": {
        fullName: "Краснов Олег Афанасьевич",
        image: "images/teachers/krasnov_oa.jpg",
        academicDegree: "",
        workPost: "Заведующий лабораториями",
        courses: []
      },
      "Цветков Д.М.": {
        fullName: "Цветков Денис Михайлович",
        image: "images/teachers/tsvetkov_dm.jpg",
        academicDegree: "",
        workPost: "Заведующий лабораторией аддитивных технологий",
        courses: []
      }
    },
    "Кафедра Лесозаготовительных и деревоперерабатывающих производств": {
      "Титунин А.А.": {
        fullName: "Титунин Андрей Александрович",
        image: "images/teachers/titunin_aa.jpg",
        academicDegree: "доктор технических наук",
        academicTitle: "Доцент",
        workPost: "Заведующий кафедрой лесозаготовительных и деревоперерабатывающих производств",
        courses: []
      },
      "Данилов Ю.П.": {
        fullName: "Данилов Юрий Петрович",
        image: "images/teachers/danilov_yp.jpg",
        academicDegree: "Кандидат технических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Вахнина Т.Н.": {
        fullName: "Вахнина Татьяна Николаевна",
        image: "images/teachers/vahnina_tn.jpg",
        academicDegree: "кандидат технических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Федотов А.А.": {
        fullName: "Федотов Александр Андреевич",
        image: "images/teachers/fedotov_aa.jpg",
        academicDegree: "кандидат технических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Рыжова Н.В.": {
        fullName: "Рыжова Надежда Васильевна",
        image: "images/teachers/ryzhova_nv.jpg",
        academicDegree: "кандидат биологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Хохлова Е.С.": {
        fullName: "Хохлова Елена Сергеевна",
        image: "images/teachers/hohlova_es.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Сусоева И.В.": {
        fullName: "Сусоева Ирина Вячеславловна",
        image: "images/teachers/susoeva_iv.jpg",
        academicDegree: "",
        workPost: "Профессор кафедры",
        courses: [],
        extra: ["Сусоева Ирина Вячеславовна"]
      },
      "Подъячев А.В.": {
        fullName: "Подъячев Алексей Викторович",
        image: "images/teachers/podyachev_av.jpg",
        academicDegree: "Доктор технических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: []
      }
    },
    "Кафедра Техносферной безопасности": {
      "Лустгартен Т.Ю.": {
        fullName: "Лустгартен Татьяна Юрьевна",
        image: "images/teachers/lustgarten_ty.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Заведующий кафедрой техносферной безопасности",
        courses: []
      },
      "Норкин А.В.": {
        fullName: "Норкин Андрей Валентинович",
        image: "images/teachers/norkin_av.jpg",
        academicDegree: "",
        workPost: "Преподаватель кафедры",
        courses: [],
        extra: ["подполковник внутренней службы в запасе"]
      },
      "Шапкина И.М.": {
        fullName: "Шапкина Ирина Михайловна",
        image: "images/teachers/shapkina_im.jpg",
        academicDegree: "Кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Шабарова О.Н.": {
        fullName: "Шабарова Ольга Николаевна",
        image: "images/teachers/shabarova_on.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Смирнов М.В.": {
        fullName: "Смирнов Максим Валерьевич",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "",
        workPost: "Преподаватель кафедры",
        courses: []
      },
      "Бабкина А.Л.": {
        fullName: "Бабкина Анна Леонидовна",
        image: "images/teachers/babkina_al.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Рулева В.В.": {
        fullName: "Рулева Виктория Валерьевна",
        image: "images/teachers/ruleva_vv.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: [],
        extra: ["Экономист ООО \"Техностан'. Представитель работодателя."]
      },
      "Сирая О.Ю.": {
        fullName: "Сирая Ольга Юрьевна",
        image: "images/teachers/siraya_oy.jpg",
        academicDegree: "",
        workPost: "Преподаватель кафедры",
        courses: [],
        extra: ["психолог отделения ФПС ГПС по медицинскому и психологическому обеспечению ОМПО УМТО ГУ МЧС России по Костромской области"]
      },
      "Богатырева М.С.": {
        fullName: "Богатырева Марина Сергеевна",
        image: "images/teachers/bogatyreva_ms.jpeg",
        academicDegree: "Кандидат технических наук",
        workPost: "Доцент кафедры техносферной безопасности",
        courses: []
      },
      "Конорезов Ю.А.": {
        fullName: "Конорезов Юрий Алексеевич",
        image: "images/teachers/konorezov_ya.jpg",
        academicDegree: "",
        workPost: "Начальник аварийно-спасательного отряда МКУ \"Центр гражданской защиты города Костромы",
        courses: []
      }
    },
    "Кафедра Дизайна, технологии, материаловедения и экспертизы потребительских товаров": {
      "Иванова О.В.": {
        fullName: "Иванова Ольга Владимировна",
        image: "images/teachers/ivanova_ov.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Заведующая кафедрой",
        courses: [],
        extra: ["Председатель КРО ООО «Союз дизайнеров России»", "Представитель благотворительного фонда «Русский силуэт»", "Член Экспертного совета по рекламе и недобросовестной конкуренции при Костромском УФАС России"]
      },
      "Чагина Л.Л.": {
        fullName: "Чагина Любовь Леонидовна",
        image: "images/teachers/chagina_ll.jpg",
        academicDegree: "Доктор технических наук",
        academicTitle: "Доцент",
        workPost: "Профессор кафедры",
        courses: [],
        extra: ["Ученый секретарь диссертационного совета Д 212.093.02 КГУ"]
      },
      "Хохлова Е.Е.": {
        fullName: "Хохлова Екатерина Евгеньевна",
        image: "images/teachers/hohlova_ee.jpg",
        academicDegree: "кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Аккуратова О.Л.": {
        fullName: "Аккуратова Ольга Леонидовна",
        image: "images/teachers/akkuratova_ol.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: [],
        extra: ["Член Союза дизайнеров России"]
      },
      "Горева Е.П.": {
        fullName: "Горева Елена Павловна",
        image: "images/teachers/goreva_ep.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: [],
        extra: ["Член Союза дизайнеров России"]
      },
      "Громова А.Е.": {
        fullName: "Громова Анастасия Евгеньевна",
        image: "images/teachers/gromova_ae.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: [],
        extra: ["Член Творческого союза художников"]
      },
      "Егорова Т.В.": {
        fullName: "Егорова Татьяна Владимировна",
        image: "images/teachers/egorova_tv.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: [],
        extra: ["Член Московской ассоциации «Международный Союз дизайнеров»"]
      },
      "Костюкова Ю.А.": {
        fullName: "Костюкова Юлия Алексеевна",
        image: "images/teachers/kostyukova_ya.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: [],
        extra: ["Член Международной ассоциации «Союз дизайнеров»"]
      },
      "Красавчикова А.П.": {
        fullName: "Красавчикова Анна Павловна",
        image: "images/teachers/krasavchikova_ap2.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Погорелова М.Л.": {
        fullName: "Погорелова Мария Леонидовна",
        image: "images/teachers/pogorelova_ml.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: [],
        extra: ["Член Союза дизайнеров России"]
      },
      "Репина Н.Э.": {
        fullName: "Репина Надежда Эдуардовна",
        image: "images/teachers/repina_ne.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: [],
        extra: ["Член Союза Художников России"]
      },
      "Румянцева О.В.": {
        fullName: "Румянцева Ольга Валентиновна",
        image: "images/teachers/rumyantseva_ov.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: [],
        extra: ["Член Союза художников России"]
      },
      "Пугачева И.Б.": {
        fullName: "Пугачева Ирина Борисовна",
        image: "images/teachers/pugacheva_ib.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Рассадина С.П.": {
        fullName: "Рассадина Светлана Павловна",
        image: "images/teachers/rassadina_sp.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: [],
        extra: ["Член Союза дизайнеров России"]
      },
      "Муравская Н.Н.": {
        fullName: "Муравская Наталья Николаевна",
        image: "images/teachers/muravskaya_nn.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Денисенко Т.А.": {
        fullName: "Денисенко Татьяна Анатольевна",
        image: "images/teachers/denisenko_ta.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Маринко Е.А.": {
        fullName: "Маринко Елена Александровна",
        image: "images/teachers/marinko_ea.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Жемчужная Е.Е.": {
        fullName: "Жемчужная Елена Евгеньевна",
        image: "images/teachers/zhemchuzhnaya_ee.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Шипарева М.Г.": {
        fullName: "Шипарева Марья Герасимовна",
        image: "images/teachers/shipareva_mg.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Гогин Е.Г.": {
        fullName: "Гогин Егор Гордеевич",
        image: "images/teachers/gogin_eg.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Колганова Н.Н.": {
        fullName: "Колганова Наталья Николаевна",
        image: "images/teachers/kolganova_nn.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Антонова Н.Н.": {
        fullName: "Антонова Наталья Николаевна",
        image: "images/teachers/antonova_nn.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Чернова Д.А.": {
        fullName: "Чернова Дария Александровна",
        image: "images/teachers/chernova_da.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Волкова М.Д.": {
        fullName: "Волкова Мария Дмитриевна",
        image: "images/teachers/volkova_md.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Фастунов Д.М.": {
        fullName: "Фастунов Дмитрий Михайлович",
        image: "images/teachers/fastunov_dm.jpg",
        academicDegree: "",
        workPost: "Преподаватель специальных дисциплин кафедры",
        courses: []
      },
      "Борисова М.А.": {
        fullName: "Борисова Мария Александровна",
        image: "images/teachers/borisova_ma.jpg",
        academicDegree: "",
        workPost: "",
        courses: [],
        extra: ["ресторатор, индивидуальный предприниматель"]
      },
      "Москвина В.В.": {
        fullName: "Москвина Вероника Валерьевна",
        image: "images/teachers/moskvina_vv.jpeg",
        academicDegree: "",
        workPost: "Преподаватель, педагог дополнительного образования ГБУ ДО КО «Центр технического творчества», структурного подразделения ДТ «Кванториум»",
        courses: []
      },
      "Копылова Х.О.": {
        fullName: "Копылова Христиана Олеговна",
        image: "images/teachers/kopylova_ho.jpg",
        academicDegree: "",
        workPost: "Ассистент",
        courses: []
      }
    },
    "Кафедра Автоматики, микропроцессорной техники и технологии машиностроения": {
      "Лапшин В.В.": {
        fullName: "Лапшин Валерий Васильевич",
        image: "images/teachers/lapshin_vv.jpg",
        academicDegree: "Доктор технических наук",
        academicTitle: "Доцент",
        workPost: "И.о. заведующего кафедрой",
        courses: []
      },
      "Староверов Б.А.": {
        fullName: "Староверов Борис Александрович",
        image: "images/teachers/staroverov_ba.jpg",
        academicDegree: "Доктор технических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Бойко С.В.": {
        fullName: "Бойко Светлана Вадимовна",
        image: "images/teachers/boyko_sv.jpg",
        academicDegree: "Доктор технических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Дроздов В.Г.": {
        fullName: "Дроздов Владимир Георгиевич",
        image: "images/teachers/drozdov_vg.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Профессор",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Воронова Л.В.": {
        fullName: "Воронова Лариса Викторовна",
        image: "images/teachers/voronova_lv.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Олоничев В.В.": {
        fullName: "Олоничев Василий Вадимович",
        image: "images/teachers/olonichev_vv.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Попова Г.М.": {
        fullName: "Попова Галина Михайловна",
        image: "images/teachers/popova_gm.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Саликова Е.В.": {
        fullName: "Саликова Елена Владимировна",
        image: "images/teachers/salikova_ev.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Куликов А.В.": {
        fullName: "Куликов Андрей Владимирович",
        image: "images/teachers/kulikov_av.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Смирнов М.А.": {
        fullName: "Смирнов Максим Александрович",
        image: "images/teachers/smirnov_ma.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Соколова Е.В.": {
        fullName: "Соколова Елена Васильевна",
        image: "images/teachers/sokolova_ev.jpg",
        academicDegree: "Кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Изотов В.А.": {
        fullName: "Изотов Владимир Анатольевич",
        image: "images/teachers/izotov_va.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      }
    },
    "Кафедра Технологии и проектирования тканей и трикотажа": {
      "Богатырева М.С.": {
        fullName: "Богатырева Марина Сергеевна",
        image: "images/teachers/bogatyreva_ms.jpeg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент",
        courses: []
      },
      "Гречухин А.П.": {
        fullName: "Гречухин Александр Павлович",
        image: "images/teachers/grechuhin_ap.jpg",
        academicDegree: "Доктор технических наук",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Сокова Г.Г.": {
        fullName: "Сокова Галина Георгиевна",
        image: "images/teachers/sokova_gg2.jpeg",
        academicDegree: "Доктор технических наук",
        academicTitle: "Доцент",
        workPost: "Заведующий кафедрой технологии и проектирования тканей и трикотажа",
        courses: []
      },
      "Чернышева Л.В.": {
        fullName: "Чернышева Любовь Владимировна",
        image: "images/teachers/chernysheva_lv.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Тихонова Е.Ю.": {
        fullName: "Тихонова Екатерина Юрьевна",
        image: "images/teachers/tihonova_ey2.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Учебный мастер",
        courses: [],
        extra: ["Козлова Лидия Николаевна"]
      }
    },
    "Преподаватели НПР ДПО": {
      "Киселев М.В.": {
        fullName: "Киселев Михаил Владимирович",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Доктор технических наук",
        academicTitle: "Доцент",
        workPost: "Профессор",
        courses: ["Процессы и операции формообразования", "Проектирование машиностроительных производств", "Методы прогнозирования и оценок технологичности конструкций", "Математические методы в инженерии", "Новые конструкционные материалы", "Компьютерные технологии в машиностроении"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: инженер-механик", "Направление подготовки: Технология машиностроения, металлорежущие станки и инструменты", "Общий стаж: 42 года", "Стаж по специальности: 35 лет", "Образовательные программы: 15.03.05 Конструкторско-технологическое обеспечение машиностроительных производств Профиль Технология машиностроения; 15.04.02 Технологические машины и оборудование Программа магистратуры Процессы механической и физико-технической обработки, станки и инструменты"]
      },
      "Михайлов А.Ю.": {
        fullName: "Михайлов Алексей Юрьевич",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Кандидат технических наук",
        workPost: "Доцент",
        courses: ["Технологические процесы в машиностроении", "Системы технологической подготовки производства", "Проектирование и организация машиностроительного производства", "Основы технологии сварочных процессов", "Технология машиностроения", "Технологическая подготовка производства", "Физико-техническая обработка в машиностроении"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: инженер-механик по специальности \"Технология машиностроения\"", "Направление подготовки: Технология машиностроения", "Повышение квалификации: с 27.11.2023 г. по 21.12.2023 г., Лоянский институт науки и технологии - ПК \"Практика преподавания инженерных курсов китайским студентам\", 72 часа (удостоверение № рег. 202309 от 21.12.2023 г.)", "Общий стаж: 25 лет", "Стаж по специальности: 28 лет", "Образовательные программы: 15.03.05 Конструкторско-технологическое обеспечение машиностроительных производств Профиль Технология машиностроения; 15.04.02 Технологические машины и оборудование Программа магистратуры Процессы механической и физико-технической обработки, станки и инструменты"]
      },
      "Михайлов С.В.": {
        fullName: "Михайлов Станислав Васильевич",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Доктор технических наук",
        academicTitle: "Профессор",
        workPost: "Профессор",
        courses: ["Инструментальное обеспечение современного машиностроительного производства", "Инструментальное обеспечение машиностроительных производств", "Основы проектирования металлорежущих инструментов с криволинейными рабочими поверхностями", "Гидравлика и гидропневмопривод", "Диагностика технических систем", "Основы научных исследований", "организации и планирования эксперимента", "Современные проблемы науки в области технологии машиностроения", "Моделирование процессов в технологии машиностроения"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: инженер-механик", "Направление подготовки: Технология машиностроения, металлорежущие станки и инструменты", "Повышение квалификации: с 13.03.2023 г. по 17.04.2023 г., Санкт-Петербургский политехнический университет Петра Великого\" - ПК \"Повышение производительности изготовления деталей разных классов за счет применения современного цифрового оборудования\", 72 часа (удостоверение № 782400080835 от 17.04.2023 г.)", "Общий стаж: 47 лет", "Стаж по специальности: 45 лет", "Образовательные программы: 15.06.01 Машиностроение Профиль Технология и оборудование механической и физико-технической обработки; 15.03.02 Технологические машины и оборудование Профиль Технология машиностроения; 15.03.05 Конструкторско-технологическое обеспечение машиностроительных производств Профиль Технология машиностроения; 15.04.02 Технологические машины и оборудование Программа магистратуры Процессы механической и физико-технической обработки, станки и инструменты"]
      },
      "Петровский В.С.": {
        fullName: "Петровский Владимир Сергеевич",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Доктор технических наук",
        academicTitle: "Доцент",
        workPost: "Профессор",
        courses: ["Основы инженерной деятельности", "Основы проектной деятельности", "Режущий инструмент", "Проектирование инструмента", "Статистические методы управления качеством", "Управление качеством", "Моделирование точности технологических процессов", "Управление проектами", "Теоретическая механика"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: инженер-механик", "Направление подготовки: Технология машиностроения, металлорежущие станки и инструменты", "Общий стаж: 50 лет", "Стаж по специальности: 50 лет", "Образовательные программы: 15.03.02 Технологические машины и оборудование Профиль Технология машиностроения; 15.03.05 Конструкторско-технологическое обеспечение машиностроительных производств Профиль Технология машиностроения; 15.04.02 Технологические машины и оборудование Программа магистратуры Процессы механической и физико-технической обработки, станки и инструменты"]
      },
      "Померанцев М.А.": {
        fullName: "Померанцев Максим Александрович",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Старший преподаватель",
        courses: ["CAD/CAM/CAE -системы", "Оптимизационные методы в машиностроении", "Информационные технологии в машиностроении", "Компьютерная графика в машиностроении", "Проектирование инструмента", "Формообразующие операции"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: инженер-механик", "Направление подготовки: Технология машиностроения", "Повышение квалификации: с 01.06.2023 года по 03.07.2023 Кострома ПК «Ключевые компетенции в формировании стратегии развития университета», 36 ч., КГУ ИПР (удостоверение № 440600045313 от 03.07.2023)\nс 11.04.2023 по 15.05.2023, Кострома, ПК «Цифровые инструменты и сервисы в деятельности преподавателя вуза», 48 часов, КГУ ИПР (№440600045120 от 14.05.2023)", "Общий стаж: 29 лет", "Стаж по специальности: 28 лет", "Образовательные программы: 15.03.02 Технологические машины и оборудование Профиль Технология машиностроения; 15.03.05 Конструкторско-технологическое обеспечение машиностроительных производств Профиль Технология машиностроения; 29.03.04 Технология художественной обработки материалов Профиль Современные технологии ювелирно-художественных производств"]
      },
      "Романов В.В.": {
        fullName: "Романов Владимир Викторович",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент",
        courses: ["Автоматизация производственных процессов", "Гибкие автоматизированные производства", "Программирование станков с числовым программным управлением", "Управление системами и процессами", "Системы автоматизированного контроля параметров технологических процессов в машиностроении", "Мехатронные модули станочных систем", "Основы мехатроники и робототехники"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: инженер-механик", "Направление подготовки: Технология машиностроения, металлорежущие станки и инструменты", "Повышение квалификации: с 27.03.2023 по 10.04.2023 Кострома ПК «Психолого-педагогические основы преподавательской деятельности в системе СПО», 30 ч., КГУ ИПР (удостоверение № 440600044982 от 10.04.2023)", "Общий стаж: 46 лет", "Стаж по специальности: 48 лет", "Образовательные программы: 15.03.02 Технологические машины и оборудование Профиль Технология машиностроения; 15.03.05 Конструкторско-технологическое обеспечение машиностроительных производств Профиль Технология машиностроения; 15.04.02 Технологические машины и оборудование Программа магистратуры Процессы механической и физико-технической обработки, станки и инструменты"]
      },
      "Садов В.А.": {
        fullName: "Садов Владимир Александрович",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент",
        courses: ["Технологическая оснастка", "Маркетинг", "Металлорежущие станки и оборудование", "Приводы технологических машин", "Менеджмент и маркетинг", "Управление рисками и ресурсами в производственных процессах"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: инженер-механие", "Направление подготовки: технология машиностроения, металлорежущие станки и инструменты", "Общий стаж: 47 лет", "Стаж по специальности: 50 лет", "Образовательные программы: 15.03.02 Технологические машины и оборудование Профиль Технология машиностроения; 15.03.05 Конструкторско-технологическое обеспечение машиностроительных производств Профиль Технология машиностроения; 15.04.02 Технологические машины и оборудование Программа магистратуры Инновации и рынок машин и оборудования"]
      },
      "Тихомиров Л.А.": {
        fullName: "Тихомиров Леонид Алексеевич",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Кандидат технических наук",
        workPost: "Доцент",
        courses: ["Системный подход и критическое мышление Основы проектной деятельности Управление проектами Технологическое предпринимательство Проектное мышление Использование информационно-коммуникационных технологий в образовательном процессе дошкольной образовательной организации Основы научной организации труда студентов Информатика и информационно-коммуникационные технологии в профессиональной деятельности"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: инженер; магистр", "Направление подготовки: Технология деревообработки; Менеджмент", "Повышение квалификации: с 09.01.2024 по 12.01.2024, ФГБОУ ВО \"Костромской государственный университет\", ПК \"Основы бережливого производства. Фабрика процессов\", 21 час, (удостоверение 440600045858 от 12.01.2024г.);", "Общий стаж: 23 года", "Стаж по специальности: 7 лет", "Образовательные программы: 03.03.02 Физика Профиль Физика; 04.03.01 Химия Профиль Химия; 06.03.01 Биология Профиль Экологические биотехнологии; 09.03.02 Информационные системы и технологии Профиль Разработка программного обеспечения информационных систем; 09.03.02 Информационные системы и технологии Профиль Поддержка и развитие ИТ-инфраструктуры компаний; 09.03.02 Информационные системы и технологии Профиль Информационные технологии в медиаиндустрии; 09.03.02 Информационные системы и технологии Профиль Разработка и внедрение интеллектуальных компонентов информационных систем; 10.03.01 Информационная безопасность Профиль \"Организация и технология защиты информации\" (по отрасли или в сфере профессиональной деятельности); 15.03.04 Автоматизация технологических процессов и производств Профиль Компьютерные системы управления в производстве и бизнесе; 19.03.04 Технология продукции и организация общественного питания Профиль Ресторанное дело; 20.03.01 Техносферная безопасность Профиль Риск-менеджмент в техносфере; 29.03.02 Технологии и проектирование текстильных изделий Профиль Технологии цифрового проектирования композиционных материалов; 29.03.04 Технология художественной обработки материалов Профиль Современные технологии ювелирно-художественных производств; 29.03.05 Конструирование изделий легкой промышленности Профиль Цифровые технологии в индустрии моды; 35.03.02 Технология лесозаготовительных и деревоперерабатывающих производств Профиль Цифровые технологии проектирования и производства продукции из древесины; 38.03.01 Экономика Профиль Учет и анализ бизнес-процессов; 38.03.01 Экономика Профиль Финансы и кредит; 38.03.02 Менеджмент Профиль Маркетинг и электронная коммерция; 38.03.04 Государственное и муниципальное управление Профиль Управление развитием территорий; 44.03.01 Педагогическое образование Профиль Дошкольное образование; 44.03.05 Педагогическое образование (с двумя профилями подготовки) Профиль Начальное образование, иностранный язык (английский); 54.03.02 Декоративно-прикладное искусство и народные промыслы Профиль Художественный металл; 54.03.03 Искусство костюма и текстиля Профиль Художественное проектирование ювелирных изделий; 54.03.01 Дизайн Профиль Графический дизайн; 03.04.02 Физика Программа магистратуры Физика конденсированного состояния вещества; 29.04.02 Технологии и проектирование текстильных изделий Программа магистратуры Технологии и проектирование армирующих наполнителей композиционных материалов; 29.04.04 Технология художественной обработки материалов Программа магистратуры Технологические приемы дизайн-визуализации ювелирно-художественных изделий; 38.04.01 Экономика Программа магистратуры Банки, финансы, инвестиции; 38.04.02 Менеджмент Программа магистратуры Стратегический и операционный менеджмент; 39.04.02 Социальная работа Программа магистратуры Государственное управление и организация социальной работы; 40.04.01 Юриспруденция Программа магистратуры Правовые основы государственного и муниципального управления; 40.04.01 Юриспруденция Программа магистратуры Юрист в судебных и правоохранительных органах; 40.04.01 Юриспруденция Программа магистратуры Юрист в органах публичной власти; 40.04.01 Юриспруденция Программа магистратуры Правовые основы цифровой трансформации; 44.04.01 Педагогическое образование Программа магистратуры Теория и методика реализации программ углублённого изучения математики; 44.04.01 Педагогическое образование Программа магистратуры Искусственный интеллект, цифровая среда образовательной организации; 44.04.02 Психолого-педагогическое образование Программа магистратуры Психолого-педагогическое сопровождение во всех уровнях образования; 44.04.02 Психолого-педагогическое образование Программа магистратуры Психопедагогика социальных симуляторов и игровых образовательных сред; 44.04.03 Специальное (дефектологическое) образование Программа магистратуры Специальная и клиническая психология личности и семьи; 06.04.01 Биология Программа магистратуры Водные биоресурсы и аквакультура; 37.04.01 Психология Программа магистратуры Психология экстремальных и кризисных состояний; 44.02.01 ДОШКОЛЬНОЕ ОБРАЗОВАНИЕ (воспитатель детей дошкольного возраста); 44.02.02 ПРЕПОДАВАНИЕ В НАЧАЛЬНЫХ КЛАССАХ (Учитель начальных классов)"]
      },
      "Волкова О.Н.": {
        fullName: "Волкова Ольга Николаевна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Ассистент",
        courses: ["Технологии и стили в изделиях ювелирно-художественных производств", "Проектирование и конструирование ювелирно-художественных изделий"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: магистр", "Направление подготовки: Технология художественной обработки материалов", "Общий стаж: 10 лет", "Стаж по специальности: 1 год", "Образовательные программы: 54.03.03 Искусство костюма и текстиля Профиль Художественное проектирование ювелирных изделий"]
      },
      "Клементьева Ю.М.": {
        fullName: "Клементьева Юлия Михайловна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Ассистент",
        courses: ["Дизайн рекламно-выставочной среды", "Дизайн в креативной индустрии", "Продвижение и авторский контроль дизайн-проектов"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: магистр", "Направление подготовки: Технология художественной обработки материалов", "Повышение квалификации: С 23.11.2023 г. по 26.04.2024 г. , ЧПОУ \"Центр профессионального и дополнительного образования ЛАНЬ\", ПК \"Преподаватель университета в новой системе российского образования\", 72 часа (удостоверение № 782421005332 от 26.04.2024 г.)", "Общий стаж: 8 лет", "Стаж по специальности: 1 год", "Образовательные программы: 54.03.02 Декоративно-прикладное искусство и народные промыслы Профиль Художественный металл; 54.03.03 Искусство костюма и текстиля Профиль Художественное проектирование ювелирных изделий; 29.04.04 Технология художественной обработки материалов Программа магистратуры Технологические приемы дизайн-визуализации ювелирно-художественных изделий"]
      },
      "Колодий-Тяжов Л.А.": {
        fullName: "Колодий-Тяжов Леонид Анатольевич",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент",
        courses: ["2D и 3D моделирование художественных изделий", "2D и 3D моделирование ювелирно-художественных изделий", "Графические пакеты программ в дизайне изделий декоративно-прикладного искусства", "Моделирование и изготовление ювелирно-художественных изделий мелкой пластики с использованием современных информационных технологий"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: учитель изобразительного искусства и черчения", "Направление подготовки: Изобразительное искусство и черчение", "Повышение квалификации: КГУ ИПР,с 15 июня 2023 г. по 6 июля 2023 г. - \"Педагогические технологии для преподавателей, кураторов, наставников\", 36 академ. час. (удостоверение № 440600045268 от 6 июля 2023 г.)", "Общий стаж: 20 лет", "Стаж по специальности: 20 лет", "Образовательные программы: 29.03.04 Технология художественной обработки материалов Профиль Современные технологии ювелирно-художественных производств; 54.03.02 Декоративно-прикладное искусство и народные промыслы Профиль Художественный металл; 54.03.03 Искусство костюма и текстиля Профиль Художественное проектирование ювелирных изделий"]
      },
      "Креминский В.В.": {
        fullName: "Креминский Владислав Владимирович",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Ассистент",
        courses: ["Выполнение работ по профессии 12565 \"Исполнитель художественно-оформительских работ\"", "Цифровое проектирование в дизайне", "Основы конструкторско-технологического обеспечения дизайна"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: учитель черчения и изобразительного искусства", "Направление подготовки: черчение и изобразительное исскуство", "Повышение квалификации: ФГБОУ ВО \"Костромской государственный университет\", с 13 мая 2024 г. по 17 июня 2024 г. ПК - \"Управление развитием универсальных надпрофессиональных компетенций у студентов в образовательном процессе\", 72 часа (удостоверение № 440600080876 от 21 июня 2024 г.)", "Общий стаж: 19 лет", "Стаж по специальности: 1 год", "Образовательные программы: 54.02.01 ДИЗАЙН (ПО ОТРАСЛЯМ) дизайнер Профиль получаемого профессионального образования при реализации программы среднего общего образования: гуманитарный"]
      },
      "Максимова-Анохина Е.Н.": {
        fullName: "Максимова-Анохина Елена Николаевна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        academicTitle: "Доцент",
        workPost: "Доцент",
        courses: ["Живопись", "Современные инструменты и технологии проектирования ювелирно-художественных изделий и изделий декоративно-прикладного искусства", "Рисунок и основы преподавания художественных и проектных дисциплин"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: учитель изобразительного искусства и черчения", "Направление подготовки: Изобразительное искусство и черчение", "Общий стаж: 35 лет", "Стаж по специальности: 13 лет", "Образовательные программы: 54.03.02 Декоративно-прикладное искусство и народные промыслы Профиль Художественный металл; 54.03.03 Искусство костюма и текстиля Профиль Художественное проектирование ювелирных изделий"]
      },
      "Хименкова Е.С.": {
        fullName: "Хименкова Елена Станиславовна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Ассистент",
        courses: ["Конструкторско-технологическая документация ювелирной отрасли", "Системы автоматизированного проектирования", "Формообразующие операции в ювелирном производстве", "Технологическая документация для изготовление художественно- промышленных объектов", "Компьютерные методы обработки экспериментальных данных"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: инженер-механик", "Направление подготовки: Машины и аппараты текстильной промышленности", "Повышение квалификации: с 02.02.2023 по 23.03.2023 г., ФГБОУ ВО \"Костромской государственный университет\", ПК \"Основы моделирования в среде ANSYS WorkBench\", 72 час, (удостоверение 440600044916 от 23.03.2023г.);", "Общий стаж: 39 лет", "Стаж по специальности: 1 год", "Образовательные программы: 29.03.04 Технология художественной обработки материалов Профиль Современные технологии ювелирно-художественных производств; 54.03.02 Декоративно-прикладное искусство и народные промыслы Профиль Художественный металл; 54.03.03 Искусство костюма и текстиля Профиль Художественное проектирование ювелирных изделий; 29.04.04 Технология художественной обработки материалов Программа магистратуры Технологические приемы дизайн-визуализации ювелирно-художественных изделий"]
      },
      "Хрушкова Е.А.": {
        fullName: "Хрушкова Екатерина Александровна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Доцент",
        courses: ["Рекламная фотография", "Фотографика", "Дизайн интерьера", "Экспо-дизайн", "Фотографика и фотокомпозиция", "Коммерческая и рекламная фотографика"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: дизайнер", "Направление подготовки: Дизайн", "Повышение квалификации: с 16.11.2023 по 30.11.2023г., ФГБОУ ВО \"Костромской государственный университет\", ПК \"\" Обеспечение антитеррористической защищенности объектов (территорий) образовательных организаций высшего образования\"\", 36 час, (удостоверение 440600045641 от 30.11.2023г.);", "Общий стаж: 12 лет", "Стаж по специальности: 7 лет", "Образовательные программы: 29.03.04 Технология художественной обработки материалов Профиль Дизайн и технология одежды и аксессуаров; 54.03.01 Дизайн Профиль Графический дизайн; 54.04.01 Дизайн Программа магистратуры Дизайн объектов предметной среды; 54.02.01 ДИЗАЙН (ПО ОТРАСЛЯМ) дизайнер Профиль получаемого профессионального образования при реализации программы среднего общего образования: гуманитарный"]
      },
      "Шрубковская А.В.": {
        fullName: "Шрубковская Анна Владиславовна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Ассистент",
        courses: ["Современные инструменты и технологии проектирования ювелирно-художественных изделий и изделий декоративно-прикладного искусства", "Проектирование и конструирование ювелирно-художественных изделий", "Дизайн ювелирно-художественных изделий"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: магистр", "Направление подготовки: Психолого-педагогическое образование", "Общий стаж: 20 лет", "Стаж по специальности: 5 мес.", "Образовательные программы: 54.03.02 Декоративно-прикладное искусство и народные промыслы Профиль Художественный металл; 54.03.03 Искусство костюма и текстиля Профиль Художественное проектирование ювелирных изделий"]
      }
    }
  },
  "Институт управления, экономики и финансов": {
    "Администрация института": {
      "Беркович М.И.": {
        fullName: "Беркович Маргарита Израйлевна",
        image: "images/teachers/berkovich_mi.jpg",
        academicDegree: "",
        workPost: "Профессор",
        courses: [],
        email: "m_berkovich@kosgos.ru",
        phone: "Адрес: г. Кострома, ул. Дзержинского, д. 17/11, Главный корпус, ауд. 218; Телефон: (4942) 63-49-00 (доб. 8600)",
        extra: ["Директор института д.э.н."]
      },
      "Тихонова С.С.": {
        fullName: "Тихонова Светлана Сергеевна",
        image: "images/teachers/tihonova_ss.jpeg",
        academicDegree: "",
        workPost: "И.о. директора института, зам. директора ИУЭФ по учебно-методической работе",
        courses: [],
        email: "s_tihonova@kosgos.ru",
        phone: "Адрес: г. Кострома, ул. Дзержинского, д. 17/11, Главный корпус, ауд. 218; Телефон: (4942) 63-49-00 (доб. 8607)"
      },
      "Прокофьева Н.Н.": {
        fullName: "Прокофьева Наталия Николаевна",
        image: "images/teachers/prokofeva_nn.jpg",
        academicDegree: "",
        workPost: "Зам. директора ИУЭФ по научной работе",
        courses: [],
        email: "n_prokofeva@kosgos.ru",
        phone: "Адрес: г. Кострома, ул. Дзержинского, д. 17/11, Главный корпус, ауд. 218; Телефон: (4942) 63-49-00 (доб. 8607)"
      },
      "Чугунова О.Д.": {
        fullName: "Чугунова Ольга Дмитриевна",
        image: "images/teachers/chugunova_od.jpg",
        academicDegree: "",
        workPost: "Зам.директора ИУЭФ по воспитательной работе",
        courses: [],
        email: "od_chugunova@kosgos.ru",
        phone: "Адрес: г. Кострома, ул. 1 Мая, д. 14А, Корпус В1, ауд. 102; Телефон:"
      },
      "Кипень Д.В.": {
        fullName: "Кипень Данил Васильевич",
        image: "images/teachers/kipen_dv.jpg",
        academicDegree: "",
        workPost: "Зам.директора ИУЭФ по учебно-методической работе заочной формы обучения",
        courses: [],
        email: "d_kipen@kosgos.ru",
        phone: "Адрес: г. Кострома, ул. Дзержинского, д. 17/11, Главный корпус, ауд. 326; Телефон: (4942) 63-49-00 (доб. 8604)"
      },
      "Каюкова О.В.": {
        fullName: "Каюкова Ольга Владимировна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "",
        workPost: "Специалист по учебно-методической работе",
        courses: [],
        email: "tihonovass@kstu.edu.ru",
        phone: "Адрес: г. Кострома, ул. Дзержинского, д. 17, Главный корпус, ауд. 218; Телефон: (4942)49-80-50"
      },
      "Антонова С.И.": {
        fullName: "Антонова Светлана Ивановна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "",
        workPost: "Сотрудник института",
        courses: [],
        email: "s_antonova@kosgos.ru",
        phone: "Адрес: г. Кострома, ул. 1 Мая, д. 14А, Корпус В1, ауд. 102; Телефон: (4942)39-16-25",
        extra: ["старший диспетчер"]
      },
      "Свистунова И.В.": {
        fullName: "Свистунова Ирина Владимировна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "",
        workPost: "Сотрудник института",
        courses: [],
        email: "i_svistunova@kosgos.ru",
        phone: "Адрес: г. Кострома, ул. 1 Мая, д. 14А, Корпус В1, ауд. 102; Телефон: (4942)39-16-25",
        extra: ["старший диспетчер"]
      },
      "Пушкина М.Н.": {
        fullName: "Пушкина Марина Николаевна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "",
        workPost: "Сотрудник института",
        courses: [],
        extra: ["диспетчер"]
      }
    },
    "Кафедра Экономики и экономической безопасности": {
      "Палаш С.В.": {
        fullName: "Палаш Светлана Витальевна",
        image: "images/teachers/palash_sv.jpg",
        academicDegree: "доктор экономических наук",
        academicTitle: "Доцент",
        workPost: "Заведующая кафедрой экономики и экономической безопасности",
        courses: []
      },
      "Грабова О.Н.": {
        fullName: "Грабова Ольга Николаевна",
        image: "images/teachers/grabova_on.jpg",
        academicDegree: "доктор экономических наук",
        academicTitle: "Доцент",
        workPost: "Профессор кафедры экономики и экономической безопасности",
        courses: []
      },
      "Коновалова Е.В.": {
        fullName: "Коновалова Екатерина Владимировна",
        image: "images/teachers/konovalova_ev.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры экономики и экономической безопасности",
        courses: []
      },
      "Чернов А.Ю.": {
        fullName: "Чернов Алексей Юрьевич",
        image: "images/teachers/chernov_ay.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры экономики и экономической безопасности",
        courses: []
      },
      "Тимонин А.Ю.": {
        fullName: "Тимонин Александр Юрьевич",
        image: "images/teachers/timonin_ay.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры экономики и экономической безопасности",
        courses: []
      },
      "Ратькова А.Б.": {
        fullName: "Ратькова Александра Борисовна",
        image: "images/teachers/ratkova_ab.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры экономики и экономической безопасности",
        courses: []
      },
      "Захарова М.А.": {
        fullName: "Захарова Мария Александровна",
        image: "images/teachers/zaharova_ma.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры экономики и экономической безопасности",
        courses: []
      },
      "Лаптева А.М.": {
        fullName: "Лаптева Анна Михайловна",
        image: "images/teachers/lapteva_am.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры экономики и экономической безопасности",
        courses: []
      }
    },
    "Кафедра Менеджмента и цифровых технологий бизнеса": {
      "Гуляева М.К.": {
        fullName: "Гуляева Мария Константиновна",
        image: "images/teachers/gulyaeva_mk.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Заведующая кафедрой менеджмента и маркетинга, руководитель лаборатории маркетинговых исследований",
        courses: []
      },
      "Голубева М.А.": {
        fullName: "Голубева Мария Александровна",
        image: "images/teachers/golubeva_ma.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры менеджмента и маркетинга",
        courses: []
      },
      "Карасев М.А.": {
        fullName: "Карасев Михайил Александрович",
        image: "images/teachers/karasev_ma.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры менеджмента и маркетинга",
        courses: [],
        extra: ["Карасев Михаил Александрович"]
      },
      "Керпелева А.В.": {
        fullName: "Керпелева Анна Валерьевна",
        image: "images/teachers/kerpeleva_av.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры менеджмента и маркетинга",
        courses: []
      },
      "Селиванова Л.И.": {
        fullName: "Селиванова Лариса Ивановна",
        image: "images/teachers/selivanova_li.jpg",
        academicDegree: "кандидат психологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры менеджмента и маркетинга",
        courses: []
      },
      "Субачев А.А.": {
        fullName: "Субачев Александр Александрович",
        image: "images/teachers/subachev_aa.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры менеджмента и маркетинга",
        courses: []
      },
      "Чарушина Е.И.": {
        fullName: "Чарушина Елена Ивановна",
        image: "images/teachers/charushina_ei.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры менеджмента и маркетинга",
        courses: []
      },
      "Курицына Н.И.": {
        fullName: "Курицына Наталья Игоревна",
        image: "images/teachers/kuritsyna_ni.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры менеджмента и маркетинга",
        courses: []
      },
      "Илюхина А.С.": {
        fullName: "Илюхина Анна Святославовна",
        image: "images/teachers/ilyuhina_as.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Заведующая кафедрой бизнес-информатики и сервиса",
        courses: []
      },
      "Скаржинская Е.М.": {
        fullName: "Скаржинская Елена Матвеевна",
        image: "images/teachers/skarzhinskaya_em.jpg",
        academicDegree: "доктор экономических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Глухова С.М.": {
        fullName: "Глухова Светлана Михайловна",
        image: "images/teachers/gluhova_sm.jpg",
        academicDegree: "кандидат экономических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Харчина Н.Б.": {
        fullName: "Харчина Надежда Борисовна",
        image: "images/teachers/harchina_nb.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Воронцова О.Р.": {
        fullName: "Воронцова Ольга Романовна",
        image: "images/teachers/vorontsova_or.jpg",
        academicDegree: "кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: [],
        email: "math@kstu.edu.ru",
        phone: "(4942) 49-81-40",
        address: "156011, г. Кострома, ул. Малышковская, д.4",
        interests: "Повышение эффективности математической подготовки студентов инженерно"
      }
    },
    "Кафедра Экономики и управления": {
      "Боженко С.В.": {
        fullName: "Боженко Светлана Викторовна",
        image: "images/teachers/bozhenko_sv.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Заведующая кафедрой экономики и управления",
        courses: []
      },
      "Дудяшова В.П.": {
        fullName: "Дудяшова Валентина Павловна",
        image: "images/teachers/dudyashova_vp.jpg",
        academicDegree: "доктор экономических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры ЭиУ",
        courses: []
      },
      "Ершова М.Л.": {
        fullName: "Ершова Марина Львовна",
        image: "images/teachers/ershova_ml.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры ЭиУ",
        courses: []
      },
      "Бобрушева В.В.": {
        fullName: "Бобрушева Виктория Валерьевна",
        image: "images/teachers/bobrusheva_vv.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры ЭиУ",
        courses: []
      },
      "Стрельченко Т.Г.": {
        fullName: "Стрельченко Татьяна Геннадьевна",
        image: "images/teachers/strelchenko_tg.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры ЭиУ",
        courses: []
      },
      "Попова С.В.": {
        fullName: "Попова Светлана Валентиновна",
        image: "images/teachers/popova_sv.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Орлов Е.В.": {
        fullName: "Орлов Евгений Владимирович",
        image: "images/teachers/orlov_ev.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент",
        courses: []
      },
      "Кипень Д.В.": {
        fullName: "Кипень Данил Васильевич",
        image: "images/teachers/kipen_dv2.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель",
        courses: []
      }
    },
    "Кафедра Теоретической и прикладной экономики, финансов и кредита": {
      "Шумакова О.Д.": {
        fullName: "Шумакова Ольга Данииловна",
        image: "images/teachers/shumakova_od.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Заведующая кафедрой",
        courses: []
      },
      "Пунанова Т.И.": {
        fullName: "Пунанова Татьяна Ивановна",
        image: "images/teachers/punanova_ti.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Смирнова Е.В.": {
        fullName: "Смирнова Елена Владимировна",
        image: "images/teachers/smirnova_ev.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Данилевская Е.Е.": {
        fullName: "Данилевская Елена Евгеньевна",
        image: "images/teachers/danilevskaya_ee.jpg",
        academicDegree: "Кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Королева М.Л.": {
        fullName: "Королева Марина Леонидовна",
        image: "images/teachers/koroleva_ml.jpg",
        academicDegree: "кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Кипень Н.А.": {
        fullName: "Кипень Надежда Александровна",
        image: "images/teachers/kipen_na.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Иваницкий В.В.": {
        fullName: "Иваницкий Виталий Викторович",
        image: "images/teachers/ivanitskiy_vv2.jpg",
        academicDegree: "кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Соколова О.А.": {
        fullName: "Соколова Ольга Александровна",
        image: "images/teachers/sokolova_oa.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Тихонова С.С.": {
        fullName: "Тихонова Светлана Сергеевна",
        image: "images/teachers/tihonova_ey2.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель, заместитель директора ИУЭФ по учебно-методической работе",
        courses: []
      }
    },
    "Кафедра Бухгалтерского учета и аудита": {
      "Мироненко О.В.": {
        fullName: "Мироненко Оксана Владимировна",
        image: "images/teachers/mironenko_ov.jpg",
        academicDegree: "Кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "",
        courses: [],
        phone: "заведующая кафедрой бухгалтерского учета и аудита"
      },
      "Бахвалова О.Н.": {
        fullName: "Бахвалова Оксана Николаевна",
        image: "images/teachers/bahvalova_on.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Николаева Н.Е.": {
        fullName: "Николаева Наталия Евгеньевна",
        image: "images/teachers/nikolaeva_ne.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Смирнова Н.Д.": {
        fullName: "Смирнова Наталья Дмитриевна",
        image: "images/teachers/smirnova_nd.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Прокофьева Н.Н.": {
        fullName: "Прокофьева Наталия Николаевна",
        image: "images/teachers/prokofeva_nn2.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Саксина Н.Н.": {
        fullName: "Саксина Наталья Николаевна",
        image: "images/teachers/saksina_nn.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      }
    },
    "Преподаватели НПР ДПО": {
      "Кудря Р.С.": {
        fullName: "Кудря Роман Сергеевич",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Старший преподаватель",
        courses: [],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: экономист", "Направление подготовки: Менеджмент", "Повышение квалификации: с 05.11.2024 по 15.11.2024, ФГБОУ ВО \"Костромской государственный университет\", ПК \"Обеспечение защиты государственной тайны в организации\", 56 часов (удостоверение 440600080944 от 18.11.2024г.);", "Общий стаж: 16 лет", "Стаж по специальности: 16 лет"]
      },
      "Семенова О.Ю.": {
        fullName: "Семенова Ольга Юрьевна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент",
        courses: ["Бухгалтерский учет в бюджетной сфере", "Налоги и налогообложение", "Налоговая отчетность", "Налоговый учет", "Налоговый учет и консалтинг", "Налоговый учет и отчетность", "Налогообложение в системе государственного и муниципального управления", "Правовое регулирование налоговых отношений", "Правовое сопровождение бизнеса (гражданское", "трудовое и арбитражное право)", "Профессиональные компьютерные программы"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: менеджер-экономист", "Направление подготовки: Экономика и организация промышленности предметов широкого потребления", "Профессиональная переподготовка: 2019 ПП \"Педагогика профессионального обучения, профессионального образования и дополнительного профессионального образования\", ФГАОУДПО Костромской ЦППК\" (диплом № 440600004197 от 29.06.2019)", "Общий стаж: 38 лет", "Стаж по специальности: 25 лет", "Образовательные программы: 38.03.01 Экономика Профиль Учет и анализ бизнес-процессов; 38.03.01 Экономика Профиль Бухгалтерский учет, анализ и аудит; 38.03.01 Экономика Профиль Учет, анализ бизнес-процессов, финансы и кредит; 38.03.04 Государственное и муниципальное управление Профиль Региональное управление; 38.04.01 Экономика Программа магистратуры Бизнес-анализ и финансовый консалтинг"]
      },
      "Яковлев Р.А.": {
        fullName: "Яковлев Роман Александрович",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Кандидат экономических наук",
        workPost: "Доцент",
        courses: ["Мониторинг", "контроль", "аудит в сфере закупок", "Экономические основы предоставления государственных и муниципальных услуг"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: экономист-менеджер", "Направление подготовки: экономика и управление на предприятии", "Повышение квалификации: Высшая школа Госзакупок, с 1 апреля 2023 г. по 30 июня 2023 г. - \"Специалист в сфере закупок-2023\", 120 часов (сертификат от 30.06.2023 г.)", "Общий стаж: 19 лет", "Стаж по специальности: 1 год", "Образовательные программы: 38.03.02 Менеджмент Профиль Управление государственными и муниципальными услугами и закупками"]
      }
    }
  },
  "Институт физико-математических и естественных наук": {
    "Администрация института": {
      "Катержина С.Ф.": {
        fullName: "Катержина Светлана Федоровна",
        image: "images/teachers/katerzhina_sf.jpg",
        academicDegree: "кандидат педагогических наук",
        workPost: "Директор института",
        courses: ["Математика", "Высшая математика", "Эконометрика", "Методы оптимальных решений", "Линейная алгебра", "Математический анализ", "Алгебра", "Теория вероятностей и математическая статистика", "Педагогические технологии. Осуществляет руководство выпускными квалификационными работами студентов направления подготовки Педагогическое образование"],
        sheduleCode: 184,
        email: "svetakaterzhina@mail.ru",
        phone: "Телефон: (4942) 63-49-00 (доб. 8700)",
        address: "156011, г. Кострома, ул. Малышковская, д.4",
        education: "Окончила Костромской государственный университет им. Н.А. Некрасова в 2004 году по",
        interests: "Кандидатская диссертация на тему: «Развитие познавательной самостоятельности студентов",
        extra: ["e-mail:"]
      },
      "Бабенко А.С.": {
        fullName: "Бабенко Алена Сергеевна",
        image: "images/teachers/babenko_as.jpg",
        academicDegree: "кандидат педагогических наук",
        workPost: "Заместитель директора по учебно-методической и научной работе",
        courses: ["Руководитель магистерской программы направления подготовки «Педагогическое образование"],
        sheduleCode: 29,
        email: "ifmen@kosgos.ru",
        phone: "Телефон: (4942) 63-49-00 (доб. 8701)",
        address: "156011, г. Кострома, ул. Малышковская, д.4, корпус",
        education: "Окончила Костромской государственный университет имени Н. А. Некрасова в 2005 году по",
        interests: "Актуальные проблемы математического образования в школе и вузе",
        extra: ["e-mail:"]
      },
      "Вариошкина И.О.": {
        fullName: "Вариошкина Ирина Олеговна",
        image: "images/teachers/varioshkina_io.jpg",
        academicDegree: "",
        workPost: "Заместитель директора по воспитательной работе, специалист по учебно-методической работе",
        courses: ["Химия"],
        sheduleCode: 1084,
        email: "vario84@mail.ru",
        phone: "Телефон: (4942) 63-49-00 (доб. 1015)",
        extra: ["e-mail:"]
      },
      "Комиссарова М.Р.": {
        fullName: "Комиссарова Мария Романовна",
        image: "images/teachers/komissarova_mr.jpg",
        academicDegree: "кандидат технических наук",
        workPost: "Помощник директора по профориентационной работе",
        courses: ["Физика", "Механика", "Молекулярная физика", "Общий физический практикум", "Планирование эксперимента и обработка результатов", "Геофизика", "Научные основы школьного курса физики"],
        sheduleCode: 625,
        email: "ifmen@kosgos.ru",
        phone: "Телефон: (4942) 63-49-00 (доб. 8740)",
        extra: ["e-mail:"]
      },
      "Альхимович Н.Е.": {
        fullName: "Альхимович Наталья Евгеньевна",
        image: "images/teachers/alhimovich_ne.jpg",
        academicDegree: "",
        workPost: "Специалист по учебно-методической работе",
        courses: [],
        email: "fizmat@kosgos.ru",
        phone: "Телефон: (4942) 63-49-00 (доб. 8702)",
        extra: ["e-mail:"]
      }
    },
    "Кафедра Биологии и экологии": {
      "Мурадова Л.В.": {
        fullName: "Мурадова Людмила Владимировна",
        image: "images/teachers/muradova_lv.jpg",
        academicDegree: "кандидат сельскохозяйственных наук",
        academicTitle: "Доцент",
        workPost: "Заведующая кафедрой биологии и экологии",
        courses: ["Зоология", "Общая экология", "Экология и рациональное природопользование", "Современная экология и глобальные экологические проблемы", "Социальная экология", "Ихтиология", "Промышленная экология", "Научные принципы охраны природы", "Экология человека", "Экология Костромской области", "Экологические проблемы современности", "Охрана окружающей среды", "Основы природопользования", "Популяционная биология"],
        sheduleCode: 299,
        email: "mlv44@mail.ru",
        address: "156010, г. Кострома, ул. Малышковская, 4",
        education: "Закончила Костромскую сельскохозяйственную академию по специальности: «зооинженер» в 1994",
        interests: "Адаптивный потенциал и стрессоустойчивость животных, Ихтиология"
      },
      "Сиротина М.В.": {
        fullName: "Сиротина Марина Валерьевна",
        image: "images/teachers/sirotina_mv.jpg",
        academicDegree: "доктор биологических наук",
        workPost: "Профессор кафедры",
        courses: ["Экология и рациональное природопользование", "Зоология", "Гидробиология", "Биоиндикационные методы исследований", "Экология", "Экологические проблемы водных экосистем"],
        sheduleCode: 402,
        email: "mvsirotina@gmail.com",
        address: "156010, г. Кострома, ул. Малышковская, 4",
        education: "Закончила Костромской государственный педагогический институт им. Н.А. Некрасова по",
        interests: "феногенетика и фенетика позвоночных животных, биоиндикация"
      },
      "Соколова Т.Л.": {
        fullName: "Соколова Татьяна Леонидовна",
        image: "images/teachers/sokolova_tl.jpg",
        academicDegree: "кандидат биологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Цитология", "Генетика и селекция", "Почвоведение", "Землеведение", "Общее землеведение", "Биология размножения и развития"],
        sheduleCode: 433,
        email: "tl.sokol@yandex.ru",
        address: "156010, г. Кострома, ул. Малышковская, 4",
        education: "Закончила Костромской государственный университет им. Н.А. Некрасова по специальности: «Учитель",
        interests: "Эколого-фаунистический состав почвенной мезофауны; использование"
      },
      "Бондаренко В.И.": {
        fullName: "Бондаренко Вячеслав Иларионович",
        image: "images/teachers/bondarenko_vi.jpg",
        academicDegree: "кандидат геолого-минералогических наук",
        workPost: "Доцент кафедры",
        courses: ["Геотектоника", "Геоморфология", "Физическая география России", "Геология", "География", "Биогеоценология", "Основы геохимии и геофизики", "Климатология", "Метеорология", "Нормирование и снижение загрязнения окружающей среды", "Биогеография", "Математическая обработка и представление результатов эксперимента", "Заповедное дело", "Безопасность жизнедеятельности", "Картография", "Ландшафтоведение", "Геоэкология", "Физическая география материков и океанов", "Геоэкология и природопользование"],
        sheduleCode: 53,
        email: "vibond@list.ru",
        address: "156010, г. Кострома, ул. Малышковская, 4",
        education: "Закончил: Московский государственный университет им. М.Ломоносова в",
        experience: "Работает в КГУ с 1995 года. Закончил: Московский государственный университет им. М.Ломоносова в",
        interests: "геоморфология, вулканология, тектоника, геология"
      },
      "Ситникова О.Н.": {
        fullName: "Ситникова Ольга Николаевна",
        image: "images/teachers/sitnikova_on.jpg",
        academicDegree: "кандидат сельскохозяйственных наук",
        workPost: "Доцент кафедры",
        courses: ["Зоология", "Лесная экология", "Популяционная экология"],
        sheduleCode: 404,
        email: "sitnikova@ksu.edu.ru",
        address: "156010, г. Кострома, ул. Малышковская, 4",
        education: "Закончила Костромской государственный университет им. Н.А. Некрасова по специальности: «Биолог",
        interests: "эколого-генетический потенциал и поведение лосей, зоология"
      },
      "Дюкова А.С.": {
        fullName: "Дюкова Анна Сергеевна",
        image: "images/teachers/dyukova_as.jpg",
        academicDegree: "кандидат биологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Общая биология", "Биофизика", "Лекарственные растения Костромской области", "Молекулярная биология", "Ботаника", "История и методология биологии", "Биология"],
        sheduleCode: 127,
        email: "net998@kmtn.ru",
        address: "156010, г. Кострома, ул. Малышковская, 4",
        education: "Окончила КГПУ им. Некрасова по специальности «Учитель биологии и географии»",
        experience: "Работает в КГУ им. Некрасова с 2003 года",
        interests: "альгология; экология низших растений"
      },
      "Кузьмин А.Ф.": {
        fullName: "Кузьмин Андрей Фёдорович",
        image: "images/teachers/kuzmin_af.jpg",
        academicDegree: "кандидат медицинских наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["ЛФК и массаж", "Физиология физического воспитания и спорта"],
        sheduleCode: 248,
        email: "kuzminmedico@yandex.ru",
        address: "156010, г. Кострома, ул. Малышковская, 4",
        education: "Закончил Ярославский медицинский институт диплом с отличием, специальность – лечебное дело",
        interests: "Регуляция блокаторов медленных каналов типа нифедипина на"
      },
      "Онегина М.Д.": {
        fullName: "Онегина Марина Дмитриевна",
        image: "images/teachers/onegina_md.jpg",
        academicDegree: "Кандидат медицинских наук, доцент",
        workPost: "Старший преподаватель кафедры",
        courses: ["Безопасность жизнедеятельности", "Возрастная анатомия и физиология", "Основы медицинских знаний и здорового образа жизни", "Гигиена и основы экологии человека", "Валеология"],
        sheduleCode: 317,
        email: "m.onegina@bk.ru",
        address: "156010, г. Кострома, ул. Малышковская, 4",
        education: "Закончила Костромской педагогический институт в 1984 году, специальность – Биология",
        interests: "биология человека, педиатрия, гигиена и экология"
      },
      "Сиротин А.Л.": {
        fullName: "Сиротин Алексей Леонидович",
        image: "images/teachers/sirotin_al.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: [],
        email: "lasirotin@gmail.com",
        address: "156010, г. Кострома, ул. Малышковская, 4",
        education: "закончил Костромскую сельскохозяйственную академию по специальности",
        interests: "Зоология беспозвоночных, зоопланктон"
      },
      "Березина О.О.": {
        fullName: "Березина Олеся Олеговна",
        image: "images/teachers/berezina_oo.jpg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: ["Физиология растений. Основы биотехнологии и биоинженерии"],
        sheduleCode: 872
      },
      "Беоглу А.П.": {
        fullName: "Беоглу Александр Павлович",
        image: "images/teachers/beoglu_ap.jpg",
        academicDegree: "Кандидат биологических наук",
        workPost: "Доцент кафедры",
        courses: ["Анатомия человека", "Физиология человека и животных", "Биология размножения и развития", "Инновационные технологии в биологии", "Ихтиопатология"],
        sheduleCode: 1163
      }
    },
    "Кафедра Общей и теоретической физики": {
      "Дьяков И.Г.": {
        fullName: "Дьяков Илья Геннадьевич",
        image: "images/teachers/dyakov_ig.jpg",
        academicDegree: "доктор технических наук",
        academicTitle: "Доцент",
        workPost: "Профессор",
        courses: ["Механика", "Молекулярная физика", "Теоретическая механика", "Квантовая теория", "Физика твердого тела", "Физическое материаловедение", "Современные проблемы электролитноплазменной обработки"],
        sheduleCode: 126
      },
      "Жиров А.В.": {
        fullName: "Жиров Александр Владимирович",
        image: "images/teachers/zhirov_av.jpg",
        academicDegree: "кандидат технических наук",
        workPost: "Доцент",
        courses: ["Электричество и магнетизм", "Оптика", "Астрономия", "История физики", "Электротехника", "Основы проектной деятельности", "Теоретические основы электротехники", "Управление проектами", "Общий физический практикум", "Электрическая проводимость анодной парогазовой оболочки"],
        sheduleCode: 141
      },
      "Красников В.Л.": {
        fullName: "Красников Виктор Львович",
        image: "images/teachers/krasnikov_vl.jpg",
        academicDegree: "кандидат физико-математических наук",
        academicTitle: "Доцент",
        workPost: "Доцент",
        courses: ["Физика", "Компьютерное моделирование в физике", "Компьютерные технологии в науке и образовании"],
        sheduleCode: 233
      },
      "Шадрин С.Ю.": {
        fullName: "Шадрин Сергей Юрьевич",
        image: "images/teachers/shadrin_sy.jpg",
        academicDegree: "кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Заведующий кафедрой",
        courses: ["Теория поля", "Уравнения математической физики", "Методика преподавания физики", "Элементы теплофизики", "Естественнонаучная картина мира", "Теплофизические основы анодного нагрева", "Педагогика и методика преподавания физики"],
        sheduleCode: 508
      },
      "Гладий Ю.П.": {
        fullName: "Гладий Юрий Петрович",
        image: "images/teachers/gladiy_yp.jpg",
        academicDegree: "кандидат химических наук",
        academicTitle: "Доцент",
        workPost: "Доцент",
        courses: ["Физика", "Естественно-научная картина мира", "Практикум по решению задач"],
        sheduleCode: 90
      },
      "Комиссарова М.Р.": {
        fullName: "Комиссарова Мария Романовна",
        image: "images/teachers/komissarova_mr2.jpg",
        academicDegree: "кандидат технических наук",
        workPost: "Старший преподаватель",
        courses: ["Физика", "Механика", "Молекулярная физика", "Общий физический практикум", "Планирование эксперимента и обработка результатов", "Геофизика", "Научные основы школьного курса физики"],
        sheduleCode: 625
      },
      "Мухачева Т.Л.": {
        fullName: "Мухачева Татьяна Леонидовна",
        image: "images/teachers/muhacheva_tl.jpg",
        academicDegree: "кандидат технических наук",
        workPost: "Доцент",
        courses: ["Атомная и ядерная физика", "Физика", "Общий физический практикум", "Структура материалов", "Механика фрикционного взаимодействия модифицированных сплавов", "Физикохимические методы исследования", "Основы электрохимической коррозии модифицированных сплавов"],
        sheduleCode: 301
      },
      "Кусманов С.А.": {
        fullName: "Кусманов Сергей Александрович",
        image: "images/teachers/kusmanov_sa.jpg",
        academicDegree: "доктор технических наук",
        workPost: "Доцент",
        courses: ["Особенности проведения научных исследований в области электролитно-плазменных технологий обработки материалов"],
        sheduleCode: 255
      }
    },
    "Кафедра Химии": {
      "Силкин С.А.": {
        fullName: "Силкин Сергей Андрисович",
        image: "images/teachers/silkin_sa.jpg",
        academicDegree: "кандидат технических наук",
        workPost: "Заведующий кафедрой",
        courses: ["Основы проектной деятельности", "Физико-химические методы анализа", "Физикохимические методы исследования", "Прикладная электрохимия", "Планирование эксперимента и обработка результатов исследования", "Информационные технологии в химии"],
        sheduleCode: 401
      },
      "Кусманов С.А.": {
        fullName: "Кусманов Сергей Александрович",
        image: "images/teachers/kusmanov_sa2.jpg",
        academicDegree: "доктор технических наук",
        academicTitle: "Доцент",
        workPost: "Профессор",
        courses: ["Особенности проведения научных исследований в области электролитно-плазменных технологий обработки материалов"],
        sheduleCode: 255
      },
      "Молчанов А.С.": {
        fullName: "Молчанов Алексей Сергеевич",
        image: "images/teachers/molchanov_as.jpg",
        academicDegree: "кандидат химических наук",
        workPost: "Доцент кафедры",
        courses: ["Аналитическая химия", "Комплексообразование в жидких растворах", "Синтез неорганических соединений", "Коллоидная химия"],
        sheduleCode: 297
      },
      "Ильинская М.В.": {
        fullName: "Ильинская Майя Викторовна",
        image: "images/teachers/ilinskaya_mv.jpg",
        academicDegree: "Старший преподаватель кафедры",
        workPost: "Старший преподаватель кафедры",
        courses: ["Химия", "Физико-химические процессы в техносфере", "Физико-химические методы исследования", "Основы химического эксперимента", "Химическая технология", "Методология научного исследования"],
        sheduleCode: 173
      },
      "Замышляева В.В.": {
        fullName: "Замышляева Вероника Владимировна",
        image: "images/teachers/zamyshlyaeva_vv.jpg",
        academicDegree: "кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Химия", "Безопасность продовольственных товаров", "Анализ пищевых продуктов", "Основы биохимии", "Органическая химия", "Основы химической экспертизы"],
        sheduleCode: 150
      },
      "Тамбовский И.В.": {
        fullName: "Тамбовский Иван Владимирович",
        image: "images/teachers/tambovskiy_iv.jpg",
        academicDegree: "кандидат технических наук",
        workPost: "Доцент кафедры",
        courses: ["Физическая химия", "Электролитно-плазменная обработка металлов и сплавов"],
        sheduleCode: 448
      },
      "Чумак К.А.": {
        fullName: "Чумак Ксения Александровна",
        image: "images/teachers/chumak_ka.jpg",
        academicDegree: "",
        workPost: "Преподаватель кафедры",
        courses: ["Высокомолекулярные соединения", "Синтез органических соединений", "Анализ пищевых продуктов"],
        sheduleCode: 594
      },
      "Смирнова Н.Л.": {
        fullName: "Смирнова Надежда Леонидовна",
        image: "images/teachers/smirnova_nl.jpg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: []
      },
      "Вариошкина И.О.": {
        fullName: "Вариошкина Ирина Олеговна",
        image: "images/teachers/varioshkina_io2.jpg",
        academicDegree: "",
        workPost: "Преподаватель кафедры",
        courses: ["Химия"],
        sheduleCode: 1084
      },
      "Перков А.С.": {
        fullName: "Перков Александр Сергеевич",
        image: "images/teachers/perkov_as.jpg",
        academicDegree: "",
        workPost: "Преподаватель кафедры",
        courses: ["Химия"],
        sheduleCode: 595
      }
    },
    "Кафедра Высшей математики": {
      "Матыцина Т.Н.": {
        fullName: "Матыцина Татьяна Николаевна",
        image: "images/teachers/matytsina_tn.jpg",
        academicDegree: "кандидат физико-математических наук",
        academicTitle: "Доцент",
        workPost: "Заведующая кафедрой высшей математики",
        courses: ["Алгебра", "Геометрия", "Элементарная математика", "Практикум решения задач по математике", "Линейная алгебра", "Дискретная математика", "Аналитическая геометрия", "Научные основы школьного курса математики. Геометрия", "Научные основы школьного курса математики. Алгебра. Теория чисел"],
        sheduleCode: 693
      },
      "Катержина С.Ф.": {
        fullName: "Катержина Светлана Федоровна",
        image: "images/teachers/katerzhina_sf2.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры, директор ИФМЕН",
        courses: ["Математика", "Высшая математика", "Эконометрика", "Методы оптимальных решений", "Линейная алгебра", "Математический анализ", "Алгебра", "Теория вероятностей и математическая статистика", "Педагогические технологии. Осуществляет руководство выпускными квалификационными работами студентов направления подготовки Педагогическое образование"],
        sheduleCode: 184,
        email: "svetakaterzhina@mail.ru",
        phone: "(4942) 49-81-20",
        address: "156011, г. Кострома, ул. Малышковская, д.4",
        education: "Окончила Костромской государственный университет им. Н.А. Некрасова в 2004 году по",
        interests: "Кандидатская диссертация на тему: «Развитие познавательной самостоятельности студентов"
      },
      "Бабенко А.С.": {
        fullName: "Бабенко Алена Сергеевна",
        image: "images/teachers/babenko_as2.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры,",
        courses: ["Руководитель магистерской программы направления подготовки «Педагогическое образование"],
        sheduleCode: 29,
        email: "math@kstu.edu.ru",
        phone: "(4942) 49-81-40",
        address: "156011, г. Кострома, ул. Малышковская, д.4, корпус",
        education: "Окончила Костромской государственный университет имени Н. А. Некрасова в 2005 году по",
        interests: "Актуальные проблемы математического образования в школе и вузе",
        extra: ["заместитель директора по учебно-методической и научной работе"]
      },
      "Марголина Н.Л.": {
        fullName: "Марголина Наталия Львовна",
        image: "images/teachers/margolina_nl.jpg",
        academicDegree: "кандидат физико-математических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Математический анализ", "Теория вероятностей и математическая статистика", "Элементарная математика"],
        sheduleCode: 692,
        email: "kaf_algeo@ksu.edu.ru",
        phone: "(4942) 49-81-40",
        address: "156011, г. Кострома, ул",
        education: "окончила физико -математический факультет КГПУ им. Н. А. Некрасова",
        interests: "Качественная теория обыкновенных дифференциальных уравнений; теория показателей; теория"
      },
      "Ширяев К.Е.": {
        fullName: "Ширяев Кирилл Евгеньевич",
        image: "images/teachers/shiryaev_ke.jpg",
        academicDegree: "кандидат физико-математических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Математический анализ", "Комплексный анализ", "Введение в функциональный анализ", "Дифференциальные уравнения и уравнения с частными производными", "Дифференциальные уравнения, динамические системы и оптимальное управление", "Теория показателей", "Математическая теория устойчивости", "Бэровская классификация функций", "Прикладная математика информатика", "Физика", "Педагогическое образование", "Математика", "Математика. Физика", "Математика и механика"],
        sheduleCode: 516,
        email: "kaf_algeo@ksu.edu.ru",
        phone: "(4942) 49-81-40",
        address: "156011, г. Кострома, ул. Малышковская, д.4",
        interests: "Качественная теория обыкновенных дифференциальных уравнений"
      },
      "Собашко Ю.А.": {
        fullName: "Собашко Юлия Александровна",
        image: "images/teachers/sobashko_ya.jpg",
        academicDegree: "кандидат технических наук",
        workPost: "Доцент кафедры, директор ЦДО",
        courses: ["Математика: алгебра", "начала математического анализа и геометрия"],
        sheduleCode: 429,
        email: "kaf_algeo@ksu.edu.ru",
        phone: "(4942) 49-81-40",
        address: "156011, г. Кострома, ул. Малышковская",
        education: "Окончила Ивановский государственный университет в 2005 году по направлению",
        interests: "Совершенствование технологии подготовки льняной ровницы к прядению"
      },
      "Воронцова О.Р.": {
        fullName: "Воронцова Ольга Романовна",
        image: "images/teachers/vorontsova_or2.jpg",
        academicDegree: "кандидат технических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: ["Высшая математика", "Математический анализ", "Линейная алгебра", "Теория вероятностей и математическая статистика", "Численные методы", "Правовая статистика", "Специальные главы математики"],
        sheduleCode: 82,
        email: "math@kstu.edu.ru",
        phone: "(4942) 49-81-40",
        address: "156011, г. Кострома, ул. Малышковская, д.4",
        interests: "Повышение эффективности математической подготовки студентов инженерно"
      },
      "Хомяков Е.С.": {
        fullName: "Хомяков Евгений Сергеевич",
        image: "images/teachers/homyakov_es.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: ["Математический анализ", "линейная алгебра", "эконометрика", "методы оптимальных решений", "теория вероятностей и математическая статистика", "Экономика", "Математика"],
        sheduleCode: 498,
        email: "math@kstu.edu.ru",
        phone: "(4942) 49-81-40",
        address: "156011, г. Кострома, ул. Малышковская, д.4, корпус",
        education: "Окончил Костромской государственный университет им. Н.А. Некрасова в 2000 году по",
        interests: "Математическое моделирование УСЗ ткацкого станка при выработке технических многослойных"
      },
      "Сидоренко А.А.": {
        fullName: "Сидоренко Алексей Александрович",
        image: "images/teachers/sidorenko_aa.jpg",
        academicDegree: "",
        workPost: "Ассистент кафедры высшей математики",
        courses: ["Математика для групп СПО"],
        sheduleCode: 945,
        email: "math@kstu.edu.ru",
        phone: "(4942) 63-49-00 (",
        address: "156011, г. Кострома, ул. Малышковская, д. 4",
        education: "Окончил в 2022 году Костромской государственный университет по направлению",
        interests: "Актуальные проблемы математического образования в школе и вузе"
      }
    },
    "Преподаватели НПР ДПО": {
      "Кусманова И.А.": {
        fullName: "Кусманова Ирина Александровна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Заведующий кафедрой",
        courses: ["Неорганическая химия", "Методика преподавания химии", "Химия"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: учитель биологии и химии", "Направление подготовки: \"Химия\" с дополнительной специальностью \"Биология\"", "Повышение квалификации: ФГБОУ ВО \"Казанский исследовательский технологический университет\" с 5 декабря 2022 года по 21 декабря 2022 года - \"Электрохимическая защита от коррозии\", 72 часа ( удостоверение № 319318 от 21 декабря 2022 г.); с 11.04.2023 по 15.05.2023, Кострома, ПК «Цифровые инструменты и сервисы в деятельности преподавателя вуза», 48 часов, КГУ ИПР (№440600045111 от 14.05.2023); КГУ ИПР,с 15 июня 2023 г. по 6 июля 2023 г. - \"Педагогические технологии для преподавателей, кураторов, наставников\", 36 академ. час. (удостоверение № 440600045279 от 6 июля 2023 г.); ФГБОУ ВО \"Ярославский государственный университет им. П.Г. Демидова\", с 01 сентября 2023 г. по 30 ноября 2023 г. - ПК \"Компетенции педагога: Мотивация образовательной деятельности\", 16 часов ( удостоверение № 762420244747 от 30.11.2023 г.); КГУ ЦДО, с 16 ноября 2023 г. по 30 ноября 2023 г. - \"Обеспечение антитеррористической защищенности объектов (территорий) образовательных организаций высшего образования\", 36 часов (удостоверение № 440600045635 от 30 ноября 2023 г.);", "Общий стаж: 21 год", "Стаж по специальности: 21 год", "Образовательные программы: 04.03.01 Химия Профиль Химия; 43.02.16 ТУРИЗМ И ГОСТЕПРИИМСТВО; 54.02.01 ДИЗАЙН (ПО ОТРАСЛЯМ) дизайнерПрофиль получаемого профессионального образования при реализации программы среднего общего образования: гуманитарный"]
      }
    }
  },
  "Юридический институт имени Ю.П. Новицкого": {
    "Администрация института": {
      "Бриль Г.Г.": {
        fullName: "Бриль Геннадий Геннадьевич",
        image: "images/teachers/bril_gg.jpg",
        academicDegree: "доктор юридических наук",
        academicTitle: "Профессор",
        workPost: "Директор института",
        courses: [],
        email: "g_bril@kosgos.ru",
        phone: "кабинет №230; (4942) 63-49-00 (доб. 8800)"
      },
      "Хлестакова Л.А.": {
        fullName: "Хлестакова Любовь Анатольевна",
        image: "images/teachers/hlestakova_la.jpg",
        academicDegree: "кандидат педагогических наук",
        workPost: "Заместитель директора по учебно-методической работе",
        courses: [],
        email: "l_kukushkina@kosgos.ru",
        phone: "кабинет №214; (4942) 63-49-00 (доб. 8801)"
      },
      "Ганжа Н.В.": {
        fullName: "Ганжа Наталья Владимировна",
        image: "images/teachers/ganzha_nv.jpg",
        academicDegree: "кандидат юридических наук",
        academicTitle: "Доцент",
        workPost: "Заместитель директора по научной работе",
        courses: [],
        email: "melnik44@gmail.com",
        phone: "кабинет №228; (4942)"
      },
      "Григорьева М.А.": {
        fullName: "Григорьева Марина Александровна",
        image: "images/teachers/grigoreva_ma.jpg",
        academicDegree: "",
        workPost: "Помощник директора по организации практики студентов и трудоустройству выпускников",
        courses: [],
        email: "m_grigoreva@kosgos.ru",
        phone: "кабинет №219; (4942)"
      },
      "Волкова А.А.": {
        fullName: "Волкова Александра Александровна",
        image: "images/teachers/volkova_aa.jpg",
        academicDegree: "",
        workPost: "Специалист по работе со студентами очной формы обучения (бакалавры и магистры)",
        courses: [],
        email: "a_volkova@kosgos.ru",
        phone: "кабинет №214; (4942) 63-49-00 (доб. 8804)"
      },
      "Колчина Н.И.": {
        fullName: "Колчина Наталия Игоревна",
        image: "images/teachers/kolchina_ni.jpg",
        academicDegree: "",
        workPost: "Специалист по работе со студентами заочной формы обучения (бакалавры)",
        courses: [],
        email: "n_kolchina@kosgos.ru",
        phone: "кабинет №214; (4942) 63-49-00 (доб. 8802)"
      },
      "Трофимова Г.С.": {
        fullName: "Трофимова Галина Семёновна",
        image: "images/teachers/trofimova_gs.jpg",
        academicDegree: "",
        workPost: "Специалист по учебно-методической работе",
        courses: [],
        phone: "кабинет №214; (4942) 63-49-00 (доб. 8805)"
      }
    },
    "Кафедра Гражданско-правовых дисциплин": {
      "Сироткин А.Г.": {
        fullName: "Сироткин Алексей Геннадьевич",
        image: "images/teachers/sirotkin_ag.jpg",
        academicDegree: "кандидат юридических наук",
        academicTitle: "Доцент",
        workPost: "Заведующий кафедрой",
        courses: [],
        email: "a_sirotkin@kosgos.ru",
        phone: "г.Кострома, ул. 1 Мая, д.16, корп.Г1, ауд.219; (4942) 63-49-00 (доб. 8820)"
      },
      "Бекренёв П.Ю.": {
        fullName: "Бекренёв Павел Юрьевич",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "кандидат политических наук",
        workPost: "Доцент кафедры",
        courses: [],
        phone: "г.Кострома, ул. 1 Мая, д.16, корп.Г1, ауд.219; (4942) 63-49-00 (доб. 8820)"
      },
      "Григорьева М.А.": {
        fullName: "Григорьева Марина Александровна",
        image: "images/teachers/grigoreva_ma2.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: [],
        phone: "г.Кострома, ул. 1 Мая, д.16, корп.Г1, ауд.219; (4942) 63-49-00 (доб. 8820)"
      },
      "Деревесников А.В.": {
        fullName: "Деревесников Александр Владимирович",
        image: "images/teachers/derevesnikov_av.jpg",
        academicDegree: "кандидат юридических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: [],
        phone: "г.Кострома, ул. 1 Мая, д.16, корп.Г1, ауд.219; (4942) 63-49-00 (доб. 8820)"
      },
      "Хлестакова Л.А.": {
        fullName: "Хлестакова Любовь Анатольевна",
        image: "images/teachers/hlestakova_la2.jpg",
        academicDegree: "кандидат педагогических наук",
        workPost: "Доцент кафедры",
        courses: [],
        phone: "г.Кострома, ул. 1 Мая, д.16, корп.Г1, ауд.219; (4942) 63-49-00 (доб. 8820)"
      },
      "Палюлина И.А.": {
        fullName: "Палюлина Ирина Александровна",
        image: "images/teachers/palyulina_ia.jpg",
        academicDegree: "кандидат исторических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: [],
        phone: "г.Кострома, ул. 1 Мая, д.16, корп.Г1, ауд.219; (4942) 63-49-00 (доб. 8820)"
      },
      "Варенцова Е.В.": {
        fullName: "Варенцова Екатерина Владимировна",
        image: "images/teachers/varentsova_ev.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: [],
        phone: "г.Кострома, ул. 1 Мая, д.16, корп.Г1, ауд.209; (4942) 63-49-00 (доб. 8820)"
      },
      "Никитин В.В.": {
        fullName: "Никитин Валерий Владимирович",
        image: "images/teachers/nikitin_vv.jpg",
        academicDegree: "кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: [],
        phone: "г. Кострома, ул. 1 Мая, д.16, корп.Г1, ауд.219; (4942) 63-49-00 (доб. 8820)"
      }
    },
    "Кафедра Судебной и правоохранительной деятельности": {
      "Лукоянов Д.Н.": {
        fullName: "Лукоянов Денис Николаевич",
        image: "images/teachers/lukoyanov_dn.jpg",
        academicDegree: "кандидат юридических наук",
        academicTitle: "Доцент",
        workPost: "Заведующий кафедрой",
        courses: [],
        email: "dn_lukojanov@kosgos.ru",
        phone: "г.Кострома, ул. 1 Мая, д.14, корп.Г1, ауд.212; (4942) 63-49-00 (доб. 8840)"
      },
      "Ивкова А.В.": {
        fullName: "Ивкова Анна Владимировна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "кандидат юридических наук",
        workPost: "Доцент кафедры",
        courses: [],
        email: "kaf_spd@kosgos.ru",
        phone: "г.Кострома, ул. 1 Мая, д.14, корп.Г1, ауд.212; (4942) 63-49-00 (доб. 8840)"
      },
      "Кобзарев Ф.М.": {
        fullName: "Кобзарев Фёдор Михайлович",
        image: "images/teachers/kobzarev_fm.jpg",
        academicDegree: "доктор юридических наук",
        workPost: "Профессор кафедры",
        courses: [],
        email: "kaf_spd@kosgos.ru",
        phone: "г.Кострома, ул. 1 Мая, д.14, корп.Г1, ауд.212; (4942) 63-49-00 (доб. 8840)"
      },
      "Хвалыгина Н.Л.": {
        fullName: "Хвалыгина Наталия Лазаревна",
        image: "images/teachers/hvalygina_nl.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: [],
        email: "kaf_spd@kosgos.ru",
        phone: "г.Кострома, ул. 1 Мая, д.14, корп.Г1, ауд.212; (4942) 63-49-00 (доб. 8840)"
      },
      "Быкова М.С.": {
        fullName: "Быкова Мария Сергеевна",
        image: "images/teachers/bykova_ms.jpg",
        academicDegree: "кандидат юридических наук",
        workPost: "Доцент кафедры",
        courses: [],
        phone: "г. Кострома, ул. 1 Мая, д. 14, корп. Г1, ауд. 212; (4942) 63-49-00 (доб. 8840)"
      },
      "Яснева Е.В.": {
        fullName: "Яснева Елена Васильевна",
        image: "images/teachers/yasneva_ev.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: [],
        email: "kaf_spd@kosgos.ru",
        phone: "г.Кострома, ул. 1 Мая, д.14, корп.Г1, ауд.212; (4942) 63-49-00 (доб. 8840)"
      },
      "Евстегнеев А.С.": {
        fullName: "Евстегнеев Алексей Сергеевич",
        image: "images/teachers/evstegneev_as.jpg",
        academicDegree: "кандидат юридических наук",
        academicTitle: "Доцент",
        workPost: "",
        courses: [],
        phone: "г.Кострома, ул. 1 Мая, д.14, корп.Г1, ауд.224; (4942) 63-49-00 (доб. 8860)"
      },
      "Кузьмина Н.В.": {
        fullName: "Кузьмина Наталья Владимировна",
        image: "images/teachers/kuzmina_nv.jpg",
        academicDegree: "кандидат юридических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: [],
        phone: "г.Кострома, ул. 1 Мая, д.14, корп.Г1, ауд.224; (4942) 63-49-00 (доб. 8860)"
      },
      "Орловская И.В.": {
        fullName: "Орловская Ирина Викторовна",
        image: "images/teachers/orlovskaya_iv.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: [],
        phone: "г.Кострома, ул. 1 Мая, д.14, корп.Г1, ауд.224; (4942) 63-49-00 (доб. 8860)"
      },
      "Конардов С.Б.": {
        fullName: "Конардов Сергей Борисович",
        image: "images/teachers/konardov_sb.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: [],
        phone: "г.Кострома, ул. 1 Мая, д.14, корп.Г1, ауд.224; (4942) 63-49-00 (доб. 8860)"
      },
      "Сиверская Л.А.": {
        fullName: "Сиверская Людмила Анатольевна",
        image: "images/teachers/siverskaya_la.jpg",
        academicDegree: "кандидат юридических наук",
        workPost: "Доцент кафедры",
        courses: [],
        phone: "г.Кострома, ул. 1 Мая, д.14, корп.Г1, ауд.224; (4942) 63-49-00 (доб. 8860)"
      },
      "Ювенский И.В.": {
        fullName: "Ювенский Игорь Вадимович",
        image: "images/teachers/yuvenskiy_iv.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: [],
        phone: "г.Кострома, ул. 1 Мая, д.14, корп.Г1, ауд.224; (4942) 63-49-00 (доб. 8860)"
      },
      "Зеленцов А.В.": {
        fullName: "Зеленцов Алексей Вениаминович",
        image: "images/teachers/zelentsov_av.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: [],
        phone: "г.Кострома, ул. 1 Мая, д.14, корп.Г1, ауд.224; (4942) 63-49-00 (доб. 8860)"
      }
    },
    "Центр адвокатской практики": {
      "Кузьмина Н.В.": {
        fullName: "Кузьмина Наталья Владимировна",
        image: "images/teachers/kuzmina_nv2.jpg",
        academicDegree: "кандидат юридических наук",
        academicTitle: "Доцент",
        workPost: "Директор центра",
        courses: []
      },
      "Жаров Н.Б.": {
        fullName: "Жаров Николай Борисович",
        image: "images/teachers/zharov_nb.jpg",
        academicDegree: "",
        workPost: "",
        courses: [],
        extra: ["президент Адвокатской палаты Костромской области"]
      },
      "Соснин С.А.": {
        fullName: "Соснин Сергей Александрович",
        image: "images/teachers/sosnin_sa.jpg",
        academicDegree: "",
        workPost: "",
        courses: [],
        extra: ["член квалификационной комиссии Адвокатской палаты Костромской области, адвокат Адвокатской палаты Костромской области"]
      },
      "Григорьева И.В.": {
        fullName: "Григорьева Ирина Владимировна",
        image: "images/teachers/grigoreva_iv.jpg",
        academicDegree: "",
        workPost: "Член квалификационной комиссии Адвокатской палаты Костромской области, директор юридической клиники КГУ",
        courses: []
      },
      "Шлячков М.В.": {
        fullName: "Шлячков Михаил Владимирович",
        image: "images/teachers/shlyachkov_mv.jpg",
        academicDegree: "",
        workPost: "",
        courses: [],
        extra: ["член Совета молодых адвокатов Адвокатской палаты Костромской области"]
      },
      "Шутов В.В.": {
        fullName: "Шутов Виктор Валентинович",
        image: "images/teachers/shutov_vv.jpg",
        academicDegree: "",
        workPost: "",
        courses: [],
        extra: ["адвокат Адвокатской палаты Костромской области, Заслуженный юрист Костромской области"]
      }
    },
    "Кафедра Теории и истории государства и права": {
      "Плюснина О.В.": {
        fullName: "Плюснина Ольга Витальевна",
        image: "images/teachers/plyusnina_ov.jpg",
        academicDegree: "кандидат юридических наук",
        academicTitle: "Доцент",
        workPost: "Заведующая кафедрой теории и истории государства и права",
        courses: []
      },
      "Бриль Г.Г.": {
        fullName: "Бриль Геннадий Геннадьевич",
        image: "images/teachers/bril_gg2.jpg",
        academicDegree: "доктор юридических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Ганжа Н.В.": {
        fullName: "Ганжа Наталья Владимировна",
        image: "images/teachers/ganzha_nv2.jpg",
        academicDegree: "кандидат юридических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Груздев В.В.": {
        fullName: "Груздев Владислав Владимирович",
        image: "images/teachers/gruzdev_vv.jpg",
        academicDegree: "доктор юридических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры, проректор по научной работе КГУ",
        courses: []
      },
      "Зайцев Л.Н.": {
        fullName: "Зайцев Леонид Николаевич",
        image: "images/teachers/zaytsev_ln.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Заливалова Л.Н.": {
        fullName: "Заливалова Людмила Николаевна",
        image: "images/teachers/zalivalova_ln.jpg",
        academicDegree: "кандидат исторических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Киселева Т.А.": {
        fullName: "Киселева Татьяна Александровна",
        image: "images/teachers/kiseleva_ta.jpeg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Мельников И.Н.": {
        fullName: "Мельников Иван Николаевич",
        image: "images/teachers/melnikov_in.jpg",
        academicDegree: "кандидат юридических наук",
        academicTitle: "Доцент",
        workPost: "",
        courses: []
      },
      "Рудацкая Л.Н.": {
        fullName: "Рудацкая Любовь Николаевна",
        image: "images/teachers/rudatskaya_ln.jpg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: []
      },
      "Богданова Е.И.": {
        fullName: "Богданова Екатерина Ильинична",
        image: "images/teachers/bogdanova_ei.jpeg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: []
      }
    },
    "Преподаватели НПР ДПО": {
      "Сидоров А.Н.": {
        fullName: "Сидоров Александр Николаевич",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Старший преподаватель",
        courses: ["Административное право"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: юрист", "Направление подготовки: Юриспруденция", "Общий стаж: 52 года", "Стаж по специальности: 9 лет", "Образовательные программы: 40.03.01 Юриспруденция Профиль Юриспруденция; 38.05.01 Экономическая безопасность Специализация Экономическая безопасность."]
      },
      "Смирнова Н.А.": {
        fullName: "Смирнова Наталья Александровна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Старший преподаватель",
        courses: ["Особенности расследования отдельных видов преступлений", "Проблемы квалификации преступлений и назначение наказаний", "Уголовное право", "Ответственность за экономические и коррупционные преступления."],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: юрист", "Направление подготовки: Юриспруденция, Правоведение", "Повышение квалификации: с 12.04.2022 по 28.04.2022 ПК \"Цифровые сервисы для удаленной работы и коммуникации\", 22 ч., КГУ ИПР (удостоверение № 440600050234 от 28.04.2022)", "Общий стаж: 35 лет", "Стаж по специальности: 13 лет", "Образовательные программы: 40.03.01 Юриспруденция Профиль Юриспруденция; 38.05.01 Экономическая безопасность Специализация N 6 \"Финансово-экономическое обеспечение федеральных государственных органов, обеспечивающих безопасность Российской Федерации\"; 38.05.01 Экономическая безопасность Специализация Экономическая безопасность."]
      }
    }
  },
  "Институт гуманитарных наук и социальных технологий": {
    "Администрация института": {
      "Панкратова О.Б.": {
        fullName: "Панкратова Ольга Борисовна",
        image: "images/teachers/pankratova_ob.jpg",
        academicDegree: "Директор института гуманитарных наук и социальных технологий КГУ",
        workPost: "Сотрудник института",
        courses: [],
        email: "ifi_ksu@kosgos.ru",
        phone: "Адрес: г. Кострома, ул. 1 Мая, д. 14, корпус «В1», 3 этаж, кабинеты № 37, 37а, 37б, № 38а; Телефон: (4942) 63-49-00 (доб. 8200)"
      },
      "Колобова Е.А.": {
        fullName: "Колобова Екатерина Андреевна",
        image: "images/teachers/kolobova_ea.jpg",
        academicDegree: "заместитель директора по учебно-методической работе",
        workPost: "Сотрудник института",
        courses: [],
        email: "e_kolobova@kosgos.ru",
        phone: "Телефон: (4942) 63-49-00 (доб. 8201)"
      },
      "Якимов А.Е.": {
        fullName: "Якимов Александр Евгеньевич",
        image: "images/teachers/yakimov_ae.jpg",
        academicDegree: "заместитель директора института гуманитарных наук и социальных технологий по работе с абитуриентами",
        workPost: "Сотрудник института",
        courses: [],
        email: "yakimov_ae@kosgos.ru",
        phone: "Телефон: (4942) - 63-49-00 (доб. 8201)",
        extra: ["Часы приема: вторник, пятница с 13.00 до 16.00"]
      },
      "Зверев К.А.": {
        fullName: "Зверев Кирилл Александрович",
        image: "images/teachers/zverev_ka.jpg",
        academicDegree: "",
        workPost: "Заместитель директора института гуманитарных наук и социальных технологий по проектной деятельности",
        courses: [],
        email: "zwerew.kir@yandex.ru",
        extra: ["Часы приема: вторник, пятница с 13.00 до 16.00"]
      },
      "Ермакова Л.А.": {
        fullName: "Ермакова Любовь Алексеевна",
        image: "images/teachers/ermakova_la.jpg",
        academicDegree: "заместитель директора института гуманитарных наук и социальных технологий по научно-исследовательской работе",
        workPost: "Сотрудник института",
        courses: [],
        email: "l_ermakova@kosgos.ru",
        phone: "Телефон: (4942) - 63-49-00 (доб. 8201)",
        extra: ["Часы приема: понедельник, четверг с 13.00 до 16.00"]
      },
      "Смирнов П.А.": {
        fullName: "Смирнов Павел Александрович",
        image: "images/teachers/smirnov_pa.jpg",
        academicDegree: "",
        workPost: "Заместитель директора института по воспитательной работе, старший преподаватель кафедры истории",
        courses: [],
        email: "p.smirnov@kosgos.ru",
        phone: "Телефон: (4942) - 63-49-00 (доб. 8201)",
        extra: ["Часы приема: понедельник, четверг с 13.00 до 16.00"]
      }
    },
    "Кафедра Романо-германских языков": {
      "Каплина М.М.": {
        fullName: "Каплина Маргарита Михайловна",
        image: "images/teachers/kaplina_mm.jpg",
        academicDegree: "Кандидат филологический наук",
        academicTitle: "Доцент",
        workPost: "Заведующая кафедрой романо-германских языков",
        courses: [],
        email: "m_kaplina@ksu.edu.ru",
        phone: "(4942) 39-16-61",
        address: "156000, Кострома, ул. 1 Мая, д. 14а",
        education: "окончила факультет иностранных языков КГУ им. Н.А. Некрасова (1971 -1976) и",
        interests: "Лингвистика, теория и практика международной коммуникации"
      },
      "Зимина Е.В.": {
        fullName: "Зимина Евгения Витальевна",
        image: "images/teachers/zimina_ev.jpeg",
        academicDegree: "Кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Акатова А.А.": {
        fullName: "Акатова Александра Александровна",
        image: "images/teachers/akatova_aa.jpeg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Дубова М.Е.": {
        fullName: "Дубова Марина Евгеньевна",
        image: "images/teachers/dubova_me.jpeg",
        academicDegree: "Кандидат филологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Белопухова О.В.": {
        fullName: "Белопухова Ольга Владимировна",
        image: "images/teachers/belopuhova_ov.jpeg",
        academicDegree: "Кандидат филологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Золинова Е.В.": {
        fullName: "Золинова Елена Вадимовна",
        image: "images/teachers/zolinova_ev.jpeg",
        academicDegree: "Кандидат филологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Лебедев А.Ю.": {
        fullName: "Лебедев Андрей Юрьевич",
        image: "images/teachers/lebedev_ay.jpeg",
        academicDegree: "Кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Денисова Т.М.": {
        fullName: "Денисова Тамара Михайловна",
        image: "images/teachers/denisova_tm.jpeg",
        academicDegree: "Кандидат филологических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Жезлова С.А.": {
        fullName: "Жезлова Светлана Александровна",
        image: "images/teachers/zhezlova_sa.png",
        academicDegree: "Кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Кудрявцева Е.В.": {
        fullName: "Кудрявцева Елена Владимировна",
        image: "images/teachers/kudryavtseva_ev.png",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Ермакова Л.А.": {
        fullName: "Ермакова Любовь Алексеевна",
        image: "images/teachers/ermakova_la.jpg",
        academicDegree: "Кандидат филологических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Наградова Л.С.": {
        fullName: "Наградова Любовь Сергеевна",
        image: "images/teachers/nagradova_ls.jpeg",
        academicDegree: "Кандидат филологических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Орехова Е.Н.": {
        fullName: "Орехова Елена Николаевна",
        image: "images/teachers/orehova_en.jpeg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Джарчиева Р.А.": {
        fullName: "Джарчиева Регина Аликовна",
        image: "images/teachers/dzharchieva_ra.png",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: []
      },
      "Григорян А.М.": {
        fullName: "Григорян Алла Маратовна",
        image: "images/teachers/grigoryan_am.jpeg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: []
      },
      "Герасимова И.Е.": {
        fullName: "Герасимова Ирина Евгеньевна",
        image: "images/teachers/gerasimova_ie.jpg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: []
      }
    },
    "Кафедра Отечественной филологии": {
      "Котлов А.К.": {
        fullName: "Котлов Александр Константинович",
        image: "images/teachers/kotlov_ak.jpg",
        academicDegree: "Кандидат филологических наук",
        academicTitle: "Доцент",
        workPost: "Заведующий кафедрой отечественной филологии",
        courses: []
      },
      "Тихомиров В.В.": {
        fullName: "Тихомиров Владимир Васильевич",
        image: "images/teachers/tihomirov_vv.jpg",
        academicDegree: "Доктор филологических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Ганцовская Н.С.": {
        fullName: "Ганцовская Нина Семёновна",
        image: "images/teachers/gancovskaya_ns.jpg",
        academicDegree: "Доктор филологических наук",
        academicTitle: "Профессор",
        workPost: "Старший научный сотрудник",
        courses: []
      },
      "Мелерович А.М.": {
        fullName: "Мелерович Алина Михайловна",
        image: "images/teachers/melerovich_am.jpg",
        academicDegree: "Доктор филологических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: [],
        extra: ["Фокина Мадина Александровна"]
      },
      "Третьякова И.Ю.": {
        fullName: "Третьякова Ирина Юрьевна",
        image: "images/teachers/tretyakova_iy.jpg",
        academicDegree: "Доктор филологических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Коптелова Н.Г.": {
        fullName: "Коптелова Наталия Геннадьевна",
        image: "images/teachers/koptelova_ng.jpg",
        academicDegree: "Доктор филологических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Павлова А.Э.": {
        fullName: "Павлова Алла Эдуардовна",
        image: "images/teachers/pavlova_ae.jpg",
        academicDegree: "Кандидат филологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Цветкова Е.В.": {
        fullName: "Цветкова Елена Вячеславовна",
        image: "images/teachers/tsvetkova_ev.jpg",
        academicDegree: "Кандидат филологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Якимов А.Е.": {
        fullName: "Якимов Александр Евгеньевич",
        image: "images/teachers/yakimov_ae2.jpg",
        academicDegree: "Кандидат филологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Смирнова Л.Н.": {
        fullName: "Смирнова Любовь Николаевна",
        image: "images/teachers/smirnova_ln.jpg",
        academicDegree: "Кандидат филологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Романова А.Н.": {
        fullName: "Романова Алена Николаевна",
        image: "images/teachers/romanova_an.jpg",
        academicDegree: "Кандидат филологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Колобова Е.А.": {
        fullName: "Колобова Екатерина Андреевна",
        image: "images/teachers/kolobova_ea.jpg",
        academicDegree: "Кандидат филологических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Ильина Н.К.": {
        fullName: "Ильина Наталия Кирилловна",
        image: "images/teachers/ilina_nk.jpg",
        academicDegree: "Кандидат филологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Юдникова А.А.": {
        fullName: "Юдникова Алёна Александровна",
        image: "images/teachers/yudnikova_aa.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      }
    },
    "Кафедра Иностранных языков": {
      "Румянцева Л.Н.": {
        fullName: "Румянцева Людмила Николаевна",
        image: "images/teachers/rumyantseva_ln.jpg",
        academicDegree: "Кандидат философских наук",
        academicTitle: "Доцент",
        workPost: "Заведующая кафедрой иностранных языков",
        courses: []
      },
      "Асаткина Я.А.": {
        fullName: "Асаткина Яна Алексеевна",
        image: "images/teachers/asatkina_ya.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Глазова Е.Ю.": {
        fullName: "Глазова Евгения Юрьевна",
        image: "images/teachers/glazova_ey.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: [],
        extra: ["Кандидат культурологии"]
      },
      "Константинова М.В.": {
        fullName: "Константинова Мария Васильевна",
        image: "images/teachers/konstantinova_mv.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: [],
        extra: ["Кандидат культурологии"]
      },
      "Смирнова С.А.": {
        fullName: "Смирнова Светлана Алексеевна",
        image: "images/teachers/smirnova_sa.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Комлева Е.В.": {
        fullName: "Комлева Елена Викторовна",
        image: "images/teachers/komleva_ev.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Комова С.П.": {
        fullName: "Комова Светлана Павловна",
        image: "images/teachers/komova_sp.png",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Кондратьева А.В.": {
        fullName: "Кондратьева Ангелина Владимировна",
        image: "images/teachers/kondrateva_av.png",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Коновалова Н.Б.": {
        fullName: "Коновалова Наталья Борисовна",
        image: "images/teachers/konovalova_nb.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Корнилова О.Н.": {
        fullName: "Корнилова Ольга Николаевна",
        image: "images/teachers/kornilova_on.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Макарова М.С.": {
        fullName: "Макарова Марина Станиславовна",
        image: "images/teachers/makarova_ms.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Новикова Н.Н.": {
        fullName: "Новикова Надежда Николаевна",
        image: "images/teachers/novikova_nn.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Потехина Т.А.": {
        fullName: "Потехина Тамара Альбертовна",
        image: "images/teachers/potehina_ta.png",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Сизова Н.Е.": {
        fullName: "Сизова Наталья Евгеньевна",
        image: "images/teachers/sizova_ne.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Фаррис Н.А.": {
        fullName: "Фаррис Наталья Александровна",
        image: "images/teachers/farris_na.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Роганова Л.А.": {
        fullName: "Роганова Лада Андреевна",
        image: "images/teachers/roganova_la.jpg",
        academicDegree: "кандидат педагогических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Романова А.В.": {
        fullName: "Романова Александра Валерьевна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "",
        workPost: "Преподаватель кафедры",
        courses: []
      },
      "Хабова М.А.": {
        fullName: "Хабова Маргарита Алексеевна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "",
        workPost: "Преподаватель кафедры",
        courses: []
      },
      "Чепиль В.В.": {
        fullName: "Чепиль Виталина Витальевна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "",
        workPost: "Преподаватель кафедры",
        courses: []
      }
    },
    "Кафедра Медиакоммуникаций и туризма": {
      "Белякова Е.Н.": {
        fullName: "Белякова Елена Николаевна",
        image: "images/teachers/belyakova_en.jpg",
        academicDegree: "Кандидат филологических наук",
        academicTitle: "Доцент",
        workPost: "Заведующая кафедрой медиакоммуникаций и туризма",
        courses: []
      },
      "Букова Ю.М.": {
        fullName: "Букова Юлия Михайловна",
        image: "images/teachers/bukova_ym.jpeg",
        academicDegree: "",
        workPost: "Преподаватель-практик кафедры",
        courses: []
      },
      "Васильева М.А.": {
        fullName: "Васильева Маргарита Александровна",
        image: "images/teachers/vasileva_ma.jpg",
        academicDegree: "",
        workPost: "Преподаватель-практик кафедры",
        courses: []
      },
      "Лебедева О.А.": {
        fullName: "Лебедева Ольга Александровна",
        image: "images/teachers/lebedeva_oa.jpg",
        academicDegree: "",
        workPost: "Преподаватель-практик кафедры",
        courses: []
      },
      "Елманов В.С.": {
        fullName: "Елманов Виктор Сергеевич",
        image: "images/teachers/elmanov_vs.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Горланова И.Б.": {
        fullName: "Горланова Ирина Борисовна",
        image: "images/teachers/gorlanova_ib.jpg",
        academicDegree: "кандидат филологических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Данилина М.В.": {
        fullName: "Данилина Марианна Вячеславовна",
        image: "images/teachers/danilina_mv.jpg",
        academicDegree: "кандидат психологических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Шарабарина С.Г.": {
        fullName: "Шарабарина Софья Геннадьевна",
        image: "images/teachers/sharabarina_sg.jpg",
        academicDegree: "кандидат исторических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Шаргина А.А.": {
        fullName: "Шаргина Анастасия Андреевна",
        image: "images/teachers/shargina_aa.jpg",
        academicDegree: "",
        workPost: "Преподаватель кафедры",
        courses: []
      },
      "Ахунзянова Ф.Т.": {
        fullName: "Ахунзянова Фарида Тагировна",
        image: "images/teachers/ahunzyanova_ft.jpg",
        academicDegree: "кандидат филологических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Привалова Е.А.": {
        fullName: "Привалова Евгения Александровна",
        image: "images/teachers/privalova_ea.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Тенякова О.А.": {
        fullName: "Тенякова Оксана Александровна",
        image: "images/teachers/tenyakova_oa.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Залесский А.А.": {
        fullName: "Залесский Алексей Александрович",
        image: "images/teachers/zalesskiy_aa.jpg",
        academicDegree: "",
        workPost: "Преподаватель-практик кафедры, лаборант кафедры",
        courses: []
      }
    },
    "Кафедра Философии, культурологии и социальных коммуникаций": {
      "Зябликов А.В.": {
        fullName: "Зябликов Алексей Вячеславович",
        image: "images/teachers/zyablikov_av.jpg",
        academicDegree: "доктор исторических наук",
        academicTitle: "Профессор",
        workPost: "Заведующий кафедрой философии, культурологии и социальных коммуникаций",
        courses: []
      },
      "Тарковский В.Н.": {
        fullName: "Тарковский Владимир Николаевич",
        image: "images/teachers/tarkovskiy_vn.jpg",
        academicDegree: "Кандидат философских наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Соловьев А.А.": {
        fullName: "Соловьев Андрей Авенирович",
        image: "images/teachers/solovev_aa.jpg",
        academicDegree: "Доктор исторических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Ахунзянова Ф.Т.": {
        fullName: "Ахунзянова Фарида Тагировна",
        image: "images/teachers/ahunzyanova_ft2.jpg",
        academicDegree: "кандидат филологических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Зайцев А.В.": {
        fullName: "Зайцев Александр Владимирович",
        image: "images/teachers/zaytsev_av.jpg",
        academicDegree: "Доктор политических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Яковлев В.Ю.": {
        fullName: "Яковлев Виталий Юрьевич",
        image: "images/teachers/yakovlev_vy.jpg",
        academicDegree: "Доктор философских наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Караваева В.А.": {
        fullName: "Караваева Виктория Алексеевна",
        image: "images/teachers/karavaeva_va.jpg",
        academicDegree: "Кандидат социологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Ращевская Е.П.": {
        fullName: "Ращевская Елена Петровна",
        image: "images/teachers/raschevskaya_ep.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Рудницкая Т.Ю.": {
        fullName: "Рудницкая Татьяна Юрьевна",
        image: "images/teachers/rudnitskaya_ty.jpg",
        academicDegree: "Кандидат философских наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Баландина Н.А.": {
        fullName: "Баландина Наталия Александровна",
        image: "images/teachers/balandina_na.jpg",
        academicDegree: "",
        workPost: "Делопроизводитель кафедры",
        courses: []
      }
    },
    "Кафедра Истории": {
      "Новиков А.В.": {
        fullName: "Новиков Алексей Валентинович",
        image: "images/teachers/novikov_av.jpg",
        academicDegree: "Кандидат исторических наук",
        academicTitle: "Доцент",
        workPost: "Заведующий кафедрой",
        courses: []
      },
      "Едошина И.А.": {
        fullName: "Едошина Ирина Анатольевна",
        image: "images/teachers/edoshina_ia.jpg",
        academicDegree: "",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Белов А.М.": {
        fullName: "Белов Андрей Михайлович",
        image: "images/teachers/belov_am.jpg",
        academicDegree: "Доктор исторических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Зверев К.А.": {
        fullName: "Зверев Кирилл Александрович",
        image: "images/teachers/zverev_ka.jpg",
        academicDegree: "Кандидат исторических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Волкова Е.Ю.": {
        fullName: "Волкова Елена Юрьевна",
        image: "images/teachers/volkova_ey.jpg",
        academicDegree: "Доктор исторических наук",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Кабатов С.А.": {
        fullName: "Кабатов Сергей Александрович",
        image: "images/teachers/kabatov_sa.jpg",
        academicDegree: "Кандидат исторических наук",
        academicTitle: "Доцент",
        workPost: "Заведующий лабораторией археолого-этнологических исследований",
        courses: []
      },
      "Майорова Н.С.": {
        fullName: "Майорова Наталья Сергеевна",
        image: "images/teachers/mayorova_ns.jpg",
        academicDegree: "Кандидат исторических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Панкратова О.Б.": {
        fullName: "Панкратова Ольга Борисовна",
        image: "images/teachers/pankratova_ob2.jpg",
        academicDegree: "Кандидат исторических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Шигарева А.Н.": {
        fullName: "Шигарева Анна Николаевна",
        image: "images/teachers/shigareva_an.jpg",
        academicDegree: "Кандидат исторических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Турыгин А.А.": {
        fullName: "Турыгин Александр Александрович",
        image: "images/teachers/turygin_aa.jpg",
        academicDegree: "Кандидат исторических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Кидяров А.Е.": {
        fullName: "Кидяров Алексей Евгеньевич",
        image: "images/teachers/kidyarov_ae.jpg",
        academicDegree: "Кандидат исторических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Нигметзянов Т.И.": {
        fullName: "Нигметзянов Тахир Исламович",
        image: "images/teachers/nigmetzyanov_ti.jpg",
        academicDegree: "Кандидат исторических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Рыбин А.А.": {
        fullName: "Рыбин Андрей Александрович",
        image: "images/teachers/rybin_aa.jpg",
        academicDegree: "Кандидат исторических наук",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Смирнов П.А.": {
        fullName: "Смирнов Павел Александрович",
        image: "images/teachers/smirnov_pa2.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Малинин А.Н.": {
        fullName: "Малинин Андрей Николаевич",
        image: "images/teachers/malinin_an.png",
        academicDegree: "",
        workPost: "Преподаватель кафедры",
        courses: []
      },
      "Гранцева А.Д.": {
        fullName: "Гранцева Анна Дмитриевна",
        image: "images/teachers/grantseva_ad.jpg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: []
      },
      "Рябинцев С.В.": {
        fullName: "Рябинцев Сергей Владимирович",
        image: "images/teachers/ryabintsev_sv.jpeg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: []
      },
      "Попова И.И.": {
        fullName: "Попова Ирина Игоревна",
        image: "images/teachers/popova_ii.jpeg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: []
      }
    },
    "Преподаватели НПР ДПО": {
      "Фокина М.А.": {
        fullName: "Фокина Мадина Александровна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Доктор филологических наук",
        academicTitle: "Профессор",
        workPost: "Профессор",
        courses: ["Методы исследований в русистике", "Коммуникативная организация текста", "Введение в языкознание", "История русского литературного языка", "Филологический анализ текста", "Проблемы филологического анализа повествовательного текста", "Общее языкознание", "Филология в системе современного гуманитарного знания"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: учитель русского языка и литературы", "Направление подготовки: Русский язык и литература", "Повышение квалификации: с 12.04.2022 по 28.04.2022 ПК \"Цифровые сервисы для удаленной работы и коммуникации\", 22 ч., КГУ ИПР (удостоверение № 440600050235 от 28.04.2022); с 21 октября 2024 г. по 08 ноября 2024 г., ФГБОУ ВО \"Казанский национальный исследовательский технологический университет\", ПК \"Цифровые технологии в высшем и профессиональном образовании и науке\", 36 часов (удостоверение ПК № 972671 от 08 ноября 2024 г.)", "Общий стаж: 38 лет", "Стаж по специальности: 31 год", "Образовательные программы: 45.06.01 Языкознание и литературоведение Направленность Русский язык; 44.03.05 Педагогическое образование (с двумя профилями подготовки) Профиль Русский язык, литература; 45.04.01 Филология Профиль Зарубежная филология и межкультурная коммуникация"]
      },
      "Цинь Л.": {
        fullName: "Цинь Лидун",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Старший преподаватель",
        courses: ["Китайский язык"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: преподаватель русского языка", "Направление подготовки: Филология: русский язык", "Общий стаж: 9 лет", "Стаж по специальности: 9 лет", "Образовательные программы: #N/A"]
      }
    }
  },
  "Институт культуры и искусств": {
    "Администрация института": {
      "Домахина Н.М.": {
        fullName: "Домахина Надежда Михайловна",
        image: "images/teachers/domahina_nm.jpg",
        academicDegree: "Директор института культуры и искусств",
        academicTitle: "Доцент",
        workPost: "Сотрудник института",
        courses: [],
        email: "hgf@kosgos.ru",
        phone: "Адрес: г. Кострома, ул. 1 Мая, д.14а, корпус «В1», аудитория № 63; Телефон: (4942) 63-49-00 (доб. 8400)",
        extra: ["Часы работы дирекции института: 8.30-16.00", "Перерыв: 12.30-13.00"]
      },
      "Колодий Л.П.": {
        fullName: "Колодий Любовь Павловна",
        image: "images/teachers/kolodiy_lp.jpg",
        academicDegree: "",
        workPost: "Заместитель директора института культуры и искусств по учебно-методической и научно-исследовательской работе",
        courses: [],
        email: "l_kolodiy@kosgos.ru",
        phone: "Адрес: г. Кострома, ул. 1 Мая, д.14а, корпус «В1», аудитория № 63; Телефон: (4942) 63-49-00 (доб. 8401)"
      },
      "Кондрашова Е.Е.": {
        fullName: "Кондрашова Евгения Евгеньевна",
        image: "images/teachers/kondrashova_ee.jpg",
        academicDegree: "",
        workPost: "Заместитель директора по воспитательной работе",
        courses: [],
        email: "e_kondrashova@kosgos.ru",
        phone: "Телефон: (4942) 63-49-00 (доб. 8420)",
        address: "Адрес: г. Кострома, ул. Пятницкая, д. 2/18, корпус «Б1»"
      }
    },
    "Кафедра Музыки": {
      "Ахлестина А.Ю.": {
        fullName: "Ахлестина Алла Юрьевна",
        image: "images/teachers/ahlestina_ay.jpg",
        academicDegree: "Кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Заведующий кафедрой музыки",
        courses: []
      },
      "Жулябина М.Л.": {
        fullName: "Жулябина Марина Львовна",
        image: "images/teachers/zhulyabina_ml.jpg",
        academicDegree: "",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Захаров А.И.": {
        fullName: "Захаров Андрей Иванович",
        image: "images/teachers/zaharov_ai.jpg",
        academicDegree: "",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Александрова Е.В.": {
        fullName: "Александрова Елена Владимировна",
        image: "images/teachers/aleksandrova_ev.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Астафьева Л.Е.": {
        fullName: "Астафьева Любовь Евгеньевна",
        image: "images/teachers/astafeva_le.jpg",
        academicDegree: "Кандидат культурологических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Боброва Э.В.": {
        fullName: "Боброва Эльвира Вакильевна",
        image: "images/teachers/bobrova_ev.jpg",
        academicDegree: "Кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Буслова Е.В.": {
        fullName: "Буслова Елена Викторовна",
        image: "images/teachers/buslova_ev.jpg",
        academicDegree: "Кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Луданова Т.В.": {
        fullName: "Луданова Татьяна Владимировна",
        image: "images/teachers/ludanova_tv.jpg",
        academicDegree: "Кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Кондрашова Е.Е.": {
        fullName: "Кондрашова Евгения Евгеньевна",
        image: "images/teachers/kondrashova_ee.jpg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: []
      }
    },
    "Кафедра Физического воспитания": {
      "Кучина Ю.С.": {
        fullName: "Кучина Юлия Сергеевна",
        image: "images/teachers/kuchina_ys.jpg",
        academicDegree: "Кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Заведующий кафедрой",
        courses: []
      },
      "Назарова Л.А.": {
        fullName: "Назарова Любовь Анатольевна",
        image: "images/teachers/nazarova_la.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Павлов Е.А.": {
        fullName: "Павлов Евгений Александрович",
        image: "images/teachers/pavlov_ea.jpg",
        academicDegree: "кандидат педагогических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Филимонова И.В.": {
        fullName: "Филимонова Илона Валерьевна",
        image: "images/teachers/filimonova_iv.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Сайкин А.В.": {
        fullName: "Сайкин Александр Вячеславович",
        image: "images/teachers/saykin_av.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Когут М.Н.": {
        fullName: "Когут Марина Нинельевна",
        image: "images/teachers/kogut_mn.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Крылова И.Б.": {
        fullName: "Крылова Ирина Борисовна",
        image: "images/teachers/krylova_ib.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Тарасова Н.В.": {
        fullName: "Тарасова Наталья Васильевна",
        image: "images/teachers/tarasova_nv.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Копейкина М.А.": {
        fullName: "Копейкина Марина Александровна",
        image: "images/teachers/kopeykina_ma.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Куликова О.Е.": {
        fullName: "Куликова Ольга Евгеньевна",
        image: "images/teachers/kulikova_oe.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Кононов С.В.": {
        fullName: "Кононов Сергей Витальевич",
        image: "images/teachers/kononov_sv.jpg",
        academicDegree: "",
        workPost: "Лаборант кафедры",
        courses: []
      },
      "Поленова Ж.А.": {
        fullName: "Поленова Жанна Анатольевна",
        image: "images/teachers/polenova_za.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Мешкалов О.Б.": {
        fullName: "Мешкалов Олег Борисович",
        image: "images/teachers/meshkalov_ob.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Кудряшов И.Р.": {
        fullName: "Кудряшов Иван Рафаэлович",
        image: "images/teachers/kudryashov_ir.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Куликова Е.В.": {
        fullName: "Куликова Екатерина Викторовна",
        image: "images/teachers/kulikova_ev.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Токарева О.Н.": {
        fullName: "Токарева Ольга Николаевна",
        image: "images/teachers/tokareva_on.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Васильева Н.А.": {
        fullName: "Васильева Наталья Александровна",
        image: "images/teachers/vasileva_na.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Кучин Н.В.": {
        fullName: "Кучин Николай Валентинович",
        image: "images/teachers/kuchin_nv.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Белкина В.С.": {
        fullName: "Белкина Вера Сергеевна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "",
        workPost: "Лаборант кафедры",
        courses: [],
        extra: ["Горный Алексей Алексеевич"]
      }
    },
    "Кафедра Физической культуры и спорта": {
      "Смирнова Л.М.": {
        fullName: "Смирнова Лилия Мансуровна",
        image: "images/teachers/smirnova_lm.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Профессор",
        workPost: "Заведующая кафедрой физической культуры и спорта",
        courses: []
      },
      "Гелас М.В.": {
        fullName: "Гелас Марина Вадимовна",
        image: "images/teachers/gelas_mv.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Крылов Л.В.": {
        fullName: "Крылов Леонид Витальевич",
        image: "images/teachers/krylov_lv.jpg",
        academicDegree: "кандидат педагогических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Нуртдинов С.М.": {
        fullName: "Нуртдинов Сергей Максонович",
        image: "images/teachers/nurtdinov_sm.jpg",
        academicDegree: "кандидат психологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Рощина Н.В.": {
        fullName: "Рощина Наталья Владимировна",
        image: "images/teachers/roschina_nv.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Смирнова Н.О.": {
        fullName: "Смирнова Наталия Олеговна",
        image: "images/teachers/smirnova_no.jpg",
        academicDegree: "кандидат педагогических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Уразова С.Г.": {
        fullName: "Уразова Светлана Геннадьевна",
        image: "images/teachers/urazova_sg.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      }
    },
    "Кафедра Изобразительных искусств и технологии": {
      "Высоцкий В.М.": {
        fullName: "Высоцкий Владимир Михайлович",
        image: "images/teachers/vysotskiy_vm.jpg",
        academicDegree: "",
        workPost: "Заведующий кафедрой",
        courses: []
      },
      "Домахина Н.М.": {
        fullName: "Домахина Надежда Михайловна",
        image: "images/teachers/domahina_nm2.jpg",
        academicDegree: "Кандидат философских наук",
        academicTitle: "Доцент",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Еремин В.Е.": {
        fullName: "Еремин Владимир Евгеньевич",
        image: "images/teachers/eremin_ve.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Королев М.Ю.": {
        fullName: "Королев Марк Юрьевич",
        image: "images/teachers/korolev_my.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Колодий Л.П.": {
        fullName: "Колодий Любовь Павловна",
        image: "images/teachers/kolodiy_lp2.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Марусич В.А.": {
        fullName: "Марусич Владимир Александрович",
        image: "images/teachers/marusich_va.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Гурьянова И.В.": {
        fullName: "Гурьянова Ирина Валентиновна",
        image: "images/teachers/guryanova_iv.jpg",
        academicDegree: "",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Хрушкова Ю.И.": {
        fullName: "Хрушкова Юлия Игоревна",
        image: "images/teachers/hrushkova_yi.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      }
    },
    "Преподаватели НПР ДПО": {
      "Алексеева М.А.": {
        fullName: "Алексеева Марина Андреевна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент",
        courses: ["Перспектива и построение картинного пространства"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: учиттель изобразительного искусства и черчения", "Направление подготовки: Изобразительное искусство и черчение", "Повышение квалификации: с 12.04.2022 по 28.04.2022 ПК \"Цифровые сервисы для удаленной работы и коммуникации\", 22 ч., КГУ ИПР (удостоверение № 440600050197 от 28.04.2022)", "Общий стаж: 43 года", "Стаж по специальности: 33 года", "Образовательные программы: 44.03.01 Педагогическое образование Профиль Изобразительное искусство; 44.03.05 Педагогическое образование (с двумя профилями подготовки) Профиль Изобразительное искусство, дизайн; 44.03.05 Педагогическое образование (с двумя профилями подготовки) Профиль Изобразительное искусство, дополнительное образование в сфере дизайна"]
      }
    }
  },
  "Институт педагогики и психологии": {
    "Администрация института": {
      "Самохвалова А.Г.": {
        fullName: "Самохвалова Анна Геннадьевна",
        image: "images/teachers/samohvalova_ag.jpg",
        academicDegree: "доктор психологических наук",
        academicTitle: "Профессор",
        workPost: "Директор Института педагогики и психологии",
        courses: [],
        email: "a_samohvalova@kosgos.ru",
        phone: "Адрес: г. Кострома, п. Новый, д. 1, ИПП, каб. 101; Телефон: (4942) 63-49-00 (доб. 8500)"
      },
      "Румянцев Ю.В.": {
        fullName: "Румянцев Юрий Викторович",
        image: "images/teachers/rumyantsev_yv.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Первый заместитель директора",
        courses: [],
        email: "rum_kpn@mail.ru",
        phone: "Адрес: г. Кострома, п. Новый, д. 1, ИПП, каб. 249; Телефон: (4942) 63-49-00 (доб. 8501)"
      },
      "Тихомирова Е.В.": {
        fullName: "Тихомирова Елена Викторовна",
        image: "images/teachers/tihomirova_ev.jpg",
        academicDegree: "кандидат психологических наук",
        academicTitle: "Доцент",
        workPost: "Заместитель директора по научно-исследовательской деятельности",
        courses: [],
        email: "nauka.ipp@mail.ru",
        phone: "Адрес: г. Кострома, п. Новый, д. 1, ИПП, каб. 111; Телефон: (4942) 63-49-00 (доб. 8518)"
      },
      "Райкина М.А.": {
        fullName: "Райкина Мария Александровна",
        image: "images/teachers/raykina_ma.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Помощник директора по организации профессиональной практики",
        courses: [],
        email: "mariasomkina@kosgos.ru",
        phone: "Адрес: г. Кострома, п. Новый, д. 1, ИПП, каб. 109; Телефон: (4942) 63-49-00 (доб. 8537)"
      },
      "Ванеева А.С.": {
        fullName: "Ванеева Анастасия Сергеевна",
        image: "images/teachers/vaneeva_as.jpg",
        academicDegree: "",
        workPost: "Заместитель директора по воспитательной работе",
        courses: [],
        email: "a.vaneeva@kosgos.ru",
        phone: "Адрес: г. Кострома, п. Новый, д. 1, ИПП, каб. 271; Телефон: (4942) 63-49-00 (доб. 8592)"
      },
      "Сойту А.К.": {
        fullName: "Сойту Алена Константиновна",
        image: "images/teachers/soytu_ak.jpg",
        academicDegree: "",
        workPost: "Заместитель директора по учебно-методической работе",
        courses: [],
        email: "a_vorobeva@kosgos.ru",
        phone: "Адрес: г. Кострома, п. Новый, д. 1, ИПП, каб. 109; Телефон: (4942) 63-49-00 (доб. 8503)"
      },
      "Шишова Н.Г.": {
        fullName: "Шишова Нина Геннадьевна",
        image: "images/teachers/shishova_ng.jpg",
        academicDegree: "",
        workPost: "Специалист по УМР (очно-заочная форма обучения)",
        courses: [],
        email: "nina.schischova2017@yandex.ru",
        phone: "Адрес: г. Кострома, п. Новый, д. 1, ИПП, каб. 101; Телефон: (4942) 63-49-00 (доб. 8505)"
      },
      "Сергеева С.С.": {
        fullName: "Сергеева Светлана Сергеевна",
        image: "images/teachers/sergeeva_ss.jpg",
        academicDegree: "",
        workPost: "Специалист по УМР (очная форма обучения)",
        courses: [],
        email: "sveta.s.2439@gmail.com",
        phone: "Адрес: г. Кострома, п. Новый, д. 1, ИПП, каб. 114; Телефон: 63-49-00 (доб. 8506)"
      }
    },
    "Кафедра Общей и социальной психологии": {
      "Сапоровская М.В.": {
        fullName: "Сапоровская Мария Вячеславовна",
        image: "images/teachers/saporovskaya_mv.jpg",
        academicDegree: "доктор психологических наук",
        academicTitle: "Профессор",
        workPost: "Заведующая кафедрой общей и социальной психологии",
        courses: []
      },
      "Голубев В.В.": {
        fullName: "Голубев Валерий Вячеславович",
        image: "images/teachers/golubev_vv.jpg",
        academicDegree: "кандидат психологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры общей и социальной психологии",
        courses: []
      },
      "Крылова Н.Г.": {
        fullName: "Крылова Наталья Геннадьевна",
        image: "images/teachers/krylova_ng.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры общей и социальной психологии",
        courses: []
      },
      "Тихомирова Е.В.": {
        fullName: "Тихомирова Елена Викторовна",
        image: "images/teachers/tihomirova_ev2.jpg",
        academicDegree: "кандидат психологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры общей и социальной психологии",
        courses: []
      },
      "Уманская И.А.": {
        fullName: "Уманская Ирина Александровна",
        image: "images/teachers/umanskaya_ia.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры общей и социальной психологии",
        courses: []
      },
      "Екимчик О.А.": {
        fullName: "Екимчик Ольга Александровна",
        image: "images/teachers/ekimchik_oa.jpg",
        academicDegree: "кандидат психологических наук",
        workPost: "Доцент кафедры общей и социальной психологии",
        courses: []
      },
      "Каменская А.С.": {
        fullName: "Каменская Анна Сергеевна",
        image: "images/teachers/kamenskaya_as.jpg",
        academicDegree: "",
        workPost: "Ассистент кафедры общей и социальной психологии",
        courses: []
      },
      "Бугрова Д.В.": {
        fullName: "Бугрова Дарья Владимировна",
        image: "images/teachers/bugrova_dv.jpeg",
        academicDegree: "",
        workPost: "Ассистент кафедры общей и социальной психологии",
        courses: []
      },
      "Лебедева О.И.": {
        fullName: "Лебедева Оксана Игоревна",
        image: "images/teachers/lebedeva_oi.jpg",
        academicDegree: "",
        workPost: "Делопроизводитель кафедры общей и социальной психологии",
        courses: []
      }
    },
    "Кафедра Социальной работы": {
      "Веричева О.Н.": {
        fullName: "Веричева Ольга Николаевна",
        image: "images/teachers/vericheva_on.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Заведующий кафедрой социальной работы",
        courses: []
      },
      "Бойцова С.В.": {
        fullName: "Бойцова Светлана Владимировна",
        image: "images/teachers/boytsova_sv.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Забелина О.М.": {
        fullName: "Забелина Ольга Михайловна",
        image: "images/teachers/zabelina_om.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Петрова М.С.": {
        fullName: "Петрова Мария Сергеевна",
        image: "images/teachers/petrova_ms.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Румянцев Ю.В.": {
        fullName: "Румянцев Юрий Викторович",
        image: "images/teachers/rumyantsev_yv2.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Смирнова Е.Е.": {
        fullName: "Смирнова Екатерина Евгеньевна",
        image: "images/teachers/smirnova_ee.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Топка Н.Б.": {
        fullName: "Топка Наталья Борисовна",
        image: "images/teachers/topka_nb.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Мамонтова Н.И.": {
        fullName: "Мамонтова Наталья Ивановна",
        image: "images/teachers/mamontova_ni.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Быстрова Н.Ф.": {
        fullName: "Быстрова Наталья Филипповна",
        image: "images/teachers/bystrova_nf.jpg",
        academicDegree: "",
        workPost: "Преподаватель кафедры",
        courses: []
      },
      "Шишова Н.Г.": {
        fullName: "Шишова Нина Геннадьевна",
        image: "images/teachers/shishova_ng2.jpg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: []
      },
      "Воронина И.В.": {
        fullName: "Воронина Ирина Владимировна",
        image: "images/teachers/voronina_iv.jpg",
        academicDegree: "",
        workPost: "Делопроизводитель кафедры социальной работы",
        courses: []
      }
    },
    "Кафедра Педагогики и акмеологии личности": {
      "Воронцова А.В.": {
        fullName: "Воронцова Анна Валерьевна",
        image: "images/teachers/vorontsova_av.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Заведующая кафедрой педагогики и акмеологии личности",
        courses: []
      },
      "Самохвалова А.Г.": {
        fullName: "Самохвалова Анна Геннадьевна",
        image: "images/teachers/samohvalova_ag2.jpg",
        academicDegree: "доктор психологических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Миронова Т.И.": {
        fullName: "Миронова Татьяна Ивановна",
        image: "images/teachers/mironova_ti.jpg",
        academicDegree: "доктор психологических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Кудинов В.А.": {
        fullName: "Кудинов Владимир Андреевич",
        image: "images/teachers/kudinov_va.jpg",
        academicDegree: "доктор исторических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Суханов П.В.": {
        fullName: "Суханов Петр Владимирович",
        image: "images/teachers/suhanov_pv.jpg",
        academicDegree: "доктор педагогических наук",
        academicTitle: "Доцент",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Рассадин Н.М.": {
        fullName: "Рассадин Николай Михайлович",
        image: "images/teachers/rassadin_nm.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Павлова О.А.": {
        fullName: "Павлова Оксана Александровна",
        image: "images/teachers/pavlova_oa.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Дмитрук Л.А.": {
        fullName: "Дмитрук Людмила Александровна",
        image: "images/teachers/dmitruk_la.jpg",
        academicDegree: "кандидат филологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Коваленко М.Ю.": {
        fullName: "Коваленко Марина Юрьевна",
        image: "images/teachers/kovalenko_my.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Иванова Н.М.": {
        fullName: "Иванова Наталия Михайловна",
        image: "images/teachers/ivanova_nm.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Скворцова М.А.": {
        fullName: "Скворцова Марина Алексеевна",
        image: "images/teachers/skvortsova_ma.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Вишневская О.Н.": {
        fullName: "Вишневская Оксана Николаевна",
        image: "images/teachers/vishnevskaya_on.jpg",
        academicDegree: "кандидат психологических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Смирнова И.А.": {
        fullName: "Смирнова Ирина Александровна",
        image: "images/teachers/smirnova_ia.jpg",
        academicDegree: "кандидат педагогических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Шепелева С.В.": {
        fullName: "Шепелева Светлана Витальевна",
        image: "images/teachers/shepeleva_sv.jpg",
        academicDegree: "кандидат психологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Мешалкин А.Н.": {
        fullName: "Мешалкин Александр Николаевич",
        image: "images/teachers/meshalkin_an.jpg",
        academicDegree: "кандидат филологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Медникова Л.А.": {
        fullName: "Медникова Лариса Андреевна",
        image: "images/teachers/mednikova_la.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Коровкина Т.Е.": {
        fullName: "Коровкина Татьяна Евгеньевна",
        image: "images/teachers/korovkina_te.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Чугунова О.Д.": {
        fullName: "Чугунова Ольга Дмитриевна",
        image: "images/teachers/chugunova_od2.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Тимонина А.А.": {
        fullName: "Тимонина Александра Андреевна",
        image: "images/teachers/timonina_aa.jpg",
        academicDegree: "кандидат педагогических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Павлова Е.А.": {
        fullName: "Павлова Екатерина Александровна",
        image: "images/teachers/pavlova_ea.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Голицина С.С.": {
        fullName: "Голицина Светлана Сергеевна",
        image: "images/teachers/golitsina_ss.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Ершова М.В.": {
        fullName: "Ершова Мария Валерьевна",
        image: "images/teachers/ershova_mv.jpg",
        academicDegree: "",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Коваленко А.А.": {
        fullName: "Коваленко Анастасия Александровна",
        image: "images/teachers/kovalenko_aa.jpg",
        academicDegree: "кандидат педагогических наук",
        workPost: "Старший преподаватель кафедры",
        courses: []
      },
      "Белова Т.И.": {
        fullName: "Белова Татьяна Игоревна",
        image: "images/teachers/belova_ti.jpg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: []
      },
      "Зимина Т.А.": {
        fullName: "Зимина Татьяна Алексеевна",
        image: "images/teachers/zimina_ta.jpg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: []
      },
      "Красавин Н.Д.": {
        fullName: "Красавин Никита Дмитриевич",
        image: "images/teachers/krasavin_nd.jpg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: []
      },
      "Сойту А.К.": {
        fullName: "Сойту Алена Константиновна",
        image: "images/teachers/soytu_ak.jpg",
        academicDegree: "",
        workPost: "Преподаватель кафедры",
        courses: []
      },
      "Ванеева А.С.": {
        fullName: "Ванеева Анастасия Сергеевна",
        image: "images/teachers/vaneeva_as.jpg",
        academicDegree: "",
        workPost: "Преподаватель кафедры",
        courses: []
      },
      "Соловьева Ю.В.": {
        fullName: "Соловьева Юлия Владимировна",
        image: "images/teachers/soloveva_jv.jpg",
        academicDegree: "",
        workPost: "Преподаватель кафедры",
        courses: []
      }
    },
    "Кафедра Специальной педагогики и психологии": {
      "Адеева Т.Н.": {
        fullName: "Адеева Татьяна Николаевна",
        image: "images/teachers/adeeva_tn.jpg",
        academicDegree: "кандидат психологических наук",
        academicTitle: "Доцент",
        workPost: "Заведующая кафедрой",
        courses: []
      },
      "Хазова С.А.": {
        fullName: "Хазова Светлана Алексеевна",
        image: "images/teachers/hazova_sa.jpg",
        academicDegree: "доктор психологических наук",
        academicTitle: "Доцент",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Крылова М.А.": {
        fullName: "Крылова Марина Александровна",
        image: "images/teachers/krylova_ma.jpg",
        academicDegree: "кандидат психологических наук",
        workPost: "Старший преподаватель",
        courses: []
      },
      "Севастьянова У.Ю.": {
        fullName: "Севастьянова Ульяна Юрьевна",
        image: "images/teachers/sevastyanova_uy.jpg",
        academicDegree: "кандидат психологических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Шипова Н.С.": {
        fullName: "Шипова Наталья Сергеевна",
        image: "images/teachers/shipova_ns.jpg",
        academicDegree: "кандидат психологических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Зеленцова С.Н.": {
        fullName: "Зеленцова София Николаевна",
        image: "images/teachers/zelentsova_sn.jpg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: []
      },
      "Ефимова Е.Е.": {
        fullName: "Ефимова Екатерина Евгеньевна",
        image: "images/teachers/efimova_ee.jpg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: []
      }
    },
    "Кафедра Психолого-педагогического образования": {
      "Захарова Ж.А.": {
        fullName: "Захарова Жанна Анатольевна",
        image: "images/teachers/zaharova_za.jpg",
        academicDegree: "доктор педагогических наук",
        academicTitle: "Профессор",
        workPost: "Заведующая кафедрой",
        courses: []
      },
      "Гущина Т.Н.": {
        fullName: "Гущина Татьяна Николаевна",
        image: "images/teachers/guschina_tn.jpg",
        academicDegree: "доктор педагогических наук",
        academicTitle: "Профессор",
        workPost: "Профессор кафедры",
        courses: []
      },
      "Воронцов Д.Б.": {
        fullName: "Воронцов Дмитрий Борисович",
        image: "images/teachers/vorontsov_db.jpg",
        academicDegree: "кандидат педагогических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Грушецкая И.Н.": {
        fullName: "Грушецкая Ирина Николаевна",
        image: "images/teachers/grushetskaya_in.jpg",
        academicDegree: "кандидат педагогических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Евстегнеева А.А.": {
        fullName: "Евстегнеева Анастасия Андреевна",
        image: "images/teachers/evstegneeva_aa.jpg",
        academicDegree: "кандидат педагогических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Карпова Е.М.": {
        fullName: "Карпова Елена Михайловна",
        image: "images/teachers/karpova_em.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Козырева Т.В.": {
        fullName: "Козырева Татьяна Владимировна",
        image: "images/teachers/kozyreva_tv2.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Миновская О.В.": {
        fullName: "Миновская Ольга Владиславовна",
        image: "images/teachers/minovskaya_ov.jpg",
        academicDegree: "кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Райкина М.А.": {
        fullName: "Райкина Мария Александровна",
        image: "images/teachers/raykina_ma2.jpg",
        academicDegree: "кандидат педагогических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Щербинина О.С.": {
        fullName: "Щербинина Ольга Станиславовна",
        image: "images/teachers/scherbinina_os.jpg",
        academicDegree: "кандидат педагогических наук",
        workPost: "Доцент кафедры",
        courses: []
      },
      "Сойту А.К.": {
        fullName: "Сойту Алена Константиновна",
        image: "images/teachers/soytu_ak2.jpg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: []
      },
      "Краснов Д.А.": {
        fullName: "Краснов Дмитрий Анатольевич",
        image: "images/teachers/krasnov_da.jpg",
        academicDegree: "",
        workPost: "Ассистент кафедры",
        courses: []
      },
      "Дадина В.А.": {
        fullName: "Дадина Валерия Александровна",
        image: "images/teachers/dadina_va.jpg",
        academicDegree: "",
        workPost: "Делопроизводитель кафедры",
        courses: []
      }
    },
    "Преподаватели НПР ДПО": {
      "Белова Е.Е.": {
        fullName: "Белова Екатерина Евгеньевна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Ассистент",
        courses: [],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: бакалавр", "Направление подготовки: Специальное (дефектологическое) образование", "Профессиональная переподготовка: Костромской государственный университет, с 01.02.2021 по 15.10.2021, Логопедия, 440600 004650 от 08.07.2022 г.", "Общий стаж: 2 года", "Стаж по специальности: 1 год"]
      },
      "Голубева М.С.": {
        fullName: "Голубева Марина Сергеевна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Кандидат психологических наук",
        workPost: "Доцент",
        courses: ["Введение в профессию. Этические и правовые основы деятельности психолога", "Психология развития и возрастная психология", "Социальная психология здоровья", "Маркетинг", "Маркетинговые исследования", "Стратегический менеджмент", "Анализ деятельности конкурентов", "Маркетинговый анализ", "Управление потребительскими предпочтениями", "Маркетинг взаимоотношений", "Стратегический маркетинг", "Стратегическое управление", "Психология манипуляций и защиты от них", "Психологическая помощь людям разных возрастов и социальных групп"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: Педагог-психолог для работы с детьми дошкольного вораста с отклонениями в развитии", "Направление подготовки: Коррекционная педагогика и специальная психология (дошкольная)", "Повышение квалификации: с 09.04.2024 по01.09.2024, \"Психололгическая помощь при ОСР, ПТСР и кризисных состояниях. Комплексный подход\", 96 ч., удостоверение №174/04/2024., Институт практической психологии \"Иматон\"", "Общий стаж: 18 лет", "Стаж по специальности: 12 лет", "Образовательные программы: 37.03.01 Психология Профиль Организационная и консультативная психология; 38.03.01 Экономика Профиль Учет и анализ бизнес-процессов; 38.03.01 Экономика Профиль Экономика бизнеса; 38.03.01 Экономика Профиль Финансы и кредит; 38.03.02 Менеджмент Профиль Маркетинг и электронная коммерция; 38.03.04 Государственное и муниципальное управление Профиль Управление развитием территорий; 38.04.02 Менеджмент Программа магистратуры Маркетинговое управление организациями; 37.04.01 Психология Программа магистратуры Психология в социальной сфере"]
      },
      "Козлова К.А.": {
        fullName: "Козлова Ксения Алексеевна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Ассистент",
        courses: ["Методика преподавания математики в начальной школе", "Методика преподавания интегративного курса \"Окружающий мир\"", "Методика обучения русскому языку и литературе", "Теоретические основы начального курса математики с методикой преподавания", "Воспитательный практикум", "Игровой практикум", "Производственная практика (практика пробных уроков)"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: магистр", "Направление подготовки: Социальная работа", "Общий стаж: 5 лет", "Стаж по специальности: 1 год", "Образовательные программы: 44.03.05 Педагогическое образование (с двумя профилями подготовки) Профиль Начальное образование, организатор детского движения; 44.02.02 ПРЕПОДАВАНИЕ В НАЧАЛЬНЫХ КЛАССАХ (Учитель начальных классов)"]
      },
      "Кораблева Д.С.": {
        fullName: "Кораблева Дина Сергеевна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Ассистент",
        courses: ["Основы нейропсихологии и психогенетики", "Детская нейропсихология", "Психолого-педагогическая диагностика нарушенного развития", "Сенсорная интеграция", "Возрастно-психологическое консультирование", "Ознакомление с окружающим миром. Методика развития речи", "Теории и технологии раннего вмешательства"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: бакалавр", "Направление подготовки: Специальное (дефектологическое) образование", "Общий стаж: 1 год", "Стаж по специальности: 4 мес.", "Образовательные программы: 37.03.01 Психология Профиль Организационная и консультативная психология; 44.03.02 Психолого-педагогическое образование Профиль Психология и социальная педагогика; 44.03.03 Специальное (дефектологическое) образование Профиль Специальная педагогика и психология. Логопедия; 44.03.03 Специальное (дефектологическое) образование Профиль Специальная педагогика и психология"]
      },
      "Кудрявцева Е.А.": {
        fullName: "Кудрявцева Екатерина Анатольевна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Ассистент",
        courses: ["Введение в профессию. Этические и правовые основы деятельности психолога", "Общая психология", "Общепсихологический практикум", "Психология личности и группы", "Экспериментальная психология", "Психология развития и возрастная психология"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: бакалавр", "Направление подготовки: Психология", "Общий стаж: 3 года", "Стаж по специальности: 1 год", "Образовательные программы: 37.03.01 Психология Профиль Организационная и консультативная психология; 38.03.01 Экономика Профиль Учет и анализ бизнес-процессов; 38.03.01 Экономика Профиль Финансы и кредит; 38.03.02 Менеджмент Профиль Маркетинг и электронная коммерция; 38.03.04 Государственное и муниципальное управление Профиль Управление развитием территорий; 38.03.05 Бизнес-информатика Профиль Бизнес-аналитика; 42.03.02 Журналистика Профиль Журналистика и цифровые медиакоммуникации; 44.03.02 Психолого-педагогическое образование Профиль Психология образования и организация проектной деятельности; 45.03.02 Лингвистика Профиль Иностранные языки и межкультурная коммуникация; 46.03.01 История Профиль История; 37.03.01 Психология Профиль Практическая психология и конфликтология"]
      },
      "Опекина Т.П.": {
        fullName: "Опекина Татьяна Петровна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Кандидат психологических наук",
        workPost: "Доцент",
        courses: ["Психология общения и межличностных отношений", "Самоопределение и профессиональная ориентация обучающихся", "Профилактика суицидального поведения несовершеннолетних", "Психология межпоколенных отношений в семье", "Психология безопасности", "Индивидуальное консультирование", "Введение в психоанализ", "Психодиагностика стресса в трудных жизненных ситуациях", "Построение индивидуальных траекторий развития"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: психолог, клинический психолог", "Направление подготовки: Психология", "Профессиональная переподготовка: Высшее, Психология, психолог-преподаватель", "Общий стаж: 13 лет", "Стаж по специальности: 6 лет", "Образовательные программы: 37.03.01 Психология Профиль Психология; 37.03.01 Психология Профиль Организационная и консультативная психология; 37.03.01 Психология Профиль Практическая психология и конфликтология; 37.04.01 Психология Программа магистратуры Психология в социальной сфере; 37.04.01 Психология Программа магистратуры Психология в бизнесе"]
      },
      "Скрябина О.Б.": {
        fullName: "Скрябина Ольга Борисовна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент",
        courses: ["Социальная антропология", "Конфликтология в социальной работе", "Социальная работа с мигрантами", "Тренинговые практики в сфере социальной защиты населения", "Управление конфликтами в социальной работе", "Методология и методы социальной работы с мигрантами", "Психология общения"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: учитель истории, обществоведческих дисциплин, методист по воспитательной работе", "Направление подготовки: \"История\" с дополнительной специальностью \"Педагогика\"", "Профессиональная переподготовка: 2010 ПП \"Психология\" КГУ им. Н.А. Некрасова", "Повышение квалификации: Национальный исследовательский университет \"Высшая школа экономики\", с 31 марта 2023 г. по 3 июля 2023 г. - \"Стратегия развития университета:тенденции, модели, инструменты\", 85 час. (удостоверение № 247896 от 12 июля 2023 года); ФГБОУ ВО \"Приамурский государственный университет имени Шолом-Алейхема\", с 13 мая 2024 г. по 17 мая 2024 г. - ПК \"Современные подходы к укреплению общероссийской гражданской идентичности\", 36 часов (удостоверение № 792420819403 от 17 мая 2024 г.)", "Общий стаж: 30 лет", "Стаж по специальности: 28 лет", "Образовательные программы: 39.03.02 Социальная работа Профиль Организация и администрирование в сфере социальной защиты населения; 39.04.02 Социальная работа Программа магистратуры Социальная работа с разными группами населения; 39.04.02 Социальная работа Программа магистратуры Государственное управление и организация социальной работы; 54.02.01 ДИЗАЙН (ПО ОТРАСЛЯМ) дизайнер"]
      },
      "Сутягина Т.В.": {
        fullName: "Сутягина Татьяна Владимировна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Кандидат педагогических наук",
        academicTitle: "Доцент",
        workPost: "Доцент",
        courses: ["Методика воспитательной работы", "Дидактика начального образования", "Современные проблемы науки и образования", "Теоретические основы организации обучения в начальных классах"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: учитель истории общеобразовательной школы и специалист по социальной работе", "Направление подготовки: История и социальная работа", "Повышение квалификации: с 01.06.2023 года по 03.07.2023 Кострома ПК «Ключевые компетенции в формировании стратегии развития университета», 36 ч., КГУ ИПР (удостоверение № 440600045316 от 03.07.2023); КГУ, ЦДО, с 8 ноября 2023 г. по 9 ноября 2023 года - \"Дополнительное образование в университете: перезагрузка\" (удостоверение № 440600045504 от 9 ноября 2023 г.)", "Общий стаж: 23 года", "Стаж по специальности: 23 года", "Образовательные программы: 44.03.01 Педагогическое образование Профиль Изобразительное искусство; 44.03.01 Педагогическое образование Профиль Физическая культура; 44.03.01 Педагогическое образование Профиль Начальное образование; 44.03.01 Педагогическое образование Профиль Дошкольное образование; 44.03.02 Психолого-педагогическое образование Профиль Психология и социальная педагогика; 44.03.05 Педагогическое образование (с двумя профилями подготовки) Профиль Иностранные языки (английский, немецкий; английский, французский); 44.03.05 Педагогическое образование (с двумя профилями подготовки) Профиль Русский язык, литература; 44.03.05 Педагогическое образование (с двумя профилями подготовки) Профиль Изобразительное искусство, дополнительное образование в сфере дизайна; 44.03.05 Педагогическое образование (с двумя профилями подготовки) Профиль Начальное образование, организатор детского движения; 44.03.05 Педагогическое образование (с двумя профилями подготовки) Профиль Физическая культура, безопасность жизнедеятельности; 44.03.05 Педагогическое образование (с двумя профилями подготовки) Профиль Биология ,география; 44.03.05 Педагогическое образование (с двумя профилями подготовки) Профиль История, организатор детского движения; 44.03.05 Педагогическое образование (с двумя профилями подготовки) Профиль Музыка, дополнительное образование в сфере театрального искусства; 44.03.05 Педагогическое образование (с двумя профилями подготовки) Профиль Математика, физика; 44.03.05 Педагогическое образование (с двумя профилями подготовки) Профиль Информатика, 3D-технологии и робототехника; 44.04.01 Педагогическое образование Программа магистратуры Искусственный интеллект, цифровая среда образовательной организации; 44.02.02 ПРЕПОДАВАНИЕ В НАЧАЛЬНЫХ КЛАССАХ (Учитель начальных классов)"]
      },
      "Тихонова И.В.": {
        fullName: "Тихонова Инна Викторовна",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Кандидат психологических наук",
        academicTitle: "Доцент",
        workPost: "Доцент",
        courses: ["Физиология и патология высшей нервной деятельности", "Психопатология с клиникой интеллектуальных нарушений", "Комплексные сенсорные и интеллектуальные нарушения", "Сенсорная интеграция", "Обучение и воспитание лиц с ментальными нарушениями и РАС", "Обучение и воспитание лиц с тяжелыми и множественными нарушениями развития", "Медико-биологические основы специальной и клинической психологии", "Клинико-психологическая диагностика", "Патопсихология"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: психолог, преподаватель психологии", "Направление подготовки: Психология", "Повышение квалификации: Международный институт развития когнитивно-поведенческой терапии, с 15 августа 2023 г. по 19 сентября 2023 г. ПК \"Практика семейной когнитивно-поведенческой терапии в детско-родительском консультировании\", 30 ак. часов ( сертификат участия в курсе б/н, сентябрь 2023 г.); Санкт-Петербургский институт ДПО для психологов и психотерапевтов, с 15 января 2024 г. по 31 марта 2024 г. - ПК \"Психологическая помощь прямым и косвенным участникам боевых действий и их родственникам. Основы работы с ПТСР\", 144 ак. часа (удостоверение № 4327 00041771 от 31 марта 2024 г.); АНО ВО \"Сибирский институт бизнеса, управления и психологии\", 2024 г., ПК - \"Основы работы в методе EMDR и версии EMDR 2.0. подходы и протоколы\", 72 часа (удостоверепние № 242418615399 от 31 мая 2024 г.)", "Общий стаж: 26 лет", "Стаж по специальности: 19 лет", "Образовательные программы: 44.03.03 Специальное (дефектологическое) образование Профиль Специальная педагогика и психология. Логопедия; 44.03.03 Специальное (дефектологическое) образование Профиль Специальная педагогика и психология; 44.04.03 Специальное (дефектологическое) образование Программа магистратуры Педагогика инклюзивной школы; 44.04.03 Специальное (дефектологическое) образование Программа магистратуры Специальная и клиническая психология личности и семьи"]
      }
    }
  },
  "Военный учебный центр": {
    "Преподаватели НПР ДПО": {
      "Каменский Ю.Д.": {
        fullName: "Каменский Юрий Дмитриевич",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Старший преподаватель",
        courses: [],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: инженер по эксплуатации автомобильной техники", "Направление подготовки: командная тактическая ВДВ", "Общий стаж: 35 лет", "Стаж по специальности: 15 лет"]
      },
      "Кассин А.В.": {
        fullName: "Кассин Андрей Викторович",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Старший преподаватель",
        courses: [],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: специалист в области управления", "Направление подготовки: Организация морально-психологического обеспечения", "Повышение квалификации: с 05.11.2024 по 15.11.2024, ФГБОУ ВО \"Костромской государственный университет\", ПК \"Обеспечение защиты государственной тайны в организации\", 56 часов (удостоверение 440600080943 от 18.11.2024г.);", "Общий стаж: 15 лет", "Стаж по специальности: 15 лет"]
      },
      "Кондратьев Ю.А.": {
        fullName: "Кондратьев Юрий Александрович",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Преподаватель",
        courses: ["Военно-политическая работа", "Военная топография"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: учитель истории и обществоведения", "Повышение квалификации: 2022 ПК \"Обеспечение защиты государственной тайны в организации\", КГУ ИПР (удостоверение № 440600044642 ); с 21 октября 2024 г. по 08 ноября 2024 г., ФГБОУ ВО \"Казанский национальный исследовательский технологический университет\", ПК \"Цифровые технологии в высшем и профессиональном образовании и науке\", 36 часов (удостоверение ПК № 972666 от 08 ноября 2024 г.)", "Общий стаж: 38 лет", "Стаж по специальности: 4 года", "Образовательные программы: #N/A"]
      },
      "Миненко Н.Н.": {
        fullName: "Миненко Николай Николаевич",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Старший преподаватель",
        courses: [],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: офицер с высшим военно-специальным образованием, инженер по эксплуатации ВХВиСЗ", "Направление подготовки: командная тактическая, вооружение химических войск и средства защиты", "Повышение квалификации: С 21 октября 2024 г. по 08 ноября 2024 г., ФГБОУ ВО \" Казанский национальный исследовательский технологический университет\", ПК \"Цифровые технологии в высшем и профессиональном образовании и науке\", 36 часов (удостоверение ПК № 972667 от 08 ноября 2024 г.); с 05 ноября 2024 г. по 15 ноября 2024 г., ВГБОУ ВО \"Костромской государственный университет\", ПК \"Обеспечение защиты государственной тайны в организации\", 56 часов (удостоверение № 440600080945 от 18 ноября 2024 г.)", "Общий стаж: 47 лет", "Стаж по специальности: 35 лет"]
      },
      "Писаренко П.Ю.": {
        fullName: "Писаренко Павел Юрьевич",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Начальник цикла - старший преподаватель",
        courses: [],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: специалист в области управления", "Направление подготовки: Управление тыловым обеспечением войск (сил)", "Повышение квалификации: с 05.11.2024 по 15.11.2024, ФГБОУ ВО \"Костромской государственный университет\", ПК \"Обеспечение защиты государственной тайны в организации\", 56 часов (удостоверение 440600080946 от 18.11.2024г.);", "Общий стаж: 30 лет", "Стаж по специальности: 6 лет"]
      },
      "Траховцов О.А.": {
        fullName: "Траховцов Олег Александрович",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее военное образование",
        workPost: "Преподаватель",
        courses: ["Техническая подготовка", "Вождение", "Инженерная подготовка", "Подготовка по связи"],
        extra: ["Уровень образования: Высшее военное образование", "Квалификация: инженер по эксплуатации бронетанковой и автомобильной техники", "Направление подготовки: Командная тактическая мотострелковых войск", "Повышение квалификации: 2022 ПК \"Обеспечение защиты государственной тайны в организации\", КГУ ИПР (удостоверение № 440600044645 ); с 21 октября 2024 г. по 08 ноября 2024 г. , ФГБОУ ВО \"Казанский национальный исследовательский технологический университет\", ПК \"Цифровые технологии в высшем и профессиональном образовании и науке\", 36 часов (удостоверение ПК № 972669 от 08 ноября 2024 г.)", "Общий стаж: 34 года", "Стаж по специальности: 3 года", "Образовательные программы: #N/A"]
      },
      "Труш Е.В.": {
        fullName: "Труш Евгений Владимирович",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Кандидат экономических наук",
        academicTitle: "Доцент",
        workPost: "Начальник военного учебного центра",
        courses: [],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: специалист в области управления", "Направление подготовки: Управление тыловым обеспечением войск (сил)", "Повышение квалификации: с 21.10.2024 по 08.11.2024г., ФГБОУ ВО \"Казанский национальный исследовательский технологический университет\", ПК \"Цифровые технологии в высшем и профессиональном образовании и науке\", 36 час, (удостоверение ПК № 972670 от 08.11.2024г.); с 23.05.2022 по 01.07.2022 г., ФГБОУ ВО \"Костромской государственный университет\", ПК \"Обеспечение защиты государственной тайны в организации\", 201 час, (удостоверение 44060044646 от 01.07.2022г.);", "Общий стаж: 32 года", "Стаж по специальности: 5 лет"]
      },
      "Тюриков В.В.": {
        fullName: "Тюриков Валерий Вячеславович",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Преподаватель",
        courses: ["Основы военной подготовки"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: инженер по эксплуатации бронетанковой и автомобильной техники", "Направление подготовки: Командная тактическая, танковых войск", "Повышение квалификации: с 05.02.2024 по 16.02.2024, ФГАОУ ВО \"Российский гос.университет нефти и газа\"им И.М.Губкина, ПК \"Руководители мобилизационных органов\", 72 час, (удостоверение УПК 772400029142 от 16.02.2024г.); с 19.12.2022 по 29.12.2023, ФГБОУ ВО \"Костромской государственный университет\", ПК \"Организация проведения работ по защите государственной тайны в организации\", 72 час, (удостоверение 440600045810 от 29.12.2023г.);", "Общий стаж: 15 лет", "Стаж по специальности: 1 год", "Образовательные программы: 01.03.02 Прикладная математика и информатика Профиль Прикладная математика и информатика; 06.03.01 Биология Профиль Экологические биотехнологии; 09.03.02 Информационные системы и технологии Профиль Разработка программного обеспечения информационных систем; 09.03.02 Информационные системы и технологии Профиль Поддержка и развитие ИТ-инфраструктуры компаний; 09.03.02 Информационные системы и технологии Профиль Информационные технологии в медиаиндустрии; 10.03.01 Информационная безопасность Профиль \"Организация и технология защиты информации\" (по отрасли или в сфере профессиональной деятельности); 15.03.02 Технологические машины и оборудование Профиль Цифровое проектирование машин и холодильных систем; 15.03.05 Конструкторско-технологическое обеспечение машиностроительных производств Профиль Технология машиностроения; 27.03.04 Управление в технических системах Профиль Информационное и техническое обеспечение цифровых систем управления; 38.03.01 Экономика Профиль Учет и анализ бизнес-процессов; 38.03.01 Экономика Профиль Финансы и кредит; 38.03.02 Менеджмент Профиль Маркетинг и электронная коммерция; 38.03.04 Государственное и муниципальное управление Профиль Управление развитием территорий; 38.05.01 Экономическая безопасность Специализация Экономическая безопасность"]
      },
      "Маркевич А.В.": {
        fullName: "Маркевич Андрей Владимирович",
        image: "images/teachers/no-photo.jpg",
        academicDegree: "Высшее профессиональное образование",
        workPost: "Начальник учебной части — заместитель начальника военного учебного центра",
        courses: ["Электроснабжение промышленных предприятий", "Системы автоматизированного управления на основе цифровых платформ"],
        extra: ["Уровень образования: Высшее профессиональное образование", "Квалификация: специалист в области управления; экономист", "Направление подготовки: Управление тыловым обеспечением войск (сил); Менеджмент", "Повышение квалификации: с 02.10.2024 г. по 22.10.2024 г., ФГБОУ ВО \"Казанский национальный исследовательский технологический университет\", ПК \"Основы информационной безопасности\", 36 часов (удостоверение ПК № 969417 от 22.10.2024 г.)", "Общий стаж: 15 лет", "Стаж по специальности: 15 лет", "Образовательные программы: 15.03.04 Автоматизация технологических процессов и производств Профиль Компьютерные системы управления в тепло-, газо- и электроснабжении; 27.03.04 Управление в технических системах Профиль Информационное и техническое обеспечение цифровых систем управления; 27.04.04 Управление в технических системах Программа магистратуры Интеллектуальные системы адаптивного управления"]
      }
    }
  }
};

/* ✓ Стилизация вкладок институтов */
const institutesStyle = {
  "Институт \"Высшая ИТ-школа\"": {
    abbreviation: "ИВИТШ",
    backgroundImage: "images/institutes/IVITSH.png",
    backgroundGradient: "to right, rgba(0,0,0,0.35) 0%, rgba(49, 14, 129, 0.05) 100%",
    textShadow: "0 0 15px rgba(0,0,0,0.75)"
  },
  "Институт физико-математических и естественных наук": {
    abbreviation: "ИФМЕН",
    backgroundImage: "images/institutes/IFMEN.png",
    backgroundGradient: "to right, rgba(6, 15, 70, 0.5) 0%, rgba(126, 184, 223, 0.25) 100%",
    textShadow: ""
  },
  "Институт промышленных технологий и дизайна": {
    abbreviation: "ИПТД",
    backgroundImage: "images/institutes/IPTID.png",
    backgroundGradient: "to right, rgba(0,0,0,0.5) 0%, rgba(255,255,255,0.25) 100%",
    textShadow: "0 0 10px rgba(0,0,0,0.5)"
  },
  "Институт управления, экономики и финансов": {
    abbreviation: "ИУЭФ",
    backgroundImage: "images/institutes/IUEF.png",
    backgroundGradient: "to right, rgba(12, 23, 87, 0.25) 0%, rgba(63, 137, 206, 0.25) 100%",
    textShadow: ""
  },
  "Юридический институт имени Ю.П. Новицкого": {
    abbreviation: "ЮИН",
    backgroundImage: "images/institutes/YOUI.png",
    backgroundGradient: "to right, rgba(0,0,0,0.5) 0%, rgba(255,255,255,0.25) 100%",
    textShadow: "0 0 10px rgba(0,0,0,0.5)"
  },
  "Институт гуманитарных наук и социальных технологий": {
    abbreviation: "ИГНИСТ",
    backgroundImage: "images/institutes/IGNiST.png",
    backgroundGradient: "to right, rgba(0, 0, 0, 0.5) 0%, rgba(231, 178, 62, 0.25) 100%",
    textShadow: ""
  },
  "Институт культуры и искусств": {
    abbreviation: "ИКИ",
    backgroundImage: "images/institutes/IKI.png",
    backgroundGradient: "to right, rgba(0,0,0,0.60) 0%, rgba(236, 208, 130, 0.25) 100%",
    textShadow: ""
  },
  "Институт педагогики и психологии": {
    abbreviation: "ИПП",
    backgroundImage: "images/institutes/IPP.png",
    backgroundGradient: "to right, rgba(0,0,0,0.5) 0%, rgba(255,255,255,0.25) 100%",
    textShadow: ""
  },
  "Военный учебный центр": {
    abbreviation: "ВУЦ",
    backgroundImage: "",
    backgroundGradient: "to right, rgba(24, 45, 32, 0.65) 0%, rgba(109, 128, 96, 0.3) 100%",
    textShadow: "0 0 15px rgba(0,0,0,0.75)"
  }
};
