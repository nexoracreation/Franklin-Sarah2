// Sarah's Soirée RSVP script
const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxiYIbqZd_pPXDrj14YBv-uCFpKssUoSOzhf4TJiHugDZnWsfcxBIE5VkmhIazXVdqA/exec';

const form = document.querySelector('#rsvp-form');
const message = document.querySelector('.form-message');
const soundButton = document.querySelector('.sound-toggle');
const guestCountWrap = document.querySelector('#guest-count-wrap');
const guestCountInput = form ? form.elements.guestCount : null;
const submitButton = form ? form.querySelector('.submit') : null;

function updateGuestCountField() {
  if (!form || !guestCountWrap || !guestCountInput) return;
  const isAttending = form.elements.attendance.value === 'attending';
  guestCountWrap.hidden = !isAttending;
  guestCountInput.required = isAttending;
  guestCountInput.disabled = !isAttending;
  if (!isAttending) guestCountInput.value = '';
}

if (form) {
  form.addEventListener('change', updateGuestCountField);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = data.get('name').trim();
    const phone = data.get('phone').trim();
    const isAttending = data.get('attendance') === 'attending';
    const guestCount = isAttending ? Number(data.get('guestCount')) : 0;
    const response = {
      name,
      phone,
      attending: isAttending ? 'yes' : 'no',
      attendance: isAttending ? 'attending' : 'declining',
      guestCount,
      source: 'sangeet-wedding-site',
      message: '',
      submittedAt: new Date().toISOString(),
    };

    submitButton.disabled = true;
    message.textContent = 'Sending your RSVP…';

    try {
      if (GOOGLE_SHEETS_WEB_APP_URL && isAttending) {
        await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(response),
        });
      }

      message.textContent = isAttending
        ? `Yesss, ${name}! We saved space for ${guestCount} on the guest list. See you on the dance floor! ♥`
        : `Thanks for letting us know, ${name}. Sending love right back. ♥`;
      form.reset();
      updateGuestCountField();
    } catch (error) {
      message.textContent = 'Your RSVP could not be sent just now. Please try again.';
    } finally {
      submitButton.disabled = false;
    }
  });
}

// Optional ambient sound generator
let audioContext;
let isAudioPlaying = false;
let ambientGain;

function initAudio() {
  if (audioContext) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  audioContext = new AudioCtx();
  ambientGain = audioContext.createGain();
  ambientGain.gain.value = 0.05;
  ambientGain.connect(audioContext.destination);

  // Soft warm chord pad
  const frequencies = [261.63, 329.63, 392.00, 523.25]; // C major warm chord
  frequencies.forEach(freq => {
    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(ambientGain);
    osc.start();
  });
}

if (soundButton) {
  soundButton.addEventListener('click', () => {
    if (!audioContext) {
      initAudio();
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    isAudioPlaying = !isAudioPlaying;
    if (ambientGain) {
      ambientGain.gain.setTargetAtTime(isAudioPlaying ? 0.04 : 0.0001, audioContext.currentTime, 0.1);
    }
    soundButton.setAttribute('aria-pressed', String(isAudioPlaying));
    soundButton.innerHTML = isAudioPlaying
      ? '<span class="sound-icon">♪</span> vibes activated'
      : '<span class="sound-icon">♪</span> good vibes only';
  });
}
