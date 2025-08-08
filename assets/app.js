// 간단 헬퍼
const $ = (s) => document.querySelector(s);
const state = { rows: [], filtered: [] };

document.addEventListener("DOMContentLoaded", () => {
  // 이벤트 바인딩 (있을 때만 바인딩되도록 방어)
  $("#q")?.addEventListener("input", applyFilters);
  $("#year")?.addEventListener("change", applyFilters);
  $("#artist")?.addEventListener("change", applyFilters);
  $("#city")?.addEventListener("change", applyFilters);
  $("#etype")?.addEventListener("change", applyFilters);   // 🔹 event_type 필터 (선택)
  $("#clear")?.addEventListener("click", clearFilters);

  loadData();
});

function unique(arr){ return [...new Set(arr.filter(Boolean))]; }

async function loadData(){
  try{
    await new Promise((resolve, reject) => {
      Papa.parse("data/concerts_master.csv", {
        download: true, header: true, skipEmptyLines: true,
        complete: (res) => { state.rows = res.data; resolve(); },
        error: (err) => reject(err),
      });
    });
  }catch(e){
    console.warn("CSV load failed, fallback to JSON:", e);
    const res = await fetch("data/concerts_master.json");
    state.rows = await res.json();
  }

  // 정규화
  state.rows.forEach(r => {
    r.is_festival = String(r.is_festival).toLowerCase() === "true";
    r.event_type = (r.event_type || "").trim();          // 🔹 새 컬럼
    r.type_tags  = (r.type_tags  || "").trim();          // 🔹 새 컬럼 ("a, b, c")
    r.co_artists = (r.co_artists || "").trim();          // 🔹 새 컬럼
    r.organizer  = (r.organizer  || "").trim();          // 🔹 새 컬럼
  });

  buildFilters();
  applyFilters();
}

function buildFilters(){
  const years   = unique(state.rows.map(r => r.year)).sort();
  const artists = unique(state.rows.map(r => r.artist)).sort();
  const cities  = unique(state.rows.map(r => r.city)).sort();
  const etypes  = unique(state.rows.map(r => r.event_type)).sort();

  if ($("#year"))   $("#year").innerHTML   = '<option value="">연도(전체)</option>' + years.map(y=>`<option>${y}</option>`).join("");
  if ($("#artist")) $("#artist").innerHTML = '<option value="">아티스트(전체)</option>' + artists.map(a=>`<option>${a}</option>`).join("");
  if ($("#city"))   $("#city").innerHTML   = '<option value="">도시(전체)</option>' + cities.map(c=>`<option>${c}</option>`).join("");
  if ($("#etype"))  $("#etype").innerHTML  = '<option value="">유형(전체)</option>' + etypes.map(t=>`<option value="${t}">${t||"(미지정)"}</option>`).join("");
}

function clearFilters(){
  if ($("#q"))     $("#q").value = "";
  if ($("#year"))  $("#year").value = "";
  if ($("#artist"))$("#artist").value = "";
  if ($("#city"))  $("#city").value = "";
  if ($("#etype")) $("#etype").value = "";
  applyFilters();
}

function applyFilters(){
  const q   = ($("#q")?.value || "").trim().toLowerCase();
  const fy  = $("#year")?.value || "";
  const fa  = $("#artist")?.value || "";
  const fc  = $("#city")?.value || "";
  const fe  = $("#etype")?.value || "";   // 🔹 event_type 필터 값

  state.filtered = state.rows.filter(r => {
    if (fy && String(r.year) !== fy) return false;
    if (fa && String(r.artist) !== fa) return false;
    if (fc && String(r.city) !== fc) return false;
    if (fe && String(r.event_type) !== fe) return false;  // 🔹 유형 필터

    if (q){
      // 🔹 검색 범위에 새 컬럼 포함
      const hay = [
        r.title, r.venue, r.series_or_tour, r.sources, r.setlist,
        r.event_type, r.type_tags, r.co_artists, r.organizer
      ].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // 최신순으로 정렬
  state.filtered.sort((a, b) => (b.start_date || "").localeCompare(a.start_date || ""));

  render();
}

function firstMedia(r){
  if(!r.media_links) return "";
  return r.media_links.split(",")[0].trim();
}

function render(){
  const root = $("#list");
  if (!root) return;
  root.innerHTML = "";

  $("#count") && ($("#count").textContent = `${state.filtered.length}개 공연`);

  if (!state.filtered.length){
    root.append(el("div", {class:"empty"}, "검색 결과가 없습니다."));
    return;
  }

  state.filtered.forEach(r => {
    const imgSrc = firstMedia(r);
    const img = imgSrc 
      ? el("img", {src: imgSrc, alt: "poster"}) 
      : el("div", {class: "no-image"}, "noimage");

    const artist = el("div", {class: "artist-name"}, r.artist || "");
    const title = el("h3", {}, r.title || "(제목 없음)");
    
    const date = el("div", {class: "date"}, 
      `${r.start_date}${r.end_date && r.end_date !== r.start_date ? " ~ " + r.end_date : ""}`
    );

    const locationParts = r.country === 'KR' 
      ? [r.city, r.venue].filter(Boolean)
      : [r.country, r.city, r.venue].filter(Boolean);
    const location = el("div", {class: "location"}, locationParts.join(" / "));

    const tagNodes = [];
    if (r.series_or_tour) tagNodes.push(el("span", {class:"tag"}, r.series_or_tour));
    if (r.status)         tagNodes.push(el("span", {class:"tag"}, r.status));
    if (r.event_type)     tagNodes.push(el("span", {class:"tag"}, `type: ${r.event_type}`));
    if (r.type_tags){
      r.type_tags.split(",").map(s=>s.trim()).filter(Boolean).forEach(t => {
        tagNodes.push(el("span", {class:"tag"}, `#${t}`));
      });
    }
    if (r.co_artists) tagNodes.push(el("span", {class:"tag"}, `with: ${r.co_artists}`));
    if (r.organizer)  tagNodes.push(el("span", {class:"tag"}, `org: ${r.organizer}`));
    const tags = el("div", {class:"tags"}, ...tagNodes);

    const card = el("div", {class:"card"}, artist, img, title, date, location, tags);
    root.append(card);
  });
}

// 작은 돔 도우미
function el(tag, attrs={}, ...children){
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=> e.setAttribute(k,v));
  children.filter(Boolean).forEach(c=> e.append(c));
  return e;
}
