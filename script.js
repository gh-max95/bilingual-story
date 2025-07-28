const SHEET_IDS = ['1', '2', '3'];

const BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSBiJoKZ5ZzdsyK1OXNNS3AvUx1e8d7N0c4RxXL8TQ8HQ2sgid-sTH5FdmXdMTkB_0Wl4_dfp7SJUAz/pub?output=csv&gid=';

const GID_MAP = {
    '1': '0',
    '2': '1876475411',
    '3': '1240970952',
};

let menuIsVisible = window.innerWidth > 768;
let blurOn = false;

(async function init() {

    const burger = document.querySelector('.burger-button');
    burger.innerHTML = '&#9776;';
    burger.addEventListener('click', () => {
        toggleMenuButtons();
    });
    const innerMenu = document.querySelector('.inner-menu');
    innerMenu.display = 'none';

    let currentAudio = null;
    let isMobileNow = window.innerWidth < 768;
    blurOn = false;

    window.addEventListener('resize', () => {
        const nowMobile = window.innerWidth < 768;
        if (nowMobile !== isMobileNow) {
            isMobileNow = nowMobile;

            if (nowMobile) {
                menuIsVisible = false;
                toggleMenuButtons();
            } else {
                menuIsVisible = true;
                toggleMenuButtons();
                requestAnimationFrame(() => {
                    toggleMenuButtons();
                });
            }

            const activeStory = document.querySelector('.story[style*="display: flex"]');
            if (activeStory) {
                const title = activeStory.querySelector('h1');
                const innerMenuTitle = document.querySelector('.inner-menu-title');

                if (nowMobile) {
                    innerMenuTitle.textContent = title.textContent;
                    title.textContent = '';
                } else {
                    title.textContent = innerMenuTitle.textContent;
                    innerMenuTitle.textContent = '';
                }
            }
        }
    });

    document.body.classList.toggle('blur-es', blurOn);

    document.querySelector('.content').addEventListener('click', (e) => {
        const vertical = e.target.closest('.vertical-sentence');
        if (!vertical) return;

        const audioSrc = vertical.dataset.audio;
        if (!audioSrc) return;

        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }

        currentAudio = new Audio(audioSrc);
        currentAudio.play().catch(e => console.error('Ошибка воспроизведения:', e));
    });

    document.querySelector('.toggle').addEventListener('click', function () {
        this.classList.toggle('active');
        blurOn = !blurOn;
        document.body.classList.toggle('blur-es', blurOn);
        syncLocalTogglesToGlobal();
    });

    for (let sheetId of SHEET_IDS) {
        const menuBtn = await loadSheet(sheetId);

        if (sheetId === '1' && menuBtn) {
            menuBtn.click();
        }
    }
})();

function parseCsvLine(line) {
    const match = line.match(/^(\d+),(?:"((?:[^"]|"")*)"|([^,]+)),(?:"((?:[^"]|"")*)"|(.+))$/);

    if (!match) {
        return [null, "-error-", "-error-"];
    }

    const id = match[1].trim();

    const esRaw = match[2] ?? match[3] ?? "";
    const enRaw = match[4] ?? match[5] ?? "";

    const es = esRaw.replace(/""/g, '"').trim();
    const en = enRaw.replace(/""/g, '"').trim();

    return [id, es, en];
}

