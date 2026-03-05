var playlist = [], currentTrackIndex = 0, isPlaying = false;
var audioEngine = document.getElementById("audioEngine") || new Audio();
var azanAudio = document.getElementById("azanAudio");
var lastPlayedMinute = ""; 

// SILENT WAKELOCK TO PREVENT OS SLEEP
var wakeLockAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
wakeLockAudio.loop = true;

window.bayanData = [];
window.bayanDisplayCount = 30;

function showToast(msg) {
    var t = document.getElementById("toastMsg");
    t.innerText = msg;
    t.className = "show";
    setTimeout(function(){ t.className = t.className.replace("show", ""); }, 5000);
}

function toggleMenu() {
    var links = document.getElementById("navLinks");
    if (links.className.indexOf("show") == -1) { links.className += " show"; } else { links.className = links.className.replace(" show", ""); }
}

if ('serviceWorker' in navigator) { navigator.serviceWorker.register('./sw.js').catch(e=>{}); }

var deferredPrompt;
window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault(); deferredPrompt = e;
    document.getElementById('installBox').style.display = 'block';
});

function installAppPrompt() {
    if(deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function(res) { document.getElementById('installBox').style.display = 'none'; deferredPrompt = null; });
    } else {
        alert("To Install:\n📱 Android: Chrome menu -> 'Add to Home Screen'\n🍎 iOS: Safari share menu -> 'Add to Home Screen'");
    }
}

function loadPortal(url) {
    showLoad(true);
    document.getElementById("portalIframe").src = url;
    setTimeout(() => { showLoad(false); }, 1500);
}

