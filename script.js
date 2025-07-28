/**
 * Конфигурация приложения
 */
const CONFIG = {
    SHEET_IDS: ['1', '2', '3'],
    BASE_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSBiJoKZ5ZzdsyK1OXNNS3AvUx1e8d7N0c4RxXL8TQ8HQ2sgid-sTH5FdmXdMTkB_0Wl4_dfp7SJUAz/pub?output=csv&gid=',
    GID_MAP: {
        '1': '0',
        '2': '1876475411',
        '3': '1240970952',
    }
};

/**
 * Состояние приложения
 */
const APP_STATE = {
    menuIsVisible: window.innerWidth > 768,
    blurOn: false,
    currentAudio: null,
    isMobile: window.innerWidth < 768
};

/**
 * Инициализация приложения
 */
(async function initApp() {
    initBurgerMenu();
    initWindowResizeHandler();
    initGlobalToggle();
    initAudioClickHandler();

    // Загружаем все таблицы и активируем первую по умолчанию
    for (let sheetId of CONFIG.SHEET_IDS) {
        const menuButton = await loadSheetData(sheetId);
        if (sheetId === '1' && menuButton) {
            menuButton.click();
        }
    }

    updateMenuVisibility();
})();

/**
 * Инициализация бургер-меню
 */
function initBurgerMenu() {
    const burgerButton = document.querySelector('.burger-button');
    burgerButton.innerHTML = '&#9776;';
    burgerButton.addEventListener('click', () => {
        APP_STATE.menuIsVisible = !APP_STATE.menuIsVisible;
        updateMenuVisibility();
    });

    // Удаляем лишние стили, так как теперь всё управляется CSS
    const innerMenuTitle = document.querySelector('.inner-menu-title');
    innerMenuTitle.style.textAlign = 'center';
}

/**
 * Инициализация обработчика изменения размера окна
 */
function initWindowResizeHandler() {
    window.addEventListener('resize', () => {
        const nowMobile = window.innerWidth < 768;
        if (nowMobile !== APP_STATE.isMobile) {
            APP_STATE.isMobile = nowMobile;
            APP_STATE.menuIsVisible = !nowMobile; // На десктопе меню всегда видимо

            updateMenuVisibility();
            updateActiveStoryTitle();
        }
    });
}

/**
 * Обновление заголовка активной истории при изменении размера
 */
function updateActiveStoryTitle() {
    const activeStory = document.querySelector('.story[style*="display: flex"]');
    if (!activeStory) return;

    const title = activeStory.querySelector('h1');
    const innerMenuTitle = document.querySelector('.inner-menu-title');

    if (APP_STATE.isMobile) {
        innerMenuTitle.textContent = title.textContent;
        title.textContent = '';
    } else {
        title.textContent = innerMenuTitle.textContent;
        innerMenuTitle.textContent = '';
    }
}

/**
 * Инициализация глобального переключателя размытия
 */
function initGlobalToggle() {
    document.body.classList.toggle('blur-es', APP_STATE.blurOn);

    document.querySelector('.toggle').addEventListener('click', function() {
        this.classList.toggle('active');
        APP_STATE.blurOn = !APP_STATE.blurOn;
        document.body.classList.toggle('blur-es', APP_STATE.blurOn);
        syncLocalTogglesToGlobal();
    });
}

/**
 * Инициализация обработчика кликов по аудио
 */
function initAudioClickHandler() {
    document.querySelector('.content').addEventListener('click', (e) => {
        const sentenceElement = e.target.closest('.vertical-sentence');
        if (!sentenceElement) return;

        const audioSrc = sentenceElement.dataset.audio;
        if (!audioSrc) return;

        playAudio(audioSrc);
    });
}

/**
 * Воспроизведение аудио
 * @param {string} audioSrc - Путь к аудиофайлу
 */
