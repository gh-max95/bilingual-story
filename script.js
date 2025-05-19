// div.dataset.audio = "audio/" + id + ".wav";
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSBiJoKZ5ZzdsyK1OXNNS3AvUx1e8d7N0c4RxXL8TQ8HQ2sgid-sTH5FdmXdMTkB_0Wl4_dfp7SJUAz/pub?output=csv';
// const CSV_URL = "3,\"Mientras me lavo, me miro en el espejo grande que tengo en el baño.\",\"While I'm washing up, I check myself out in the big mirror I’ve got in the bathroom.\"";
fetch(CSV_URL)
    .then(res => res.text())
    .then(csv => {
        const lines = csv.trim().split('\n');
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();

            // Первый элемент до первой запятой — ID
            const firstCommaIndex = line.indexOf(',');
            const id = line.slice(0, firstCommaIndex).trim();

            // Остальное — текст
            const rest = line.slice(firstCommaIndex + 1);

            // Делим по '","' в случае необходимости
            var parts = rest.split(',');
            if (parts.length > 3) {
                parts = rest.split('","');
                if (parts.length > 2) {
                    data.push([id, "-error-", "-error-"]);
                    continue;
                }
            }

            // Убираем обрамляющие кавычки, если есть
            const es = parts[0].replace(/^"/, '').replace(/"$/, '');
            const en = parts[1].replace(/^"/, '').replace(/"$/, '');

            data.push([id, es, en]);
        }

        const container = document.querySelector('.note-container');
        document.querySelectorAll('.sentence').forEach(e => e.remove());

        data.forEach(([id, es, en]) => {
            const div = document.createElement('div');
            div.className = 'sentence';
            div.dataset.audio = "audio/" + id + ".wav";

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

        document.querySelectorAll('.sentence').forEach(sentence => {
            sentence.addEventListener('click', () => {
                const audioSrc = sentence.dataset.audio;
                if (!audioSrc) return;

                const audio = new Audio(audioSrc);
                audio.play().catch(e => console.error('Ошибка воспроизведения:', e));
            });
        });
    })
    .catch(err => console.error('Ошибка загрузки CSV:', err));
