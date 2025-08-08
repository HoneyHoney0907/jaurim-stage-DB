document.addEventListener('DOMContentLoaded', async () => {
  const res = await fetch('data/concerts_master.csv');
  const text = await res.text();
  const rows = text.trim().split('\n').slice(1); // 첫 줄은 헤더
  
  document.getElementById('count').textContent = rows.length + '개 공연';

  const tbody = document.querySelector('#concertTable tbody');
  rows.forEach(row => {
    const cols = row.split(',');
    const tr = document.createElement('tr');
    // 필요한 컬럼만 뽑아서 표시 (예: id, artist, year, start_date, venue, title)
    [cols[0], cols[1], cols[6], cols[4], cols[9], cols[3]].forEach(text => {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
});
