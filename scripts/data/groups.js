// Коды расписания для разных групп (и полный доступный список групп для регистрации в приложении)
const groupsID = {
  "Бакалавриат": {
    "ИВИТШ": {
      "1 курс": {
        "26-ИСбо-1": 8954,
        "26-ИСбо-2": 8881,
        "26-ИСбо-3": 9000,
        "26-ИСбо-4": 8953,
        "26-ИСбо-5": 8878,
        "26-ИБбо-6": 8949,
        "26-ПМбо-1": 8948,
      },
    },
  },
  "Магистратура": {
    "ИВИТШ": {
      "1 курс": {
      }
    }
  }
}

// ✓ Избранные группы для переключения
let favoriteGroups = {
  "26-ИСбо-1": 8954,
  "26-ИСбо-2": 8881,
  "26-ИСбо-3": 9000,
  "26-ИСбо-4": 8953,
  "26-ИСбо-5": 8878,
  "26-ИБбо-6": 8949,
  "26-ПМбо-1": 8948,
};

let CurrentGroup; // ✓ Переменная текущей выбранной группы

// ✓ Возвращает ID группы по ее названию (многоуровневый поиск)
function getGroupID(groupName) {
  for (const education in groupsID) {
    for (const institute in groupsID[education]) {
      for (const course in groupsID[education][institute]) {
        if (groupsID[education][institute][course][groupName] !== undefined) {
          return groupsID[education][institute][course][groupName];
        }
      }
    }
  }
  return undefined;
}

// ✓ Возвращает исчерпывающую информацию по группе по ее названию
function getGroupInfo(groupName) {
  for (const education in groupsID) {
    for (const institute in groupsID[education]) {
      for (const course in groupsID[education][institute]) {
        if (groupsID[education][institute][course][groupName] !== undefined) {
          return {
            name: groupName,
            id: groupsID[education][institute][course][groupName],
            education,
            institute,
            course
          };
        }
      }
    }
  }
  return null;
}

// Генерация селектора группы при регистрации
class authGroupSelector {
  constructor() {
    this.input = document.getElementById('auth-input-group');
    this.dropdown = document.getElementById('groupDropdown');
    this.dropdownContent = document.getElementById('dropdownContent');
    this.expandedCategories = {}; this.expandedSubcategories = {};
    this.initializeDropdown();
    this.attachEventListeners();
  }

  addInstitute(parent, education, institute) {
    const dropdownInstituteDiv = document.createElement('div');
    dropdownInstituteDiv.className = 'dropdownInstitute';

    const dropdownInstituteHeader = document.createElement('div');
    dropdownInstituteHeader.className = 'dropdownInstitute-header';
    const dropdownInstituteKey = `${education}-${institute}`;
    
    dropdownInstituteHeader.innerHTML = `
      <span>${institute}</span>
      <span class="dropdownInstitute-toggle">▶</span>
    `;

    dropdownInstituteHeader.addEventListener('click', () => {
      this.toggledropdownInstitute(dropdownInstituteKey, dropdownInstituteDiv);
    });

    const dropdownInstituteItems = document.createElement('div');
    dropdownInstituteItems.className = 'dropdownInstitute-items';
    dropdownInstituteItems.id = `dropdownInstitute-${dropdownInstituteKey}`;

    // Добавляем курсы
    for (const course in groupsID[education][institute]) {
      this.addCourse(dropdownInstituteItems, education, institute, course);
    }

    dropdownInstituteDiv.appendChild(dropdownInstituteHeader);
    dropdownInstituteDiv.appendChild(dropdownInstituteItems);
    parent.appendChild(dropdownInstituteDiv);
  }

