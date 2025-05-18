document.querySelectorAll('.sentence').forEach(sentence => {
    sentence.addEventListener('click', () => {
        const audioSrc = sentence.dataset.audio;
        if (!audioSrc) return;

        const audio = new Audio(audioSrc);
        audio.play().catch(e => console.error('Playback error:', e));
    });
});