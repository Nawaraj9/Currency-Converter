const NEWS_POSITIONS = [
  // Far left column
  ['2%',   '0%',   -2],
  ['18%',  '0%',    1],
  ['35%',  '0%',   -1],
  ['52%',  '0%',    2],
  ['68%',  '1%',   -1],
  ['83%',  '0%',    1],
  // Far right column
  ['2%',   '72%',   1],
  ['17%',  '71%',  -2],
  ['34%',  '73%',   1],
  ['51%',  '72%',  -1],
  ['67%',  '71%',   2],
  ['82%',  '72%',  -1],
  // Inner left (between far-left and converter)
  ['10%',  '18%',  -3],
  ['38%',  '20%',   2],
  ['62%',  '19%',  -2],
  ['85%',  '17%',   1],
  // Inner right (between converter and far-right)
  ['8%',   '58%',   2],
  ['36%',  '57%',  -2],
  ['60%',  '59%',   1],
  ['84%',  '57%',  -1],
  // Far far right column (fills the right edge gap)
  ['5%',   '84%',  -1],
  ['22%',  '83%',   2],
  ['40%',  '85%',  -2],
  ['57%',  '84%',   1],
  ['74%',  '83%',  -1],
  ['89%',  '84%',   2],
  // Top strip
  ['0%',   '36%',  -2],
  ['0%',   '50%',   1],
  // Bottom strip
  ['92%',  '30%',   2],
  ['92%',  '50%',  -2],
];

async function loadNews() {
  const bg = document.getElementById('newsBackground');
  if (!bg) return;

  const rssUrl = encodeURIComponent('https://feeds.bbci.co.uk/news/business/rss.xml');
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;

  log.info('Fetching news for background scatter...');

  try {
    const res  = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error('RSS returned error status');

    log.info(`News loaded: ${data.items.length} articles`);

    // Repeat articles to fill all positions if fewer articles than positions
    const raw = data.items;
    const items = NEWS_POSITIONS.map((_, i) => raw[i % raw.length]);

    items.forEach((item, i) => {
      const [top, left, rot] = NEWS_POSITIONS[i];

      const date = new Date(item.pubDate).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      });

      const card = document.createElement('div');
      card.className = 'news-bg-item';
      card.style.top  = top;
      card.style.left = left;
      card.style.setProperty('--rot', `${rot}deg`);
      card.style.animationDelay = `${i * -0.6}s`;

      card.innerHTML = `
        <a href="${item.link}" target="_blank" rel="noopener">${item.title}</a>
        <span class="news-bg-date">${date}</span>
      `;

      bg.appendChild(card);
    });

  } catch (e) {
    log.error('loadNews() failed:', e.message);
  }
}
