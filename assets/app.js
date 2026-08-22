(() => {
  const places = window.NATURAL_PLACES || [];
  const byId = new Map(places.map(p => [p.id, p]));
  const photoCache = new Map();
  const pendingPhotos = new Map();
  const FAVORITES_KEY = 'natural100-favorites-v1';
  let favorites = new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'));
  let currentContinent = 'all';
  let currentLandscape = 'all';
  let searchTerm = '';
  let featuredOnly = false;
  let selectedId = null;

  const groups = {
    water: new Set(['eau','zone-humide']),
    relief: new Set(['montagne','canyon','karst','grotte']),
    volcanic: new Set(['volcan','geothermal']),
    forest: new Set(['foret','faune']),
    marine: new Set(['cote','ile','recif']),
    ice: new Set(['glace']),
    desert: new Set(['desert'])
  };
  const groupLabels = {water:'Eaux',relief:'Reliefs',volcanic:'Volcans',forest:'Forêts & faune',marine:'Côtes & récifs',ice:'Glaces',desert:'Déserts'};
  const icons = {water:'💧',relief:'⛰️',volcanic:'🌋',forest:'🌿',marine:'🌊',ice:'🧊',desert:'🏜️'};
  const categoryToGroup = cat => Object.entries(groups).find(([,set]) => set.has(cat))?.[0] || 'relief';

  const $ = id => document.getElementById(id);
  const placeList = $('placeList');
  const resultCount = $('resultCount');
  const resultContext = $('resultContext');
  const searchInput = $('searchInput');
  const sortSelect = $('sortSelect');
  const placeDialog = $('placeDialog');
  const dialogContent = $('dialogContent');
  const favoritesDialog = $('favoritesDialog');
  const favoriteList = $('favoriteList');
  const favoriteCount = $('favoriteCount');

  const map = L.map('map', {
    zoomControl:false,
    minZoom:2,
    maxZoom:12,
    worldCopyJump:true,
    maxBounds:[[-82,-180],[84,180]],
    maxBoundsViscosity:.8
  }).setView([18, 8], 2);
  L.control.zoom({position:'bottomright'}).addTo(map);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const markers = new Map();
  const markerLayer = L.layerGroup().addTo(map);
  places.forEach(p => {
    const g = categoryToGroup(p.category);
    const icon = L.divIcon({
      className:'',
      html:`<div class="natural-marker marker-${g}${p.featured?' marker-featured':''}" title="${escapeHtml(p.name)}"></div>`,
      iconSize:[18,18],
      iconAnchor:[9,9]
    });
    const marker = L.marker([p.lat,p.lng],{icon,keyboard:true,title:p.name});
    marker.bindPopup(`<div class="map-popup"><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.country)} · ${groupLabels[g]}</p><button type="button" data-popup-open="${p.id}">Voir la fiche</button></div>`);
    marker.on('popupopen', e => {
      const el = e.popup.getElement();
      const btn = el?.querySelector('[data-popup-open]');
      if(btn) btn.addEventListener('click', () => openPlace(p.id), {once:true});
    });
    marker.addTo(markerLayer);
    markers.set(p.id, marker);
  });

  const allBounds = L.latLngBounds(places.map(p => [p.lat,p.lng]));
  const fitWorld = () => map.fitBounds(allBounds, {padding:[35,35], maxZoom:2});
  requestAnimationFrame(() => { map.invalidateSize(); fitWorld(); });
  window.addEventListener('resize', () => requestAnimationFrame(() => map.invalidateSize()));

  function escapeHtml(v=''){
    return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function stripHtml(v=''){
    const d = document.createElement('div'); d.innerHTML = v; return d.textContent.trim();
  }
  function allowedLicense(name=''){
    const n = stripHtml(name).trim();
    if(/\b(NC|ND)\b/i.test(n)) return false;
    return /^CC BY(?:-SA)?(?:\s|$)/i.test(n) || /^CC0(?:\s|$)/i.test(n) || /public domain|PDM/i.test(n);
  }
  function scoreImage(page){
    const ii = page.imageinfo?.[0] || {};
    const title = page.title || '';
    if(/\b(map|locator|flag|logo|diagram|coat of arms|seal|route|sign|poster)\b/i.test(title)) return -999;
    if(ii.mime && !/^image\/(jpeg|png|webp)$/i.test(ii.mime)) return -999;
    const lic = ii.extmetadata?.LicenseShortName?.value || '';
    if(!allowedLicense(lic)) return -999;
    const w = Number(ii.width || 0), h = Number(ii.height || 0);
    let score = 0;
    if(w >= 1600) score += 3;
    if(w > h) score += 3;
    const ratio = h ? w/h : 0;
    if(ratio >= 1.25 && ratio <= 2.2) score += 3;
    if(/panorama|view|landscape|aerial|lake|mountain|falls|forest|coast|canyon|island/i.test(title)) score += 1;
    return score;
  }
  async function fetchCommonsPhoto(place){
    if(photoCache.has(place.id)) return photoCache.get(place.id);
    if(pendingPhotos.has(place.id)) return pendingPhotos.get(place.id);
    const promise = (async () => {
      try{
        const params = new URLSearchParams({
          action:'query',format:'json',origin:'*',generator:'search',
          gsrsearch:`${place.photoQuery} filetype:bitmap`,gsrnamespace:'6',gsrlimit:'16',
          prop:'imageinfo',iiprop:'url|mime|size|extmetadata',iiurlwidth:'1200'
        });
        const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
        if(!res.ok) throw new Error('commons');
        const data = await res.json();
        const pages = Object.values(data.query?.pages || {}).sort((a,b) => scoreImage(b)-scoreImage(a));
        const page = pages.find(p => scoreImage(p) > -900);
        if(!page) throw new Error('no-free-photo');
        const ii = page.imageinfo[0];
        const ext = ii.extmetadata || {};
        const fileTitle = page.title.replace(/^File:/,'');
        const photo = {
          url: ii.thumburl || ii.url,
          original: ii.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g,'_'))}`,
          author: stripHtml(ext.Artist?.value || 'Contributeur Wikimedia Commons'),
          license: stripHtml(ext.LicenseShortName?.value || 'Licence libre'),
          licenseUrl: ext.LicenseUrl?.value || '',
          title: fileTitle
        };
        photoCache.set(place.id, photo);
        return photo;
      }catch(err){
        photoCache.set(place.id, null);
        return null;
      }finally{pendingPhotos.delete(place.id)}
    })();
    pendingPhotos.set(place.id, promise);
    return promise;
  }

  async function fillPhotoBox(box, place){
    if(!box || box.dataset.loaded === '1') return;
    box.dataset.loaded = '1';
    const photo = await fetchCommonsPhoto(place);
    if(!photo){ box.classList.add('failed'); return; }
    const img = document.createElement('img');
    img.alt = place.name;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = photo.url;
    img.addEventListener('load', () => box.classList.add('loaded'), {once:true});
    img.addEventListener('error', () => box.classList.add('failed'), {once:true});
    box.prepend(img);
    const pill = document.createElement('span'); pill.className='license-pill'; pill.textContent=photo.license; box.appendChild(pill);
  }

  let observer = null;
  function setupPhotoObserver(){
    if(observer) observer.disconnect();
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if(!entry.isIntersecting) return;
        const box = entry.target;
        const place = byId.get(box.dataset.photoId);
        if(place) fillPhotoBox(box, place);
        observer.unobserve(box);
      });
    }, {root:placeList, rootMargin:'220px 0px'});
    placeList.querySelectorAll('.card-photo[data-photo-id]').forEach(el => observer.observe(el));
  }

  function filteredPlaces(){
    const q = searchTerm.toLocaleLowerCase('fr');
    return places.filter(p => {
      const continentOk = currentContinent === 'all' || p.continent === currentContinent;
      const landscapeOk = currentLandscape === 'all' || groups[currentLandscape]?.has(p.category);
      const featuredOk = !featuredOnly || p.featured;
      const hay = `${p.name} ${p.country} ${p.continent} ${p.desc} ${groupLabels[categoryToGroup(p.category)]}`.toLocaleLowerCase('fr');
      return continentOk && landscapeOk && featuredOk && (!q || hay.includes(q));
    });
  }

  function sorted(list){
    const v = sortSelect.value;
    if(v === 'name') return [...list].sort((a,b) => a.name.localeCompare(b.name,'fr'));
    if(v === 'continent') return [...list].sort((a,b) => a.continent.localeCompare(b.continent,'fr') || a.name.localeCompare(b.name,'fr'));
    return [...list].sort((a,b) => a.rank-b.rank);
  }

  function render(){
    const list = sorted(filteredPlaces());
    resultCount.textContent = `${list.length} lieu${list.length>1?'x':''}`;
    const parts=[];
    if(currentContinent!=='all') parts.push(currentContinent);
    if(currentLandscape!=='all') parts.push(groupLabels[currentLandscape]);
    if(featuredOnly) parts.push('coups de cœur');
    resultContext.textContent = parts.length ? ` · ${parts.join(' · ')}` : ' · monde entier';
    placeList.innerHTML = list.length ? list.map(p => {
      const g = categoryToGroup(p.category);
      return `<article class="place-card${selectedId===p.id?' selected':''}" data-open="${p.id}" tabindex="0">
        <div class="card-photo" data-photo-id="${p.id}"><span class="photo-skeleton"></span></div>
        <div class="card-body">
          <div class="card-topline"><span class="card-index">${String(p.rank).padStart(2,'0')}</span>${p.featured?'<span class="top-badge">★ coup de cœur</span>':''}</div>
          <h3>${escapeHtml(p.name)}</h3>
          <div class="place-meta">${icons[g]} ${escapeHtml(p.country)} · ${escapeHtml(p.continent)}</div>
          <p class="place-desc">${escapeHtml(p.desc)}</p>
        </div>
        <button class="fav-mini${favorites.has(p.id)?' active':''}" data-fav="${p.id}" type="button" aria-label="Ajouter aux favoris">${favorites.has(p.id)?'♥':'♡'}</button>
      </article>`;
    }).join('') : `<div class="empty-state"><strong>Aucun joyau trouvé.</strong>Essaie un autre filtre ou efface la recherche.</div>`;

    const visibleIds = new Set(list.map(p => p.id));
    markers.forEach((marker,id) => {
      if(visibleIds.has(id)){ if(!markerLayer.hasLayer(marker)) markerLayer.addLayer(marker); }
      else if(markerLayer.hasLayer(marker)) markerLayer.removeLayer(marker);
    });
    setupPhotoObserver();
  }

  async function openPlace(id){
    const p = byId.get(id); if(!p) return;
    selectedId=id; render();
    markers.get(id)?.openPopup();
    const g=categoryToGroup(p.category);
    dialogContent.innerHTML = `<div class="dialog-photo" id="dialogPhoto"><div class="photo-error">🌿</div></div>
      <div class="dialog-body">
        <div class="dialog-kicker">${String(p.rank).padStart(2,'0')} / 100 · ${icons[g]} ${groupLabels[g]}</div>
        <h2>${escapeHtml(p.name)}</h2>
        <div class="dialog-place-meta">${escapeHtml(p.country)} · ${escapeHtml(p.continent)}</div>
        <p class="dialog-lead">${escapeHtml(p.desc)}</p>
        <div class="detail-grid">
          <div class="detail-box"><span>Paysage</span><strong>${groupLabels[g]}</strong></div>
          <div class="detail-box"><span>Période indicative</span><strong>${escapeHtml(p.best)}</strong></div>
          <div class="detail-box"><span>Coordonnées</span><strong>${p.lat.toFixed(3)}, ${p.lng.toFixed(3)}</strong></div>
        </div>
        <div class="dialog-actions">
          <a class="primary" href="https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}" target="_blank" rel="noopener">Voir sur Google Maps ↗</a>
          <button class="fav${favorites.has(p.id)?' active':''}" id="dialogFav" type="button">${favorites.has(p.id)?'♥ Retirer des favoris':'♡ Ajouter aux favoris'}</button>
        </div>
      </div>`;
    placeDialog.showModal();
    const photo = await fetchCommonsPhoto(p);
    const box = $('dialogPhoto');
    if(!box) return;
    if(photo){
      box.innerHTML = `<img src="${escapeHtml(photo.url)}" alt="${escapeHtml(p.name)}"><div class="dialog-photo-credit"><span>${escapeHtml(photo.author)} · ${escapeHtml(photo.license)}</span><a href="${escapeHtml(photo.original)}" target="_blank" rel="noopener">Source Wikimedia ↗</a></div>`;
    }
    $('dialogFav')?.addEventListener('click', () => {
      toggleFavorite(p.id);
      const b=$('dialogFav');
      if(b){ b.classList.toggle('active',favorites.has(p.id)); b.textContent=favorites.has(p.id)?'♥ Retirer des favoris':'♡ Ajouter aux favoris'; }
    });
  }

  function toggleFavorite(id){
    if(favorites.has(id)) favorites.delete(id); else favorites.add(id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
    updateFavoriteCount(); render();
  }
  function updateFavoriteCount(){favoriteCount.textContent=favorites.size}

  async function renderFavorites(){
    const items = [...favorites].map(id => byId.get(id)).filter(Boolean);
    favoriteList.innerHTML = items.length ? items.map(p => `<div class="favorite-row" data-favorite-row="${p.id}"><div class="favorite-thumb" data-favorite-photo="${p.id}"></div><div><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.country)} · ${escapeHtml(p.continent)}</small></div><button type="button" data-remove-fav="${p.id}" aria-label="Retirer">×</button></div>`).join('') : `<div class="empty-state"><strong>Pas encore de favori.</strong>Utilise le cœur sur les fiches ou dans la liste.</div>`;
    items.forEach(async p => {
      const photo=await fetchCommonsPhoto(p); const box=favoriteList.querySelector(`[data-favorite-photo="${p.id}"]`); if(photo&&box) box.innerHTML=`<img src="${escapeHtml(photo.url)}" alt="">`;
    });
  }

  function applyFilterAndFit(){
    render();
    const list=filteredPlaces();
    if(list.length===1){map.setView([list[0].lat,list[0].lng],7)}
    else if(list.length>1){map.fitBounds(L.latLngBounds(list.map(p=>[p.lat,p.lng])),{padding:[35,35],maxZoom:4})}
  }

  $('continentFilters').addEventListener('click', e => {
    const b=e.target.closest('[data-continent]'); if(!b)return;
    currentContinent=b.dataset.continent;
    document.querySelectorAll('[data-continent]').forEach(x=>x.classList.toggle('active',x===b));
    applyFilterAndFit();
  });
  $('landscapeFilters').addEventListener('click', e => {
    const b=e.target.closest('[data-landscape]'); if(!b)return;
    currentLandscape=b.dataset.landscape;
    document.querySelectorAll('[data-landscape]').forEach(x=>x.classList.toggle('active',x===b));
    applyFilterAndFit();
  });
  searchInput.addEventListener('input',()=>{searchTerm=searchInput.value.trim();render()});
  $('clearSearch').addEventListener('click',()=>{searchInput.value='';searchTerm='';render();searchInput.focus()});
  sortSelect.addEventListener('change',render);
  $('featuredBtn').addEventListener('click',()=>{featuredOnly=!featuredOnly;$('featuredBtn').classList.toggle('active',featuredOnly);$('mapFeaturedBtn').classList.toggle('active',featuredOnly);applyFilterAndFit()});
  $('mapFeaturedBtn').addEventListener('click',()=>{featuredOnly=!featuredOnly;$('featuredBtn').classList.toggle('active',featuredOnly);$('mapFeaturedBtn').classList.toggle('active',featuredOnly);applyFilterAndFit()});
  $('fitBtn').addEventListener('click',fitWorld);
  $('randomBtn').addEventListener('click',()=>{const list=filteredPlaces(); if(!list.length)return; const p=list[Math.floor(Math.random()*list.length)]; map.setView([p.lat,p.lng],6); openPlace(p.id)});
  placeList.addEventListener('click',e=>{const fav=e.target.closest('[data-fav]');if(fav){e.stopPropagation();toggleFavorite(fav.dataset.fav);return}const card=e.target.closest('[data-open]');if(card)openPlace(card.dataset.open)});
  placeList.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const card=e.target.closest('[data-open]');if(card){e.preventDefault();openPlace(card.dataset.open)}});
  $('dialogClose').addEventListener('click',()=>placeDialog.close());
  placeDialog.addEventListener('close',()=>{selectedId=null;render()});
  $('favoritesBtn').addEventListener('click',async()=>{await renderFavorites();favoritesDialog.showModal()});
  $('favoritesClose').addEventListener('click',()=>favoritesDialog.close());
  favoriteList.addEventListener('click',e=>{const b=e.target.closest('[data-remove-fav]');if(!b)return;toggleFavorite(b.dataset.removeFav);renderFavorites()});

  async function loadHero(){
    const p=places[0]; const photo=await fetchCommonsPhoto(p); if(!photo)return;
    $('heroPhoto').style.backgroundImage=`url("${photo.url.replace(/"/g,'%22')}")`;
    $('heroPhoto').classList.add('loaded');
    $('heroCredit').textContent=`${photo.author} · ${photo.license} · Wikimedia Commons`;
  }

  updateFavoriteCount(); render(); loadHero();
})();
