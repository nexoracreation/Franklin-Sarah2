// When your Google Apps Script is deployed, paste its /exec URL between the quotes.
// Until then, the RSVP still gives guests an on-page confirmation.
const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxiYIbqZd_pPXDrj14YBv-uCFpKssUoSOzhf4TJiHugDZnWsfcxBIE5VkmhIazXVdqA/exec';

const form = document.querySelector('#rsvp-form');
const message = document.querySelector('.form-message');
const soundButton = document.querySelector('.sound-toggle');
const guestCountWrap = document.querySelector('#guest-count-wrap');
const guestCountInput = form.elements.guestCount;
const submitButton = form.querySelector('.submit');

function updateGuestCountField() {
  const isAttending = form.elements.attendance.value === 'attending';
  guestCountWrap.hidden = !isAttending;
  guestCountInput.required = isAttending;
  guestCountInput.disabled = !isAttending;
  if (!isAttending) guestCountInput.value = '';
}

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
      ? `Yesss, ${name}! We saved space for ${guestCount} on the Sangeet guest list. ♥`
      : `Thanks for letting us know, ${name}. Sending love right back. ♥`;
    form.reset();
    updateGuestCountField();
  } catch (error) {
    message.textContent = 'Your RSVP could not be sent just now. Please try again.';
  } finally {
    submitButton.disabled = false;
  }
});

soundButton.addEventListener('click', () => {
  const isOn = soundButton.getAttribute('aria-pressed') === 'true';
  soundButton.setAttribute('aria-pressed', String(!isOn));
  soundButton.innerHTML = isOn
    ? '<span class="sound-icon">♪</span> good vibes'
    : '<span class="sound-icon">✦</span> vibes activated';
});

const scratchCard = document.querySelector('#scratch-card');
const scratchCanvas = document.querySelector('#scratch-canvas');

