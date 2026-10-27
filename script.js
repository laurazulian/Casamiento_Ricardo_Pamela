(() => {
  'use strict';

  /* ===== Datos editables ===== */
  const EVENTO = {
    titulo: 'Casamiento de Ricardo y Pamela',
    lugar: 'Salón Viaurelia, calle Cerro Aconcagua (ingreso por Las Leñas, salón de atrás)',
    inicio: '2026-12-19T20:00:00-03:00',
    duracionHoras: 6,
    mapa: 'https://maps.app.goo.gl/2tn3uaZNBMukumnV7'
  };
  const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxL7fGxeLxQcgRjNUB7bHCOvwc1w62vmPSB2TeEKw6r_lY7TvRIF8H4FyYcrkkRkYdK/exec';   // ← pegá acá la URL de la aplicación web de Apps Script (termina en /exec)
  const LIMITE_RSVP = '2026-11-22T23:59:59-03:00';

  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, '0');

  /* ===== Cuenta regresiva ===== */
  const meta = new Date(EVENTO.inicio).getTime();
  function tick() {
    const d = Math.max(0, meta - Date.now());
    $('cd-d').textContent = pad(Math.floor(d / 864e5));
    $('cd-h').textContent = pad(Math.floor(d % 864e5 / 36e5));
    $('cd-m').textContent = pad(Math.floor(d % 36e5 / 6e4));
    $('cd-s').textContent = pad(Math.floor(d % 6e4 / 1e3));
  }
  tick();
  setInterval(tick, 1000);

  /* ===== Datos bancarios ===== */
  const toggle = $('toggle-bank'), bank = $('bank');
  toggle.addEventListener('click', () => {
    const open = bank.hidden;
    bank.hidden = !open;
    toggle.setAttribute('aria-expanded', open);
    toggle.textContent = open ? 'Ocultar datos bancarios' : 'Ver datos bancarios';
  });
  bank.addEventListener('click', async (e) => {
    const btn = e.target.closest('.copy');
    if (!btn) return;
    const texto = btn.previousElementSibling.textContent.trim();
    try { await navigator.clipboard.writeText(texto); } catch {
      const t = document.createElement('textarea'); t.value = texto; document.body.append(t); t.select();
      document.execCommand('copy'); t.remove();
    }
    btn.textContent = 'Copiado'; btn.classList.add('ok');
    setTimeout(() => { btn.textContent = 'Copiar'; btn.classList.remove('ok'); }, 1800);
  });

  /* ===== Confirmación de asistencia (se guarda en Google Sheets) ===== */
  const form = $('rsvp-form'), extra = $('extra'), err = $('form-error'), send = $('send');
  form.addEventListener('change', () => { extra.hidden = form.asiste.value === 'No'; });

  if (Date.now() > new Date(LIMITE_RSVP).getTime()) {
    $('rsvp-note').textContent = 'El plazo de confirmación (22/11) ya terminó. Consultanos si todavía podés sumarte.';
  }

  const showError = (t) => { err.textContent = t; err.hidden = false; };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = form.nombre.value.trim();
    if (!nombre) { showError('Escribí tu nombre y apellido para poder confirmar.'); form.nombre.focus(); return; }
    if (!SHEETS_URL) { showError('El formulario todavía no está conectado. Avisanos por mensaje.'); return; }
    err.hidden = true;
    const va = form.asiste.value === 'Sí';
    const datos = new URLSearchParams({
      nombre,
      asiste: form.asiste.value,
      cantidad: va ? form.cantidad.value : '0',
      comida: va ? (form.comida.value.trim() || 'Ninguna') : ''
    });
    send.disabled = true; send.textContent = 'Enviando…';
    try {
      await fetch(SHEETS_URL, { method: 'POST', mode: 'no-cors', body: datos });
      form.hidden = true; $('rsvp-note').hidden = true; $('rsvp-ok').hidden = false;
    } catch {
      showError('No pudimos enviar tu respuesta. Revisá tu conexión y probá de nuevo.');
      send.disabled = false; send.textContent = 'Enviar confirmación';
    }
  });

  /* ===== Aparición suave de secciones al hacer scroll ===== */
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-anim');
    const io = new IntersectionObserver((es) => es.forEach((x) => {
      if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); }
    }), { threshold: .15 });
    items.forEach((i) => io.observe(i));
  }

  /* ===== Agendar evento ===== */
  const ini = new Date(EVENTO.inicio), fin = new Date(ini.getTime() + EVENTO.duracionHoras * 36e5);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  $('gcal').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    + `&text=${encodeURIComponent(EVENTO.titulo)}`
    + `&dates=${fmt(ini)}/${fmt(fin)}`
    + `&location=${encodeURIComponent(EVENTO.lugar)}`
    + `&details=${encodeURIComponent('Cómo llegar: ' + EVENTO.mapa)}`;

  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Invitacion//ES', 'BEGIN:VEVENT',
    `UID:boda-ricardo-pamela-2026@invitacion`, `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(ini)}`, `DTEND:${fmt(fin)}`, `SUMMARY:${EVENTO.titulo}`,
    `LOCATION:${EVENTO.lugar}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const link = $('ics');
  link.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  link.download = 'casamiento-ricardo-pamela.ics';
})();