function playAudio(audioSrc) {
    if (APP_STATE.currentAudio) {
        APP_STATE.currentAudio.pause();
        APP_STATE.currentAudio.currentTime = 0;
    }

    APP_STATE.currentAudio = new Audio(audioSrc);
    APP_STATE.currentAudio.play().catch(e => console.error('Ошибка воспроизведения:', e));
}

/**
 * Обновление видимости меню
 */
function updateMenuVisibility() {
    const menuButtons = document.querySelectorAll('.menu-button');
    const menu = document.querySelector('.menu');
    const innerMenuTitle = document.querySelector('.inner-menu-title');

    menuButtons.forEach(button => {
        const isCurrentStory = innerMenuTitle.textContent === button.textContent;

        // На десктопе показываем все кнопки, на мобиле скрываем текущую
        if (window.innerWidth >= 768) {
            button.style.display = 'block';
        } else {
            button.style.display = APP_STATE.menuIsVisible && !isCurrentStory ? 'block' : 'none';
        }
    });

    // Настройка стилей меню в зависимости от платформы
    if (window.innerWidth >= 768) {
        menu.style.maxHeight = '100vh';
        menu.style.height = '100vh';
        menu.style.overflowY = 'auto';
    } else {
        menu.style.maxHeight = APP_STATE.menuIsVisible ? '100vh' : '3.5rem';
        menu.style.overflowY = APP_STATE.menuIsVisible ? 'auto' : 'hidden';
    }
}

/**
 * Парсинг строки CSV
 * @param {string} line - Строка CSV
 * @returns {Array} [id, esText, enText]
 */
function parseCsvLine(line) {
    const match = line.match(/^(\d+),(?:"((?:[^"]|"")*)"|([^,]+)),(?:"((?:[^"]|"")*)"|(.+))$/);
    if (!match) return [null, "-error-", "-error-"];

    const id = match[1].trim();
    const esRaw = match[2] ?? match[3] ?? "";
    const enRaw = match[4] ?? match[5] ?? "";

    // Удаляем двойные кавычки и обрезаем пробелы
    const es = esRaw.replace(/""/g, '"').trim();
    const en = enRaw.replace(/""/g, '"').trim();

    return [id, es, en];
}

/**
 * Загрузка данных из таблицы
 * @param {string} sheetId - ID таблицы
 * @returns {HTMLElement} Кнопка меню
 */
async function loadSheetData(sheetId) {
    const gid = CONFIG.GID_MAP[sheetId];
    const url = `${CONFIG.BASE_URL}${gid}`;
    const response = await fetch(url);
    const csvData = await response.text();
    const lines = csvData.trim().split('\n');

    if (lines.length < 4) return null;

    const title = lines[0].split(',')[0].trim();
    const storyElement = createStoryElement(sheetId, title);
    const menuButton = createMenuButton(title, storyElement);

    // Создаем элементы для каждой строки данных
    for (let i = 3; i < lines.length; i++) {
        const line = lines[i].trim();
        const [id, esText, enText] = parseCsvLine(line);

        if (!id || !esText || !enText || esText === '-error-') continue;

        const sentenceElement = createSentenceElement(sheetId, id, esText, enText);
        storyElement.appendChild(sentenceElement);
    }

    document.querySelector('.content').appendChild(storyElement);
    document.querySelector('.menu').appendChild(menuButton);

    return menuButton;
}

/**
 * Создание элемента истории
 * @param {string} sheetId - ID таблицы
 * @param {string} title - Заголовок истории
 * @returns {HTMLElement} Элемент истории
 */
function createStoryElement(sheetId, title) {
    const storyElement = document.createElement('section');
    storyElement.className = 'story';
    storyElement.dataset.storyId = sheetId;
    storyElement.style.display = 'none';

    const heading = document.createElement('h1');
    heading.textContent = title;
    storyElement.appendChild(heading);

    return storyElement;
}

/**
 * Создание кнопки меню
 * @param {string} title - Заголовок кнопки
 * @param {HTMLElement} storyElement - Связанный элемент истории
 * @returns {HTMLElement} Кнопка меню
 */
