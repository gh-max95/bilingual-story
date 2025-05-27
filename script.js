const SHEET_IDS = ['1', '2'];

const BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSBiJoKZ5ZzdsyK1OXNNS3AvUx1e8d7N0c4RxXL8TQ8HQ2sgid-sTH5FdmXdMTkB_0Wl4_dfp7SJUAz/pub?output=csv&gid=';

const GID_MAP = {
    '1': '0',
    '2': '1876475411',
};

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

        if (!id || !es || !en || es === '-error-') continue;

        const div = document.createElement('div');
        div.className = 'sentence';
        div.dataset.audio = `audio/${sheetId}/${id}.m4a`;

        const esP = document.createElement('p');
        esP.className = 'es';
        esP.textContent = es;

        const enP = document.createElement('p');
        enP.className = 'en';
        enP.textContent = en;

        div.appendChild(esP);
        div.appendChild(enP);
        storyContainer.appendChild(div);
    }

    document.querySelector('.content').appendChild(storyContainer);

    const menuBtn = document.createElement('div');
    menuBtn.className = 'menu-button';
    menuBtn.textContent = title;
    menuBtn.addEventListener('click', () => {
        document.querySelectorAll('.story').forEach(story => {
            story.style.display = 'none';
        });
        storyContainer.style.display = 'block';

        if (window.innerWidth < 768) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    document.querySelector('.menu').appendChild(menuBtn);
}

(async function init() {
    for (let sheetId of SHEET_IDS) {
        await loadSheet(sheetId);
    }

    let currentAudio = null;

    document.querySelector('.content').addEventListener('click', (e) => {
        const sentence = e.target.closest('.sentence');
        if (!sentence) return;

        const audioSrc = sentence.dataset.audio;
        if (!audioSrc) return;

        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }

        currentAudio = new Audio(audioSrc);
        currentAudio.play().catch(e => console.error('Ошибка воспроизведения:', e));
    });
})();

