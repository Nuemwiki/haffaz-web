// Haffaz AI — haffaz.net
// Günün ayeti: uygulamayla aynı sunucudan (/gunun-ayeti) çekilir; ulaşılamazsa yerel yedek listeden seçilir.

(function () {
  var API = 'https://api.haffaz.net/gunun-ayeti';

  // Sunucu uykudaysa (ilk istek yavaş olabilir) gösterilecek yedek ayetler
  var YEDEK = [
    { text: 'Şüphesiz zorlukla birlikte kolaylık vardır.', ref: 'İnşirah Suresi, 5. Ayet', arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا' },
    { text: "Kalpler ancak Allah'ı anmakla huzur bulur.", ref: "Ra'd Suresi, 28. Ayet", arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ' },
    { text: 'Şüphesiz Allah sabredenlerle beraberdir.', ref: 'Bakara Suresi, 153. Ayet', arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ' },
    { text: "Kim Allah'a tevekkül ederse, O ona yeter.", ref: 'Talâk Suresi, 3. Ayet', arabic: 'وَمَنْ يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ' },
    { text: 'Rabbim! İlmimi artır.', ref: 'Tâhâ Suresi, 114. Ayet', arabic: 'رَبِّ زِدْنِي عِلْمًا' }
  ];

  var mevcut = null;
  var tarihEl = document.getElementById('ayet-tarih');
  var icerikEl = document.getElementById('ayet-icerik');

  try { document.getElementById('yil').textContent = String(new Date().getFullYear()); } catch (e) {}

  var bugun = new Date();
  tarihEl.textContent = bugun.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });

  // Sure başı ayetlerde metnin başındaki besmeleyi gösterme (Fâtiha 1. ayet besmelenin kendisidir)
  function besmelesiz(metin) {
    if (!metin) return '';
    var k = String(metin).trim().split(/\s+/);
    if (k.length <= 4) return metin;
    var sade = function (w) {
      return w.replace(/[ً-ٰٟـۖ-ۭ࣐-ࣿ]/g, '').replace(/[ٱأإآ]/g, 'ا');
    };
    var hedef = ['بسم', 'الله', 'الرحمن', 'الرحيم'];
    for (var i = 0; i < 4; i++) { if (sade(k[i]) !== hedef[i]) return metin; }
    return k.slice(4).join(' ');
  }

  function yaz(ayet) {
    mevcut = ayet;
    icerikEl.textContent = '';
    if (ayet.arabic) {
      var ar = document.createElement('p');
      ar.className = 'arapca';
      ar.lang = 'ar';
      ar.textContent = besmelesiz(ayet.arabic);
      icerikEl.appendChild(ar);
    }
    var meal = document.createElement('p');
    meal.className = 'meal';
    meal.textContent = '“' + ayet.text + '”';
    icerikEl.appendChild(meal);
    var kaynak = document.createElement('div');
    kaynak.className = 'kaynak';
    kaynak.textContent = ayet.ref || '';
    icerikEl.appendChild(kaynak);
  }

  function yedekSec() {
    var gun = Math.floor((bugun - new Date(bugun.getFullYear(), 0, 0)) / 86400000);
    return YEDEK[gun % YEDEK.length];
  }

  var bitti = false;
  // Sunucu 8 sn içinde cevap vermezse yedek ayet gösterilir; cevap sonra gelirse güncellenir
  var zamanlayici = setTimeout(function () { if (!bitti) yaz(yedekSec()); }, 8000);

  fetch(API, { headers: { Accept: 'application/json' } })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      if (!d || !d.text) throw new Error('bos');
      bitti = true;
      clearTimeout(zamanlayici);
      yaz({ text: d.text, ref: d.ref, arabic: d.arabic });
    })
    .catch(function () {
      bitti = true;
      clearTimeout(zamanlayici);
      yaz(yedekSec());
    });

  function metinOlustur() {
    if (!mevcut) return '';
    return (mevcut.arabic ? besmelesiz(mevcut.arabic) + '\n\n' : '') +
      '“' + mevcut.text + '”\n— ' + (mevcut.ref || '') + '\n\nHaffaz AI · haffaz.net';
  }

  function bildir(btn, yazi) {
    var eski = btn.textContent;
    btn.textContent = yazi;
    setTimeout(function () { btn.textContent = eski; }, 1600);
  }

  document.getElementById('ayet-kopyala').addEventListener('click', function () {
    var btn = this;
    var m = metinOlustur();
    if (!m) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(m).then(function () { bildir(btn, 'Kopyalandı ✓'); }, function () { bildir(btn, 'Kopyalanamadı'); });
    }
  });

  document.getElementById('ayet-paylas').addEventListener('click', function () {
    var btn = this;
    var m = metinOlustur();
    if (!m) return;
    if (navigator.share) {
      navigator.share({ title: 'Günün Ayeti — Haffaz AI', text: m, url: 'https://haffaz.net/#gunun-ayeti' }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(m).then(function () { bildir(btn, 'Kopyalandı ✓'); });
    }
  });
})();
