document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'calendar-2026-programs';
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const monthYear = document.getElementById('month-year');
  const daysEl = document.getElementById('days');
  const listEl = document.getElementById('program-list');
  const form = document.getElementById('program-form');
  const titleInput = document.getElementById('title');
  const timeInput = document.getElementById('time');

  const today = new Date();
  let viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let selected = toKey(today);
  let programs = load();

  /* ---------- helpers ---------- */
  function toKey(d) {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function fromKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
    } catch (e) { /* storage unavailable: programs last until the page closes */ }
  }

  function programsOn(key) {
    return programs
      .filter(p => p.date === key)
      .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
  }

  function formatTime(t) {
    if (!t) return 'All day';
    const [h, m] = t.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
  }

  /* ---------- calendar grid ---------- */
  function renderCalendar() {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();

    monthYear.textContent = `${MONTHS[month]} ${year}`;
    daysEl.innerHTML = '';

    // Always draw 6 weeks so the card keeps the same height
    for (let i = 0; i < 42; i++) {
      const date = new Date(year, month, 1 - firstWeekday + i);
      const key = toKey(date);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'day';
      btn.dataset.key = key;
      btn.textContent = date.getDate();

      if (date.getMonth() !== month) btn.classList.add('fade');
      if (key === toKey(today)) btn.classList.add('today');
      if (key === selected) btn.classList.add('selected');

      const items = programsOn(key);
      if (items.length) {
        const dots = document.createElement('span');
        dots.className = 'dots';
        items.slice(0, 3).forEach(p => {
          const dot = document.createElement('i');
          dot.style.setProperty('--c', p.color);
          dots.appendChild(dot);
        });
        btn.appendChild(dots);
      }

      btn.setAttribute('aria-label',
        `${date.getDate()} ${MONTHS[date.getMonth()]}, ${items.length} programs`);
      daysEl.appendChild(btn);
    }
  }

  /* ---------- side panel ---------- */
  function renderPanel() {
    const date = fromKey(selected);
    document.getElementById('selected-weekday').textContent = WEEKDAYS[date.getDay()];
    document.getElementById('selected-date').textContent =
      `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

    listEl.innerHTML = '';
    const items = programsOn(selected);

    if (!items.length) {
      const empty = document.createElement('li');
      empty.className = 'empty';
      empty.textContent = 'No programs on this day. Add one below.';
      listEl.appendChild(empty);
      return;
    }

    items.forEach(p => {
      const li = document.createElement('li');
      li.className = 'program';
      li.style.setProperty('--c', p.color);

      const bar = document.createElement('span');
      bar.className = 'bar';

      const text = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = p.title;
      const time = document.createElement('small');
      time.textContent = formatTime(p.time);
      text.append(title, time);

      const del = document.createElement('button');
      del.type = 'button';
      del.textContent = '\u00d7';
      del.setAttribute('aria-label', `Delete ${p.title}`);
      del.addEventListener('click', () => {
        programs = programs.filter(x => x.id !== p.id);
        save();
        render();
      });

      li.append(bar, text, del);
      listEl.appendChild(li);
    });
  }

  function render() {
    renderCalendar();
    renderPanel();
  }

  /* ---------- events ---------- */
  daysEl.addEventListener('click', e => {
    const btn = e.target.closest('.day');
    if (!btn) return;
    selected = btn.dataset.key;
    const d = fromKey(selected);
    viewDate = new Date(d.getFullYear(), d.getMonth(), 1);
    render();
  });

  document.getElementById('prev').addEventListener('click', () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    renderCalendar();
  });

  document.getElementById('next').addEventListener('click', () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    renderCalendar();
  });

  document.getElementById('today-btn').addEventListener('click', () => {
    selected = toKey(today);
    viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
    render();
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) return;

    programs.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title,
      date: selected,
      time: timeInput.value,
      color: form.elements.color.value
    });
    save();
    form.reset();
    render();
    titleInput.focus();
  });

  render();
});