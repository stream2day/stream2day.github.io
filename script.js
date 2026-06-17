window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-G1K7ES0N45');
/* ═══════════════════════════════════════════════ */
// Pinch zoom block
    document.addEventListener('touchstart', function(e) {
      if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchmove', function(e) {
      if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });
    // Double tap zoom block
    var lastTap = 0;
    document.addEventListener('touchend', function(e) {
      var now = Date.now();
      if (now - lastTap < 300) e.preventDefault();
      lastTap = now;
    }, { passive: false });
    // Keyboard zoom (Ctrl + / Ctrl -)
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=')) e.preventDefault();
    });
    document.addEventListener('wheel', function(e) {
      if (e.ctrlKey) e.preventDefault();
    }, { passive: false });
    // Image context menu block (download/save option)
    document.addEventListener('contextmenu', function(e) {
      if (e.target.tagName === 'IMG') e.preventDefault();
    });
/* ═══════════════════════════════════════════════ */
// ── GLOBAL SCROLL LOCK (iOS Safari safe) ──
    var _scrollLockCount = 0;
    var _scrollY = 0;
    function lockBodyScroll() {
      _scrollLockCount++;
      if (_scrollLockCount > 1) return;
      _scrollY = window.scrollY || window.pageYOffset;
      document.body.style.overflow   = 'hidden';
      document.body.style.position   = 'fixed';
      document.body.style.top        = '-' + _scrollY + 'px';
      document.body.style.left       = '0';
      document.body.style.right      = '0';
    }
    function unlockBodyScroll() {
      _scrollLockCount = Math.max(0, _scrollLockCount - 1);
      if (_scrollLockCount > 0) return;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top      = '';
      document.body.style.left     = '';
      document.body.style.right    = '';
      window.scrollTo(0, _scrollY);
    }
    window.lockBodyScroll   = lockBodyScroll;
    window.unlockBodyScroll = unlockBodyScroll;
/* ═══════════════════════════════════════════════ */
/* ── AUTO LOAD HELPER ── */
  function _makeInlineLoader() {
    var el = document.createElement('div');
    el.className = 'castfm-inline-loader';
    el.innerHTML =
      '<div class="castfm-inline-loader-dots">' +
        '<span></span><span></span><span></span>' +
      '</div>';
    return el;
  }
  function attachAutoLoad(scrollEl, sentinel, loadFn, delay) {
    if (!scrollEl || !sentinel) return;
    var busy = false;
    var ms = (delay !== undefined) ? delay : 800;
    var obs = new IntersectionObserver(function(entries) {
      if (!entries[0].isIntersecting || busy) return;
      busy = true;
      var loader = _makeInlineLoader();
      sentinel.parentElement && sentinel.parentElement.insertBefore(loader, sentinel);
      setTimeout(function() {
        if (loader.parentElement) loader.parentElement.removeChild(loader);
        var hasMore = loadFn();
        busy = false;
        if (!hasMore) { obs.disconnect(); sentinel.remove(); }
      }, ms);
    }, { root: scrollEl, threshold: 0.1 });
    obs.observe(sentinel);
    return obs;
  }
  function makeSentinel() {
    var s = document.createElement('div');
    s.style.cssText = 'height:1px;width:100%;';
    return s;
  }
  /* ── DESKTOP DETECT — 3 states based on window.innerWidth vs screen.width ──
     >= 70% of screen.width  → full desktop  (sidebar visible)
     40–69% of screen.width  → desktop, sidebar hidden  (is-desktop + sidebar-hidden)
     <  40% of screen.width  → mobile view
  ── */
  (function() {
    var SW = window.screen.width;
    var MOBILE_BP  = Math.round(SW * 0.40); // below this → mobile
    var SIDEBAR_BP = Math.round(SW * 0.70); // below this → hide sidebar

    function applyMode() {
      var w = window.innerWidth;
      var isTouch = 'ontouchstart' in window;

      // Mobile: touch device OR very narrow window
      if (isTouch || w < MOBILE_BP) {
        document.body.classList.remove('is-desktop', 'sidebar-hidden');
        document.documentElement.classList.remove('is-desktop-html');
        return;
      }

      // Desktop (both full and sidebar-hidden variants)
      document.body.classList.add('is-desktop');
      document.documentElement.classList.add('is-desktop-html');

      if (w < SIDEBAR_BP) {
        // Desktop but narrow → hide left sidebar
        document.body.classList.add('sidebar-hidden');
      } else {
        // Full desktop → sidebar visible
        document.body.classList.remove('sidebar-hidden');
      }
    }

    applyMode();
    var _resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(_resizeTimer);
      _resizeTimer = setTimeout(function() {
        applyMode();
        // Re-embed sidebar content if switching to desktop
        if (document.body.classList.contains('is-desktop')) {
          var embed = document.getElementById('dsbSidebarEmbed');
          var sbBody = document.querySelector('#sidebar .sb-body');
          if (embed && sbBody && !embed.contains(sbBody)) {
            embed.appendChild(sbBody);
            typeof calcStorageUsage === 'function' && calcStorageUsage();
            typeof _updateSettingsCounts === 'function' && _updateSettingsCounts();
            typeof renderSidebarCats === 'function' && renderSidebarCats();
            var sbFy = document.getElementById('sbFooterYear');
            if (sbFy) sbFy.textContent = new Date().getFullYear();
          }
        }
      }, 150);
    });
  })();
  const audio        = document.getElementById('mainAudio');
  const miniPlayer   = document.getElementById('miniPlayer');
  const miniName     = document.getElementById('miniName');
  const visualizer   = document.getElementById('visualizer');
  const radioList    = { innerHTML: '', className: '', appendChild: function(){}, querySelectorAll: function(){ return []; } };
  const searchInput  = document.getElementById('searchInput');
  const searchClear  = document.getElementById('searchClear');
  let currentActiveId = null;
  let isPlaying       = false;
  /* ══ CT — Unified Current Track ══
     একটাই object, দুই ধরনের audio handle করে
     type: 'radio' | 'mp3'
     audioEl: radio/mp3 → audio
  */
  let timeInterval = null;
  let liveStartTime = null;
  const CT = {
    track:   null,    // { type, id, name, img, genre }
    audioEl: audio,   // default radio/mp3 player
    set(trackInfo) {
      this.track   = trackInfo;
      this.audioEl = audio;
    },
    stop() {
      if (!audio.paused)  { audio.pause();  audio.src  = ''; }
      isPlaying        = false;
      currentActiveId  = null;
      this.track       = null;
      this.audioEl     = audio;
      stopTimeTracking();
      if (typeof _playCountStop === 'function') _playCountStop();
      document.querySelectorAll('.radio-card').forEach(c => c.classList.remove('active','loading'));
      miniPlayer.classList.remove('visible','playing-state'); document.body.classList.remove('mini-visible');
      syncUI();
    },
    play(url, volume) {
      this.audioEl.src    = url;
      this.audioEl.volume = volume || 0.8;
      return this.audioEl.play();
    }
  };
  let currentTab      = 'watch';
  let favorites       = JSON.parse(localStorage.getItem('radio_favs') || '[]');
  // ── STATIONS — Firebase থেকে লোড হবে ──
  let stations = [];
  // Firebase ready হলে subscribe করো
  window.subscribeStations = function() {
    if (!window._fbDb || !window._fbRef || !window._fbOnValue) return;
    var _lastStationSig = '';
    window._fbOnValue(window._fbRef(window._fbDb, 'stations'), function(snap) {
      window._isOnline = true;
      if (!snap.exists()) { stations = []; renderStations(); return; }
      var raw = snap.val();
      // plays বাদ দিয়ে fingerprint — plays change এ re-render হবে না
      var sig = Object.entries(raw).map(function(e) {
        var d = e[1];
        return e[0] + ':' + (d.name||'') + ':' + (d.order||'') + ':' + (d.url||'') + ':' + (d.img||'');
      }).join('|');
      var needsRender = sig !== _lastStationSig;
      _lastStationSig = sig;
      stations = Object.entries(raw)
        .map(function(e) {
          var d = e[1];
          var sid = d.id || e[0];
          return { id: sid, _key: e[0], name: d.name||'', genre: d.genre||'', lang: d.lang||'', freq: d.freq||'', url: d.url||'', img: d.img||'', desc: d.desc||'', seo: d.seo||'', order: d.order != null ? Number(d.order) : (parseFloat(sid) || 9999) };
        })
        .sort(function(a,b){ return a.order - b.order; });
      if (window._markLoaded) window._markLoaded('stations');
      var lph2 = document.getElementById('listenPlaceholder');
      if (lph2) lph2.style.display = 'none';
      if (needsRender) {
        renderStations();
        renderPodcastCategories();
        batchCacheThumbs(stations.map(function(s){ return s.img; }).filter(Boolean));
      }
      var sbR = document.getElementById('sbLiveRadioCount');
      if (sbR) sbR.textContent = stations.length + ' Station' + (stations.length !== 1 ? 's' : '');
      if (window._handlePendingHash) window._handlePendingHash();
    });
  };
  /* ── FULL PLAYER ── */
  const fullPlayer  = document.getElementById('miniPlayer');
  const fpArtwork   = document.getElementById('fpArtwork');
  const fpName      = document.getElementById('fpName');
  const fpGenre     = document.getElementById('fpGenre');
  const fpFavBtn    = document.getElementById('fpFavBtn');
  function openFullPlayer() {
    if (!CT.track) return;
    fpArtwork.src       = CT.track.img   || '';
    fpName.textContent  = CT.track.name  || '—';
    if (fpGenre) fpGenre.textContent = CT.track.desc || CT.track.genre || '';
    if (fpFavBtn) fpFavBtn.style.visibility = 'visible';
    updateFpFavBtn();
    updatePlayerUI();
    // Scroll full content to top before opening
    var fc = fullPlayer.querySelector('.up-full-content');
    if (fc) fc.scrollTop = 0;
    // rAF দিয়ে class add করলে browser layout calculate করার সময় পায়
    requestAnimationFrame(function() {
      fullPlayer.classList.add('open');
    });
    document.getElementById('fpOverlay').classList.add('open');
    document.body.classList.add('fp-open');
    lockBodyScroll();
    if (typeof _playCountSubscribe === 'function') _playCountSubscribe(CT.track);
    try { history.pushState({ type: 'fullplayer' }, '', window.location.href); } catch(e) {}
    const playing = !CT.audioEl.paused;
    if (playing) fullPlayer.classList.add('playing-state');
    else fullPlayer.classList.remove('playing-state');
  }
  let _closingFromPopstate = false;
  function closeFullPlayer() {
    fullPlayer.classList.remove('open');
    document.getElementById('fpOverlay').classList.remove('open');
    unlockBodyScroll();
    setTimeout(function() {
      document.body.classList.remove('fp-open');
    }, 420);
    // full player history state সরাও (back button loop এড়াতে)
    if (history.state && history.state.type === 'fullplayer') { try { history.back(); } catch(e) {} }
  }
  window.closeFullPlayer = closeFullPlayer;
  /* ── TIMES PLAYED ── */
  var _playCountTimer = null;
  var _playCountUnsub = null;
  var _playCountTracked = false;
  function _fpShowPlayCount(count) {
    var el = document.getElementById('fpTimesPlayed');
    if (!el) return;
    if (!count || count < 1) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.textContent = count.toLocaleString() + ' Times Played';
  }
  function _getPlaysPath(track) {
    if (!track) return null;
    if (track.type === 'radio') return 'stations/' + (track._key || track.id) + '/plays';
    if (track.type === 'podcast_ep') return 'podcast_episodes/' + track.id + '/plays';
    return null;
  }
  function _playCountStart() {
    _playCountStop();
    _playCountTracked = false;
    var track = CT && CT.track;
    if (!track) return;
    // সাথে সাথে increment
    if (window._fbDb && window._fbRef && window._fbIncrement && window._fbUpdate) {
      var path = _getPlaysPath(track);
      if (path) {
        var obj = {};
        obj['plays'] = window._fbIncrement(1);
        if (track.type === 'podcast_ep') obj['weekly_plays'] = window._fbIncrement(1);
        var parentPath = path.substring(0, path.lastIndexOf('/'));
        window._fbUpdate(window._fbRef(window._fbDb, parentPath), obj)
          .catch(function(e){ console.warn('plays write failed:', e.message); });
        _playCountTracked = true;
      }
    }
    // Real-time subscribe
    _playCountSubscribe(track);
  }
  function _playCountSubscribe(track) {
    if (_playCountUnsub) { try { _playCountUnsub(); } catch(e){} _playCountUnsub = null; }
    if (!window._fbDb || !window._fbRef || !window._fbOnValue) return;
    var path = _getPlaysPath(track);
    if (!path) return;
    _playCountUnsub = window._fbOnValue(window._fbRef(window._fbDb, path), function(snap) {
      _fpShowPlayCount(snap.exists() ? snap.val() : 0);
    });
  }
  function _playCountStop() {
    if (_playCountTimer) { clearTimeout(_playCountTimer); _playCountTimer = null; }
    if (_playCountUnsub) { try { _playCountUnsub(); } catch(e){} _playCountUnsub = null; }
    var el = document.getElementById('fpTimesPlayed');
    if (el) el.style.display = 'none';
  }
  window._playCountStart = _playCountStart;
  window._playCountStop  = _playCountStop;
  /* ── SWIPE DOWN TO CLOSE — Native feel ── */
  (function() {
    let startY = 0, startTime = 0, isDragging = false, lastDy = 0;
    const fp = fullPlayer;
    fp.addEventListener('touchstart', (e) => {
      if (!fp.classList.contains('open')) return;
      // scroll করা হচ্ছে কিনা চেক — scrollable content এর top এ থাকলেই drag চালু হবে
      const fc = fp.querySelector('.up-full-content');
      if (fc && fc.scrollTop > 2) return; // user scroll করছে, swipe না
      startY = e.touches[0].clientY;
      startTime = Date.now();
      lastDy = 0;
      isDragging = true;
      fp.style.transition = 'none';
    }, { passive: true });
    fp.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const dy = e.touches[0].clientY - startY;
      if (dy <= 0) { isDragging = false; fp.style.transition = ''; return; }
      lastDy = dy;
      // finger এর সাথে সাথে player move করে
      fp.style.transform = `translateY(${dy}px)`;
      // drag করলে mini bar একটু fade in হয়, native feel
      const progress = Math.min(dy / 200, 1);
      const miniBar = fp.querySelector('.up-mini-bar');
      if (miniBar) miniBar.style.opacity = String(progress);
    }, { passive: true });
    fp.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;
      const dy = lastDy;
      const dt = Date.now() - startTime;
      const velocity = dy / dt; // px/ms
      fp.style.transition = '';
      fp.style.transform = '';
      const miniBar = fp.querySelector('.up-mini-bar');
      if (miniBar) miniBar.style.opacity = '';
      // velocity > 0.3 px/ms = fast flick, অথবা 120px বেশি drag
      if (velocity > 0.3 || dy > 120) {
        closeFullPlayer();
      }
      // নাহলে snap back (transition restore হয়েছে)
    }, { passive: true });
  })();
  function updateFpFavBtn() {
    if (!CT.track || !fpFavBtn) return;
    var isFav = favorites.includes(String(CT.track.id));
    fpFavBtn.className = 'fp-side-btn' + (isFav ? ' faved' : '');
    fpFavBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`;
  }
  function toggleFavFromPlayer() {
    if (!currentActiveId) return;
    toggleFav(String(currentActiveId), null);
    updateFpFavBtn();
  }
  function fpShareCurrent() {
    if (typeof CT === 'undefined' || !CT.track || !CT.track.id) return;
    var id = CT.track.id;
    var hashId = (CT.track.type === 'radio') ? (CT.track._key || id) : id;
    var url = location.origin + '/share/' + hashId;
    var title = CT.track.name || 'CastFM';
    if (navigator.share) {
      var fp = document.getElementById('miniPlayer');
      if (fp) fp.style.transform = 'translateY(0)';
      navigator.share({ title: title, url: url }).finally(function() {
        if (fp) fp.style.transform = '';
      }).catch(function(){});
    } else {
      navigator.clipboard.writeText(url).then(function() {
        var btn = document.getElementById('fpShareBtn');
        if (!btn) return;
        btn.style.color = 'var(--accent)';
        setTimeout(function() { btn.style.color = ''; }, 1500);
      }).catch(function(){});
    }
  }
  window.fpShareCurrent = fpShareCurrent;
  searchInput.addEventListener('input', e => {
    const val = e.target.value;
    searchClear.classList.toggle('visible', val.length > 0);
    if (val.trim()) {
      openSearchModal(val);
    } else {
      closeSearchModal(false);
    }
  });
  function onSearchModalInput(val) {
    var mc = document.getElementById('searchModalClear');
    if (mc) mc.style.display = val.length ? 'flex' : 'none';
    // main search bar sync
    if (searchInput) { searchInput.value = val; searchClear.classList.toggle('visible', val.length > 0); }
    if (val.trim()) {
      renderUnifiedSearch(val);
    } else {
      var src = document.getElementById('searchResultsContainer');
      if (src) src.innerHTML = '';
    }
  }
  function openSearchModal(query) {
    var modal = document.getElementById('searchModal');
    if (!modal) return;
    var mi = document.getElementById('searchModalInput');
    var mc = document.getElementById('searchModalClear');
    if (mi) { mi.value = query; mi.placeholder = 'Search...'; }
    if (mc) mc.style.display = query.length ? 'flex' : 'none';
    if (!modal.classList.contains('open')) {
      modal.classList.add('open');
      document.body.classList.add('search-open');
      if (typeof _androidDisableRefresh === 'function') _androidDisableRefresh();
      lockBodyScroll();
      safeHistoryPush({ type: 'modal', modal: 'search' }, '', '#search');
      if (mi) setTimeout(function(){ mi.focus(); mi.setSelectionRange(mi.value.length, mi.value.length); }, 100);
    }
    if (query.trim()) {
      setTimeout(function(){
        var mi2 = document.getElementById('searchModalInput');
        if (mi2) mi2.value = query;
        if (typeof renderUnifiedSearch === 'function') renderUnifiedSearch(query);
        var mc2 = document.getElementById('searchModalClear');
        if (mc2) mc2.style.display = 'flex';
      }, 80);
    } else { var src = document.getElementById('searchResultsContainer'); if (src) src.innerHTML = ''; }
  }
  function closeSearchModal(clearInput) {
    var modal = document.getElementById('searchModal');
    if (!modal || !modal.classList.contains('open')) return;
    closeModalWithAnim(modal, 280, function() {
      document.body.classList.remove('search-open');
      unlockBodyScroll();
      if (typeof _androidEnableRefresh === 'function') _androidEnableRefresh();
      var mi = document.getElementById('searchModalInput');
      var mc = document.getElementById('searchModalClear');
      if (mi) mi.value = '';
      if (mc) mc.style.display = 'none';
      var src = document.getElementById('searchResultsContainer');
      if (src) src.innerHTML = '';
      if (typeof searchInput !== 'undefined') searchInput.value = '';
      if (typeof searchClear !== 'undefined') searchClear.classList.remove('visible');
      if (window.location.hash === '#search') {
        try { history.back(); } catch(e) {}
      }
    });
  }
  window.closeSearchModal = closeSearchModal;
  window.openSearchModal  = openSearchModal;
  function _attachVideoCardClicks(container) {
    container.querySelectorAll('.watch-video-card').forEach(function(card) {
      card.onclick = function(e) {
        if (e.target.closest('.fav-btn')) return;
        var key = card.dataset.wkey;
        // saved videos modal থেকে খুললে সেটা বন্ধ করে video open করব
        var svModal = document.getElementById('savedVideosModal');
        if (svModal && svModal.classList.contains('open')) {
          closeSavedVideosModal();
          switchTab('watch');
          setTimeout(function(){ openWatchVideo(key); }, 350);
          return;
        }
        closeSearchModal(false);
        // watchCatModal খোলা থাকলে modal বন্ধ না করে video open করো (back করলে modal ফিরে আসবে)
        var wcm = document.getElementById('watchCatModal');
        var fromWatchCat = wcm && wcm.classList.contains('open');
        setTimeout(function(){ openWatchVideo(key, fromWatchCat); }, 50);
      };
    });
  }
    function renderUnifiedSearch(query) {
    const q = query.toLowerCase();
    const searchList = document.getElementById('searchResultsContainer');
    if (!searchList) return;
    searchList.innerHTML = '';
    // Podcast episode filter
    const allEps = (typeof _podcastEps !== 'undefined') ? _podcastEps : [];
    const podCats = (typeof _podcastCats !== 'undefined') ? _podcastCats : [];
    const podCatMap = {};
    podCats.forEach(function(c){ podCatMap[c._key] = (c.title||'').toLowerCase(); });
    const filteredEps = allEps.filter(function(ep) {
      return (ep.title || '').toLowerCase().includes(q) ||
        (ep.desc || '').toLowerCase().includes(q) ||
        (ep.seo || '').toLowerCase().includes(q) ||
        (ep.category && podCatMap[ep.category] && podCatMap[ep.category].includes(q)) ||
        (ep.tags || '').toLowerCase().includes(q) ||
        (ep.subtitle || '').toLowerCase().includes(q) ||
        (ep.keywords || '').toLowerCase().includes(q);
    });
    // Video filter
    var vids = (typeof _watchVideos !== 'undefined') ? _watchVideos : [];
    var cats = (typeof _watchCats !== 'undefined') ? _watchCats : [];
    var catMap = {};
    cats.forEach(function(c){ catMap[c._key] = (c.title||'').toLowerCase(); });
    var filteredVids = vids.filter(function(v) {
      return (v.title||'').toLowerCase().includes(q) ||
        (v.seo||'').toLowerCase().includes(q) ||
        (v.tags||'').toLowerCase().includes(q) ||
        (v.channel||'').toLowerCase().includes(q) ||
        (v.category && catMap[v.category] && catMap[v.category].includes(q));
    });
    // Radio stations filter
    var allStations = (typeof stations !== 'undefined') ? stations : [];
    var filteredStations = allStations.filter(function(s) {
      return (s.name||'').toLowerCase().includes(q) ||
        (s.desc||'').toLowerCase().includes(q) ||
        (s.genre||'').toLowerCase().includes(q);
    });
    // Live TV channels filter
    var allChannels = (typeof _liveChannels !== 'undefined') ? _liveChannels : [];
    var filteredChannels = allChannels.filter(function(ch) {
      return (ch.name||'').toLowerCase().includes(q) ||
        (ch.desc||'').toLowerCase().includes(q);
    });
    if (!filteredEps.length && !filteredVids.length && !filteredStations.length && !filteredChannels.length) {
      searchList.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg><div>No results found</div></div>';
      return;
    }
    // Video section
    if (filteredVids.length) {
      var vLabel = document.createElement('div');
      vLabel.className = 'watch-cat-section-label';
      vLabel.innerHTML = '<span>Videos (' + filteredVids.length + ')</span>';
      searchList.appendChild(vLabel);
      var vGrid = document.createElement('div');
      vGrid.className = 'wvm-related-list';
      vGrid.style.cssText = 'margin:0;padding:4px 14px 8px;';
      var vLimit = 9;
      filteredVids.slice(0, vLimit).forEach(function(v, i) {
        if (typeof makeWatchVideoCard === 'function') vGrid.insertAdjacentHTML('beforeend', makeWatchVideoCard(v, i));
      });
      searchList.appendChild(vGrid);
      _attachVideoCardClicks(vGrid);
      if (filteredVids.length > vLimit) {
        var vMore = document.createElement('div');
        vMore.style.cssText = 'text-align:center;padding:4px 14px 16px;';
        vMore.innerHTML = '<button style="background:none;border:1.5px solid var(--border2);border-radius:20px;padding:7px 24px;font-family:\'DM Sans\',sans-serif;font-size:0.82rem;font-weight:600;color:var(--accent);cursor:pointer;">Load More</button>';
        vMore.querySelector('button').onclick = function() {
          var shown = vGrid.children.length;
          filteredVids.slice(shown, shown + 9).forEach(function(v, i) {
            if (typeof makeWatchVideoCard === 'function') vGrid.insertAdjacentHTML('beforeend', makeWatchVideoCard(v, shown + i));
          });
          _attachVideoCardClicks(vGrid);
          if (shown + 9 >= filteredVids.length) vMore.style.display = 'none';
        };
        searchList.appendChild(vMore);
      }
    }
    // Podcast section
    if (filteredEps.length) {
      var eLabel = document.createElement('div');
      eLabel.className = 'watch-cat-section-label';
      eLabel.innerHTML = '<span>Podcast (' + filteredEps.length + ')</span>';
      searchList.appendChild(eLabel);
      var eWrap = document.createElement('div');
      eWrap.className = 'pep-list';
      eWrap.style.cssText = 'padding:4px 14px 8px;';
      var eLimit = 9;
      filteredEps.slice(0, eLimit).forEach(function(ep, i) {
        eWrap.insertAdjacentHTML('beforeend', pepBuildRow(ep, i, 'pcEpPillPlay(\''+ ep._key +'\')'));
      });
      searchList.appendChild(eWrap);
      if (filteredEps.length > eLimit) {
        var eMore = document.createElement('div');
        eMore.style.cssText = 'text-align:center;padding:4px 14px 16px;';
        eMore.innerHTML = '<button style="background:none;border:1.5px solid var(--border2);border-radius:20px;padding:7px 24px;font-family:\'DM Sans\',sans-serif;font-size:0.82rem;font-weight:600;color:var(--accent);cursor:pointer;">Load More</button>';
        eMore.querySelector('button').onclick = function() {
          var shown = eWrap.children.length;
          filteredEps.slice(shown, shown + 9).forEach(function(ep, i) {
            eWrap.insertAdjacentHTML('beforeend', pepBuildRow(ep, shown + i, 'pcEpPillPlay(\''+ ep._key +'\')'));
          });
          if (shown + 9 >= filteredEps.length) eMore.style.display = 'none';
        };
        searchList.appendChild(eMore);
      }
    }
    // Live Radio section
    if (filteredStations.length) {
      var rLabel = document.createElement('div');
      rLabel.className = 'watch-cat-section-label';
      rLabel.innerHTML = '<span>Live Radio (' + filteredStations.length + ')</span>';
      searchList.appendChild(rLabel);
      var rGrid = document.createElement('div');
      rGrid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:6px 14px 12px;';
      filteredStations.forEach(function(s, i) {
        var isActive = (String(s.id) === String(typeof currentActiveId !== 'undefined' ? currentActiveId : '') && (typeof isPlaying !== 'undefined' && isPlaying));
        var imgHtml = s.img
          ? '<img src="' + s.img + '" alt="' + s.name + '" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" onload="imgLoad(this)" onerror="imgErr(this)">'
          : '<div class="tv-pill-placeholder">' + (s.name||'').substring(0,3).toUpperCase() + '</div>';
        rGrid.insertAdjacentHTML('beforeend',
          '<div class="tv-pill' + (isActive ? ' tv-active' : '') + '" id="card-' + s.id + '" style="width:100%;" onclick="handleCardPlay(\'' + s.id + '\')">'
          + '<div class="tv-pill-thumb">' + imgHtml
          + '<div class="tv-pill-live-badge"><span class="tv-live-pulse"></span>LIVE</div>'
          + '<div class="tv-pill-eq-overlay"><div class="tv-eq-bars"><div class="tv-eq-b"></div><div class="tv-eq-b"></div><div class="tv-eq-b"></div></div></div>'
          + '</div>'
          + '</div>'
        );
      });
      searchList.appendChild(rGrid);
    }
    // Live TV section
    if (filteredChannels.length) {
      var tLabel = document.createElement('div');
      tLabel.className = 'watch-cat-section-label';
      tLabel.innerHTML = '<span>Live TV (' + filteredChannels.length + ')</span>';
      searchList.appendChild(tLabel);
      var tGrid = document.createElement('div');
      tGrid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:6px 14px 24px;';
      tGrid.innerHTML = filteredChannels.map(function(ch, i) { return _makeTvPill(ch, i); }).join('');
      tGrid.querySelectorAll('.tv-pill').forEach(function(el) { el.style.width = '100%'; });
      searchList.appendChild(tGrid);
    }
  }
  window.renderUnifiedSearch = renderUnifiedSearch;
  function openSettingsModal() { openSidebar(); }
  function closeSettingsModal() { closeSidebar(); }
  window.openSettingsModal = openSettingsModal;
  window.closeSettingsModal = closeSettingsModal;
  function toggleHeaderSearch() {
    var bar = document.getElementById('headerSearchBar');
    var input = document.getElementById('searchInput');
    if (!bar) return;
    var isOpen = bar.style.display !== 'none';
    bar.style.display = isOpen ? 'none' : 'block';
    if (!isOpen && input) { input.focus(); }
  }
  function clearSearch() {
    closeSearchModal(true);
  }
  /* ── SYNC UI ── */
  function syncUI() {
    if (isPlaying) {
      miniPlayer.classList.add('playing-state');
      fullPlayer.classList.add('playing-state');
      visualizer.classList.add('playing');
    } else {
      miniPlayer.classList.remove('playing-state');
      fullPlayer.classList.remove('playing-state');
      visualizer.classList.remove('playing');
    }
    stations.forEach(s => {
      document.querySelectorAll(`#card-${s.id}, #asc-${s.id}, #asc-search-${s.id}, #bmr-${s.id}`).forEach(card => {
        card.classList.remove('loading');
        const isAct = (s.id === currentActiveId && isPlaying);
        card.classList.toggle('active', isAct);
        card.classList.toggle('tv-active', isAct);
      });
    });
    // ── PODCAST CAT EP CARD SYNC ──
    document.querySelectorAll('.pc-cat-ep-card').forEach(function(card) {
      var key = card.id.replace('pce-', '');
      var isAct = (key === currentActiveId && isPlaying);
      card.classList.toggle('playing', isAct);
    });
    // ── PODCAST EPISODE ROW SYNC ──
    document.querySelectorAll('.pep-ep-row').forEach(function(row) {
      var rowId = row.id.replace('peprow-', '');
      var isThisEp = (rowId === currentActiveId);
      row.classList.toggle('active', isThisEp && isPlaying);
      row.classList.toggle('paused', isThisEp && !isPlaying);
    });
    // ── BOOKMARK MODAL CARD SYNC ──
    document.querySelectorAll('#bookmarksModalBody .radio-card').forEach(function(card) {
      var onclick = card.getAttribute('onclick') || '';
      var match = onclick.match(/'([^']+)'\)/);
      if (match) {
        var cardId = match[1];
        var isAct = (String(cardId) === String(currentActiveId) && isPlaying);
        card.classList.toggle('active', isAct);
      }
    });
    // ── STATION CARD থেকে play হলে episode rows deactivate ──
    if (CT && CT.track && CT.track.type === 'radio') {
      document.querySelectorAll('.pep-ep-row').forEach(function(row) {
        row.classList.remove('active', 'paused');
      });
    }
    // ── Station Modal active state sync ──
    if (typeof updateStationModalActive === 'function') updateStationModalActive();
  }
  /* ── TAB SWITCH ── */
  var _tabScrollPos = { watch: 0, podcast: 0, explore: 0 };
  function switchTab(tab, fromHash) {
    // watch video modal open থাকলে — back button এর মতো কাজ করো
    if (document.getElementById('watchVideoModal') && document.getElementById('watchVideoModal').classList.contains('open')) {
      try { history.back(); } catch(e) {}
      return;
    }
    // Same tab এ click করলে smooth scroll to top
    if (tab === currentTab && !fromHash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // যেকোনো open modal থাকলে আগে বন্ধ করো (fromPopstate=true → history.back() হবে না)
    if (document.getElementById('searchModal') && document.getElementById('searchModal').classList.contains('open'))
      closeSearchModal(true);
    if (document.getElementById('watchCatModal') && document.getElementById('watchCatModal').classList.contains('open'))
      closeWatchCatModal(true);
    // watchVideoModal already handled above
    if (document.getElementById('liveTvModal') && document.getElementById('liveTvModal').classList.contains('open'))
      closeLiveTvModal(true);
    if (document.getElementById('podcastEpModal') && document.getElementById('podcastEpModal').classList.contains('open'))
      closePodcastEpModal(true);
    if (document.getElementById('allStationsModal') && document.getElementById('allStationsModal').classList.contains('open'))
      closeAllStationsModal(true);
    if (document.getElementById('listenBrowseAllModal') && document.getElementById('listenBrowseAllModal').classList.contains('open'))
      closeListenBrowseAllModal(true);
    if (document.getElementById('savedVideosModal') && document.getElementById('savedVideosModal').classList.contains('open'))
      closeSavedVideosModal(true);
    if (document.getElementById('bookmarkedEpsModal') && document.getElementById('bookmarkedEpsModal').style.display !== 'none')
      closeBookmarkedEpsModal(true);
    // বর্তমান tab এর scroll position save করো
    if (currentTab) _tabScrollPos[currentTab] = window.scrollY;
    currentTab = tab;
    // hash update — popstate থেকে call হলে আবার push করব না
    if (!fromHash) {
      var _newHash = '#' + (tab === 'podcast' ? 'listen' : tab === 'watch' ? 'watch' : tab);
      safeHistoryPush({ type: 'tab', tab: tab }, '', _newHash);
    }
    document.getElementById('pagePodcast').classList.toggle('active', tab === 'podcast');
    document.getElementById('pageWatch').classList.toggle('active', tab === 'watch');
    document.getElementById('pageExplore').classList.toggle('active', tab === 'explore');
    // নতুন tab এর scroll position restore করো
    requestAnimationFrame(function() {
      window.scrollTo(0, _tabScrollPos[tab] || 0);
    });
    // Podcast tab — pc-row গুলো dynamically render হয় তাই JS দিয়ে animate করি
    if (tab === 'podcast') {
      setTimeout(function() {
        var rows = document.querySelectorAll('#podcastCategoryList .pc-row');
        rows.forEach(function(row, i) {
          row.style.opacity    = '0';
          row.style.animation  = 'none';
          row.offsetHeight; // reflow
          row.style.animation  = 'fadeSlideIn 0.35s ease forwards';
          row.style.animationDelay = (i * 0.06) + 's';
        });
        // recent ep scroll
        var recentScroll = document.getElementById('pcRecentEpScroll');
        if (recentScroll && recentScroll.style.display !== 'none') {
          recentScroll.style.opacity   = '0';
          recentScroll.style.animation = 'none';
          recentScroll.offsetHeight;
          recentScroll.style.animation = 'fadeSlideIn 0.35s ease forwards';
        }
      }, 10);
    }
    document.getElementById('tabPodcast').classList.toggle('active', tab === 'podcast');
    document.getElementById('tabWatch').classList.toggle('active', tab === 'watch');
    document.getElementById('tabExplore').classList.toggle('active', tab === 'explore');
    // Desktop sidebar active state sync
    var dw = document.getElementById('dsbTabWatch');
    var dp = document.getElementById('dsbTabPodcast');
    var de = document.getElementById('dsbTabExplore');
    if (dw) dw.classList.toggle('active', tab === 'watch');
    if (dp) dp.classList.toggle('active', tab === 'podcast');
    if (de) de.classList.toggle('active', tab === 'explore');
    if (tab === 'watch') loadWatchVideos();
    if (tab === 'explore' && window.loadExploreNews) window.loadExploreNews();
    if (tab === 'explore' && typeof renderWatchSportsSection === 'function') renderWatchSportsSection();
  }
  /* ── THEME ── */
  function setTheme(mode) {
    if (window._fbSyncHelpers) window._fbSyncHelpers.saveTheme(mode);
    else localStorage.setItem('theme', mode);
    applyTheme(mode);
    updateSettingsUI();
  }
  function applyTheme(mode) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const useDark = mode === 'dark' || (mode === 'system' && prefersDark);
    if (useDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.background = '#000000';
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.style.background = '#000000';
    }
    // theme-color meta update (PWA / browser) — accent আপডেটে আবার set হবে
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', '#000000');
    // Android native status bar update
    if (window.AndroidBridge && window.AndroidBridge.setStatusBarColor) {
      window.AndroidBridge.setStatusBarColor('#000000');
    }
    // theme পরিবর্তনে full player gradient আপডেট করো
    const currentAccent = localStorage.getItem('accent') || 'blue';
    applyAccent(currentAccent);
  }
  function updateSettingsUI() {
    // theme pills
    const saved = localStorage.getItem('theme') || 'system';
    ['light','dark','system'].forEach(t => {
      document.getElementById('theme' + t.charAt(0).toUpperCase() + t.slice(1))
        ?.classList.toggle('active', saved === t);
    });
    // accent dots — removed (fixed blue only)
    // playback toggles
  }
  function _updateSettingsCounts() {
    var svEl  = document.getElementById('settingsSavedVidCount');
    var seEl  = document.getElementById('settingsSavedEpCount');
    var sbSvEl = document.getElementById('sbSavedVidCount');
    var sbSeEl = document.getElementById('sbSavedEpCount');
    var vc = (typeof watchFavs !== 'undefined') ? watchFavs.length : 0;
    var ec = (typeof favorites !== 'undefined') ? favorites.length : 0;
    if (svEl)   svEl.textContent   = vc || '';
    if (seEl)   seEl.textContent   = ec || '';
    if (sbSvEl) sbSvEl.textContent = vc || '';
    if (sbSeEl) sbSeEl.textContent = ec || '';
  }
  window._updateSettingsCounts = _updateSettingsCounts;
  function calcStorageUsage() {
    var el   = document.getElementById('storageUsageLabel');
    var sbEl = document.getElementById('sbStorageUsageLabel');
    if (!el && !sbEl) return;
    if (!el) el = sbEl; // fallback
    // localStorage size
    var lsTotal = 0;
    try {
      for (var key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          lsTotal += (localStorage[key].length + key.length) * 2;
        }
      }
    } catch(e) {}
    var _setStorageText = function(t) { if(el) el.textContent=t; if(sbEl) sbEl.textContent=t; };
    if (!('caches' in window)) {
      _setStorageText((lsTotal / 1024).toFixed(1) + ' KB');
      return;
    }
    var epName    = (typeof EP_CACHE_NAME    !== 'undefined') ? EP_CACHE_NAME    : 'castfm-ep-audio-v1';
    var thumbName = (typeof THUMB_CACHE_NAME !== 'undefined') ? THUMB_CACHE_NAME : 'castfm-thumb-v1';
    function getCacheSize(name) {
      return caches.open(name).then(function(cache) {
        return cache.keys().then(function(keys) {
          if (!keys.length) return 0;
          return Promise.all(keys.map(function(req) {
            return cache.match(req).then(function(res) {
              return res ? res.clone().blob().then(function(b) { return b.size; }) : 0;
            }).catch(function(){ return 0; });
          })).then(function(sizes) {
            return sizes.reduce(function(a, b) { return a + b; }, 0);
          });
        });
      }).catch(function(){ return 0; });
    }
    Promise.all([getCacheSize(epName), getCacheSize(thumbName)]).then(function(results) {
      var totalBytes = lsTotal + results[0] + results[1];
      _setStorageText(totalBytes >= 1024 * 1024
        ? (totalBytes / (1024 * 1024)).toFixed(1) + ' MB'
        : (totalBytes / 1024).toFixed(1) + ' KB');
    }).catch(function() {
      _setStorageText((lsTotal / 1024).toFixed(1) + ' KB');
    });
  }
  function clearAppCache() {
    if (!confirm('Clear cache? Bookmarks and Settings will not be deleted.')) return;
    var keep = [
      'theme', 'fontSize',
      'radio_favs', 'radio_recent'
    ];
    var toDelete = [];
    for (var key in localStorage) {
      if (localStorage.hasOwnProperty(key) && keep.indexOf(key) === -1) {
        toDelete.push(key);
      }
    }
    toDelete.forEach(function(k) { localStorage.removeItem(k); });
    // Cache API (thumbnail + audio) — confirm হলেই clear হবে
    if ('caches' in window) {
      var _epN = (typeof EP_CACHE_NAME !== 'undefined') ? EP_CACHE_NAME : 'castfm-ep-audio-v1';
      var _thN = (typeof THUMB_CACHE_NAME !== 'undefined') ? THUMB_CACHE_NAME : 'castfm-thumb-v1';
      caches.delete(_epN).catch(function() {});
      caches.delete(_thN).catch(function() {});
    }
    calcStorageUsage();
    var el   = document.getElementById('storageUsageLabel');
    var sbEl = document.getElementById('sbStorageUsageLabel');
    if (el)   { el.textContent   = 'Cleared ✓'; }
    if (sbEl) { sbEl.textContent = 'Cleared ✓'; }
    if (el || sbEl) { setTimeout(function(){ calcStorageUsage(); }, 1500); }
  }
  /* ── ACCENT COLOR — fixed blue only ── */
  function setAccent() { /* no-op: accent is fixed to blue */ }
  function applyAccent() {
    document.documentElement.removeAttribute('data-accent');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.style.setProperty('--fp-grad1', isDark ? '#0a0a0a' : 'var(--accent)');
    document.documentElement.style.setProperty('--fp-grad2', isDark ? '#111111' : 'var(--accent)');
    document.documentElement.style.setProperty('--fp-grad3', isDark ? '#050505' : 'var(--accent2)');
    const themeColor = isDark ? '#000000' : '#000000';
    const metaThemeAccent = document.querySelector('meta[name="theme-color"]');
    if (metaThemeAccent) metaThemeAccent.setAttribute('content', themeColor);
    if (window.AndroidBridge && window.AndroidBridge.setStatusBarColor) {
      window.AndroidBridge.setStatusBarColor(themeColor);
    }
  }
  /* init accent */
  applyAccent();
  /* init theme */
  applyTheme(localStorage.getItem('theme') || 'system');
  /* init settings UI — DOM ready হলে pill active state set করো */
  document.addEventListener('DOMContentLoaded', function() { updateSettingsUI(); });
  if (document.readyState !== 'loading') updateSettingsUI();
  /* ── Tap accent flash feedback ── */
  (function() {
  })();
  /* auto switch on system theme change */
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if ((localStorage.getItem('theme') || 'system') === 'system') {
      applyTheme('system');
    }
  });
  function buildCard(s, container, index = 0) {
    const isFav    = favorites.includes(String(s.id));
    const noUrl    = !s.url;
    const isActive = (s.id === currentActiveId && isPlaying);
    const card     = document.createElement('div');
    card.className = `radio-card ${isActive ? 'active' : ''} ${noUrl ? 'unavailable' : ''}`;
    card.id        = `card-${s.id}`;
    card.style.animationDelay = `${index * 45}ms`;
    if (!noUrl) card.onclick = () => handleCardPlay(s.id);
    card.innerHTML = `
      <div class="station-left">
        <div class="station-img-wrap">
          <img src="${s.img}" class="station-img" alt="${s.name}" onload="imgLoad(this)" onerror="imgErr(this)">
          <div class="img-play-overlay">
            <svg class="overlay-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            <svg class="overlay-pause" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            <div class="overlay-spinner"></div>
          </div>
          <div class="station-eq-overlay">
            <div class="station-eq">
              <div class="station-eq-b" style="height:6px"></div>
              <div class="station-eq-b" style="height:14px"></div>
              <div class="station-eq-b" style="height:9px"></div>
            </div>
          </div>
        </div>
        <div class="station-info">
          <div class="station-name">${s.name}</div>
          ${noUrl ? '<div class="station-details"><span class="badge-soon">Coming Soon</span></div>' : ''}
          ${s.desc ? `<div class="station-desc">${s.desc}</div>` : ''}
        </div>
      </div>
      <div class="station-right">
        <button class="fav-btn ${isFav ? 'faved' : ''}" id="fav-${s.id}" onclick="toggleFav('${s.id}',event)">
          <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>`;
    container.appendChild(card);
  }
  /* ── RENDER ── */
  function renderStations(query = '') {
    var scroll = document.getElementById('stationsHorizScroll');
    if (!scroll) return;
    if (!stations.length) return;
    var list = stations.slice().sort((a, b) => (a.order||0) - (b.order||0));
    // favorites আগে
    var favSet = new Set(favorites.map(String));
    list.sort(function(a, b) {
      var af = favSet.has(String(a.id)) ? 0 : 1;
      var bf = favSet.has(String(b.id)) ? 0 : 1;
      return af - bf;
    });
    scroll.innerHTML = list.slice(0, 9).map(function(s, i) {
      var isActive = (String(s.id) === String(currentActiveId) && isPlaying);
      var imgHtml = s.img
        ? '<img src="' + s.img + '" alt="' + s.name + '" onload="imgLoad(this)" onerror="imgErr(this)">'
        : '<div class="tv-pill-placeholder">' + (s.name||'').substring(0,3).toUpperCase() + '</div>';
      return '<div class="tv-pill' + (isActive ? ' tv-active' : '') + '" id="card-' + s.id + '" style="animation-delay:' + (i*45) + 'ms;" onclick="handleCardPlay(\'' + s.id + '\')">'
        + '<div class="tv-pill-thumb">'
        + imgHtml
        + '<div class="tv-pill-live-badge"><span class="tv-live-pulse"></span>LIVE</div>'
        + '<div class="tv-pill-eq-overlay"><div class="tv-eq-bars"><div class="tv-eq-b"></div><div class="tv-eq-b"></div><div class="tv-eq-b"></div></div></div>'
        + '</div>'
        + '</div>';
    }).join('');
    var sis = document.getElementById('stationsInlineSection');
    var asl = document.getElementById('allStationsLabel');
    if (sis) sis.style.display = list.length ? '' : 'none';
    if (asl) asl.style.display = list.length ? 'flex' : 'none';
    if (typeof renderPodcastCategories === 'function') renderPodcastCategories();
  }
  /* ── PLAY ── */
  function handleCardPlay(stationId) {
    // String(id) comparison — Firebase key could be string or number
    const s = stations.find(x => String(x.id) === String(stationId));
    if (!s || !s.url) return;
    if (String(currentActiveId) === String(stationId)) { toggleMiniPlay(); return; }
    startStation(s);
  }
  function startStation(s) {
    if (navigator.vibrate) navigator.vibrate(40);
    CT.stop();
    CT.set({ type: 'radio', id: s.id, _key: s._key || s.id, name: s.name, img: s.img || '', genre: s.genre + (s.lang ? ' · ' + s.lang : ''), desc: s.desc || '' });
    history.replaceState(history.state, '', '#' + (s._key || s.id));
    if (currentActiveId) {
      document.querySelectorAll(`#card-${currentActiveId}`).forEach(c => c.classList.remove('active','loading'));
    }
    currentActiveId = s.id;
    document.querySelectorAll(`#card-${s.id}`).forEach(c => { c.classList.remove('active'); c.classList.add('loading'); });
    CT.audioEl.src = s.url;
    CT.audioEl.volume = 0.8;
    CT.audioEl.play().then(() => {
      isPlaying = true;
      liveStartTime = Date.now();
      document.querySelectorAll(`#card-${s.id}`).forEach(c => { c.classList.remove('loading'); c.classList.add('active'); });
      miniName.textContent = s.name;
      miniPlayer.classList.add('visible'); document.body.classList.add('mini-visible');
      startTimeTracking();
      updateMediaSession(s);
      updatePlayerUI();
      syncUI();
      if (typeof _playCountStart === 'function') _playCountStart();
      // Station modal active state refresh
      if (typeof updateStationModalActive === 'function') updateStationModalActive();
    }).catch(() => {
      document.querySelectorAll(`#card-${s.id}`).forEach(c => c.classList.remove('loading','active'));
      currentActiveId = null; isPlaying = false; syncUI();
      if (typeof updateStationModalActive === 'function') updateStationModalActive();
    });
  }
  function skipStation(dir) {
    const avail = stations.filter(s => s.url);
    if (!avail.length) return;
    if (!currentActiveId) { startStation(avail[0]); return; }
    const idx  = avail.findIndex(s => String(s.id) === String(currentActiveId));
    const next = avail[(idx + dir + avail.length) % avail.length];
    startStation(next);
  }
  /* ── TOGGLEPLAY ── */
  function toggleMiniPlay() {
    if (!CT.track) return;
    if (CT.audioEl.paused) {
      if (navigator.vibrate) navigator.vibrate(40);
      const cardEls = document.querySelectorAll('#card-' + CT.track.id);
      cardEls.forEach(c => c.classList.add('loading'));
      CT.audioEl.play().then(() => {
        isPlaying = true;
        if (CT.track && CT.track.type === 'radio') liveStartTime = Date.now();
        cardEls.forEach(c => { c.classList.remove('loading'); c.classList.add('active'); });
        miniPlayer.classList.add('playing-state');
        startTimeTracking();
        syncUI();
      }).catch(() => {
        cardEls.forEach(c => c.classList.remove('loading'));
      });
    } else {
      if (navigator.vibrate) navigator.vibrate(40);
      CT.audioEl.pause();
      isPlaying = false;
      stopTimeTracking();
      syncUI();
    }
  }
  /* ── MUSIC CARD PLAY ── */
  var musicCards = []; // music cards feature removed
  function handleMusicCardPlay(id) {
    const c = musicCards.find(x => x.id === id);
    if (!c || !c.url) return;
    if (currentActiveId === id && CT.track && CT.track.type === 'mp3') { toggleMiniPlay(); return; }
    CT.stop();
    CT.set({ type: 'mp3', id: c.id, name: c.name, img: c.img || '', genre: c.genre || 'Podcast' });
    currentActiveId = id;
    document.querySelectorAll('#card-' + id).forEach(el => el.classList.add('loading'));
    CT.play(c.url).then(() => {
      isPlaying = true;
      document.querySelectorAll('#card-' + id).forEach(el => { el.classList.remove('loading'); el.classList.add('active'); });
      miniName.textContent = c.name;
      miniPlayer.classList.add('visible', 'playing-state'); document.body.classList.add('mini-visible');
      updateMediaSession({ name: c.name, img: c.img || '', genre: c.genre || 'Podcast' });
      startTimeTracking();
      updatePlayerUI(); syncUI();
    }).catch(e => {
      document.querySelectorAll('#card-' + id).forEach(el => el.classList.remove('loading'));
      currentActiveId = null;
    });
  }
  /* ── FAVOURITE ── */
  function toggleFav(id, e) {
    if (e) e.stopPropagation();
    id = String(id);
    const idx = favorites.indexOf(id);
    if (idx >= 0) favorites.splice(idx,1); else favorites.push(id);
    localStorage.setItem('radio_favs', JSON.stringify(favorites));
    syncFavoritesToFirebase();
    const isFav = favorites.includes(id);
    document.querySelectorAll(`[id="fav-${id}"]`).forEach(btn => {
      btn.className = `fav-btn ${isFav ? 'faved' : ''}`;
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>`;
    });
    if(document.getElementById("savedVideosModal").classList.contains("open"))renderSavedVideosModal(_savedVidsFiltered);if(document.getElementById("bookmarkedEpsModal").style.display==="flex")renderBookmarkedEpsModal(_bookmarkedEpsFiltered);
  }
  /* ── MEDIA SESSION ── */
  function updateMediaSession(s) {
    var imgSrc = (s.img && !s.img.startsWith('data:')) ? s.img : (s.img || '');
    if (!('mediaSession' in navigator)) return;
    var artworkArr = imgSrc ? [
      { src: imgSrc, sizes: '96x96',   type: 'image/jpeg' },
      { src: imgSrc, sizes: '200x200', type: 'image/jpeg' },
      { src: imgSrc, sizes: '512x512', type: 'image/jpeg' }
    ] : [];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: s.name || '—', artist: 'Cast FM',
      album: s.genre || '',
      artwork: artworkArr
    });
    var el = CT.audioEl;
    navigator.mediaSession.setActionHandler('play',          () => el.play().catch(() => {}));
    navigator.mediaSession.setActionHandler('pause',         () => el.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => fpSkipPrev());
    navigator.mediaSession.setActionHandler('nexttrack',     () => fpSkipNext());
    navigator.mediaSession.playbackState = 'playing';
    // Android media command handler
    window._mediaCmd = function(cmd) {
      var el = CT && CT.audioEl;
      if (!el) return;
      if (cmd === 'play')  el.play().catch(function(){});
      if (cmd === 'pause') el.pause();
      if (cmd === 'next')  fpSkipNext && fpSkipNext();
      if (cmd === 'prev')  fpSkipPrev && fpSkipPrev();
      if (cmd === 'stop')  { el.pause(); el.src = ''; }
    };
  }
  /* ── AUDIO EVENTS ── */
  // ── CT Audio Events ──
  function onAudioPlay() {
    isPlaying = true;
    miniPlayer.classList.add('visible', 'playing-state'); document.body.classList.add('mini-visible');
    fullPlayer.classList.add('playing-state');
    if (CT.track && (CT.track.type === 'mp3' || CT.track.type === 'podcast_ep')) startTimeTracking();
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    updatePlayerUI(); syncUI();
    // ── 4. KEEP SCREEN ON — playback শুরু হলে ──
    if (window.AndroidBridge && window.AndroidBridge.setKeepScreenOn) window.AndroidBridge.setKeepScreenOn(true);
  }
  function onAudioPause() {
    isPlaying = false;
    miniPlayer.classList.remove('visible', 'playing-state');
    document.body.classList.remove('mini-visible');
    fullPlayer.classList.remove('playing-state');
    stopTimeTracking();
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    updatePlayerUI(); syncUI();
    // ── 4. KEEP SCREEN ON — pause হলে release ──
    if (window.AndroidBridge && window.AndroidBridge.setKeepScreenOn) window.AndroidBridge.setKeepScreenOn(false);
  }
  function onAudioEnded() {
    // ── AUTO NEXT: category-এর পরের track play করো ──
    if (CT.track) {
      var type = CT.track.type;
      if (type === 'podcast_ep') {
        var list = (_pepCurrentEps && _pepCurrentEps.length) ? _pepCurrentEps : (_podcastEps || []);
        var idx = list.findIndex(function(e) { return e._key === CT.track.id; });
        if (idx >= 0 && idx < list.length - 1) {
          var nextIdx = idx + 1;
          _pepCurrentIdx = nextIdx;
          setTimeout(function() { pepPlayEp(nextIdx); }, 400);
          return;
        }
      } else if (type === 'mp3') {
        var avail = musicCards.filter(function(c) { return c.url; });
        var idx = avail.findIndex(function(c) { return c.id === CT.track.id; });
        if (idx >= 0 && idx < avail.length - 1) {
          var nextCard = avail[idx + 1];
          setTimeout(function() { handleMusicCardPlay(nextCard.id); }, 400);
          return;
        }
      }
    }
    // list শেষ — সব বন্ধ করো
    isPlaying = false;
    miniPlayer.classList.remove('visible','playing-state'); document.body.classList.remove('mini-visible');
    fullPlayer.classList.remove('playing-state');
    currentActiveId = null;
    stopTimeTracking();
    CT.track = null;
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
    syncUI(); updatePlayerUI();
    // ── 4. KEEP SCREEN ON — ended হলে release ──
    if (window.AndroidBridge && window.AndroidBridge.setKeepScreenOn) window.AndroidBridge.setKeepScreenOn(false);
  }
  audio.addEventListener('play',   onAudioPlay);
  audio.addEventListener('pause',  onAudioPause);
  audio.addEventListener('ended',  onAudioEnded);
  audio.addEventListener('timeupdate', function() {
    if (CT.track && CT.track.type === 'podcast_ep' && audio.currentTime > 5) {
      if (!audio._lastSaved || audio.currentTime - audio._lastSaved >= 5) {
        audio._lastSaved = audio.currentTime;
        if (window._fbSyncHelpers) window._fbSyncHelpers.saveEpProgress(CT.track.id, audio.currentTime);
        else localStorage.setItem('ep_progress_' + CT.track.id, audio.currentTime);
      }
    }
  });
  audio.addEventListener('ended', function() {
    if (CT.track && CT.track.type === 'podcast_ep') {
      if (window._fbSyncHelpers) window._fbSyncHelpers.removeEpProgress(CT.track.id);
      else localStorage.removeItem('ep_progress_' + CT.track.id);
    }
  });
  // Save when user leaves or hides app
  document.addEventListener('visibilitychange', () => {
    // ভিজিবিলিটি দিয়ে tracking বন্ধ হবে না — প্লে চললে সবসময় count হবে
  });
  /* ── INIT ── */
  const header = document.querySelector('header');
  const scrollEl = document.body.classList.contains('is-desktop')
    ? document.querySelector('.wrap') : window;
  renderStations();
  // ── HEADER INLINE SEARCH ──
  var _headerSearchHistoryPushed = false;
  function openHeaderSearch() {
    if (document.getElementById('sidebar').classList.contains('open')) closeSidebar();
    var expand = document.getElementById('headerSearchExpand');
    var inner = document.getElementById('headerInner');
    var input = document.getElementById('headerInlineInput');
    var overlay = document.getElementById('headerSearchOverlay');
    expand.classList.add('open');
    inner.classList.add('search-open');
    if (overlay) overlay.classList.add('open');
    // history state push — back button দিয়ে close হবে
    if (!_headerSearchHistoryPushed) {
      safeHistoryPush({ type: 'headerSearch' }, '', window.location.hash || '#');
      _headerSearchHistoryPushed = true;
    }
    setTimeout(function() {
      input.focus();
      _headerSuggest('');
    }, 150);
  }
  function closeHeaderSearch() {
    var expand = document.getElementById('headerSearchExpand');
    var inner = document.getElementById('headerInner');
    var input = document.getElementById('headerInlineInput');
    var overlay = document.getElementById('headerSearchOverlay');
    expand.classList.remove('open');
    inner.classList.remove('search-open');
    if (overlay) overlay.classList.remove('open');
    input.blur();
    input.value = '';
    _headerSearchHistoryPushed = false;
  }
  function _headerSearchSubmit() {
    var val = document.getElementById('headerInlineInput').value.trim();
    if (!val) { closeHeaderSearch(); return; }
    // ── save to history ──
    _sgSaveHistory(val);
    closeHeaderSearch();
    setTimeout(function() {
      var mi = document.getElementById('searchModalInput');
      var mc = document.getElementById('searchModalClear');
      var modal = document.getElementById('searchModal');
      if (!modal) return;
      if (!modal.classList.contains('open')) {
        modal.classList.add('open');
        document.body.classList.add('search-open');
        lockBodyScroll();
        safeHistoryPush({ type: 'modal', modal: 'search' }, '', '#search');
      }
      if (mi) mi.value = val;
      if (mc) mc.style.display = 'flex';
      if (typeof renderUnifiedSearch === 'function') renderUnifiedSearch(val);
    }, 80);
  }
  window.openHeaderSearch   = openHeaderSearch;
  window.closeHeaderSearch  = closeHeaderSearch;
  window._headerSearchSubmit = _headerSearchSubmit;
  // ── SEARCH HISTORY ──
  var _SG_HISTORY_KEY = 'castfm_search_history';
  var _SG_HISTORY_MAX = 8;
  function _sgGetHistory() {
    try { return JSON.parse(localStorage.getItem(_SG_HISTORY_KEY) || '[]'); } catch(e) { return []; }
  }
  function _sgSaveHistory(q) {
    if (!q) return;
    var h = _sgGetHistory().filter(function(x) { return x.toLowerCase() !== q.toLowerCase(); });
    h.unshift(q);
    if (h.length > _SG_HISTORY_MAX) h = h.slice(0, _SG_HISTORY_MAX);
    try { localStorage.setItem(_SG_HISTORY_KEY, JSON.stringify(h)); } catch(e) {}
  }
  function _sgDeleteHistory(q) {
    var h = _sgGetHistory().filter(function(x) { return x !== q; });
    try { localStorage.setItem(_SG_HISTORY_KEY, JSON.stringify(h)); } catch(e) {}
  }
  function _sgClearHistory() {
    try { localStorage.removeItem(_SG_HISTORY_KEY); } catch(e) {}
  }
  // ── SEARCH SUGGESTIONS ──
  function _headerSuggest(val) {
    var sg = document.getElementById('searchSuggestions');
    if (!sg) return;
    var q = (val || '').trim().toLowerCase();
    // কিছু লেখা থাকলে — suggestions দেখাও
    if (q.length >= 2) {
      var results = [];
      var seen = {};
      var LIMIT = 6;
      function _sgPush(title, key) {
        if (results.length >= LIMIT) return;
        if (seen[key]) return;
        seen[key] = true;
        results.push({ title: title, key: key });
      }
      // Videos — title, description, seo
      if (typeof _watchVideos !== 'undefined') {
        _watchVideos.forEach(function(v) {
          if (results.length >= LIMIT) return;
          if ((v.title||'').toLowerCase().includes(q) ||
              (v.seo||'').toLowerCase().includes(q))
            _sgPush(v.title, v.title);
        });
      }
      // Episodes — title, description (desc), seo
      if (typeof _podcastEps !== 'undefined') {
        _podcastEps.forEach(function(ep) {
          if (results.length >= LIMIT) return;
          if ((ep.title||'').toLowerCase().includes(q) ||
              (ep.desc||'').toLowerCase().includes(q) ||
              (ep.seo||'').toLowerCase().includes(q))
            _sgPush(ep.title, ep.title);
        });
      }
      // Watch Categories — title, description, seo
      if (typeof _watchCats !== 'undefined') {
        _watchCats.forEach(function(c) {
          if (results.length >= LIMIT) return;
          if ((c.title||'').toLowerCase().includes(q) ||
              (c.description||'').toLowerCase().includes(q) ||
              (c.seo||'').toLowerCase().includes(q))
            _sgPush(c.title, c.title);
        });
      }
      // Podcast Categories — title, description, seo
      if (typeof _podcastCats !== 'undefined') {
        _podcastCats.forEach(function(c) {
          if (results.length >= LIMIT) return;
          if ((c.title||'').toLowerCase().includes(q) ||
              (c.description||'').toLowerCase().includes(q) ||
              (c.seo||'').toLowerCase().includes(q))
            _sgPush(c.title, c.title);
        });
      }
      // Radio Stations — name, desc, genre
      if (typeof stations !== 'undefined') {
        stations.forEach(function(s) {
          if (results.length >= LIMIT) return;
          if ((s.name||'').toLowerCase().includes(q) ||
              (s.desc||'').toLowerCase().includes(q) ||
              (s.genre||'').toLowerCase().includes(q))
            _sgPush(s.name, s.name);
        });
      }
      // TV Channels — name, desc
      if (typeof _liveChannels !== 'undefined') {
        _liveChannels.forEach(function(ch) {
          if (results.length >= LIMIT) return;
          if ((ch.name||'').toLowerCase().includes(q) ||
              (ch.desc||'').toLowerCase().includes(q))
            _sgPush(ch.name, ch.name);
        });
      }
      if (!results.length) { sg.classList.remove('open'); sg.innerHTML = ''; return; }
      var arrowSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>';
      sg.innerHTML = '<div class="sg-history-header"><span class="sg-history-label">Suggestions</span></div>'
        + results.map(function(r) {
        return '<div class="sg-item" onclick="_headerSuggestPick(\'' + r.key.replace(/'/g, "\\'") + '\')">'
          + '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;">' + r.title + '</span>'
          + '<span class="sg-suggest-arrow">' + arrowSVG + '</span>'
          + '</div>';
      }).join('');
      sg.classList.add('open');
      return;
    }
    // input খালি — history দেখাও
    if (q.length === 0) {
      var hist = _sgGetHistory();
      if (!hist.length) { sg.classList.remove('open'); sg.innerHTML = ''; return; }
      var histSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5.66"/></svg>';
      var delSVG  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      var html = '<div class="sg-history-header">'
        + '<span class="sg-history-label">Recent Searches</span>'
        + '<button class="sg-history-clear" onclick="_sgClearAllHistory()">Clear all</button>'
        + '</div>';
      html += hist.map(function(h) {
        var esc = h.replace(/'/g, "\\'");
        return '<div class="sg-history-item">'
          + '<span class="sg-history-icon">' + histSVG + '</span>'
          + '<span class="sg-history-text" onclick="_headerSuggestPick(\'' + esc + '\')">' + h + '</span>'
          + '<button class="sg-history-del" onclick="_sgRemoveOneHistory(\'' + esc + '\')" title="Remove">' + delSVG + '</button>'
          + '</div>';
      }).join('');
      sg.innerHTML = html;
      sg.classList.add('open');
      return;
    }
    // 1 character — hide
    sg.classList.remove('open');
    sg.innerHTML = '';
  }
  function _sgClearAllHistory() {
    _sgClearHistory();
    var sg = document.getElementById('searchSuggestions');
    if (sg) { sg.classList.remove('open'); sg.innerHTML = ''; }
  }
  function _sgRemoveOneHistory(q) {
    _sgDeleteHistory(q);
    // re-render history panel
    _headerSuggest('');
  }
  function _headerSuggestPick(val) {
    document.getElementById('searchSuggestions').classList.remove('open');
    document.getElementById('headerInlineInput').value = val;
    _headerSearchSubmit();
  }
  function _hideSuggestions() {
    var sg = document.getElementById('searchSuggestions');
    if (sg) { sg.classList.remove('open'); sg.innerHTML = ''; }
  }
  // close suggestions on closeHeaderSearch
  var _origCloseHeaderSearch = closeHeaderSearch;
  closeHeaderSearch = function() {
    _origCloseHeaderSearch();
    _hideSuggestions();
  };
  window.closeHeaderSearch = closeHeaderSearch;
  window._headerSuggest = _headerSuggest;
  window._headerSuggestPick = _headerSuggestPick;
  window._sgClearAllHistory = _sgClearAllHistory;
  window._sgRemoveOneHistory = _sgRemoveOneHistory;
  // ── LONG PRESS DELETE ──
  var _lpCurrent = null; // { key, type: 'video'|'episode', title }
  function _lpOpen(key, type, title) {
    _lpCurrent = { key: key, type: type };
    var sheet = document.getElementById('lpDeleteSheet');
    var titleEl = document.getElementById('lpItemTitle');
    if (titleEl) titleEl.textContent = title || '';
    if (sheet) sheet.classList.add('open');
    lockBodyScroll();
  }
  function _lpClose() {
    var sheet = document.getElementById('lpDeleteSheet');
    if (sheet) sheet.classList.remove('open');
    unlockBodyScroll();
    _lpCurrent = null;
  }
  function _lpConfirmDelete() {
    if (!_lpCurrent) return;
    var key = _lpCurrent.key;
    var type = _lpCurrent.type;
    _lpClose();
    if (type === 'video') {
      // no-op: watch history removed
    } else {
      var row = document.getElementById('peprow-' + key);
      if (row) {
        row.style.transition = 'opacity 0.2s, max-height 0.25s, margin 0.25s, padding 0.25s';
        row.style.opacity = '0';
        row.style.maxHeight = row.offsetHeight + 'px';
        setTimeout(function() {
          row.style.maxHeight = '0';
          row.style.margin = '0';
          row.style.padding = '0';
          row.style.overflow = 'hidden';
          setTimeout(function(){ row.remove(); if (typeof renderSidebarCats === 'function') renderSidebarCats(); }, 260);
        }, 200);
      }
    }
  }
  function attachLongPress(el, key, type, title) {
    var timer = null;
    var moved = false;
    el.addEventListener('touchstart', function(e) {
      moved = false;
      timer = setTimeout(function() {
        if (!moved) {
          navigator.vibrate && navigator.vibrate(40);
          _lpOpen(key, type, title);
        }
      }, 500);
    }, { passive: true });
    el.addEventListener('touchmove', function() { moved = true; clearTimeout(timer); }, { passive: true });
    el.addEventListener('touchend', function() { clearTimeout(timer); }, { passive: true });
    el.addEventListener('touchcancel', function() { clearTimeout(timer); }, { passive: true });
  }
  window._lpClose = _lpClose;
  window._lpConfirmDelete = _lpConfirmDelete;
  window.attachLongPress = attachLongPress;
  // ── 2. NETWORK STATE BRIDGE ──
  window._onNetworkChange = function(isOnline) {
    var bar = document.getElementById('offlineBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'offlineBar';
      bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;padding:8px 16px;text-align:center;font-size:0.82rem;font-weight:600;font-family:"DM Sans",sans-serif;transition:transform 0.3s ease,opacity 0.3s ease;transform:translateY(-100%);opacity:0;';
      document.body.appendChild(bar);
    }
    if (isOnline) {
      bar.textContent = '✓ ইন্টারনেট সংযোগ ফিরে এসেছে';
      bar.style.background = '#22C55E';
      bar.style.color = '#fff';
      bar.style.transform = 'translateY(0)';
      bar.style.opacity = '1';
      setTimeout(function() {
        bar.style.transform = 'translateY(-100%)';
        bar.style.opacity = '0';
      }, 2500);
    } else {
      bar.textContent = '⚠ ইন্টারনেট সংযোগ নেই';
      bar.style.background = '#EF4444';
      bar.style.color = '#fff';
      bar.style.transform = 'translateY(0)';
      bar.style.opacity = '1';
    }
  };
/* ═══════════════════════════════════════════════ */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
  /* ── FIREBASE AUTH & STATS ── */
  let currentUser = null;
  function firebaseLogin() {
    if (!window._fbSignIn) { console.warn('Firebase not ready'); return; }
    window._fbSignIn().catch(err => console.error('Login error:', err));
  }
  window.addEventListener('load', function() {
    if (window._fbGetRedirectResult) {
      window._fbGetRedirectResult().then(function(result) {
        if (result && result.user) {
          console.log('Redirect login success:', result.user.email);
        }
      }).catch(function(err) {
        console.error('Redirect result error:', err);
      });
    }
  });
  function firebaseLogout() {
    if (!window._fbSignOut) return;
    window._fbSignOut();
  }
  window.onFirebaseUser = async function(user) {
    currentUser = user;
    if (user) {
      var sbOut = document.getElementById('sbProfileLoggedOut');
      var sbIn  = document.getElementById('sbProfileLoggedIn');
      var sbPh  = document.getElementById('sbProfilePhoto');
      var sbNm  = document.getElementById('sbProfileName');
      var sbMs  = document.getElementById('sbProfileMemberSince');
      if (sbOut) sbOut.style.display = 'none';
      if (sbIn)  sbIn.style.display  = 'flex';
      if (sbPh)  sbPh.src            = user.photoURL || '';
      if (sbNm)  sbNm.textContent    = user.displayName || '';
      if (sbMs)  sbMs.textContent    = '';
      // Desktop sidebar profile update
      var dsbPName = document.getElementById('dsbProfileName');
      if (dsbPName) dsbPName.textContent = (user.displayName || '').split(' ')[0] || 'Profile';
      // Load favorites from Firebase
      try {
        const snap = await window._fbGet(window._fbRef(window._fbDb, `users/${user.uid}/favorites`));
        if (snap.exists() && Array.isArray(snap.val())) {
          favorites = snap.val();
          localStorage.setItem('radio_favs', JSON.stringify(favorites));
          // শুধু fav button গুলো update করো — পুরো re-render দরকার নেই
          stations.forEach(s => {
            const btn = document.getElementById('fav-' + s.id);
            if (!btn) return;
            const isFav = favorites.includes(String(s.id));
            btn.classList.toggle('faved', isFav);
            btn.querySelector('svg').setAttribute('fill', isFav ? 'currentColor' : 'none');
          });
        }
      } catch(e) { console.error('Fav load error:', e); }
      // Load watch favs from Firebase
      try {
        const wsnap = await window._fbGet(window._fbRef(window._fbDb, 'users/' + user.uid + '/watch_favs'));
        if (wsnap.exists() && Array.isArray(wsnap.val())) {
          watchFavs = wsnap.val();
          localStorage.setItem('watch_favs', JSON.stringify(watchFavs));
          // fav button UI update
          watchFavs.forEach(function(key) {
            var btn = document.getElementById('wfav-' + key);
            if (btn) {
              btn.className = 'fav-btn faved';
              var svg = btn.querySelector('svg');
              if (svg) svg.setAttribute('fill', 'currentColor');
            }
          });
          // sidebar saved count update
          var sbCount = document.getElementById('sbSavedVidCount');
          if (sbCount) sbCount.textContent = watchFavs.length || '';
        }
      } catch(e) { console.error('Watch fav load error:', e); }
      // Load tv favs from Firebase
      try {
        const tvsnap = await window._fbGet(window._fbRef(window._fbDb, 'users/' + user.uid + '/tv_favs'));
        if (tvsnap.exists() && Array.isArray(tvsnap.val())) {
          tvFavs = tvsnap.val();
          localStorage.setItem('tv_favs', JSON.stringify(tvFavs));
        }
      } catch(e) { console.error('TV fav load error:', e); }
      // Load For You filters
      try {
        const fysnap = await window._fbGet(window._fbRef(window._fbDb, 'users/' + user.uid + '/fy_filter'));
        if (fysnap.exists() && Array.isArray(fysnap.val())) {
          _fySelectedCats = fysnap.val();
          if (typeof _fyBuildPool === 'function') {
            _fyPool = _fyBuildPool(_fySelectedCats); _fyShown = 0;
            if (typeof _fyLoadMore === 'function') { var g = document.getElementById('forYouGrid'); if(g) g.innerHTML=''; _fyLoadMore(); }
          }
        }
      } catch(e) {}
      try {
        const lfysnap = await window._fbGet(window._fbRef(window._fbDb, 'users/' + user.uid + '/lfy_filter'));
        if (lfysnap.exists() && Array.isArray(lfysnap.val())) {
          _lfySelectedTags = lfysnap.val();
          if (typeof _lfyBuildPool === 'function') {
            _lfyPool = _lfyBuildPool(_lfySelectedTags); _lfyShown = 0;
            if (typeof _lfyLoadMore === 'function') { var g = document.getElementById('listenForYouGrid'); if(g) g.innerHTML=''; _lfyLoadMore(); }
          }
        }
      } catch(e) {}
      loadUserMeta(user);
      loadUserDataFromFirebase(user);
    } else {
      var sbOut2 = document.getElementById('sbProfileLoggedOut');
      var sbIn2  = document.getElementById('sbProfileLoggedIn');
      if (sbOut2) sbOut2.style.display = 'flex';
      if (sbIn2)  sbIn2.style.display  = 'none';
      currentUser = null;
      // Desktop sidebar profile reset
      var dsbPName2 = document.getElementById('dsbProfileName');
      if (dsbPName2) dsbPName2.textContent = 'Login';

    }
  };
  // ══════════════════════════════════════
  // FIREBASE SYNC HELPERS
  // ══════════════════════════════════════
  function fbSet(path, val) {
    if (!currentUser || !window._fbDb) return;
    window._fbSet(window._fbRef(window._fbDb, 'users/' + currentUser.uid + '/' + path), val).catch(function(){});
  }
  function fbGet(path, cb) {
    if (!currentUser || !window._fbDb) return;
    window._fbGet(window._fbRef(window._fbDb, 'users/' + currentUser.uid + '/' + path))
      .then(function(snap) { if (snap.exists()) cb(snap.val()); })
      .catch(function(){});
  }
  // Episode progress
  function saveEpProgress(epKey, time) {
    var lsKey = 'ep_progress_' + epKey;
    localStorage.setItem(lsKey, time);
    fbSet('ep_progress/' + epKey, time);
  }
  function removeEpProgress(epKey) {
    localStorage.removeItem('ep_progress_' + epKey);
    if (currentUser && window._fbDb) {
      window._fbSet(window._fbRef(window._fbDb, 'users/' + currentUser.uid + '/ep_progress/' + epKey), null).catch(function(){});
    }
  }
  function loadEpProgress(epKey, cb) {
    var local = parseFloat(localStorage.getItem('ep_progress_' + epKey) || '0');
    if (currentUser && window._fbDb) {
      fbGet('ep_progress/' + epKey, function(val) { cb(parseFloat(val) || local); });
    } else {
      cb(local);
    }
  }
  // Theme & Accent
  function saveTheme(val) {
    localStorage.setItem('theme', val);
    fbSet('prefs/theme', val);
  }
  function saveAccent() { /* no-op: accent fixed to blue */ }
  window._fbSyncHelpers = { saveEpProgress, removeEpProgress, loadEpProgress, saveTheme, saveAccent, fbSet, fbGet };
  function loadUserDataFromFirebase(user) {
    if (!user || !window._fbDb) return;
    // Theme & Accent
    window._fbGet(window._fbRef(window._fbDb, 'users/' + user.uid + '/prefs'))
      .then(function(snap) {
        if (!snap.exists()) return;
        var prefs = snap.val();
        if (prefs.theme) { localStorage.setItem('theme', prefs.theme); applyTheme(prefs.theme); }
        if (prefs.accent) { /* accent fixed to blue, ignore saved prefs */ }
        updateSettingsUI();
      }).catch(function(){});
  }
  window.loadUserDataFromFirebase = loadUserDataFromFirebase;
  function syncFavoritesToFirebase() {
    if (!currentUser || !window._fbDb) return;
    try {
      window._fbSet(window._fbRef(window._fbDb, `users/${currentUser.uid}/favorites`), favorites);
    } catch(e) { console.error('Fav sync error:', e); }
  }
  function getTodayKey() { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); }
  // সপ্তাহের শুরু — শনিবার থেকে
  async function loadUserMeta(user) {
    if (!user || !window._fbDb) return;
    const db  = window._fbDb;
    const ref = window._fbRef;
    // Member Since — Firebase Auth creationTime
    const creationTime = user.metadata && user.metadata.creationTime;
    if (creationTime) {
      const d = new Date(creationTime);
      const shortMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const day = toBanglaNum(d.getDate());
      const month = shortMonths[d.getMonth()];
      const year = toBanglaNum(d.getFullYear());
      const label = day + ' ' + month + ' ' + year;
      var sbMs2 = document.getElementById('sbProfileMemberSince');
      if (sbMs2) sbMs2.textContent = label;
    }
    // Visit Points — প্রতিদিন একবার ভিজিট = +১, কখনো কমে না
    const todayKey = getTodayKey();
    const streakRef = ref(db, `users/${user.uid}/streak`);
    const streakSnap = await window._fbGet(streakRef).catch(()=>null);
    let currentCount = 0;
    if (streakSnap && streakSnap.exists()) {
      const data = streakSnap.val();
      currentCount = data.count || 0;
      if ((data.lastDay || '') !== todayKey) {
        currentCount = currentCount + 1;
        window._fbSet(streakRef, { count: currentCount, lastDay: todayKey }).catch(()=>{});
      }
    } else {
      currentCount = 1;
      window._fbSet(streakRef, { count: 1, lastDay: todayKey }).catch(()=>{});
    }
    renderStreak(currentCount);
  }
  function toBanglaNum(n) {
    const bn = ['0','1','2','3','4','5','6','7','8','9'];
    return String(n).replace(/\d/g, d => bn[d]);
  }
  function renderStreak(count) {
    // streak display removed (settings page gone)
  }
  /* ── VISITOR TRACKING (TTL Heartbeat) ── */
  (function initVisitors() {
    const HEARTBEAT_INTERVAL = 20000; // প্রতি ২০ সেকেন্ডে update
    const TTL_MS             = 45000; // ৪৫ সেকেন্ড পুরনো = offline
    const wait = setInterval(() => {
      if (!window._fbDb || !window._fbRef || !window._fbSet || !window._fbOnValue ||
          !window._fbGet || !window._fbIncrement || !window._fbUpdate) return;
      clearInterval(wait);
      const db        = window._fbDb;
      const ref       = window._fbRef;
      const todayKey  = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
      const sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const onlineRef = ref(db, `visitors/online/${sessionId}`);
      const todayRef  = ref(db, `visitors/counts/today_${todayKey}`);
      const totalRef  = ref(db, `visitors/counts/total`);
      // নিজেকে online mark করো (timestamp সহ)
      // disconnect হলে Firebase নিজেই entry মুছে দেবে
      if (window._fbOnDisconnect) {
        window._fbOnDisconnect(onlineRef).remove().catch(() => {});
      }
      function heartbeat() {
        const audioPlaying = (typeof audio !== 'undefined' && !audio.paused) ||
                             (typeof audio2 !== 'undefined' && !audio2.paused);
        if (!document.hidden || audioPlaying) {
          window._fbSet(onlineRef, { t: Date.now() }).catch(() => {});
        }
      }
      heartbeat();
      const hbInterval = setInterval(heartbeat, HEARTBEAT_INTERVAL);
      // Increment visit count once per session
      const visitedKey = `visited_${todayKey}`;
      if (!sessionStorage.getItem(visitedKey)) {
        sessionStorage.setItem(visitedKey, '1');
        window._fbUpdate(ref(db, 'visitors/counts'), {
          [`today_${todayKey}`]: window._fbIncrement(1),
          total:                 window._fbIncrement(1),
        }).catch(() => {});
      }
      // Stale session cleanup — পুরনো entries মুছে ফেলো
      function cleanupStale() {
        window._fbGet(ref(db, 'visitors/online')).then(snap => {
          if (!snap.exists()) return;
          const now  = Date.now();
          const data = snap.val();
          const updates = {};
          Object.entries(data).forEach(([key, val]) => {
            if (!val || (now - val.t) >= TTL_MS * 2) {
              updates[`visitors/online/${key}`] = null; // delete
            }
          });
          if (Object.keys(updates).length > 0) {
            window._fbUpdate(ref(db, '/'), updates).catch(() => {});
          }
        }).catch(() => {});
      }
      // পেজ লোড এ একবার এবং প্রতি ৬০ সেকেন্ডে cleanup
      cleanupStale();
      setInterval(cleanupStale, 60000);
      // Online count — TTL filter করে গুনো
      window._fbOnValue(ref(db, 'visitors/online'), (snap) => {
        if (!snap.exists()) {
          var _elOn = document.getElementById('visOnline');
          var _sbOn = document.getElementById('sbVisOnline');
          if (_elOn) _elOn.textContent = toBanglaNum(0);
          if (_sbOn) _sbOn.textContent = toBanglaNum(0);
          return;
        }
        const now   = Date.now();
        const data  = snap.val();
        const count = Object.values(data).filter(v => v && (now - v.t) < TTL_MS).length;
        var _elOn = document.getElementById('visOnline');
        var _sbOn = document.getElementById('sbVisOnline');
        if (_elOn) _elOn.textContent = toBanglaNum(count);
        if (_sbOn) _sbOn.textContent = toBanglaNum(count);
        // mini player LIVE status refresh
        if (typeof updatePlayerUI === 'function') updatePlayerUI();
      });
      // আজকে ভিজিট
      window._fbOnValue(todayRef, (snap) => {
        var _elTd = document.getElementById('visToday');
        var _sbTd = document.getElementById('sbVisToday');
        var v = toBanglaNum(snap.exists() ? snap.val() : 0);
        if (_elTd) _elTd.textContent = v;
        if (_sbTd) _sbTd.textContent = v;
      });
      // সর্বমোট ভিজিট
      window._fbOnValue(totalRef, (snap) => {
        var _elTt = document.getElementById('visTotal');
        var _sbTt = document.getElementById('sbVisTotal');
        var v = toBanglaNum(snap.exists() ? snap.val() : 0);
        if (_elTt) _elTt.textContent = v;
        if (_sbTt) _sbTt.textContent = v;
      });
      // Page ছেড়ে গেলে নিজেকে সরাও
      function removeSession() {
        window._fbSet(onlineRef, null).catch(() => {});
      }
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          removeSession();
        } else {
          heartbeat(); // tab এ ফিরলে সাথে সাথে heartbeat
        }
      });
      window.addEventListener('pagehide',     removeSession);
      window.addEventListener('beforeunload', removeSession);
    }, 300);
  })();
    /* ── WATCH VIDEOS ── */
  let _watchVideos = [];
  let _watchCatVideoCount = {}; // category key → video count (pre-computed)
  let _watchCats   = [];
  let _watchTagImages = {}; // { "tagName": "imageUrl", ... }
  let _listenTagImages = {}; // { "tagName": "imageUrl", ... }
  let _watchLoaded = false;
  let watchFavs = JSON.parse(localStorage.getItem('watch_favs') || '[]');
  let tvFavs    = JSON.parse(localStorage.getItem('tv_favs')    || '[]');
  function toggleWatchFav(key, e) {
    if (e) e.stopPropagation();
    var idx = watchFavs.indexOf(key);
    if (idx >= 0) watchFavs.splice(idx, 1); else watchFavs.push(key);
    localStorage.setItem('watch_favs', JSON.stringify(watchFavs));
    // Firebase sync
    if (currentUser && window._fbDb) {
      try { window._fbSet(window._fbRef(window._fbDb, 'users/' + currentUser.uid + '/watch_favs'), watchFavs); } catch(e) {}
    }
    var isFav = watchFavs.includes(key);
    var btn = document.getElementById('wfav-' + key);
    if (btn) {
      btn.className = 'fav-btn ' + (isFav ? 'faved' : '');
      btn.querySelector('svg').setAttribute('fill', isFav ? 'currentColor' : 'none');
    }
    if(document.getElementById("savedVideosModal").classList.contains("open"))renderSavedVideosModal(_savedVidsFiltered);if(document.getElementById("bookmarkedEpsModal").style.display==="flex")renderBookmarkedEpsModal(_bookmarkedEpsFiltered);
  }
  function getYouTubeId(url) {
    var m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }
  function getYouTubeThumb(id) {
    return 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg';
  }
  function batchCacheThumbs(urls) {
    if (!('caches' in window) || !urls || !urls.length) return;
    var cacheName = (typeof THUMB_CACHE_NAME !== 'undefined') ? THUMB_CACHE_NAME : 'castfm-thumb-v1';
    var maxCount  = (typeof THUMB_CACHE_MAX  !== 'undefined') ? THUMB_CACHE_MAX  : 100;
    caches.open(cacheName).then(function(cache) {
      cache.keys().then(function(existing) {
        var cachedUrls = existing.map(function(r) { return r.url; });
        var toFetch = urls.filter(function(u) {
          return u && u.startsWith('http') && !u.startsWith('data:') && cachedUrls.indexOf(u) === -1;
        });
        if (!toFetch.length) return;
        toFetch.forEach(function(url, i) {
          setTimeout(function() {
            // cors try, fail হলে no-cors fallback (opaque response)
            fetch(url, { mode: 'cors' })
              .then(function(res) {
                if (!res.ok) return;
                cache.put(url, res).then(function() {
                  // put এর পরে evict করো — race condition নেই
                  cache.keys().then(function(all) {
                    if (all.length > maxCount) {
                      all.slice(0, all.length - maxCount).forEach(function(r) { cache.delete(r); });
                    }
                  });
                });
              })
              .catch(function() {
                fetch(url, { mode: 'no-cors' })
                  .then(function(res) {
                    if (res.type === 'opaque' || res.ok) cache.put(url, res).catch(function() {});
                  })
                  .catch(function() {});
              });
          }, i * 100);
        });
      });
    }).catch(function() {});
  }
  // ── AUTO-CACHE: যেকোনো <img> load হলেই cache হবে ──
  (function _initAutoCacheImages() {
    if (!('caches' in window)) return;
    var cacheName = (typeof THUMB_CACHE_NAME !== 'undefined') ? THUMB_CACHE_NAME : 'castfm-thumb-v1';
    var maxCount  = (typeof THUMB_CACHE_MAX  !== 'undefined') ? THUMB_CACHE_MAX  : 100;
    var _queued   = new Set(); // duplicate prevent

    function _cacheUrl(url) {
      if (!url || !url.startsWith('http') || url.startsWith('data:')) return;
      if (_queued.has(url)) return;
      _queued.add(url);
      caches.open(cacheName).then(function(cache) {
        cache.match(url).then(function(hit) {
          if (hit) return; // already cached
          fetch(url, { mode: 'cors' })
            .then(function(res) {
              if (!res.ok) return;
              cache.put(url, res).then(function() {
                cache.keys().then(function(all) {
                  if (all.length > maxCount) {
                    all.slice(0, all.length - maxCount).forEach(function(r) { cache.delete(r); });
                  }
                });
              });
            })
            .catch(function() {
              fetch(url, { mode: 'no-cors' })
                .then(function(res) {
                  if (res.type === 'opaque' || res.ok) cache.put(url, res).catch(function() {});
                })
                .catch(function() {});
            });
        });
      }).catch(function() {});
    }

    function _attachToImg(img) {
      if (img._autoCacheAttached) return;
      img._autoCacheAttached = true;
      // ইতিমধ্যে load হয়ে গেলে এখনই cache করো
      if (img.complete && img.naturalWidth > 0 && img.src) {
        _cacheUrl(img.src);
      } else {
        img.addEventListener('load', function() {
          if (img.src) _cacheUrl(img.src);
        }, { once: true });
      }
    }

    // বিদ্যমান সব img attach করো
    document.querySelectorAll('img').forEach(_attachToImg);

    // নতুন img DOM এ আসলে attach করো
    var _observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        m.addedNodes.forEach(function(node) {
          if (!node || node.nodeType !== 1) return;
          if (node.tagName === 'IMG') {
            _attachToImg(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll('img').forEach(_attachToImg);
          }
        });
      });
    });
    _observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  })();

  function loadWatchVideos() {
    if (_watchLoaded) return;
    if (!window._fbDb || !window._fbRef || !window._fbOnValue) {
      setTimeout(loadWatchVideos, 300);
      return;
    }
    _watchLoaded = true;
    // watches categories
    var _lastWatchCatSig = '';
    window._fbOnValue(window._fbRef(window._fbDb, 'watches'), function(snap) {
      var sig = '';
      snap.forEach(function(child) {
        var d = child.val();
        sig += child.key + ':' + (d.title||'') + ':' + (d.id||'') + ':' + (d.img||'') + '|';
      });
      if (sig === _lastWatchCatSig) { if (window._handlePendingHash) window._handlePendingHash(); return; }
      _lastWatchCatSig = sig;
      _watchCats = [];
      snap.forEach(function(child) {
        _watchCats.push(Object.assign({ _key: child.key }, child.val()));
      });
      _watchCats.sort(function(a, b) { return (parseInt(a.id)||0) - (parseInt(b.id)||0); });
      renderWatchCategoryScroll();
      batchCacheThumbs(_watchCats.map(function(c){ return c.img; }).filter(Boolean));
      if (window._handlePendingHash) window._handlePendingHash();
    });
    // watch tag images
    window._fbOnValue(window._fbRef(window._fbDb, 'watch_tag_images'), function(snap) {
      _watchTagImages = {};
      window._watchTagImagesRaw = {};
      if (snap.exists()) snap.forEach(function(child) {
        var v = child.val();
        window._watchTagImagesRaw[child.key] = v;
        _watchTagImages[child.key] = (v && typeof v === 'object') ? v.url : v;
      });
      if (typeof renderWatchBrowseArtists === 'function') renderWatchBrowseArtists();
    });
    // listen tag images
    window._fbOnValue(window._fbRef(window._fbDb, 'listen_tag_images'), function(snap) {
      _listenTagImages = {};
      window._listenTagImagesRaw = {};
      if (snap.exists()) snap.forEach(function(child) {
        var v = child.val();
        window._listenTagImagesRaw[child.key] = v;
        _listenTagImages[child.key] = (v && typeof v === 'object') ? v.url : v;
      });
      if (typeof renderListenBrowseArtists === 'function') renderListenBrowseArtists();
    });
    // watch videos
    var _lastWatchSig = '';
    window._fbOnValue(window._fbRef(window._fbDb, 'watch_videos'), function(snap) {
      var empty = document.getElementById('watchEmpty');
      if (!snap.exists()) {
        empty.style.display = 'block';
        return;
      }
      // Fingerprint — views/likes/plays/weekly_views বাদ দিয়ে শুধু structural data
      var sig = '';
      snap.forEach(function(child) {
        var d = child.val();
        sig += child.key + ':' + (d.title||'') + ':' + (d.id||'') + ':' + (d.url||'') + ':' + (d.img||'') + ':' + (d.category||'') + ':' + (d.featured||'') + '|';
      });
      var needsRender = sig !== _lastWatchSig;
      _lastWatchSig = sig;
      _watchVideos = [];
      snap.forEach(function(child) {
        var v = child.val();
        v._key = child.key;
        _watchVideos.push(v);
      });
      // id দিয়ে sort (descending — নতুন আগে)
      _watchVideos.sort(function(a, b) { return (b.id || 0) - (a.id || 0); });
      // Pre-compute category video counts for fast badge rendering
      _watchCatVideoCount = {};
      _watchVideos.forEach(function(v) {
        if (v.category && v.url) {
          _watchCatVideoCount[v.category] = (_watchCatVideoCount[v.category] || 0) + 1;
        }
      });
      if (needsRender) {
        renderWatchVideos();
        if(document.getElementById("savedVideosModal").classList.contains("open"))renderSavedVideosModal(_savedVidsFiltered);
        if(document.getElementById("bookmarkedEpsModal").style.display==="flex")renderBookmarkedEpsModal(_bookmarkedEpsFiltered);
      }
      if (window._handlePendingHash) window._handlePendingHash();
    });
    // reels
    window._fbOnValue(window._fbRef(window._fbDb, 'reels'), function(snap) {
      var _reels = [];
      if (snap.exists()) {
        snap.forEach(function(child) {
          var r = child.val();
          r._key = child.key;
          _reels.push(r);
        });
        _reels.sort(function(a, b) { return (b.id || 0) - (a.id || 0); });
      }
      window._reelsData = _reels;
      renderReelsStrip();
      if (typeof renderWatchReels === 'function') renderWatchReels();
      if (window._handlePendingHash) window._handlePendingHash();
    });
  }
  function makeWatchVideoCard(v, i) {
    var ytId = getYouTubeId(v.url || '');
    var thumb = v.img || (ytId ? getYouTubeThumb(ytId) : '');
    var thumbHtml = thumb
      ? '<img src="' + thumb + '" alt="' + (v.title || '') + '" loading="lazy" onload="this.classList.add(&quot;loaded&quot;);imgLoad(this)" onerror="imgErr(this)">'
      : '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1.6rem;background:var(--border2);">🎬</div>';
    var key = v._key || '';
    var isFav = watchFavs.includes(key);
    return '<div class="watch-video-card" style="animation-delay:' + (i * 0.06) + 's" data-wkey="' + key + '">'
      + '<div class="watch-video-thumb">' + thumbHtml
      + '</div>'
      + '<div class="watch-video-info">'
      + '<div class="watch-video-title">' + (v.title || 'Untitled') + '</div>'
      + '</div>'
      + '</div>';
  }
  function buildWatchCatThumb(cat) {
    if (cat.img) return '<img src="' + cat.img + '" loading="lazy" onload="imgLoad(this)" onerror="imgErr(this)">';
    var catVids = _watchVideos.filter(function(v) { return v.category === cat._key && v.img; }).slice(0, 4);
    if (catVids.length >= 4) {
      return '<div style="display:flex;flex-direction:column;width:100%;height:100%;">'
        + '<div style="display:flex;flex:1;">'
          + '<div style="flex:1;overflow:hidden;"><img src="' + catVids[0].img + '" style="width:100%;height:100%;object-fit:cover;display:block;" onload="imgLoad(this)" onerror="imgErr(this)"></div>'
          + '<div style="flex:1;overflow:hidden;"><img src="' + catVids[1].img + '" style="width:100%;height:100%;object-fit:cover;display:block;" onload="imgLoad(this)" onerror="imgErr(this)"></div>'
        + '</div>'
        + '<div style="display:flex;flex:1;">'
          + '<div style="flex:1;overflow:hidden;"><img src="' + catVids[2].img + '" style="width:100%;height:100%;object-fit:cover;display:block;" onload="imgLoad(this)" onerror="imgErr(this)"></div>'
          + '<div style="flex:1;overflow:hidden;"><img src="' + catVids[3].img + '" style="width:100%;height:100%;object-fit:cover;display:block;" onload="imgLoad(this)" onerror="imgErr(this)"></div>'
        + '</div>'
      + '</div>';
    } else if (catVids.length === 3) {
      return '<div style="display:flex;flex-direction:column;width:100%;height:100%;">'
        + '<div style="display:flex;flex:1;">'
          + '<div style="flex:1;overflow:hidden;"><img src="' + catVids[0].img + '" style="width:100%;height:100%;object-fit:cover;display:block;" onload="imgLoad(this)" onerror="imgErr(this)"></div>'
          + '<div style="flex:1;overflow:hidden;"><img src="' + catVids[1].img + '" style="width:100%;height:100%;object-fit:cover;display:block;" onload="imgLoad(this)" onerror="imgErr(this)"></div>'
        + '</div>'
        + '<div style="flex:1;overflow:hidden;"><img src="' + catVids[2].img + '" style="width:100%;height:100%;object-fit:cover;display:block;" onload="imgLoad(this)" onerror="imgErr(this)"></div>'
      + '</div>';
    } else if (catVids.length === 2) {
      return '<div style="display:flex;width:100%;height:100%;">'
        + '<div style="flex:1;overflow:hidden;"><img src="' + catVids[0].img + '" style="width:100%;height:100%;object-fit:cover;display:block;" onload="imgLoad(this)" onerror="imgErr(this)"></div>'
        + '<div style="flex:1;overflow:hidden;"><img src="' + catVids[1].img + '" style="width:100%;height:100%;object-fit:cover;display:block;" onload="imgLoad(this)" onerror="imgErr(this)"></div>'
      + '</div>';
    } else if (catVids.length === 1) {
      return '<img src="' + catVids[0].img + '" onload="imgLoad(this)" onerror="imgErr(this)">';
    }
    return '<span>🎬</span>';
  }
  function renderWatchCategoryScroll() {
    var row = document.getElementById('watchCatRow');
    if (!row) return;
    row.parentElement.style.display = '';
    row.className = 'pc-horiz-row';
    var catCards = _watchCats.map(function(cat) {
      var thumbHtml = buildWatchCatThumb(cat);
      var _vcCount = (_watchCatVideoCount[cat._key] || 0);
      var _vcBadge = _vcCount > 0 ? '<div class="pc-card-vidcount">' + _vcCount + ' <i class="fa-solid fa-video"></i></div>' : '';
      return '<div class="pc-card" data-catkey="' + cat._key + '" ontouchstart="this.classList.add(\'active-cat\')" ontouchend="this.classList.remove(\'active-cat\')" ontouchcancel="this.classList.remove(\'active-cat\')" onclick="openWatchCatModal(this.closest(\'[data-catkey]\').dataset.catkey)">'
        + '<div class="pc-card-thumb">' + thumbHtml + _vcBadge + '</div>'
        + '<div class="pc-card-title">' + (cat.title || cat._key) + '</div>'
        + '</div>';
    }).join('');
    row.innerHTML = catCards;
  }
  var _watchCatCurrentVideos = [];
  var _watchCatActiveTag = 'all';
  var _watchCatActiveSort = 'latest';
  function _watchCatSortVideos(videos) {
    var sorted = videos.slice();
    if (_watchCatActiveSort === 'latest') {
      sorted.sort(function(a,b){ return (parseInt(b.id)||0)-(parseInt(a.id)||0); });
    } else if (_watchCatActiveSort === 'oldest') {
      sorted.sort(function(a,b){ return (parseInt(a.id)||0)-(parseInt(b.id)||0); });
    } else if (_watchCatActiveSort === 'popular') {
      sorted.sort(function(a,b){ return (parseInt(b.views)||parseInt(b.plays)||0)-(parseInt(a.views)||parseInt(a.plays)||0); });
    }
    return sorted;
  }
  function watchCatRenderTagBar(videos) {
    var bar = document.getElementById('watchCatTagBar');
    if (!bar) return;
    var tagCount = {};
    videos.forEach(function(v) {
      if (v.seo) {
        v.seo.split(',').forEach(function(t) {
          var trimmed = t.trim();
          if (trimmed) tagCount[trimmed] = (tagCount[trimmed] || 0) + 1;
        });
      }
    });
    var tags = Object.keys(tagCount).filter(function(t) { return tagCount[t] >= 2; }).sort(function(a, b) { return tagCount[b] - tagCount[a]; });
    var sorts = [['latest','Latest'],['oldest','Oldest'],['popular','Popular']];
    var html = sorts.map(function(s){
      return '<div class="ltv-tag-chip wcat-sort-chip' + (s[0] === _watchCatActiveSort ? ' active' : '') + '" onclick="watchCatSortSelect(\'' + s[0] + '\')">' + s[1] + '</div>';
    }).join('');
    if (tags.length) {
      html += '<div class="ltv-tag-chip-sep"></div>';
      var active = _watchCatActiveTag;
      tags.forEach(function(tag) {
        var imgUrl = _watchTagImages[tag];
      var imgHtml = imgUrl ? '<img src="' + imgUrl + '" class="ltv-tag-chip-img" onerror="this.style.display=\'none\'">' : '';
        html += '<div class="ltv-tag-chip' + (active === tag ? ' active' : '') + '" onclick="watchCatTagSelect(\'' + tag.replace(/\'/g, "\\'"  ) + '\')">'
               + imgHtml + tag + '</div>';
      });
    }
    bar.innerHTML = html;
  }
  function watchCatSortSelect(sort) {
    _watchCatActiveSort = sort;
    _watchCatActiveTag = 'all';
    var bar = document.getElementById('watchCatTagBar');
    if (bar) {
      bar.querySelectorAll('.wcat-sort-chip').forEach(function(el) {
        el.classList.toggle('active', el.textContent.trim().toLowerCase() === sort);
      });
      bar.querySelectorAll('.ltv-tag-chip:not(.wcat-sort-chip)').forEach(function(el) {
        el.classList.remove('active');
      });
    }
    watchCatRenderList(_watchCatSortVideos(_watchCatCurrentVideos));
  }
  function watchCatTagSelect(tag) {
    _watchCatActiveTag = tag;
    var bar = document.getElementById('watchCatTagBar');
    if (bar) {
      bar.querySelectorAll('.wcat-sort-chip').forEach(function(el) {
        el.classList.remove('active');
      });
      bar.querySelectorAll('.ltv-tag-chip:not(.wcat-sort-chip)').forEach(function(el) {
        el.classList.toggle('active', el.textContent.trim() === tag);
      });
    }
    var base = tag === 'all' ? _watchCatCurrentVideos : _watchCatCurrentVideos.filter(function(v) {
      if (!v.seo) return false;
      return v.seo.split(',').map(function(t){ return t.trim(); }).indexOf(tag) !== -1;
    });
    watchCatRenderList(_watchCatSortVideos(base));
  }
  function openWatchCatModal(catId, fromPopstate, restoreOnly) {
    var cat = _watchCats.find(function(c) { return c._key === catId; });
    window._watchCatCurrentCatId = catId; // video player থেকে ফিরতে দরকার
    // restoreOnly=true মানে video player থেকে ফিরে এসেছি — state reset করবো না
    if (!restoreOnly) {
      var videos = _watchVideos.filter(function(v) { return v.category === catId && v.url; });
      videos.sort(function(a,b){ return (parseInt(b.id)||0)-(parseInt(a.id)||0); });
      _watchCatCurrentVideos = videos;
      _watchCatActiveTag = 'all';
      _watchCatActiveSort = 'latest';
      var catLabel = (cat && cat.title) || catId;
      var titleEl = document.getElementById('watchCatTitle');
      if (titleEl) titleEl.textContent = catLabel;
      var coverEl = document.getElementById('watchCatCover');
      var coverVideoEl = document.getElementById('watchCatCoverVideo');
      if (coverEl) {
        var hasCover = cat && cat.cover;
        var hasVideo = cat && cat.video;
        coverEl.style.backgroundImage = hasCover ? 'url(' + cat.cover + ')' : '';
        coverEl.classList.toggle('wcat-cover-has-video', !!hasVideo);
        coverEl.style.display = ''; /* সবসময় দেখাবে */
        if (coverVideoEl) {
          if (hasVideo) {
            coverVideoEl.src = cat.video;
            coverVideoEl.style.display = '';
            coverVideoEl.load();
            coverVideoEl.play().catch(function(){});
          } else {
            coverVideoEl.pause();
            coverVideoEl.src = '';
            coverVideoEl.style.display = 'none';
          }
        }
      }
      var si = document.getElementById('watchCatSearchInput');
      if (si) si.value = '';
      window._safeModalSearchClose('watchCat');
      watchCatRenderTagBar(videos);
      watchCatRenderList(_watchCatSortVideos(videos));
    }
    document.getElementById('watchCatModal').classList.add('open');
    document.body.classList.add('watch-open');
    lockBodyScroll();
    if (!fromPopstate) safeHistoryPush({ type: 'modal', modal: 'watchcat', catId: catId }, '', '#' + catId);
  }
  function watchCatRenderList(videos) {
    var listEl = document.getElementById('watchCatModalList');
    if (!videos.length) {
      listEl.innerHTML = '<div style="text-align:center;padding:48px 16px;color:var(--muted);font-family:DM Sans,sans-serif;font-size:0.9rem;">No videos</div>';
      return;
    }
    var limit = 15; var shown = 0;
    listEl.innerHTML = '';
    var old = document.getElementById('watchCatLoadMore');
    if (old) old.remove();
    function loadNextBatch() {
      var batch = videos.slice(shown, shown + limit);
      if (!batch.length) return false;
      var frag = document.createDocumentFragment();
      batch.forEach(function(v, i) {
        var tmp = document.createElement('div');
        tmp.innerHTML = makeWatchVideoCard(v, shown + i);
        while (tmp.firstChild) frag.appendChild(tmp.firstChild);
      });
      listEl.appendChild(frag);
      _attachVideoCardClicks(listEl);
      shown += batch.length;
      return shown < videos.length;
    }
    loadNextBatch();
    if (shown < videos.length) {
      var sentinel = makeSentinel();
      sentinel.id = 'watchCatLoadMore';
      listEl.parentElement.appendChild(sentinel);
      var scrollEl = listEl.closest('.pep-scroll-body');
      attachAutoLoad(scrollEl, sentinel, loadNextBatch);
    }
  }
  function watchCatFilter(q) {
    var filtered = _watchCatCurrentVideos.filter(function(v) {
      return (v.title || '').toLowerCase().includes(q.toLowerCase());
    });
    watchCatRenderList(filtered);
  }
  function closeWatchCatModal(fromPopstate) {
    var modal = document.getElementById('watchCatModal');
    closeModalWithAnim(modal, 280, function() {
      document.body.classList.remove('watch-open');
      _scrollLockCount = 1; unlockBodyScroll();
      var cv = document.getElementById('watchCatCoverVideo');
      if (cv) { cv.pause(); cv.src = ''; cv.style.display = 'none'; }
      var ce = document.getElementById('watchCatCover');
      if (ce) ce.classList.remove('wcat-cover-has-video');
    });
    if (!fromPopstate) {
      var curHash = window.location.hash.replace('#', '');
      if (curHash.startsWith('cat_')) try { history.back(); } catch(e) {}
    }
  }
  window.openWatchCatModal  = openWatchCatModal;
  window.closeWatchCatModal = closeWatchCatModal;
  window.watchCatFilter     = watchCatFilter;
  window.watchCatTagSelect  = watchCatTagSelect;
  window.watchCatSortSelect = watchCatSortSelect;
  /* ── BROWSE ALL CATEGORIES MODAL ── */
  var _browseCatsAllItems = [];
  var _browseCatsAllActiveTag = 'all';
  function _browseCatsAllRenderTagBar() {
    var bar = document.getElementById('browseCatsAllTagBar');
    if (!bar) return;
    /* সব categories-এর seo tag collect করো, count অনুযায়ী sort */
    var tagCount = {};
    _browseCatsAllItems.forEach(function(cat) {
      if (cat.seo) {
        cat.seo.split(',').forEach(function(t) {
          var tag = t.trim();
          if (tag && tag.toLowerCase() !== 'featured') tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });
    var tags = Object.keys(tagCount).sort(function(a, b) { return tagCount[b] - tagCount[a]; });
    if (!tags.length) { bar.innerHTML = ''; return; }
    var active = _browseCatsAllActiveTag;
    var html = '<div class="ltv-tag-chip' + (active === 'all' ? ' active' : '') + '" onclick="browseCatsAllTagSelect(\'all\')">All</div>';
    tags.forEach(function(tag) {
      html += '<div class="ltv-tag-chip' + (active === tag ? ' active' : '') + '" onclick="browseCatsAllTagSelect(\'' + tag.replace(/\'/g, "\\'") + '\')">' + tag + '</div>';
    });
    bar.innerHTML = html;
  }
  function browseCatsAllTagSelect(tag) {
    _browseCatsAllActiveTag = tag;
    /* chip active state update */
    var bar = document.getElementById('browseCatsAllTagBar');
    if (bar) {
      bar.querySelectorAll('.ltv-tag-chip').forEach(function(el) {
        el.classList.toggle('active', el.textContent.trim() === (tag === 'all' ? 'All' : tag));
      });
    }
    /* scroll to top */
    var scrollEl = document.querySelector('#browseCatsAllModal .pep-scroll-body');
    if (scrollEl) scrollEl.scrollTop = 0;
    /* filter categories */
    if (tag === 'all') {
      _renderBrowseCatsAllList(_browseCatsAllItems);
    } else {
      var filtered = _browseCatsAllItems.filter(function(cat) {
        if (!cat.seo) return false;
        return cat.seo.split(',').map(function(t){ return t.trim(); }).indexOf(tag) !== -1;
      });
      _renderBrowseCatsAllList(filtered);
    }
  }
  window.browseCatsAllTagSelect = browseCatsAllTagSelect;
  function openBrowseCatsAllModal(fromPopstate) {
    var modal = document.getElementById('browseCatsAllModal');
    if (!modal) return;
    _browseCatsAllItems = _watchCats.slice();
    _browseCatsAllActiveTag = 'all';
    var si = document.getElementById('browseCatsAllSearchInput');
    if (si) si.value = '';
    window._safeModalSearchClose('browseCatsAll');
    _browseCatsAllRenderTagBar();
    _renderBrowseCatsAllList(_browseCatsAllItems);
    modal.classList.add('open');
    document.body.classList.add('watch-open');
    lockBodyScroll();
    if (!fromPopstate) safeHistoryPush({ type: 'modal', modal: 'browsecatsall' }, '', '#browsecatsall');
  }
  function closeBrowseCatsAllModal(fromPopstate) {
    var modal = document.getElementById('browseCatsAllModal');
    if (!modal) return;
    closeModalWithAnim(modal, 280, function() {
      var watchCatOpen = document.getElementById('watchCatModal') && document.getElementById('watchCatModal').classList.contains('open');
      if (!watchCatOpen) { document.body.classList.remove('watch-open'); }
      _scrollLockCount = 1; unlockBodyScroll();
    });
    if (!fromPopstate) {
      if (window.location.hash === '#browsecatsall') try { history.back(); } catch(e) {}
    }
  }
  /* Category card thumbnail — img থাকলে সেটা, না থাকলে সর্বশেষ ৪টি video-র img দিয়ে collage */
  function _buildBrowseCatThumb(cat) {
    /* 1. Category-র নিজের img আছে? */
    if (cat.img) {
      return '<img src="' + cat.img + '" alt="" class="browse-cat-card-img" loading="lazy"'
        + ' onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">'
        + '<div class="browse-cat-card-fallback" style="display:none;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28"><rect x="2" y="2" width="20" height="20" rx="3"/><polygon points="10 8 16 12 10 16 10 8"/></svg></div>';
    }
    /* 2. সেই category-র সর্বশেষ video গুলো থেকে thumbnail সংগ্রহ */
    var imgs = [];
    var catVids = _watchVideos.filter(function(v){ return v.category === cat._key && v.url; });
    for (var i = 0; i < catVids.length && imgs.length < 4; i++) {
      var v = catVids[i];
      var src = v.img || (getYouTubeId(v.url || '') ? getYouTubeThumb(getYouTubeId(v.url)) : '');
      if (src) imgs.push(src);
    }
    /* 3. Collage grid build */
    if (imgs.length >= 4) {
      return '<div style="display:flex;flex-direction:column;width:100%;height:100%;">'
        + '<div style="display:flex;flex:1;gap:1px;">'
          + '<div style="flex:1;overflow:hidden;"><img src="' + imgs[0] + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy"></div>'
          + '<div style="flex:1;overflow:hidden;"><img src="' + imgs[1] + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy"></div>'
        + '</div>'
        + '<div style="display:flex;flex:1;gap:1px;margin-top:1px;">'
          + '<div style="flex:1;overflow:hidden;"><img src="' + imgs[2] + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy"></div>'
          + '<div style="flex:1;overflow:hidden;"><img src="' + imgs[3] + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy"></div>'
        + '</div>'
      + '</div>';
    } else if (imgs.length === 3) {
      return '<div style="display:flex;flex-direction:column;width:100%;height:100%;">'
        + '<div style="display:flex;flex:1;gap:1px;">'
          + '<div style="flex:1;overflow:hidden;"><img src="' + imgs[0] + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy"></div>'
          + '<div style="flex:1;overflow:hidden;"><img src="' + imgs[1] + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy"></div>'
        + '</div>'
        + '<div style="flex:1;overflow:hidden;margin-top:1px;"><img src="' + imgs[2] + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy"></div>'
      + '</div>';
    } else if (imgs.length === 2) {
      return '<div style="display:flex;width:100%;height:100%;gap:1px;">'
        + '<div style="flex:1;overflow:hidden;"><img src="' + imgs[0] + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy"></div>'
        + '<div style="flex:1;overflow:hidden;"><img src="' + imgs[1] + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy"></div>'
      + '</div>';
    } else if (imgs.length === 1) {
      return '<img src="' + imgs[0] + '" alt="" class="browse-cat-card-img" loading="lazy">';
    }
    /* 4. কোনো image নেই — fallback icon */
    return '<div class="browse-cat-card-fallback"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28"><rect x="2" y="2" width="20" height="20" rx="3"/><polygon points="10 8 16 12 10 16 10 8"/></svg></div>';
  }
  function _renderBrowseCatsAllList(cats) {
    var listEl = document.getElementById('browseCatsAllList');
    if (!listEl) return;
    // clean up old sentinel
    var oldSentinel = document.getElementById('browseCatsAllLoadMore');
    if (oldSentinel) oldSentinel.remove();
    if (!cats.length) {
      listEl.innerHTML = '<div style="text-align:center;padding:48px 16px;color:var(--muted);font-family:DM Sans,sans-serif;font-size:0.9rem;">No categories found</div>';
      return;
    }
    var limit = 12;
    var shown = 0;
    listEl.innerHTML = '';
    function _makeCatCardHTML(cat) {
      var thumbInner = _buildBrowseCatThumb(cat);
      var _bvcCount = (_watchCatVideoCount[cat._key] || 0);
      var _bvcBadge = _bvcCount > 0 ? '<div class="browse-cat-vidcount">' + _bvcCount + ' <i class="fa-solid fa-video"></i></div>' : '';
      return '<div class="browse-cat-card" data-catkey="' + cat._key + '" onclick="(function(el){var k=el.dataset.catkey;closeBrowseCatsAllModal(true);try{history.replaceState({type:\'modal\',modal:\'watchcat\',catId:k},\'\',\'#\'+k);}catch(e){}setTimeout(function(){openWatchCatModal(k,true);},250);})(this)" ontouchstart="this.classList.add(\'tapped\')" ontouchend="this.classList.remove(\'tapped\')" ontouchcancel="this.classList.remove(\'tapped\')">'
        + '<div class="browse-cat-card-thumb">' + thumbInner + _bvcBadge + '</div>'
        + '<div class="browse-cat-card-label">' + (cat.title || cat._key) + '</div>'
        + '</div>';
    }
    function loadNextBatch() {
      var batch = cats.slice(shown, shown + limit);
      if (!batch.length) return false;
      var frag = document.createDocumentFragment();
      batch.forEach(function(cat) {
        var tmp = document.createElement('div');
        tmp.innerHTML = _makeCatCardHTML(cat);
        while (tmp.firstChild) frag.appendChild(tmp.firstChild);
      });
      listEl.appendChild(frag);
      shown += batch.length;
      return shown < cats.length;
    }
    loadNextBatch();
    if (shown < cats.length) {
      var sentinel = makeSentinel();
      sentinel.id = 'browseCatsAllLoadMore';
      listEl.parentElement.appendChild(sentinel);
      var scrollEl = listEl.closest('.pep-scroll-body');
      attachAutoLoad(scrollEl, sentinel, loadNextBatch);
    }
  }
  function _browseCatsAllFilter(q) {
    var base = _browseCatsAllActiveTag === 'all'
      ? _browseCatsAllItems
      : _browseCatsAllItems.filter(function(cat) {
          if (!cat.seo) return false;
          return cat.seo.split(',').map(function(t){ return t.trim(); }).indexOf(_browseCatsAllActiveTag) !== -1;
        });
    var filtered = q
      ? base.filter(function(c) { return (c.title || c._key).toLowerCase().includes(q.toLowerCase()); })
      : base;
    _renderBrowseCatsAllList(filtered);
  }
  var _dBrowseCatsAllFilter = (function() {
    var t; return function(q) { clearTimeout(t); t = setTimeout(function(){ _browseCatsAllFilter(q); }, 180); };
  })();
  window.openBrowseCatsAllModal  = openBrowseCatsAllModal;
  window.closeBrowseCatsAllModal = closeBrowseCatsAllModal;
  window._dBrowseCatsAllFilter   = _dBrowseCatsAllFilter;
  /* ── DATE PILL HELPERS ── */
  function _dateLabel(ym) {
    // ym = "2025-05" বা "2025-05-28"
    var parts = ym.split('-');
    var y = parseInt(parts[0]); var m = parseInt(parts[1]) - 1;
    var now = new Date();
    var thisY = now.getFullYear(); var thisM = now.getMonth();
    if (y === thisY && m === thisM) return 'This Month';
    if ((thisM === 0 && y === thisY - 1 && m === 11) || (thisM > 0 && y === thisY && m === thisM - 1)) return 'Last Month';
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return months[m] + ' ' + y;
  }
  function _buildDateTagBar(barId, items, dateField, activeRef, selectFn) {
    var bar = document.getElementById(barId);
    if (!bar) return;
    var ymSet = {};
    items.forEach(function(item) {
      var d = item[dateField];
      if (!d) return;
      var ym = d.substring(0, 7); // "2025-05"
      ymSet[ym] = (ymSet[ym] || 0) + 1;
    });
    var yms = Object.keys(ymSet).sort().reverse(); // নতুন আগে
    if (!yms.length) { bar.innerHTML = ''; return; }
    var active = activeRef.val;
    var html = '<div class="ltv-tag-chip' + (active === 'all' ? ' active' : '') + '" onclick="' + selectFn + '(\'all\')">All</div>';
    yms.forEach(function(ym) {
      var label = _dateLabel(ym);
      html += '<div class="ltv-tag-chip' + (active === ym ? ' active' : '') + '" onclick="' + selectFn + '(\'' + ym + '\')">' + label + '</div>';
    });
    bar.innerHTML = html;
  }
  /* ── ALL EPISODES DATE FILTER ── */
  var _allStationsSorted = [];
  // ── Generic modal search toggle ──
  function _safeModalSearchClose(key) {
    if (window._modalSearchClose) window._modalSearchClose(key);
  }
  window._safeModalSearchClose = _safeModalSearchClose;
  var _modalTitleIds = {
    liveTv: 'liveTvTitle', watchCat: 'watchCatTitle', pep: 'pepModalTitle',
    allStations: 'allStationsTitle',
    savedVideos: 'savedVideosTitle', bookmarkedEps: 'bookmarkedEpsTitle',
    browseCatsAll: 'browseCatsAllTitle', listenBrowseAll: 'listenBrowseAllTitle',
    allArtists: 'allArtistsTitle', allWatchArtists: 'allWatchArtistsTitle',
    artistEp: 'artistEpModalTitle', watchArtistVid: 'watchArtistVidTitle',
    sports: 'sportsModalTitle', newsModal: 'newsModalTitle'
  };
  window._modalSearchOpen = function(key) {
    var expand    = document.getElementById(key + 'SearchExpand');
    var input     = document.getElementById(key + 'SearchInput');
    var btn       = document.getElementById(key + 'SearchBtn');
    var searchIco = document.getElementById(key + 'SearchIcon');
    var closeIco  = document.getElementById(key + 'CloseIcon');
    var title     = document.getElementById(_modalTitleIds[key]);
    if (expand) { expand.style.opacity = '1'; expand.style.pointerEvents = 'all'; }
    if (searchIco) { searchIco.style.opacity = '0'; searchIco.style.transform = 'rotate(90deg) scale(0.7)'; }
    if (closeIco)  { closeIco.style.opacity  = '1'; closeIco.style.transform  = 'rotate(0deg) scale(1)'; }
    if (title)     title.style.opacity = '0';
    if (btn) btn.onclick = function() { window._modalSearchClose(key); };
    if (input) { input.value = ''; setTimeout(function(){ input.focus(); }, 50); }
  };
  window._modalSearchClose = function(key) {
    var expand    = document.getElementById(key + 'SearchExpand');
    var input     = document.getElementById(key + 'SearchInput');
    var btn       = document.getElementById(key + 'SearchBtn');
    var searchIco = document.getElementById(key + 'SearchIcon');
    var closeIco  = document.getElementById(key + 'CloseIcon');
    var title     = document.getElementById(_modalTitleIds[key]);
    if (expand) { expand.style.opacity = '0'; expand.style.pointerEvents = 'none'; }
    if (searchIco) { searchIco.style.opacity = '1'; searchIco.style.transform = 'rotate(0deg) scale(1)'; }
    if (closeIco)  { closeIco.style.opacity  = '0'; closeIco.style.transform  = 'rotate(-90deg) scale(0.7)'; }
    if (title)     title.style.opacity = '1';
    if (btn) btn.onclick = function() { window._modalSearchOpen(key); };
    if (input) { var hadText = input.value.trim(); input.value = ''; input.blur(); if (hadText) input.dispatchEvent(new Event('input')); }
  };
  function renderWatchVideos() {
    var empty = document.getElementById('watchEmpty');
    var ph = document.getElementById('watchPlaceholder');
    if (!_watchVideos.length) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';
    if (ph) ph.style.display = 'none';
    renderWatchCategoryScroll();
    // Rankings Section
    renderRankingsSection();
    batchCacheThumbs(_watchVideos.map(function(v){ var ytId = getYouTubeId(v.url||''); return v.img || (ytId ? getYouTubeThumb(ytId) : null); }).filter(Boolean));
    // Top Picks
    renderEditorChoiceSection();
    // Category rows
    renderWatchCatRows();
    renderBrowseCats();
    // For You
    buildForYouFeed();
  }
  var _rankingsActivePill = 'latest';
  function renderRankingsSection() {
    var section = document.getElementById('rankingsSection');
    var pillBar = document.getElementById('rankingsPillBar');
    var cardRow = document.getElementById('rankingsCardRow');
    if (!section || !pillBar || !cardRow) return;
    section.style.display = '';
    // Build pills: Latest + each category
    var hasUpcoming = _watchVideos.some(function(v){ return v.featured === true && !v.url; });
    var pills = [{ key: 'latest', title: 'Latest Videos' }, { key: 'trending', title: 'Trending' }, { key: 'featured', title: 'Featured' }];
    if (hasUpcoming) pills.push({ key: 'upcoming', title: 'Upcoming' });
    pills.push({ key: 'top', title: 'Top' });
    pills.push({ key: 'random', title: 'Random' });
    pills.push({ key: 'watched', title: 'Recently Watched' });
    pillBar.innerHTML = pills.map(function(p) {
      var active = (_rankingsActivePill === p.key) ? ' active' : '';
      return '<div class="rankings-pill' + active + '" onclick="rankingsPillSelect(\'' + p.key + '\')">' + p.title + '</div>';
    }).join('');
    renderRankingsCards();
  }
  function rankingsPillSelect(key) {
    _rankingsActivePill = key;
    // Update active pill UI
    var pillBar = document.getElementById('rankingsPillBar');
    if (pillBar) {
      pillBar.querySelectorAll('.rankings-pill').forEach(function(el) {
        el.classList.toggle('active', el.textContent.trim() === (
          key === 'latest' ? 'Latest Videos' : key === 'trending' ? 'Trending' : key === 'featured' ? 'Featured' : key === 'upcoming' ? 'Upcoming' : key === 'top' ? 'Top' : key === 'random' ? 'Random' : key === 'watched' ? 'Recently Watched' : ((_watchCats||[]).find(function(c){ return c._key === key; }) || {}).title || key
        ));
      });
    }
    renderRankingsCards();
  }
  function renderRankingsCards() {
    var cardRow = document.getElementById('rankingsCardRow');
    if (!cardRow) return;
    var allVideos, videos;
    if (_rankingsActivePill === 'latest') {
      allVideos = _watchVideos.filter(function(v){ return v.category !== 'cat_6ogd' && v.url; })
        .sort(function(a,b){ return (parseInt(b.id)||0)-(parseInt(a.id)||0); });
    } else if (_rankingsActivePill === 'trending') {
      allVideos = _watchVideos.filter(function(v){ return v.url; })
        .sort(function(a,b){ return (parseInt(b.weekly_views)||0)-(parseInt(a.weekly_views)||0); });
    } else if (_rankingsActivePill === 'featured') {
      allVideos = _watchVideos.filter(function(v){ return v.featured === true && v.url; })
        .sort(function(a,b){ return (parseInt(b.id)||0)-(parseInt(a.id)||0); });
    } else if (_rankingsActivePill === 'upcoming') {
      allVideos = _watchVideos.filter(function(v){ return v.featured === true && !v.url; })
        .sort(function(a,b){ return (parseInt(b.id)||0)-(parseInt(a.id)||0); });
    } else if (_rankingsActivePill === 'top') {
      allVideos = _watchVideos.filter(function(v){ return v.url; })
        .sort(function(a,b){
          var scoreA = (parseInt(a.views)||0) + (a.likes && a.likes.count ? parseInt(a.likes.count)||0 : 0);
          var scoreB = (parseInt(b.views)||0) + (b.likes && b.likes.count ? parseInt(b.likes.count)||0 : 0);
          return scoreB - scoreA;
        });
    } else if (_rankingsActivePill === 'random') {
      allVideos = _watchVideos.filter(function(v){ return v.url; })
        .slice().sort(function(){ return Math.random() - 0.5; });
    } else if (_rankingsActivePill === 'watched') {
      var _wHistKeys = (typeof _historyVideo !== 'undefined' ? _historyVideo : []).map(function(h){ return h._key; });
      allVideos = _wHistKeys.map(function(k){ return _watchVideos.find(function(v){ return v._key === k && v.url; }); }).filter(Boolean);
    } else {
      allVideos = _watchVideos.filter(function(v){ return v.category === _rankingsActivePill && v.url; })
        .sort(function(a,b){ return (parseInt(b.id)||0)-(parseInt(a.id)||0); });
    }
    videos = allVideos.slice(0, 9);
    if (!videos.length) { cardRow.innerHTML = '<div style="padding:16px;color:var(--muted);font-family:\'Plus Jakarta Sans\',sans-serif;font-size:0.8rem;">কোনো ভিডিও নেই</div>'; return; }
    var cards = videos.map(function(v, i) {
      var card = makeWatchVideoCard(v, i);
      var badge = '<div class="rankings-rank-badge">' + (i+1) + '</div>';
      return card.replace('<div class="watch-video-thumb">', '<div class="watch-video-thumb">' + badge);
    }).join('');
    // More card — collage from next 6 videos
    var moreOnClick = _rankingsActivePill === 'latest'
      ? ''
      : 'openWatchCatModal(\'' + _rankingsActivePill + '\')';
    var collageThumbs = allVideos.slice(12, 18).map(function(v) {
      var ytId = getYouTubeId(v.url || '');
      return v.img || (ytId ? getYouTubeThumb(ytId) : '');
    }).filter(Boolean);
    var collageHtml = '';
    if (collageThumbs.length >= 2) {
      // 2x2 grid — 4 ছবি
      collageHtml = collageThumbs.slice(0,4).map(function(src) {
        return '<div style="width:50%;height:50%;overflow:hidden;flex-shrink:0;">'
          + '<img src="' + src + '" loading="lazy" onload="this.style.opacity=1" onerror="this.style.opacity=0.2" style="width:100%;height:100%;object-fit:cover;display:block;opacity:0;transition:opacity 0.3s;">'
          + '</div>';
      }).join('');
      collageHtml = '<div style="position:absolute;inset:0;display:flex;flex-wrap:wrap;overflow:hidden;">' + collageHtml + '</div>';
    } else if (collageThumbs.length === 1) {
      collageHtml = '<div style="position:absolute;inset:0;overflow:hidden;">'
        + '<img src="' + collageThumbs[0] + '" loading="lazy" onload="this.style.opacity=1" onerror="this.style.opacity=0.2" style="width:100%;height:100%;object-fit:cover;display:block;opacity:0;transition:opacity 0.3s;">'
        + '</div>';
    }
    var moreCard = '<div class="watch-video-card rankings-more-card" style="animation-delay:' + (videos.length * 0.06) + 's" onclick="' + moreOnClick + '">'
      + '<div class="watch-video-thumb" style="position:relative;overflow:hidden;">'
      + collageHtml
      + '<div style="position:absolute;inset:0;background:rgba(0,0,0,0.38);"></div>'
      + '</div>'
      + '<div class="watch-video-info" style="display:flex;align-items:center;justify-content:center;">'
      + '<div class="watch-video-title" style="color:var(--accent);text-align:center;overflow:visible;white-space:nowrap;">See More &rsaquo;</div>'
      + '</div>'
      + '</div>';
    cardRow.innerHTML = cards;
    _attachVideoCardClicks(cardRow);
  }
  // ── Floral ornamental banner ──
  function _catSeededRng(seed) {
    var s = 0;
    for (var i = 0; i < seed.length; i++) s = (Math.imul(31, s) + seed.charCodeAt(i)) | 0;
    return function() {
      s ^= s << 13; s ^= s >> 17; s ^= s << 5;
      return ((s >>> 0) / 0xffffffff);
    };
  }
  var _catPalettes = [
    ['#1a0a2e','#4a1060','#9b30c8','#d4a0f0','#f0d080'],
    ['#0a1f10','#0d5c2a','#1aab52','#70e8a0','#f5e050'],
    ['#1f0a08','#6b1a10','#c83020','#f07860','#f0d070'],
    ['#0a1428','#103060','#2060c0','#70b0f0','#f0e080'],
    ['#1a100a','#5c3010','#b06020','#e8a050','#f0e878'],
    ['#10081a','#3a1050','#7030a0','#c070e0','#f8d060'],
    ['#081a14','#104838','#208060','#50c898','#e8f060'],
    ['#1a080e','#601030','#b82050','#f07090','#f8e070'],
  ];
  function _catGetPalette(key) {
    var rng = _catSeededRng(key);
    return _catPalettes[Math.floor(rng() * _catPalettes.length)];
  }
  function _drawCatBg(canvas, key) {
    var dpr = window.devicePixelRatio || 1;
    var W = canvas.width  = canvas.offsetWidth  * dpr;
    var H = canvas.height = canvas.offsetHeight * dpr;
    var ctx = canvas.getContext('2d');
    var pal = _catGetPalette(key);
    // ── 1. Base gradient ──
    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0,   pal[0]);
    bg.addColorStop(0.6, pal[1]);
    bg.addColorStop(1,   pal[0]);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // ── 2. Fine crosshatch lines ──
    var spacing = 18 * dpr;
    ctx.strokeStyle = 'rgba(255,255,255,0.055)';
    ctx.lineWidth = 0.5 * dpr;
    ctx.lineCap = 'square';
    // 45° lines (top-left → bottom-right)
    ctx.beginPath();
    for (var i = -H; i < W + H; i += spacing) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i + H, H);
    }
    ctx.stroke();
    // -45° lines (top-right → bottom-left)
    ctx.beginPath();
    for (var j = -H; j < W + H; j += spacing) {
      ctx.moveTo(j, H);
      ctx.lineTo(j + H, 0);
    }
    ctx.stroke();
    // ── 3. Soft vignette ──
    var vig = ctx.createRadialGradient(W/2, H/2, H * 0.2, W/2, H/2, W * 0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }
  function _initCatBannerCanvas(key) {
    var canvas = document.getElementById('catCanvas_' + key);
    if (!canvas) return;
    var section = canvas.closest('.watch-cat-section');
    if (section) {
      canvas.style.width  = section.offsetWidth  + 'px';
      canvas.style.height = section.offsetHeight + 'px';
    }
    _drawCatBg(canvas, key);
  }
  // Sample top strip of cat bg image to detect luminance
  function _catImgLuminance(imgEl, callback) {
    var cv = document.createElement('canvas');
    cv.width = 80; cv.height = 24;
    var ctx = cv.getContext('2d');
    try {
      ctx.drawImage(imgEl, 0, 0, imgEl.naturalWidth || 80, imgEl.naturalHeight || 24, 0, 0, 80, 24);
      var d = ctx.getImageData(0, 0, 80, 24).data;
      var sum = 0, n = 0;
      for (var i = 0; i < d.length; i += 4) { sum += 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2]; n++; }
      callback(n ? sum/n : 128);
    } catch(e) { callback(128); }
  }
  function _applyCatLabelColors(container) {
    container.querySelectorAll('.watch-cat-section').forEach(function(section) {
      var imgEl = section.querySelector('.cat-section-canvas');
      if (!imgEl) return;
      var header = section.querySelector('.cat-section-header');
      if (!header) return;
      function applyColor() {
        _catImgLuminance(imgEl, function(lum) {
          var isLight = lum > 140;
          var txtColor    = isLight ? 'rgba(0,0,0,0.88)'  : 'rgba(255,255,255,0.95)';
          var titleEl = header.querySelector('.cat-section-title');
          if (titleEl) titleEl.style.color = txtColor;
        });
      }
      if (imgEl.complete && imgEl.naturalWidth) applyColor();
      else imgEl.addEventListener('load', applyColor, { once: true });
    });
  }
  /* ══════════════════════════════════════
     EDITORS CHOICE SECTION
  ══════════════════════════════════════ */
  function renderEditorChoiceSection() {
    var section = document.getElementById('editorsChoiceSection');
    var row     = document.getElementById('editorsChoiceRow');
    if (!section || !row) return;
    var featured = _watchVideos.filter(function(v){ return v.featured === true && v.url; })
      .sort(function(a,b){ return (parseInt(b.id)||0)-(parseInt(a.id)||0); })
      .slice(0, 9);
    if (!featured.length) { section.style.display = 'none'; return; }
    section.style.display = '';
    row.innerHTML = featured.map(function(v, i){ return makeWatchVideoCard(v, i); }).join('');
    _attachVideoCardClicks(row);
  }
  function openEditorChoiceModal() {
    var featured = _watchVideos.filter(function(v){ return v.featured === true && v.url; })
      .sort(function(a,b){ return (parseInt(b.id)||0)-(parseInt(a.id)||0); });
    if (!featured.length) return;
    window._watchCatCurrentCatId = '__editors_choice__';
    _watchCatCurrentVideos = featured;
    _watchCatActiveTag  = 'all';
    _watchCatActiveSort = 'latest';
    var titleEl = document.getElementById('watchCatTitle');
    if (titleEl) titleEl.textContent = 'Top Picks';
    var coverEl      = document.getElementById('watchCatCover');
    var coverVideoEl = document.getElementById('watchCatCoverVideo');
    if (coverEl) {
      coverEl.style.backgroundImage = '';
      coverEl.classList.remove('wcat-cover-has-video');
      coverEl.style.display = '';
      if (coverVideoEl) { coverVideoEl.pause(); coverVideoEl.src = ''; coverVideoEl.style.display = 'none'; }
    }
    var si = document.getElementById('watchCatSearchInput');
    if (si) si.value = '';
    window._safeModalSearchClose('watchCat');
    watchCatRenderTagBar(featured);
    watchCatRenderList(_watchCatSortVideos(featured));
    document.getElementById('watchCatModal').classList.add('open');
    document.body.classList.add('watch-open');
    lockBodyScroll();
    safeHistoryPush({ type: 'modal', modal: 'watchcat', catId: '__editors_choice__' }, '', '#editors-choice');
  }
  window.renderEditorChoiceSection = renderEditorChoiceSection;
  window.openEditorChoiceModal     = openEditorChoiceModal;

  function renderWatchCatRows() {
    var container = document.getElementById('watchCatRows');
    if (!container || !_watchCats.length) return;
    // শুধু id 1-10 এর categories, ছোট থেকে বড় id অনুসারে
    var filteredCats = _watchCats
      .filter(function(c) { var n = parseInt(c.id); return n >= 1 && n <= 10; })
      .sort(function(a, b) { return (parseInt(a.id)||0) - (parseInt(b.id)||0); });
    container.innerHTML = filteredCats.map(function(cat, catIdx) {
      var vids = _watchVideos.filter(function(v) { return v.category === cat._key && v.url; })
        .sort(function(a,b){ return (parseInt(b.id)||0)-(parseInt(a.id)||0); })
        .slice(0, 9);
      if (!vids.length) return '';
      var cards = vids.map(function(v, i) { return makeWatchVideoCard(v, i); }).join('');
      var catTitle = cat.title || cat._key;
      catIdx = catIdx % 6;
      var bgLayer = '';
      return '<div class="watch-cat-section cat-tint-' + catIdx + '">'
        + bgLayer
        + '<div class="cat-section-content">'
        + '<div class="cat-section-header" style="cursor:pointer;" onclick="openWatchCatModal(\''+ cat._key +'\')">'
        + '<div class="cat-section-title">' + catTitle + '</div>'
        + '<a class="section-see-all" onclick="event.stopPropagation();openWatchCatModal(\''+ cat._key +'\')" >See All ›</a>'
        + '</div>'
        + '<div class="watch-cat-horiz">' + cards + '</div>'
        + '</div>'
        + '</div>';
    }).join('');
    _attachVideoCardClicks(container);
    _applyCatLabelColors(container);
  }
  /* ══════════════════════════════════════
     BROWSE CATEGORIES — YouTube playlist-style list
  ══════════════════════════════════════ */
  function renderBrowseCats() {
    var section = document.getElementById('browseCatsSection');
    var list    = document.getElementById('browseCatsList');
    if (!section || !list || !_watchCats.length) return;
    // Featured ছাড়া বাকি সব categories
    var featuredKeys = _watchCats
      .filter(function(c) {
        return (c.seo || '').split(',').map(function(t){ return t.trim().toLowerCase(); }).indexOf('featured') !== -1;
      })
      .map(function(c){ return c._key; });
    var browseCats = featuredKeys.length
      ? _watchCats.filter(function(c){ return featuredKeys.indexOf(c._key) === -1; })
      : [];
    if (!browseCats.length) { section.style.display = 'none'; return; }
    browseCats = browseCats.slice().sort(function(a, b) { return (parseInt(b.id)||0) - (parseInt(a.id)||0); });
    // সর্বোচ্চ ১২টি কার্ড
    browseCats = browseCats.slice(0, 9);
    section.style.display = '';
    list.innerHTML = browseCats.map(function(cat) {
      var thumbInner = _buildBrowseCatThumb(cat);
      var _bvcCount = (_watchCatVideoCount[cat._key] || 0);
      var _bvcBadge = _bvcCount > 0 ? '<div class="browse-cat-vidcount">' + _bvcCount + ' <i class="fa-solid fa-video"></i></div>' : '';
      return '<div class="browse-cat-card" onclick="openWatchCatModal(\'' + cat._key + '\')" ontouchstart="this.classList.add(\'tapped\')" ontouchend="this.classList.remove(\'tapped\')" ontouchcancel="this.classList.remove(\'tapped\')">'
        + '<div class="browse-cat-card-thumb">' + thumbInner + _bvcBadge + '</div>'
        + '<div class="browse-cat-card-label">' + (cat.title || cat._key) + '</div>'
        + '</div>';
    }).join('');
    if (typeof renderWatchBrowseArtists === 'function') renderWatchBrowseArtists();
  }
  window.renderBrowseCats = renderBrowseCats;
  /* ══════════════════════════════════════
     WATCH BROWSE ARTISTS
  ══════════════════════════════════════ */
  function renderWatchBrowseArtists() {
    var section = document.getElementById('watchBrowseArtistsSection');
    var list    = document.getElementById('watchBrowseArtistsList');
    if (!section || !list) return;
    if (!window._watchTagImagesRaw) { section.style.display = 'none'; return; }
    var artists = [];
    Object.keys(window._watchTagImagesRaw).forEach(function(name) {
      var val = window._watchTagImagesRaw[name];
      if (val && typeof val === 'object' && val.featured === true && val.url) {
        artists.push({ name: name, url: val.url });
      }
    });
    if (!artists.length) { section.style.display = 'none'; return; }
    // প্রতিটি artist এর episode count বের করো
    artists.forEach(function(artist) {
      artist.epCount = (_watchVideos || []).filter(function(v) {
        if (!v.seo) return false;
        return v.seo.split(',').map(function(t){ return t.trim(); }).indexOf(artist.name) !== -1;
      }).length;
    });
    // episode count বেশি যার সে আগে, সমান হলে নাম অনুসারে
    artists.sort(function(a, b) {
      return (b.epCount - a.epCount) || a.name.localeCompare(b.name);
    });
    // সর্বোচ্চ ৯টি card দেখাবে
    artists = artists.slice(0, 9);
    section.style.display = '';
    list.innerHTML = artists.map(function(artist) {
      var safeName = artist.name.replace(/'/g, "\\'");
      return '<div class="artist-card" ontouchstart="this.classList.add(\'tapped\')" ontouchend="this.classList.remove(\'tapped\')" ontouchcancel="this.classList.remove(\'tapped\')" onclick="openWatchArtistVidModal(\'' + safeName + '\')">'
        + '<div class="artist-card-circle">'
        + '<img src="' + artist.url + '" alt="' + artist.name + '" loading="lazy" onload="imgLoad(this)" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">'
        + '<div class="artist-card-circle-fallback" style="display:none;">🎬</div>'
        + '</div>'
        + '<div class="artist-card-name">' + artist.name + '</div>'
        + '</div>';
    }).join('');
    if (typeof renderWatchSportsSection === 'function') renderWatchSportsSection();
    if (typeof renderWatchReels === 'function') renderWatchReels();
  }
  window.renderWatchBrowseArtists = renderWatchBrowseArtists;
  /* ══════════════════════════════════════
     WATCH SPORTS SECTION
  ══════════════════════════════════════ */
  function renderWatchSportsSection() {
    var section = document.getElementById('exploreSportsSection');
    var list    = document.getElementById('exploreSportsList');
    if (!section || !list) return;
    var matches = (_sportsMatches || []).filter(function(m) {
      var state = _sportsMatchState(m);
      if (state === 'expired') return false;
      if (state === 'live' || state === 'highlights') return true;
      // countdown — শুধু ২৪ ঘণ্টার মধ্যে
      return (m.match_time || 0) * 1000 <= Date.now() + 24 * 60 * 60 * 1000;
    });
    if (!matches.length) { section.style.display = 'none'; return; }
    // sort: match_time নতুন আগে (descending); match_time নেই হলে শেষে
    matches.sort(function(a, b) {
      var ta = (a.match_time || 0), tb = (b.match_time || 0);
      return tb - ta;
    });
    var shown = matches.slice(0, 9);
    section.style.display = '';
    var flagHtml = function(src, name) {
      return src
        ? '<img src="' + src + '" alt="' + name + '" class="sports-flag-img" onerror="this.style.display=\'none\'">'
        : '<span class="sports-flag-fallback">' + name.substring(0,3).toUpperCase() + '</span>';
    };
    list.innerHTML = shown.map(function(match, idx) {
      var state      = _sportsMatchState(match);
      var key        = match._key;
      var flagA      = _getSportsFlagUrl(match.flag_a || '');
      var flagB      = _getSportsFlagUrl(match.flag_b || '');
      var teamA      = match.team_a || 'Team A';
      var teamB      = match.team_b || 'Team B';
      var stage      = match.stage || '';
      var title      = match.title || '';
      var isLive     = state === 'live';
      var isHighlights = state === 'highlights';
      var clickable  = isLive || isHighlights || !!(match.stream_url) || !!(match.intro) || !!(match.direct);
      var badgeHtml;
      if (isLive) {
        badgeHtml = '<div class="sports-live-badge"><span class="tv-live-pulse"></span>LIVE</div>';
      } else if (isHighlights) {
        badgeHtml = '<div class="sports-highlights-badge">HIGHLIGHTS</div>';
      } else {
        badgeHtml = '<div class="sports-countdown" id="wss-scd-' + key + '" data-matchtime="' + (match.match_time || 0) + '">--:--</div>';
      }
      var onclickAttr = clickable ? 'onclick="openSportsStream(\'' + key + '\')"' : '';
      var disabledClass = clickable ? '' : ' sports-card-disabled';
      return '<div class="sports-modal-card watch-sports-inline-card' + disabledClass + '" id="wss-mc-' + key + '" style="animation-delay:' + (idx * 0.07) + 's" ' + onclickAttr + '>'
        + '<span class="sports-card-trophy">&#127942;</span>'
        + '<div class="sports-card-inner">'
        + (title ? '<div class="sports-card-title">' + title + '</div>' : '')
        + '<div class="sports-teams-row">'
        + '<div class="sports-team">' + flagHtml(flagA, teamA) + '<span class="sports-team-name">' + teamA + '</span></div>'
        + '<div class="sports-vs">VS</div>'
        + '<div class="sports-team">' + flagHtml(flagB, teamB) + '<span class="sports-team-name">' + teamB + '</span></div>'
        + '</div>'
        + '<div class="sports-card-bottom">' + badgeHtml + '</div>'
        + '</div>'
        + '</div>';
    }).join('');
    if (typeof _startSportsCountdowns === 'function') _startSportsCountdowns();
  }
  window.renderWatchSportsSection = renderWatchSportsSection;
  /* ══════════════════════════════════════
     WATCH REELS SECTION
  ══════════════════════════════════════ */
  // watch reels strip — used keys tracker & scroll observer
  var _wrUsedKeys = {};
  var _wrScrollObs = null;

  function _wrMakeCardHtml(r, i) {
    var key      = r._key || String(i);
    var videoUrl = r.url || '';
    var thumb    = r.img || '';
    if (!thumb && videoUrl) {
      var ytId = getYouTubeId(videoUrl);
      if (ytId) thumb = getYouTubeThumb(ytId);
    }
    var mediaHtml;
    if (thumb) {
      mediaHtml = '<img class="wr-card-thumb" src="' + thumb + '" alt="' + (r.title || '') + '" loading="lazy" onerror="this.style.display=\'none\'">';
    } else if (videoUrl) {
      mediaHtml = '<video class="wr-card-thumb" src="' + videoUrl + '" muted playsinline preload="metadata" loop '
        + 'style="object-fit:cover;pointer-events:none;" '
        + 'onmouseenter="this.play()" onmouseleave="this.pause()"></video>';
    } else {
      mediaHtml = '<div class="wr-card-thumb" style="background:#111;"></div>';
    }
    return '<div class="wr-card" onclick="openReelsModalByKey(\'' + key + '\')" ontouchstart="this.classList.add(\'tapped\')" ontouchend="this.classList.remove(\'tapped\')" ontouchcancel="this.classList.remove(\'tapped\')">'
      + mediaHtml
      + '<div class="wr-card-overlay">'
      +   '<div class="wr-card-play"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="margin-left:2px"><path d="M8 5v14l11-7z"/></svg></div>'
      +   '<div class="wr-card-title">' + (r.title || '') + '</div>'
      + '</div>'
      + '</div>';
  }

  // ৯টি কার্ড বাছাই: সর্বশেষ newCount টি (unused) + unused থেকে random restCount টি, তারপর shuffle
  // unused শেষ হলে null রিটার্ন — scroll বন্ধ হবে
  function _wrPickBatch(reels, newCount, restCount) {
    var unused = reels.filter(function(r) { return !_wrUsedKeys[r._key || r.id]; });
    if (!unused.length) return null; // সব দেখানো হয়েছে
    // id desc sort → নতুন গুলো
    var sorted = unused.slice().sort(function(a, b) { return (b.id || 0) - (a.id || 0); });
    var newOnes = sorted.slice(0, Math.min(newCount, sorted.length));
    newOnes.forEach(function(r) { _wrUsedKeys[r._key || r.id] = true; });
    // বাকি unused থেকে random
    var remaining = reels.filter(function(r) { return !_wrUsedKeys[r._key || r.id]; });
    var shuffled  = _shuffleArray(remaining.slice());
    var randOnes  = shuffled.slice(0, Math.min(restCount, shuffled.length));
    randOnes.forEach(function(r) { _wrUsedKeys[r._key || r.id] = true; });
    // দুটো মিলিয়ে shuffle করো
    return _shuffleArray(newOnes.concat(randOnes));
  }

  function _wrAppendCards(grid, batch) {
    var frag = document.createDocumentFragment();
    batch.forEach(function(r, i) {
      var tmp = document.createElement('div');
      tmp.innerHTML = _wrMakeCardHtml(r, i);
      frag.appendChild(tmp.firstChild);
    });
    grid.appendChild(frag);
    _attachReelLongPress(grid);
  }

  function _wrAttachScrollEnd(grid) {
    if (_wrScrollObs) { _wrScrollObs.disconnect(); _wrScrollObs = null; }
    var sentinel = grid.querySelector('.wr-scroll-sentinel');
    if (!sentinel) {
      sentinel = document.createElement('div');
      sentinel.className = 'wr-scroll-sentinel';
      sentinel.style.cssText = 'width:1px;height:100%;flex-shrink:0;pointer-events:none;';
      grid.appendChild(sentinel);
    }
    _wrScrollObs = new IntersectionObserver(function(entries) {
      if (!entries[0].isIntersecting) return;
      var reels = window._reelsData || [];
      if (!reels.length) return;
      var batch = _wrPickBatch(reels, 4, 5);
      if (!batch) {
        // সব reels দেখানো হয়েছে — sentinel সরাও, observer বন্ধ করো
        _wrScrollObs.disconnect(); _wrScrollObs = null;
        sentinel.remove();
        return;
      }
      _wrAppendCards(grid, batch);
      grid.appendChild(sentinel);
    }, { root: grid, threshold: 0.5 });
    _wrScrollObs.observe(sentinel);
  }

  function renderWatchReels() {
    var section = document.getElementById('watchReelsSection');
    var grid    = document.getElementById('watchReelsGrid');
    if (!section || !grid) return;
    var reels = window._reelsData || [];
    if (!reels.length) { section.style.display = 'none'; return; }
    section.style.display = '';
    _wrUsedKeys = {};
    if (_wrScrollObs) { _wrScrollObs.disconnect(); _wrScrollObs = null; }
    grid.innerHTML = '';
    var batch = _wrPickBatch(reels, 4, 5);
    if (!batch) return;
    _wrAppendCards(grid, batch);
    _wrAttachScrollEnd(grid);
  }
  window.renderWatchReels = renderWatchReels;
  /* ══════════════════════════════════════
     REELS ALL MODAL
  ══════════════════════════════════════ */

  var _allWatchArtistsList = [];
  function _getAllWatchArtists() {
    var artists = [];
    if (!window._watchTagImagesRaw) return artists;
    Object.keys(window._watchTagImagesRaw).forEach(function(name) {
      var val = window._watchTagImagesRaw[name];
      if (val && typeof val === 'object' && val.featured === true && val.url) {
        artists.push({ name: name, url: val.url });
      }
    });
    artists.forEach(function(artist) {
      artist.epCount = (_watchVideos || []).filter(function(v) {
        if (!v.seo) return false;
        return v.seo.split(',').map(function(t){ return t.trim(); }).indexOf(artist.name) !== -1;
      }).length;
    });
    return artists.sort(function(a, b) {
      return (b.epCount - a.epCount) || a.name.localeCompare(b.name);
    });
  }
  function _renderAllWatchArtistsGrid(artists) {
    var grid = document.getElementById('allWatchArtistsGrid');
    if (!grid) return;
    if (!artists.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:48px 16px;color:var(--muted);font-family:Plus Jakarta Sans,sans-serif;font-size:0.9rem;">No artists found</div>';
      return;
    }
    grid.innerHTML = artists.map(function(artist) {
      var safeName = artist.name.replace(/'/g, "\\'");
      return '<div class="all-artist-card" ontouchstart="this.classList.add(\'tapped\')" ontouchend="this.classList.remove(\'tapped\')" ontouchcancel="this.classList.remove(\'tapped\')" onclick="closeAllWatchArtistsModal();setTimeout(function(){openWatchArtistVidModal(\'' + safeName + '\')},220)">'
        + '<div class="all-artist-circle">'
        + '<img src="' + artist.url + '" alt="' + artist.name + '" loading="lazy" onload="imgLoad(this)" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">'
        + '<div class="artist-card-circle-fallback" style="display:none;">🎬</div>'
        + '</div>'
        + '<div class="all-artist-name">' + artist.name + '</div>'
        + '</div>';
    }).join('');
  }
  function openAllWatchArtistsModal(fromPopstate) {
    _allWatchArtistsList = _getAllWatchArtists();
    var si = document.getElementById('allWatchArtistsSearchInput');
    if (si) si.value = '';
    window._safeModalSearchClose('allWatchArtists');
    _renderAllWatchArtistsGrid(_allWatchArtistsList);
    var modal = document.getElementById('allWatchArtistsModal');
    if (!modal) return;
    modal.classList.add('open');
    document.body.classList.add('watch-open');
    lockBodyScroll();
    if (!fromPopstate) safeHistoryPush({ type: 'modal', modal: 'allwatchartists' }, '', '#watchartistsall');
  }
  function closeAllWatchArtistsModal(fromPopstate) {
    var modal = document.getElementById('allWatchArtistsModal');
    if (!modal) return;
    closeModalWithAnim(modal, 280, function() {
      document.body.classList.remove('watch-open');
      _scrollLockCount = 1; unlockBodyScroll();
    });
    if (!fromPopstate) {
      if (window.location.hash === '#watchartistsall') try { history.back(); } catch(e) {}
    }
  }
  function _allWatchArtistsFilter(q) {
    var filtered = q
      ? _allWatchArtistsList.filter(function(a){ return a.name.toLowerCase().includes(q.toLowerCase()); })
      : _allWatchArtistsList;
    _renderAllWatchArtistsGrid(filtered);
  }
  var _dAllWatchArtistsFilter = (function() {
    var t; return function(q) { clearTimeout(t); t = setTimeout(function(){ _allWatchArtistsFilter(q); }, 180); };
  })();
  window.openAllWatchArtistsModal  = openAllWatchArtistsModal;
  window.closeAllWatchArtistsModal = closeAllWatchArtistsModal;
  window._dAllWatchArtistsFilter   = _dAllWatchArtistsFilter;
  /* ══════════════════════════════════════
     WATCH ARTIST VIDEOS MODAL
  ══════════════════════════════════════ */
  var _watchArtistVidCurrentTag  = '';
  var _watchArtistVidCurrentVids = [];
  var _watchArtistVidFiltered    = [];
  function openWatchArtistVidModal(tagName) {
    _watchArtistVidCurrentTag = tagName;
    var vids = (_watchVideos || []).filter(function(v) {
      if (!v.seo) return false;
      return v.seo.split(',').map(function(t){ return t.trim(); }).indexOf(tagName) !== -1;
    });
    vids.sort(function(a, b){ return (parseInt(b.id)||0) - (parseInt(a.id)||0); });
    _watchArtistVidCurrentVids = vids;
    _watchArtistVidFiltered    = vids;
    var titleEl = document.getElementById('watchArtistVidTitle');
    if (titleEl) titleEl.textContent = tagName;
    var listEl = document.getElementById('watchArtistVidList');
    if (listEl) listEl.innerHTML = vids.length
      ? vids.map(function(v, i){ return makeWatchVideoCard(v, i); }).join('')
      : '<div style="text-align:center;padding:48px 16px;color:var(--muted);font-family:Plus Jakarta Sans,sans-serif;font-size:0.9rem;">No videos found</div>';
    // click handler যোগ করো
    if (listEl) listEl.querySelectorAll('.watch-video-card').forEach(function(card) {
      card.onclick = function(){ openWatchVideo(card.dataset.wkey); };
    });
    var si = document.getElementById('watchArtistVidSearchInput');
    if (si) si.value = '';
    window._safeModalSearchClose('watchArtistVid');
    var modal = document.getElementById('watchArtistVidModal');
    if (!modal) return;
    modal.classList.add('open');
    document.body.classList.add('watch-open');
    lockBodyScroll();
    safeHistoryPush({ type: 'modal', modal: 'watchartistvid', tag: tagName }, '', '#watchartistp_' + tagName.replace(/\s+/g, '-'));
  }
  function closeWatchArtistVidModal(fromPopstate) {
    var modal = document.getElementById('watchArtistVidModal');
    if (!modal) return;
    closeModalWithAnim(modal, 280, function() {
      document.body.classList.remove('watch-open');
      _scrollLockCount = 1; unlockBodyScroll();
    });
    if (!fromPopstate) {
      var curHash = window.location.hash.replace('#', '');
      if (curHash.startsWith('watchartistp_')) try { history.back(); } catch(e) {}
    }
  }
  function _watchArtistVidFilter(q) {
    _watchArtistVidFiltered = q
      ? _watchArtistVidCurrentVids.filter(function(v){ return (v.title||'').toLowerCase().includes(q.toLowerCase()); })
      : _watchArtistVidCurrentVids;
    var listEl = document.getElementById('watchArtistVidList');
    if (listEl) {
      listEl.innerHTML = _watchArtistVidFiltered.length
        ? _watchArtistVidFiltered.map(function(v, i){ return makeWatchVideoCard(v, i); }).join('')
        : '<div style="text-align:center;padding:48px 16px;color:var(--muted);font-size:0.9rem;">No videos found</div>';
      listEl.querySelectorAll('.watch-video-card').forEach(function(card) {
        card.onclick = function(){ openWatchVideo(card.dataset.wkey); };
      });
    }
  }
  var _dWatchArtistVidFilter = (function() {
    var t; return function(q) { clearTimeout(t); t = setTimeout(function(){ _watchArtistVidFilter(q); }, 180); };
  })();
  window.openWatchArtistVidModal  = openWatchArtistVidModal;
  window.closeWatchArtistVidModal = closeWatchArtistVidModal;
  window._dWatchArtistVidFilter   = _dWatchArtistVidFilter;
  function renderListenBrowseCats() {
    var section = document.getElementById('listenBrowseCatsSection');
    var list    = document.getElementById('listenBrowseCatsList');
    if (!section || !list || !_podcastCats.length) return;
    // random shuffle, সর্বোচ্চ ৯টি কার্ড
    var listenCats = _podcastCats.slice().sort(function(a, b) { return (parseInt(b.id)||0) - (parseInt(a.id)||0); }).slice(0, 9);
    section.style.display = '';
    list.innerHTML = listenCats.map(function(cat) {
      // thumbnail: cat.img থাকলে সেটা, না থাকলে সেই category-র episode img থেকে collage
      var eps = (_podcastEps || []).filter(function(e){ return e.category === cat._key && e.img; });
      var thumbInner;
      if (cat.img) {
        thumbInner = '<img src="' + cat.img + '" alt="" class="browse-cat-card-img" loading="lazy" onload="imgLoad(this)" onerror="imgErr(this)">';
      } else if (eps.length >= 4) {
        thumbInner = '<div style="display:flex;flex-direction:column;width:100%;height:100%;">'
          + '<div style="display:flex;flex:1;gap:1px;">'
            + '<div style="flex:1;overflow:hidden;"><img src="' + eps[0].img + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" onload="imgLoad(this)" onerror="imgErr(this)"></div>'
            + '<div style="flex:1;overflow:hidden;"><img src="' + eps[1].img + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" onload="imgLoad(this)" onerror="imgErr(this)"></div>'
          + '</div>'
          + '<div style="display:flex;flex:1;gap:1px;margin-top:1px;">'
            + '<div style="flex:1;overflow:hidden;"><img src="' + eps[2].img + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" onload="imgLoad(this)" onerror="imgErr(this)"></div>'
            + '<div style="flex:1;overflow:hidden;"><img src="' + eps[3].img + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" onload="imgLoad(this)" onerror="imgErr(this)"></div>'
          + '</div>'
        + '</div>';
      } else if (eps.length === 2 || eps.length === 3) {
        thumbInner = '<div style="display:flex;width:100%;height:100%;gap:1px;">'
          + '<div style="flex:1;overflow:hidden;"><img src="' + eps[0].img + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" onload="imgLoad(this)" onerror="imgErr(this)"></div>'
          + '<div style="flex:1;overflow:hidden;"><img src="' + eps[1].img + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" onload="imgLoad(this)" onerror="imgErr(this)"></div>'
        + '</div>';
      } else if (eps.length === 1) {
        thumbInner = '<img src="' + eps[0].img + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" onload="imgLoad(this)" onerror="imgErr(this)">';
      } else {
        thumbInner = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.6rem;background:var(--border2);">🎙️</div>';
      }
      var _epCount = (_podcastCatEpCount[cat._key] || 0);
      var _epBadge = _epCount > 0 ? '<div class="browse-cat-vidcount">' + _epCount + ' <i class="fa-solid fa-music"></i></div>' : '';
      return '<div class="browse-cat-card" onclick="openPodcastEpModal(\'' + cat._key + '\')" ontouchstart="this.classList.add(\'tapped\')" ontouchend="this.classList.remove(\'tapped\')" ontouchcancel="this.classList.remove(\'tapped\')">'
        + '<div class="browse-cat-card-thumb">' + thumbInner + _epBadge + '</div>'
        + '<div class="browse-cat-card-label">' + (cat.title || cat._key) + '</div>'
        + '</div>';
    }).join('');
  }
  window.renderListenBrowseCats = renderListenBrowseCats;
  /* ══════════════════════════════════════
     BROWSE ARTISTS — listen_tag_images, featured:true
  ══════════════════════════════════════ */
  function renderListenBrowseArtists() {
    var section = document.getElementById('listenBrowseArtistsSection');
    var list    = document.getElementById('listenBrowseArtistsList');
    if (!section || !list) return;
    if (!window._listenTagImagesRaw) { section.style.display = 'none'; return; }
    var artists = [];
    Object.keys(window._listenTagImagesRaw).forEach(function(name) {
      var val = window._listenTagImagesRaw[name];
      if (val && typeof val === 'object') {
        if (val.featured === true && val.url) {
          artists.push({ name: name, url: val.url });
        }
      }
    });
    if (!artists.length) { section.style.display = 'none'; return; }
    // episode count বের করো
    artists.forEach(function(artist) {
      artist.epCount = (_podcastEps || []).filter(function(e) {
        if (!e.seo) return false;
        return e.seo.split(',').map(function(t){ return t.trim(); }).indexOf(artist.name) !== -1;
      }).length;
    });
    // episode count বেশি যার সে আগে
    artists.sort(function(a, b) {
      return (b.epCount - a.epCount) || a.name.localeCompare(b.name);
    });
    // max 9 cards
    artists = artists.slice(0, 9);
    section.style.display = '';
    list.innerHTML = artists.map(function(artist) {
      var safeName = artist.name.replace(/'/g, "\\'");
      return '<div class="artist-card" ontouchstart="this.classList.add(\'tapped\')" ontouchend="this.classList.remove(\'tapped\')" ontouchcancel="this.classList.remove(\'tapped\')" onclick="openArtistEpModal(\'' + safeName + '\')">'        + '<div class="artist-card-circle">'        + '<img src="' + artist.url + '" alt="' + artist.name + '" loading="lazy" onload="imgLoad(this)" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">'        + '<div class="artist-card-circle-fallback" style="display:none;">&#127925;</div>'        + '</div>'        + '<div class="artist-card-name">' + artist.name + '</div>'        + '</div>';
    }).join('');
  }
  window.renderListenBrowseArtists = renderListenBrowseArtists;
  /* ══════════════════════════════════════
     ARTIST EPISODE MODAL
  ══════════════════════════════════════ */
  var _artistEpCurrentTag   = '';
  var _artistEpCurrentEps   = [];
  var _artistEpFilteredEps  = [];
  function openArtistEpModal(tagName) {
    _artistEpCurrentTag = tagName;
    // সেই tag-এর সব episode খুঁজে বের করো
    var eps = (_podcastEps || []).filter(function(e) {
      if (!e.seo) return false;
      return e.seo.split(',').map(function(t){ return t.trim(); }).indexOf(tagName) !== -1;
    });
    eps.sort(function(a, b){ return (parseInt(b.id)||0) - (parseInt(a.id)||0); });
    _artistEpCurrentEps  = eps;
    _artistEpFilteredEps = eps;
    // title set
    var titleEl = document.getElementById('artistEpModalTitle');
    if (titleEl) titleEl.textContent = tagName;
    // list render
    var listEl = document.getElementById('artistEpList');
    if (listEl) listEl.innerHTML = '';
    _renderArtistEpList(_artistEpFilteredEps);
    // search reset
    var si = document.getElementById('artistEpSearchInput');
    if (si) si.value = '';
    window._safeModalSearchClose('artistEp');
    // open
    var modal = document.getElementById('artistEpModal');
    if (!modal) return;
    modal.classList.add('open');
    document.body.classList.add('pepmodal-open');
    lockBodyScroll();
    safeHistoryPush({ type: 'modal', modal: 'artistep', tag: tagName }, '', '#artistp_' + tagName.replace(/\s+/g, '-'));
  }
  function _renderArtistEpList(eps) {
    var listEl = document.getElementById('artistEpList');
    if (!listEl) return;
    if (!eps.length) {
      listEl.innerHTML = '<div style="text-align:center;padding:48px 16px;color:var(--muted);font-family:Plus Jakarta Sans,sans-serif;font-size:0.9rem;">No episodes found</div>';
      return;
    }
    listEl.innerHTML = eps.map(function(ep, i) {
      return typeof pepBuildRowList === 'function'
        ? pepBuildRowList(ep, i, "pcEpPillPlay('" + ep._key + "')")
        : '';
    }).join('');
  }
  function closeArtistEpModal(fromPopstate) {
    var modal = document.getElementById('artistEpModal');
    if (!modal) return;
    closeModalWithAnim(modal, 280, function() {
      document.body.classList.remove('pepmodal-open');
      _scrollLockCount = 1; unlockBodyScroll();
    });
    if (!fromPopstate) {
      var curHash = window.location.hash.replace('#', '');
      if (curHash.startsWith('artistp_')) try { history.back(); } catch(e) {}
    }
  }
  function _artistEpFilter(q) {
    _artistEpFilteredEps = q
      ? _artistEpCurrentEps.filter(function(e) {
          return (e.title || '').toLowerCase().includes(q.toLowerCase());
        })
      : _artistEpCurrentEps;
    _renderArtistEpList(_artistEpFilteredEps);
  }
  var _dArtistEpFilter = (function() {
    var t; return function(q) { clearTimeout(t); t = setTimeout(function(){ _artistEpFilter(q); }, 180); };
  })();
  window.openArtistEpModal  = openArtistEpModal;
  window.closeArtistEpModal = closeArtistEpModal;
  window._dArtistEpFilter   = _dArtistEpFilter;
  /* ══════════════════════════════════════
     ALL ARTISTS MODAL
  ══════════════════════════════════════ */
  var _allArtistsList = [];
  function _getAllArtists() {
    var artists = [];
    if (!window._listenTagImagesRaw) return artists;
    Object.keys(window._listenTagImagesRaw).forEach(function(name) {
      var val = window._listenTagImagesRaw[name];
      if (val && typeof val === 'object' && val.featured === true && val.url) {
        artists.push({ name: name, url: val.url });
      }
    });
    artists.forEach(function(artist) {
      artist.epCount = (_podcastEps || []).filter(function(e) {
        if (!e.seo) return false;
        return e.seo.split(',').map(function(t){ return t.trim(); }).indexOf(artist.name) !== -1;
      }).length;
    });
    return artists.sort(function(a, b) {
      return (b.epCount - a.epCount) || a.name.localeCompare(b.name);
    });
  }
  function _renderAllArtistsGrid(artists) {
    var grid = document.getElementById('allArtistsGrid');
    if (!grid) return;
    if (!artists.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:48px 16px;color:var(--muted);font-family:Plus Jakarta Sans,sans-serif;font-size:0.9rem;">No artists found</div>';
      return;
    }
    grid.innerHTML = artists.map(function(artist) {
      var safeName = artist.name.replace(/'/g, "\\'");
      return '<div class="all-artist-card" ontouchstart="this.classList.add(\'tapped\')" ontouchend="this.classList.remove(\'tapped\')" ontouchcancel="this.classList.remove(\'tapped\')" onclick="closeAllArtistsModal();setTimeout(function(){openArtistEpModal(\'' + safeName + '\')},220)">'
        + '<div class="all-artist-circle">'
        + '<img src="' + artist.url + '" alt="' + artist.name + '" loading="lazy" onload="imgLoad(this)" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">'
        + '<div class="artist-card-circle-fallback" style="display:none;">🎵</div>'
        + '</div>'
        + '<div class="all-artist-name">' + artist.name + '</div>'
        + '</div>';
    }).join('');
  }
  function openAllArtistsModal(fromPopstate) {
    _allArtistsList = _getAllArtists();
    var si = document.getElementById('allArtistsSearchInput');
    if (si) si.value = '';
    window._safeModalSearchClose('allArtists');
    _renderAllArtistsGrid(_allArtistsList);
    var modal = document.getElementById('allArtistsModal');
    if (!modal) return;
    modal.classList.add('open');
    document.body.classList.add('pepmodal-open');
    lockBodyScroll();
    if (!fromPopstate) safeHistoryPush({ type: 'modal', modal: 'allartists' }, '', '#listenartistsall');
  }
  function closeAllArtistsModal(fromPopstate) {
    var modal = document.getElementById('allArtistsModal');
    if (!modal) return;
    closeModalWithAnim(modal, 280, function() {
      document.body.classList.remove('pepmodal-open');
      _scrollLockCount = 1; unlockBodyScroll();
    });
    if (!fromPopstate) {
      if (window.location.hash === '#listenartistsall') try { history.back(); } catch(e) {}
    }
  }
  function _allArtistsFilter(q) {
    var filtered = q
      ? _allArtistsList.filter(function(a){ return a.name.toLowerCase().includes(q.toLowerCase()); })
      : _allArtistsList;
    _renderAllArtistsGrid(filtered);
  }
  var _dAllArtistsFilter = (function() {
    var t; return function(q) { clearTimeout(t); t = setTimeout(function(){ _allArtistsFilter(q); }, 180); };
  })();
  window.openAllArtistsModal  = openAllArtistsModal;
  window.closeAllArtistsModal = closeAllArtistsModal;
  window._dAllArtistsFilter   = _dAllArtistsFilter;
  var _listenBrowseAllItems = [];
  var _listenBrowseAllActiveTag = 'all';
  function _listenBrowseAllRenderTagBar() {
    var bar = document.getElementById('listenBrowseAllTagBar');
    if (!bar) return;
    var tags = [];
    _listenBrowseAllItems.forEach(function(cat) {
      if (!cat.seo) return;
      cat.seo.split(',').map(function(t){ return t.trim(); }).forEach(function(t){
        if (t && tags.indexOf(t) === -1) tags.push(t);
      });
    });
    var active = _listenBrowseAllActiveTag;
    var html = '<div class="ltv-tag-chip' + (active === 'all' ? ' active' : '') + '" onclick="listenBrowseAllTagSelect(\'all\')">All</div>';
    tags.forEach(function(tag) {
      html += '<div class="ltv-tag-chip' + (active === tag ? ' active' : '') + '" onclick="listenBrowseAllTagSelect(\'' + tag.replace(/'/g, "\\'") + '\')">' + tag + '</div>';
    });
    bar.innerHTML = html;
  }
  function listenBrowseAllTagSelect(tag) {
    _listenBrowseAllActiveTag = tag;
    _listenBrowseAllRenderTagBar();
    var si = document.getElementById('listenBrowseAllSearchInput');
    var q = si ? si.value.trim() : '';
    if (tag === 'all') {
      _renderListenBrowseAllList(q ? _listenBrowseAllItems.filter(function(c){ return (c.title||c._key).toLowerCase().includes(q.toLowerCase()); }) : _listenBrowseAllItems);
    } else {
      var filtered = _listenBrowseAllItems.filter(function(cat) {
        if (!cat.seo) return false;
        return cat.seo.split(',').map(function(t){ return t.trim(); }).indexOf(tag) !== -1;
      });
      if (q) filtered = filtered.filter(function(c){ return (c.title||c._key).toLowerCase().includes(q.toLowerCase()); });
      _renderListenBrowseAllList(filtered);
    }
  }
  window.listenBrowseAllTagSelect = listenBrowseAllTagSelect;
  function _buildListenCatThumb(cat) {
    if (cat.img) {
      return '<img src="' + cat.img + '" alt="" class="browse-cat-card-img" loading="lazy" onload="imgLoad(this)" onerror="this.style.display=\'none\';this.nextElementSibling&&(this.nextElementSibling.style.display=\'flex\')">'
        + '<div class="browse-cat-card-fallback" style="display:none;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg></div>';
    }
    var imgs = (_podcastEps || []).filter(function(e){ return e.category === cat._key && e.img; }).slice(0, 4).map(function(e){ return e.img; });
    if (imgs.length >= 4) {
      return '<div style="display:flex;flex-direction:column;width:100%;height:100%;">'
        + '<div style="display:flex;flex:1;gap:1px;">'
          + '<div style="flex:1;overflow:hidden;"><img src="' + imgs[0] + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy"></div>'
          + '<div style="flex:1;overflow:hidden;"><img src="' + imgs[1] + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy"></div>'
        + '</div>'
        + '<div style="display:flex;flex:1;gap:1px;margin-top:1px;">'
          + '<div style="flex:1;overflow:hidden;"><img src="' + imgs[2] + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy"></div>'
          + '<div style="flex:1;overflow:hidden;"><img src="' + imgs[3] + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy"></div>'
        + '</div>'
      + '</div>';
    } else if (imgs.length === 3) {
      return '<div style="display:flex;flex-direction:column;width:100%;height:100%;">'
        + '<div style="display:flex;flex:1;gap:1px;">'
          + '<div style="flex:1;overflow:hidden;"><img src="' + imgs[0] + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy"></div>'
          + '<div style="flex:1;overflow:hidden;"><img src="' + imgs[1] + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy"></div>'
        + '</div>'
        + '<div style="flex:1;overflow:hidden;margin-top:1px;"><img src="' + imgs[2] + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy"></div>'
      + '</div>';
    } else if (imgs.length === 2) {
      return '<div style="display:flex;width:100%;height:100%;gap:1px;">'
        + '<div style="flex:1;overflow:hidden;"><img src="' + imgs[0] + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy"></div>'
        + '<div style="flex:1;overflow:hidden;"><img src="' + imgs[1] + '" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy"></div>'
      + '</div>';
    } else if (imgs.length === 1) {
      return '<img src="' + imgs[0] + '" alt="" class="browse-cat-card-img" loading="lazy">';
    }
    return '<div class="browse-cat-card-fallback"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg></div>';
  }
  function _renderListenBrowseAllList(cats) {
    var listEl = document.getElementById('listenBrowseAllList');
    if (!listEl) return;
    if (!cats.length) {
      listEl.innerHTML = '<div style="text-align:center;padding:48px 16px;color:var(--muted);font-family:DM Sans,sans-serif;font-size:0.9rem;">No categories found</div>';
      return;
    }
    listEl.innerHTML = cats.map(function(cat) {
      var thumbInner = _buildListenCatThumb(cat);
      var _epCount = (_podcastCatEpCount[cat._key] || 0);
      var _epBadge = _epCount > 0 ? '<div class="browse-cat-vidcount">' + _epCount + ' <i class="fa-solid fa-music"></i></div>' : '';
      return '<div class="browse-cat-card" data-catkey="' + cat._key + '" onclick="(function(el){var k=el.dataset.catkey;closeListenBrowseAllModal(true);try{history.replaceState({type:\'modal\',modal:\'cat\',catKey:k},\'\',\'#\'+k);}catch(e){}setTimeout(function(){openPodcastEpModal(k);},250);})(this)" ontouchstart="this.classList.add(\'tapped\')" ontouchend="this.classList.remove(\'tapped\')" ontouchcancel="this.classList.remove(\'tapped\')">'
        + '<div class="browse-cat-card-thumb">' + thumbInner + _epBadge + '</div>'
        + '<div class="browse-cat-card-label">' + (cat.title || cat._key) + '</div>'
        + '</div>';
    }).join('');
  }
  function openListenBrowseAllModal(fromPopstate) {
    var modal = document.getElementById('listenBrowseAllModal');
    if (!modal) return;
    _listenBrowseAllItems = _podcastCats.slice();
    _listenBrowseAllActiveTag = 'all';
    var si = document.getElementById('listenBrowseAllSearchInput');
    if (si) si.value = '';
    window._safeModalSearchClose('listenBrowseAll');
    _listenBrowseAllRenderTagBar();
    _renderListenBrowseAllList(_listenBrowseAllItems);
    modal.classList.add('open');
    document.body.classList.add('pepmodal-open');
    lockBodyScroll();
    if (!fromPopstate) safeHistoryPush({ type: 'modal', modal: 'listenbrowseall' }, '', '#listenbrowseall');
  }
  function closeListenBrowseAllModal(fromPopstate) {
    var modal = document.getElementById('listenBrowseAllModal');
    if (!modal) return;
    closeModalWithAnim(modal, 280, function() {
      var pepOpen = document.getElementById('podcastEpModal') && document.getElementById('podcastEpModal').classList.contains('open');
      if (!pepOpen) { document.body.classList.remove('pepmodal-open'); }
      _scrollLockCount = 1; unlockBodyScroll();
    });
    if (!fromPopstate) {
      if (window.location.hash === '#listenbrowseall') try { history.back(); } catch(e) {}
    }
  }
  function _listenBrowseAllFilter(q) {
    var base = _listenBrowseAllActiveTag === 'all'
      ? _listenBrowseAllItems
      : _listenBrowseAllItems.filter(function(cat) {
          if (!cat.seo) return false;
          return cat.seo.split(',').map(function(t){ return t.trim(); }).indexOf(_listenBrowseAllActiveTag) !== -1;
        });
    var filtered = q
      ? base.filter(function(c){ return (c.title || c._key).toLowerCase().includes(q.toLowerCase()); })
      : base;
    _renderListenBrowseAllList(filtered);
  }
  var _dListenBrowseAllFilter = (function() {
    var t; return function(q) { clearTimeout(t); t = setTimeout(function(){ _listenBrowseAllFilter(q); }, 180); };
  })();
  window.openListenBrowseAllModal  = openListenBrowseAllModal;
  window.closeListenBrowseAllModal = closeListenBrowseAllModal;
  window._dListenBrowseAllFilter   = _dListenBrowseAllFilter;
  /* ══════════════════════════════════════
     POPULAR WEB SERIES — Category Poster Row
  ══════════════════════════════════════ */
  function renderPopularSeries() {
    var section = document.getElementById('popularSeriesSection');
    var scroll  = document.getElementById('popularSeriesScroll');
    if (!section || !scroll) return;
    var catsWithImg = _watchCats.filter(function(cat) { return cat.img; });
    if (!catsWithImg.length) { section.style.display = 'none'; return; }
    scroll.innerHTML = catsWithImg.map(function(cat) {
      var key = cat._key;
      var title = cat.title || key;
      return '<div class="popular-series-item" onclick="openWatchCatModal(\'' + key + '\')" ontouchstart="this.classList.add(\'tapped\')" ontouchend="this.classList.remove(\'tapped\')" ontouchcancel="this.classList.remove(\'tapped\')">'
        + '<div class="popular-series-card">'
        + '<img src="' + cat.img + '" alt="' + title + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">'
        + '<div class="popular-series-card-fallback" style="display:none;">' + title + '</div>'
        + '</div>'
        + '</div>';
    }).join('');
    section.style.display = 'block';
    _initPopularCarousel('popularSeriesScroll', 'popularSeriesDots');
  }
  function _initPopularCarousel(scrollId, dotsId) {
    var scroll = document.getElementById(scrollId);
    if (!scroll) return;
    var origItems = Array.from(scroll.querySelectorAll('.popular-series-item'));
    if (!origItems.length) return;
    var total = origItems.length;
    var containerW = scroll.parentElement.offsetWidth || window.innerWidth;
    // Dots
    var dotsEl = dotsId ? document.getElementById(dotsId) : null;
    function _renderDots() {
      if (!dotsEl) return;
      dotsEl.innerHTML = Array.from({length: total}, function(_, i) {
        return '<div class="popular-series-dot" data-i="' + i + '"></div>';
      }).join('');
    }
    function _updateDots(realIdx) {
      if (!dotsEl) return;
      var dots = dotsEl.querySelectorAll('.popular-series-dot');
      dots.forEach(function(d, i) {
        d.classList.toggle('active', i === realIdx - 1);
      });
    }
    _renderDots();
    // Clone first and last for infinite loop
    var cloneLast = origItems[total - 1].cloneNode(true);
    var cloneFirst = origItems[0].cloneNode(true);
    cloneLast.classList.add('carousel-clone');
    cloneFirst.classList.add('carousel-clone');
    scroll.insertBefore(cloneLast, origItems[0]);
    scroll.appendChild(cloneFirst);
    var allItems = Array.from(scroll.querySelectorAll('.popular-series-item'));
    // real items are index 1..total, clones are 0 and total+1
    var _activeIdx = 1; // start at first real item
    var _autoTimer = null;
    var _isTransitioning = false;
    var _activeW = containerW;
    var _inactiveW = containerW;
    function _getItemW() {
      return _activeW + 12;
    }
    function _updatePadding() {
      scroll.style.paddingLeft = '0px';
      scroll.style.paddingRight = '0px';
    }
    function _updateItemWidths(activeIdx) {
      allItems.forEach(function(el, i) {
        el.style.width = (i === activeIdx ? _activeW : _inactiveW) + 'px';
      });
    }
    function _scrollTo(idx, animated) {
      var target = idx * containerW;
      if (!animated) {
        scroll.style.scrollBehavior = 'auto';
        scroll.scrollLeft = target;
        return;
      }
      var start = scroll.scrollLeft;
      var diff = target - start;
      var duration = 600;
      var startTime = null;
      function ease(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
      function step(ts) {
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        scroll.scrollLeft = start + diff * ease(progress);
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    function _setActive(idx, animated) {
      if (_isTransitioning) return;
      _activeIdx = idx;
      allItems.forEach(function(el, i) {
        el.classList.toggle('active', i === _activeIdx);
      });
      _updateItemWidths(_activeIdx);
      _updateDots(_activeIdx);
      _scrollTo(_activeIdx, animated !== false);
      // after smooth scroll, jump silently if on clone
      if (animated !== false) {
        _isTransitioning = true;
        setTimeout(function() {
          if (_activeIdx === 0) {
            // jumped to clone of last → silently go to real last
            _activeIdx = total;
            allItems.forEach(function(el, i) { el.classList.toggle('active', i === _activeIdx); });
            _updateItemWidths(_activeIdx);
            _updateDots(_activeIdx);
            _scrollTo(_activeIdx, false);
          } else if (_activeIdx === total + 1) {
            // jumped to clone of first → silently go to real first
            _activeIdx = 1;
            allItems.forEach(function(el, i) { el.classList.toggle('active', i === _activeIdx); });
            _updateItemWidths(_activeIdx);
            _updateDots(_activeIdx);
            _scrollTo(_activeIdx, false);
          }
          _isTransitioning = false;
        }, 650);
      }
    }
    function _startAuto() {
      clearInterval(_autoTimer);
      _autoTimer = setInterval(function() {
        _setActive(_activeIdx + 1, true);
      }, 5000);
    }
    // tap on item
    allItems.forEach(function(el, i) {
      el.addEventListener('click', function() {
        if (el.classList.contains('carousel-clone')) return; // clone tap ignored for modal
        if (i !== _activeIdx) {
          _setActive(i, true);
          _startAuto();
        }
      }, true);
    });
    // touch swipe
    var _touchStartX = 0;
    scroll.addEventListener('touchstart', function(e) {
      _touchStartX = e.touches[0].clientX;
      clearInterval(_autoTimer);
    }, { passive: true });
    scroll.addEventListener('touchend', function(e) {
      var dx = e.changedTouches[0].clientX - _touchStartX;
      if (Math.abs(dx) > 30) {
        _setActive(dx < 0 ? _activeIdx + 1 : _activeIdx - 1, true);
      }
      _startAuto();
    }, { passive: true });
    _updatePadding();
    _updateItemWidths(1);
    _setActive(1, false);
    _startAuto();
    scroll._carouselTimer = _autoTimer;
  }
  /* ══════════════════════════════════════
     FOR YOU — Infinite Scroll Feed
  ══════════════════════════════════════ */
  var _fyPool      = [];   // deduplicated full pool
  var _fyShown     = 0;    // how many shown so far
  var _fyBatch     = 9;    // cards per load
  var _fyObs       = null; // IntersectionObserver
  var _fyActiveCat = 'all'; // selected category key
  // ── For You — category id filter helpers ──────────────────────────
  // cat id 1-10  → category card For You তে দেখাবে না
  // cat id 11+   → video card    For You তে দেখাবে না
  function _fyCatIdOf(catKey) {
    if (!catKey || typeof _watchCats === 'undefined') return null;
    var cat = _watchCats.find(function(c){ return c._key === catKey; });
    return cat ? (parseInt(cat.id) || null) : null;
  }
  function _fyVideoAllowed(v) {
    var cid = _fyCatIdOf(v.category);
    if (cid === null) return true;   // category id নেই → allow
    return cid <= 10;                 // id 1-10 এর video ✓, 11+ skip
  }
  function _fyCatAllowed(cat) {
    var cid = parseInt(cat.id) || null;
    if (cid === null) return true;   // id নেই → allow
    return cid > 10;                  // id 11+ এর category ✓, 1-10 skip
  }
  // ──────────────────────────────────────────────────────────────────

  function _fyBuildPool(catFilter) {
    // catFilter: [] = all, otherwise boost matching seo tag videos by 50%
    var filterArr = Array.isArray(catFilter) ? catFilter : [];
    var pool = [];
    var seen = {};
    function hasTagMatch(v) {
      if (!filterArr.length) return false;
      var vTags = (v.seo || '').split(',').map(function(t){ return t.trim(); });
      return filterArr.some(function(tag){ return vTags.indexOf(tag) !== -1; });
    }
    function addToPool(v, score) {
      if (!v || !v._key || !v.url || seen[v._key]) return;
      if (!_fyVideoAllowed(v)) return; // cat id 11+ → video skip
      // tag match হলে score 50% বাড়াও
      var finalScore = (filterArr.length && hasTagMatch(v)) ? Math.round(score * 1.5) : score;
      seen[v._key] = true;
      pool.push({ v: v, score: finalScore });
    }
    // 1. History categories (score: 100+)
    var histKeys = (typeof _historyVideo !== 'undefined' ? _historyVideo : []).slice(0, 20).map(function(h){ return h._key; });
    var histCats = {};
    histKeys.forEach(function(k) {
      var found = _watchVideos.find(function(v){ return v._key === k; });
      if (found && found.category) histCats[found.category] = (histCats[found.category] || 0) + 1;
    });
    _watchVideos.forEach(function(v) {
      if (!v.category || !histCats[v.category]) return;
      addToPool(v, 100 + histCats[v.category] * 10);
    });
    // 2. Saved videos (score: 90)
    var favs = typeof watchFavs !== 'undefined' ? watchFavs : [];
    favs.forEach(function(k) {
      var v = _watchVideos.find(function(x){ return x._key === k; });
      addToPool(v, 90);
    });
    // 3. High views (score: 80)
    var byViews = _watchVideos.slice().sort(function(a,b){ return (b.views||0)-(a.views||0); }).slice(0, 30);
    byViews.forEach(function(v, i) { addToPool(v, 80 - i); });
    // 4. Latest (score: 50)
    _watchVideos.slice(0, 30).forEach(function(v, i) { addToPool(v, 50 - i); });
    // 5. বাকি সব videos — পুরনো ও কম view (score: 10, random shuffle এ mixed হবে)
    _watchVideos.forEach(function(v) { addToPool(v, 10); });
    // Sort + light shuffle
    pool.sort(function(a,b){ return b.score - a.score; });
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.max(0, i - Math.floor(Math.random() * 4));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    return pool;
  }
  var _fySelectedCats = []; // [] means all (now stores seo tags)
  function _fyGetAllTags() {
    var tagCount = {};
    _watchVideos.forEach(function(v) {
      if (!v.url || !v.seo) return;
      v.seo.split(',').forEach(function(t) {
        var trimmed = t.trim();
        if (trimmed) tagCount[trimmed] = (tagCount[trimmed] || 0) + 1;
      });
    });
    // sort by frequency, min 1 occurrence
    return Object.keys(tagCount).filter(function(t){ return tagCount[t] > 1; }).sort(function(a, b) { return tagCount[b] - tagCount[a]; });
  }
  function openForYouFilter() {
    var backdrop = document.getElementById('forYouFilterBackdrop');
    var sheet    = document.getElementById('forYouFilterSheet');
    var catsEl   = document.getElementById('forYouFilterCats');
    if (!backdrop || !sheet || !catsEl) return;
    // Render seo tag multi-select chips
    var tags = _fyGetAllTags();
    catsEl.innerHTML = tags.map(function(tag) {
      var isActive = _fySelectedCats.indexOf(tag) !== -1;
      return '<div class="fy-filter-chip' + (isActive ? ' active' : '') + '" data-key="' + tag.replace(/"/g, '&quot;') + '" onclick="fyToggleCat(this)">'
        + (isActive ? '<i class="fa-solid fa-check" style="font-size:0.65rem;"></i> ' : '')
        + tag
        + '</div>';
    }).join('');
    backdrop.style.display = '';
    sheet.style.display = 'flex';
    requestAnimationFrame(function(){
      sheet.style.transform = 'translateY(0)';
      sheet.style.opacity = '1';
    });
    // Drag-to-close (attach only once)
    if (!sheet._dragInit) {
      sheet._dragInit = true;
      var startY = 0, isDragging = false, startTime = 0, lockedDrag = false;
      var catsEl2 = document.getElementById('forYouFilterCats');
      sheet.addEventListener('touchstart', function(e) {
        startY = e.touches[0].clientY;
        startTime = Date.now();
        isDragging = true;
        lockedDrag = false;
        sheet.style.transition = 'none';
      }, { passive: true });
      sheet.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        var dy = e.touches[0].clientY - startY;
        // chips container এ scroll বাকি আছে কিনা check করো
        var inScroll = catsEl2 && catsEl2.contains(e.target);
        if (inScroll) {
          var atTop    = catsEl2.scrollTop <= 0;
          var atBottom = catsEl2.scrollTop + catsEl2.clientHeight >= catsEl2.scrollHeight - 1;
          // ভেতরে scroll করার জায়গা আছে — drag করো না
          if (!lockedDrag && ((dy > 0 && !atTop) || (dy < 0 && !atBottom))) return;
        }
        if (dy < 0 && !lockedDrag) return;
        if (!lockedDrag && Math.abs(dy) > 6) lockedDrag = true;
        if (!lockedDrag) return;
        e.preventDefault();
        sheet.style.transform = 'translateY(' + Math.max(0, dy) + 'px)';
      }, { passive: false });
      sheet.addEventListener('touchend', function(e) {
        if (!isDragging) return;
        isDragging = false;
        var dy = e.changedTouches[0].clientY - startY;
        var dt = Date.now() - startTime;
        sheet.style.transition = '';
        if (lockedDrag && (dy > 80 || (dy > 40 && dt < 250))) {
          closeForYouFilter();
        } else {
          sheet.style.transform = 'translateY(0)';
        }
      }, { passive: true });
    }
  }
  window.openForYouFilter = openForYouFilter;
  window.fyToggleCat = function(el) {
    var key = el.dataset.key;
    var idx = _fySelectedCats.indexOf(key);
    if (idx === -1) {
      _fySelectedCats.push(key);
      el.classList.add('active');
      el.innerHTML = '<i class="fa-solid fa-check" style="font-size:0.65rem;"></i> ' + el.textContent.trim();
    } else {
      _fySelectedCats.splice(idx, 1);
      el.classList.remove('active');
      el.textContent = el.textContent.trim();
    }
  };
  function closeForYouFilter() {
    var backdrop = document.getElementById('forYouFilterBackdrop');
    var sheet    = document.getElementById('forYouFilterSheet');
    if (sheet) {
      sheet.style.transition = 'transform 0.3s cubic-bezier(0.32,0.72,0,1), opacity 0.25s';
      sheet.style.transform = 'translateY(100%)';
      sheet.style.opacity = '0';
      setTimeout(function() {
        sheet.style.display = 'none';
        sheet.style.transform = '';
        sheet.style.opacity = '';
        sheet.style.transition = '';
      }, 300);
    }
    if (backdrop) backdrop.style.display = 'none';
  }
  window.closeForYouFilter = closeForYouFilter;
  function applyForYouFilter() {
    closeForYouFilter();
    var dot = document.getElementById('forYouFilterDot');
    if (dot) dot.style.display = 'none';
    // Save to Firebase if logged in
    if (typeof fbSet === 'function') fbSet('fy_filter', _fySelectedCats);
    // Rebuild feed
    var grid = document.getElementById('forYouGrid');
    if (grid) grid.innerHTML = '';
    _fyPool  = _fyBuildPool(_fySelectedCats);
    _fyShown = 0;
    _fyLoadMore();
    _fyAttachObserver();
  }
  window.applyForYouFilter = applyForYouFilter;
  function buildForYouFeed() {
    var section = document.getElementById('forYouSection');
    var grid    = document.getElementById('forYouGrid');
    if (!section || !grid || !_watchVideos || !_watchVideos.length) return;
    _fySelectedCats = [];
    var dot = document.getElementById('forYouFilterDot');
    if (dot) dot.style.display = 'none';
    _fyPool  = _fyBuildPool([]);
    _fyShown = 0;
    grid.innerHTML = '';
    section.style.display = '';
    _fyLoadMore();
    _fyAttachObserver();
  }
  /* ══════════════════════════════════════════════════
     FY MIXED FEED — video & category cards interleaved
     Row types:
       'CV'  → [Cat(2col) + Vid(1col)]   cat wide, vid portrait
       'CC'  → [Cat + Cat]               two landscape cats
       'VVV' → [Vid + Vid + Vid]         normal 3-col video row
     ══════════════════════════════════════════════════ */
  var _fyCatShuffled = [];
  var _fyCatUsedIdx  = 0;

  function _fyShuffleCats() {
    var cats = (typeof _watchCats !== 'undefined' && _watchCats.length)
      ? _watchCats.filter(function(c){ return _fyCatAllowed(c); })
      : [];
    for (var i = cats.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = cats[i]; cats[i] = cats[j]; cats[j] = tmp;
    }
    return cats;
  }

  function _fyNextCat() {
    if (!_fyCatShuffled.length || _fyCatUsedIdx >= _fyCatShuffled.length) {
      _fyCatShuffled = _fyShuffleCats();
      _fyCatUsedIdx  = 0;
    }
    if (!_fyCatShuffled.length) return null;
    return _fyCatShuffled[_fyCatUsedIdx++];
  }

  function _fyNextCatUniq(exclude) {
    var cat = _fyNextCat();
    var tries = 0;
    while (cat && exclude && cat._key === exclude._key && tries++ < 6) cat = _fyNextCat();
    return cat;
  }

  // For You / WVM category card tap handler
  // WVM open থাকলে আগে close করে তারপর openWatchCatModal call করে
  window._fyOpenCat = function(catKey) {
    var wvm = document.getElementById('watchVideoModal');
    if (wvm && wvm.classList.contains('open')) {
      if (typeof closeWatchModal === 'function') closeWatchModal(false);
      setTimeout(function() { openWatchCatModal(catKey); }, 320);
    } else {
      openWatchCatModal(catKey);
    }
  };

  function _fyMakeCatCardHtml(cat) {
    if (!cat) return '';
    var thumbInner = (typeof _buildBrowseCatThumb === 'function') ? _buildBrowseCatThumb(cat) : '';
    var vidCount   = (typeof _watchCatVideoCount !== 'undefined') ? (_watchCatVideoCount[cat._key] || 0) : 0;
    var badge      = vidCount > 0
      ? '<div class="browse-cat-vidcount">' + vidCount + ' <i class="fa-solid fa-video"></i></div>'
      : '';
    return '<div class="browse-cat-card fy-injected-cat" onclick="_fyOpenCat(\'' + cat._key + '\')" ontouchstart="this.classList.add(\'tapped\')" ontouchend="this.classList.remove(\'tapped\')" ontouchcancel="this.classList.remove(\'tapped\')">'
      + '<div class="browse-cat-card-thumb">' + thumbInner + badge + '</div>'
      + '<div class="browse-cat-card-label">' + (cat.title || cat._key) + '</div>'
      + '</div>';
  }

  /*
   * _fyPickRowType — একটি row এর type বেছে নেয়
   *   'CV'  — cat(wide) + 1 vid      → vids consumed: 1
   *   'CC'  — cat + cat (no vid)     → vids consumed: 0
   *   'VVV' — 3 vids                  → vids consumed: 3
   *
   * weight (forceCat=false): VVV=5, CV=2, CC=1
   * weight (forceCat=true):  CV=3,  CC=2  (VVV excluded)
   */
  function _fyPickRowType(forceCat, vidsLeft) {
    if (forceCat) {
      // must show a category — prefer CV (has a video too), fallback CC
      return (vidsLeft >= 1 && Math.random() < 0.6) ? 'CV' : 'CC';
    }
    var r = Math.random();
    if (vidsLeft >= 3 && r < 0.625) return 'VVV'; // 5/8
    if (vidsLeft >= 1 && r < 0.875) return 'CV';  // 2/8
    return 'CC';                                    // 1/8
  }

  /*
   * _fyBuildMixedRows — pool を rows の配列に変換
   * 各 row: { type, vids:[], cats:[] }
   */
  function _fyBuildMixedRows(vidPool, totalVidsShownBefore) {
    var rows   = [];
    var vIdx   = 0;
    var rowNo  = 0;
    var lastCat = null;

    while (vIdx < vidPool.length) {
      var vidsLeft  = vidPool.length - vIdx;
      var forceCat  = (totalVidsShownBefore === 0 && rowNo < 2); // first 2 rows must have cat
      var type      = _fyPickRowType(forceCat, vidsLeft);

      // edge: not enough videos for VVV → downgrade
      if (type === 'VVV' && vidsLeft < 3) type = vidsLeft >= 1 ? 'CV' : 'CC';

      var row = { type: type, vids: [], cats: [] };

      if (type === 'VVV') {
        row.vids = vidPool.slice(vIdx, vIdx + 3);
        vIdx += 3;
      } else if (type === 'CV') {
        var cat = _fyNextCatUniq(lastCat);
        lastCat = cat;
        row.cats.push(cat);
        row.vids.push(vidPool[vIdx++]);
      } else { // CC
        var c1 = _fyNextCat();
        var c2 = _fyNextCatUniq(c1);
        lastCat = c2 || c1;
        // দুটোই null হলে CC বাদ দিয়ে VVV করো (যদি vids থাকে)
        if (!c1 && !c2) {
          if (vidsLeft >= 3) {
            row.type = 'VVV';
            row.vids = vidPool.slice(vIdx, vIdx + 3);
            vIdx += 3;
          } else if (vidsLeft >= 1) {
            row.type = 'CV';
            row.cats.push(null);
            row.vids.push(vidPool[vIdx++]);
          } else {
            rowNo++; continue;
          }
        } else {
          row.cats.push(c1, c2);
        }
        // CC consumes no videos — but to avoid infinite loop if pool nearly empty, break if stuck
      }

      rows.push(row);
      rowNo++;

      // safety: CC row consumes 0 videos — cap CC rows to avoid infinite loop
      if (type === 'CC' && vIdx === 0 && rowNo > 4) break;
    }
    return rows;
  }

  function _fyRenderRows(rows, grid, vidOffset) {
    rows.forEach(function(row) {
      var wrapper = document.createElement('div');

      if (row.type === 'VVV') {
        wrapper.className = 'fy-row-vvv';
        row.vids.forEach(function(item) {
          var tmp = document.createElement('div');
          tmp.innerHTML = makeWatchVideoCard(item.v, vidOffset++);
          var card = tmp.firstElementChild;
          if (card) wrapper.appendChild(card);
        });

      } else if (row.type === 'CV') {
        wrapper.className = 'fy-row-cv';
        // cat card (wide, 2col)
        var catWrap = document.createElement('div');
        catWrap.className = 'fy-cv-cat';
        var catHtml = _fyMakeCatCardHtml(row.cats[0]);
        if (!catHtml) {
          // cat null হলে VVV হিসেবে render করো — ফাঁকা দেখাবে না
          wrapper.className = 'fy-row-vvv';
          row.vids.forEach(function(item) {
            var tmp2 = document.createElement('div');
            tmp2.innerHTML = makeWatchVideoCard(item.v, vidOffset++);
            var card2 = tmp2.firstElementChild;
            if (card2) wrapper.appendChild(card2);
          });
          grid.appendChild(wrapper);
          return;
        }
        catWrap.innerHTML = catHtml;
        wrapper.appendChild(catWrap);
        // video card (1col, same size as in VVV)
        var vidWrap = document.createElement('div');
        vidWrap.className = 'fy-cv-vid';
        var tmp = document.createElement('div');
        tmp.innerHTML = makeWatchVideoCard(row.vids[0].v, vidOffset++);
        var card = tmp.firstElementChild;
        if (card) vidWrap.appendChild(card);
        wrapper.appendChild(vidWrap);
        // after paint: set cat wrapper height = video card height
        // image load হওয়ার পরে height নেওয়া — min 2 rAF + fallback timeout
        (function(cw, vw) {
          function _syncHeight() {
            var vidCard = vw.firstElementChild;
            if (vidCard && vidCard.offsetHeight > 10) {
              cw.style.height = vidCard.offsetHeight + 'px';
            }
          }
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              _syncHeight();
              // image load হলে আবার sync
              setTimeout(_syncHeight, 400);
              setTimeout(_syncHeight, 900);
            });
          });
        })(catWrap, vidWrap);

      } else { // CC
        wrapper.className = 'fy-row-cc';
        var ccCount = 0;
        row.cats.forEach(function(cat) {
          if (!cat) return; // null cat skip
          var catHtml = _fyMakeCatCardHtml(cat);
          if (!catHtml) return;
          var tmp = document.createElement('div');
          tmp.innerHTML = catHtml;
          var card = tmp.firstElementChild;
          if (card) { wrapper.appendChild(card); ccCount++; }
        });
        if (ccCount === 0) return; // সব cat null হলে এই row skip
      }

      grid.appendChild(wrapper);
    });
    return vidOffset;
  }

  function _fyLoadMore() {
    var grid   = document.getElementById('forYouGrid');
    var loader = document.getElementById('forYouLoader');
    if (!grid || _fyShown >= _fyPool.length) return;
    if (loader) loader.style.display = 'flex';
    var shownBefore = _fyShown;
    setTimeout(function() {
      if (shownBefore === 0) {
        _fyCatShuffled = _fyShuffleCats();
        _fyCatUsedIdx  = 0;
      }
      var batch = _fyPool.slice(_fyShown, _fyShown + _fyBatch);
      var rows  = _fyBuildMixedRows(batch, shownBefore);
      _fyRenderRows(rows, grid, _fyShown);
      _fyShown += batch.length;
      _attachVideoCardClicks(grid);
      if (loader) loader.style.display = 'none';
    }, 300);
  }
  function _fyAttachObserver() {
    if (_fyObs) { _fyObs.disconnect(); _fyObs = null; }
    var sentinel = document.getElementById('forYouSentinel');
    if (!sentinel) return;
    _fyObs = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting && _fyShown < _fyPool.length) {
        _fyLoadMore();
      }
    }, { threshold: 0.1 });
    _fyObs.observe(sentinel);
  }
  window.buildForYouFeed = buildForYouFeed;
  // ============================================================
  // REELS STRIP + MODAL
  // ============================================================
  window._reelsData = [];
  var _reelsActiveIdx = 0;
  function getReelEmbedUrl(url) {
    if (!url) return '';
    // direct mp4/video URL — return as-is
    return url;
  }
  function getReelThumbUrl(url) {
    if (!url) return '';
    // mp4 URL থেকে thumbnail নেই — r.img ব্যবহার করবে
    return '';
  }
  // video URL থেকে canvas দিয়ে thumbnail জেনারেট করে img এ সেট করে
  function _generateVideoThumb(videoUrl, imgEl) {
    if (!videoUrl || !imgEl) return;
    var done = false;
    function capture() {
      if (done) return;
      if (!vid.videoWidth || !vid.videoHeight) return;
      done = true;
      try {
        var canvas = document.createElement('canvas');
        canvas.width  = vid.videoWidth;
        canvas.height = vid.videoHeight;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        var dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        imgEl.src = dataUrl;
        imgEl.style.display = '';
      } catch(e) {
        // tainted canvas — CORS header নেই, thumbnail দেখানো যাবে না
        console.warn('[CastFM] reel thumb canvas error:', e.message, videoUrl);
        imgEl.style.display = 'none';
      }
      vid.pause();
      vid.removeAttribute('src');
      vid.load();
    }
    var vid = document.createElement('video');
    // R2 public bucket এ Access-Control-Allow-Origin: * থাকে
    // crossOrigin = 'anonymous' না দিলে canvas tainted হয়, toDataURL() throw করে
    vid.crossOrigin = 'anonymous';
    vid.muted      = true;
    vid.playsInline = true;
    vid.preload    = 'auto';
    vid.addEventListener('loadedmetadata', function() {
      // metadata পেলে একটু ভেতরে seek করো
      vid.currentTime = Math.min(1.5, (vid.duration || 3) * 0.1);
    });
    vid.addEventListener('seeked', capture);
    vid.addEventListener('canplay', function() {
      // seeked না আসলেও canplay এ capture করার চেষ্টা
      setTimeout(capture, 100);
    });
    vid.addEventListener('error', function() {
      imgEl.style.display = 'none';
    });
    vid.src = videoUrl;
    vid.load();
    // 8 সেকেন্ডেও না হলে cleanup
    setTimeout(function() {
      if (!done) {
        vid.removeAttribute('src');
        vid.load();
      }
    }, 8000);
  }
  // reel card এর <video> গুলো viewport এ আসলে play, বেরিয়ে গেলে pause
  function _autoplayReelCardVideos(container) {
    // No-op: autoplay সরানো হয়েছে — long press এ preview চলে
  }

  /* ── Reel Card Long-Press Preview ──
     card এ long press (300ms) ধরে রাখলে video preview play হবে,
     ছেড়ে দিলে pause + reset হবে।
  ────────────────────────────────── */
  function _attachReelLongPress(container) {
    var cards = container.querySelectorAll('.wr-card, .reel-card');
    cards.forEach(function(card) {
      var video = card.querySelector('video');
      if (!video) return;

      var _lpTimer   = null;
      var _lpActive  = false;
      var _lpMoved   = false;
      var _lpStartX  = 0;
      var _lpStartY  = 0;

      function _stopPreview() {
        clearTimeout(_lpTimer);
        _lpTimer  = null;
        _lpActive = false;
        video.pause();
        video.currentTime = 0;
        card.classList.remove('reel-peek-active');
      }

      card.addEventListener('touchstart', function(e) {
        _lpMoved  = false;
        _lpStartX = e.touches[0].clientX;
        _lpStartY = e.touches[0].clientY;
        _lpTimer  = setTimeout(function() {
          if (_lpMoved) return;
          _lpActive = true;
          card.classList.add('reel-peek-active');
          video.currentTime = 0;
          video.play().catch(function(){});
        }, 300);
      }, { passive: true });

      card.addEventListener('touchmove', function(e) {
        var dx = Math.abs(e.touches[0].clientX - _lpStartX);
        var dy = Math.abs(e.touches[0].clientY - _lpStartY);
        if (dx > 8 || dy > 8) {
          _lpMoved = true;
          if (_lpActive) _stopPreview();
          else clearTimeout(_lpTimer);
        }
      }, { passive: true });

      card.addEventListener('touchend',    _stopPreview);
      card.addEventListener('touchcancel', _stopPreview);
    });
  }

  function renderReelsStrip() {
    var strip = document.getElementById('reelsStrip');
    var row   = document.getElementById('reelsScrollRow');
    if (!strip || !row) return;
    var reels = window._reelsData || [];
    if (!reels.length) { strip.style.display = 'none'; return; }
    strip.style.display = '';
    row.innerHTML = reels.map(function(r, i) {
      var key   = r._key || String(i);
      var thumb = r.img || '';
      if (!thumb && r.url) {
        var ytId = getYouTubeId(r.url);
        if (ytId) thumb = getYouTubeThumb(ytId);
      }
      var mediaHtml;
      if (thumb) {
        mediaHtml = '<img class="reel-card-thumb" src="' + thumb + '" alt="' + (r.title || '') + '" loading="lazy" onerror="this.style.display=\'none\'">';
      } else if (r.url) {
        // img নেই, YouTube না — muted autoplay video দিয়ে thumbnail দেখাও
        mediaHtml = '<video class="reel-card-thumb" src="' + r.url + '" muted playsinline preload="metadata" loop style="object-fit:cover;pointer-events:none;"></video>';
      } else {
        mediaHtml = '<div class="reel-card-thumb" style="background:#111;"></div>';
      }
      return '<div class="reel-card" onclick="openReelsModalByKey(\'' + key + '\')">' +
        mediaHtml +
        '<div class="reel-card-overlay">' +
          '<div class="reel-card-play-icon">' +
            '<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" style="color:#fff;margin-left:2px"><path d="M8 5v14l11-7z"/></svg>' +
          '</div>' +
          '<div class="reel-card-title">' + (r.title || '') + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
    // long press এ preview চলবে
    _attachReelLongPress(row);
  }
  function openReelsModal(startIdx, fromPopstate, fromReelsAll) {
    var reels = window._reelsData || [];
    if (!reels.length) return;
    var startReel = (startIdx != null) ? reels[startIdx] : reels[Math.floor(Math.random() * reels.length)];
    var others = reels.filter(function(r) { return r !== startReel; });
    _reelsShuffled = startReel ? [startReel].concat(_shuffleArray(others)) : _shuffleArray(reels);
    _reelsActiveIdx = 0;
    var modal = document.getElementById('reelsModal');
    var track = document.getElementById('reelsModalTrack');
    if (!modal || !track) return;
    // audio চলছে থাকলে pause করো — reels এ গেলে দুটো একসাথে চলবে না
    var _reelsAudioWasPlaying = false;
    if (typeof audio !== 'undefined' && !audio.paused) {
      audio.pause();
      _reelsAudioWasPlaying = true;
    }
    modal._reelsAudioWasPlaying = _reelsAudioWasPlaying;
    var header = document.querySelector('header');
    if (header) header.style.setProperty('display', 'none', 'important');
    document.body.classList.add('reels-open');
    function _makeSlide(r, i) {
      var videoUrl = r.url || '';
      var rKey = r._key || String(i);
      var div = document.createElement('div');
      div.className = 'reel-slide';
      div.dataset.idx = i;
      div.dataset.key = rKey;
      div.dataset.src = videoUrl;
      div.innerHTML = '<div class="reel-slide-loader"><div class="reel-loader-spin"></div></div>' +
        '<video playsinline loop muted="false" preload="none" ' +
        'oncontextmenu="return false;" ' +
        'style="width:100%;height:100%;object-fit:contain;display:block;-webkit-touch-callout:none;" ' +
        'oncanplay="this.previousElementSibling.style.display=\'none\';this.muted=false;"></video>' +
        '<div class="reel-tap-icon"><svg viewBox="0 0 24 24" fill="currentColor" width="52" height="52"><path d="M8 5v14l11-7z"/></svg></div>' +
        '<div class="reels-progress-bar"><div class="reels-progress-fill"></div></div>';
      var video = div.querySelector('video');
      var fill  = div.querySelector('.reels-progress-fill');
      var tapIcon = div.querySelector('.reel-tap-icon');
      var tapSvg  = tapIcon.querySelector('svg');
      // browser native context menu বন্ধ করো (long press download popup)
      div.addEventListener('contextmenu', function(e) { e.preventDefault(); return false; });
      // topbar 2x indicator
      var speedIndicator = document.getElementById('reelsSpeedIndicator');
      // hold = 2x speed, tap = play/pause
      var _holdTimer = null;
      var _isHolding = false;
      var _touchMoved = false;
      div.addEventListener('touchstart', function(e) {
        if (e.target.closest('button')) return;
        _touchMoved = false;
        _holdTimer = setTimeout(function() {
          _isHolding = true;
          video.playbackRate = 2;
          if (speedIndicator) { speedIndicator.textContent = '2x'; speedIndicator.classList.add('visible'); }
        }, 180);
      }, { passive: true });
      div.addEventListener('touchmove', function() {
        _touchMoved = true;
        clearTimeout(_holdTimer);
        if (_isHolding) {
          _isHolding = false;
          video.playbackRate = 1;
          if (speedIndicator) speedIndicator.classList.remove('visible');
        }
      }, { passive: true });
      div.addEventListener('touchend', function(e) {
        clearTimeout(_holdTimer);
        if (_isHolding) {
          _isHolding = false;
          video.playbackRate = 1;
          if (speedIndicator) speedIndicator.classList.remove('visible');
        } else if (!_touchMoved) {
          if (video.paused) {
            video.play().catch(function(){});
            tapIcon.classList.remove('show', 'visible');
          } else {
            video.pause();
            tapIcon.classList.remove('show', 'visible');
            void tapIcon.offsetWidth;
            tapIcon.classList.add('visible');
          }
        }
      }, { passive: true });
      video.addEventListener('timeupdate', function() {
        if (!video.duration) return;
        fill.style.width = ((video.currentTime / video.duration) * 100) + '%';
      });
      video.addEventListener('ended', function() {
        fill.style.width = '100%';
      });
      return div;
    }
    track.innerHTML = '';
    var firstSlide = _makeSlide(_reelsShuffled[0], 0);
    track.appendChild(firstSlide);
    var firstVid = firstSlide.querySelector('video');
    if (firstVid) { firstVid.src = _reelsShuffled[0].url || ''; firstVid.play().catch(function(){}); }
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (!fromPopstate) {
      safeHistoryPush({ type: 'modal', modal: 'reels', fromReelsAll: !!fromReelsAll }, '', '#reels');
    }
    _reelsObserver && _reelsObserver.disconnect();
    _reelsObserver = null;
    var _pendingDeck = [];
    var PRELOAD_AHEAD = 3; // কতটা video আগে থেকে load হবে
    function _ensureSlide(idx) {
      if (idx >= _reelsShuffled.length) {
        if (!_pendingDeck.length) _pendingDeck = _shuffleArray(reels);
        _reelsShuffled.push(_pendingDeck.shift());
      }
      var r = _reelsShuffled[idx];
      if (!r) return null;
      var existing = track.querySelector('.reel-slide[data-idx="' + idx + '"]');
      if (existing) return existing;
      var slide = _makeSlide(r, idx);
      track.appendChild(slide);
      if (_reelsObserver) _reelsObserver.observe(slide);
      return slide;
    }
    function _appendNext(currentIdx) {
      // পরের PRELOAD_AHEAD টা slide DOM এ add করো
      for (var i = 1; i <= PRELOAD_AHEAD; i++) {
        var slide = _ensureSlide(currentIdx + i);
        if (!slide) continue;
        var video = slide.querySelector('video');
        var src = slide.dataset.src;
        // শুধু পরেরটা (i===1) সাথে সাথে load, বাকিগুলো একটু delay দিয়ে
        if (video && src && !video.src) {
          (function(v, s, delay) {
            setTimeout(function() {
              if (!v.src) {
                v.preload = 'auto';
                v.src = s;
                v.load();
              }
            }, delay);
          })(video, src, i === 1 ? 300 : i * 600);
        }
      }
    }
    setTimeout(function() {
      _updateReelsTitleBar(0);
      _appendNext(0);
      setTimeout(function() {
        var _playDebounce = null;
        _reelsObserver = new IntersectionObserver(function(entries) {
          // সবচেয়ে বেশি visible slide বের করো
          var best = null, bestRatio = 0;
          entries.forEach(function(e) {
            if (e.intersectionRatio > bestRatio) {
              bestRatio = e.intersectionRatio;
              best = e.target;
            }
          });
          // threshold 0.8 এর নিচে হলে কিছু করবো না
          if (!best || bestRatio < 0.8) return;
          clearTimeout(_playDebounce);
          _playDebounce = setTimeout(function() {
            // আগে সব pause করো
            track.querySelectorAll('.reel-slide').forEach(function(s) {
              if (s !== best) {
                var v = s.querySelector('video');
                var sIdx = parseInt(s.dataset.idx);
                var curIdx = parseInt(best.dataset.idx);
                if (v && !v.paused) v.pause();
                if (v && sIdx < curIdx - 1) { v.src = ''; v.removeAttribute('src'); }
              }
            });
            // এখন best slide play করো
            var video = best.querySelector('video');
            var src = best.dataset.src;
            if (video && src) {
              var loader = best.querySelector('.reel-slide-loader');
              if (!video.src || video.src !== src) {
                if (loader) loader.style.display = 'flex';
                video.preload = 'auto';
                video.src = src;
              }
              video.play().catch(function(){});
            }
            var idx = parseInt(best.dataset.idx);
            _reelsActiveIdx = idx;
            _updateReelsTitleBar(idx);
            _appendNext(idx);
          }, 80);
        }, { threshold: [0.5, 0.8, 1.0] });
        track.querySelectorAll('.reel-slide').forEach(function(s) {
          _reelsObserver.observe(s);
        });
      }, 200);
    }, 50);
    var hint = document.getElementById('reelsNavHint');
    if (hint) { hint.style.animation = ''; void hint.offsetWidth; hint.style.animation = 'reelsHintFade 3s ease forwards'; }
  }
    // key দিয়ে reel খোলার helper — reel card click এ ব্যবহার হয়
  function openReelsModalByKey(key, fromPopstate, fromReelsAll) {
    var reels = window._reelsData || [];
    var idx = reels.findIndex(function(r) { return r._key === key; });
    if (idx < 0) idx = 0;
    // modal আগে থেকে open থাকলে আগে iframes clear করো — নইলে পুরনো reel চলতে থাকে
    var track = document.getElementById('reelsModalTrack');
    if (track) track.querySelectorAll('video').forEach(function(v) { v.pause(); v.src = ''; });
    openReelsModal(idx, fromPopstate, fromReelsAll);
  }
  window.openReelsModal = openReelsModal;
  window.openReelsModalByKey = openReelsModalByKey;
  var _reelsViewedKeys = {};
  var _reelsShuffled = [];
  function _shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function _formatReelViews(n) {
    if (!n) return '0 Views';
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M Views';
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K Views';
    return n + ' Views';
  }
  function _updateReelsTitleBar(idx) {
    var reels = _reelsShuffled.length ? _reelsShuffled : (window._reelsData || []);
    var r = reels[idx];
    var titleEl = document.getElementById('reelsModalTitle');
    var viewsEl = document.getElementById('reelsModalViews');
    var tagsEl  = document.getElementById('reelsModalTags');
    if (titleEl) titleEl.textContent = (r && r.title) ? r.title : '';
    if (viewsEl) {
      var views = (r && r.views) ? r.views : 0;
      viewsEl.textContent = _formatReelViews(views);
    }
    if (tagsEl) {
      var seo = (r && r.seo) ? r.seo : '';
      var tags = seo.split(',').map(function(t) { return t.trim(); }).filter(Boolean);
      tagsEl.innerHTML = tags.slice(0, 4).map(function(tag) {
        return '<span class="reels-modal-tag">#' + tag + '</span>';
      }).join('');
    }
    // Media Session — notification bar title & artwork
    if ('mediaSession' in navigator && r) {
      var thumb = r.img || '';
      var artworkArr = thumb ? [
        { src: thumb, sizes: '96x96',   type: 'image/jpeg' },
        { src: thumb, sizes: '200x200', type: 'image/jpeg' },
        { src: thumb, sizes: '512x512', type: 'image/jpeg' }
      ] : [];
      navigator.mediaSession.metadata = new MediaMetadata({
        title:  r.title   || 'CastFM Reels',
        artist: 'CastFM',
        album:  'Reels',
        artwork: artworkArr
      });
      navigator.mediaSession.playbackState = 'playing';
      var track = document.getElementById('reelsModalTrack');
      var vid = track ? track.querySelector('.reel-slide video') : null;
      if (vid) {
        navigator.mediaSession.setActionHandler('play',  function() { vid.play().catch(function(){}); });
        navigator.mediaSession.setActionHandler('pause', function() { vid.pause(); });
        navigator.mediaSession.setActionHandler('stop',  function() { vid.pause(); });
      }
    }
    if (r && r._key) {
      if (window._fbDb && window._fbRef && window._fbIncrement && window._fbUpdate) {
        var _vObj = {}; _vObj['views'] = window._fbIncrement(1);
        window._fbUpdate(window._fbRef(window._fbDb, 'reels/' + r._key), _vObj);
      }
    }
  }
  var _reelsObserver = null;
  function closeReelsModal(fromPopstate, fromReelsAll) {
    var modal = document.getElementById('reelsModal');
    var track = document.getElementById('reelsModalTrack');
    if (!modal) return;
    // close button থেকে close হলে history.back() করো — popstate fire হবে
    // এবং সেখান থেকে closeReelsModal(true) আবার call হবে (Android back key সাপোর্ট)
    if (!fromPopstate) {
      try { history.back(); } catch(e) {}
      return;
    }
    // video আগেই pause করো — animation চলাকালীন audio বন্ধ থাকবে
    if (track) track.querySelectorAll('video').forEach(function(v) { v.pause(); v.src = ''; });
    closeModalWithAnim(modal, 280, function() {
      document.body.style.overflow = '';
      document.body.classList.remove('reels-open');
      var header = document.querySelector('header');
      if (header) header.style.removeProperty('display');
      if (track) setTimeout(function() { track.innerHTML = ''; }, 100);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      }
      _reelsObserver && _reelsObserver.disconnect();
      _reelsObserver = null;
      if (modal._reelsAudioWasPlaying && typeof audio !== 'undefined') {
        audio.play().catch(function(){});
        modal._reelsAudioWasPlaying = false;
      }
    });
    try {
      var tab = (history.state && history.state.tab) ? history.state.tab : 'watch';
      var displayHash = tab === 'podcast' ? 'listen' : tab === 'explore' ? 'explore' : tab;
      history.replaceState({ type: 'tab', tab: tab }, '', '#' + displayHash);
    } catch(e) {}
    if (_wasFromReelsAll) {

    }
  }
  window.closeReelsModal = closeReelsModal;
  window.renderReelsStrip = renderReelsStrip;
  // ============================================================
  // LISTEN TAB -- FOR YOU FEED
  // ============================================================
  var _lfyPool         = [];
  var _lfyShown        = 0;
  var _lfyBatch        = 9;
  var _lfyObs          = null;
  var _lfySelectedTags = [];
  function _lfyGetAllTags() {
    var tagCount = {};
    (_podcastEps || []).forEach(function(ep) {
      if (!ep.seo) return;
      ep.seo.split(',').forEach(function(t) {
        var trimmed = t.trim();
        if (trimmed) tagCount[trimmed] = (tagCount[trimmed] || 0) + 1;
      });
    });
    return Object.keys(tagCount)
      .filter(function(t){ return tagCount[t] > 1; })
      .sort(function(a, b){ return tagCount[b] - tagCount[a]; });
  }
  function _lfyBuildPool(tagFilter) {
    var filterTags = Array.isArray(tagFilter) ? tagFilter : [];
    var pool = [];
    var seen = {};
    var _catIdMap = {};
    (_podcastCats || []).forEach(function(c) { _catIdMap[c._key] = parseInt(c.id) || 0; });
    function epHasTag(ep) {
      if (!filterTags.length) return false;
      var epTags = (ep.seo || '').split(',').map(function(t){ return t.trim(); });
      return filterTags.some(function(tag){ return epTags.indexOf(tag) !== -1; });
    }
    function addToPool(ep, score) {
      if (!ep || !ep._key || seen[ep._key]) return;
      if (ep.category && (_catIdMap[ep.category] || 0) > 10) return;
      var boost = (filterTags.length && epHasTag(ep)) ? 1.5 : 1;
      seen[ep._key] = true;
      pool.push({ ep: ep, score: Math.round(score * boost) });
    }
    // 1. History categories (score: 100+)
    var histKeys = (typeof _historyEpisode !== 'undefined' ? _historyEpisode : []).slice(0, 20).map(function(h){ return h._key; });
    var histCats = {};
    histKeys.forEach(function(k) {
      var found = (_podcastEps || []).find(function(e){ return e._key === k; });
      if (found && found.category) histCats[found.category] = (histCats[found.category] || 0) + 1;
    });
    (_podcastEps || []).forEach(function(ep) {
      if (!ep.category || !histCats[ep.category]) return;
      addToPool(ep, 100 + histCats[ep.category] * 10);
    });
    // 2. Saved/bookmarked (score: 90)
    var favs = typeof favorites !== 'undefined' ? favorites : [];
    favs.forEach(function(k) {
      var ep = (_podcastEps || []).find(function(e){ return e._key === k; });
      addToPool(ep, 90);
    });
    // 3. Latest (score: 60)
    (_podcastEps || []).slice(0, 30).forEach(function(ep, i) { addToPool(ep, 60 - i); });
    // 4. Remaining (score: 10)
    (_podcastEps || []).forEach(function(ep) { addToPool(ep, 10); });
    pool.sort(function(a,b){ return b.score - a.score; });
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.max(0, i - Math.floor(Math.random() * 4));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    return pool;
  }
  function buildListenForYouFeed() {
    var section = document.getElementById('listenForYouSection');
    var grid    = document.getElementById('listenForYouGrid');
    if (!section || !grid || !_podcastEps || !_podcastEps.length) return;
    _lfySelectedTags = [];
    var dot = document.getElementById('listenForYouFilterDot');
    if (dot) dot.style.display = 'none';
    _lfyPool  = _lfyBuildPool([]);
    _lfyShown = 0;
    grid.innerHTML = '';
    section.style.display = '';
    _lfyLoadMore();
    _lfyAttachObserver();
  }
  function _lfyLoadMore() {
    var grid   = document.getElementById('listenForYouGrid');
    var loader = document.getElementById('listenForYouLoader');
    if (!grid || _lfyShown >= _lfyPool.length) return;
    if (loader) loader.style.display = 'flex';
    setTimeout(function() {
      var batch = _lfyPool.slice(_lfyShown, _lfyShown + _lfyBatch);
      batch.forEach(function(item, i) {
        grid.insertAdjacentHTML('beforeend',
          typeof pepBuildRow === 'function'
            ? pepBuildRow(item.ep, _lfyShown + i, "pcEpPillPlay('" + item.ep._key + "')")
            : ''
        );
      });
      _lfyShown += batch.length;
      if (loader) loader.style.display = 'none';
    }, 300);
  }
  function _lfyAttachObserver() {
    if (_lfyObs) { _lfyObs.disconnect(); _lfyObs = null; }
    var sentinel = document.getElementById('listenForYouSentinel');
    if (!sentinel) return;
    _lfyObs = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting && _lfyShown < _lfyPool.length) _lfyLoadMore();
    }, { threshold: 0.1 });
    _lfyObs.observe(sentinel);
  }
  function openListenForYouFilter() {
    var backdrop = document.getElementById('listenForYouFilterBackdrop');
    var sheet    = document.getElementById('listenForYouFilterSheet');
    var catsEl   = document.getElementById('listenForYouFilterCats');
    if (!backdrop || !sheet || !catsEl) return;
    var tags = _lfyGetAllTags();
    catsEl.innerHTML = tags.map(function(tag) {
      var isActive = _lfySelectedTags.indexOf(tag) !== -1;
      return '<div class="fy-filter-chip' + (isActive ? ' active' : '') + '" data-key="' + tag.replace(/"/g, '&quot;') + '" onclick="lfyToggleTag(this)">'
        + (isActive ? '<i class="fa-solid fa-check" style="font-size:0.65rem;"></i> ' : '')
        + tag + '</div>';
    }).join('');
    backdrop.style.display = '';
    sheet.style.display = 'flex';
    requestAnimationFrame(function(){
      sheet.style.transform = 'translateY(0)';
      sheet.style.opacity = '1';
    });
    if (!sheet._dragInit) {
      sheet._dragInit = true;
      var startY = 0, isDragging = false, startTime = 0, lockedDrag = false;
      var catsEl2 = document.getElementById('listenForYouFilterCats');
      sheet.addEventListener('touchstart', function(e) {
        startY = e.touches[0].clientY; startTime = Date.now();
        isDragging = true; lockedDrag = false;
        sheet.style.transition = 'none';
      }, { passive: true });
      sheet.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        var dy = e.touches[0].clientY - startY;
        var inScroll = catsEl2 && catsEl2.contains(e.target);
        if (inScroll) {
          var atTop = catsEl2.scrollTop <= 0;
          var atBottom = catsEl2.scrollTop + catsEl2.clientHeight >= catsEl2.scrollHeight - 1;
          if (!lockedDrag && ((dy > 0 && !atTop) || (dy < 0 && !atBottom))) return;
        }
        if (dy < 0 && !lockedDrag) return;
        if (!lockedDrag && Math.abs(dy) > 6) lockedDrag = true;
        if (!lockedDrag) return;
        e.preventDefault();
        sheet.style.transform = 'translateY(' + Math.max(0, dy) + 'px)';
      }, { passive: false });
      sheet.addEventListener('touchend', function(e) {
        if (!isDragging) return;
        isDragging = false;
        var dy = e.changedTouches[0].clientY - startY;
        var dt = Date.now() - startTime;
        sheet.style.transition = '';
        if (lockedDrag && (dy > 80 || (dy > 40 && dt < 250))) {
          closeListenForYouFilter();
        } else {
          sheet.style.transform = 'translateY(0)';
        }
      }, { passive: true });
    }
  }
  window.openListenForYouFilter = openListenForYouFilter;
  window.lfyToggleTag = function(el) {
    var key = el.dataset.key;
    var idx = _lfySelectedTags.indexOf(key);
    if (idx === -1) {
      _lfySelectedTags.push(key);
      el.classList.add('active');
      el.innerHTML = '<i class="fa-solid fa-check" style="font-size:0.65rem;"></i> ' + el.textContent.trim();
    } else {
      _lfySelectedTags.splice(idx, 1);
      el.classList.remove('active');
      el.textContent = el.textContent.trim();
    }
  };
  function closeListenForYouFilter() {
    var backdrop = document.getElementById('listenForYouFilterBackdrop');
    var sheet    = document.getElementById('listenForYouFilterSheet');
    if (sheet) {
      sheet.style.transition = 'transform 0.3s cubic-bezier(0.32,0.72,0,1), opacity 0.25s';
      sheet.style.transform = 'translateY(100%)';
      sheet.style.opacity = '0';
      setTimeout(function() {
        sheet.style.display = 'none';
        sheet.style.transform = '';
        sheet.style.opacity = '';
        sheet.style.transition = '';
      }, 300);
    }
    if (backdrop) backdrop.style.display = 'none';
  }
  window.closeListenForYouFilter = closeListenForYouFilter;
  function applyListenForYouFilter() {
    closeListenForYouFilter();
    var dot = document.getElementById('listenForYouFilterDot');
    if (dot) dot.style.display = 'none';
    // Save to Firebase if logged in
    if (typeof fbSet === 'function') fbSet('lfy_filter', _lfySelectedTags);
    var grid = document.getElementById('listenForYouGrid');
    if (grid) grid.innerHTML = '';
    _lfyPool  = _lfyBuildPool(_lfySelectedTags);
    _lfyShown = 0;
    _lfyLoadMore();
    _lfyAttachObserver();
  }
  window.applyListenForYouFilter = applyListenForYouFilter;
  window.buildListenForYouFeed   = buildListenForYouFeed;

  /* ── UNIVERSAL MODAL CLOSE ANIMATION HELPER ── */
  function closeModalWithAnim(modal, delay, callback) {
    if (!modal || !modal.classList.contains('open')) { if (callback) callback(); return; }
    modal.classList.add('closing');
    setTimeout(function() {
      modal.classList.remove('open');
      modal.classList.remove('closing');
      if (callback) callback();
    }, delay || 240);
  }
  window.closeModalWithAnim = closeModalWithAnim;

  function openWatchVideo(key, fromWatchCat) {
    if (!key) return;
    var v = _watchVideos.find(function(x) { return x._key === key; });
    if (!v) return;
    if (typeof addVideoHistory === 'function') addVideoHistory(v);
    // search modal open থাকলে আগে বন্ধ করো
    var sm = document.getElementById('searchModal');
    if (sm && sm.classList.contains('open')) closeSearchModal(false);
    // audio বন্ধ করো
    if (typeof CT !== 'undefined' && CT.stop) CT.stop();
    var modal = document.getElementById('watchVideoModal');
    var playerWrap = document.getElementById('watchPlayerWrap');
    if (playerWrap._hls) { playerWrap._hls.destroy(); playerWrap._hls = null; }
    if (playerWrap._retryTimer) { clearTimeout(playerWrap._retryTimer); playerWrap._retryTimer = null; }
    if (playerWrap._hlsErrTimer) { clearTimeout(playerWrap._hlsErrTimer); playerWrap._hlsErrTimer = null; }
    playerWrap.innerHTML = '';
    playerWrap.style.display = '';
    var ytId = getYouTubeId(v.url || '');
    if (ytId) {
      var thumb = v.img || getYouTubeThumb(ytId);
      playerWrap.innerHTML =
        '<div id="ytThumbOverlay" style="position:absolute;inset:0;cursor:pointer;background:#000;">'
        + '<img src="' + thumb + '" style="width:100%;height:100%;object-fit:cover;opacity:0.85;" onload="imgLoad(this)" onerror="imgErr(this)">'
        + '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">'
        + '<div style="width:64px;height:64px;border-radius:50%;background:rgba(255,0,0,0.9);display:flex;align-items:center;justify-content:center;">'
        + '<svg viewBox="0 0 24 24" fill="#fff" width="28" height="28"><polygon points="5,3 19,12 5,21"/></svg>'
        + '</div></div></div>';
      document.getElementById('ytThumbOverlay').addEventListener('click', function() {
        playerWrap.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + ytId + '?autoplay=1&rel=0&playsinline=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" allowfullscreen disablepictureinpicture style="width:100%;height:100%;display:block;"></iframe>';
        // YouTube play শুরু হলে Media Session metadata refresh করো
        if (typeof setVideoMediaSession === 'function' && window._wvmCurrentVideo) setVideoMediaSession(window._wvmCurrentVideo);
      });
    } else if ((v.url || '').match(/\.m3u8/i) || (v.url || '').includes('m3u8')) {
      // HLS / m3u8 stream
      var vid = document.createElement('video');
      vid.controls = true;
      vid.autoplay = true;
      vid.setAttribute('playsinline', '');
      vid.setAttribute('controlsList', 'nodownload'); vid.setAttribute('disablepictureinpicture', '');
      vid.setAttribute('oncontextmenu', 'return false;');
      vid.style.cssText = 'width:100%;height:100%;display:block;background:#000;';
      playerWrap.appendChild(vid);
      if (vid.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari — native HLS support
        vid.src = v.url;
        vid.load();
        vid.onerror = function() { _showStreamError(playerWrap, v.url, vid); };
      } else {
        // HLS.js দিয়ে play করো
        if (window.Hls && Hls.isSupported()) {
          var hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            maxBufferSize: 60 * 1000 * 1000,
            maxBufferHole: 0.5,
            highBufferWatchdogPeriod: 2,
            nudgeMaxRetry: 5,
            startLevel: -1,
            abrEwmaFastLive: 3.0,
            abrEwmaSlowLive: 9.0,
            liveSyncDurationCount: 2,
            liveMaxLatencyDurationCount: 4
          });
          hls.loadSource(v.url);
          hls.attachMedia(vid);
          hls.on(Hls.Events.MANIFEST_PARSED, function() { vid.play().catch(function(){}); });
          hls.on(Hls.Events.ERROR, function(evt, data) {
            if (data.fatal) {
              clearTimeout(playerWrap._hlsErrTimer);
              playerWrap._hlsErrTimer = setTimeout(function() {
                if (vid.paused && vid.readyState < 2) {
                  _showStreamError(playerWrap, v.url, vid);
                }
              }, 3000);
            }
          });
          playerWrap._hls = hls;
        } else {
          vid.src = v.url;
          vid.onerror = function() { _showStreamError(playerWrap, v.url, vid); };
        }
      }
    } else if ((v.url || '').match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
      var vid = document.createElement('video');
      vid.controls = true;
      vid.autoplay = true;
      vid.setAttribute('playsinline', '');
      vid.setAttribute('controlsList', 'nodownload'); vid.setAttribute('disablepictureinpicture', '');
      vid.setAttribute('oncontextmenu', 'return false;');
      vid.style.cssText = 'width:100%;height:100%;display:block;';
      vid.src = v.url;
      playerWrap.appendChild(vid);
    } else {
      // generic embed fallback — যেকোনো embed URL iframe এ play হবে
      playerWrap.innerHTML = '<iframe src="' + v.url + '" frameborder="0" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen style="width:100%;height:100%;display:block;" referrerpolicy="origin"></iframe>';
    }
    // topbar title + sheet data
    var _topTitle = document.getElementById('wvmTopTitle');
    if (_topTitle) _topTitle.textContent = v.title || '';
    var _sheetTitle = document.getElementById('wvmSheetTitle');
    var _sheetDesc  = document.getElementById('wvmSheetDesc');
    if (_sheetTitle) _sheetTitle.textContent = v.title || '';
    if (_sheetDesc)  _sheetDesc.textContent  = v.desc  || '';
    // desc box reset
    var _descBox    = document.getElementById('wvmDescBox');
    var _descText   = document.getElementById('wvmDescText');
    var _descToggle = document.getElementById('wvmDescToggle');
    if (_descText)   _descText.textContent = v.desc || '';
    var _seoTags = document.getElementById('wvmSeoTags');
    if (_seoTags) {
      var seoRaw = (v.seo || '').trim();
      if (seoRaw) {
        _seoTags.innerHTML = seoRaw.split(',').map(function(t) {
          var tag = t.trim();
          return tag ? '<span class="wvm-seo-tag" onclick="openSearchModal(this.textContent.trim())">' + tag + '</span>' : '';
        }).join('<span class="wvm-seo-sep"> | </span>');
        _seoTags.style.display = '';
      } else {
        _seoTags.innerHTML = '';
        _seoTags.style.display = 'none';
      }
    }
    if (_descBox)    { _descBox.style.display = 'none'; }
    if (_descToggle) { _descToggle.classList.remove('open'); _descToggle.style.display = ''; }
    // ── Category Avatar ──
    (function() {
      var thumbEl = document.getElementById('wvmCatAvatarThumb');
      if (!thumbEl) return;
      var cat = (typeof _watchCats !== 'undefined' && v.category)
        ? _watchCats.find(function(c){ return c._key === v.category; })
        : null;
      var catVids = (typeof _watchVideos !== 'undefined' && v.category)
        ? _watchVideos.filter(function(x){ return x.category === v.category; })
        : [];
      thumbEl.innerHTML = '';
      thumbEl.className = 'wvm-cat-avatar-thumb';
      if (cat && cat.img) {
        var img = document.createElement('img');
        img.src = cat.img;
        img.onerror = function(){ imgErr && imgErr(this); };
        thumbEl.appendChild(img);
      } else {
        var imgs = catVids.slice(-4).map(function(x){ return x.thumb || x.img || ''; }).filter(Boolean);
        if (imgs.length) {
          var n = Math.min(imgs.length, 4);
          thumbEl.classList.add('collage', 'n' + n);
          imgs.slice(0, n).forEach(function(src){
            var img = document.createElement('img');
            img.src = src; img.loading = 'lazy';
            img.onerror = function(){ imgErr && imgErr(this); };
            thumbEl.appendChild(img);
          });
        }
      }
      thumbEl.dataset.catkey = v.category || '';
      thumbEl.dataset.tvmode = '';
    })();
    // fav button state
    var _wvmFavBtn   = document.getElementById('wvmFavBtn');
    var _wvmFavLabel = document.getElementById('wvmFavLabel');
    var _isFav = watchFavs.includes(key);
    if (_wvmFavBtn) { _wvmFavBtn.classList.toggle('faved', _isFav); _wvmFavBtn.dataset.wkey = key; }
    if (_wvmFavLabel) _wvmFavLabel.textContent = _isFav ? 'Saved' : 'Save';
    if (_wvmFavBtn) {
      var _favSvg = _wvmFavBtn.querySelector('svg');
      if (_favSvg) _favSvg.setAttribute('fill', _isFav ? 'currentColor' : 'none');
    }
    // like button — realtime subscribe
    var _wvmLikeBtn   = document.getElementById('wvmLikeBtn');
    var _wvmLikeLabel = document.getElementById('wvmLikeLabel');
    if (_wvmLikeBtn) { _wvmLikeBtn.dataset.wkey = key; _wvmLikeBtn.classList.remove('liked'); }
    if (_wvmLikeLabel) _wvmLikeLabel.textContent = 'Like';
    if (window._fbDb && window._fbRef && window._fbOnValue) {
      if (window._wvmLikeUnsub) { try { window._wvmLikeUnsub(); } catch(e) {} }
      var _likePath = 'watch_videos/' + key + '/likes';
      window._wvmLikeUnsub = window._fbOnValue(
        window._fbRef(window._fbDb, _likePath),
        function(snap) {
          var data  = snap.exists() ? snap.val() : {};
          var total = data.count || 0;
          var uid   = currentUser ? currentUser.uid : null;
          var liked = uid && data.users && data.users[uid] ? true : false;
          var btn   = document.getElementById('wvmLikeBtn');
          var lbl   = document.getElementById('wvmLikeLabel');
          if (btn) {
            btn.classList.toggle('liked', liked);
            var svg = btn.querySelector('svg');
            if (svg) svg.setAttribute('fill', liked ? 'currentColor' : 'none');
          }
          if (lbl) lbl.textContent = liked ? (total + ' Liked') : (total > 0 ? total + ' Like' : 'Like');
        }
      );
    }
    // share data store
    window._wvmCurrentVideo = v;
    window._wvmCurrentSportsKey   = null;
    window._wvmCurrentSportsMatch = null;
    // sports modal এ hide হওয়া wvm-actions restore করো
    var _wvmAct = document.querySelector('.wvm-actions');
    if (_wvmAct) _wvmAct.style.display = '';
    // view count — খুললেই সাথে সাথে increment
    var _viewLbl = document.getElementById('wvmViewLabel');
    if (_viewLbl) _viewLbl.textContent = '—';
    if (window._wvmViewTimer) { clearTimeout(window._wvmViewTimer); window._wvmViewTimer = null; }
    if (window._fbDb && window._fbRef && window._fbOnValue && window._fbIncrement) {
      var _viewRef = window._fbRef(window._fbDb, 'watch_videos/' + key + '/views');
      if (window._wvmViewUnsub) { try { window._wvmViewUnsub(); } catch(e) {} }
      window._wvmViewUnsub = window._fbOnValue(_viewRef, function(snap) {
        var count = snap.exists() ? snap.val() : 0;
        var lbl = document.getElementById('wvmViewLabel');
        if (lbl) lbl.textContent = (count >= 1000 ? (count / 1000).toFixed(1) + 'k' : count) + ' Views';
      });
      window._fbUpdate(window._fbRef(window._fbDb, 'watch_videos/' + key), { views: window._fbIncrement(1), weekly_views: window._fbIncrement(1) }).catch(function(){});
    }
    // wvm For You — init
    var _wvmFySelectedCats = (window._wvmFySelectedCats || []);
    var _wvmFyBatch = 9;
    var _relList = document.getElementById('wvmRelatedList');
    if (_relList) { _relList.classList.remove('tv-grid'); _relList.classList.remove('sports-grid'); }
    // dot state restore
    var _wvmDot = document.getElementById('wvmForYouFilterDot');
    if (_wvmDot) _wvmDot.style.display = _wvmFySelectedCats.length ? '' : 'none';
    // pool build — _fyBuildPool reuse, current video বাদ
    function _wvmBuildPool(catFilter) {
      var base = (typeof _fyBuildPool === 'function') ? _fyBuildPool(catFilter) : [];
      return base.filter(function(item) { return item.v._key !== key; });
    }
    var _wvmFyPool = _wvmBuildPool(_wvmFySelectedCats);
    var _wvmFyShown = 0;
    if (_relList) _relList.innerHTML = '';
    // প্রথম 6টা — same category, adjacent videos (পরের 3 + আগের 3)
    if (_relList) {
      var _sameCatVids = _watchVideos.filter(function(v2) {
        return v2.url && v2._key !== key && v2.category === (v.category || '');
      }).sort(function(a, b) { return (parseInt(a.id)||0) - (parseInt(b.id)||0); });
      var _curIdx = _sameCatVids.findIndex(function(v2) { return v2._key === key; });
      // _watchVideos থেকে current video er index বের করো
      var _allSorted = _watchVideos.filter(function(v2){ return v2.url && v2.category === (v.category||''); })
        .sort(function(a,b){ return (parseInt(a.id)||0)-(parseInt(b.id)||0); });
      var _ci = _allSorted.findIndex(function(v2){ return v2._key === key; });
      var _next3 = _allSorted.slice(_ci + 1, _ci + 4);
      var _prev3 = _allSorted.slice(Math.max(0, _ci - 3), _ci).reverse();
      var _adjacent = _next3.concat(_prev3).slice(0, 6);
      if (_adjacent.length) {
        // ৩ এর গুণিতক পর্যন্ত fy-row-vvv এ রাখো, বাকিগুলো pool এ ছেড়ে দাও
        var _adjFull = Math.floor(_adjacent.length / 3) * 3;  // 3 এর multiple
        var _adjRemainder = _adjacent.slice(_adjFull);         // ১ বা ২টা বাকি থাকলে
        var _adjToRender  = _adjacent.slice(0, _adjFull);
        for (var _ri = 0; _ri < _adjToRender.length; _ri += 3) {
          var _rowEl = document.createElement('div');
          _rowEl.className = 'fy-row-vvv';
          var _slice = _adjToRender.slice(_ri, _ri + 3);
          _slice.forEach(function(av, j) {
            var _tmp = document.createElement('div');
            _tmp.innerHTML = makeWatchVideoCard(av, _ri + j);
            var _card = _tmp.firstElementChild;
            if (_card) _rowEl.appendChild(_card);
          });
          _relList.appendChild(_rowEl);
        }
        _attachVideoCardClicks(_relList);
        // বাকি ১-২টা pool এ ঢুকিয়ে দাও (mixed grid handle করবে)
        var _adjRemainderKeys = _adjRemainder.map(function(av){ return av._key; });
        _wvmFyPool = _adjRemainder.map(function(av){ return { v: av, score: 999 }; })
          .concat(_wvmFyPool.filter(function(item) {
            return !_adjacent.some(function(av){ return av._key === item.v._key; });
          }));
        _wvmFyShown = 0;
      }
    }
    // wvm cat shuffle state (For You mixed grid এর মতো)
    var _wvmCatShuffled = _fyShuffleCats ? _fyShuffleCats() : [];
    var _wvmCatUsedIdx  = 0;
    function _wvmNextCat() {
      if (!_wvmCatShuffled.length) return null;
      if (_wvmCatUsedIdx >= _wvmCatShuffled.length) {
        _wvmCatShuffled = _fyShuffleCats ? _fyShuffleCats() : _wvmCatShuffled;
        _wvmCatUsedIdx  = 0;
      }
      return _wvmCatShuffled[_wvmCatUsedIdx++] || null;
    }
    function _wvmNextCatUniq(exclude) {
      var cat = _wvmNextCat(); var tries = 0;
      while (cat && exclude && cat._key === exclude._key && tries++ < 6) cat = _wvmNextCat();
      return cat;
    }

    function _wvmFyLoad() {
      var grid   = document.getElementById('wvmRelatedList');
      var loader = document.getElementById('wvmForYouLoader');
      if (!grid || _wvmFyShown >= _wvmFyPool.length) return;
      if (loader) loader.style.display = 'flex';
      setTimeout(function() {
        var batch = _wvmFyPool.slice(_wvmFyShown, _wvmFyShown + _wvmFyBatch);

        // For You এর মতো mixed rows (VVV + CV + CC) build করো
        var rows   = [];
        var vIdx   = 0;
        var rowNo  = 0;
        var lastCat = null;
        while (vIdx < batch.length) {
          var vidsLeft = batch.length - vIdx;
          var type     = _fyPickRowType ? _fyPickRowType(false, vidsLeft) : 'VVV';
          if (type === 'VVV' && vidsLeft < 3) type = vidsLeft >= 1 ? 'CV' : 'CC';
          var row = { type: type, vids: [], cats: [] };
          if (type === 'VVV') {
            row.vids = batch.slice(vIdx, vIdx + 3);
            vIdx += 3;
          } else if (type === 'CV') {
            var cat = _wvmNextCatUniq(lastCat);
            lastCat = cat;
            if (!cat) { type = 'VVV'; row.type = 'VVV'; row.vids = batch.slice(vIdx, vIdx + 3); vIdx += Math.min(3, vidsLeft); }
            else { row.cats.push(cat); row.vids.push(batch[vIdx++]); }
          } else { // CC
            var c1 = _wvmNextCat();
            var c2 = _wvmNextCatUniq(c1);
            lastCat = c2;
            if (c1) row.cats.push(c1);
            if (c2) row.cats.push(c2);
            if (!c1 && !c2) { vIdx++; } // fallback: skip
          }
          rows.push(row);
          rowNo++;
          if (type === 'CC' && vIdx === 0 && rowNo > 4) break;
        }

        // For You _fyRenderRows reuse (grid, vidOffset は _wvmFyShown)
        if (typeof _fyRenderRows === 'function') {
          _fyRenderRows(rows, grid, _wvmFyShown);
        }

        _wvmFyShown += batch.length;
        _attachVideoCardClicks(grid);
        if (loader) loader.style.display = 'none';
      }, 200);
    }
    _wvmFyLoad();
    // filter open/close/apply — window এ expose করো (video-specific closure capture করবে)
    window._wvmFySelectedCats = _wvmFySelectedCats;
    window.wvmOpenForYouFilter = function() {
      var backdrop = document.getElementById('wvmForYouFilterBackdrop');
      var sheet    = document.getElementById('wvmForYouFilterSheet');
      var catsEl   = document.getElementById('wvmForYouFilterCats');
      if (!backdrop || !sheet || !catsEl) return;
      // tags build
      var tagCount = {};
      _watchVideos.forEach(function(vid) {
        if (!vid.url || !vid.seo) return;
        vid.seo.split(',').forEach(function(t) {
          t = t.trim(); if (!t) return;
          tagCount[t] = (tagCount[t] || 0) + 1;
        });
      });
      var tags = Object.keys(tagCount).sort(function(a,b){ return tagCount[b]-tagCount[a]; });
      catsEl.innerHTML = tags.map(function(tag) {
        var isActive = _wvmFySelectedCats.indexOf(tag) !== -1;
        return '<div class="fy-filter-chip' + (isActive ? ' active' : '') + '" data-key="' + tag.replace(/"/g,'&quot;') + '" onclick="wvmFyToggleCat(this)">'
          + (isActive ? '<i class="fa-solid fa-check" style="font-size:0.65rem;"></i> ' : '')
          + tag + '</div>';
      }).join('');
      backdrop.style.display = '';
      sheet.style.display = 'flex';
      requestAnimationFrame(function(){
        sheet.style.transform = 'translateY(0)';
        sheet.style.opacity = '1';
      });
      // drag-to-close (once)
      if (!sheet._wvmDragInit) {
        sheet._wvmDragInit = true;
        var sy = 0, drag = false, st = 0, locked = false;
        var catsEl2 = document.getElementById('wvmForYouFilterCats');
        sheet.addEventListener('touchstart', function(e) {
          sy = e.touches[0].clientY; st = Date.now(); drag = true; locked = false;
          sheet.style.transition = 'none';
        }, { passive: true });
        sheet.addEventListener('touchmove', function(e) {
          if (!drag) return;
          var dy = e.touches[0].clientY - sy;
          var inScroll = catsEl2 && catsEl2.contains(e.target);
          if (inScroll) {
            var atTop = catsEl2.scrollTop <= 0;
            var atBot = catsEl2.scrollTop + catsEl2.clientHeight >= catsEl2.scrollHeight - 1;
            if (!locked && ((dy > 0 && !atTop) || (dy < 0 && !atBot))) return;
          }
          if (dy < 0 && !locked) return;
          if (!locked && Math.abs(dy) > 6) locked = true;
          if (!locked) return;
          e.preventDefault();
          sheet.style.transform = 'translateY(' + Math.max(0, dy) + 'px)';
        }, { passive: false });
        sheet.addEventListener('touchend', function(e) {
          if (!drag) return; drag = false;
          var dy = e.changedTouches[0].clientY - sy;
          var dt = Date.now() - st;
          sheet.style.transition = '';
          if (locked && (dy > 80 || (dy > 40 && dt < 250))) {
            window.wvmCloseForYouFilter();
          } else {
            sheet.style.transform = 'translateY(0)';
          }
        }, { passive: true });
      }
    };
    window.wvmFyToggleCat = function(el) {
      var k = el.dataset.key;
      var idx = window._wvmFySelectedCats.indexOf(k);
      if (idx === -1) {
        window._wvmFySelectedCats.push(k);
        el.classList.add('active');
        el.innerHTML = '<i class="fa-solid fa-check" style="font-size:0.65rem;"></i> ' + el.textContent.trim();
      } else {
        window._wvmFySelectedCats.splice(idx, 1);
        el.classList.remove('active');
        el.textContent = el.textContent.trim();
      }
    };
    window.wvmCloseForYouFilter = function() {
      var backdrop = document.getElementById('wvmForYouFilterBackdrop');
      var sheet    = document.getElementById('wvmForYouFilterSheet');
      if (sheet) {
        sheet.style.transition = 'transform 0.3s cubic-bezier(0.32,0.72,0,1), opacity 0.25s';
        sheet.style.transform = 'translateY(100%)';
        sheet.style.opacity = '0';
        setTimeout(function() {
          sheet.style.display = 'none';
          sheet.style.transform = '';
          sheet.style.opacity = '';
          sheet.style.transition = '';
        }, 300);
      }
      if (backdrop) backdrop.style.display = 'none';
    };
    window.wvmApplyForYouFilter = function() {
      window.wvmCloseForYouFilter();
      var dot = document.getElementById('wvmForYouFilterDot');
      if (dot) dot.style.display = window._wvmFySelectedCats.length ? '' : 'none';
      // Rebuild feed + cat shuffle reset
      _wvmFyPool      = _wvmBuildPool(window._wvmFySelectedCats);
      _wvmFyShown     = 0;
      _wvmCatShuffled = _fyShuffleCats ? _fyShuffleCats() : [];
      _wvmCatUsedIdx  = 0;
      var grid = document.getElementById('wvmRelatedList');
      if (grid) grid.innerHTML = '';
      _wvmFyLoad();
    };
    modal.classList.add('open');
    document.body.classList.add('watch-open');
    lockBodyScroll();
    safeHistoryPush({ type: 'modal', modal: 'watchvideo', key: key, fromWatchCat: !!fromWatchCat }, '', '#' + key);
    // scroll — infinite load
    var wvmBody = document.getElementById('wvmBody');
    if (wvmBody) {
      wvmBody.scrollTop = 0;
      if (wvmBody._topbarScrollHandler) {
        wvmBody.removeEventListener('scroll', wvmBody._topbarScrollHandler);
        wvmBody._topbarScrollHandler = null;
      }
      wvmBody._topbarScrollHandler = function() {
        if (wvmBody.scrollTop + wvmBody.clientHeight >= wvmBody.scrollHeight - 300) {
          _wvmFyLoad();
        }
      };
      wvmBody.addEventListener('scroll', wvmBody._topbarScrollHandler, { passive: true });
    }
    // Media Session — notification bar এ title & artwork দেখাও
    setVideoMediaSession(v);
  }
  function setVideoMediaSession(v) {
    var thumb = v.img || v.thumb || '';
    if (!('mediaSession' in navigator)) return;
    var artworkArr = thumb ? [
      { src: thumb, sizes: '96x96',   type: 'image/jpeg' },
      { src: thumb, sizes: '200x200', type: 'image/jpeg' },
      { src: thumb, sizes: '512x512', type: 'image/jpeg' }
    ] : [];
    navigator.mediaSession.metadata = new MediaMetadata({
      title:  v.title   || 'CastFM Video',
      artist: v.channel || 'Cast FM',
      album:  v.category || '',
      artwork: artworkArr
    });
    // native <video> element আছে কিনা চেক করো
    var playerWrap = document.getElementById('watchPlayerWrap');
    var vid = playerWrap ? playerWrap.querySelector('video') : null;
    if (vid) {
      // HLS / direct video — events সরাসরি bind করো
      navigator.mediaSession.setActionHandler('play',  function() { vid.play().catch(function(){}); });
      navigator.mediaSession.setActionHandler('pause', function() { vid.pause(); });
      navigator.mediaSession.setActionHandler('stop',  function() { vid.pause(); });
      vid.addEventListener('play',  function() { if('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'; }, { passive: true });
      vid.addEventListener('pause', function() { if('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';  }, { passive: true });
      navigator.mediaSession.playbackState = vid.paused ? 'paused' : 'playing';
      // iframe dummy বন্ধ করো
      _stopIframeDummyAudio();
    } else {
      // YouTube / iframe — dummy silent audio দিয়ে Media Session active রাখো
      _startIframeDummyAudio(v);
    }
  }
  window.setVideoMediaSession = setVideoMediaSession;
  // ── Iframe dummy audio (Media Session active রাখার জন্য) ──
  function _startIframeDummyAudio(v) {
    // আগের instance বন্ধ করো
    _stopIframeDummyAudio();
    // 1-second silent loop — খুব কম volume, শুধু Media Session trigger করার জন্য
    var silentSrc = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    var a = new Audio(silentSrc);
    a.loop   = true;
    a.volume = 0.001;
    a.play().then(function() {
      navigator.mediaSession.setActionHandler('play',  null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('stop',  null);
      navigator.mediaSession.playbackState = 'playing';
    }).catch(function() {});
    window._wvmDummyAudio = a;
  }
  function _stopIframeDummyAudio() {
    if (window._wvmDummyAudio) {
      try { window._wvmDummyAudio.pause(); } catch(e) {}
      window._wvmDummyAudio = null;
    }
  }
  function wvmToggleLike() {
    if (!currentUser) {
      document.getElementById('loginBtn') && document.getElementById('loginBtn').click();
      return;
    }
    var btn = document.getElementById('wvmLikeBtn');
    if (!btn) return;
    var uid = currentUser.uid;
    // Sports match like
    if (window._wvmCurrentSportsKey) {
      var sKey = window._wvmCurrentSportsKey;
      var likesRef = window._fbRef(window._fbDb, 'sports/likes_detail/' + sKey);
      window._fbGet(likesRef).then(function(snap) {
        var data = snap.exists() ? snap.val() : {};
        var liked = data[uid] ? true : false;
        var updates = {};
        updates[uid] = liked ? null : true;
        window._fbUpdate(likesRef, updates).then(function() {
          // total count আপডেট
          window._fbGet(window._fbRef(window._fbDb, 'sports/likes_detail/' + sKey)).then(function(s2) {
            var cnt = s2.exists() ? Object.keys(s2.val()).length : 0;
            window._fbSet(window._fbRef(window._fbDb, 'sports/likes/' + sKey), cnt);
            var newLiked = !liked;
            btn.classList.toggle('liked', newLiked);
            var lbl = document.getElementById('wvmLikeLabel');
            if (lbl) lbl.textContent = newLiked ? (cnt >= 1000 ? (cnt/1000).toFixed(1)+'K Liked' : cnt + ' Liked') : (cnt > 0 ? (cnt >= 1000 ? (cnt/1000).toFixed(1)+'K' : cnt) : 'Like');
            var svg = btn.querySelector('svg');
            if (svg) svg.setAttribute('fill', newLiked ? 'currentColor' : 'none');
          }).catch(function(){});
        });
      }).catch(function(){});
      return;
    }
    var key = btn.dataset.wkey;
    if (!key) return;
    var likesRef = _activeTvKey
      ? window._fbRef(window._fbDb, 'channels/' + _activeTvKey + '/likes')
      : window._fbRef(window._fbDb, 'watch_videos/' + key + '/likes');
    window._fbGet(likesRef).then(function(snap) {
      var data = snap.exists() ? snap.val() : {};
      var liked = data.users && data.users[uid] ? true : false;
      var updates = {};
      if (liked) {
        updates['users/' + uid] = null;
        updates['count'] = Math.max(0, (data.count || 1) - 1);
      } else {
        updates['users/' + uid] = true;
        updates['count'] = (data.count || 0) + 1;
      }
      window._fbUpdate(likesRef, updates).then(function() {
        var newLiked  = !liked;
        var newCount  = updates['count'];
        btn.classList.toggle('liked', newLiked);
        var lbl = document.getElementById('wvmLikeLabel');
        if (lbl) lbl.textContent = newLiked ? (newCount + ' Liked') : (newCount > 0 ? newCount + ' Like' : 'Like');
        var svg = btn.querySelector('svg');
        if (svg) svg.setAttribute('fill', newLiked ? 'currentColor' : 'none');
      });
    }).catch(function(){});
  }
  window.wvmToggleLike = wvmToggleLike;
  function wvmToggleFav() {
    var btn = document.getElementById('wvmFavBtn');
    if (!btn) return;
    // Sports match save
    if (window._wvmCurrentSportsKey) {
      var sKey = window._wvmCurrentSportsKey;
      var lbl  = document.getElementById('wvmFavLabel');
      var svg  = btn.querySelector('svg');
      var isSaved = btn.classList.contains('faved');
      if (!window.currentUser) {
        document.getElementById('loginBtn') && document.getElementById('loginBtn').click();
        return;
      }
      var ref = window._fbRef(window._fbDb, 'users/' + window.currentUser.uid + '/saved_sports/' + sKey);
      if (isSaved) {
        window._fbSet(ref, null).then(function() {
          btn.classList.remove('faved');
          if (lbl) lbl.textContent = 'Save';
          if (svg) svg.setAttribute('fill', 'none');
        }).catch(function(){});
      } else {
        window._fbSet(ref, true).then(function() {
          btn.classList.add('faved');
          if (lbl) lbl.textContent = 'Saved';
          if (svg) svg.setAttribute('fill', 'currentColor');
        }).catch(function(){});
      }
      return;
    }
    var key = btn.dataset.wkey;
    if (!key) return;
    // TV channel
    if (_activeTvKey) {
      var idx = tvFavs.indexOf(key);
      if (idx >= 0) tvFavs.splice(idx, 1); else tvFavs.push(key);
      localStorage.setItem('tv_favs', JSON.stringify(tvFavs));
      if (window.currentUser) {
        try { window._fbSet(window._fbRef(window._fbDb, 'users/' + currentUser.uid + '/tv_favs'), tvFavs); } catch(e) {}
      }
      var isFav = tvFavs.includes(key);
      btn.classList.toggle('faved', isFav);
      var lbl = document.getElementById('wvmFavLabel');
      if (lbl) lbl.textContent = isFav ? 'Saved' : 'Save';
      var svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', isFav ? 'currentColor' : 'none');
      return;
    }
    // Video
    var idx = watchFavs.indexOf(key);
    if (idx >= 0) watchFavs.splice(idx, 1); else watchFavs.push(key);
    localStorage.setItem('watch_favs', JSON.stringify(watchFavs));
    if (window.currentUser) {
      try { window._fbSet(window._fbRef(window._fbDb, 'users/' + currentUser.uid + '/watch_favs'), watchFavs); } catch(e) {}
    }
    var isFav = watchFavs.includes(key);
    btn.classList.toggle('faved', isFav);
    var lbl = document.getElementById('wvmFavLabel');
    if (lbl) lbl.textContent = isFav ? 'Saved' : 'Save';
    var svg = btn.querySelector('svg');
    if (svg) svg.setAttribute('fill', isFav ? 'currentColor' : 'none');
    // category list-এর fav button ও sync করো
    var catFavBtn = document.getElementById('wfav-' + key);
    if (catFavBtn) {
      catFavBtn.classList.toggle('faved', isFav);
      var catSvg = catFavBtn.querySelector('svg');
      if (catSvg) { catSvg.setAttribute('fill', isFav ? 'currentColor' : 'none'); }
    }
  }
  window.wvmToggleFav = wvmToggleFav;
  function wvmOpenInfo() {
    document.getElementById('wvmInfoBackdrop').classList.add('open');
    document.getElementById('wvmInfoSheet').classList.add('open');
  }
  function wvmCloseInfo() {
    document.getElementById('wvmInfoBackdrop').classList.remove('open');
    document.getElementById('wvmInfoSheet').classList.remove('open');
  }
  window.wvmOpenInfo  = wvmOpenInfo;
  function wvmToggleDesc() {
    var box    = document.getElementById('wvmDescBox');
    var toggle = document.getElementById('wvmDescToggle');
    var title  = document.getElementById('wvmTopTitle');
    if (!box) return;
    var open = box.style.display === 'none' || box.style.display === '';
    box.style.display = open ? 'block' : 'none';
    if (toggle) toggle.classList.toggle('open', open);
    if (title)  title.classList.toggle('expanded', open);
  }
  window.wvmToggleDesc = wvmToggleDesc;
  window.wvmCloseInfo = wvmCloseInfo;
  function wvmOpenRelatedCat() {
    if (_activeTvKey) return;
    var v = window._wvmCurrentVideo;
    if (!v || !v.category) return;
    closeWatchModal(false);
    setTimeout(function() { openWatchCatModal(v.category); }, 320);
  }
  window.wvmOpenRelatedCat = wvmOpenRelatedCat;
  // initial onclick set
  var _relSeeAllInit = document.getElementById('wvmRelatedSeeAll');
  if (_relSeeAllInit) _relSeeAllInit.onclick = wvmOpenRelatedCat;
  function shareApp() {
    var url = 'https://castfm.pages.dev/app';
    var title = 'CastFM';
    if (window.AndroidBridge && window.AndroidBridge.share) {
      window.AndroidBridge.share(title, url);
    } else if (navigator.share) {
      navigator.share({ title: title, url: url }).catch(function(){});
    } else {
      navigator.clipboard.writeText(url).then(function() {
        alert('Link copied!');
      }).catch(function() {
        alert(url);
      });
    }
  }
  function wvmShare() {
    var base = window.location.origin + window.location.pathname;
    var text, url;
    // Sports match
    if (window._wvmCurrentSportsKey) {
      var sm = window._wvmCurrentSportsMatch;
      var smTitle = sm ? (sm.title || ((sm.team_a||'Team A') + ' vs ' + (sm.team_b||'Team B'))) : 'Sports';
      text = smTitle + ' — Sports on CastFM';
      url  = location.origin + '/share/' + window._wvmCurrentSportsKey;
    // Live TV channel
    } else if (window._activeTvKey) {
      var ch = _liveChannels.find(function(c) { return c._key === window._activeTvKey; });
      text = (ch && ch.name) ? ch.name + ' — Live TV on CastFM' : 'Live TV on CastFM';
      url  = location.origin + '/share/' + window._activeTvKey;
    } else {
      var v = window._wvmCurrentVideo;
      if (!v) return;
      text = v.title || 'Video';
      url  = location.origin + '/share/' + (v._key || '');
    }
    if (window.AndroidBridge && window.AndroidBridge.share) {
      window.AndroidBridge.share(text, url);
    } else if (navigator.share) {
      navigator.share({ title: text, url: url }).catch(function(){});
    } else {
      navigator.clipboard && navigator.clipboard.writeText(url);
    }
  }
  window.wvmShare = wvmShare;
  function closeWatchModal(fromPopstate, fromWatchCat) {
    var modal = document.getElementById('watchVideoModal');
    var playerWrap = document.getElementById('watchPlayerWrap');
    // closing animation
    modal.classList.add('closing');
    setTimeout(function() {
      modal.classList.remove('open');
      modal.classList.remove('closing');
      // animation শেষে player cleanup
      if (playerWrap._hls) { playerWrap._hls.destroy(); playerWrap._hls = null; }
      playerWrap.innerHTML = '';
      playerWrap.style.display = 'none';
    }, 280);
    // Sports stream হলে active border সরাও
    if (modal._isSportsStream) {
      modal._isSportsStream = false;
      window._wvmCurrentSportsKey   = null;
      window._wvmCurrentSportsMatch = null;
      document.querySelectorAll('.sports-match-card,.sports-modal-card').forEach(function(el) { el.classList.remove('sports-card-playing'); });
      // sports mode UI remove করো
      modal.classList.remove('sports-mode');
      document.body.classList.remove('sports-player-open');
      // sports topbar reset
      var _spTitle = document.getElementById('sportsPlayerTitle');
      var _spLive  = document.getElementById('sportsPlayerLiveBadge');
      var _spBar   = document.getElementById('sportsServerBar');
      if (_spTitle) _spTitle.textContent = '';
      if (_spLive)  _spLive.classList.remove('visible');
      if (_spBar)   { _spBar.innerHTML = ''; _spBar.style.display = 'none'; }
      var _spDescBox = document.getElementById('spDescBox');
      if (_spDescBox) { _spDescBox.textContent = ''; _spDescBox.style.display = 'none'; }
    }
    var wvmBody = document.getElementById('wvmBody');
    if (wvmBody) {
      wvmBody.scrollTop = 0;
      if (wvmBody._topbarScrollHandler) {
        wvmBody.removeEventListener('scroll', wvmBody._topbarScrollHandler);
        wvmBody._topbarScrollHandler = null;
      }
    }
    var wvmTopbar = document.querySelector('.wvm-topbar');
    if (wvmTopbar) wvmTopbar.classList.remove('hidden');
    wvmCloseInfo();
    window._wvmCurrentVideo = null;
    // Media Session clear করো
    _stopIframeDummyAudio();
    if ('mediaSession' in navigator) {
      try { navigator.mediaSession.metadata = null; } catch(e) {}
      try { navigator.mediaSession.playbackState = 'none'; } catch(e) {}
      ['play','pause','stop'].forEach(function(a){ try { navigator.mediaSession.setActionHandler(a, null); } catch(e) {} });
    }
    // like realtime unsubscribe
    if (window._wvmLikeUnsub) { try { window._wvmLikeUnsub(); } catch(e) {} window._wvmLikeUnsub = null; }
    // view realtime unsubscribe
    if (window._wvmViewUnsub) { try { window._wvmViewUnsub(); } catch(e) {} window._wvmViewUnsub = null; }
    if (window._wvmViewTimer) { clearTimeout(window._wvmViewTimer); window._wvmViewTimer = null; }
    // Live TV active state reset
    _activeTvKey = null;
    var _adN = document.getElementById('wvmAdNotice'); if (_adN) _adN.style.display = '';
    document.querySelectorAll('.tv-pill').forEach(function(el) { el.classList.remove('tv-active'); });
    // category modal বা liveTv modal খোলা থাকলে watch-open রাখো
    var catOpen   = document.getElementById('watchCatModal').classList.contains('open');
    var ltvOpen   = document.getElementById('liveTvModal').classList.contains('open');
    if (!catOpen && !ltvOpen) {
      document.body.classList.remove('watch-open');
      _scrollLockCount = 1; unlockBodyScroll();
    }
    // fromWatchCat: popstate এ e.state থেকে অথবা parameter থেকে check করো
    var _wasFromWatchCat = fromWatchCat || (history.state && history.state.fromWatchCat);
    if (!fromPopstate) {
      var curHash = window.location.hash.replace('#', '');
      if (curHash.startsWith('v_') || curHash.startsWith('c_')) try { history.back(); } catch(e) {}
    }
    if (_wasFromWatchCat) {
      var _wcm = document.getElementById('watchCatModal');
      if (!_wcm || !_wcm.classList.contains('open')) {
        // watchcat history state থেকে catId নাও অথবা _watchCatCurrentVideos এর category থেকে
        var _catId = (history.state && history.state.catId) || (window._watchCatCurrentCatId) || null;
        if (_catId) {
          setTimeout(function() { openWatchCatModal(_catId, true, true); }, 50);
        }
      }
    }
  }
  window.openWatchVideo = openWatchVideo;
  window.closeWatchModal = closeWatchModal;
  window.toggleWatchFav = toggleWatchFav;
  // Category avatar click — video player modal থেকে category modal খোলে
  window.wvmOpenCatModal = function() {
    // Sports context — trophy icon ক্লিক করলে Sports modal খুলবে
    if (window._wvmCurrentSportsKey) {
      closeWatchModal(false);
      setTimeout(function() { openSportsModal(); }, 320);
      return;
    }
    var thumbEl = document.getElementById('wvmCatAvatarThumb');
    var tvMode  = thumbEl && thumbEl.dataset.tvmode === '1';
    var catKey  = thumbEl ? thumbEl.dataset.catkey : '';
    if (!tvMode && !catKey) return;
    closeWatchModal(false);
    setTimeout(function() {
      if (tvMode) {
        if (typeof openLiveTvModal === 'function') openLiveTvModal();
      } else {
        if (typeof openWatchCatModal === 'function') openWatchCatModal(catKey);
      }
    }, 320);
  };
  /* ── LIVE TV CHANNELS (Firebase channels/) ── */
  var _liveChannels = [];
  var _activeTvKey  = null;
  var _lastChannelSig = '';
  function subscribeChannels() {
    if (!window._fbDb || !window._fbRef || !window._fbOnValue) return;
    window._fbOnValue(window._fbRef(window._fbDb, 'channels'), function(snap) {
      var sig = '';
      if (snap.exists()) {
        snap.forEach(function(child) {
          var d = child.val();
          sig += child.key + ':' + (d.name||'') + ':' + (d.id||'') + ':' + (d.url||'') + ':' + (d.img||'') + '|';
        });
      }
      var needsRender = sig !== _lastChannelSig;
      _lastChannelSig = sig;
      _liveChannels = [];
      if (snap.exists()) {
        snap.forEach(function(child) {
          var d = child.val();
          _liveChannels.push(Object.assign({ _key: child.key }, d));
        });
        _liveChannels.sort(function(a, b) { return (parseInt(a.id)||0) - (parseInt(b.id)||0); });
      }
      if (needsRender) renderLiveTvSection();
      var sbT = document.getElementById('sbLiveTvCount');
      if (sbT) sbT.textContent = _liveChannels.length + ' Channel' + (_liveChannels.length !== 1 ? 's' : '');
      if (window._handlePendingHash) window._handlePendingHash();
    });
  }
  function _makeTvPill(ch, i) {
    var key  = ch._key;
    var name = ch.name || key;
    var img  = ch.img  || '';
    var isActive = (_activeTvKey === key);
    var thumbHtml = img
      ? '<img src="' + img + '" alt="' + name + '" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" onload="imgLoad(this)" onerror="imgErr(this)">'
      : '<div class="tv-pill-placeholder">' + name.substring(0, 3).toUpperCase() + '</div>';
    return '<div class="tv-pill' + (isActive ? ' tv-active' : '') + '"'
      + ' style="animation-delay:' + (i * 0.07) + 's"'
      + ' data-tvkey="' + key + '"'
      + ' onclick="playLiveTv(this.dataset.tvkey)">'
      + '<div class="tv-pill-thumb">'
      + thumbHtml
      + '<div class="tv-pill-live-badge"><span class="tv-live-pulse"></span>LIVE</div>'
      + '</div>'
      + '</div>';
  }
  /* ══════════════════════════════════════
     SPORTS MATCH CARDS
  ══════════════════════════════════════ */
  var _sportsMatches = [];
  var _sportsCountdownTimers = {};

  function subscribesSports() {
    if (!window._fbDb || !window._fbRef || !window._fbOnValue) return;
    window._fbOnValue(window._fbRef(window._fbDb, 'sports'), function(snap) {
      _sportsMatches = [];
      if (snap.exists()) {
        snap.forEach(function(child) {
          var d = child.val();
          if (d.is_active) {
            _sportsMatches.push(Object.assign({ _key: child.key }, d));
          }
        });
      }
      renderLiveTvSection();
      if (typeof renderWatchSportsSection === 'function') renderWatchSportsSection();
    });
  }
  window.subscribesSports = subscribesSports;

  // ── SPORTS MODAL ────────────────────────────────────────────
  var _sportsActiveFilter = 'all';
  var _sportsActiveCountry = '';

  function _renderSportsFilterBar() {
    var bar = document.getElementById('sportsFilterBar');
    if (!bar) return;

    // Static status filters
    var statusFilters = [
      { key: 'all', label: 'All' },
      { key: 'live', label: 'Live' },
      { key: 'upcoming', label: 'Upcoming' },
      { key: 'highlights', label: 'Highlights' }
    ];

    // Dynamic country pills from team_a / team_b
    var countrySet = {};
    _sportsMatches.forEach(function(m) {
      if (_sportsMatchState(m) === 'expired') return;
      if (m.team_a) countrySet[m.team_a.trim()] = m.flag_a || '';
      if (m.team_b) countrySet[m.team_b.trim()] = m.flag_b || '';
    });
    var countries = Object.keys(countrySet).sort();

    var statusHtml = statusFilters.map(function(f) {
      return '<span class="ltv-tag-chip' + (f.key === _sportsActiveFilter ? ' active' : '') + '" onclick="_setSportsFilter(\'' + f.key + '\')">' + f.label + '</span>';
    }).join('');

    var sepHtml = countries.length ? '<span class="ltv-tag-chip-sep"></span>' : '';

    var countryHtml = countries.map(function(c) {
      var flagCode = countrySet[c];
      var flagImg = flagCode
        ? '<img src="' + _getSportsFlagUrl(flagCode) + '" class="sports-pill-flag" alt="' + c + '">'
        : '';
      return '<span class="ltv-tag-chip' + (c === _sportsActiveCountry ? ' active' : '') + '" onclick="_setSportsCountry(\'' + c + '\')">' + flagImg + c + '</span>';
    }).join('');

    bar.innerHTML = statusHtml + sepHtml + countryHtml;
  }

  window._setSportsFilter = function(key) {
    _sportsActiveFilter = key;
    _sportsActiveCountry = '';
    _renderSportsFilterBar();
    _renderSportsModalGrid();
  };

  window._setSportsCountry = function(country) {
    if (_sportsActiveCountry === country) {
      _sportsActiveCountry = '';
    } else {
      _sportsActiveCountry = country;
      _sportsActiveFilter = 'all';
    }
    _renderSportsFilterBar();
    _renderSportsModalGrid();
  };

  function _renderSportsModalGrid(filter) {
    var grid = document.getElementById('sportsModalGrid');
    if (!grid) return;
    _renderSportsFilterBar();
    var activeMatches = _sportsMatches.filter(function(m) {
      var state = _sportsMatchState(m);
      if (state === 'expired') return false;
      if (_sportsActiveFilter === 'live') return state === 'live';
      if (_sportsActiveFilter === 'upcoming') return state === 'countdown';
      if (_sportsActiveFilter === 'highlights') return state === 'highlights';
      return true;
    });
    if (_sportsActiveCountry) {
      activeMatches = activeMatches.filter(function(m) {
        return (m.team_a || '').trim() === _sportsActiveCountry
          || (m.team_b || '').trim() === _sportsActiveCountry;
      });
    }
    if (filter && filter.trim()) {
      var q = filter.trim().toLowerCase();
      activeMatches = activeMatches.filter(function(m) {
        return (m.team_a || '').toLowerCase().includes(q)
          || (m.team_b || '').toLowerCase().includes(q)
          || (m.stage || '').toLowerCase().includes(q)
          || (m.title || '').toLowerCase().includes(q);
      });
    }
    if (!activeMatches.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;padding:48px 16px;text-align:center;color:var(--muted);font-family:\'Plus Jakarta Sans\',sans-serif;font-size:0.85rem;">No matches found</div>';
      return;
    }
    activeMatches.sort(function(a, b) {
      return (b.match_time || 0) - (a.match_time || 0);
    });
    grid.innerHTML = activeMatches.map(function(m, i) { return _makeSportsCardModal(m, i); }).join('');
    _startSportsCountdowns();
  }

  var _dSportsFilter = (function() {
    var t;
    return function(val) { clearTimeout(t); t = setTimeout(function() { _renderSportsModalGrid(val); }, 200); };
  })();
  window._dSportsFilter = _dSportsFilter;

  function _makeSportsCardModal(match, idx) {
    var state = _sportsMatchState(match);
    if (state === 'expired') return '';
    var key = match._key;
    var flagA = _getSportsFlagUrl(match.flag_a || '');
    var flagB = _getSportsFlagUrl(match.flag_b || '');
    var teamA = match.team_a || 'Team A';
    var teamB = match.team_b || 'Team B';
    var stage = match.stage || '';
    var title = match.title || '';
    var isLive = state === 'live';
    var isHighlights = state === 'highlights';
    var clickable = isLive || isHighlights || !!(match.stream_url) || !!(match.intro) || !!(match.direct);
    var flagHtml = function(src, name) {
      return src
        ? '<img src="' + src + '" alt="' + name + '" class="sports-flag-img" onerror="this.style.display=\'none\'">'
        : '<span class="sports-flag-fallback">' + name.substring(0,3).toUpperCase() + '</span>';
    };
    var badgeHtml;
    if (isLive) {
      badgeHtml = '<div class="sports-live-badge"><span class="tv-live-pulse"></span>LIVE</div>';
    } else if (isHighlights) {
      badgeHtml = '<div class="sports-highlights-badge">HIGHLIGHTS</div>';
    } else {
      badgeHtml = '<div class="sports-countdown" id="smmc-scd-' + key + '" data-matchtime="' + (match.match_time || 0) + '">--:--</div>';
    }
    var onclickAttr = clickable ? 'onclick="closeSportsModal();setTimeout(function(){openSportsStream(\'' + key + '\');},200)"' : '';
    var disabledClass = clickable ? '' : ' sports-card-disabled';
    return '<div class="sports-modal-card' + disabledClass + '" id="smmc-' + key + '" style="animation-delay:' + (idx * 0.07) + 's" ' + onclickAttr + '>'
      + '<span class="sports-card-trophy">&#127942;</span>'
      + '<div class="sports-card-inner">'
      + (title ? '<div class="sports-card-title">' + title + '</div>' : '')
      + '<div class="sports-teams-row">'
      + '<div class="sports-team">' + flagHtml(flagA, teamA) + '<span class="sports-team-name">' + teamA + '</span></div>'
      + '<div class="sports-vs">VS</div>'
      + '<div class="sports-team">' + flagHtml(flagB, teamB) + '<span class="sports-team-name">' + teamB + '</span></div>'
      + '</div>'
      + '<div class="sports-card-bottom">' + badgeHtml + '</div>'
      + '</div>'
      + '</div>';
  }

    function openSportsModal(fromPopstate) {
    window._safeModalSearchClose('sports');
    _sportsActiveFilter = 'all';
    _sportsActiveCountry = '';
    _renderSportsModalGrid();
    document.getElementById('sportsModal').classList.add('open');
    document.body.classList.add('watch-open');
    lockBodyScroll();
    if (!fromPopstate) safeHistoryPush({ type: 'modal', modal: 'sports_modal' }, '', '#sports');
  }
  function closeSportsModal(fromPopstate) {
    var modal = document.getElementById('sportsModal');
    closeModalWithAnim(modal, 280, function() {
      var vidOpen = document.getElementById('watchVideoModal').classList.contains('open');
      if (!vidOpen) {
        document.body.classList.remove('watch-open');
        _scrollLockCount = 1; unlockBodyScroll();
      }
    });
    if (!fromPopstate) {
      if (window.location.hash === '#sports') try { history.back(); } catch(e) {}
    }
  }
  window.openSportsModal = openSportsModal;
  window.closeSportsModal = closeSportsModal;
  // ── END SPORTS MODAL ──────────────────────────────────────────

  function _getSportsFlagUrl(code) {
    if (!code) return '';
    return 'https://flagcdn.com/w40/' + code.toLowerCase() + '.png';
  }

  function _sportsMatchState(match) {
    var now = Date.now();
    var matchMs = (match.match_time || 0) * 1000;
    var graceMs = 30 * 60 * 1000; // 30 minutes grace after match_time

    // match_time পার হয়েছে কিনা চেক করো আগে
    var matchStarted = matchMs > 0 ? now >= matchMs : true;

    // stream_url বা direct আছে AND match_time পার হয়েছে — তাহলেই LIVE
    if ((match.stream_url || match.direct) && matchStarted) return 'live';

    // highlights আছে (এবং live নয়)
    if (match.highlights) return 'highlights';

    // expired — match_time + grace পার হয়ে গেছে, কোনো URL নেই
    if (matchMs > 0 && now > matchMs + graceMs) return 'expired';

    // match_time আসেনি এখনো — countdown
    return 'countdown';
  }

  function _formatMatchTime(ts) {
    // ts is unix seconds, display in GMT+6
    var d = new Date(ts * 1000);
    var offset = 6 * 60; // GMT+6 in minutes
    var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    var bd = new Date(utc + offset * 60000);
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var day = days[bd.getDay()];
    var date = bd.getDate();
    var month = months[bd.getMonth()];
    var h = bd.getHours();
    var m = bd.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    var mStr = m < 10 ? '0' + m : m;
    return day + ', ' + date + ' ' + month + ' · ' + h + ':' + mStr + ' ' + ampm;
  }

  function _formatCountdown(ms) {
    if (ms <= 0) return '00:00:00';
    var totalSec = Math.floor(ms / 1000);
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    var pad = function(n) { return n < 10 ? '0' + n : n; };
    if (h > 0) return pad(h) + ':' + pad(m) + ':' + pad(s);
    return pad(m) + ':' + pad(s);
  }

  function _makeSportsCard(match, idx) {
    var state = _sportsMatchState(match);
    if (state === 'expired') return '';
    var key = match._key;
    var flagA = _getSportsFlagUrl(match.flag_a || '');
    var flagB = _getSportsFlagUrl(match.flag_b || '');
    var teamA = match.team_a || 'Team A';
    var teamB = match.team_b || 'Team B';
    var title = match.title || '';
    var isLive = state === 'live';
    var isHighlights = state === 'highlights';
    var hasIntro = !!(match.intro);
    var hasDirect = !!(match.direct);
    var hasHighlights = !!(match.highlights);
    var clickable = isLive || isHighlights || hasIntro || hasDirect || !!(match.stream_url);

    var flagHtml = function(src, name) {
      return src
        ? '<img src="' + src + '" alt="' + name + '" class="sports-flag-img" onerror="this.style.display=\'none\'">'
        : '<span class="sports-flag-fallback">' + name.substring(0,3).toUpperCase() + '</span>';
    };

    var statusRowHtml;
    if (isLive) {
      statusRowHtml = '<div class="sports-status-row"><div class="sports-live-badge"><span class="tv-live-pulse"></span>LIVE</div></div>';
    } else if (isHighlights) {
      statusRowHtml = '<div class="sports-status-row"><div class="sports-highlights-badge">HIGHLIGHTS</div></div>';
    } else {
      statusRowHtml = '<div class="sports-status-row"><div class="sports-countdown" id="scd-' + key + '" data-matchtime="' + (match.match_time || 0) + '">--:--</div></div>';
    }
    var titleHtml = title ? '<div class="sports-card-title">' + title + '</div>' : '';

    var onclickAttr = clickable ? 'onclick="openSportsStream(\'' + key + '\')"' : '';
    var disabledClass = clickable ? '' : ' sports-card-disabled';

    return '<div class="sports-match-card' + disabledClass + '" id="smc-' + key + '" style="animation-delay:' + (idx * 0.07) + 's" ' + onclickAttr + '>'      + '<span class="sports-card-trophy">🏆</span>'      + '<div class="sports-card-inner">'      + titleHtml      + '<div class="sports-teams-row">'      + '<div class="sports-team">'      + flagHtml(flagA, teamA)      + '<span class="sports-team-name">' + teamA + '</span>'      + '</div>'      + '<div class="sports-vs">VS</div>'      + '<div class="sports-team">'      + flagHtml(flagB, teamB)      + '<span class="sports-team-name">' + teamB + '</span>'      + '</div>'      + '</div>'      + statusRowHtml      + '</div>'      + '</div>';
  }

    function _startSportsCountdowns() {
    // Clear old timers
    Object.keys(_sportsCountdownTimers).forEach(function(k) { clearInterval(_sportsCountdownTimers[k]); });
    _sportsCountdownTimers = {};

    _sportsMatches.forEach(function(match) {
      if (_sportsMatchState(match) !== 'countdown') return;
      var key = match._key;
      var matchMs = (match.match_time || 0) * 1000;

      var tick = function() {
        var el  = document.getElementById('scd-' + key);
        var el2 = document.getElementById('smmc-scd-' + key); // sports player modal suggestion card
        var el3 = document.getElementById('wss-scd-' + key);  // watch sports section card
        var remaining = matchMs - Date.now();
        if (remaining <= 0) {
          var graceMs = 30 * 60 * 1000;
          if (Date.now() > matchMs + graceMs) {
            var card = document.getElementById('smc-' + key);
            if (card) card.style.display = 'none';
            clearInterval(_sportsCountdownTimers[key]);
            _checkSectionVisibility();
          } else {
            if (el)  el.textContent  = 'শুরু হচ্ছে...';
            if (el2) el2.textContent = 'শুরু হচ্ছে...';
            if (el3) el3.textContent = 'শুরু হচ্ছে...';
          }
          return;
        }
        if (!el && !el2 && !el3) { clearInterval(_sportsCountdownTimers[key]); return; }
        var txt = _formatCountdown(remaining);
        if (el)  el.textContent  = txt;
        if (el2) el2.textContent = txt;
        if (el3) el3.textContent = txt;
      };
      tick();
      _sportsCountdownTimers[key] = setInterval(tick, 1000);
    });
  }

  function _checkSectionVisibility() {
    var scroll = document.getElementById('liveTvScroll');
    if (!scroll) return;
    var visibleCards = scroll.querySelectorAll('.sports-match-card:not([style*="display: none"])');
    var visibleTvPills = scroll.querySelectorAll('.tv-pill');
    if (!visibleCards.length && !visibleTvPills.length) {
      var section = document.getElementById('liveTvSection');
      if (section) section.style.display = 'none';
    }
  }

  function openSportsStream(key) {
    var match = _sportsMatches.find(function(m) { return m._key === key; });
    if (!match) return;
    if (!match.stream_url && !match.direct && !match.intro && !match.highlights) return;

    // direct থাকলে external link এ খুলবে, modal খুলবে না
    if (!match.stream_url && match.direct) {
      window.open(match.direct, '_blank', 'noopener,noreferrer');
      return;
    }

    // priority: stream_url > highlights > intro(loop)
    var isHighlights = !match.stream_url && !!match.highlights;
    var isIntroLoop  = !match.stream_url && !match.highlights && !!match.intro;
    var url = match.stream_url || match.highlights || match.intro;
    var title = match.title || ((match.team_a || 'Team A') + ' vs ' + (match.team_b || 'Team B'));

    // সব sports card এর active border সরাও, তারপর এটায় দাও
    document.querySelectorAll('.sports-match-card').forEach(function(el) { el.classList.remove('sports-card-playing'); });
    var activeCard = document.getElementById('smc-' + key);
    if (activeCard) activeCard.classList.add('sports-card-playing');

    // search modal open থাকলে বন্ধ করো
    var sm = document.getElementById('searchModal');
    if (sm && sm.classList.contains('open')) closeSearchModal(false);

    // audio বন্ধ করো
    if (typeof CT !== 'undefined' && CT.stop) CT.stop();

    var modal      = document.getElementById('watchVideoModal');
    var playerWrap = document.getElementById('watchPlayerWrap');
    if (playerWrap._hls) { playerWrap._hls.destroy(); playerWrap._hls = null; }
    if (playerWrap._retryTimer) { clearTimeout(playerWrap._retryTimer); playerWrap._retryTimer = null; }
    if (playerWrap._hlsErrTimer) { clearTimeout(playerWrap._hlsErrTimer); playerWrap._hlsErrTimer = null; }
    playerWrap.innerHTML = '';
    playerWrap.style.display = '';

    // stream_url comma-separated হলে split করো
    var streamUrls = match.stream_url
      ? match.stream_url.split(',').map(function(u) { return u.trim(); }).filter(Boolean)
      : [];
    var activeUrlIndex = 0;
    url = streamUrls.length ? streamUrls[0] : (match.highlights || match.intro);

    // server switcher bar — একাধিক URL থাকলেই দেখাবে
    var serverBar = document.getElementById('sportsServerBar');
    if (serverBar) {
      if (streamUrls.length > 1) {
        serverBar.innerHTML = streamUrls.map(function(u, i) {
          return '<button class="sp-server-btn' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '">Server ' + (i + 1) + '</button>';
        }).join('');
        serverBar.style.display = 'flex';
        serverBar.onclick = function(e) {
          var btn = e.target.closest('.sp-server-btn');
          if (!btn) return;
          var idx = parseInt(btn.getAttribute('data-idx'));
          if (idx === activeUrlIndex) return;
          activeUrlIndex = idx;
          serverBar.querySelectorAll('.sp-server-btn').forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          _loadSportsUrl(streamUrls[idx], playerWrap, false);
        };
      } else {
        serverBar.innerHTML = '';
        serverBar.style.display = 'none';
      }
    }

    function _loadSportsUrl(srcUrl, wrap, loop) {
      if (wrap._hls) { wrap._hls.destroy(); wrap._hls = null; }
      if (wrap._retryTimer) { clearTimeout(wrap._retryTimer); wrap._retryTimer = null; }
      wrap.innerHTML = '';
      if (srcUrl.match(/\.m3u8/i) || srcUrl.includes('m3u8')) {
        var v = document.createElement('video');
        v.controls = true; v.autoplay = true; v.playsInline = true;
        if (loop) v.loop = true;
        v.setAttribute('controlsList', 'nodownload noplaybackrate');
        v.setAttribute('disablepictureinpicture', '');
        v.style.cssText = 'width:100%;height:100%;background:#000;display:block;';
        if (window.Hls && Hls.isSupported()) {
          var hls = new Hls({
            lowLatencyMode: true,
            backBufferLength: 90,
            maxBufferLength: 60,
            maxMaxBufferLength: 120,
            maxBufferSize: 120 * 1000 * 1000,
            maxBufferHole: 0.5,
            highBufferWatchdogPeriod: 2,
            nudgeMaxRetry: 5,
            startLevel: -1,
            abrEwmaFastLive: 3.0,
            abrEwmaSlowLive: 9.0,
            liveSyncDurationCount: 5,
            liveMaxLatencyDurationCount: 30
          });
          hls.on(Hls.Events.MANIFEST_PARSED, function(event, data) {
            // সবচেয়ে কম bitrate এর level select করো, auto-switching বন্ধ করে দেয়
            var levels = data.levels;
            var lowestIdx = 0;
            for (var i = 1; i < levels.length; i++) {
              if (levels[i].bitrate < levels[lowestIdx].bitrate) lowestIdx = i;
            }
            hls.currentLevel = lowestIdx;
            v.play().catch(function(){});
          });
          hls.loadSource(srcUrl); hls.attachMedia(v);
          wrap._hls = hls;
        } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
          v.src = srcUrl;
        }
        wrap.appendChild(v);
      } else if (srcUrl.match(/\.mp4/i) || srcUrl.match(/\.(webm|ogg)/i)) {
        wrap.innerHTML = '<video src="' + srcUrl + '" controls autoplay playsinline' + (loop ? ' loop' : '') + ' disablepictureinpicture controlsList="nodownload noplaybackrate" style="width:100%;height:100%;background:#000;display:block;"></video>';
      } else {
        wrap.innerHTML = '<iframe src="' + srcUrl + '" frameborder="0" allow="autoplay; fullscreen" allowfullscreen style="width:100%;height:100%;display:block;"></iframe>';
      }
    }

    _loadSportsUrl(url, playerWrap, isIntroLoop);

    // topbar title
    var topTitle = document.getElementById('wvmTopTitle');
    if (topTitle) topTitle.textContent = isHighlights ? title + ' · Highlights' : title;

    // sports topbar title + live badge
    var spTitle = document.getElementById('sportsPlayerTitle');
    var spLive  = document.getElementById('sportsPlayerLiveBadge');
    if (spTitle) spTitle.textContent = title;
    if (spLive) {
      if (!isHighlights && !isIntroLoop) {
        spLive.classList.add('visible');
      } else {
        spLive.classList.remove('visible');
      }
    }

    // description ও seo tags clear করো (TV/video থেকে আসা data সরাতে)
    var _sDesc = document.getElementById('wvmDescText');
    var _sDescBox = document.getElementById('wvmDescBox');
    var _sSeo  = document.getElementById('wvmSeoTags');
    if (_sDesc) _sDesc.textContent = '';
    if (_sDescBox) _sDescBox.style.display = 'none';
    if (_sSeo)  _sSeo.innerHTML = '';

    // sports desc box
    var _spDescBox = document.getElementById('spDescBox');
    if (_spDescBox) {
      if (match.desc) {
        _spDescBox.innerHTML = _spMd(match.desc);
        _spDescBox.style.display = 'block';
      } else {
        _spDescBox.innerHTML = '';
        _spDescBox.style.display = 'none';
      }
    }

    function _spMd(t) {
      var s = t
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/^### (.+)$/gm,'<h3>$1</h3>')
        .replace(/^## (.+)$/gm,'<h2>$1</h2>')
        .replace(/^# (.+)$/gm,'<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
        .replace(/__(.+?)__/g,'<strong>$1</strong>')
        .replace(/\*(.+?)\*/g,'<em>$1</em>')
        .replace(/_(.+?)_/g,'<em>$1</em>')
        .replace(/`(.+?)`/g,'<code>$1</code>')
        .replace(/^---$/gm,'<hr>')
        .replace(/^\* (.+)$/gm,'<li>$1</li>')
        .replace(/^- (.+)$/gm,'<li>$1</li>')
        .replace(/^\d+\. (.+)$/gm,'<li>$1</li>');
      s = s.replace(/(<li>[\s\S]*?<\/li>)/g,'<ul>$1</ul>');
      s = s.split('\n\n').join('</p><p>');
      s = s.split('\n').join('<br>');
      s = s.replace(/^(?!<[hul]|<hr|<br)(.+)/gm,'<p>$1</p>');
      s = s.replace(/<p><\/p>/g,'');
      return s;
    }

    // Media Session
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title:  title,
        artist: 'CastFM',
        album:  match.stage || 'Sports Live',
        artwork: []
      });
      var sVid = playerWrap.querySelector('video');
      if (sVid) {
        navigator.mediaSession.setActionHandler('play',  function() { sVid.play().catch(function(){}); });
        navigator.mediaSession.setActionHandler('pause', function() { sVid.pause(); });
        navigator.mediaSession.setActionHandler('stop',  function() { sVid.pause(); });
        sVid.addEventListener('play',  function() { navigator.mediaSession.playbackState = 'playing'; }, { passive: true });
        sVid.addEventListener('pause', function() { navigator.mediaSession.playbackState = 'paused';  }, { passive: true });
        navigator.mediaSession.playbackState = 'playing';
      }
    }

    // ── Sports: like/save/view/share বোতাম লুকাও, avatar-ও লুকাও ──
    var wvmActions = document.querySelector('.wvm-actions');
    if (wvmActions) wvmActions.style.display = 'none';

    // mark current context as sports
    window._wvmCurrentSportsKey  = key;
    window._wvmCurrentSportsMatch = match;
    window._wvmCurrentVideo = null;

    // Like/View unsub cleanup (আগেরটা)
    if (window._wvmLikeUnsub) { try { window._wvmLikeUnsub(); } catch(e) {} window._wvmLikeUnsub = null; }
    if (window._wvmViewUnsub) { try { window._wvmViewUnsub(); } catch(e) {} window._wvmViewUnsub = null; }
    if (window._wvmViewTimer) { clearTimeout(window._wvmViewTimer); window._wvmViewTimer = null; }

    // View increment (3s delay)
    if (window._fbDb && window._fbRef && window._fbUpdate) {
      window._wvmViewTimer = setTimeout(function() {
        if (window._wvmCurrentSportsKey === key && window._fbDb)
          window._fbUpdate(window._fbRef(window._fbDb, 'sports/views'), (function(o){ o[key] = (window._fbIncrement ? window._fbIncrement(1) : 1); return o; })({}));
      }, 3000);
    }

    // related list — অন্য sports cards দেখাও
    var relList = document.getElementById('wvmRelatedList');
    if (relList) {
      relList.classList.remove('tv-grid');
      relList.classList.add('sports-grid');
      var now24h = Date.now() + 24 * 60 * 60 * 1000;
      // current match এর teams
      var curTeamA = (match.team_a || '').trim();
      var curTeamB = (match.team_b || '').trim();
      var otherMatches = _sportsMatches.filter(function(m) {
        var s = _sportsMatchState(m);
        if (m._key === key) return false;
        if (s === 'expired') return false;
        // countdown হলে শুধু ২৪ ঘণ্টার মধ্যে
        if (s === 'countdown') return (m.match_time || 0) * 1000 <= now24h;
        return true; // live, highlights
      });
      // sorting: 1) countdown (24h, ascending by time)  2) same country  3) random
      otherMatches.sort(function(a, b) {
        var sa = _sportsMatchState(a), sb = _sportsMatchState(b);
        var cdA = sa === 'countdown', cdB = sb === 'countdown';
        // countdown আগে
        if (cdA !== cdB) return cdA ? -1 : 1;
        if (cdA && cdB) return (a.match_time || 0) - (b.match_time || 0); // ascending
        // same country আগে
        function isSameCountry(m) {
          var tA = (m.team_a || '').trim(), tB = (m.team_b || '').trim();
          return tA === curTeamA || tA === curTeamB || tB === curTeamA || tB === curTeamB;
        }
        var scA = isSameCountry(a), scB = isSameCountry(b);
        if (scA !== scB) return scA ? -1 : 1;
        // বাকি random
        return Math.random() - 0.5;
      });
      if (otherMatches.length) {
        // "More Matches" লেবেল সেট করো
        var _relLabel  = document.getElementById('wvmRelatedLabel');
        var _relSeeAll = document.getElementById('wvmRelatedSeeAll');
        if (_relLabel)  _relLabel.textContent = 'More Matches';
        if (_relSeeAll) _relSeeAll.onclick = function() { openSportsModal(); };
        // cards render — section card এর মতো style, closeSportsModal ছাড়া
        relList.innerHTML = otherMatches.map(function(m, i) {
          var s2       = _sportsMatchState(m);
          var k2       = m._key;
          var fA       = _getSportsFlagUrl(m.flag_a || '');
          var fB       = _getSportsFlagUrl(m.flag_b || '');
          var tA       = m.team_a || 'Team A';
          var tB       = m.team_b || 'Team B';
          var isLv     = s2 === 'live';
          var isHl     = s2 === 'highlights';
          var click2   = isLv || isHl || !!(m.intro) || !!(m.direct);
          var fHtml    = function(src, name) {
            return src
              ? '<img src="' + src + '" alt="' + name + '" class="sports-flag-img" onerror="this.style.display=\'none\'">'
              : '<span class="sports-flag-fallback">' + name.substring(0,3).toUpperCase() + '</span>';
          };
          var badge2;
          if (isLv) {
            badge2 = '<div class="sports-live-badge"><span class="tv-live-pulse"></span>LIVE</div>';
          } else if (isHl) {
            badge2 = '<div class="sports-highlights-badge">HIGHLIGHTS</div>';
          } else {
            badge2 = '<div class="sports-countdown" id="smmc-scd-' + k2 + '" data-matchtime="' + (m.match_time || 0) + '">--:--</div>';
          }
          var oc2 = click2 ? 'onclick="openSportsStream(\'' + k2 + '\')"' : '';
          var dc2 = click2 ? '' : ' sports-card-disabled';
          return '<div class="sports-modal-card watch-sports-inline-card' + dc2 + '" id="smmc-' + k2 + '" style="animation-delay:' + (i * 0.07) + 's" ' + oc2 + '>'
            + '<span class="sports-card-trophy">&#127942;</span>'
            + '<div class="sports-card-inner">'
            + (m.title ? '<div class="sports-card-title">' + m.title + '</div>' : '')
            + '<div class="sports-teams-row">'
            + '<div class="sports-team">' + fHtml(fA, tA) + '<span class="sports-team-name">' + tA + '</span></div>'
            + '<div class="sports-vs">VS</div>'
            + '<div class="sports-team">' + fHtml(fB, tB) + '<span class="sports-team-name">' + tB + '</span></div>'
            + '</div>'
            + '<div class="sports-card-bottom">' + badge2 + '</div>'
            + '</div>'
            + '</div>';
        }).join('');
        // Sports modal এর countdown timer চালু করো
        _startSportsCountdowns();
      } else {
        relList.innerHTML = '';
      }
    }

    // mark as sports stream (close করলে restore করার জন্য)
    modal._isSportsStream = true;

    // sports player: full black mode
    modal.classList.add('sports-mode');
    document.body.classList.add('sports-player-open');

    // modal open
    modal.classList.add('open');
    document.body.classList.add('watch-open');
    lockBodyScroll();

    // TV channel active state reset
    window._activeTvKey = null;
    document.querySelectorAll('.tv-pill').forEach(function(el) { el.classList.remove('tv-active'); });

    if (!arguments[1]) { // fromPopstate না হলে history push
      safeHistoryPush({ type: 'modal', modal: 'sports', key: key }, '', '#sports_' + key);
    }
  }
  window.openSportsStream = openSportsStream;

  function renderLiveTvSection() {
    var section = document.getElementById('liveTvSection');
    var scroll  = document.getElementById('liveTvScroll');
    if (!section || !scroll) return;

    // Active sports matches — only live OR within 24h before match
    var now = Date.now();
    var activeMatches = _sportsMatches.filter(function(m) {
      var state = _sportsMatchState(m);
      if (state === 'live') return true;
      if (state !== 'countdown') return false;
      var matchMs = (m.match_time || 0) * 1000;
      return matchMs > 0 && (matchMs - now) <= 24 * 60 * 60 * 1000;
    });

    // sidebar sports count আপডেট
    var liveCount = _sportsMatches.filter(function(m) { return _sportsMatchState(m) === 'live'; }).length;
    var sbSportsCount = document.getElementById('sbSportsCount');
    if (sbSportsCount) sbSportsCount.textContent = liveCount > 0 ? liveCount + ' Live Match' + (liveCount !== 1 ? 'es' : '') : 'Watch & Enjoy';

    if (!_liveChannels.length && !activeMatches.length) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';

    // Sports cards আগে, তারপর TV channels
    var sportsHtml = activeMatches.map(function(m, i) { return _makeSportsCard(m, i); }).join('');

    // favorites আগে (TV channels)
    var favSet = new Set((typeof tvFavs !== 'undefined' ? tvFavs : []).map(String));
    var sorted = _liveChannels.slice().sort(function(a, b) {
      return (favSet.has(String(a._key)) ? 0 : 1) - (favSet.has(String(b._key)) ? 0 : 1);
    });
    var tvHtml = sorted.slice(0, 9).map(_makeTvPill).join('');

    scroll.innerHTML = sportsHtml + tvHtml;
    _startSportsCountdowns();
  }
  var _liveTvAllChannels = [];
  function openLiveTvModal(fromPopstate) {
    // favorites আগে
    var favSet = new Set((typeof tvFavs !== 'undefined' ? tvFavs : []).map(String));
    _liveTvAllChannels = _liveChannels.slice().sort(function(a, b) {
      var af = favSet.has(String(a._key)) ? 0 : 1;
      var bf = favSet.has(String(b._key)) ? 0 : 1;
      return af - bf;
    });
    var si = document.getElementById('liveTvSearchInput');
    if (si) si.value = '';
    window._safeModalSearchClose('liveTv');
    _liveTvActiveTag = 'all';
    liveTvRenderTagBar(_liveTvAllChannels);
    liveTvModalRender(_liveTvAllChannels);
    document.getElementById('liveTvModal').classList.add('open');
    document.body.classList.add('watch-open');
    lockBodyScroll();
    if (!fromPopstate) safeHistoryPush({ type: 'modal', modal: 'livetv' }, '', '#livetv');
  }
  function closeLiveTvModal(fromPopstate) {
    var modal = document.getElementById('liveTvModal');
    closeModalWithAnim(modal, 280, function() {
      var vidOpen = document.getElementById('watchVideoModal').classList.contains('open');
      if (!vidOpen) {
        document.body.classList.remove('watch-open');
        _scrollLockCount = 1; unlockBodyScroll();
      }
    });
    if (!fromPopstate) {
      if (window.location.hash === '#livetv') try { history.back(); } catch(e) {}
    }
  }
  function liveTvModalRender(channels) {
    var list = document.getElementById('liveTvModalList');
    if (!list) return;
    if (!channels.length) {
      list.innerHTML = '<div style="text-align:center;padding:48px 16px;color:var(--muted);font-family:DM Sans,sans-serif;font-size:0.9rem;">No channels found</div>';
      return;
    }
    list.innerHTML = channels.map(_makeTvPill).join('');
  }
  function liveTvFilter(q) {
    var filtered = _liveTvAllChannels.filter(function(c) {
      return (c.name || '').toLowerCase().includes(q.toLowerCase());
    });
    liveTvModalRender(filtered);
  }
  var _liveTvActiveTag = 'all';
  function liveTvRenderTagBar(channels) {
    var bar = document.getElementById('liveTvTagBar');
    if (!bar) return;
    var tagCount = {};
    _liveTvAllChannels.forEach(function(ch) {
      if (ch.seo) {
        ch.seo.split(',').forEach(function(t) {
          var trimmed = t.trim();
          if (trimmed) tagCount[trimmed] = (tagCount[trimmed] || 0) + 1;
        });
      }
    });
    var tags = Object.keys(tagCount).filter(function(t) { return tagCount[t] >= 2; }).sort(function(a, b) { return tagCount[b] - tagCount[a]; });
    if (!tags.length) { bar.innerHTML = ''; return; }
    var active = _liveTvActiveTag;
    var html = '<div class="ltv-tag-chip' + (active === 'all' ? ' active' : '') + '" onclick="liveTvTagSelect(\'all\')">All</div>';
    tags.forEach(function(tag) {
      html += '<div class="ltv-tag-chip' + (active === tag ? ' active' : '') + '" onclick="liveTvTagSelect(\'' + tag.replace(/\'/g, "\\\'") + '\')">' + tag + '</div>';
    });
    bar.innerHTML = html;
  }
  function liveTvTagSelect(tag) {
    _liveTvActiveTag = tag;
    var bar = document.getElementById('liveTvTagBar');
    if (bar) {
      var allText = tag === 'all' ? 'All' : tag;
      bar.querySelectorAll('.ltv-tag-chip').forEach(function(el) {
        el.classList.toggle('active', el.textContent.trim() === allText);
      });
    }
    if (tag === 'all') {
      liveTvModalRender(_liveTvAllChannels);
    } else {
      var filtered = _liveTvAllChannels.filter(function(ch) {
        if (!ch.seo) return false;
        return ch.seo.split(',').map(function(t){ return t.trim(); }).indexOf(tag) !== -1;
      });
      liveTvModalRender(filtered);
    }
  }
  window.openLiveTvModal  = openLiveTvModal;
  window.closeLiveTvModal = closeLiveTvModal;
  window.liveTvFilter     = liveTvFilter;
  window.liveTvTagSelect  = liveTvTagSelect;
  function playLiveTv(key) {
    var ch = _liveChannels.find(function(c) { return c._key === key; });
    if (!ch || !ch.url) return;
    // search modal open থাকলে আগে বন্ধ করো
    var sm = document.getElementById('searchModal');
    if (sm && sm.classList.contains('open')) closeSearchModal(false);
    // liveTvModal close করো আগে
    var ltvModal = document.getElementById('liveTvModal');
    if (ltvModal && ltvModal.classList.contains('open')) {
      ltvModal.classList.remove('open');
    }
    // audio বন্ধ করো
    if (typeof CT !== 'undefined' && CT.stop) CT.stop();
    // TV modal open করো
    var modal      = document.getElementById('watchVideoModal');
    var playerWrap = document.getElementById('watchPlayerWrap');
    if (playerWrap._hls) { playerWrap._hls.destroy(); playerWrap._hls = null; }
    if (playerWrap._retryTimer) { clearTimeout(playerWrap._retryTimer); playerWrap._retryTimer = null; }
    if (playerWrap._hlsErrTimer) { clearTimeout(playerWrap._hlsErrTimer); playerWrap._hlsErrTimer = null; }
    playerWrap.innerHTML = '';
    playerWrap.style.display = '';
    var url = ch.url;
    if (url.match(/\.m3u8/i) || url.includes('m3u8')) {
      var vid = document.createElement('video');
      vid.controls = true; vid.autoplay = true; vid.playsInline = true;
      vid.setAttribute('controlsList', 'nodownload noplaybackrate'); vid.setAttribute('disablepictureinpicture', '');
      vid.style.cssText = 'width:100%;height:100%;background:#000;display:block;';
      if (window.Hls && Hls.isSupported()) {
        var hls = new Hls({
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          highBufferWatchdogPeriod: 2,
          nudgeMaxRetry: 5,
          startLevel: -1,
          abrEwmaFastLive: 3.0,
          abrEwmaSlowLive: 9.0,
          liveSyncDurationCount: 2,
          liveMaxLatencyDurationCount: 4
        });
        hls.loadSource(url); hls.attachMedia(vid);
        hls.on(Hls.Events.ERROR, function(evt, data) {
          if (data.fatal) {
            clearTimeout(playerWrap._hlsErrTimer);
            playerWrap._hlsErrTimer = setTimeout(function() {
              if (vid.paused && vid.readyState < 2) {
                _showStreamError(playerWrap, url, vid);
              }
            }, 3000);
          }
        });
        playerWrap._hls = hls;
      } else if (vid.canPlayType('application/vnd.apple.mpegurl')) {
        vid.src = url;
        vid.onerror = function() { _showStreamError(playerWrap, url, vid); };
      }
      playerWrap.appendChild(vid);
    } else if (url.match(/\.mp4/i) || url.match(/\.(webm|ogg)/i)) {
      playerWrap.innerHTML = '<video src="' + url + '" controls autoplay playsinline disablepictureinpicture controlsList="nodownload noplaybackrate" style="width:100%;height:100%;background:#000;display:block;"></video>';
    } else {
      playerWrap.innerHTML = '<iframe src="' + url + '" frameborder="0" allow="autoplay; fullscreen" allowfullscreen style="width:100%;height:100%;display:block;"></iframe>';
    }
    // topbar title
    var topTitle = document.getElementById('wvmTopTitle');
    if (topTitle) topTitle.textContent = ch.name || 'Live TV';
    // Media Session — notification bar এ TV title & artwork দেখাও
    if ('mediaSession' in navigator) {
      var tvThumb = ch.img || ch.logo || ch.thumb || '';
      var tvArtwork = tvThumb ? [
        { src: tvThumb, sizes: '96x96',   type: 'image/jpeg' },
        { src: tvThumb, sizes: '200x200', type: 'image/jpeg' },
        { src: tvThumb, sizes: '512x512', type: 'image/jpeg' }
      ] : [];
      navigator.mediaSession.metadata = new MediaMetadata({
        title:  ch.name  || 'Live TV',
        artist: 'CastFM',
        album:  'Live TV',
        artwork: tvArtwork
      });
      var tvVid = playerWrap ? playerWrap.querySelector('video') : null;
      if (tvVid) {
        navigator.mediaSession.setActionHandler('play',  function() { tvVid.play().catch(function(){}); });
        navigator.mediaSession.setActionHandler('pause', function() { tvVid.pause(); });
        navigator.mediaSession.setActionHandler('stop',  function() { tvVid.pause(); });
        tvVid.addEventListener('play',  function() { if('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'; }, { passive: true });
        tvVid.addEventListener('pause', function() { if('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';  }, { passive: true });
        navigator.mediaSession.playbackState = 'playing';
      }
    }
    // view count — খুললেই সাথে সাথে increment
    var _tvViewLbl = document.getElementById('wvmViewLabel');
    if (_tvViewLbl) _tvViewLbl.textContent = '—';
    if (window._wvmViewTimer) { clearTimeout(window._wvmViewTimer); window._wvmViewTimer = null; }
    if (window._fbDb && window._fbRef && window._fbOnValue && window._fbIncrement) {
      var _tvViewRef = window._fbRef(window._fbDb, 'channels/' + key + '/views');
      if (window._wvmViewUnsub) { try { window._wvmViewUnsub(); } catch(e) {} }
      window._wvmViewUnsub = window._fbOnValue(_tvViewRef, function(snap) {
        var count = snap.exists() ? snap.val() : 0;
        var lbl = document.getElementById('wvmViewLabel');
        if (lbl) lbl.textContent = (count >= 1000 ? (count / 1000).toFixed(1) + 'k' : count) + ' Views';
      });
      window._fbUpdate(window._fbRef(window._fbDb, 'channels/' + key), { views: window._fbIncrement(1) }).catch(function(){});
    }
    // sports modal এ hide হওয়া buttons restore করো
    var _wvmAct2 = document.querySelector('.wvm-actions');
    if (_wvmAct2) _wvmAct2.style.display = '';
    // fav button state
    var _tvFavBtn = document.getElementById('wvmFavBtn');
    var _tvFavLbl = document.getElementById('wvmFavLabel');
    var _tvIsFav  = tvFavs.includes(key);
    if (_tvFavBtn) { _tvFavBtn.dataset.wkey = key; _tvFavBtn.classList.toggle('faved', _tvIsFav); var _fs = _tvFavBtn.querySelector('svg'); if (_fs) _fs.setAttribute('fill', _tvIsFav ? 'currentColor' : 'none'); }
    if (_tvFavLbl) _tvFavLbl.textContent = _tvIsFav ? 'Saved' : 'Save';
    // like button — channels/{key}/likes realtime subscribe
    var _tvLikeBtn = document.getElementById('wvmLikeBtn');
    var _tvLikeLbl = document.getElementById('wvmLikeLabel');
    if (_tvLikeBtn) { _tvLikeBtn.dataset.wkey = key; _tvLikeBtn.classList.remove('liked'); }
    if (_tvLikeLbl) _tvLikeLbl.textContent = 'Like';
    if (window._fbDb && window._fbRef && window._fbOnValue) {
      if (window._wvmLikeUnsub) { try { window._wvmLikeUnsub(); } catch(e) {} }
      window._wvmLikeUnsub = window._fbOnValue(
        window._fbRef(window._fbDb, 'channels/' + key + '/likes'),
        function(snap) {
          var data  = snap.exists() ? snap.val() : {};
          var total = data.count || 0;
          var uid   = currentUser ? currentUser.uid : null;
          var liked = uid && data.users && data.users[uid] ? true : false;
          var btn   = document.getElementById('wvmLikeBtn');
          var lbl   = document.getElementById('wvmLikeLabel');
          if (btn) {
            btn.classList.toggle('liked', liked);
            var svg = btn.querySelector('svg');
            if (svg) svg.setAttribute('fill', liked ? 'currentColor' : 'none');
          }
          if (lbl) lbl.textContent = liked ? (total + ' Liked') : (total > 0 ? total + ' Like' : 'Like');
        }
      );
    }
    // info sheet
    var sheetTitle = document.getElementById('wvmSheetTitle');
    var sheetDesc  = document.getElementById('wvmSheetDesc');
    if (sheetTitle) sheetTitle.textContent = ch.name || '';
    if (sheetDesc)  sheetDesc.textContent  = ch.desc  || '';
    // desc box + seo tags (same as video player)
    var _tvDescText   = document.getElementById('wvmDescText');
    var _tvDescBox    = document.getElementById('wvmDescBox');
    var _tvDescToggle = document.getElementById('wvmDescToggle');
    var _tvSeoTags    = document.getElementById('wvmSeoTags');
    if (_tvDescText) _tvDescText.textContent = ch.desc || '';
    if (_tvSeoTags) {
      var tvSeoRaw = (ch.seo || '').trim();
      if (tvSeoRaw) {
        _tvSeoTags.innerHTML = tvSeoRaw.split(',').map(function(t) {
          var tag = t.trim();
          return tag ? '<span class="wvm-seo-tag" onclick="openSearchModal(this.textContent.trim())">' + tag + '</span>' : '';
        }).join('<span class="wvm-seo-sep"> | </span>');
        _tvSeoTags.style.display = '';
      } else {
        _tvSeoTags.innerHTML = '';
        _tvSeoTags.style.display = 'none';
      }
    }
    if (_tvDescBox)    { _tvDescBox.style.display = 'none'; }
    if (_tvDescToggle) { _tvDescToggle.classList.remove('open'); _tvDescToggle.style.display = ''; }
    // ── Channel Avatar ──
    (function() {
      var thumbEl = document.getElementById('wvmCatAvatarThumb');
      if (!thumbEl) return;
      thumbEl.innerHTML = '';
      thumbEl.className = 'wvm-cat-avatar-thumb';
      var chImg = ch.img || ch.logo || ch.thumb || '';
      if (chImg) {
        var img = document.createElement('img');
        img.src = chImg;
        img.onerror = function(){ if(typeof imgErr==='function') imgErr(this); };
        thumbEl.appendChild(img);
      } else {
        var others = _liveChannels.filter(function(c){ return c._key !== key; });
        var imgs = others.slice(-4).map(function(c){ return c.img || c.logo || c.thumb || ''; }).filter(Boolean);
        if (imgs.length) {
          var n = Math.min(imgs.length, 4);
          thumbEl.classList.add('collage', 'n' + n);
          imgs.slice(0, n).forEach(function(src){
            var img = document.createElement('img');
            img.src = src; img.loading = 'lazy';
            img.onerror = function(){ if(typeof imgErr==='function') imgErr(this); };
            thumbEl.appendChild(img);
          });
        }
      }
      thumbEl.dataset.catkey = '';
      thumbEl.dataset.tvmode = '1';
    })();
    // active state
    _activeTvKey = key;
    document.querySelectorAll('.tv-pill').forEach(function(el) {
      el.classList.toggle('tv-active', el.dataset.tvkey === key);
    });
    // related label → Live TV, arrow hide
    var _relLabel   = document.getElementById('wvmRelatedLabel');
    var _relSeeAll  = document.getElementById('wvmRelatedSeeAll');
    if (_relLabel)  _relLabel.textContent = 'Live TV';
    if (_relSeeAll) _relSeeAll.onclick = function(){ openLiveTvModal(); };
    var _relList = document.getElementById('wvmRelatedList');
    if (_relList) {
      _relList.classList.remove('sports-grid');
      _relList.classList.add('tv-grid');
      var _others = _liveChannels.filter(function(c) { return c._key !== key; });
      if (_others.length) {
        _relList.innerHTML = _others.map(_makeTvPill).join('');
      } else {
        _relList.innerHTML = '';
      }
    }
    // WVM already open মানে channel switch — replaceState, নতুন open মানে pushState
    // NOTE: modal.classList.add('open') এর আগে check করতে হবে
    var _wvmAlreadyOpen = modal && modal.classList.contains('open');
    modal.classList.add('open');
    document.body.classList.add('watch-open');
    lockBodyScroll();
    if (_wvmAlreadyOpen) {
      try { history.replaceState({ type: 'modal', modal: 'tvchannel', key: key }, '', '#' + key); } catch(e) {}
    } else {
      safeHistoryPush({ type: 'modal', modal: 'tvchannel', key: key }, '', '#' + key);
    }
    // scroll করলে topbar hide হবে
    var wvmBody = document.getElementById('wvmBody');
    var wvmTopbar = document.querySelector('.wvm-topbar');
    if (wvmBody && wvmTopbar) {
      wvmTopbar.classList.remove('hidden');
      wvmBody.scrollTop = 0;
      wvmBody._topbarScrollHandler = function() {
        if (wvmBody.scrollTop > 10) {
          wvmTopbar.classList.add('hidden');
        } else {
          wvmTopbar.classList.remove('hidden');
        }
      };
      wvmBody.removeEventListener('scroll', wvmBody._topbarScrollHandler);
      wvmBody.addEventListener('scroll', wvmBody._topbarScrollHandler, { passive: true });
    }
  }
  window.subscribeChannels = subscribeChannels;
  window.playLiveTv        = playLiveTv;
  function formatTime(sec) {
    if (!sec || isNaN(sec) || !isFinite(sec)) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function updatePlayerUI() {
    var mp3     = CT.track && (CT.track.type === 'mp3' || CT.track.type === 'podcast_ep');
    var radio   = CT.track && CT.track.type === 'radio';
    // full player title/artwork — track change হলে সাথে সাথে update
    if (CT.track) {
      if (fpArtwork && fpArtwork.src !== (CT.track.img || '')) fpArtwork.src = CT.track.img || '';
      if (fpName && fpName.textContent !== (CT.track.name || '—')) fpName.textContent = CT.track.name || '—';
      if (fpGenre) { var _desc = CT.track.desc || CT.track.genre || ''; if (fpGenre.textContent !== _desc) fpGenre.textContent = _desc; }
    }
    // mini thumb
    var thumb = document.getElementById('miniThumb');
    if (thumb) {
      var img = CT.track && CT.track.img;
      thumb.style.backgroundImage = img ? 'url(' + img + ')' : 'none';
    }
    // mini status — শুধু সময় / LIVE badge, count নেই
    var statusEl = document.getElementById('miniStatus');
    if (statusEl) {
      if (mp3) {
        var cur = formatTime(CT.audioEl.currentTime);
        var dur = formatTime(CT.audioEl.duration);
        statusEl.innerHTML = cur + ' / ' + dur;
      } else {
        statusEl.innerHTML = '<span class="live-dot"></span>LIVE';
      }
    }
    // full player progress
    var pw   = document.getElementById('fpProgressWrap');
    var lb   = document.getElementById('fpLiveBadge');
    var fill = document.getElementById('fpProgressFill');
    var ct   = document.getElementById('fpCurrentTime');
    var dt   = document.getElementById('fpDuration');
    // fullPlayer mp3-mode class
    var fp = document.getElementById('miniPlayer');
    if (fp) fp.classList.toggle('mp3-mode', !!mp3);
    if (lb) lb.style.display = mp3 ? 'none' : '';
    var _fpPb = document.getElementById('fpProgressBar');
    var _fpFl = document.getElementById('fpProgressFill');
    if (mp3 && fill) {
      var el = CT.audioEl;
      var pct = el.duration > 0 ? (el.currentTime / el.duration) * 100 : 0;
      fill.style.width = pct + '%'; fill.style.opacity = '1';
      if (_fpPb) { _fpPb.style.setProperty('--prog', pct+'%'); _fpPb.style.cursor='pointer'; _fpPb.onclick=function(e){seekAudio(e);}; }
      if (ct) ct.textContent = formatTime(el.currentTime);
      if (dt) dt.textContent = formatTime(el.duration);
    } else if (!mp3) {
      var _elapsed = liveStartTime ? Math.floor((Date.now()-liveStartTime)/1000) : 0;
      if (ct) ct.textContent = formatTime(_elapsed);
      if (dt) dt.textContent = 'LIVE';
      var _el=CT.audioEl, _bs=0, _be=0;
      if (_el.buffered && _el.buffered.length>0){_bs=_el.buffered.start(0);_be=_el.buffered.end(_el.buffered.length-1);}
      var _bd=_be-_bs;
      var _pct=_bd>0?Math.min(100,((_el.currentTime-_bs)/_bd)*100):100;
      if (_fpFl){_fpFl.style.width=_pct+'%';_fpFl.style.opacity='1';}
      if (_fpPb){_fpPb.style.setProperty('--prog',_pct+'%');_fpPb.style.cursor=_bd>1?'pointer':'default';_fpPb.onclick=_bd>1?function(e){seekLive(e);}:null;}
    }
    // full player — play count (mp3)
    // full player — radio live count
    var fplc = document.getElementById('fpLiveCount');
    if (fplc) {
      if (radio) {
        var onlineEl = document.getElementById('visOnline');
        var onlineTxt = onlineEl ? onlineEl.textContent : '0';
        if (!onlineTxt || onlineTxt === '—') onlineTxt = '0';
        fplc.innerHTML = onlineTxt + ' listening now';
        fplc.style.display = 'none';
      } else {
        fplc.textContent = '';
        fplc.style.display = 'none';
      }
    }
    // skip buttons — সব সময় দেখাবে
  }
  function seekLive(e) {
    var el=CT.audioEl;
    if(!el.buffered||el.buffered.length===0)return;
    var bs=el.buffered.start(0),be=el.buffered.end(el.buffered.length-1),bd=be-bs;
    if(bd<=0)return;
    var bar=document.getElementById('fpProgressBar'),rect=bar.getBoundingClientRect();
    el.currentTime=Math.min(bs+Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width))*bd,be-0.3);
  }
  function seekAudio(e) {
    if (!CT.audioEl.duration) return;
    var bar  = document.getElementById('fpProgressBar');
    var rect = bar.getBoundingClientRect();
    CT.audioEl.currentTime = ((e.clientX - rect.left) / rect.width) * CT.audioEl.duration;
  }
  function startTimeTracking() {
    if (timeInterval) clearInterval(timeInterval);
    timeInterval = setInterval(updatePlayerUI, 500);
  }
  function stopTimeTracking() {
    if (timeInterval) { clearInterval(timeInterval); timeInterval = null; }
    liveStartTime = null;
    updatePlayerUI();
  }
  function fpSkipPrev() {
    if (!CT.track) return;
    var type = CT.track.type;
    if (type === 'radio') {
      skipStation(-1);
    } else if (type === 'mp3') {
      var avail = musicCards.filter(function(c) { return c.url; });
      var idx = avail.findIndex(function(c) { return c.id === CT.track.id; });
      var prev = avail[(idx - 1 + avail.length) % avail.length];
      if (prev) handleMusicCardPlay(prev.id);
    } else if (type === 'podcast_ep') {
      var list = (_pepCurrentEps && _pepCurrentEps.length) ? _pepCurrentEps : _podcastEps;
      var idx = list.findIndex(function(e) { return e._key === CT.track.id; });
      if (idx < 0) return;
      var newIdx = (idx - 1 + list.length) % list.length;
      _pepCurrentIdx = newIdx;
      pepPlayEp(newIdx);
    }
  }
  function fpSkipNext() {
    if (!CT.track) return;
    var type = CT.track.type;
    if (type === 'radio') {
      skipStation(1);
    } else if (type === 'mp3') {
      var avail = musicCards.filter(function(c) { return c.url; });
      var idx = avail.findIndex(function(c) { return c.id === CT.track.id; });
      var next = avail[(idx + 1) % avail.length];
      if (next) handleMusicCardPlay(next.id);
    } else if (type === 'podcast_ep') {
      var list = (_pepCurrentEps && _pepCurrentEps.length) ? _pepCurrentEps : _podcastEps;
      var idx = list.findIndex(function(e) { return e._key === CT.track.id; });
      if (idx < 0) return;
      var newIdx = (idx + 1) % list.length;
      _pepCurrentIdx = newIdx;
      pepPlayEp(newIdx);
    }
  }
  window.fpSkipPrev  = fpSkipPrev;
  window.fpSkipNext  = fpSkipNext;
  window.skipStation = skipStation;
  /* ── PWA INSTALL ── */
  // ── Stream error overlay (manual retry only) ──
  function _showStreamError(playerWrap, url, vid) {
    // HLS instance destroy করো
    if (playerWrap._hls) { try { playerWrap._hls.destroy(); } catch(e) {} playerWrap._hls = null; }
    // overlay দেখাও
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#000;color:#fff;font-family:DM Sans,sans-serif;';
    overlay.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" width="44" height="44" style="opacity:0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
      + '<div style="font-size:0.95rem;opacity:0.8;">Stream unavailable</div>'
      + '<button style="margin-top:4px;background:none;border:1.5px solid rgba(255,255,255,0.3);border-radius:20px;padding:7px 22px;color:#fff;font-family:DM Sans,sans-serif;font-size:0.82rem;cursor:pointer;">Retry</button>';
    var btn = overlay.querySelector('button');
    btn.onclick = function() {
      // overlay সরাও, HLS reload করো — view count বাড়বে না
      overlay.remove();
      if (window.Hls && Hls.isSupported()) {
        var hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          highBufferWatchdogPeriod: 2,
          nudgeMaxRetry: 5,
          startLevel: -1,
          abrEwmaFastLive: 3.0,
          abrEwmaSlowLive: 9.0,
          liveSyncDurationCount: 2,
          liveMaxLatencyDurationCount: 4
        });
        hls.loadSource(url);
        hls.attachMedia(vid);
        hls.on(Hls.Events.MANIFEST_PARSED, function() { vid.play().catch(function(){}); });
        hls.on(Hls.Events.ERROR, function(evt, data) {
          if (data.fatal) {
            clearTimeout(playerWrap._hlsErrTimer);
            playerWrap._hlsErrTimer = setTimeout(function() {
              if (vid.paused && vid.readyState < 2) _showStreamError(playerWrap, url, vid);
            }, 3000);
          }
        });
        playerWrap._hls = hls;
      } else {
        vid.src = url;
        vid.load();
        vid.play().catch(function(){});
      }
    };
    playerWrap.appendChild(overlay);
  }
  // ── Image error fallback ──
  function imgLoad(el) { var p = el.parentElement; if (p) p.classList.add('loaded'); }
  window.imgLoad = imgLoad;
  function imgErr(el) {
    el.style.display = 'none';
    var p = el.parentElement;
    if (p) p.classList.add('loaded');
    if (!p || p.querySelector('._img-fallback')) return;
    var fb = document.createElement('div');
    fb.className = '_img-fallback';
    fb.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--border,#2a2a2a);';
    fb.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="28" height="28" style="opacity:0.3;color:var(--muted,#888)"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
    if (getComputedStyle(p).position === 'static') p.style.position = 'relative';
    p.appendChild(fb);
  }
  window.imgErr = imgErr;
  // ── Debounce utility ──
  function debounce(fn, ms) {
    var t;
    return function() {
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function() { fn.apply(null, args); }, ms);
    };
  }
  // Browser scroll restoration বন্ধ করো — otherwise scroll করলে implicit history entries জমে
  // Android back key তে বেশি বার চাপতে হয় সেই কারণে
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function safeHistoryPush(state, title, hash) {
    try { history.pushState(state, title, hash); } catch(e) {}
  }
  function safeHistoryReplace(state, title, hash) {
    try { history.replaceState(state, title, hash); } catch(e) {}
  }
  // back/forward button
  window.addEventListener('popstate', function(e) {
    // Header search open থাকলে back = search box বন্ধ করো
    var expand = document.getElementById('headerSearchExpand');
    if (expand && expand.classList.contains('open')) {
      closeHeaderSearch();
      return;
    }
    // Sidebar open থাকলে back = sidebar বন্ধ করো
    var sb = document.getElementById('sidebar');
    if (sb && sb.classList.contains('open')) {
      closeSidebar(true);
      return;
    }
    // Full player open থাকলে back = full player বন্ধ করো
    if (document.body.classList.contains('fp-open')) {
      closeFullPlayer();
      return;
    }
    // Reels modal open থাকলেই close করো — stale history entries ignore
    var _reelsModal = document.getElementById('reelsModal');
    if (_reelsModal && _reelsModal.classList.contains('open')) {
      closeReelsModal(true);
      return;
    }
    // Reels এর stale hash entry — modal বন্ধ, শুধু skip করো
    if (e.state && e.state.modal === 'reels') return;

    var state = e.state;
    if (!state) return;
    if (state.type === 'tab') {
      // saved videos / bookmarked eps modal খোলা থাকলে বন্ধ করো
      var svModal = document.getElementById('savedVideosModal');
      if (svModal && svModal.classList.contains('open')) { closeSavedVideosModal(true); return; }
      var beModal = document.getElementById('bookmarkedEpsModal');
      if (beModal && beModal.style.display === 'flex') { closeBookmarkedEpsModal(true); return; }
      // history modal খোলা থাকলে বন্ধ করো
      // live tv modal খোলা থাকলে বন্ধ করো
      var ltvModal = document.getElementById('liveTvModal');
      if (ltvModal && ltvModal.classList.contains('open')) {
        closeLiveTvModal(true);
        return;
      }
      // sports modal খোলা থাকলে বন্ধ করো
      var sportsModal = document.getElementById('sportsModal');
      if (sportsModal && sportsModal.classList.contains('open')) {
        closeSportsModal(true);
        return;
      }
      // search modal খোলা থাকলে বন্ধ করো
      var sm = document.getElementById('searchModal');
      if (sm && sm.classList.contains('open')) {
        closeSearchModal(false);
        return;
      }
      // watch video modal খোলা থাকলে বন্ধ করো
      if (document.getElementById('watchVideoModal').classList.contains('open')) {
        var _vidCameFromCat = !!(e.state && e.state.fromWatchCat) || document.getElementById('watchCatModal').classList.contains('open');
        closeWatchModal(true, _vidCameFromCat);
        return;
      }
      // watch cat modal খোলা থাকলে বন্ধ করো
      if (document.getElementById('watchCatModal').classList.contains('open')) {
        closeWatchCatModal(true);
        return;
      }
      // podcast cat modal খোলা থাকলে বন্ধ করো
      if (document.getElementById('podcastEpModal').classList.contains('open')) {
        closePodcastEpModal(true);
        return;
      }
      // all stations modal খোলা থাকলে বন্ধ করো
      var asModal = document.getElementById('allStationsModal');
      if (asModal && asModal.classList.contains('open')) {
        closeAllStationsModal(true);
        return;
      }
      // browse all categories modal খোলা থাকলে বন্ধ করো
      var bcaModal = document.getElementById('browseCatsAllModal');
      if (bcaModal && bcaModal.classList.contains('open')) {
        closeBrowseCatsAllModal(true);
        return;
      }
      // all artists modal খোলা থাকলে বন্ধ করো
      var aaModal = document.getElementById('allArtistsModal');
      if (aaModal && aaModal.classList.contains('open')) {
        closeAllArtistsModal(true);
        return;
      }
      // artist ep modal খোলা থাকলে বন্ধ করো
      var aepModal = document.getElementById('artistEpModal');
      if (aepModal && aepModal.classList.contains('open')) {
        closeArtistEpModal(true);
        return;
      }
      // watch all artists modal খোলা থাকলে বন্ধ করো
      var awaModal = document.getElementById('allWatchArtistsModal');
      if (awaModal && awaModal.classList.contains('open')) {
        closeAllWatchArtistsModal(true);
        return;
      }
      // watch artist vid modal খোলা থাকলে বন্ধ করো
      var wavModal = document.getElementById('watchArtistVidModal');
      if (wavModal && wavModal.classList.contains('open')) {
        closeWatchArtistVidModal(true);
        return;
      }
      switchTab(state.tab, true);
    } else if (state.type === 'modal') {
      _closingFromPopstate = true;
      if (state.modal === 'search')         closeSearchModal(false);
      if (state.modal === 'cat')             closePodcastEpModal(true);
      if (state.modal === 'savedvideos')     closeSavedVideosModal(true);
      if (state.modal === 'bookmarkedeps')   closeBookmarkedEpsModal(true);
      if (state.modal === 'watchcat') {
        // watchVideoModal open থাকলে সেটাকে আগে close করো এবং watchcat restore করো
        if (document.getElementById('watchVideoModal').classList.contains('open')) {
          closeWatchModal(true, true);
        } else {
          closeWatchCatModal(true);
        }
      }
      if (state.modal === 'livetv')       closeLiveTvModal(true);
      if (state.modal === 'sports_modal') closeSportsModal(true);
      if (state.modal === 'reels')        closeReelsModal(true);
      if (state.modal === 'allstations')  closeAllStationsModal(true);
      if (state.modal === 'browsecatsall') closeBrowseCatsAllModal(true);

      if (state.modal === 'listenbrowseall') closeListenBrowseAllModal(true);
      if (state.modal === 'artistep')        closeArtistEpModal(true);
      if (state.modal === 'allartists')      closeAllArtistsModal(true);
      if (state.modal === 'allwatchartists') closeAllWatchArtistsModal(true);
      if (state.modal === 'watchartistvid')  closeWatchArtistVidModal(true);
      if (state.modal === 'tvchannel') {
        closeWatchModal(true, false);
      }
      if (state.modal === 'watchvideo') {
        closeWatchModal(true, !!state.fromWatchCat);
        var ltvEl = document.getElementById('liveTvModal');
        if (ltvEl && ltvEl.classList.contains('open')) {
          document.body.classList.add('watch-open');
          lockBodyScroll();
        }
      }
      _closingFromPopstate = false;
    }
  });
  // page load এ hash দেখে সঠিক tab খোলো + ep/st/cat auto-play/open
  (function() {
    var hash = window.location.hash.replace('#', '');
    if (hash.startsWith('v_') || hash.startsWith('cat_') || hash.startsWith('c_')) {
      window._pendingHash = hash;
      switchTab('watch', true);
      safeHistoryReplace({ type: 'tab', tab: 'watch' }, '', '#' + hash);
    } else if (hash.startsWith('ep_') || hash.startsWith('s_')) {
      window._pendingHash = hash;
      var targetTab = 'podcast';
      switchTab(targetTab, true);
      safeHistoryReplace({ type: 'tab', tab: targetTab }, '', '#' + hash);
    } else if (hash === 'explore') {
      switchTab('explore', true);
      safeHistoryReplace({ type: 'tab', tab: 'explore' }, '', '#explore');
    } else if (hash && !['watch','fm','podcast','listen','reels'].includes(hash)) {
      // unknown hash — watch tab এ যাও
      window._pendingHash = hash;
      switchTab('watch', true);
      safeHistoryReplace({ type: 'tab', tab: 'watch' }, '', '#' + hash);
    } else {
      var tabMap = { 'fm': 'podcast', 'listen': 'podcast', 'watch': 'watch', 'explore': 'explore' };
      var tab = tabMap[hash] || 'watch';
      var displayHash = tab === 'podcast' ? 'listen' : tab;
      switchTab(tab, true);
      safeHistoryReplace({ type: 'tab', tab: tab }, '', '#' + displayHash);
    }
  })();
  // data load হলে pending hash handle করে
  window._handlePendingHash = function() {
    var hash = window._pendingHash;
    if (!hash) return;
    if (hash.startsWith('ep_')) {
      var targetId = hash;
      if (!_podcastEps || !_podcastEps.length) return;
      var ep = _podcastEps.find(function(e) { return e._key === targetId; });
      if (!ep) return;
      window._pendingHash = null;
      var cat = _podcastCats && _podcastCats.find(function(c) { return c._key === ep.category; });
      _pepCurrentCat = cat || null;
      var eps = cat ? _podcastEps.filter(function(e){ return e.category === cat._key; }) : [ep];
      eps.sort(function(a,b){ return (parseInt(b.id)||0)-(parseInt(a.id)||0); });
      _pepCurrentEps = eps;
      var idx = _pepCurrentEps.findIndex(function(e) { return e._key === targetId; });
      pepPlayEp(idx >= 0 ? idx : 0);
    } else if (hash.startsWith('s_')) {
      if (!stations || !stations.length) return;
      var st = stations.find(function(s) { return s._key === hash; });
      if (!st) return;
      window._pendingHash = null;
      startStation(st);
    } else if (hash.startsWith('v_')) {
      if (!_watchVideos || !_watchVideos.length) return;
      var vid = _watchVideos.find(function(v) { return v._key === hash; });
      if (!vid) return;
      window._pendingHash = null;
      openWatchVideo(hash);
    } else if (hash.startsWith('c_')) {
      if (!_liveChannels || !_liveChannels.length) return;
      var ch = _liveChannels.find(function(c) { return c._key === hash; });
      if (!ch) return;
      window._pendingHash = null;
      playLiveTv(hash);
    } else if (hash.startsWith('cat_')) {
      // watch category কিনা check করো আগে
      if (typeof _watchCats !== 'undefined' && _watchCats.length) {
        var wCat = _watchCats.find(function(c) { return c._key === hash; });
        if (wCat) {
          window._pendingHash = null;
          openWatchCatModal(hash, true);
          return;
        }
      }
      // podcast category
      if (!_podcastCats || !_podcastCats.length) return;
      var cat2 = _podcastCats.find(function(c) { return c._key === hash; });
      if (!cat2) return;
      window._pendingHash = null;
      openPodcastEpModal(hash);
    }
  };
  // ── SWIPE TO CLOSE — handle bar থেকে ──
  // ── PODCAST CATEGORIES & EPISODES ──
  var _podcastCats = [];
  var _podcastEps  = [];
  var _podcastCatEpCount = {}; // category key → episode count (pre-computed)
  var _pepCurrentCat = null;
  var _pepCurrentEps = [];
  var _pepCurrentIdx = 0;
  function subscribePodcasts() {
    var db  = window._fbDb;
    var ref = window._fbRef;
    if (!db || !ref) return;
    // categories
    var _lastPodcastCatSig = '';
    window._fbOnValue(ref(db, 'podcasts'), function(snap) {
      var sig = '';
      snap.forEach(function(child) {
        var d = child.val();
        sig += child.key + ':' + (d.title||'') + ':' + (d.id||'') + ':' + (d.img||'') + '|';
      });
      if (sig === _lastPodcastCatSig) { if (window._handlePendingHash) window._handlePendingHash(); return; }
      _lastPodcastCatSig = sig;
      _podcastCats = [];
      snap.forEach(function(child) {
        _podcastCats.push(Object.assign({ _key: child.key }, child.val()));
      });
      _podcastCats.sort(function(a,b){ return (parseInt(a.id)||0)-(parseInt(b.id)||0); });
      renderPodcastCategories();
      batchCacheThumbs(_podcastCats.map(function(c){ return c.img; }).filter(Boolean));
      if (window._handlePendingHash) window._handlePendingHash();
    });
    // episodes
    var _lastEpSig = '';
    window._fbOnValue(ref(db, 'podcast_episodes'), function(snap) {
      if (window._markLoaded) window._markLoaded('episodes');
      var lph = document.getElementById('listenPlaceholder');
      if (lph) lph.style.display = 'none';
      // plays বাদ দিয়ে fingerprint
      var sig = '';
      snap.forEach(function(child) {
        var d = child.val();
        sig += child.key + ':' + (d.title||'') + ':' + (d.id||'') + ':' + (d.url||'') + ':' + (d.img||'') + '|';
      });
      var needsRender = sig !== _lastEpSig;
      _lastEpSig = sig;
      _podcastEps = [];
      snap.forEach(function(child) {
        _podcastEps.push(Object.assign({ _key: child.key }, child.val()));
      });
      _podcastEps.sort(function(a,b){ return (parseInt(b.id)||0)-(parseInt(a.id)||0); });
      // episode count per category pre-compute
      _podcastCatEpCount = {};
      _podcastEps.forEach(function(e) {
        if (e.category) _podcastCatEpCount[e.category] = (_podcastCatEpCount[e.category] || 0) + 1;
      });
      if (needsRender) {
        renderPodcastCategories();
        renderPcRecentEpisodes();
        renderLatestEpisodes();
        if (typeof renderPodcastCatEpSections === 'function') renderPodcastCatEpSections();
        batchCacheThumbs(_podcastEps.map(function(e){ return e.img; }).filter(Boolean));
      }
      if (window._handlePendingHash) window._handlePendingHash();
      // modal open থাকলে refresh
      if (needsRender && _pepCurrentCat) {
        var eps = _podcastEps.filter(function(e){ return e.category === _pepCurrentCat._key; });
        eps.sort(function(a,b){ return (parseInt(b.id)||0)-(parseInt(a.id)||0); });
        _pepCurrentEps = eps;
        // active tag filter বজায় রাখো
        if (_pepActiveTag && _pepActiveTag !== 'all') {
          _pepFilteredEps = eps.filter(function(e) {
            if (!e.seo) return false;
            return e.seo.split(',').map(function(t){ return t.trim(); }).indexOf(_pepActiveTag) !== -1;
          });
        } else {
          _pepFilteredEps = eps;
        }
        var listEl = document.getElementById('pepList');
        if (listEl) listEl.innerHTML = '';
        pepDestroyObserver();
        pepRenderList();
      }
    });
  }
  var _pcCurrentFilter = 'all';
  function pcSetFilter(filter, btn) {
    _pcCurrentFilter = filter;
    // pill active state
    document.querySelectorAll('.pc-filter-pill').forEach(function(p){ p.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    // label text
    var labelEl = document.getElementById('allPodcastsLabel');
    if (labelEl) {
      var labels = { all: 'All Podcasts', recent: 'Recently Added', popular: 'Popular', az: 'A → Z' };
      labelEl.querySelector('span').textContent = labels[filter] || 'All Podcasts';
    }
    renderPodcastCategories();
  }
  var _latestEpActivePill = 'latest';
  function renderLatestEpisodes() {
    var section  = document.getElementById('latestEpSection');
    var pillBar  = document.getElementById('latestEpPillBar');
    var list     = document.getElementById('latestEpList');
    if (!section || !list) return;
    if (!_podcastEps || !_podcastEps.length) { section.style.display = 'none'; return; }
    section.style.display = '';
    if (pillBar) {
      var hasUpcomingEp = (_podcastEps || []).some(function(e){ return e.featured === true && !e.url; });
      var pills = [{ key: 'latest', title: 'Latest Audios' }, { key: 'trending', title: 'Trending' }, { key: 'featured', title: 'Featured' }];
      if (hasUpcomingEp) pills.push({ key: 'upcoming', title: 'Upcoming' });
      pills.push({ key: 'top', title: 'Top' });
      pills.push({ key: 'random', title: 'Random' });
      pills.push({ key: 'listened', title: 'Recently Listened' });
      pillBar.innerHTML = pills.map(function(p) {
        var active = (_latestEpActivePill === p.key) ? ' active' : '';
        return '<div class="rankings-pill' + active + '" onclick="latestEpPillSelect(\'' + p.key + '\')">' + p.title + '</div>';
      }).join('');
    }
    renderLatestEpCards();
    if (typeof renderPodcastCatEpSections === 'function') renderPodcastCatEpSections();
    renderListenBrowseCats();
    renderListenBrowseArtists();
    buildListenForYouFeed();
  }
  function latestEpPillSelect(key) {
    _latestEpActivePill = key;
    var pillBar = document.getElementById('latestEpPillBar');
    if (pillBar) {
      pillBar.querySelectorAll('.rankings-pill').forEach(function(el) {
        var matchTitle = key === 'latest' ? 'Latest Audios' : key === 'trending' ? 'Trending' : key === 'featured' ? 'Featured' : key === 'upcoming' ? 'Upcoming' : key === 'top' ? 'Top' : key === 'random' ? 'Random' : key === 'listened' ? 'Recently Listened' : ((_podcastCats||[]).find(function(c){ return c._key === key; }) || {}).title || key;
        el.classList.toggle('active', el.textContent.trim() === matchTitle);
      });
    }
    renderLatestEpCards();
  }
  window.latestEpPillSelect = latestEpPillSelect;
  function renderLatestEpCards() {
    var list = document.getElementById('latestEpList');
    if (!list) return;
    var allEps;
    if (_latestEpActivePill === 'latest') {
      allEps = (_podcastEps || []).slice(0, 20);
    } else if (_latestEpActivePill === 'trending') {
      allEps = (_podcastEps || []).slice().sort(function(a,b){ return (parseInt(b.weekly_plays)||0)-(parseInt(a.weekly_plays)||0); });
    } else if (_latestEpActivePill === 'featured') {
      allEps = (_podcastEps || []).filter(function(e){ return e.featured === true && e.url; });
    } else if (_latestEpActivePill === 'upcoming') {
      allEps = (_podcastEps || []).filter(function(e){ return e.featured === true && !e.url; });
    } else if (_latestEpActivePill === 'top') {
      allEps = (_podcastEps || []).slice().sort(function(a,b){
        var scoreA = (parseInt(a.plays)||0) + (a.likes && a.likes.count ? parseInt(a.likes.count)||0 : 0);
        var scoreB = (parseInt(b.plays)||0) + (b.likes && b.likes.count ? parseInt(b.likes.count)||0 : 0);
        return scoreB - scoreA;
      });
    } else if (_latestEpActivePill === 'random') {
      allEps = (_podcastEps || []).slice().sort(function(){ return Math.random() - 0.5; });
    } else if (_latestEpActivePill === 'listened') {
      var _epHistKeys = (typeof _historyEpisode !== 'undefined' ? _historyEpisode : []).map(function(h){ return h._key; });
      allEps = _epHistKeys.map(function(k){ return (_podcastEps||[]).find(function(e){ return e._key === k; }); }).filter(Boolean);
    } else {
      allEps = (_podcastEps || []).filter(function(e){ return e.category === _latestEpActivePill; });
    }
    var eps = allEps.slice(0, 9);
    if (!eps.length) { list.innerHTML = '<div style="padding:16px;color:var(--muted);font-family:\'Plus Jakarta Sans\',sans-serif;font-size:0.8rem;">\u0995\u09cb\u09a8\u09cb \u098f\u09aa\u09bf\u09b8\u09cb\u09a1 \u09a8\u09c7\u0987</div>'; return; }
    var cards = eps.map(function(ep, i) {
      if (typeof pepBuildRow !== 'function') return '';
      var card = pepBuildRow(ep, i, 'pcEpPillPlay(\'' + ep._key + '\')');
      var badge = '<div class="rankings-rank-badge">' + (i + 1) + '</div>';
      return card.replace('<div class="pep-ep-thumb">', '<div class="pep-ep-thumb" style="position:relative;">' + badge);
    }).join('');
    var moreCard = '';
    list.innerHTML = cards + moreCard;
  }
  function renderPodcastCatEpSections() {
    var container = document.getElementById('podcastCatEpSections');
    if (!container) return;
    if (!_podcastCats || !_podcastCats.length || !_podcastEps || !_podcastEps.length) {
      container.innerHTML = ''; return;
    }
    // শুধু id 1-10 এর categories, ছোট থেকে বড় id অনুসারে
    var filteredPodCats = _podcastCats
      .filter(function(c) { var n = parseInt(c.id); return n >= 1 && n <= 10; })
      .sort(function(a, b) { return (parseInt(a.id)||0) - (parseInt(b.id)||0); });
    container.innerHTML = filteredPodCats.map(function(cat, catIdx) {
      var eps = _podcastEps
        .filter(function(e) { return e.category === cat._key; })
        .slice(0, 6);
      if (!eps.length) return '';
      var cards = eps.map(function(ep, i) {
        return typeof pepBuildRowList === 'function'
          ? pepBuildRowList(ep, i, 'pcEpPillPlay(\'' + ep._key + '\''+')')
          : '';
      }).join('');
      var tintIdx = catIdx % 6;
      var fadeDelay = (catIdx * 0.07).toFixed(2);
      return '<div class="listen-cat-section cat-tint-' + tintIdx + '" style="animation-delay:' + fadeDelay + 's">'
        + '<div class="cat-section-content">'
        + '<div class="cat-section-header" style="cursor:pointer;" onclick="openPodcastEpModal(\'' + cat._key + '\')">'
        + '<div class="cat-section-title">' + (cat.title || cat._key) + '</div>'
        + '<a class="section-see-all" onclick="event.stopPropagation();openPodcastEpModal(\'' + cat._key + '\')" >See All ›</a>'
        + '</div>'
        + '<div class="listen-cat-horiz">' + cards + '</div>'
        + '</div>'
        + '</div>';
    }).join('');
  }
  window.renderPodcastCatEpSections = renderPodcastCatEpSections;
  function renderPcRecentEpisodes() {
    var section = document.getElementById('pcRecentEpSection');
    var scroll  = document.getElementById('pcRecentEpScroll');
    if (!section || !scroll) return;
    if (!_podcastEps || _podcastEps.length === 0) {
      section.style.display = 'none';
      return;
    }
    var latest = _podcastEps.slice().reverse().slice(0, 8);
    section.style.display = 'block';
    var pcrl = document.getElementById('pcRecentLabel');
    if (pcrl) pcrl.style.display = 'flex';
    scroll.innerHTML = latest.map(function(ep) {
      var isActive = (typeof currentActiveId !== 'undefined' && currentActiveId === ep._key && typeof isPlaying !== 'undefined' && isPlaying);
      var imgHtml = ep.img
        ? '<div class="pc-ep-pill-img"><img src="' + ep.img + '" alt="" onload="imgLoad(this)" onerror="imgErr(this)"></div>'
        : '<div class="pc-ep-pill-img">🎵</div>';
      return '<div class="pc-ep-pill' + (isActive ? ' playing' : '') + '" onclick="pcEpPillPlay(\'' + ep._key + '\')">'
        + imgHtml
        + '<span class="pc-ep-pill-name">' + (ep.title || '') + '</span>'
        + '</div>';
    }).join('');
  }
  function pcEpPillPlay(key) {
    var ep = _podcastEps.find(function(e){ return e._key === key; });
    if (!ep || !ep.url) return;
    if (typeof addEpisodeHistory === 'function') addEpisodeHistory(ep);
    // একই episode আবার tap করলে pause/resume
    if (currentActiveId === ep._key) {
      if (typeof toggleMiniPlay === 'function') toggleMiniPlay();
      return;
    }
    // next/prev এর জন্য _pepCurrentEps সেট করো same category থেকে
    var cat = _podcastCats && _podcastCats.find(function(c){ return c._key === ep.category; });
    _pepCurrentCat = cat || null;
    var eps = cat ? _podcastEps.filter(function(e){ return e.category === cat._key; }) : _podcastEps.slice();
    eps.sort(function(a,b){ return (parseInt(b.id)||0)-(parseInt(a.id)||0); });
    _pepCurrentEps = eps;
    _pepCurrentIdx = _pepCurrentEps.findIndex(function(e){ return e._key === key; });
    var audio = document.getElementById('mainAudio');
    if (!audio) return;
    if (typeof CT !== 'undefined') {
      CT.track = { id: ep._key, type: 'podcast_ep', url: ep.url, name: ep.title || '', img: ep.img || '', genre: (cat && cat.title) || '', desc: ep.desc || '' };
    }
    history.replaceState(history.state, '', '#' + ep._key);
    // global state update
    currentActiveId = ep._key;
    isPlaying = true;
    audio._lastSaved = null;
    playEpWithCache(audio, ep.url, function() { audio.play().catch(function(){}); });
    var mn = document.getElementById('miniName');
    var ms = document.getElementById('miniStatus');
    if (mn) mn.textContent = ep.title || '—';
    if (ms) ms.innerHTML = ep.desc ? '<span style="opacity:0.7;font-size:0.72rem">'+ep.desc+'</span>' : '';
    var mp = document.getElementById('miniPlayer');
    if (mp) { mp.classList.add('visible', 'playing-state'); }
    if (typeof updatePlayerUI === 'function') updatePlayerUI();
    if (typeof syncUI === 'function') syncUI();
    if (typeof updateMediaSession === 'function') updateMediaSession({ name: ep.title || '', img: ep.img || '', genre: '' });
    if (typeof _playCountStart === 'function') _playCountStart();
    renderPcRecentEpisodes();
    // station cards deactivate
    document.querySelectorAll('.radio-card').forEach(function(c) {
      c.classList.remove('active', 'loading');
    });
    // active state — DOM direct update
    var activeRow = document.getElementById('peprow-' + key);
    if (activeRow) activeRow.classList.add('active');
  }
  function renderPodcastCategories() {
    var container = document.getElementById('podcastCategoryList');
    if (!container) return;
    if (_podcastCats.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:60px 0;color:var(--muted);font-family:DM Sans,sans-serif;font-size:0.9rem;">No podcasts yet</div>';
      return;
    }
    var cats = _podcastCats.slice();
    if (_pcCurrentFilter === 'recent') {
      cats = cats.slice().reverse();
    } else if (_pcCurrentFilter === 'popular') {
      cats = cats.slice().sort(function(a, b) {
        var ae = _podcastEps.filter(function(e){ return e.category === a._key; }).length;
        var be = _podcastEps.filter(function(e){ return e.category === b._key; }).length;
        return be - ae;
      });
    } else if (_pcCurrentFilter === 'az') {
      cats = cats.slice().sort(function(a, b){ return (a.title||'').localeCompare(b.title||''); });
    }
    var apl = document.getElementById('allPodcastsLabel');
    if (apl) apl.style.display = 'flex';
    var cards = cats.map(function(cat) {
      var thumbHtml = cat.img
        ? '<img src="' + cat.img + '" alt="' + (cat.title||'') + '" onload="imgLoad(this)" onerror="imgErr(this)">'
        : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a1a2e,#16213e);font-size:1.4rem;">🎙️</div>';
      return '<div class="pc-card" ontouchstart="this.classList.add(\'active-cat\')" ontouchend="this.classList.remove(\'active-cat\')" ontouchcancel="this.classList.remove(\'active-cat\')" onclick="openPodcastEpModal(\'' + cat._key + '\')">'
        + '<div class="pc-card-thumb">' + thumbHtml + '</div>'
        + '<div class="pc-card-title">' + (cat.title || '') + '</div>'
        + '</div>';
    }).join('');
    container.innerHTML = '<div class="pc-horiz-row pc-cat-grid" id="podcastCatRow">' + cards + '</div>';
  }
  var _pepActiveTag = 'all';
  var _pepActiveSort = 'latest';
  var _pepFilteredEps = [];
  function _pepSortEps(eps) {
    var sorted = eps.slice();
    if (_pepActiveSort === 'latest') {
      sorted.sort(function(a,b){ return (parseInt(b.id)||0)-(parseInt(a.id)||0); });
    } else if (_pepActiveSort === 'oldest') {
      sorted.sort(function(a,b){ return (parseInt(a.id)||0)-(parseInt(b.id)||0); });
    } else if (_pepActiveSort === 'popular') {
      sorted.sort(function(a,b){ return (parseInt(b.plays)||parseInt(b.views)||0)-(parseInt(a.plays)||parseInt(a.views)||0); });
    }
    return sorted;
  }
  function pepRenderTagBar(eps) {
    var bar = document.getElementById('pepTagBar');
    if (!bar) return;
    var tagCount = {};
    eps.forEach(function(e) {
      if (e.seo) {
        e.seo.split(',').forEach(function(t) {
          var trimmed = t.trim();
          if (trimmed) tagCount[trimmed] = (tagCount[trimmed] || 0) + 1;
        });
      }
    });
    var tags = Object.keys(tagCount).filter(function(t) { return tagCount[t] >= 2; }).sort(function(a, b) { return tagCount[b] - tagCount[a]; });
    var sorts = [['latest','Latest'],['oldest','Oldest'],['popular','Popular']];
    var html = sorts.map(function(s){
      return '<div class="ltv-tag-chip pep-sort-chip' + (s[0] === _pepActiveSort ? ' active' : '') + '" onclick="pepSortSelect(\'' + s[0] + '\')">' + s[1] + '</div>';
    }).join('');
    if (tags.length) {
      html += '<div class="ltv-tag-chip-sep"></div>';
      var active = _pepActiveTag;
      tags.forEach(function(tag) {
        var imgUrl = _listenTagImages[tag];
        var imgHtml = imgUrl ? '<img src="' + imgUrl + '" class="ltv-tag-chip-img" onerror="this.style.display=\'none\'">' : '';
        html += '<div class="ltv-tag-chip' + (active === tag ? ' active' : '') + '" onclick="pepTagSelect(\'' + tag.replace(/\'/g, "\\'"  ) + '\')">'
               + imgHtml + tag + '</div>';
      });
    }
    bar.innerHTML = html;
  }
  function pepSortSelect(sort) {
    _pepActiveSort = sort;
    _pepActiveTag = 'all';
    var bar = document.getElementById('pepTagBar');
    if (bar) {
      bar.querySelectorAll('.pep-sort-chip').forEach(function(el) {
        el.classList.toggle('active', el.textContent.trim().toLowerCase() === sort);
      });
      bar.querySelectorAll('.ltv-tag-chip:not(.pep-sort-chip)').forEach(function(el) {
        el.classList.remove('active');
      });
    }
    _pepFilteredEps = _pepSortEps(_pepCurrentEps);
    pepDestroyObserver();
    var listEl = document.getElementById('pepList');
    if (listEl) listEl.innerHTML = '';
    pepRenderList();
  }
  function pepTagSelect(tag) {
    _pepActiveTag = tag;
    var bar = document.getElementById('pepTagBar');
    if (bar) {
      bar.querySelectorAll('.pep-sort-chip').forEach(function(el) {
        el.classList.remove('active');
      });
      bar.querySelectorAll('.ltv-tag-chip:not(.pep-sort-chip)').forEach(function(el) {
        el.classList.toggle('active', el.textContent.trim() === tag);
      });
    }
    var base = tag === 'all' ? _pepCurrentEps : _pepCurrentEps.filter(function(e) {
      if (!e.seo) return false;
      return e.seo.split(',').map(function(t){ return t.trim(); }).indexOf(tag) !== -1;
    });
    _pepFilteredEps = _pepSortEps(base);
    pepDestroyObserver();
    var listEl = document.getElementById('pepList');
    if (listEl) listEl.innerHTML = '';
    pepRenderList();
  }
  function openPodcastEpModal(catKey) {
    var cat = _podcastCats.find(function(c){ return c._key === catKey; });
    if (!cat) return;
    _pepCurrentCat = cat;
    var eps = _podcastEps.filter(function(e){ return e.category === catKey; });
    eps.sort(function(a,b){ return (parseInt(b.id)||0)-(parseInt(a.id)||0); });
    _pepCurrentEps = eps;
    _pepFilteredEps = _pepSortEps(eps);
    _pepActiveTag = 'all';
    _pepActiveSort = 'latest';
    var titleEl = document.getElementById('pepModalTitle');
    if (titleEl) titleEl.textContent = cat.title || '';
    var pepCoverEl = document.getElementById('pepCover');
    var pepCoverVideoEl = document.getElementById('pepCoverVideo');
    if (pepCoverEl) {
      var hasCover = cat.cover;
      var hasVideo = cat.video;
      pepCoverEl.style.backgroundImage = hasCover ? 'url(' + cat.cover + ')' : '';
      pepCoverEl.classList.toggle('wcat-cover-has-video', !!hasVideo);
      pepCoverEl.style.display = '';
      if (pepCoverVideoEl) {
        if (hasVideo) {
          pepCoverVideoEl.src = cat.video;
          pepCoverVideoEl.style.display = '';
          pepCoverVideoEl.load();
          pepCoverVideoEl.play().catch(function(){});
        } else {
          pepCoverVideoEl.pause();
          pepCoverVideoEl.src = '';
          pepCoverVideoEl.style.display = 'none';
        }
      }
    }
    pepDestroyObserver();
    var pepListEl = document.getElementById('pepList');
    if (pepListEl) pepListEl.innerHTML = '';
    pepRenderTagBar(eps);
    pepRenderList();
    var si = document.getElementById('pepSearchInput');
    if (si) si.value = '';
    window._safeModalSearchClose('pep');
    document.getElementById('podcastEpModal').classList.add('open');
    document.body.classList.add('pepmodal-open');
    lockBodyScroll();
    safeHistoryPush({ type: 'modal', modal: 'cat', catKey: catKey }, '', '#cat_' + catKey);
  }
  function closePodcastEpModal(fromPopstate) {
    pepDestroyObserver();
    var modal = document.getElementById('podcastEpModal');
    var pcv = document.getElementById('pepCoverVideo');
    if (pcv) { pcv.pause(); pcv.src = ''; pcv.style.display = 'none'; }
    closeModalWithAnim(modal, 280, function() {
      document.body.classList.remove('pepmodal-open');
      unlockBodyScroll();
      var pce = document.getElementById('pepCover');
      if (pce) { pce.style.backgroundImage = ''; pce.classList.remove('wcat-cover-has-video'); }
      setTimeout(function(){ _pepCurrentCat = null; }, 350);
    });
    if (!fromPopstate) {
      var curHash = window.location.hash.replace('#', '');
      if (curHash.startsWith('cat_')) {
        history.back();
      }
    }
  }
  function pepBuildRow(ep, i, onclick) {
    var isActive = (typeof currentActiveId !== 'undefined' && currentActiveId === ep._key);
    var isPlayingNow = isActive && (typeof isPlaying !== 'undefined' && isPlaying);
    var thumbHtml = ep.img
      ? '<img src="' + ep.img + '" alt="' + (ep.title||'').replace(/"/g,'') + '" onload="imgLoad(this)" onerror="imgErr(this)">'
      : '<span>&#127925;</span>';
    var playIcon  = '<svg class="ep-play-icon" viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><polygon points="6 3 20 12 6 21 6 3"/></svg>';
    var pauseIcon = '<svg class="ep-pause-icon" viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><rect x="5" y="3" width="4" height="18" rx="1"/><rect x="15" y="3" width="4" height="18" rx="1"/></svg>';
    var rowClass  = 'pep-ep-row' + (isActive ? ' active' : '') + (isActive && !isPlayingNow ? ' paused' : '');
    var metaParts = [];
    if (ep.channel || ep.artist) metaParts.push(ep.channel || ep.artist);
    if (ep.date) metaParts.push(ep.date);
    if (ep.seo) { var seoFirst = ep.seo.split(',')[0].trim(); if (seoFirst) metaParts.push(seoFirst); }
    var metaHtml = metaParts.length ? '<div class="pep-ep-meta">' + metaParts.join(' &middot; ') + '</div>' : '';
    return '<div class="' + rowClass + '" id="peprow-' + ep._key + '" style="animation-delay:' + (i * 40) + 'ms" onclick="' + onclick + '">'
      + '<div class="pep-ep-thumb">'
        + thumbHtml
        + '<div class="pep-ep-eq-overlay"><div class="pep-vlist-eq"><div class="pep-vlist-eq-b"></div><div class="pep-vlist-eq-b"></div><div class="pep-vlist-eq-b"></div><div class="pep-vlist-eq-b"></div></div></div>'
      + '</div>'
      + '<div class="pep-ep-bottom">'
        + '<div class="pep-ep-title">' + (ep.title || '') + '</div>'
        + metaHtml
      + '</div>'
      + '</div>';
  }
  function pepBuildRowList(ep, i, onclick) {
    var isActive = (typeof currentActiveId !== 'undefined' && currentActiveId === ep._key);
    var isPlayingNow = isActive && (typeof isPlaying !== 'undefined' && isPlaying);
    var thumbHtml = ep.img
      ? '<img src="' + ep.img + '" alt="' + (ep.title||'').replace(/"/g,'') + '" onload="imgLoad(this)" onerror="imgErr(this)">'
      : '<span>&#127925;</span>';
    var playIcon  = '<svg class="ep-play-icon" viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><polygon points="6 3 20 12 6 21 6 3"/></svg>';
    var pauseIcon = '<svg class="ep-pause-icon" viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><rect x="5" y="3" width="4" height="18" rx="1"/><rect x="15" y="3" width="4" height="18" rx="1"/></svg>';
    var rowClass  = 'pep-ep-row' + (isActive ? ' active' : '') + (isActive && !isPlayingNow ? ' paused' : '');
    var metaParts = [];
    if (ep.channel || ep.artist) metaParts.push(ep.channel || ep.artist);
    if (ep.date) metaParts.push(ep.date);
    if (ep.seo) { var seoFirst = ep.seo.split(',')[0].trim(); if (seoFirst) metaParts.push(seoFirst); }
    if (ep.plays && parseInt(ep.plays) > 0) { var pc = parseInt(ep.plays); metaParts.push((pc >= 1000000 ? (pc/1000000).toFixed(1)+'M' : pc >= 1000 ? (pc/1000).toFixed(1)+'K' : pc) + ' plays'); }
    var metaHtml = metaParts.length ? '<div class="pep-ep-meta">' + metaParts.join(' &middot; ') + '</div>' : '';
    return '<div class="' + rowClass + '" id="peprow-' + ep._key + '" style="animation-delay:' + (i * 40) + 'ms" onclick="' + onclick + '">'
      + '<div class="pep-ep-thumb">'
        + thumbHtml
        + '<div class="pep-ep-eq-overlay"><div class="pep-vlist-eq"><div class="pep-vlist-eq-b"></div><div class="pep-vlist-eq-b"></div><div class="pep-vlist-eq-b"></div><div class="pep-vlist-eq-b"></div></div></div>'
      + '</div>'
      + '<div class="pep-ep-bottom">'
        + '<div class="pep-ep-title">' + (ep.title || '') + '</div>'
        + metaHtml
      + '</div>'
      + '</div>';
  }
  var _pepInfiniteObserver = null;
  var _pepPageSize = 18;
  var _pepBatchSize = 12;
  function pepDestroyObserver() {
    if (_pepInfiniteObserver) {
      _pepInfiniteObserver.disconnect();
      _pepInfiniteObserver = null;
    }
    var sentinel = document.getElementById('pepScrollSentinel');
    if (sentinel) sentinel.remove();
  }
  function pepSetupInfiniteScroll(src) {
    pepDestroyObserver();
    var list = document.getElementById('pepList');
    var scrollBody = list && list.closest('.pep-scroll-body');
    if (!list || !scrollBody) return;
    var currentShown = list.querySelectorAll('.pep-ep-row').length;
    if (currentShown >= src.length) return;
    var sentinel = document.createElement('div');
    sentinel.id = 'pepScrollSentinel';
    sentinel.style.cssText = 'height:1px;width:100%;';
    list.parentElement.appendChild(sentinel);
    var _busy = false;
    _pepInfiniteObserver = new IntersectionObserver(function(entries) {
      if (!entries[0].isIntersecting || _busy) return;
      _busy = true;
      var loader = _makeInlineLoader();
      sentinel.parentElement && sentinel.parentElement.insertBefore(loader, sentinel);
      setTimeout(function() {
        if (loader.parentElement) loader.parentElement.removeChild(loader);
        var s = list.querySelectorAll('.pep-ep-row').length;
        if (s >= src.length) { pepDestroyObserver(); _busy = false; return; }
        list.insertAdjacentHTML('beforeend', src.slice(s, s + _pepBatchSize).map(function(ep, i) {
          return pepBuildRowList(ep, s + i, 'pepPlayEpById(\'' + ep._key + '\')');
        }).join(''));
        _busy = false;
        if (list.querySelectorAll('.pep-ep-row').length >= src.length) pepDestroyObserver();
      }, 800);
    }, { root: scrollBody, threshold: 0 });
    _pepInfiniteObserver.observe(sentinel);
  }
  function pepRenderList() {
    var list = document.getElementById('pepList');
    if (!list) return;
    pepDestroyObserver();
    var src = (_pepActiveTag && _pepActiveTag !== 'all') || _pepActiveSort !== 'latest' ? _pepFilteredEps : _pepCurrentEps;
    if (src.length === 0) {
      list.innerHTML = '<div class="pep-empty">No episodes yet</div>';
      return;
    }
    list.innerHTML = src.slice(0, _pepPageSize).map(function(ep, i) {
      return pepBuildRowList(ep, i, 'pepPlayEpById(\'' + ep._key + '\')');
    }).join('');
    pepSetupInfiniteScroll(src);
  }
  function pepPlayEp(idx) {
    var ep = _pepCurrentEps[idx];
    if (!ep || !ep.url) return;
    // station card এর মতো — একই episode আবার ট্যাপ করলে pause/resume
    if (currentActiveId === ep._key) {
      if (typeof toggleMiniPlay === 'function') toggleMiniPlay();
      return;
    }
    if (typeof addEpisodeHistory === 'function') addEpisodeHistory(ep);
    _pepCurrentIdx = idx;
    var audio = document.getElementById('mainAudio');
    if (!audio) return;
    // CT update
    if (typeof CT !== 'undefined') {
      CT.track = { id: ep._key, type: 'podcast_ep', url: ep.url, name: ep.title || '', img: ep.img || '', genre: (_pepCurrentCat && _pepCurrentCat.title) || '', desc: ep.desc || (_pepCurrentCat && _pepCurrentCat.title) || '' };
    }
    history.replaceState(history.state, '', '#' + ep._key);
    // global state update
    currentActiveId = ep._key;
    isPlaying = true;
    audio._lastSaved = null;
    playEpWithCache(audio, ep.url, function() { audio.play().catch(function(){}); });
    // mini player update
    var mn = document.getElementById('miniName');
    var ms = document.getElementById('miniStatus');
    if (mn) mn.textContent = ep.title || '—';
    if (ms) ms.innerHTML = ep.desc ? '<span style="opacity:0.7;font-size:0.72rem">'+ep.desc+'</span>' : ((_pepCurrentCat && _pepCurrentCat.title) || '');
    // mini player show
    var mp = document.getElementById('miniPlayer');
    if (mp) { mp.classList.add('visible', 'playing-state'); }
    if (typeof updatePlayerUI === 'function') updatePlayerUI();
    if (typeof syncUI === 'function') syncUI();
    if (typeof updateMediaSession === 'function') updateMediaSession({ name: ep.title || '', img: ep.img || '', genre: (_pepCurrentCat && _pepCurrentCat.title) || '' });
    if (typeof _playCountStart === 'function') _playCountStart();
  }
  function pepPlayAll() {
    if (_pepCurrentEps.length) pepPlayEp(0);
  }
  function pepFilter(q) {
    var filtered = q.trim()
      ? _pepCurrentEps.filter(function(ep) {
          return ((ep.title||'') + ' ' + (ep.desc||'')).toLowerCase().includes(q.toLowerCase());
        })
      : _pepCurrentEps;
    var list = document.getElementById('pepList');
    if (!list) return;
    if (filtered.length === 0) {
      list.innerHTML = '<div class="pep-empty">No results found</div>';
      return;
    }
    list.innerHTML = filtered.map(function(ep, i) {
      return pepBuildRowList(ep, i, 'pepPlayEpById(\'' + ep._key + '\')');
    }).join('');
  }
  function pepPlayEpById(key) {
    var idx = _pepCurrentEps.findIndex(function(e){ return e._key === key; });
    if (idx >= 0) pepPlayEp(idx);
  }
  window.subscribePodcasts    = subscribePodcasts;
  window.pcSetFilter          = pcSetFilter;
  window.pcEpPillPlay         = pcEpPillPlay;
  window.pepFilter            = pepFilter;
  window.pepPlayEpById        = pepPlayEpById;
  window.openPodcastEpModal   = openPodcastEpModal;
  window.closePodcastEpModal  = closePodcastEpModal;
  // ── ALL STATIONS MODAL ──
  var _allStationsSorted = [];
  var _allStationsActiveTag = 'all';
  function allStationsRenderTagBar(list) {
    var bar = document.getElementById('allStationsTagBar');
    if (!bar) return;
    var tagCount = {};
    list.forEach(function(s) {
      if (s.seo) {
        s.seo.split(',').forEach(function(t) {
          var trimmed = t.trim();
          if (trimmed) tagCount[trimmed] = (tagCount[trimmed] || 0) + 1;
        });
      }
    });
    var tags = Object.keys(tagCount).filter(function(t) { return tagCount[t] >= 1; }).sort(function(a, b) { return tagCount[b] - tagCount[a]; });
    if (!tags.length) { bar.innerHTML = ''; return; }
    var active = _allStationsActiveTag;
    var html = '<div class="ltv-tag-chip' + (active === 'all' ? ' active' : '') + '" onclick="allStationsTagSelect(\'all\')">All</div>';
    tags.forEach(function(tag) {
      html += '<div class="ltv-tag-chip' + (active === tag ? ' active' : '') + '" onclick="allStationsTagSelect(\'' + tag.replace(/\'/g, "\\'") + '\')">' + tag + '</div>';
    });
    bar.innerHTML = html;
  }
  function allStationsTagSelect(tag) {
    _allStationsActiveTag = tag;
    var bar = document.getElementById('allStationsTagBar');
    if (bar) {
      bar.querySelectorAll('.ltv-tag-chip').forEach(function(el) {
        el.classList.toggle('active', el.textContent.trim() === (tag === 'all' ? 'All' : tag));
      });
    }
    if (tag === 'all') {
      _allStationsRender(_allStationsSorted);
    } else {
      var filtered = _allStationsSorted.filter(function(s) {
        if (!s.seo) return false;
        return s.seo.split(',').map(function(t){ return t.trim(); }).indexOf(tag) !== -1;
      });
      _allStationsRender(filtered);
    }
  }
  function openAllStationsModal() {
    var si = document.getElementById('allStationsSearchInput');
    var favSet = new Set(favorites.map(String));
    _allStationsSorted = (stations || []).slice().sort(function(a,b){ return (a.order||0)-(b.order||0); });
    _allStationsSorted.sort(function(a, b) {
      var af = favSet.has(String(a.id)) ? 0 : 1;
      var bf = favSet.has(String(b.id)) ? 0 : 1;
      return af - bf;
    });
    if (si) si.value = '';
    window._safeModalSearchClose('allStations');
    _allStationsActiveTag = 'all';
    allStationsRenderTagBar(_allStationsSorted);
    _allStationsRender(_allStationsSorted);
    document.getElementById('allStationsModal').classList.add('open');
    document.body.classList.add('pepmodal-open');
    lockBodyScroll();
    safeHistoryPush({ type: 'modal', modal: 'allstations' }, '', '#allstations');
  }
  function _allStationsRender(list) {
    var el = document.getElementById('allStationsList');
    var shown = 0; var limit = 18;
    el.innerHTML = '';
    function buildHtml(s, i) {
      var isActive = (String(s.id) === String(currentActiveId) && isPlaying);
      var thumbHtml = s.img
        ? '<img src="' + s.img + '" alt="' + (s.name||'') + '" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" onload="imgLoad(this)" onerror="imgErr(this)">'
        : '<div class="tv-pill-placeholder">' + (s.name||'').substring(0,3).toUpperCase() + '</div>';
      return '<div class="tv-pill' + (isActive ? ' tv-active' : '') + '" id="asc-' + s.id + '" style="animation-delay:' + (i*0.04) + 's;width:100%;flex-shrink:1;" onclick="handleCardPlay(\'' + s.id + '\')">'
        + '<div class="tv-pill-thumb">'
        + thumbHtml
        + '<div class="tv-pill-live-badge"><span class="tv-live-pulse"></span>LIVE</div>'
        + '<div class="tv-pill-eq-overlay"><div class="tv-eq-bars"><div class="tv-eq-b"></div><div class="tv-eq-b"></div><div class="tv-eq-b"></div></div></div>'
        + '</div>'
        + '</div>';
    }
    function loadNextBatch() {
      var batch = list.slice(shown, shown + limit);
      if (!batch.length) return false;
      el.insertAdjacentHTML('beforeend', batch.map(function(s, i) { return buildHtml(s, shown + i); }).join(''));
      shown += batch.length;
      return shown < list.length;
    }
    loadNextBatch();
    if (shown < list.length) {
      var sentinel = makeSentinel();
      sentinel.style.gridColumn = '1/-1';
      el.appendChild(sentinel);
      var scrollEl = el.closest('.pep-scroll-body');
      attachAutoLoad(scrollEl, sentinel, loadNextBatch);
    }
  }
  function closeAllStationsModal(fromPopstate) {
    var modal = document.getElementById('allStationsModal');
    closeModalWithAnim(modal, 280, function() {
      document.body.classList.remove('pepmodal-open');
      unlockBodyScroll();
    });
    if (!fromPopstate) {
      if (window.location.hash === '#allstations') try { history.back(); } catch(e) {}
    }
  }
  function allStationsFilter(q) {
    q = q.toLowerCase();
    var filtered = _allStationsSorted.filter(function(s) {
      return (s.name||'').toLowerCase().includes(q) ||
        (s.genre||'').toLowerCase().includes(q) ||
        (s.freq||'').toLowerCase().includes(q) ||
        (s.lang||'').toLowerCase().includes(q) ||
        (s.desc||'').toLowerCase().includes(q);
    });
    _allStationsRender(filtered);
  }
  window.openAllStationsModal  = openAllStationsModal;
  window.closeAllStationsModal = closeAllStationsModal;
  window.allStationsFilter     = allStationsFilter;
  window.allStationsTagSelect  = allStationsTagSelect;
  window.pepTagSelect          = pepTagSelect;
  window.pepSortSelect         = pepSortSelect;
  window.pepPlayEp            = pepPlayEp;
  window.pepPlayAll           = pepPlayAll;
  // ── Debounced filter wrappers (150ms) ──
  window._dLiveTvFilter      = debounce(liveTvFilter,      150);
  window._dWatchCatFilter    = debounce(watchCatFilter,    150);
  window._dSearchModalInput  = debounce(onSearchModalInput,150);
  window._dPepFilter         = debounce(pepFilter,         150);
  window._dAllStationsFilter = debounce(allStationsFilter, 150);
/* ═══════════════════════════════════════════════ */
// ── EPISODE AUDIO CACHE (Cache API) ──
  var EP_CACHE_NAME   = 'castfm-ep-audio-v1';
  var EP_CACHE_MAX    = 10;
  var THUMB_CACHE_NAME = 'castfm-thumb-v1';
  var THUMB_CACHE_MAX  = 100; // সর্বোচ্চ ১০০টি thumbnail cache রাখবে
  // cache থেকে বা network থেকে audio src সেট করে play করে
  window.playEpWithCache = async function(audio, url, onReady) {
    var GDRIVE_WORKER = 'https://gdrive-audio.physarif.workers.dev';
    var isGDrive = url && (url.indexOf('drive.google.com') !== -1 || url.indexOf('docs.google.com') !== -1);
    if (isGDrive) {
      var fileId = (url.match(/[?&]id=([^&]+)/) || url.match(/\/d\/([^/]+)\//) || [])[1];
      audio.src = fileId ? (GDRIVE_WORKER + '/' + fileId) : url;
      if (onReady) onReady();
      return;
    }
    if (!('caches' in window)) {
      audio.src = url;
      if (onReady) onReady();
      return;
    }
    try {
      var cache = await caches.open(EP_CACHE_NAME);
      var cached = await cache.match(url);
      if (cached) {
        // পুরনো Blob URL মুক্ত করো (memory leak এড়াতে)
        if (audio._epBlobUrl) {
          URL.revokeObjectURL(audio._epBlobUrl);
          audio._epBlobUrl = null;
        }
        // cache hit — Blob URL বানিয়ে দাও
        var blob = await cached.blob();
        var blobUrl = URL.createObjectURL(blob);
        audio._epBlobUrl = blobUrl;
        audio.src = blobUrl;
        if (onReady) onReady();
      } else {
        // cache miss — network থেকে load, background এ cache করো
        audio.src = url;
        if (onReady) onReady();
        // background এ fetch করে cache এ রাখো
        fetch(url, { mode: 'cors' })
          .then(function(res) {
            if (!res.ok) return;
            var resClone = res.clone();
            cache.put(url, resClone);
            // পুরোনো episode সরাও
            _epCacheEvict(cache);
          })
          .catch(function() {});
      }
    } catch(e) {
      // fallback
      audio.src = url;
      if (onReady) onReady();
    }
  };
  // পুরনো entries সরিয়ে max limit ঠিক রাখো
  async function _epCacheEvict(cache) {
    try {
      var keys = await cache.keys();
      if (keys.length > EP_CACHE_MAX) {
        var toDelete = keys.slice(0, keys.length - EP_CACHE_MAX);
        toDelete.forEach(function(k) { cache.delete(k); });
      }
    } catch(e) {}
  }
  // clearAppCache এখন নিজেই EP + Thumb cache clear করে (উপরে defined)
  // duplicate wrapper সরানো হয়েছে
  (function() {
    fetch('sw.js')
      .then(function(r){ return r.text(); })
      .then(function(txt) {
        var match = txt.match(/CACHE\s*=\s*['"][^'"]*?([\d.]+)['"]/);
        var ver = match ? 'v' + match[1] : '';
        var el = document.getElementById('plVersion');
        if (el && ver) el.textContent = ver;
      })
      .catch(function(){});
  })();
  // ── APP UPDATE CHECK (শুধু Android app এ) ──
  setTimeout(function() {
  (function() {
    if (!window.AndroidBridge) return; // browser এ দেখাবে না
    var currentVer = (typeof CURRENT_VERSION !== 'undefined') ? CURRENT_VERSION : null;
    if (!currentVer) return;
    // GitHub এর version.json থেকে latest version নাও
    fetch('https://castfm.pages.dev/version.json?t=' + Date.now())
          .then(function(r) { return r.json(); })
          .then(function(data) {
            var latestVer = data.version;
            if (!latestVer || latestVer === currentVer) return;
            // version compare
            function verNum(v) { return v.split('.').map(Number).reduce(function(a,b,i){ return a + b * Math.pow(1000, 2-i); }, 0); }
            if (verNum(latestVer) <= verNum(currentVer)) return;
            // Popup দেখাও
            _showUpdatePopup(currentVer, latestVer);
          }).catch(function(){});
    function _showUpdatePopup(cur, latest) {
      if (document.getElementById('appUpdatePopup')) return;
      var overlay = document.createElement('div');
      overlay.id = 'appUpdatePopup';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0.5);font-family:\'DM Sans\',sans-serif;';
      overlay.innerHTML =
        '<div style="width:100%;max-width:480px;background:var(--bg,#fff);border-radius:20px 20px 0 0;padding:24px 20px 36px;box-shadow:0 -4px 32px rgba(0,0,0,0.18);">' +
          '<div style="width:40px;height:4px;background:var(--border,#e0e0e0);border-radius:2px;margin:0 auto 20px;"></div>' +
          '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">' +
            '<div style="width:44px;height:44px;border-radius:12px;background:var(--accent-light,#e8f0fe);display:flex;align-items:center;justify-content:center;">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="var(--accent,#5D91E4)" stroke-width="2" width="22" height="22"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>' +
            '</div>' +
            '<div>' +
              '<div style="font-weight:700;font-size:1rem;color:var(--text,#111);">নতুন আপডেট পাওয়া গেছে!</div>' +
              '<div style="font-size:0.8rem;color:var(--muted,#888);margin-top:2px;">v' + cur + ' → v' + latest + '</div>' +
            '</div>' +
          '</div>' +
          '<div style="font-size:0.85rem;color:var(--text,#444);margin-bottom:20px;line-height:1.5;">নতুন version এ নতুন features ও bug fix আছে। এখনই আপডেট করুন।</div>' +
          '<div style="display:flex;gap:10px;">' +
            '<button onclick="document.getElementById(\'appUpdatePopup\').remove()" style="flex:1;padding:12px;border-radius:12px;border:1.5px solid var(--border,#e0e0e0);background:none;color:var(--text,#111);font-family:\'DM Sans\',sans-serif;font-size:0.9rem;font-weight:600;cursor:pointer;">পরে করব</button>' +
            '<button onclick="_doAppUpdate()" style="flex:2;padding:12px;border-radius:12px;border:none;background:var(--accent,#5D91E4);color:#fff;font-family:\'DM Sans\',sans-serif;font-size:0.9rem;font-weight:700;cursor:pointer;">আপডেট করুন</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(overlay);
    }
    window._doAppUpdate = function() {
      var url = 'https://github.com/physarif/CastFM/releases/latest/download/castfm.apk';
      if (window.AndroidBridge && window.AndroidBridge.openUrl) {
        window.AndroidBridge.openUrl(url);
      } else {
        window.open(url, '_blank');
      }
      var el = document.getElementById('appUpdatePopup');
      if (el) el.remove();
    };
  })();
  }, 3000);
/* ═══════════════════════════════════════════════ */
var _bmEmptyHtml = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:60px 20px;color:var(--muted);">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>'
    + '<div style="font-size:0.9rem;font-family:DM Sans,sans-serif;">No bookmarks yet</div></div>';
  // ── SAVED VIDEOS MODAL ──
  var _savedVidsFiltered = [];
  var _savedVidsAllItems = [];
  var _savedVidsActiveTag = 'all';
  function _svRenderTagBar(vids) {
    var bar = document.getElementById('savedVideosTagBar');
    if (!bar) return;
    var catCount = {};
    vids.forEach(function(v) {
      var cat = v.category || '';
      if (cat) catCount[cat] = (catCount[cat] || 0) + 1;
    });
    var cats = Object.keys(catCount).sort(function(a,b){ return catCount[b]-catCount[a]; });
    if (!cats.length) { bar.innerHTML = ''; return; }
    var html = '<button class="ltv-tag-chip' + (_savedVidsActiveTag==='all'?' active':'') + '" onclick="_svTagSelect(\'all\')">All</button>';
    cats.forEach(function(cat) {
      var catObj = (typeof _watchCats !== 'undefined') ? _watchCats.find(function(c){ return c._key===cat; }) : null;
      var label = catObj ? (catObj.title || cat) : cat;
      html += '<button class="ltv-tag-chip' + (_savedVidsActiveTag===cat?' active':'') + '" onclick="_svTagSelect(\'' + cat + '\')">'+label+'</button>';
    });
    bar.innerHTML = html;
  }
  window._svTagSelect = function(tag) {
    _savedVidsActiveTag = tag;
    _svRenderTagBar(_savedVidsAllItems);
    var filtered = tag === 'all' ? _savedVidsAllItems : _savedVidsAllItems.filter(function(v){ return v.category === tag; });
    renderSavedVideosModal(filtered);
  };
  function openSavedVideosModal() {
    var favVids = (typeof _watchVideos !== 'undefined')
      ? _watchVideos.filter(function(v){ return watchFavs.includes(v._key); }) : [];
    _savedVidsAllItems = favVids;
    _savedVidsActiveTag = 'all';
    _savedVidsFiltered = favVids;
    var si = document.getElementById('savedVideosSearchInput');
    if (si) si.value = '';
    window._safeModalSearchClose('savedVideos');
    _svRenderTagBar(favVids);
    renderSavedVideosModal(_savedVidsFiltered);
    document.getElementById('savedVideosModal').classList.add('open');
    document.body.classList.add('watch-open');
    lockBodyScroll();
    safeHistoryPush({ type: 'modal', modal: 'savedvideos' }, '', '#savedvideos');
  }
  function closeSavedVideosModal(fromPopstate) {
    var modal = document.getElementById('savedVideosModal');
    closeModalWithAnim(modal, 280, function() {
      document.body.classList.remove('watch-open');
      _scrollLockCount = 1; unlockBodyScroll();
    });
    if (!fromPopstate && window.location.hash === '#savedvideos') {
      try { history.back(); } catch(e) {}
    }
  }
  function renderSavedVideosModal(videos) {
    var listEl = document.getElementById('savedVideosModalBody');
    if (!listEl) return;
    if (!videos || !videos.length) { listEl.innerHTML = _bmEmptyHtml; return; }
    var limit = 15; var shown = 0;
    listEl.innerHTML = '';
    function loadNextBatch() {
      var batch = videos.slice(shown, shown + limit);
      if (!batch.length) return false;
      var frag = document.createDocumentFragment();
      batch.forEach(function(v, i) {
        var tmp = document.createElement('div');
        tmp.innerHTML = makeWatchVideoCard(v, shown + i);
        while (tmp.firstChild) frag.appendChild(tmp.firstChild);
      });
      listEl.appendChild(frag);
      _attachVideoCardClicks(listEl);
      shown += batch.length;
      return shown < videos.length;
    }
    loadNextBatch();
    if (shown < videos.length) {
      var sentinel = makeSentinel();
      listEl.appendChild(sentinel);
      attachAutoLoad(listEl.closest('.pep-scroll-body'), sentinel, loadNextBatch);
    }
  }
  function _savedVideosFilter(q) {
    q = q.toLowerCase();
    var filtered = _savedVidsFiltered.filter(function(v) {
      return (v.title||'').toLowerCase().includes(q) || (v.channel||'').toLowerCase().includes(q);
    });
    renderSavedVideosModal(filtered);
  }
  var _dSavedVideosFilter = (function() {
    var t; return function(v) { clearTimeout(t); t = setTimeout(function(){ _savedVideosFilter(v); }, 250); };
  })();
  // ── BOOKMARKED EPISODES MODAL ──
  var _bookmarkedEpsFiltered = [];
  var _bookmarkedEpsAllItems = [];
  var _bookmarkedEpsActiveTag = 'all';
  function _beRenderTagBar(eps) {
    var bar = document.getElementById('bookmarkedEpsTagBar');
    if (!bar) return;
    var catCount = {};
    eps.forEach(function(ep) {
      var cat = ep.category || '';
      if (cat) catCount[cat] = (catCount[cat] || 0) + 1;
    });
    var cats = Object.keys(catCount).sort(function(a,b){ return catCount[b]-catCount[a]; });
    if (!cats.length) { bar.innerHTML = ''; return; }
    var html = '<button class="ltv-tag-chip' + (_bookmarkedEpsActiveTag==='all'?' active':'') + '" onclick="_beTagSelect(\'all\')">All</button>';
    cats.forEach(function(cat) {
      var catObj = (typeof _podcastCats !== 'undefined') ? _podcastCats.find(function(c){ return c._key===cat; }) : null;
      var label = catObj ? (catObj.title || cat) : cat;
      html += '<button class="ltv-tag-chip' + (_bookmarkedEpsActiveTag===cat?' active':'') + '" onclick="_beTagSelect(\'' + cat + '\')">'+label+'</button>';
    });
    bar.innerHTML = html;
  }
  window._beTagSelect = function(tag) {
    _bookmarkedEpsActiveTag = tag;
    _beRenderTagBar(_bookmarkedEpsAllItems);
    var filtered = tag === 'all' ? _bookmarkedEpsAllItems : _bookmarkedEpsAllItems.filter(function(ep){ return ep.category === tag; });
    renderBookmarkedEpsModal(filtered);
  };
  function openBookmarkedEpsModal() {
    var favEps = (typeof _podcastEps !== 'undefined')
      ? _podcastEps.filter(function(ep){ return favorites.includes(ep._key); }) : [];
    _bookmarkedEpsAllItems = favEps;
    _bookmarkedEpsActiveTag = 'all';
    _bookmarkedEpsFiltered = favEps;
    var si = document.getElementById('bookmarkedEpsSearchInput');
    if (si) si.value = '';
    window._safeModalSearchClose('bookmarkedEps');
    _beRenderTagBar(favEps);
    renderBookmarkedEpsModal(_bookmarkedEpsFiltered);
    var modal = document.getElementById('bookmarkedEpsModal');
    modal.style.display = 'flex';
    modal.classList.add('open');
    document.body.classList.add('bookmarks-open');
    lockBodyScroll();
    safeHistoryPush({ type: 'modal', modal: 'bookmarkedeps' }, '', '#bookmarkedeps');
  }
  function closeBookmarkedEpsModal(fromPopstate) {
    var modal = document.getElementById('bookmarkedEpsModal');
    if (!modal) return;
    modal.classList.add('closing');
    setTimeout(function() {
      modal.classList.remove('open');
      modal.classList.remove('closing');
      modal.style.display = 'none';
      document.body.classList.remove('bookmarks-open');
      unlockBodyScroll();
    }, 280);
    if (!fromPopstate && window.location.hash === '#bookmarkedeps') {
      try { history.back(); } catch(e) {}
    }
  }
  function renderBookmarkedEpsModal(eps) {
    var body = document.getElementById('bookmarkedEpsModalBody');
    if (!body) return;
    if (!eps || !eps.length) { body.innerHTML = _bmEmptyHtml; return; }
    var shown = 0; var limit = 18;
    body.innerHTML = '';
    function loadNextBatch() {
      var batch = eps.slice(shown, shown + limit);
      if (!batch.length) return false;
      batch.forEach(function(ep, i) {
        body.insertAdjacentHTML('beforeend', pepBuildRowList(ep, shown + i, 'pcEpPillPlay(\'' + ep._key + '\')'));
      });
      shown += batch.length;
      return shown < eps.length;
    }
    loadNextBatch();
    if (shown < eps.length) {
      var sentinel = makeSentinel();
      body.appendChild(sentinel);
      attachAutoLoad(body.closest('.pep-scroll-body'), sentinel, loadNextBatch);
    }
  }
  function _bookmarkedEpsFilter(q) {
    q = q.toLowerCase();
    var filtered = _bookmarkedEpsFiltered.filter(function(ep) {
      return (ep.title||'').toLowerCase().includes(q) || (ep.desc||'').toLowerCase().includes(q);
    });
    renderBookmarkedEpsModal(filtered);
  }
  var _dBookmarkedEpsFilter = (function() {
    var t; return function(v) { clearTimeout(t); t = setTimeout(function(){ _bookmarkedEpsFilter(v); }, 250); };
  })();
  // toggleFav এর পরে modals refresh
  var _origToggleFav = window.toggleFav;
  if (_origToggleFav) {
    window.toggleFav = function(id, e) {
      _origToggleFav(id, e);
      setTimeout(function() {
        if (document.getElementById('savedVideosModal').classList.contains('open')) openSavedVideosModal();
        if (document.getElementById('bookmarkedEpsModal').style.display === 'flex') openBookmarkedEpsModal();
      }, 100);
    };
  }
  window.openSavedVideosModal    = openSavedVideosModal;
  window.closeSavedVideosModal   = closeSavedVideosModal;
  window.openBookmarkedEpsModal  = openBookmarkedEpsModal;
  window.closeBookmarkedEpsModal = closeBookmarkedEpsModal;
  window._dSavedVideosFilter     = _dSavedVideosFilter;
  window._dBookmarkedEpsFilter   = _dBookmarkedEpsFilter;
/* ═══════════════════════════════════════════════ */
var _historyVideo   = JSON.parse(localStorage.getItem('castfm_hist_video') || '[]');
  var _historyEpisode = JSON.parse(localStorage.getItem('castfm_hist_episode') || '[]');
  // Migrate: ts নেই এমন পুরনো items কে yesterday এর timestamp দাও
  (function() {
    var yesterday = Date.now() - 86400000;
    var changed = false;
    _historyVideo.forEach(function(v) { if (!v.ts) { v.ts = yesterday; changed = true; } });
    _historyEpisode.forEach(function(ep) { if (!ep.ts) { ep.ts = yesterday; changed = true; } });
    if (changed) {
      localStorage.setItem('castfm_hist_video', JSON.stringify(_historyVideo));
      localStorage.setItem('castfm_hist_episode', JSON.stringify(_historyEpisode));
    }
  })();
  setTimeout(function() {
  }, 800);
  window.addVideoHistory = function(v) {
    if (!v || !v._key) return;
    var now = Date.now();
    var todayStr = new Date(now).toDateString();
    // Same day এ same video already আছে? তাহলে ts update করো, নতুন entry না করে
    var todayIdx = _historyVideo.findIndex(function(x){ return x._key === v._key && new Date(x.ts).toDateString() === todayStr; });
    if (todayIdx !== -1) {
      _historyVideo.splice(todayIdx, 1);
    }
    _historyVideo.unshift({ _key: v._key, title: v.title || '', thumb: v.thumb || v.img || '', channel: v.channel || '', ts: now });
    if (_historyVideo.length > 100) _historyVideo = _historyVideo.slice(0, 100);
    localStorage.setItem('castfm_hist_video', JSON.stringify(_historyVideo));
    _syncHistoryToFirebase();
  };
  window.addEpisodeHistory = function(ep) {
    if (!ep || !ep._key) return;
    var now = Date.now();
    var todayStr = new Date(now).toDateString();
    var todayIdx = _historyEpisode.findIndex(function(x){ return x._key === ep._key && new Date(x.ts).toDateString() === todayStr; });
    if (todayIdx !== -1) {
      _historyEpisode.splice(todayIdx, 1);
    }
    _historyEpisode.unshift({ _key: ep._key, title: ep.title || '', img: ep.img || '', channel: ep.channel || ep.artist || ep.category || '', ts: now });
    if (_historyEpisode.length > 100) _historyEpisode = _historyEpisode.slice(0, 100);
    localStorage.setItem('castfm_hist_episode', JSON.stringify(_historyEpisode));
    _syncHistoryToFirebase();
  };
  function _syncHistoryToFirebase() {
    if (!window.currentUser || !window._fbDb) return;
    window._fbSet(window._fbRef(window._fbDb, 'users/' + window.currentUser.uid + '/history'), {
      video:   _historyVideo,
      episode: _historyEpisode
    }).catch(function(){});
  }
  function _loadHistoryFromFirebase(uid) {
    if (!window._fbDb) return;
    window._fbGet(window._fbRef(window._fbDb, 'users/' + uid + '/history'))
      .then(function(snap) {
        if (!snap.exists()) return;
        var d = snap.val();
        if (d.video)   { _historyVideo   = d.video;   localStorage.setItem('castfm_hist_video',   JSON.stringify(d.video)); }
        if (d.episode) { _historyEpisode = d.episode; localStorage.setItem('castfm_hist_episode', JSON.stringify(d.episode)); }
        if (typeof renderSidebarCats === 'function') renderSidebarCats();
      }).catch(function(){});
  }
  if (window._fbOnAuth) {
    window._fbOnAuth(function(user) {
      if (user) _loadHistoryFromFirebase(user.uid);
    });
  }
  var _syncHistTimer = null;
  function _syncHistoryToFirebase() {
    if (!window.currentUser || !window._fbDb) return;
    clearTimeout(_syncHistTimer);
    _syncHistTimer = setTimeout(function() {
      window._fbSet(window._fbRef(window._fbDb, 'users/' + window.currentUser.uid + '/history'), {
        video:   _historyVideo,
        episode: _historyEpisode
      }).catch(function(){});
    }, 3000);
  }
  function _loadHistoryFromFirebase(uid) {
    if (!window._fbDb) return;
    window._fbGet(window._fbRef(window._fbDb, 'users/' + uid + '/history'))
      .then(function(snap) {
        if (!snap.exists()) return;
        var d = snap.val();
        if (d.video)   { _historyVideo   = d.video;   localStorage.setItem('castfm_hist_video',   JSON.stringify(d.video)); }
        if (d.episode) { _historyEpisode = d.episode; localStorage.setItem('castfm_hist_episode', JSON.stringify(d.episode)); }
      }).catch(function(){});
  }
  if (window._fbOnAuth) {
    window._fbOnAuth(function(user) {
      if (user) _loadHistoryFromFirebase(user.uid);
    });
  }
/* ═══════════════════════════════════════════════ */
(function(){
  var _pollListeners = [];
  window.openPollModal = function() {
    var overlay = document.getElementById('pollOverlay');
    var modal   = document.getElementById('pollModal');
    overlay.style.pointerEvents = 'all';
    overlay.style.background    = 'rgba(0,0,0,0.45)';
    modal.style.display = 'flex';
    lockBodyScroll();
    loadPolls();
  };
  window.closePollModal = function() {
    var overlay = document.getElementById('pollOverlay');
    var modal   = document.getElementById('pollModal');
    overlay.style.pointerEvents = 'none';
    overlay.style.background    = 'rgba(0,0,0,0)';
    _pollListeners.forEach(function(u){ try{u();}catch(e){} });
    _pollListeners = [];
    modal.style.display = 'none';
    unlockBodyScroll();
  };
  function loadPolls() {
    var body = document.getElementById('pollBody');
    body.innerHTML = '<div class="poll-empty"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;opacity:0.4;"></i></div>';
    _pollListeners.forEach(function(u){ try{u();}catch(e){} });
    _pollListeners = [];
    if (!window._fbDb || !window._fbRef || !window._fbGet) {
      showPollEmpty(); return;
    }
    window._fbGet(window._fbRef(window._fbDb, 'polls')).then(function(snap) {
      if (!snap.exists()) { showPollEmpty(); return; }
      var polls = [];
      snap.forEach(function(child) {
        var v = child.val();
        if (v && v.active !== false) polls.push({ id: child.key, ...v });
      });
      if (!polls.length) { showPollEmpty(); return; }
      polls.reverse(); // newest first
      body.innerHTML = '';
      polls.forEach(function(poll) {
        var card = buildPollCard(poll);
        body.appendChild(card);
        // realtime vote count
        var unsub = window._fbOnValue(
          window._fbRef(window._fbDb, 'polls/'+poll.id+'/votes'),
          function(votesSnap) { updatePollVotes(poll.id, votesSnap); }
        );
        _pollListeners.push(unsub);
      });
    }).catch(function(){ showPollEmpty(); });
  }
  function showPollEmpty() {
    document.getElementById('pollBody').innerHTML =
      '<div class="poll-empty">'
      +'<i class="fa-solid fa-square-poll-vertical" style="font-size:34px;opacity:0.25;"></i>'
      +'<span style="font-size:0.85rem;">এখন কোনো Poll নেই</span>'
      +'</div>';
  }
  function buildPollCard(poll) {
    var myUid = window._fbAuth && window._fbAuth.currentUser ? window._fbAuth.currentUser.uid : null;
    var card  = document.createElement('div');
    card.className = 'poll-card';
    card.id = 'poll-card-'+poll.id;
    var q = document.createElement('div');
    q.className = 'poll-question';
    q.textContent = poll.question || '';
    card.appendChild(q);
    var optWrap = document.createElement('div');
    optWrap.id = 'poll-opts-'+poll.id;
    optWrap.style.cssText = 'display:flex;flex-direction:column;gap:8px;';
    var options = poll.options || [];
    options.forEach(function(opt, idx) {
      var op = document.createElement('div');
      op.className = 'poll-option';
      op.id = 'poll-opt-'+poll.id+'-'+idx;
      op.innerHTML =
        '<div class="poll-option-bar" id="poll-bar-'+poll.id+'-'+idx+'" style="width:0%"></div>'
        +'<div class="poll-option-inner">'
        +'<span class="poll-option-text">'+opt+'</span>'
        +'<span class="poll-option-pct" id="poll-pct-'+poll.id+'-'+idx+'"></span>'
        +'</div>';
      op.onclick = function() { castVote(poll.id, idx, options.length); };
      optWrap.appendChild(op);
    });
    card.appendChild(optWrap);
    // meta row
    var meta = document.createElement('div');
    meta.className = 'poll-meta';
    meta.id = 'poll-meta-'+poll.id;
    meta.innerHTML = '<span id="poll-total-'+poll.id+'">Loading...</span>'
      + (poll.endsAt ? '<span>শেষ: '+new Date(poll.endsAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'})+'</span>' : '');
    card.appendChild(meta);
    return card;
  }
  function castVote(pollId, optIdx, totalOpts) {
    var myUid = window._fbAuth && window._fbAuth.currentUser ? window._fbAuth.currentUser.uid : null;
    if (!myUid) {
      if (window._fbSignIn) window._fbSignIn().catch(function(){});
      return;
    }
    if (!window._fbDb || !window._fbRef || !window._fbSet) return;
    window._fbSet(window._fbRef(window._fbDb, 'polls/'+pollId+'/votes/'+myUid), optIdx);
  }
  function updatePollVotes(pollId, votesSnap) {
    var myUid = window._fbAuth && window._fbAuth.currentUser ? window._fbAuth.currentUser.uid : null;
    var counts = {};
    var total  = 0;
    var myVote = null;
    if (votesSnap.exists()) {
      votesSnap.forEach(function(child) {
        var v = child.val();
        counts[v] = (counts[v]||0)+1;
        total++;
        if (child.key === myUid) myVote = v;
      });
    }
    var hasVoted = myVote !== null;
    // update total
    var totalEl = document.getElementById('poll-total-'+pollId);
    if (totalEl) totalEl.textContent = total + ' জন vote দিয়েছেন';
    // update each option bar + pct
    var card = document.getElementById('poll-card-'+pollId);
    if (!card) return;
    var opts = card.querySelectorAll('.poll-option');
    opts.forEach(function(op, idx) {
      var cnt = counts[idx]||0;
      var pct = total ? Math.round(cnt/total*100) : 0;
      var bar = document.getElementById('poll-bar-'+pollId+'-'+idx);
      var pctEl = document.getElementById('poll-pct-'+pollId+'-'+idx);
      if (bar)   bar.style.width  = (hasVoted ? pct+'%' : '0%');
      if (pctEl) pctEl.textContent = hasVoted ? pct+'%' : '';
      op.classList.toggle('voted',   hasVoted);
      op.classList.toggle('my-vote', myVote === idx);
      // voted হলে click বন্ধ নয় — পরিবর্তন করা যাবে
    });
  }
})();
/* ═══════════════════════════════════════════════ */
(function() {
  function setSidebarIcons(open) {
    var hi = document.getElementById('hamburgerIcon');
    var ci = document.getElementById('closeIcon');
    if (!hi || !ci) return;
    if (open) {
      hi.style.opacity = '0'; hi.style.transform = 'rotate(90deg)';
      ci.style.opacity = '1'; ci.style.transform = 'rotate(0deg)';
    } else {
      hi.style.opacity = '1'; hi.style.transform = 'rotate(0deg)';
      ci.style.opacity = '0'; ci.style.transform = 'rotate(-90deg)';
    }
  }
  function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('open')) closeSidebar();
    else openSidebar();
  }
  function openSidebar() {
    var overlay = document.getElementById('sidebarOverlay');
    var sidebar = document.getElementById('sidebar');
    if (!overlay || !sidebar) return;
    overlay.classList.add('open');
    sidebar.classList.add('open');
    lockBodyScroll();
    setSidebarIcons(true);
    renderSidebarCats();
    safeHistoryPush({ type: 'sidebar' }, '', window.location.href);
    // sidebar খোলার সময় settings data refresh করো
    calcStorageUsage();
    _updateSettingsCounts();
    // footer year
    var sbFy = document.getElementById('sbFooterYear');
    if (sbFy) sbFy.textContent = new Date().getFullYear();
    // Get App — browser-এ দেখাবে, standalone (PWA) app-এ না
    var sbGetApp = document.getElementById('sbGetApp');
    if (sbGetApp) {
      var _standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      sbGetApp.style.display = _standalone ? 'none' : '';
    }
  }
  function closeSidebar(fromPopstate) {
    var overlay = document.getElementById('sidebarOverlay');
    var sidebar = document.getElementById('sidebar');
    if (!overlay || !sidebar) return;
    overlay.classList.remove('open');
    sidebar.classList.remove('open');
    unlockBodyScroll();
    setSidebarIcons(false);
    if (!fromPopstate && history.state && history.state.type === 'sidebar') {
      try { history.back(); } catch(e) {}
    }
  }
  function buildCollageThumb(imgs) {
    // imgs: array of up to 4 image URLs
    var n = Math.min(imgs.length, 4);
    if (n === 0) return '<div class="sb-cat-thumb"><span style="font-size:1.1rem">📁</span></div>';
    var cls = n === 1 ? 'cols-1' : n === 2 ? 'cols-2' : n === 3 ? 'cols-3' : '';
    var cells = imgs.slice(0, n).map(function(src) {
      return '<img src="' + src + '" loading="lazy" onload="imgLoad(this)" onerror="imgErr(this)">';
    }).join('');
    return '<div class="sb-collage ' + cls + '">' + cells + '</div>';
  }
  function renderSidebarCats() {
    var vCont = document.getElementById('sbVideoCats');
    var aCont = document.getElementById('sbAudioCats');
    if (!vCont || !aCont) return;
    // count update
    var savedCount = (typeof watchFavs !== 'undefined' && typeof _watchVideos !== 'undefined')
      ? _watchVideos.filter(function(v){ return watchFavs.includes(v._key); }).length : 0;
    var bmEpCount = (typeof favorites !== 'undefined' && typeof _podcastEps !== 'undefined')
      ? _podcastEps.filter(function(ep){ return favorites.includes(ep._key); }).length : 0;
    var sc = document.getElementById('sbSavedVideoCount');
    var bc = document.getElementById('sbBookmarkedEpCount');
    if (sc) sc.textContent = savedCount + ' Video' + (savedCount !== 1 ? 's' : '');
    if (bc) bc.textContent = bmEpCount + ' Episode' + (bmEpCount !== 1 ? 's' : '');
    var arrowSvg = '<svg class="sb-cat-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="13" height="13"><polyline points="9 18 15 12 9 6"/></svg>';
    // Video categories
    var watchCats = (typeof _watchCats !== 'undefined') ? _watchCats : [];
    var vids = (typeof _watchVideos !== 'undefined') ? _watchVideos : [];
    if (watchCats.length) {
      vCont.innerHTML = watchCats.slice(0, 9).map(function(cat) {
        var catVids = vids.filter(function(v){ return v.category === cat._key; });
        var sub = catVids.length + ' Video' + (catVids.length !== 1 ? 's' : '');
        var thumbHtml;
        if (cat.img) {
          thumbHtml = '<div class="sb-cat-thumb"><img src="' + cat.img + '" loading="lazy" onload="imgLoad(this)" onerror="imgErr(this)"></div>';
        } else {
          var imgs = catVids.slice(-4).map(function(v){ return v.thumb || v.img || ''; }).filter(Boolean);
          thumbHtml = imgs.length ? buildCollageThumb(imgs) : '<div class="sb-cat-thumb"><span>📺</span></div>';
        }
        return '<div class="sb-cat-item" onclick="closeSidebar();setTimeout(function(){switchTab(&quot;watch&quot;);setTimeout(function(){openWatchCatModal(&quot;' + cat._key + '&quot;)},200)},200)">'
          + thumbHtml
          + '<div class="sb-cat-info">'
          + '<div class="sb-cat-name">' + (cat.title || cat._key) + '</div>'
          + '<div class="sb-cat-sub">' + sub + '</div>'
          + '</div>'
          + arrowSvg
          + '</div>';
      }).join('');
    } else {
      vCont.innerHTML = '<div class="sb-empty">No video categories yet</div>';
    }
    // Audio / Podcast categories
    var podCats = (typeof _podcastCats !== 'undefined') ? _podcastCats : [];
    var eps = (typeof _podcastEps !== 'undefined') ? _podcastEps : [];
    if (podCats.length) {
      aCont.innerHTML = podCats.slice(0, 9).map(function(cat) {
        var catEps = eps.filter(function(e){ return e.category === cat._key; });
        var sub = catEps.length + ' Episode' + (catEps.length !== 1 ? 's' : '');
        var thumbHtml;
        if (cat.img) {
          thumbHtml = '<div class="sb-cat-thumb"><img src="' + cat.img + '" loading="lazy" onload="imgLoad(this)" onerror="imgErr(this)"></div>';
        } else {
          var imgs = catEps.slice(-4).map(function(e){ return e.img || ''; }).filter(Boolean);
          thumbHtml = imgs.length ? buildCollageThumb(imgs) : '<div class="sb-cat-thumb"><span>🎙️</span></div>';
        }
        return '<div class="sb-cat-item" onclick="closeSidebar();setTimeout(function(){switchTab(&quot;podcast&quot;);setTimeout(function(){openPodcastEpModal(&quot;' + cat._key + '&quot;)},200)},200)">'
          + thumbHtml
          + '<div class="sb-cat-info">'
          + '<div class="sb-cat-name">' + (cat.title || cat._key) + '</div>'
          + '<div class="sb-cat-sub">' + sub + '</div>'
          + '</div>'
          + arrowSvg
          + '</div>';
      }).join('');
    } else {
      aCont.innerHTML = '<div class="sb-empty">No audio categories yet</div>';
    }
  }
  window.openSidebar  = openSidebar;
  window.toggleSidebar = toggleSidebar;
  window.closeSidebar = closeSidebar;

  // Desktop sidebar: embed #sidebar .sb-body content into #dsbSidebarEmbed
  function initDsbSidebarEmbed() {
    if (!document.body.classList.contains('is-desktop')) return;
    var embed = document.getElementById('dsbSidebarEmbed');
    var sbBody = document.querySelector('#sidebar .sb-body');
    if (!embed || !sbBody) return;
    // Move (not clone) sb-body into embed so all IDs/events stay intact
    embed.appendChild(sbBody);
    // Also trigger sidebar data load
    calcStorageUsage && calcStorageUsage();
    _updateSettingsCounts && _updateSettingsCounts();
    renderSidebarCats && renderSidebarCats();
    var sbFy = document.getElementById('sbFooterYear');
    if (sbFy) sbFy.textContent = new Date().getFullYear();
    var sbGetApp = document.getElementById('sbGetApp');
    if (sbGetApp) {
      var _standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      sbGetApp.style.display = _standalone ? 'none' : '';
    }
  }
  // Run after DOM ready and app-ready
  if (document.body.classList.contains('is-desktop')) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(initDsbSidebarEmbed, 100);
    } else {
      document.addEventListener('DOMContentLoaded', function(){ setTimeout(initDsbSidebarEmbed, 100); });
    }
  }

  // Desktop sidebar: profile button → trigger data refresh
  window.dsbToggleProfile = function() {
    renderSidebarCats && renderSidebarCats();
  };

  // ══════════════════════════════════════
  // DESKTOP SIDEBAR SEARCH
  // ══════════════════════════════════════
  window.dsbOpenSearch = function() {
    var logo  = document.querySelector('.dsb-logo');
    var input = document.getElementById('dsbSearchInput');
    var si    = document.getElementById('dsbSearchIcon');
    var ci    = document.getElementById('dsbCloseIcon');
    if (!logo) return;
    logo.classList.add('search-open');
    if (si) si.style.display = 'none';
    if (ci) ci.style.display = '';
    if (input) setTimeout(function(){ input.focus(); }, 60);
  };
  window.dsbCloseSearch = function() {
    var logo  = document.querySelector('.dsb-logo');
    var input = document.getElementById('dsbSearchInput');
    var si    = document.getElementById('dsbSearchIcon');
    var ci    = document.getElementById('dsbCloseIcon');
    if (logo)  logo.classList.remove('search-open');
    if (input) input.value = '';
    if (si)    si.style.display = '';
    if (ci)    ci.style.display = 'none';
  };
  window.dsbSubmit = function() {
    var input = document.getElementById('dsbSearchInput');
    var val   = input ? input.value.trim() : '';
    window.dsbCloseSearch();
    if (val) openSearchModal(val);
    else     openSearchModal('');
  };
})();
/* ── EXPLORE: LATEST NEWS ── */
(function() {
  var RSS_WORKER = 'https://rss-proxy.physarif.workers.dev/';
  var IMG_WORKER = 'https://rss-proxy.physarif.workers.dev/?type=img&url=';
  var RSS_URL    = 'https://www.prothomalo.com/feed/';
  var _newsLoaded = false;
  var _newsModal = {
    allItems: [],
    page: 0,
    perPage: 12,
    loading: false,
    observer: null
  };

  window.loadExploreNews = function(force) {
    if (!force && _newsLoaded) return;

    var list = document.getElementById('exploreNewsList');
    if (!list) return;

    var btn = document.querySelector('.explore-news-refresh');
    if (btn) { btn.classList.add('spinning'); btn.disabled = true; }

    var skeletonItem = '<div class="explore-news-skel-item"><div class="explore-news-skel-body"><div class="skel-line skel-line--full"></div><div class="skel-line skel-line--med"></div><div class="skel-line skel-line--short"></div></div><div class="explore-news-skel-thumb"></div></div>';
    list.innerHTML = skeletonItem.repeat(3);

    function stopSpin() {
      var b = document.querySelector('.explore-news-refresh');
      if (b) { b.classList.remove('spinning'); b.disabled = false; }
    }

    // reuse modal cache if available
    if (_newsModal.allItems.length) {
      renderExploreNews(_newsModal.allItems.slice(0, 3));
      _newsLoaded = true;
      stopSpin();
      return;
    }

    var proxyUrl = RSS_WORKER + '?url=' + encodeURIComponent(RSS_URL) + '&_=' + Date.now();

    fetch(proxyUrl)
      .then(function(r) { return r.text(); })
      .then(function(xml) {
        var doc = new DOMParser().parseFromString(xml, 'text/xml');
        var all = Array.from(doc.querySelectorAll('item'));
        if (!all.length) throw new Error('empty');
        _newsModal.allItems = all;
        renderExploreNews(all.slice(0, 3));
        _newsLoaded = true;
        stopSpin();
      })
      .catch(function() {
        list.innerHTML = '<div class="explore-news-error"><i class="fa-solid fa-circle-exclamation"></i>খবর লোড করা যায়নি। ইন্টারনেট চেক করুন।</div>';
        stopSpin();
      });
  };

  function getXmlText(item, tag) {
    var el = item.querySelector(tag);
    return el ? (el.textContent || '').trim() : '';
  }

  function getThumb(item) {
    // media:content, media:thumbnail, enclosure
    var mc = item.querySelector('content') || item.querySelector('thumbnail');
    if (mc && mc.getAttribute('url')) return mc.getAttribute('url');
    var enc = item.querySelector('enclosure');
    if (enc && enc.getAttribute('url')) return enc.getAttribute('url');
    // description এ img tag থেকে
    var desc = getXmlText(item, 'description');
    var m = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
    return m ? m[1] : '';
  }

  function renderExploreNews(items) {
    var list = document.getElementById('exploreNewsList');
    if (!list) return;
    list.innerHTML = items.map(function(item, i) {
      var title   = getXmlText(item, 'title');
      var link    = getXmlText(item, 'link') || getXmlText(item, 'guid');
      var pubDate = getXmlText(item, 'pubDate');
      var thumb   = getThumb(item);
      var proxyThumb = thumb ? (IMG_WORKER + encodeURIComponent(thumb)) : '';
      var FALLBACK = 'https://castfm.pages.dev/photos/c2zf4n5pbmik3rqeiitj.jpg';
      var thumbSrc = proxyThumb || FALLBACK;
      var onerrorAttr = proxyThumb ? 'onerror="this.src=\'' + FALLBACK + '\'"' : '';
      return '<a class="explore-news-item" style="animation-delay:' + (i * 0.07) + 's" href="' + link + '" target="_blank" rel="noopener">' +
        '<div class="explore-news-body">' +
          '<div class="explore-news-title">' + escHtml(title) + '</div>' +
          (pubDate ? '<div class="explore-news-meta"><img class="explore-news-source-icon" src="' + FALLBACK + '" alt="">প্রথম আলো · ' + formatNewsDate(pubDate) + '</div>' : '') +
        '</div>' +
        '<img class="explore-news-thumb" src="' + thumbSrc + '" alt="" loading="lazy" ' + onerrorAttr + '>' +
      '</a>';
    }).join('');
  }

  function formatNewsDate(dateStr) {
    try {
      var d = new Date(dateStr);
      var diff = Math.floor((Date.now() - d) / 60000);
      if (diff < 1) return 'এইমাত্র';
      if (diff < 60) return diff + ' মিনিট আগে';
      if (diff < 1440) return Math.floor(diff / 60) + ' ঘণ্টা আগে';
      return Math.floor(diff / 1440) + ' দিন আগে';
    } catch(e) { return ''; }
  }

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── NEWS MODAL ── */

  window.openNewsModal = function() {
    var modal = document.getElementById('newsModal');
    if (!modal) return;
    modal.style.display = 'flex';
    requestAnimationFrame(function() { modal.classList.add('open'); });
    document.body.classList.add('news-open');
    history.pushState({ newsModal: true }, '');

    var list = document.getElementById('newsModalList');
    list.innerHTML = '';
    _newsModal.page = 0;
    _newsModal.loading = false;

    // reuse already-fetched items if available
    if (_newsModal.allItems.length) {
      _loadNewsModalPage();
      _initNewsModalScroll();
      return;
    }

    // fetch full 60
    var skeletonItem = '<div class="explore-news-skel-item"><div class="explore-news-skel-body"><div class="skel-line skel-line--full"></div><div class="skel-line skel-line--med"></div><div class="skel-line skel-line--short"></div></div><div class="explore-news-skel-thumb"></div></div>';
    list.innerHTML = skeletonItem.repeat(6);

    var proxyUrl = RSS_WORKER + '?url=' + encodeURIComponent(RSS_URL);
    fetch(proxyUrl)
      .then(function(r) { return r.text(); })
      .then(function(xml) {
        var doc = new DOMParser().parseFromString(xml, 'text/xml');
        _newsModal.allItems = Array.from(doc.querySelectorAll('item'));
        list.innerHTML = '';
        _loadNewsModalPage();
        _initNewsModalScroll();
      })
      .catch(function() {
        list.innerHTML = '<div class="explore-news-error"><i class="fa-solid fa-circle-exclamation"></i>খবর লোড করা যায়নি।</div>';
      });
  };

  function _loadNewsModalPage() {
    if (_newsModal.loading) return;
    var start = _newsModal.page * _newsModal.perPage;
    if (start >= _newsModal.allItems.length) return;
    _newsModal.loading = true;

    var loader = document.getElementById('newsModalLoader');
    if (loader) loader.style.display = 'flex';

    var end = Math.min(start + _newsModal.perPage, _newsModal.allItems.length);
    var batch = _newsModal.allItems.slice(start, end);
    var list = document.getElementById('newsModalList');
    var FALLBACK = 'https://castfm.pages.dev/photos/c2zf4n5pbmik3rqeiitj.jpg';

    var html = batch.map(function(item, i) {
      var title   = getXmlText(item, 'title');
      var link    = getXmlText(item, 'link') || getXmlText(item, 'guid');
      var pubDate = getXmlText(item, 'pubDate');
      var thumb   = getThumb(item);
      var proxyThumb = thumb ? (IMG_WORKER + encodeURIComponent(thumb)) : '';
      var thumbSrc = proxyThumb || FALLBACK;
      var onerrorAttr = proxyThumb ? 'onerror="this.src=\'' + FALLBACK + '\'"' : '';
      return '<a class="explore-news-item" style="animation-delay:' + (i * 0.07) + 's" href="' + link + '" target="_blank" rel="noopener">' +
        '<div class="explore-news-body">' +
          '<div class="explore-news-title">' + escHtml(title) + '</div>' +
          (pubDate ? '<div class="explore-news-meta"><img class="explore-news-source-icon" src="' + FALLBACK + '" alt="">প্রথম আলো · ' + formatNewsDate(pubDate) + '</div>' : '') +
        '</div>' +
        '<img class="explore-news-thumb" src="' + thumbSrc + '" alt="" loading="lazy" ' + onerrorAttr + '>' +
      '</a>';
    }).join('');

    if (list) list.insertAdjacentHTML('beforeend', html);
    if (loader) loader.style.display = 'none';
    _newsModal.page++;
    _newsModal.loading = false;
  }

  function _initNewsModalScroll() {
    if (_newsModal.observer) _newsModal.observer.disconnect();
    var sentinel = document.getElementById('newsModalSentinel');
    if (!sentinel) return;
    _newsModal.observer = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting) _loadNewsModalPage();
    }, { threshold: 0.1 });
    _newsModal.observer.observe(sentinel);
  }

  window.newsModalFilter = function(q) {
    var list = document.getElementById('newsModalList');
    if (!list) return;
    q = q.trim().toLowerCase();

    if (!q) {
      // restore full paginated list
      list.innerHTML = '';
      _newsModal.page = 0;
      _newsModal.loading = false;
      _loadNewsModalPage();
      _initNewsModalScroll();
      document.getElementById('newsModalSentinel').style.display = '';
      return;
    }

    // hide sentinel so infinite scroll doesn't trigger
    document.getElementById('newsModalSentinel').style.display = 'none';
    if (_newsModal.observer) _newsModal.observer.disconnect();

    var FALLBACK = 'https://castfm.pages.dev/photos/c2zf4n5pbmik3rqeiitj.jpg';
    var filtered = _newsModal.allItems.filter(function(item) {
      return getXmlText(item, 'title').toLowerCase().indexOf(q) !== -1;
    });

    if (!filtered.length) {
      list.innerHTML = '<div class="explore-news-error"><i class="fa-solid fa-magnifying-glass"></i>কোনো ফলাফল পাওয়া যায়নি।</div>';
      return;
    }

    list.innerHTML = filtered.map(function(item, i) {
      var title   = getXmlText(item, 'title');
      var link    = getXmlText(item, 'link') || getXmlText(item, 'guid');
      var pubDate = getXmlText(item, 'pubDate');
      var thumb   = getThumb(item);
      var proxyThumb = thumb ? (IMG_WORKER + encodeURIComponent(thumb)) : '';
      var thumbSrc = proxyThumb || FALLBACK;
      var onerrorAttr = proxyThumb ? 'onerror="this.src=\'' + FALLBACK + '\'"' : '';
      return '<a class="explore-news-item" style="animation-delay:' + (i * 0.07) + 's" href="' + link + '" target="_blank" rel="noopener">' +
        '<div class="explore-news-body">' +
          '<div class="explore-news-title">' + escHtml(title) + '</div>' +
          (pubDate ? '<div class="explore-news-meta"><img class="explore-news-source-icon" src="' + FALLBACK + '" alt="">প্রথম আলো · ' + formatNewsDate(pubDate) + '</div>' : '') +
        '</div>' +
        '<img class="explore-news-thumb" src="' + thumbSrc + '" alt="" loading="lazy" ' + onerrorAttr + '>' +
      '</a>';
    }).join('');
  };

  window.refreshNewsModal = function() {
    var btn = document.getElementById('newsModalRefreshBtn');
    if (btn) { btn.classList.add('spinning'); btn.disabled = true; }
    _newsModal.allItems = [];
    _newsLoaded = false;
    var list = document.getElementById('newsModalList');
    var skeletonItem = '<div class="explore-news-skel-item"><div class="explore-news-skel-body"><div class="skel-line skel-line--full"></div><div class="skel-line skel-line--med"></div><div class="skel-line skel-line--short"></div></div><div class="explore-news-skel-thumb"></div></div>';
    if (list) list.innerHTML = skeletonItem.repeat(6);
    _newsModal.page = 0;
    _newsModal.loading = false;
    if (_newsModal.observer) { _newsModal.observer.disconnect(); _newsModal.observer = null; }

    var proxyUrl = RSS_WORKER + '?url=' + encodeURIComponent(RSS_URL);
    fetch(proxyUrl)
      .then(function(r) { return r.text(); })
      .then(function(xml) {
        var doc = new DOMParser().parseFromString(xml, 'text/xml');
        _newsModal.allItems = Array.from(doc.querySelectorAll('item'));
        if (list) list.innerHTML = '';
        _loadNewsModalPage();
        _initNewsModalScroll();
        _newsLoaded = true;
        // also refresh explore card list
        var exploreList = document.getElementById('exploreNewsList');
        if (exploreList) {
          var items3 = _newsModal.allItems.slice(0, 3);
          renderExploreNews(items3);
        }
      })
      .catch(function() {
        if (list) list.innerHTML = '<div class="explore-news-error"><i class="fa-solid fa-circle-exclamation"></i>খবর লোড করা যায়নি।</div>';
      })
      .finally(function() {
        if (btn) { btn.classList.remove('spinning'); btn.disabled = false; }
      });
  };

  window.closeNewsModal = function() {
    var modal = document.getElementById('newsModal');
    if (!modal) return;
    modal.classList.add('closing');
    modal.classList.remove('open');
    document.body.classList.remove('news-open');
    setTimeout(function() {
      modal.style.display = 'none';
      modal.classList.remove('closing');
    }, 320);
    if (_newsModal.observer) { _newsModal.observer.disconnect(); _newsModal.observer = null; }
    if (window._modalSearchClose) _modalSearchClose('newsModal');
  };

  // back button close
  window.addEventListener('popstate', function(e) {
    var modal = document.getElementById('newsModal');
    if (modal && modal.classList.contains('open')) closeNewsModal();
  });

  window.switchExploreOption = function(opt) {
    document.querySelectorAll('.explore-opt-btn').forEach(function(b) { b.classList.remove('active'); });
    var id = 'exploreOpt' + opt.charAt(0).toUpperCase() + opt.slice(1);
    var btn = document.getElementById(id);
    if (btn) btn.classList.add('active');
  };
})();