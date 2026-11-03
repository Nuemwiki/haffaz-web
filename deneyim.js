// Haffaz AI — haffaz.net
// Sitenin hareketi: sıvı altın logo, Dinlet-Bul gösterimi, sayfadan inen devre izi.
// Hareket azaltma tercih edilmişse her şey son hâlinde, sabit gösterilir.

(function () {
  var azHareket = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap;

  /* ── 0. Menü bağlantıları: hedefe kesin varış ───────────────
     Tarayıcının kendi kaydırması yolda yüklenen içerik (günün ayeti, görseller) sayfayı
     uzatınca hedefi kaçırabiliyor; burada hedef her karede yeniden ölçülür. */
  (function () {
    var kosu = 0;
    function hedefY(el) {
      var ust = document.querySelector('.ust');
      var pay = (ust ? ust.getBoundingClientRect().height : 0) + 14;
      var y = el.getBoundingClientRect().top + window.scrollY - pay;
      return Math.max(0, Math.min(y, document.documentElement.scrollHeight - window.innerHeight));
    }
    function git(el) {
      var benim = ++kosu, bas = window.scrollY, t0 = performance.now();
      var sure = azHareket ? 0 : Math.min(1100, 450 + Math.abs(hedefY(el) - bas) * 0.12);
      document.documentElement.style.scrollBehavior = 'auto';
      (function adim(now) {
        if (benim !== kosu) return;
        var p = sure ? Math.min(1, (now - t0) / sure) : 1;
        var e = 1 - Math.pow(1 - p, 3);
        window.scrollTo(0, bas + (hedefY(el) - bas) * e);
        if (p < 1) requestAnimationFrame(adim);
        else document.documentElement.style.scrollBehavior = '';
      })(t0);
      // Kare çizilmezse (arka plan sekmesi vb.) yine de hedefe otur
      setTimeout(function () {
        if (benim !== kosu) return;
        kosu++; window.scrollTo(0, hedefY(el)); document.documentElement.style.scrollBehavior = '';
      }, sure + 250);
    }
    function iptal() { if (kosu) { kosu++; document.documentElement.style.scrollBehavior = ''; } }
    window.addEventListener('wheel', iptal, { passive: true });
    window.addEventListener('touchstart', iptal, { passive: true });
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      var el = document.getElementById(a.getAttribute('href').slice(1));
      if (!el) return;
      e.preventDefault();
      history.replaceState(null, '', a.getAttribute('href'));
      git(el);
    });
  })();

  /* ── 1. Sıvı altın logo (WebGL) ─────────────────────────── */
  (function () {
    var sahne = document.getElementById('logo-sahne');
    if (!sahne || azHareket) return;
    var resim = sahne.querySelector('img');
    var tuval = document.createElement('canvas');
    var gl = tuval.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true });
    if (!gl) return;

    var vs = 'attribute vec2 p; varying vec2 v; void main(){ v = vec2(p.x*.5+.5, .5-p.y*.5); gl_Position = vec4(p,0.,1.); }';
    var fs = [
      'precision mediump float;',
      'uniform sampler2D u_logo; uniform float u_t; uniform vec2 u_px; varying vec2 v;',
      'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }',
      'float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);',
      '  return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }',
      'void main(){',
      '  vec4 c = texture2D(u_logo, v);',
      '  if (c.a < 0.01) { gl_FragColor = vec4(0.); return; }',
      '  vec3 rgb = c.rgb / max(c.a, 1e-3);',
      // Kenarlardan sahte bir yüzey normali: metal kabartma hissi
      '  float aL = texture2D(u_logo, v - vec2(u_px.x,0.)).a, aR = texture2D(u_logo, v + vec2(u_px.x,0.)).a;',
      '  float aU = texture2D(u_logo, v - vec2(0.,u_px.y)).a, aD = texture2D(u_logo, v + vec2(0.,u_px.y)).a;',
      '  vec2 nrm = vec2(aR - aL, aD - aU);',
      '  float t = u_t * .35;',
      '  float akis = n(v*3.2 + vec2(t, -t*.7)) + .5*n(v*7. - vec2(t*1.3, t*.4));',
      '  float bant = sin((v.x*1.2 + v.y)*5.5 + akis*3.2 - u_t*.9 + dot(nrm, vec2(6.,4.)))*.5+.5;',
      '  float altinMi = smoothstep(.05, .25, rgb.r - rgb.g*.55);',
      '  vec3 aK = vec3(.42,.30,.10), aO = vec3(.86,.68,.30), aP = vec3(1.,.93,.70);',
      '  vec3 yK = vec3(.04,.24,.17), yO = vec3(.10,.44,.31), yP = vec3(.62,.86,.72);',
      '  vec3 altin = mix(aK, aO, smoothstep(.15,.6,bant)); altin = mix(altin, aP, smoothstep(.78,.97,bant));',
      '  vec3 yesil = mix(yK, yO, smoothstep(.15,.6,bant)); yesil = mix(yesil, yP, smoothstep(.86,.99,bant)*.55);',
      '  vec3 son = mix(yesil, altin, altinMi);',
      '  gl_FragColor = vec4(son * c.a, c.a);',
      '}'
    ].join('\n');

    function derle(tip, kaynak) {
      var s = gl.createShader(tip); gl.shaderSource(s, kaynak); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var v = derle(gl.VERTEX_SHADER, vs), f = derle(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return;
    var pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);

    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uT = gl.getUniformLocation(pr, 'u_t'), uPx = gl.getUniformLocation(pr, 'u_px');

    var dok = new Image();
    dok.onload = function () {
      var tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      // Büyük kaynağı WebGL'e küçültmek tırtık yapar (mipmap yok); tarayıcıya tuval boyutunda
      // yumuşakça küçülttürüp öyle yükle. Boyut değişince yeniden.
      var ara = document.createElement('canvas'), araCtx = ara.getContext('2d');
      function dokuKur(w, hgt) {
        ara.width = w; ara.height = hgt;
        araCtx.imageSmoothingQuality = 'high';
        araCtx.clearRect(0, 0, w, hgt); araCtx.drawImage(dok, 0, 0, w, hgt);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ara);
        gl.uniform2f(uPx, 1.5 / w, 1.5 / hgt);
      }
      sahne.insertBefore(tuval, resim);

      var gorunur = true;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e) { gorunur = e[0].isIntersecting; }).observe(sahne);
      }
      var t0 = performance.now();
      (function ciz(now) {
        if (gorunur && !document.hidden) {
          var dpr = Math.min(window.devicePixelRatio || 1, 2);
          var w = Math.round(sahne.clientWidth * dpr), hgt = Math.round(sahne.clientHeight * dpr);
          if (tuval.width !== w || tuval.height !== hgt) { tuval.width = w; tuval.height = hgt; dokuKur(w, hgt); }
          gl.viewport(0, 0, w, hgt);
          gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
          gl.uniform1f(uT, (now - t0) / 1000);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        requestAnimationFrame(ciz);
      })(t0);
    };
    dok.src = resim.getAttribute('src');
  })();

  /* ── 2. Dinlet-Bul gösterimi ─────────────────────────────── */
  (function () {
    var kutu = document.getElementById('dinlet');
    var dalga = document.getElementById('dalga');
    if (!kutu || !dalga) return;
    var yazi = document.getElementById('dinlet-yazi');
    var sonuc = document.getElementById('sonuc');
    var ayet = document.getElementById('sonuc-ayet');
    var plaka = document.getElementById('plaka');
    var musabih = document.getElementById('musabih');

    // Logodaki altın çubuklar gibi: ses dalgası
    var adet = window.innerWidth < 600 ? 26 : 44;
    for (var i = 0; i < adet; i++) dalga.appendChild(document.createElement('span'));
    var cubuklar = Array.prototype.slice.call(dalga.children);

    // Ayeti kelimelere böl (kelime kelime belirsin)
    var kelimeler = ayet.textContent.trim().split(/\s+/);
    ayet.textContent = '';
    kelimeler.forEach(function (k, j) {
      var s = document.createElement('span'); s.textContent = k; ayet.appendChild(s);
      if (j < kelimeler.length - 1) ayet.appendChild(document.createTextNode(' '));
    });
    var kelimeEl = Array.prototype.slice.call(ayet.querySelectorAll('span'));

    function sonHal() {
      kutu.dataset.asama = 'sonuc'; yazi.textContent = 'Bulundu';
      dalga.style.visibility = 'hidden';
      [sonuc, plaka, musabih].forEach(function (e) { e.style.visibility = 'visible'; });
    }
    if (azHareket || !gsap) { sonHal(); return; }

    function dinle() {
      kutu.dataset.asama = 'dinle'; yazi.textContent = 'Dinleniyor…';
      return gsap.to(cubuklar, {
        scaleY: function () { return 0.18 + Math.random() * 0.82; },
        duration: 0.28, ease: 'sine.inOut', stagger: { each: 0.012, from: 'center' },
        repeat: 2, repeatRefresh: true, yoyo: true
      });
    }

    var tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4, paused: true });
    tl.call(function () {
      // Her turun başında durum yazısı da sıfırlanır
      kutu.dataset.asama = 'dinle'; yazi.textContent = 'Dinleniyor…';
      gsap.set([sonuc, plaka, musabih], { autoAlpha: 0 });
      gsap.set(dalga, { autoAlpha: 1 });
      gsap.set(kelimeEl, { autoAlpha: 0, y: 14, filter: 'blur(6px)' });
      gsap.set(cubuklar, { scaleY: 0.12 });
    })
      .add(dinle())
      .call(function () { kutu.dataset.asama = 'analiz'; yazi.textContent = 'Analiz ediliyor…'; })
      .to(cubuklar, { scaleY: 0.05, duration: 0.5, ease: 'expo.out', stagger: { each: 0.008, from: 'edges' } })
      .to(dalga, { autoAlpha: 0, duration: 0.3, ease: 'power2.out' }, '+=0.2')
      .call(function () { kutu.dataset.asama = 'sonuc'; yazi.textContent = 'Bulundu'; })
      .set(sonuc, { autoAlpha: 1 })
      // Arapça sağdan sola okunur: ilk kelime ilk belirir
      .to(kelimeEl, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.6, ease: 'expo.out', stagger: 0.16 })
      .fromTo(plaka, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' }, '-=0.3')
      .fromTo(musabih, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' }, '-=0.35')
      .to({}, { duration: 2.6 })
      .to([sonuc, plaka, musabih], { autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' });

    // Yalnızca ekrandayken oynasın
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { e[0].isIntersecting ? tl.play() : tl.pause(); }, { threshold: 0.25 }).observe(kutu);
    } else { tl.play(); }
  })();

  /* ── 3. Sayfadan inen devre izi + bölümlerin girişi ─────── */
  (function () {
    var sar = document.querySelector('.akis-sar');
    var iz = document.getElementById('iz');
    if (!sar || !iz) return;
    var dolu = document.getElementById('iz-dolu'), izIc = dolu.querySelector('svg');
    var cizgi = dolu.querySelector('.iz-cizgi'), golge = iz.querySelector('.iz-golge');
    var adimlar = Array.prototype.slice.call(sar.querySelectorAll('.adim'));

    // Düğümlerden geçen, aralarda küçük devre kırılımları yapan iz
    // Konumlar offsetTop ile ölçülür: giriş animasyonlarının kaydırmaları (transform) ölçümü bozmaz
    function ustUzaklik(el, kok) {
      var y = 0;
      while (el && el !== kok) { y += el.offsetTop; el = el.offsetParent; }
      return y;
    }
    function yolKur() {
      var yukseklik = sar.offsetHeight;
      var ust = 0, x = 12, d = '';
      [iz, izIc].forEach(function (s) {
        s.setAttribute('viewBox', '0 0 24 ' + Math.round(yukseklik));
        s.style.height = yukseklik + 'px';
      });
      dolu.style.height = yukseklik + 'px';
      adimlar.forEach(function (a, i) {
        // Düğüm, başlığın ilk satırının ortasına hizalanır
        var h3 = a.querySelector('h3');
        var satir = Math.min(h3.offsetHeight, parseFloat(getComputedStyle(h3).lineHeight) || h3.offsetHeight);
        var dugum = ustUzaklik(h3, a) + satir / 2 - 5.5;
        a.style.setProperty('--dugum-y', dugum + 'px');
        var y = ustUzaklik(a, sar) + dugum + 5.5;
        if (i === 0) { d = 'M' + x + ' ' + Math.max(0, y - 40) + ' L' + x + ' ' + y; }
        else {
          var orta = (ust + y) / 2, kay = (i % 2 ? 7 : -7);
          d += ' L' + x + ' ' + (orta - 14) + ' L' + (x + kay) + ' ' + (orta - 7) + ' L' + (x + kay) + ' ' + (orta + 7) + ' L' + x + ' ' + (orta + 14) + ' L' + x + ' ' + y;
        }
        ust = y;
      });
      d += ' L' + x + ' ' + (ust + 60);
      cizgi.setAttribute('d', d); golge.setAttribute('d', d);
      doldur();
    }

    // İzin ucu ekranın %70 hizasında durur; kaydırmaya doğrudan bağlı, gecikmesiz.
    // Yalnız transform değişir; kaydırırken hiçbir şey yeniden boyanmaz.
    var cizimBekliyor = false;
    function doldur() {
      cizimBekliyor = false;
      // Dış kutu yukarı kayar, içteki çizim aynı kadar aşağı: görünen kısım 0..dolan
      var h = sar.offsetHeight;
      var dolan = azHareket ? h : Math.max(0, Math.min(h, window.innerHeight * 0.7 - sar.getBoundingClientRect().top));
      dolu.style.transform = 'translate3d(0,' + (dolan - h) + 'px,0)';
      izIc.style.transform = 'translate3d(0,' + (h - dolan) + 'px,0)';
    }
    window.addEventListener('scroll', function () {
      if (!cizimBekliyor) { cizimBekliyor = true; requestAnimationFrame(doldur); }
    }, { passive: true });
    var canli = false;
    yolKur();
    // Yazı tipi, görseller ya da günün ayeti yüklenip sayfa uzadıkça iz yeniden kurulur
    // Telefonda adres çubuğu açılıp kapandıkça 'resize' gelir ama liste değişmez; o zaman
    // hiçbir şey yeniden hesaplanmaz (kaydırma sırasında takılmanın sebebi buydu).
    // ScrollTrigger.refresh() parmak kaydırırken çalışırsa (özellikle iPhone) sayfayı eski
    // konuma geri atar. Bu yüzden yenileme, kullanıcı kaydırmayı bırakana kadar bekletilir.
    var dokunuyor = false, sonKaydirma = 0, refreshZaman = 0;
    window.addEventListener('touchstart', function () { dokunuyor = true; }, { passive: true });
    window.addEventListener('touchend', function () { dokunuyor = false; sonKaydirma = performance.now(); }, { passive: true });
    window.addEventListener('touchcancel', function () { dokunuyor = false; }, { passive: true });
    window.addEventListener('scroll', function () { sonKaydirma = performance.now(); }, { passive: true });
    function sakinkenYenile() {
      if (!canli) return;
      clearTimeout(refreshZaman);
      (function dene() {
        if (dokunuyor || performance.now() - sonKaydirma < 300) { refreshZaman = setTimeout(dene, 200); return; }
        window.ScrollTrigger.refresh();
      })();
    }
    var bekleyen = 0, sonEn = sar.offsetWidth, sonBoy = sar.offsetHeight;
    function yenile() {
      cancelAnimationFrame(bekleyen);
      bekleyen = requestAnimationFrame(function () {
        var en = sar.offsetWidth, boy = sar.offsetHeight;
        if (en === sonEn && boy === sonBoy) return;
        sonEn = en; sonBoy = boy;
        yolKur();
        sakinkenYenile();
      });
    }
    if ('ResizeObserver' in window) new ResizeObserver(yenile).observe(sar);
    else window.addEventListener('resize', yenile);
    // Yazı tipleri/görseller bitince listenin sayfadaki yeri değişmiş olabilir: tetikleyiciler
    // de güncellenmeli (ama yine kaydırma bitince)
    window.addEventListener('load', function () { yenile(); sakinkenYenile(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { yenile(); sakinkenYenile(); });
    if (azHareket || !gsap || !window.ScrollTrigger) return;
    canli = true;
    gsap.registerPlugin(window.ScrollTrigger);
    // Kendi kendine 'load' ve 'resize' anında yenilenmesin; yukarıdaki güvenli yol kullanılır
    window.ScrollTrigger.config({ autoRefreshEvents: 'visibilitychange,DOMContentLoaded', ignoreMobileResize: true });
    // Yalnız genişlik değişince (telefon yan çevrilince); adres çubuğu yüksekliği önemsiz
    var sonGenislik = window.innerWidth;
    window.addEventListener('resize', function () {
      if (window.innerWidth === sonGenislik) return;
      sonGenislik = window.innerWidth; sakinkenYenile();
    });

    // Her adım: metin ve görsel, ayrı ritimle
    adimlar.forEach(function (a) {
      var metin = a.querySelector('div:not(.gorsel)'), gorsel = a.querySelector('.gorsel');
      gsap.from(metin, { y: 28, autoAlpha: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: a, start: 'top 78%' } });
      gsap.from(gorsel, { y: 48, rotate: a.classList.contains('ters') ? -2 : 2, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: a, start: 'top 80%' } });
    });

    var kart = document.querySelector('.ayet-kart');
    if (kart) gsap.from(kart, { y: 36, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: kart, start: 'top 82%' } });
  })();
})();
