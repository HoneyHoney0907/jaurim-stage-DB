document.addEventListener('DOMContentLoaded', async () => {
  const res = await fetch('data/concerts_master.csv');
  const text = await res.text();
  const rows = text.trim() ? text.trim().split('\n').slice(1) : [];
  document.getElementById('count').textContent = rows.length + '개 공연 (CSV에 추가하면 자동 반영)';
});