// ==========================================
// BAYANAT API
// ==========================================
async function fetchBayanatAPI() {
    var query = document.getElementById("alimSelect").value;
    showLoad(true);
    try {
        var res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=podcast&entity=podcastEpisode&limit=200`);
        var data = await res.json();
        window.bayanData = data.results.filter(item => item.episodeUrl); 
        window.bayanDisplayCount = 30; 
        renderBayanList();
    } catch(e) { showToast("Failed to load Bayanat."); }
    showLoad(false);
}

function renderBayanList() {
    var bSelect = document.getElementById("bayanSelect");
    bSelect.innerHTML = ""; 
    var limit = Math.min(window.bayanData.length, window.bayanDisplayCount);
    if(window.bayanData.length === 0) { bSelect.add(new Option("No Audio Found", "")); return; }
    for (var i = 0; i < limit; i++) { bSelect.add(new Option(window.bayanData[i].trackName || window.bayanData[i].collectionName, i)); }
    if (window.bayanData.length > window.bayanDisplayCount) { bSelect.add(new Option("⬇️ --- Load More Bayans --- ⬇️", "load_more")); }
}

function handleBayanSelect() {
    var val = document.getElementById("bayanSelect").value;
    if (val === 'load_more') {
        window.bayanDisplayCount += 30; 
        renderBayanList();
        document.getElementById("bayanSelect").value = window.bayanDisplayCount - 30; 
    }
}

function playBayan() {
    var index = document.getElementById("bayanSelect").value;
    if(index === 'load_more' || !window.bayanData[index]) return;
    var item = window.bayanData[index];
    document.getElementById("currentBayanTitle").innerText = item.trackName;
    var player = document.getElementById("bayanPlayer");
    player.src = item.episodeUrl;
    player.play().catch(e => showToast("Audio restricted by provider."));
}

// ==========================================
// 6 KALIMAS & HUGE DUAS COLLECTION
// ==========================================
var kalimaData = [
    {title: "1. Kalima Tayyibah", ar: "لَا إِلٰهَ إِلَّا اللهُ مُحَمَّدٌ رَسُولُ اللهِ", ur: "اللہ کے سوا کوئی معبود نہیں، محمد (صلی اللہ علیہ وسلم) اللہ کے رسول ہیں۔"},
    {title: "2. Kalima Shahadah", ar: "أَشْهَدُ أَنْ لَّا إِلٰهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ", ur: "میں گواہی دیتا ہوں کہ اللہ کے سوا کوئی عبادت کے لائق نہیں، اور میں گواہی دیتا ہوں کہ محمد ﷺ اس کے بندے اور رسول ہیں۔"},
    {title: "3. Kalima Tamjeed", ar: "سُبْحَانَ اللهِ وَالْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا اللهُ وَاللهُ أَكْبَرُ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ", ur: "اللہ پاک ہے اور سب تعریف اللہ ہی کے لیے ہے، اور اللہ بہت بڑا ہے۔"},
    {title: "4. Kalima Tauheed", ar: "لَا إِلٰهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ", ur: "اللہ کے سوا کوئی معبود نہیں وہ اکیلا ہے، بادشاہی اسی کی ہے اور اسی کے لیے تعریف ہے۔"},
    {title: "5. Kalima Astaghfar", ar: "أَسْتَغْفِرُ اللهَ رَبِّي مِنْ كُلِّ ذَنْبٍ أَذْنَبْتُهُ عَمَدًا أَوْ خَطَأً", ur: "میں اللہ سے اپنے تمام گناہوں کی معافی مانگتا ہوں جو میں نے جان بوجھ کر یا بھول کر کیے۔"},
    {title: "6. Kalima Rad-e-Kufr", ar: "اَللّٰهُمَّ اِنِّيْ أَعُوْذُ بِكَ مِنْ أَنْ أُشْرِكَ بِكَ شَيْئًا وَأَنَا أَعْلَمُ بِهِ", ur: "اے اللہ! میں تیری پناہ مانگتا ہوں اس بات سے کہ میں جان بوجھ کر کسی کو تیرا شریک ٹھہراؤں۔"}
];

var dailyDuas = [
    {title:"⭐ Qunoot-e-Nazila", ar:"اللَّهُمَّ إِنَّا نَسْتَعِينُكَ وَنَسْتَغْفِرُكَ وَنُؤْمِنُ بِكَ وَنَتَوَكَّلُ عَلَيْكَ وَنُثْنِي عَلَيْكَ الْخَيْرَ، وَنَشْكُرُكَ وَلَا نَكْفُرُكَ، وَنَخْلَعُ وَنَتْرُكُ مَنْ يَّفْجُرُكَ", ur:"اے اللہ! ہم تجھ سے مدد مانگتے ہیں، اور تجھ سے بخشش طلب کرتے ہیں، تجھ پر ایمان لاتے ہیں، تجھ پر بھروسہ کرتے ہیں اور تیری بہترین تعریف کرتے ہیں، اور ہم تیرا شکر ادا کرتے ہیں اور تیری ناشکری نہیں کرتے..." },
    {title:"Namaz-e-Fajr ke baad ki Dua", ar:"اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا", ur:"اے اللہ! میں تجھ سے نفع بخش علم، پاکیزہ رزق اور قبول ہونے والے عمل کا سوال کرتا ہوں۔"},
    {title:"Ghar se Nikalne ki Dua", ar:"بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", ur:"اللہ کے نام سے، میں نے اللہ پر بھروسہ کیا، اور گناہوں سے بچنے کی طاقت اور نیکی کرنے کی قوت اللہ ہی کی توفیق سے ہے۔"},
    {title:"Masjid mein Dakhil hone ki Dua", ar:"اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", ur:"اے اللہ! میرے لیے اپنی رحمت کے دروازے کھول دے۔"},
    {title:"Masjid se Nikalne ki Dua", ar:"اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ", ur:"اے اللہ! میں تجھ سے تیرے فضل کا سوال کرتا ہوں۔"},
    {title:"Bimari aur Takleef ki Dua", ar:"أَذْهِبِ الْبَاسَ رَبَّ النَّاسِ، اشْفِ وَأَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ", ur:"اے لوگوں کے رب! اس بیماری کو دور فرما، شفا دے تو ہی شفا دینے والا ہے، تیری شفا کے سوا کوئی شفا نہیں۔"},
    {title:"Safar ki Dua", ar:"سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ", ur:"پاک ہے وہ ذات جس نے اس (سواری) کو ہمارے تابع کر دیا حالانکہ ہم اسے قابو میں لانے والے نہ تھے۔"},
    {title:"So Kar Uthne ki Dua", ar:"الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", ur:"سب تعریف اللہ کے لیے ہے جس نے ہمیں مارنے کے بعد زندہ کیا اور اسی کی طرف اٹھ کر جانا ہے۔"},
    {title:"Sone se Pehle ki Dua", ar:"اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا", ur:"اے اللہ! میں تیرے ہی نام کے ساتھ مرتا (سوتا) اور جیتا (جاگتا) ہوں۔"}
];

function renderKalimaAndDuas() {
    var kHtml = "";
    kalimaData.forEach(k => {
        kHtml += `<div class="dua-card"><h4 style="color:#b33939; margin-top:0;">${k.title}</h4><p class="arabic-text" style="font-size:28px;">${k.ar}</p><p class="urdu-font">${k.ur}</p></div>`;
    });
    document.getElementById("kalimaContainer").innerHTML = kHtml;

    var dHtml = "";
    dailyDuas.forEach(d => {
        dHtml += `<div class="dua-card"><h4 style="color:#b33939; margin-top:0;">${d.title}</h4><p class="arabic-text" style="color:#000;">${d.ar}</p><p class="urdu-font">${d.ur}</p></div>`;
    });
    document.getElementById("duasContainer").innerHTML = dHtml;
}

// ==========================================
// 99 NAMES OF ALLAH & MUHAMMAD (PBUH)
// ==========================================
var allahNames = [
    {ar:"ٱلْرَّحْمَـانُ", ur:"بڑا مہربان"}, {ar:"ٱلْرَّحِيْمُ", ur:"نہایت رحم والا"}, {ar:"ٱلْمَلِكُ", ur:"بادشاہ"}, {ar:"ٱلْقُدُّوسُ", ur:"پاک ذات"},
    {ar:"ٱلْسَّلَامُ", ur:"سلامتی دینے والا"}, {ar:"ٱلْمُؤْمِنُ", ur:"امن دینے والا"}, {ar:"ٱلْمُهَيْمِنُ", ur:"نگہبان"}, {ar:"ٱلْعَزِيزُ", ur:"غالب"},
    {ar:"ٱلْجَبَّارُ", ur:"زبردست"}, {ar:"ٱلْمُتَكَبِّرُ", ur:"بڑائی والا"}, {ar:"ٱلْخَالِقُ", ur:"پیدا کرنے والا"}, {ar:"ٱلْبَارِئُ", ur:"جان ڈالنے والا"},
    {ar:"ٱلْمُصَوِّرُ", ur:"صورت بنانے والا"}, {ar:"ٱلْغَفَّارُ", ur:"بڑا بخشنے والا"}, {ar:"ٱلْقَهَّارُ", ur:"سب پر غالب"}, {ar:"ٱلْوَهَّابُ", ur:"سب کچھ دینے والا"},
    {ar:"ٱلْرَّزَّاقُ", ur:"روزی دینے والا"}, {ar:"ٱلْفَتَّاحُ", ur:"دروازے کھولنے والا"}, {ar:"ٱلْعَلِيمُ", ur:"سب کچھ جاننے والا"}, {ar:"ٱلْقَابِضُ", ur:"روزی تنگ کرنے والا"},
    {ar:"ٱلْبَاسِطُ", ur:"روزی کشادہ کرنے والا"}, {ar:"ٱلْخَافِضُ", ur:"پست کرنے والا"}, {ar:"ٱلْرَّافِعُ", ur:"بلند کرنے والا"}, {ar:"ٱلْمُعِزُّ", ur:"عزت دینے والا"},
    {ar:"ٱلْمُذِلُّ", ur:"ذلت دینے والا"}, {ar:"ٱلْسَّمِيعُ", ur:"سب کچھ سننے والا"}, {ar:"ٱلْبَصِيرُ", ur:"سب کچھ دیکھنے والا"}, {ar:"ٱلْحَكَمُ", ur:"فیصلہ کرنے والا"},
    {ar:"ٱلْعَدْلُ", ur:"انصاف کرنے والا"}, {ar:"ٱلْلَّطِيفُ", ur:"لطف و کرم کرنے والا"}, {ar:"ٱلْخَبِيرُ", ur:"باخبر"}, {ar:"ٱلْحَلِيمُ", ur:"بردبار"},
    {ar:"ٱلْعَظِيمُ", ur:"بزرگی والا"}, {ar:"ٱلْغَفُورُ", ur:"بخشنے والا"}, {ar:"ٱلْشَّكُورُ", ur:"قدردان"}, {ar:"ٱلْعَلِيُّ", ur:"بلند و بالا"},
    {ar:"ٱلْكَبِيرُ", ur:"بہت بڑا"}, {ar:"ٱلْحَفِيظُ", ur:"حفاظت کرنے والا"}, {ar:"ٱلْمُقِيتُ", ur:"قوت دینے والا"}, {ar:"ٱلْحَسِيبُ", ur:"حساب لینے والا"},
    {ar:"ٱلْجَلِيلُ", ur:"بزرگ"}, {ar:"ٱلْكَرِيمُ", ur:"کرم کرنے والا"}, {ar:"ٱلْرَّقِيبُ", ur:"نگہبان"}, {ar:"ٱلْمُجِيبُ", ur:"دعا قبول کرنے والا"},
    {ar:"ٱلْوَاسِعُ", ur:"وسعت والا"}, {ar:"ٱلْحَكِيمُ", ur:"حکمت والا"}, {ar:"ٱلْوَدُودُ", ur:"محبت کرنے والا"}, {ar:"ٱلْمَجِيدُ", ur:"بزرگی والا"},
    {ar:"ٱلْبَاعِثُ", ur:"اٹھانے والا"}, {ar:"ٱلْشَّهِيدُ", ur:"حاضر"}, {ar:"ٱلْحَقُّ", ur:"سچا"}, {ar:"ٱلْوَكِيلُ", ur:"کارساز"},
    {ar:"ٱلْقَوِيُّ", ur:"طاقتور"}, {ar:"ٱلْمَتِينُ", ur:"مضبوط"}, {ar:"ٱلْوَلِيُّ", ur:"دوست"}, {ar:"ٱلْحَمِيدُ", ur:"تعریف کے لائق"},
    {ar:"ٱلْمُحْصِي", ur:"شمار کرنے والا"}, {ar:"ٱلْمُبْدِئُ", ur:"پہلی بار پیدا کرنے والا"}, {ar:"ٱلْمُعِيدُ", ur:"دوبارہ پیدا کرنے والا"}, {ar:"ٱلْمُحْيِي", ur:"زندہ کرنے والا"},
    {ar:"ٱلْمُمِيتُ", ur:"موت دینے والا"}, {ar:"ٱلْحَيُّ", ur:"ہمیشہ زندہ رہنے والا"}, {ar:"ٱلْقَيُّومُ", ur:"سب کو قائم رکھنے والا"}, {ar:"ٱلْوَاجِدُ", ur:"پانے والا"},
    {ar:"ٱلْمَاجِدُ", ur:"بزرگی والا"}, {ar:"ٱلْوَاحِدُ", ur:"ایک"}, {ar:"ٱلْأَحَد", ur:"اکیلا"}, {ar:"ٱلْصَّمَدُ", ur:"بے نیاز"},
    {ar:"ٱلْقَادِرُ", ur:"قدرت والا"}, {ar:"ٱلْمُقْتَدِرُ", ur:"کامل قدرت والا"}, {ar:"ٱلْمُقَدِّمُ", ur:"آگے کرنے والا"}, {ar:"ٱلْمُؤَخِّرُ", ur:"پیچھے کرنے والا"},
    {ar:"ٱلْأَوَّلُ", ur:"سب سے پہلا"}, {ar:"ٱلْآخِرُ", ur:"سب سے آخری"}, {ar:"ٱلْظَّاهِرُ", ur:"ظاہر"}, {ar:"ٱلْبَاطِنُ", ur:"پوشیدہ"},
    {ar:"ٱلْوَالِي", ur:"مالک"}, {ar:"ٱلْمُتَعَالِي", ur:"بلند و برتر"}, {ar:"ٱلْبَرُّ", ur:"بھلائی کرنے والا"}, {ar:"ٱلْتَّوَّابُ", ur:"توبہ قبول کرنے والا"},
    {ar:"ٱلْمُنْتَقِمُ", ur:"بدلہ لینے والا"}, {ar:"ٱلْعَفُوُّ", ur:"معاف کرنے والا"}, {ar:"ٱلْرَّءُوفُ", ur:"بہت مہربان"}, {ar:"مَالِكُ ٱلْمُلْكِ", ur:"تمام ملک کا مالک"},
    {ar:"ذُو ٱلْجَلَالِ وَٱلْإِكْرَامِ", ur:"جلال اور انعام والا"}, {ar:"ٱلْمُقْسِطُ", ur:"انصاف کرنے والا"}, {ar:"ٱلْجَامِعُ", ur:"جمع کرنے والا"}, {ar:"ٱلْغَنِيُّ", ur:"بے نیاز"},
    {ar:"ٱلْمُغْنِي", ur:"غنی کرنے والا"}, {ar:"ٱلْمَانِعُ", ur:"روکنے والا"}, {ar:"ٱلْضَّارُّ", ur:"نقصان پہنچانے والا"}, {ar:"ٱلْنَّافِعُ", ur:"نفع پہنچانے والا"},
    {ar:"ٱلْنُّورُ", ur:"روشن کرنے والا"}, {ar:"ٱلْهَادِي", ur:"ہدایت دینے والا"}, {ar:"ٱلْبَدِيعُ", ur:"نئی طرح پیدا کرنے والا"}, {ar:"ٱلْبَاقِي", ur:"باقی رہنے والا"},
    {ar:"ٱلْوَارِثُ", ur:"سب کا وارث"}, {ar:"ٱلْرَّشِيدُ", ur:"رہنمائی کرنے والا"}, {ar:"ٱلْصَّبُورُ", ur:"صبر کرنے والا"}
];

var prophetNames = [
    {ar:"مُحَمَّدٌ", ur:"بہت تعریف کیا گیا"}, {ar:"أَحْمَدُ", ur:"سب سے زیادہ تعریف کرنے والا"}, {ar:"حَامِدٌ", ur:"اللہ کی تعریف کرنے والا"}, {ar:"مَحْمُودٌ", ur:"جس کی تعریف کی گئی ہو"},
    {ar:"قَاسِمٌ", ur:"تقسیم کرنے والا"}, {ar:"عَاقِبٌ", ur:"سب سے آخر میں آنے والا"}, {ar:"فَاتِحٌ", ur:"فتح کرنے والا"}, {ar:"شَاهِدٌ", ur:"گواہی دینے والا"},
    {ar:"حَاشِرٌ", ur:"جمع کرنے والا"}, {ar:"رَشِيدٌ", ur:"ہدایت یافتہ"}, {ar:"مَشْهُودٌ", ur:"جس کی گواہی دی گئی"}, {ar:"بَشِيرٌ", ur:"خوشخبری دینے والا"},
    {ar:"نَذِيرٌ", ur:"ڈرانے والا"}, {ar:"دَاعٍ", ur:"بلانے والا"}, {ar:"شَافٍ", ur:"شفا دینے والا"}, {ar:"هَادٍ", ur:"ہدایت دینے والا"},
    {ar:"مَهْدِيٌّ", ur:"ہدایت یافتہ"}, {ar:"مَاحٍ", ur:"کفر مٹانے والا"}, {ar:"مُنْجٍ", ur:"نجات دلانے والا"}, {ar:"نَاهٍ", ur:"منع کرنے والا"},
    {ar:"رَسُولٌ", ur:"پیغام پہنچانے والا"}, {ar:"نَبِيٌّ", ur:"غیب کی خبر دینے والا"}, {ar:"أُمِّيٌّ", ur:"ان پڑھ (جو کسی انسان سے نہ پڑھا ہو)"}, {ar:"تِهَامِيٌّ", ur:"تہامہ کا رہنے والا"},
    {ar:"هَاشِمِيٌّ", ur:"بنی ہاشم سے"}, {ar:"أَبْطَحِيٌّ", ur:"بطحاء (مکہ) والا"}, {ar:"عَزِيزٌ", ur:"غالب، عزت والا"}, {ar:"حَرِيصٌ", ur:"بھلائی چاہنے والا"},
    {ar:"رَءُوفٌ", ur:"بہت مہربان"}, {ar:"رَحِيمٌ", ur:"رحم کرنے والا"}, {ar:"طٰهٰ", ur:"طہٰ (قرآنی نام)"}, {ar:"يٰسٓ", ur:"یس (قرآنی نام)"}
    // Limited sample for optimization. Developer can expand further.
];

function renderNames(type) {
    document.getElementById("btnAllahNames").style.background = type === 'allah' ? "var(--gold)" : "transparent";
    document.getElementById("btnAllahNames").style.color = type === 'allah' ? "#000" : "var(--gold)";
    document.getElementById("btnProphetNames").style.background = type === 'prophet' ? "var(--gold)" : "transparent";
    document.getElementById("btnProphetNames").style.color = type === 'prophet' ? "#000" : "var(--gold)";

    var data = type === 'allah' ? allahNames : prophetNames;
    var html = "";
    data.forEach(n => {
        html += `<div class="widget-card" style="padding:15px;"><p class="arabic-text" style="font-size:28px; margin:0; color:var(--gold);">${n.ar}</p><p class="urdu-font" style="margin:5px 0 0 0; font-size:14px; border:none;">${n.ur}</p></div>`;
    });
    document.getElementById("namesContainer").innerHTML = html;
}

// ==========================================
// ZIKR O AZKAR
// ==========================================
var zikrData = [
    {ar: "سُبْحَانَ اللهِ", ur: "اللہ پاک ہے", count: "33 Times"},
    {ar: "اَلْحَمْدُ لِلّٰهِ", ur: "سب تعریف اللہ کے لیے ہے", count: "33 Times"},
    {ar: "اَللهُ أَكْبَرُ", ur: "اللہ سب سے بڑا ہے", count: "34 Times"},
    {ar: "أَسْتَغْفِرُ اللهَ", ur: "میں اللہ سے معافی مانگتا ہوں", count: "100 Times"},
    {ar: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ", ur: "گناہ سے بچنے اور نیکی کرنے کی طاقت اللہ ہی کی طرف سے ہے", count: "Daily"},
    {ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ", ur: "اللہ پاک ہے اور اسی کی تعریف ہے، اللہ پاک ہے جو بہت عظمت والا ہے", count: "100 Times"}
];

function renderZikr() {
    var html = "";
    zikrData.forEach(z => {
        html += `<div class="widget-card"><h3 style="color:#b33939; margin-top:0;">${z.count}</h3><p class="arabic-text" style="font-size:32px; margin:0;">${z.ar}</p><p class="urdu-font" style="border:none;">${z.ur}</p></div>`;
    });
    document.getElementById("zikrContainer").innerHTML = html;
}

// ==========================================
// INITIALIZATION
// ==========================================
setInterval(() => { document.getElementById("liveClock").innerText = new Date().toLocaleTimeString('en-US', { hour12: false }); }, 1000);

window.onload = async function() {
    try {
        renderKalimaAndDuas();
        renderNames('allah');
        renderZikr();
        fetchBayanatAPI(); 

        if (Notification.permission !== "granted" && Notification.permission !== "denied") { Notification.requestPermission(); }

        var arRes = await fetch('https://api.alquran.cloud/v1/edition?format=audio&language=ar');
        var arData = await arRes.json();
        var arSelect = document.getElementById("arReciter");
        arData.data.forEach(ed => {
            var opt = new Option(ed.englishName, ed.identifier);
            if(ed.identifier === 'ar.abdurrahmaansudais') { opt.selected = true; opt.text = "⭐ " + opt.text + " (Sudais)"; }
            arSelect.add(opt);
        });
        document.getElementById("splashQuote").innerText = '"App is Ready."';
        document.getElementById("enterBtn").style.display = "block";
    } catch(e) { document.getElementById("splashQuote").innerText = "Network Issue. Basic features will work."; document.getElementById("enterBtn").style.display = "block"; }
};

function startApp() {
    document.getElementById("splashScreen").style.display = "none";
    azanAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    azanAudio.play().catch(e=>{});
    loadSettings();
    setInterval(checkAlarms, 60000); 
}

function switchTab(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById("navLinks").classList.remove("show"); 
}

var showLoad = function(show) { document.getElementById("loading").style.display = show ? "block" : "none"; };

// ==========================================
// TIMINGS, IFTAR, AND DEFAULT ALARMS ON
// ==========================================
function saveSettings() {
    localStorage.setItem("city", document.getElementById("cityName").value);
    localStorage.setItem("country", document.getElementById("countryName").value);
    localStorage.setItem("voice", document.getElementById("azanVoice").value);
    ["timeFajr", "timeDhuhr", "timeAsr", "timeMaghrib", "timeIsha", "timeJummah"].forEach(id => localStorage.setItem(id, document.getElementById(id).value));
    ["toggleFajr", "toggleDhuhr", "toggleAsr", "toggleMaghrib", "toggleIsha", "toggleJummah"].forEach(id => localStorage.setItem(id, document.getElementById(id).checked));
}

function loadSettings() {
    // DEFAULT ALARMS ON FIX
    if(localStorage.getItem("appInstalledOnce") !== "true") {
        ["toggleFajr", "toggleDhuhr", "toggleAsr", "toggleMaghrib", "toggleIsha", "toggleJummah"].forEach(id => localStorage.setItem(id, "true"));
        localStorage.setItem("appInstalledOnce", "true");
    }

    if(localStorage.getItem("city")) {
        document.getElementById("cityName").value = localStorage.getItem("city");
        document.getElementById("countryName").value = localStorage.getItem("country");
        document.getElementById("azanVoice").value = localStorage.getItem("voice");
        ["timeFajr", "timeDhuhr", "timeAsr", "timeMaghrib", "timeIsha", "timeJummah"].forEach(id => { if(localStorage.getItem(id)) document.getElementById(id).value = localStorage.getItem(id); });
        ["toggleFajr", "toggleDhuhr", "toggleAsr", "toggleMaghrib", "toggleIsha", "toggleJummah"].forEach(id => { if(localStorage.getItem(id) !== null) document.getElementById(id).checked = (localStorage.getItem(id) === "true"); });
        fetchPrayerTimes(false); 
    } else { fetchPrayerTimes(true); } 
}

async function fetchPrayerTimes(forceOverwrite) {
    showLoad(true);
    var city = document.getElementById("cityName").value, country = document.getElementById("countryName").value;
    try {
        var res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=1`);
        var data = await res.json();
        document.getElementById("hijriDateDisplay").innerText = data.data.date.hijri.date + " " + data.data.date.hijri.month.en + " " + data.data.date.hijri.year + " AH";

        document.getElementById("sehriTime").innerText = data.data.timings.Imsak;
        document.getElementById("iftaarTime").innerText = data.data.timings.Maghrib;

        if(forceOverwrite) {
            var t = data.data.timings;
            document.getElementById("timeFajr").value = t.Fajr;
            document.getElementById("timeDhuhr").value = t.Dhuhr;
            document.getElementById("timeAsr").value = t.Asr;
            document.getElementById("timeMaghrib").value = t.Maghrib;
            document.getElementById("timeIsha").value = t.Isha;
            document.getElementById("timeJummah").value = t.Dhuhr;
            saveSettings();
        }

        var d = new Date();
        var calRes = await fetch(`https://api.aladhan.com/v1/calendarByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=1&month=${d.getMonth()+1}&year=${d.getFullYear()}`);
        var calData = await calRes.json();
        var html = "<tr><th>Gregorian</th><th>Hijri Date</th><th>Day</th></tr>";
        var todayStr = String(d.getDate()).padStart(2, '0');
        calData.data.forEach(day => {
            var isToday = (day.date.gregorian.day === todayStr) ? "today-cell" : "";
            html += `<tr class="${isToday}"><td>${day.date.gregorian.date}</td><td>${day.date.hijri.date} ${day.date.hijri.month.en}</td><td>${day.date.gregorian.weekday.en}</td></tr>`;
        });
        document.getElementById("calendarTable").innerHTML = html;
    } catch(e) { showToast("Location Not Found."); }
    showLoad(false);
}

