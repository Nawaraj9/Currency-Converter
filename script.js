// Set to false in production to silence logs
const DEBUG = false;

const log = {
  info:  (...args) => DEBUG && console.log('%c[INFO]',  'color:#6bcfff', ...args),
  warn:  (...args) => DEBUG && console.warn('%c[WARN]',  'color:#f0c040', ...args),
  error: (...args) => DEBUG && console.error('%c[ERROR]', 'color:#ff6b6b', ...args),
  group: (label, fn) => { if (!DEBUG) { fn(); return; } console.group(label); fn(); console.groupEnd(); }
};

// Data

const currencies = [
  "AED","ARS","AUD","BDT","BRL","CAD","CHF","CNY","CZK","DKK",
  "EGP","EUR","GBP","HKD","HUF","IDR","ILS","INR","JPY","KRW",
  "MXN","MYR","NOK","NPR","NZD","PHP","PKR","PLN","RON","RUB",
  "SAR","SEK","SGD","THB","TRY","TWD","UAH","USD","VND","ZAR"
];

// Currencies supported by Frankfurter (for the chart)
const chartSupported = new Set([
  "AUD","BGN","BRL","CAD","CHF","CNY","CZK","DKK","EUR","GBP",
  "HKD","HUF","IDR","ILS","INR","ISK","JPY","KRW","MXN","MYR",
  "NOK","NZD","PHP","PLN","RON","SEK","SGD","THB","TRY","USD","ZAR"
]);

const flags = {
  AED:"🇦🇪", ARS:"🇦🇷", AUD:"🇦🇺", BDT:"🇧🇩", BRL:"🇧🇷", CAD:"🇨🇦",
  CHF:"🇨🇭", CNY:"🇨🇳", CZK:"🇨🇿", DKK:"🇩🇰", EGP:"🇪🇬", EUR:"🇪🇺",
  GBP:"🇬🇧", HKD:"🇭🇰", HUF:"🇭🇺", IDR:"🇮🇩", ILS:"🇮🇱", INR:"🇮🇳",
  JPY:"🇯🇵", KRW:"🇰🇷", MXN:"🇲🇽", MYR:"🇲🇾", NOK:"🇳🇴", NPR:"🇳🇵",
  NZD:"🇳🇿", PHP:"🇵🇭", PKR:"🇵🇰", PLN:"🇵🇱", RON:"🇷🇴", RUB:"🇷🇺",
  SAR:"🇸🇦", SEK:"🇸🇪", SGD:"🇸🇬", THB:"🇹🇭", TRY:"🇹🇷", TWD:"🇹🇼",
  UAH:"🇺🇦", USD:"🇺🇸", VND:"🇻🇳", ZAR:"🇿🇦"
};

//DOM References 

const fromSelect = document.getElementById('from');
const toSelect   = document.getElementById('to');

if (!fromSelect || !toSelect) {
  log.error('Could not find #from or #to select elements in the DOM');
}

currencies.forEach(c => {
  const flag = flags[c] || '';
  fromSelect.innerHTML += `<option value="${c}">${flag} ${c}</option>`;
  toSelect.innerHTML   += `<option value="${c}">${flag} ${c}</option>`;
});

fromSelect.value = 'USD';
toSelect.value   = 'NPR';

log.info('Currency dropdowns populated', { total: currencies.length });

//State 

let rateChart = null;
let lastResult = '';

// Event Listeners

document.getElementById('amount').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    log.info('Enter key pressed — triggering convert');
    convert();
  }
});

fromSelect.addEventListener('change', () => { log.info('From currency changed:', fromSelect.value); });
toSelect.addEventListener('change',   () => { log.info('To currency changed:',   toSelect.value);   });

// Functions

function swapCurrencies() {
  const tmp = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = tmp;
  log.info('Currencies swapped:', fromSelect.value, '↔', toSelect.value);
}

