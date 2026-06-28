import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
    import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged }
      from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
    import { getDatabase, ref, set, get, update, onValue, increment, onDisconnect, push, query, limitToLast, orderByKey, endBefore }
      from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
    const firebaseConfig = {
      apiKey: "AIzaSyAsbjRuLTY59Uxuv6j97XM4s8y34YSVy_c",
      authDomain: "stream2day-dbdba.firebaseapp.com",
      projectId: "stream2day-dbdba",
      storageBucket: "stream2day-dbdba.firebasestorage.app",
      messagingSenderId: "851526124561",
      appId: "1:851526124561:web:32b22baa3533085b075db0",
      measurementId: "G-MNLYQER6B7",
      databaseURL: "https://stream2day-dbdba-default-rtdb.asia-southeast1.firebasedatabase.app"
    };
    const app    = initializeApp(firebaseConfig);
    const auth   = getAuth(app);
    const db     = getDatabase(app);
    const provider = new GoogleAuthProvider();
    // Expose to global scope
    window._fbAuth     = auth;
    window._fbDb       = db;
    window._fbRef      = ref;
    window._fbSet      = set;
    window._fbGet      = get;
    window._fbUpdate   = update;
    window._fbOnValue  = onValue;
    window._fbIncrement = increment;
    window._fbProvider = provider;
    window._fbSignIn   = () => {
      const isWebView = /wv|WebView/.test(navigator.userAgent);
      if (isWebView) {
        return signInWithRedirect(auth, provider);
      }
      return signInWithPopup(auth, provider);
    };
    window._fbSignOut  = () => signOut(auth);
    window._fbOnAuth   = (cb) => onAuthStateChanged(auth, cb);
    window._fbOnDisconnect = onDisconnect;
    window._fbPush         = push;
    window._fbQuery        = query;
    window._fbLimitToLast  = limitToLast;
    window._fbOrderByKey   = orderByKey;
    window._fbEndBefore    = endBefore;
    // Handle redirect result (Android WebView এ Google login ফিরে আসলে)
    getRedirectResult(auth).then((result) => {
      if (result?.user && window.onFirebaseUser) {
        window.onFirebaseUser(result.user);
      }
    }).catch(() => {});
    // Listen auth state
    onAuthStateChanged(auth, (user) => {
      if (window.onFirebaseUser) window.onFirebaseUser(user);
    });
    // Loader hide — সব key data Firebase থেকে load হলে
    var _loaderKeys = { stations: false, episodes: false };
    var _loaderDone = false;
    window._markLoaded = function(key) {
      if (_loaderDone) return;
      _loaderKeys[key] = true;
      var allDone = Object.keys(_loaderKeys).every(function(k){ return _loaderKeys[k]; });
      if (allDone) {
        _loaderDone = true;
        var loader = document.getElementById('pageLoader');
        if (loader) {
          loader.classList.add('hide');
          setTimeout(function(){ loader.style.display = 'none'; }, 420);
        }
      }
    };
    // Safety timeout — 8 সেকেন্ডে যা লোড হয়েছে তাই নিয়ে hide
    setTimeout(function() {
      if (!_loaderDone) {
        _loaderDone = true;
        var loader = document.getElementById('pageLoader');
        if (loader) {
          loader.classList.add('hide');
          setTimeout(function(){ loader.style.display = 'none'; }, 420);
        }
      }
    }, 8000);
    // Music + Stations — Firebase ready হলে subscribe
    setTimeout(() => {
      if (window.subscribeStations)      window.subscribeStations();
      if (window.subscribeChannels)      window.subscribeChannels();
      if (window.subscribePodcasts)      window.subscribePodcasts();
    }, 500);