function padZero(n) { return (n < 10 ? '0' : '') + n; }

function checkAlarms() {
    var now = new Date();
    var cur = padZero(now.getHours()) + ":" + padZero(now.getMinutes());
    var day = now.getDay(); 
    
    var prayers = [
        {name: "Fajr", timeId: "timeFajr", toggleId: "toggleFajr"},
        {name: "Asr", timeId: "timeAsr", toggleId: "toggleAsr"},
        {name: "Maghrib", timeId: "timeMaghrib", toggleId: "toggleMaghrib"},
        {name: "Isha", timeId: "timeIsha", toggleId: "toggleIsha"}
    ];
    if (day === 5) { prayers.push({name: "Jumu'ah", timeId: "timeJummah", toggleId: "toggleJummah"}); } 
    else { prayers.push({name: "Dhuhr", timeId: "timeDhuhr", toggleId: "toggleDhuhr"}); }

    prayers.forEach(p => {
        var pTime = document.getElementById(p.timeId).value;
        var isEnabled = document.getElementById(p.toggleId).checked;
        if(isEnabled && pTime === cur && lastPlayedMinute !== cur) { 
            triggerAzan(p.name); 
            lastPlayedMinute = cur;
        }
    });
}

function triggerAzan(name) {
    azanAudio.src = document.getElementById("azanVoice").value; 
    audioEngine.pause(); 
    azanAudio.play().catch(e => console.log("Audio Blocked")); 
    showToast("🕌 Azan Time: " + name); 

    // WAKE APP IN BACKGROUND USING PUSH NOTIFICATION
    if (Notification.permission === "granted") {
        navigator.serviceWorker.ready.then(function(registration) {
            registration.showNotification("🕌 Azan Time: " + name, {
                body: "It is time for " + name + " prayer.",
                icon: "https://cdn-icons-png.flaticon.com/512/3073/3073860.png",
                vibrate: [200, 100, 200, 100, 200],
                requireInteraction: true
            });
        });
    }
}

