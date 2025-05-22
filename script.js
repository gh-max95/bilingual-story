// div.dataset.audio = "audio/" + id + ".m4a";
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSBiJoKZ5ZzdsyK1OXNNS3AvUx1e8d7N0c4RxXL8TQ8HQ2sgid-sTH5FdmXdMTkB_0Wl4_dfp7SJUAz/pub?output=csv';
// const CSV_URL = "3,\"Mientras me lavo, me miro en el espejo grande que tengo en el baño.\",\"While I'm washing up, I check myself out in the big mirror I’ve got in the bathroom.\"";
fetch(CSV_URL)
    .then(res => res.text())
    .then(csv => {
        const lines = csv.trim().split('\n');
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();

            const firstCommaIndex = line.indexOf(',');
            const id = line.slice(0, firstCommaIndex).trim();

            const rest = line.slice(firstCommaIndex + 1);

            var parts = rest.split(',');
            if (parts.length > 3) {
                parts = rest.split('","');
                if (parts.length > 2) {
                    data.push([id, "-error-", "-error-"]);
                    continue;
                }
            }

            const es = parts[0].replace(/^"/, '').replace(/"$/, '');
            const en = parts[1].replace(/^"/, '').replace(/"$/, '');

            data.push([id, es, en]);
        }

        const container = document.querySelector('.note-container');
        document.querySelectorAll('.sentence').forEach(e => e.remove());

        data.forEach(([id, es, en]) => {
            const div = document.createElement('div');
            div.className = 'sentence';
            div.dataset.audio = "audio/" + id + ".m4a";

            const esP = document.createElement('p');
            esP.className = 'es';
            esP.textContent = es;

            const enP = document.createElement('p');
            enP.className = 'en';
            enP.textContent = en;

            div.appendChild(esP);
            div.appendChild(enP);
            container.appendChild(div);
        });

        let currentAudio = null; // Глобальная переменная для хранения текущего аудио

        document.querySelectorAll('.sentence').forEach(sentence => {
            sentence.addEventListener('click', () => {
                const audioSrc = sentence.dataset.audio;
                if (!audioSrc) return;

                // Если уже воспроизводится аудио, остановим его
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                }

                // Создаем и воспроизводим новое аудио
                currentAudio = new Audio(audioSrc);
                currentAudio.play().catch(e => console.error('Ошибка воспроизведения:', e));
            });
        });
    })
    .catch(err => console.error('Ошибка загрузки CSV:', err));