function createMenuButton(title, storyElement) {
    const menuButton = document.createElement('div');
    menuButton.className = 'menu-button';
    menuButton.textContent = title;
    menuButton.style.display = APP_STATE.menuIsVisible ? 'block' : 'none';

    menuButton.addEventListener('click', () => {
        // Скрываем все истории и показываем выбранную
        document.querySelectorAll('.story').forEach(story => {
            story.style.display = 'none';
        });

        syncLocalTogglesToGlobal();
        storyElement.style.display = 'flex';
        applyGlobalBlurToStory(storyElement);

        if (APP_STATE.isMobile) {
            APP_STATE.menuIsVisible = false;
            document.querySelector('.inner-menu-title').textContent = menuButton.textContent;
            storyElement.querySelector('h1').textContent = '';
            updateMenuVisibility();
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
    });

    return menuButton;
}

/**
 * Создание элемента предложения
 * @param {string} sheetId - ID таблицы
 * @param {string} id - ID предложения
 * @param {string} esText - Текст на испанском
 * @param {string} enText - Текст на английском
 * @returns {HTMLElement} Элемент предложения
 */
function createSentenceElement(sheetId, id, esText, enText) {
    const container = document.createElement('div');
    container.className = 'container-sentence sentence';

    const verticalElement = document.createElement('div');
    verticalElement.className = 'vertical-sentence';
    verticalElement.dataset.audio = `audio/${sheetId}/${id}.m4a`;

    const esElement = document.createElement('p');
    esElement.className = 'es';
    esElement.textContent = esText;

    const enElement = document.createElement('p');
    enElement.className = 'en';
    enElement.textContent = enText;

    verticalElement.appendChild(esElement);
    verticalElement.appendChild(enElement);

    const toggleElement = createToggleElement(esElement);

    container.appendChild(verticalElement);
    container.appendChild(toggleElement);

    return container;
}

/**
 * Создание элемента переключателя
 * @param {HTMLElement} esElement - Элемент испанского текста
 * @returns {HTMLElement} Элемент переключателя
 */
function createToggleElement(esElement) {
    const toggle = document.createElement('div');
    toggle.className = 'toggle';
    toggle.innerHTML = `
    <div class="labels">
      <span class="off">off</span>
      <span class="on">on</span>
    </div>
    <div class="handle">es</div>
  `;

    toggle.addEventListener('click', function() {
        const isActive = this.classList.toggle('active');
        updateElementBlur(esElement, isActive);
    });

    return toggle;
}

/**
 * Обновление состояния размытия элемента
 * @param {HTMLElement} element - Элемент для размытия
 * @param {boolean} shouldBlur - Нужно ли применять размытие
 */
function updateElementBlur(element, shouldBlur) {
    if (shouldBlur) {
        element.classList.add('blurred');
        element.style.setProperty('filter', 'blur(3px)', 'important');
    } else {
        element.classList.remove('blurred');
        element.style.setProperty('filter', 'none', 'important');
    }
}

/**
 * Синхронизация локальных переключателей с глобальным состоянием
 */
function syncLocalTogglesToGlobal() {
    document.querySelectorAll('.story').forEach(story => {
        story.querySelectorAll('.container-sentence').forEach(sentence => {
            const toggle = sentence.querySelector('.toggle');
            const esElement = sentence.querySelector('.es');

            toggle.classList.toggle('active', APP_STATE.blurOn);
            updateElementBlur(esElement, APP_STATE.blurOn);
        });
    });
}

/**
 * Применение глобального размытия к истории
 * @param {HTMLElement} storyElement - Элемент истории
 */
function applyGlobalBlurToStory(storyElement) {
    storyElement.querySelectorAll('.container-sentence').forEach(sentence => {
        const esElement = sentence.querySelector('.es');
        updateElementBlur(esElement, APP_STATE.blurOn);
    });
}