async function convert() {
  const amount = parseFloat(document.getElementById('amount').value);
  const from   = fromSelect.value;
  const to     = toSelect.value;

  const resultDiv = document.getElementById('result');
  const errorDiv  = document.getElementById('error');
  const spinner   = document.getElementById('spinner');
  const btn       = document.getElementById('convertBtn');

  resultDiv.style.display = 'none';
  errorDiv.style.display  = 'none';

  if (!amount || amount <= 0) {
    log.warn('Invalid amount entered:', amount);
    errorDiv.textContent = 'Please enter a valid amount.';
    errorDiv.style.display = 'block';
    return;
  }

  log.group(`convert() — ${amount} ${from} → ${to}`, () => {
    log.info('Fetching rate from exchangerate-api.com...');
  });

  btn.disabled = true;
  spinner.style.display = 'block';

  try {
    const url = `https://api.exchangerate-api.com/v4/latest/${from}`;
    log.info('GET', url);

    const response = await fetch(url);
    log.info('Response status:', response.status);

    if (!response.ok) throw new Error(`HTTP ${response.status} — bad currency code or network issue`);

    const data = await response.json();
    log.info('API response received. Available currencies:', Object.keys(data.rates).length);

    const rate = data.rates[to];
    if (rate === undefined) throw new Error(`Rate for "${to}" not found in API response`);

    const result = (amount * rate).toFixed(2);
    log.info(`Rate: 1 ${from} = ${rate} ${to} → Result: ${result}`);

    const fromFlag = flags[from] || '';
    const toFlag   = flags[to]   || '';

    lastResult = `${amount.toLocaleString()} ${from} = ${parseFloat(result).toLocaleString()} ${to}`;
    document.getElementById('convertedValue').textContent =
      `${fromFlag} ${amount.toLocaleString()} ${from} = ${toFlag} ${parseFloat(result).toLocaleString()} ${to}`;
    document.getElementById('rateInfo').textContent =
      `1 ${from} = ${rate} ${to}  •  Updated daily`;

    resultDiv.style.display = 'block';

    saveHistory(from, to, amount, parseFloat(result));
    renderHistory();

    if (chartSupported.has(from) && chartSupported.has(to)) {
      log.info('Both currencies supported by chart API — loading chart');
      await loadChart(from, to);
    } else {
      log.warn(`Chart not available: ${from} or ${to} not in Frankfurter dataset`);
      document.getElementById('chartContainer').style.display = 'none';
    }

  } catch (e) {
    log.error('convert() failed:', e.message);
    errorDiv.textContent = `Error: ${e.message}`;
    errorDiv.style.display = 'block';
  } finally {
    btn.disabled = false;
    spinner.style.display = 'none';
  }
}

async function loadChart(from, to) {
  const container = document.getElementById('chartContainer');
  container.style.display = 'block';
  document.getElementById('chartTitle').textContent = `${from} → ${to} — Last 7 Days`;

  const end   = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  const fmt = d => d.toISOString().split('T')[0];

  const url = `https://api.frankfurter.app/${fmt(start)}..${fmt(end)}?from=${from}&to=${to}`;
  log.info('GET (chart)', url);

  try {
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const labels = Object.keys(data.rates);
    const values = labels.map(d => data.rates[d][to]);
    log.info(`Chart data loaded: ${labels.length} data points`, { labels, values });

    if (rateChart) {
      log.info('Destroying previous chart instance');
      rateChart.destroy();
    }

    rateChart = new Chart(document.getElementById('rateChart'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `1 ${from} in ${to}`,
          data: values,
          borderColor: '#e2b96f',
          backgroundColor: 'rgba(226,185,111,0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#e2b96f',
          pointRadius: 4,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });

    log.info('Chart rendered successfully');
  } catch (e) {
    log.error('loadChart() failed:', e.message);
    container.style.display = 'none';
  }
}

function copyResult() {
  log.info('Copying to clipboard:', lastResult);
  navigator.clipboard.writeText(lastResult).then(() => {
    const btn = document.querySelector('.copy-btn');
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 1500);
  }).catch(e => log.error('Clipboard write failed:', e.message));
}

function saveHistory(from, to, amount, result) {
  const history = JSON.parse(localStorage.getItem('convHistory') || '[]');
  history.unshift({ from, to, amount, result, time: new Date().toLocaleTimeString() });
  localStorage.setItem('convHistory', JSON.stringify(history.slice(0, 5)));
  log.info('History saved. Entries:', history.length);
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem('convHistory') || '[]');
  const section = document.getElementById('historySection');
  const list    = document.getElementById('historyList');

  if (history.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';

  list.innerHTML = history.map(h =>
    `<li>
      <span>${flags[h.from] || ''} ${h.amount.toLocaleString()} ${h.from} → ${flags[h.to] || ''} ${h.result.toLocaleString()} ${h.to}</span>
      <span class="hist-time">${h.time}</span>
    </li>`
  ).join('');
}

function clearHistory() {
  log.info('Clearing conversion history');
  localStorage.removeItem('convHistory');
  renderHistory();
}

//Initialise

log.info('App initialising...');
renderHistory();
loadNews();
