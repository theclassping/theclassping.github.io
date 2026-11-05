(() => {
  'use strict';
  const byId = (id) => document.getElementById(id);
  const previewButtons = [...document.querySelectorAll('[data-preview]')];
  const previewSlides = [...document.querySelectorAll('[data-preview-panel]')];
  const track = byId('device-track');
  const dots = [...document.querySelectorAll('.carousel-dots span')];
  const arrows = [...document.querySelectorAll('[data-slide]')];
  let currentSlide = 0;

  // Real product screenshots sit in a swipeable track; tabs, dots and arrows stay in sync with it.
  const syncPreview = (index) => {
    currentSlide = Math.max(0, Math.min(previewSlides.length - 1, index));
    previewButtons.forEach((item, i) => item.setAttribute('aria-selected', String(i === currentSlide)));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === currentSlide));
    arrows.forEach((arrow) => {
      const target = currentSlide + Number(arrow.dataset.slide);
      arrow.disabled = target < 0 || target >= previewSlides.length;
    });
  };
  const goToSlide = (index) => {
    const next = Math.max(0, Math.min(previewSlides.length - 1, index));
    track.scrollTo({ left: previewSlides[next].offsetLeft - track.offsetLeft, behavior: 'smooth' });
    syncPreview(next);
  };
  previewButtons.forEach((button, index) => button.addEventListener('click', () => goToSlide(index)));
  arrows.forEach((arrow) => arrow.addEventListener('click', () => goToSlide(currentSlide + Number(arrow.dataset.slide))));
  track.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); goToSlide(currentSlide + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); goToSlide(currentSlide - 1); }
  });
  let scrollTimer;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => syncPreview(Math.round(track.scrollLeft / track.clientWidth)), 80);
  }, { passive: true });
  syncPreview(0);

  const screenshotDialog = byId('screenshot-dialog');
  const dialogImage = byId('dialog-image');
  const dialogTitle = byId('dialog-title');
  document.querySelectorAll('[data-enlarge]').forEach((button) => {
    button.addEventListener('click', () => {
      const sourceImage = button.querySelector('img');
      dialogImage.src = sourceImage.currentSrc || sourceImage.src;
      dialogImage.alt = sourceImage.alt;
      dialogImage.width = sourceImage.naturalWidth;
      dialogImage.height = sourceImage.naturalHeight;
      dialogTitle.textContent = button.dataset.enlarge;
      screenshotDialog.showModal();
      screenshotDialog.scrollTop = 0;
      document.body.classList.add('modal-open');
    });
  });
  byId('dialog-close').addEventListener('click', () => screenshotDialog.close());
  screenshotDialog.addEventListener('click', (event) => {
    if (event.target !== screenshotDialog) return;
    const bounds = screenshotDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      screenshotDialog.close();
    }
  });
  screenshotDialog.addEventListener('close', () => document.body.classList.remove('modal-open'));

  const scenarioButtons = [...document.querySelectorAll('[data-scenario]')];
  const scenarios = [...document.querySelectorAll('[data-scenario-panel]')];
  scenarioButtons.forEach((button) => {
    button.addEventListener('click', () => {
      scenarioButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      scenarios.forEach((panel) => { panel.hidden = panel.dataset.scenarioPanel !== button.dataset.scenario; });
    });
  });

  const initialNote = 'Alya mencoba membentuk bola dari clay dan bangga menunjukkan hasilnya kepada guru.';
  const activityNote = byId('activity-note');
  const activityStatus = byId('activity-status');
  const parentPlaceholder = byId('parent-placeholder');
  const parentActivity = byId('parent-activity');
  byId('share-activity').addEventListener('click', () => {
    if (!activityNote.value.trim()) {
      activityNote.setCustomValidity('Isi catatan untuk Alya sebelum membagikan laporan.');
      activityNote.reportValidity();
      activityNote.focus();
      return;
    }
    activityNote.setCustomValidity('');
    byId('parent-note').textContent = activityNote.value.trim();
    parentPlaceholder.hidden = true;
    parentActivity.hidden = false;
    activityStatus.textContent = 'Laporan dibagikan. Wali Alya kini dapat membacanya di portal.';
    if (window.matchMedia('(max-width: 720px)').matches) {
      parentActivity.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  });
  activityNote.addEventListener('input', () => {
    activityNote.setCustomValidity('');
    activityStatus.textContent = '';
  });

  let paymentStep = 0;
  const paymentStates = ['Belum dibayar', 'Menunggu verifikasi', 'Lunas'];
  const paymentMessages = [
    'Orang tua membayar lewat transfer bank, lalu mengunggah bukti bayar ke portal.',
    'Bukti bayar sudah masuk. Staf sekolah memeriksa transfer sebelum mengonfirmasi pembayaran.',
    'Pembayaran terverifikasi. Orang tua dapat mengunduh bukti pembayaran dari portal.'
  ];
  const paymentLabels = ['Simulasikan unggah bukti bayar', 'Verifikasi sebagai staf sekolah'];
  const paymentAction = byId('payment-action');
  function renderPayment() {
    const state = ['unpaid', 'submitted', 'paid'][paymentStep];
    document.querySelectorAll('[data-payment-badge]').forEach((badge) => {
      badge.textContent = paymentStates[paymentStep];
      badge.dataset.state = state;
    });
    byId('payment-message').textContent = paymentMessages[paymentStep];
    byId('payment-role').textContent = paymentStep === 0 ? 'Langkah berikutnya · orang tua' : paymentStep === 1 ? 'Langkah berikutnya · staf sekolah' : 'Selesai · sekolah dan orang tua';
    paymentAction.hidden = paymentStep === 2;
    paymentAction.textContent = paymentLabels[paymentStep] || '';
    byId('payment-proof').hidden = paymentStep !== 1;
    byId('payment-receipt').hidden = paymentStep !== 2;
    byId('payment-parent-note').textContent = paymentStep === 0 ? 'Tagihan dan informasi pembayaran tersedia di portal.' : paymentStep === 1 ? 'Bukti bayar telah dikirim. Tagihan belum berstatus lunas sampai diperiksa sekolah.' : 'Status tagihan sudah lunas setelah dikonfirmasi oleh sekolah.';
    document.querySelectorAll('[data-payment-step]').forEach((item, index) => {
      item.classList.toggle('is-current', index === paymentStep);
      if (index === paymentStep) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
  }
  paymentAction.addEventListener('click', () => {
    paymentStep = Math.min(paymentStep + 1, 2);
    renderPayment();
  });
  byId('demo-reset').addEventListener('click', () => {
    activityNote.value = initialNote;
    activityNote.setCustomValidity('');
    activityStatus.textContent = '';
    parentPlaceholder.hidden = false;
    parentActivity.hidden = true;
    paymentStep = 0;
    renderPayment();
  });
  renderPayment();

  document.addEventListener('click', (event) => {
    const login = document.querySelector('.login');
    if (login.open && !login.contains(event.target)) login.open = false;
  });

  // The existing contact destination is retained. The local demo never submits data.
  const contactForm = byId('jadwalkan-demo');
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;
    const status = contactForm.querySelector('[role="status"]');
    const submitButton = contactForm.querySelector('[type="submit"]');
    const payload = Object.fromEntries(new FormData(contactForm));
    payload._replyto = payload.email;
    status.textContent = 'Mengirim permintaan jadwal…';
    submitButton.disabled = true;
    try {
      const response = await fetch('https://formsubmit.co/ajax/the.class.ping@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Contact request failed');
      const result = await response.json();
      if (result.success !== true && result.success !== 'true') throw new Error('Contact request was not accepted');
      status.textContent = 'Terima kasih! Tim Classping akan menghubungi Anda lewat email dalam 1 hari kerja untuk mencocokkan jadwal demo.';
      contactForm.reset();
    } catch {
      status.textContent = 'Permintaan belum terkirim. Silakan coba lagi atau atur jadwal lewat WhatsApp di bawah.';
    } finally {
      submitButton.disabled = false;
    }
  });
})();