// ==========================================
// QURAN ENGINE
// ==========================================
var padNum = function(num) { return num.toString().padStart(3, '0'); };
var toArabicNum = function(num) { return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]); };

async function loadSurah() {
    var mode = document.getElementById("readMode").value; 
    var num = document.getElementById("readNumber").value;
    var r = document.getElementById("arReciter").value;
    var l = document.getElementById("textLang").value;
    var u = document.getElementById("urReciter").value;
    
    if(num < 1) return;
    
    showLoad(true); document.getElementById("quranContainer").style.display = "none";
    audioEngine.pause(); playlist = []; currentTrackIndex = 0; isPlaying = false;
    document.getElementById("playBtn").innerHTML = '<i class="fas fa-play-circle"></i>';

    try {
        var resAr = await fetch(`https://api.alquran.cloud/v1/${mode}/${num}/${r}`);
        var dataAr = await resAr.json();
        if(dataAr.code !== 200) throw new Error("API Limit"); 

        var resTr = await fetch(`https://api.alquran.cloud/v1/${mode}/${num}/${l}`);
        var dataTr = await resTr.json();

        var ayahsAr = mode === 'ayah' ? [dataAr.data] : dataAr.data.ayahs;
        var ayahsTr = mode === 'ayah' ? [dataTr.data] : dataTr.data.ayahs;

        var titleText = "";
        if (mode === 'surah') { titleText = 'سُورَة ' + dataAr.data.name.replace('سُورَةُ ', ''); } 
        else if (mode === 'ruku') { titleText = 'رُكُوع ' + num + ' - ' + ayahsAr[0].surah.name; } 
        else if (mode === 'ayah') { titleText = 'آيَة ' + num + ' - ' + dataAr.data.surah.name; }

        var isRTL = l.includes('ur.') || l.includes('ar.') || l.includes('fa.');
        var html = "";
        var ayahsPerPage = 6; 
        
        for (var i = 0; i < ayahsAr.length; i += ayahsPerPage) {
            var chunkAr = ayahsAr.slice(i, i + ayahsPerPage);
            html += `<div class="mushaf-frame"><div class="mushaf-inner">`;
            if(i === 0) { html += `<h2 class="surah-title">${titleText}</h2>`; }

            chunkAr.forEach((ayah, j) => {
                var globalIndex = i + j;
                var sNum = mode === 'surah' ? num : (ayah.surah ? ayah.surah.number : 1);
                var aNum = ayah.numberInSurah;

                html += `<div class="ayah-row" id="ayah-${sNum}-${aNum}">
                            <div class="arabic-text">${ayah.text} <span class="ayah-marker">۝${toArabicNum(aNum)}</span></div>
                            <div class="urdu-font" style="direction:${isRTL ? 'rtl' : 'ltr'}">${ayahsTr[globalIndex].text}</div>
                         </div>`;
            });
            html += `</div></div>`;
        }

        document.getElementById("quranContainer").innerHTML = html;
        document.getElementById("quranContainer").style.display = "block";
        document.getElementById("playerTitle").innerText = `${mode.toUpperCase()} Loaded successfully.`;

        ayahsAr.forEach(ayah => {
            var sNum = mode === 'surah' ? num : (ayah.surah ? ayah.surah.number : 1);
            playlist.push({ url: ayah.audio, num: ayah.numberInSurah, type: 'Arabic', id: `ayah-${sNum}-${ayah.numberInSurah}` });
        });

        if(u !== 'none') {
            ayahsAr.forEach(ayah => {
                var sNum = mode === 'surah' ? num : (ayah.surah ? ayah.surah.number : 1);
                playlist.push({ url: `https://everyayah.com/data/${u}/${padNum(sNum)}${padNum(ayah.numberInSurah)}.mp3`, num: ayah.numberInSurah, type: 'Translation', id: `ayah-${sNum}-${ayah.numberInSurah}` });
            });
        }

    } catch(e) { showToast("Error! Check Number."); }
    showLoad(false);
}