if (scratchCard && scratchCanvas) {
  const scratchPrompt = document.querySelector('#scratch-prompt');
  const scrollKeys = new Set([' ', 'ArrowDown', 'PageDown', 'End', 'ArrowUp', 'PageUp', 'Home']);
  let scratchContext;
  let scratchBounds;
  let isScratching = false;
  let lastPoint;
  let isUnlocked = false;
  let autoRevealTimer;

  function drawScratchLayer() {
    scratchBounds = scratchCanvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    scratchCanvas.width = Math.round(scratchBounds.width * scale);
    scratchCanvas.height = Math.round(scratchBounds.height * scale);
    scratchContext = scratchCanvas.getContext('2d', { willReadFrequently: true });
    scratchContext.scale(scale, scale);

    const cover = scratchContext.createLinearGradient(0, 0, scratchBounds.width, scratchBounds.height);
    cover.addColorStop(0, '#24233a');
    cover.addColorStop(.5, '#171629');
    cover.addColorStop(1, '#0e0d1c');
    scratchContext.fillStyle = cover;
    scratchContext.fillRect(0, 0, scratchBounds.width, scratchBounds.height);

    scratchContext.strokeStyle = 'rgba(244, 192, 85, .3)';
    scratchContext.lineWidth = 1.8;
    const gap = Math.max(25, scratchBounds.width / 12);
    for (let offset = -scratchBounds.height; offset < scratchBounds.width * 1.5; offset += gap) {
      scratchContext.beginPath();
      scratchContext.moveTo(offset, 0);
      scratchContext.lineTo(offset + scratchBounds.height * .35, scratchBounds.height);
      scratchContext.stroke();
      scratchContext.beginPath();
      scratchContext.moveTo(offset, scratchBounds.height);
      scratchContext.lineTo(offset + scratchBounds.height * .35, 0);
      scratchContext.stroke();
    }

    const shine = scratchContext.createRadialGradient(
      scratchBounds.width * .32,
      scratchBounds.height * .28,
      5,
      scratchBounds.width * .32,
      scratchBounds.height * .28,
      scratchBounds.width * .24,
    );
    shine.addColorStop(0, 'rgba(255,255,255,.7)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    scratchContext.fillStyle = shine;
    scratchContext.fillRect(0, 0, scratchBounds.width, scratchBounds.height);
  }

  function pointFromEvent(event) {
    return { x: event.clientX - scratchBounds.left, y: event.clientY - scratchBounds.top };
  }

  function scratch(event) {
    const point = pointFromEvent(event);
    const brush = Math.max(28, scratchBounds.width * .075);
    scratchContext.globalCompositeOperation = 'destination-out';
    scratchContext.lineCap = 'round';
    scratchContext.lineJoin = 'round';
    scratchContext.lineWidth = brush;
    scratchContext.beginPath();
    scratchContext.moveTo(lastPoint?.x ?? point.x, lastPoint?.y ?? point.y);
    scratchContext.lineTo(point.x, point.y);
    scratchContext.stroke();
    lastPoint = point;
    checkScratchProgress();
  }

  function checkScratchProgress() {
    const pixels = scratchContext.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height).data;
    let checked = 0;
    let erased = 0;
    for (let index = 3; index < pixels.length; index += 112) {
      checked += 1;
      if (pixels[index] < 80) erased += 1;
    }
    if (erased / checked > .32) unlockInvitation();
  }

  function showScrollReminder() {
    scratchCard.classList.remove('is-warning');
    void scratchCard.offsetWidth;
    scratchCard.classList.add('is-warning');
    if (scratchPrompt) scratchPrompt.innerHTML = 'SCRATCH TO UNLOCK <span>✦</span>';
  }

  function blockScrollAttempt(event) {
    if (isUnlocked || event.target === scratchCanvas) return;
    event.preventDefault();
    showScrollReminder();
  }

  function blockKeyScroll(event) {
    if (!isUnlocked && scrollKeys.has(event.key)) {
      event.preventDefault();
      showScrollReminder();
    }
  }

  function keepInvitationAtTop() {
    if (!isUnlocked) window.scrollTo(0, 0);
  }

  function unlockInvitation() {
    if (isUnlocked) return;
    isUnlocked = true;
    isScratching = false;
    window.clearTimeout(autoRevealTimer);
    scratchCard.classList.add('is-complete');
    document.body.classList.remove('invite-locked');
    document.removeEventListener('wheel', blockScrollAttempt);
    document.removeEventListener('touchmove', blockScrollAttempt);
    document.removeEventListener('keydown', blockKeyScroll);
    window.removeEventListener('scroll', keepInvitationAtTop);
    scratchCanvas.setAttribute('aria-label', 'Wedding date revealed: 27 December 2026. The invitation is unlocked.');
    const scrollCue = document.querySelector('#scroll-cue');
    if (scrollCue) {
      scrollCue.href = '#details';
      scrollCue.querySelector('span').textContent = 'SCROLL FOR THE DEETS';
      scrollCue.querySelector('b').textContent = '↓';
    }
  }

  scratchCanvas.addEventListener('pointerdown', (event) => {
    if (isUnlocked) return;
    isScratching = true;
    lastPoint = undefined;
    scratchCard.classList.add('is-scratching');
    scratchCanvas.setPointerCapture(event.pointerId);
    scratch(event);
    if (!autoRevealTimer) {
      autoRevealTimer = window.setTimeout(unlockInvitation, 1500);
    }
  });

  scratchCanvas.addEventListener('pointermove', (event) => {
    if (isScratching && !isUnlocked) scratch(event);
  });

  scratchCanvas.addEventListener('pointerup', () => {
    isScratching = false;
    lastPoint = undefined;
  });

  scratchCanvas.addEventListener('pointercancel', () => {
    isScratching = false;
    lastPoint = undefined;
  });

  document.body.classList.add('invite-locked');
  document.addEventListener('wheel', blockScrollAttempt, { passive: false });
  document.addEventListener('touchmove', blockScrollAttempt, { passive: false });
  document.addEventListener('keydown', blockKeyScroll);
  window.addEventListener('scroll', keepInvitationAtTop, { passive: true });
  window.addEventListener('resize', () => {
    if (!isUnlocked) drawScratchLayer();
  });
  drawScratchLayer();
  requestAnimationFrame(() => requestAnimationFrame(keepInvitationAtTop));
}