  addCourse(parent, education, institute, course) {
    const courseDiv = document.createElement('div');
    courseDiv.style.paddingLeft = '32px';

    const courseHeader = document.createElement('div');
    courseHeader.className = 'dropdownInstitute-header';
    courseHeader.style.paddingLeft = '0';
    
    courseHeader.textContent = course;
    courseHeader.style.cursor = 'default';
    courseHeader.style.borderLeft = 'none';

    const courseItems = document.createElement('div');
    courseItems.style.paddingLeft = '16px';

    // Добавляем группы
    for (const groupName in groupsID[education][institute][course]) {
      this.addGroup(courseItems, groupName, groupsID[education][institute][course][groupName]);
    }

    courseDiv.appendChild(courseHeader);
    courseDiv.appendChild(courseItems);
    parent.appendChild(courseDiv);
  }

  addGroup(parent, groupName, groupID) {
    const groupItem = document.createElement('div');
    groupItem.className = 'group-item';
    groupItem.textContent = groupName;
    groupItem.dataset.groupName = groupName;
    groupItem.dataset.groupID = groupID;

    groupItem.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectGroup(groupName, groupID);
    });

    parent.appendChild(groupItem);
  }

  toggleCategory(education, categoryDiv) {
    this.expandedCategories[education] = !this.expandedCategories[education];
    const categoryItems = categoryDiv.querySelector('.dropdownEdutype-items');
    const toggle = categoryDiv.querySelector('.category-toggle');
    const header = categoryDiv.querySelector('.dropdownEdutype-header');

    categoryItems.classList.toggle('expanded');
    toggle.classList.toggle('rotated');
    header.classList.toggle('expanded');
  }

  toggledropdownInstitute(key, dropdownInstituteDiv) {
    this.expandedSubcategories[key] = !this.expandedSubcategories[key];
    const dropdownInstituteItems = dropdownInstituteDiv.querySelector('.dropdownInstitute-items');
    const toggle = dropdownInstituteDiv.querySelector('.dropdownInstitute-toggle');
    const header = dropdownInstituteDiv.querySelector('.dropdownInstitute-header');

    dropdownInstituteItems.classList.toggle('expanded');
    toggle.classList.toggle('rotated');
    header.classList.toggle('expanded');
  }

  selectGroup(groupName, groupID) {
    this.input.value = groupName;

    // Обновляем визуальное выделение
    document.querySelectorAll('.group-item').forEach(item => {
      item.classList.remove('selected');
    });
    document.querySelector(`[data-group-name="${groupName}"]`).classList.add('selected');

    this.dropdown.classList.remove('open');
  }

  // Рендер элемента выбора группы
  initializeDropdown() {
    this.dropdownContent.innerHTML = '';
    for (const education in groupsID) {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'dropdownEdutype';

      // Заголовок категории (тип обучения)
      const categoryHeader = document.createElement('div');
      categoryHeader.className = 'dropdownEdutype-header';
      categoryHeader.innerHTML = `
        <span>${education}</span>
        <span class="category-toggle">▶</span>
      `;

      categoryHeader.addEventListener('click', () => {
        this.toggleCategory(education, categoryDiv);
      });

      // Контейнер для элементов категории
      const categoryItems = document.createElement('div');
      categoryItems.className = 'dropdownEdutype-items';
      categoryItems.id = `category-${education}`;

      // Добавляем подкатегории (институты)
      for (const institute in groupsID[education]) {
        this.addInstitute(categoryItems, education, institute);
      }

      categoryDiv.appendChild(categoryHeader);
      categoryDiv.appendChild(categoryItems);
      this.dropdownContent.appendChild(categoryDiv);
    }
  }

  // ✓ Функция прикрепления слушателей на нажатия элементов выбора группы
  attachEventListeners() {
    this.input.addEventListener('click', () => { // ✓ На открытие элемента
      this.dropdown.classList.toggle('open');
      this.input.classList.add('input-preselected');
    });

    document.addEventListener('click', (e) => { // ✓ На закрытие элемента
      if (!this.dropdown.parentElement.contains(e.target)) {
        this.dropdown.classList.remove('open');
        if (!this.input.value || this.input.value == '') { this.input.classList.remove('input-preselected'); }
      }
    });
  }
}