function togglePlay() {
    if(!playlist.length) return;
    if(isPlaying) { 
        audioEngine.pause(); wakeLockAudio.pause(); isPlaying = false; 
        document.getElementById("playBtn").innerHTML = '<i class="fas fa-play-circle"></i>'; 
    } else { playTrack(); }
}

function playTrack() {
    if (currentTrackIndex >= playlist.length) { 
        isPlaying = false; currentTrackIndex = 0; wakeLockAudio.pause();
        document.getElementById("playBtn").innerHTML = '<i class="fas fa-play-circle"></i>'; 
        return; 
    }
    
    wakeLockAudio.play().catch(e=>{});
    var track = playlist[currentTrackIndex];
    audioEngine.src = track.url;
    var p = audioEngine.play();
    
    if(p !== undefined) {
        p.then(() => {
            isPlaying = true; 
            if (document.visibilityState === 'visible') {
                document.getElementById("playBtn").innerHTML = '<i class="fas fa-pause-circle"></i>';
                document.getElementById("playerTitle").innerText = `Playing: Ayah ${track.num} (${track.type})`;
                document.querySelectorAll('.ayah-row').forEach(el => el.classList.remove('playing-active'));
                var row = document.getElementById(track.id);
                if(row) { row.classList.add('playing-active'); row.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            }
        }).catch(e => { 
            isPlaying = false; 
            if(document.visibilityState === 'visible') { document.getElementById("playBtn").innerHTML = '<i class="fas fa-play-circle"></i>'; }
        });
    }
}

function skipTrack(dir) {
    if(!playlist.length) return; audioEngine.pause(); currentTrackIndex += dir;
    if(currentTrackIndex < 0) currentTrackIndex = 0;
    if(currentTrackIndex >= playlist.length) currentTrackIndex = playlist.length - 1;
    playTrack();
}

audioEngine.onerror = function() { currentTrackIndex++; if(currentTrackIndex < playlist.length) playTrack(); };
audioEngine.onended = function() { currentTrackIndex++; playTrack(); };

// ==========================================
// HADITH ENGINE 
// ==========================================
async function searchQuran() {
    var k = document.getElementById("searchKeyword").value, e = document.getElementById("searchEdition").value; 
    if(!k) return; showLoad(true); var div = document.getElementById("searchContent"); div.innerHTML = "";
    try {
        var res = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(k)}/all/${e}`);
        var data = await res.json();
        if (data.code === 200 && data.data.count > 0) {
            var html = `<p style='color:green;'>Found ${data.data.count} results</p>`;
            var isRTL = e.includes('ur.') || e.includes('ar.');
            data.data.matches.slice(0, 20).forEach(m => {
                html += `<div style="border-bottom:1px solid #ccc; padding:15px 0;"><b>${m.surah.englishName} [${m.surah.number}:${m.numberInSurah}]</b><br><span style="direction:${isRTL ? 'rtl' : 'ltr'}; display:block; font-size:22px; margin-top:5px; line-height:1.8;">${m.text}</span></div>`;
            });
            div.innerHTML = html;
        } else { div.innerHTML = 'No records found.'; }
    } catch(e) { div.innerHTML = 'Search Error.'; } showLoad(false);
}

async function loadHadith() {
    var b = document.getElementById("hadithBook").value, n = document.getElementById("hadithNumber").value;
    if(!n) return; showLoad(true); var div = document.getElementById("hadithContent"); div.innerHTML = "";
    
    try {
        var resAr = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-${b}/${n}.json`);
        if(!resAr.ok) throw new Error("Not Found");
        var arData = await resAr.json();
        var html = `<div class="arabic-text" style="font-size:30px; margin-bottom:15px; border:none;">${arData.hadiths[0].text}</div>`;

        try {
            var resEn = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${b}/${n}.json`); 
            if(resEn.ok) { var enData = await resEn.json(); html += `<hr><div style="font-size:18px; line-height:1.6; color:#222;"><b>English:</b> ${enData.hadiths[0].text}</div>`; }
        } catch(e) {}

        try {
            var resUr = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/urd-${b}/${n}.json`); 
            if(resUr.ok) { var urData = await resUr.json(); html += `<hr><div class="urdu-font" style="font-size:20px; line-height:1.8; color:#111;"><b>اردو:</b> ${urData.hadiths[0].text}</div>`; }
        } catch(e) {}

        try {
            var resHi = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/hin-${b}/${n}.json`); 
            if(resHi.ok) { var hiData = await resHi.json(); html += `<hr><div style="font-size:18px; line-height:1.6; color:#333;"><b>हिंदी:</b> ${hiData.hadiths[0].text}</div>`; }
        } catch(e) {}

        div.innerHTML = html;
    } catch(e) { div.innerHTML = '<span style="color:red;">Hadith not found in this book.</span>'; }
    showLoad(false);
}
