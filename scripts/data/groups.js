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
  /*
  "Магистратура": {
    "ИВИТШ": {
      "1 курс": {
      }
    }
  }*/
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



class GroupSelector {
  constructor() {
    this.input = document.getElementById('groupInput');
    this.dropdown = document.getElementById('groupDropdown');
    this.dropdownContent = document.getElementById('dropdownContent');
    this.expandedCategories = {};
    this.expandedSubcategories = {};

    this.initializeDropdown();
    this.attachEventListeners();
  }

  initializeDropdown() {
    this.dropdownContent.innerHTML = '';

    for (const education in groupsID) {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'dropdown-category';

      // Заголовок категории (тип обучения)
      const categoryHeader = document.createElement('div');
      categoryHeader.className = 'category-header';
      categoryHeader.innerHTML = `
        <span>${education}</span>
        <span class="category-toggle">▶</span>
      `;

      categoryHeader.addEventListener('click', () => {
        this.toggleCategory(education, categoryDiv);
      });

      // Контейнер для элементов категории
      const categoryItems = document.createElement('div');
      categoryItems.className = 'category-items';
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

  addInstitute(parent, education, institute) {
    const subcategoryDiv = document.createElement('div');
    subcategoryDiv.className = 'subcategory';

    const subcategoryHeader = document.createElement('div');
    subcategoryHeader.className = 'subcategory-header';
    const subcategoryKey = `${education}-${institute}`;
    
    subcategoryHeader.innerHTML = `
      <span>${institute}</span>
      <span class="subcategory-toggle">▶</span>
    `;

    subcategoryHeader.addEventListener('click', () => {
      this.toggleSubcategory(subcategoryKey, subcategoryDiv);
    });

    const subcategoryItems = document.createElement('div');
    subcategoryItems.className = 'subcategory-items';
    subcategoryItems.id = `subcategory-${subcategoryKey}`;

    // Добавляем курсы
    for (const course in groupsID[education][institute]) {
      this.addCourse(subcategoryItems, education, institute, course);
    }

    subcategoryDiv.appendChild(subcategoryHeader);
    subcategoryDiv.appendChild(subcategoryItems);
    parent.appendChild(subcategoryDiv);
  }

  addCourse(parent, education, institute, course) {
    const courseDiv = document.createElement('div');
    courseDiv.style.paddingLeft = '32px';

    const courseHeader = document.createElement('div');
    courseHeader.className = 'subcategory-header';
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
    const categoryItems = categoryDiv.querySelector('.category-items');
    const toggle = categoryDiv.querySelector('.category-toggle');
    const header = categoryDiv.querySelector('.category-header');

    categoryItems.classList.toggle('expanded');
    toggle.classList.toggle('rotated');
    header.classList.toggle('expanded');
  }

  toggleSubcategory(key, subcategoryDiv) {
    this.expandedSubcategories[key] = !this.expandedSubcategories[key];
    const subcategoryItems = subcategoryDiv.querySelector('.subcategory-items');
    const toggle = subcategoryDiv.querySelector('.subcategory-toggle');
    const header = subcategoryDiv.querySelector('.subcategory-header');

    subcategoryItems.classList.toggle('expanded');
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

  attachEventListeners() {
    this.input.addEventListener('click', () => {
      this.dropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!this.dropdown.parentElement.contains(e.target)) {
        this.dropdown.classList.remove('open');
      }
    });
  }
}