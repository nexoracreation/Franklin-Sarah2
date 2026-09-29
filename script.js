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

// ─── Curtain Intro & Background Song Controller ───
const introCurtain = document.querySelector('#intro-curtain');
const openInvitationBtn = document.querySelector('#open-invitation-btn');
const bgAudio = document.querySelector('#bg-audio');
let hasOpened = false;

function openInvitation() {
  if (hasOpened) return;
  hasOpened = true;

  // Split curtain into two halves
  if (introCurtain) {
    introCurtain.classList.add('is-open');
  }
  document.body.classList.remove('intro-locked');

  // Play song from the beginning
  if (bgAudio) {
    bgAudio.currentTime = 0;
    bgAudio.play().then(() => {
      if (soundButton) {
        soundButton.classList.add('is-playing');
        soundButton.setAttribute('aria-pressed', 'true');
        soundButton.innerHTML = '<span class="sound-icon">⏸</span> pause song';
      }
    }).catch(err => {
      console.warn('Audio playback failed or was blocked:', err);
    });
  }

  // Remove curtain from DOM tree flow after animation finishes
  window.setTimeout(() => {
    if (introCurtain) {
      introCurtain.style.display = 'none';
    }
  }, 1400);
}

if (openInvitationBtn) {
  openInvitationBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openInvitation();
  });
}

if (introCurtain) {
  introCurtain.addEventListener('click', () => {
    openInvitation();
  });
}

if (soundButton && bgAudio) {
  soundButton.addEventListener('click', async () => {
    try {
      if (bgAudio.paused) {
        await bgAudio.play();
        soundButton.classList.add('is-playing');
        soundButton.setAttribute('aria-pressed', 'true');
        soundButton.innerHTML = '<span class="sound-icon">⏸</span> pause song';
      } else {
        bgAudio.pause();
        soundButton.classList.remove('is-playing');
        soundButton.setAttribute('aria-pressed', 'false');
        soundButton.innerHTML = '<span class="sound-icon">♪</span> play song';
      }
    } catch (error) {
      console.warn('Audio toggle failed:', error);
    }
  });

  bgAudio.addEventListener('ended', () => {
    soundButton.classList.remove('is-playing');
    soundButton.setAttribute('aria-pressed', 'false');
    soundButton.innerHTML = '<span class="sound-icon">♪</span> play song';
  });
}
