// Dynamic temperature and forecast script
(() => {
  const forecastEl = document.getElementById('forecast');
  const currentEl = document.getElementById('currentTemp');
  const realFeelEl = document.getElementById('realFeel');
  const statusEl = document.getElementById('statusIndicator');
  const adviceEl = document.getElementById('advice');
  const locationSelect = document.getElementById('locationSelect');

  function seededRandom(seed) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    }
    return function () {
      h += 0x6D2B79F5;
      let t = Math.imul(h ^ (h >>> 15), 1 | h);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function generateTemps(location) {
    const seed = (location || 'Jalgaon') + new Date().toDateString();
    const rnd = seededRandom(seed);
    // produce 15-day temps, typical summer range
    const temps = [];
    let base = 36 + Math.round(rnd() * 6); // base between 36-42
    for (let i = 0; i < 15; i++) {
      // small day-to-day variation
      base += Math.round((rnd() - 0.5) * 3);
      const t = Math.max(30, Math.min(46, base + Math.round((rnd() - 0.5) * 3)));
      temps.push(t);
    }
    return temps;
  }

  function dayLabel(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }

  function renderForecast(temps) {
    forecastEl.innerHTML = '';
    const min = Math.min(...temps, 30);
    const max = Math.max(...temps, 40);
    for (let i = 0; i < temps.length; i++) {
      const t = temps[i];
      const col = document.createElement('div');
      col.className = 'day-col';

      const tempLabel = document.createElement('div');
      tempLabel.className = 'temp-label';
      tempLabel.textContent = t + '°C';

      const bar = document.createElement('div');
      bar.className = 'bar';

      const fill = document.createElement('div');
      fill.className = 'bar-fill';
      // map t to height within bar (min->8% max->100%)
      const pct = Math.round(((t - 28) / (48 - 28)) * 100);
      fill.style.height = Math.max(6, Math.min(100, pct)) + '%';
      // color by thresholds
      if (t >= 41) {
        fill.style.background = 'linear-gradient(180deg,#ff9aa3,#f25c64)';
      } else if (t >= 38) {
        fill.style.background = 'linear-gradient(180deg,#ffd06b,#f6b042)';
      } else {
        fill.style.background = 'linear-gradient(180deg,#6ee7a9,#16c172)';
      }

      bar.appendChild(fill);

      const dayName = document.createElement('div');
      dayName.className = 'day-name';
      dayName.textContent = dayLabel(i);

      col.appendChild(tempLabel);
      col.appendChild(bar);
      col.appendChild(dayName);
      forecastEl.appendChild(col);
    }
  }

  function updateStatus(current) {
    // set indicator color and advice
    if (current >= 41) {
      statusEl.style.background = 'linear-gradient(180deg,#ff9aa3,#f25c64)';
      adviceEl.textContent = 'Next days unsafe for spraying. Plan irrigation today.';
    } else if (current >= 38) {
      statusEl.style.background = 'linear-gradient(180deg,#ffd06b,#f6b042)';
      adviceEl.textContent = 'Caution: high temperatures — avoid spraying in hottest hours.';
    } else {
      statusEl.style.background = 'linear-gradient(180deg,#6ee7a9,#16c172)';
      adviceEl.textContent = '';
    }
  }

  function setCurrent(temp) {
    currentEl.textContent = Math.round(temp) + '°C';
    // real feel: temp +/- up to 3 degrees
    const real = Math.round(temp + (Math.random() - 0.4) * 3);
    realFeelEl.textContent = real + '°C';
    updateStatus(temp);
  }

  // initial render
  let temps = generateTemps(locationSelect.value);
  renderForecast(temps);
  setCurrent(temps[0]);

  // small dynamic fluctuation for "live" current temperature
  setInterval(() => {
    // change the current day value by a small random amount
    const delta = (Math.random() - 0.5) * 1.2; // -0.6 .. +0.6
    temps[0] = Math.max(28, Math.min(48, temps[0] + delta));
    // also slightly nudge tomorrow forward/back
    if (Math.random() > 0.6) {
      temps[1] = Math.max(28, Math.min(48, temps[1] + (Math.random() - 0.5) * 1.2));
    }
    // update UI
    setCurrent(temps[0]);
    // update only first bar height/text for smoothness
    const firstCol = forecastEl.querySelector('.day-col');
    if (firstCol) {
      const firstTempLabel = firstCol.querySelector('.temp-label');
      const fill = firstCol.querySelector('.bar-fill');
      firstTempLabel.textContent = Math.round(temps[0]) + '°C';
      const pct = Math.round(((temps[0] - 28) / (48 - 28)) * 100);
      fill.style.height = Math.max(6, Math.min(100, pct)) + '%';
      if (temps[0] >= 41) fill.style.background = 'linear-gradient(180deg,#ff9aa3,#f25c64)';
      else if (temps[0] >= 38) fill.style.background = 'linear-gradient(180deg,#ffd06b,#f6b042)';
      else fill.style.background = 'linear-gradient(180deg,#6ee7a9,#16c172)';
    }
  }, 2500);

  locationSelect.addEventListener('change', () => {
    temps = generateTemps(locationSelect.value);
    renderForecast(temps);
    setCurrent(temps[0]);
  });

  // optional: click to read advisory (no real audio provided)
  const listenBtn = document.getElementById('listenBtn');
  listenBtn.addEventListener('click', () => {
    const msg = `Advisory for ${locationSelect.value}: Current ${currentEl.textContent}. ${adviceEl.textContent}`;
    if ('speechSynthesis' in window) {
      const s = new SpeechSynthesisUtterance(msg);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(s);
    } else {
      alert(msg);
    }
  });

})();