async function loadSheet(sheetId) {
    const gid = GID_MAP[sheetId];
    const url = `${BASE_URL}${gid}`;
    const res = await fetch(url);
    const csv = await res.text();
    const lines = csv.trim().split('\n');

    if (lines.length < 4) return;

    const title = lines[0].split(',')[0].trim();

    const storyContainer = document.createElement('section');
    storyContainer.className = 'story';
    storyContainer.dataset.storyId = sheetId;
    storyContainer.style.display = 'none'; // скрыт по умолчанию

    const heading = document.createElement('h1');
    heading.textContent = title;
    storyContainer.appendChild(heading);

    for (let i = 3; i < lines.length; i++) {
        const line = lines[i].trim();
        const [id, es, en] = parseCsvLine(line);

        if (!id || !es || !en || es === '-error-') {
            continue;
        }

        const container = document.createElement('div');
        container.className = 'container-sentence sentence';

        const vertical = document.createElement('div');
        vertical.className = 'vertical-sentence';
        vertical.dataset.audio = `audio/${sheetId}/${id}.m4a`;

        const esP = document.createElement('p');
        esP.className = 'es';
        esP.textContent = es;

        const enP = document.createElement('p');
        enP.className = 'en';
        enP.textContent = en;

        vertical.appendChild(esP);
        vertical.appendChild(enP);

        const toggle = document.createElement('div');
        toggle.className = 'toggle';
        toggle.innerHTML = `
            <div class="labels">
                <span class="off">off</span>
                <span class="on">on</span>
            </div>
            <div class="handle">es</div>
        `;

        toggle.addEventListener('click', function () {
            const isActive = this.classList.toggle('active');

            if (isActive) {
                esP.classList.add('blurred');
                esP.style.setProperty('filter', 'blur(3px)', 'important');
            } else {
                esP.classList.remove('blurred');
                esP.style.setProperty('filter', 'none', 'important');
            }
        });

        container.appendChild(vertical);
        container.appendChild(toggle);
        storyContainer.appendChild(container);
    }

    document.querySelector('.content').appendChild(storyContainer);

    const menuBtn = document.createElement('div');
    menuBtn.className = 'menu-button';
    menuBtn.textContent = title;
    menuBtn.style.display = menuIsVisible ? 'block' : 'none';
    menuBtn.addEventListener('click', () => {
        document.querySelectorAll('.story').forEach(story => {
            story.style.display = 'none';
        });

        syncLocalTogglesToGlobal();
        storyContainer.style.display = 'flex';
        applyGlobalBlurToStory(storyContainer);

        if (window.innerWidth < 768) {
            menuIsVisible = true;
            toggleMenuButtons();
            window.scrollTo({top: 0, behavior: 'smooth'});

            const title = storyContainer.querySelector('h1');
            const innerMenuTitle = document.querySelector('.inner-menu-title');
            innerMenuTitle.textContent = menuBtn.textContent;
            title.textContent = '';
        }
    });
    document.querySelector('.menu').appendChild(menuBtn);

    return menuBtn;
}

function toggleMenuButtons() {
    const buttons = document.querySelectorAll('.menu-button');
    const menu = document.querySelector('.menu');

    menuIsVisible = !menuIsVisible;

    buttons.forEach(menuBtn => {
        let alreadyIsVisible = document.querySelector('.inner-menu-title').textContent === menuBtn.textContent;
        menuBtn.style.display = menuIsVisible && !alreadyIsVisible ? 'block' : 'none';
    });

    if (menu) {
        if (window.innerWidth >= 768) {
            menu.style.maxHeight = menuIsVisible ? '100vh' : '3.5rem';
            menu.style.height = menuIsVisible ? '100vh' : '100%';
        } else {
            menu.style.maxHeight = '';
            menu.style.height = '';
        }
    }
}

function syncLocalTogglesToGlobal() {
    document.querySelectorAll('.story').forEach(story => {
        story.querySelectorAll('.container-sentence').forEach(sentence => {
            const toggle = sentence.querySelector('.toggle');
            const esBlock = sentence.querySelector('.es');

            if (blurOn) {
                toggle.classList.add('active');
                esBlock.classList.add('blurred');
                esBlock.style.setProperty('filter', 'blur(3px)', 'important');
            } else {
                toggle.classList.remove('active');
                esBlock.classList.remove('blurred');
                esBlock.style.setProperty('filter', 'none', 'important');
            }
        });
    });
}

function applyGlobalBlurToStory(storyContainer) {
    storyContainer.querySelectorAll('.container-sentence').forEach(sentence => {
        const esBlock = sentence.querySelector('.es');
        if (blurOn) {
            esBlock.classList.add('blurred');
        } else {
            esBlock.classList.remove('blurred');
        }
    });
}
