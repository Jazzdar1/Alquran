var playlist = [], currentTrackIndex = 0, isPlaying = false;
var audioEngine = document.getElementById("audioEngine") || new Audio();
var azanAudio = document.getElementById("azanAudio");
var lastPlayedMinute = ""; 
var wakeLockAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
wakeLockAudio.loop = true;

window.bayanData = [];
window.bayanDisplayCount = 30;
var globalDeferredPrompt;

function showToast(msg) {
    var t = document.getElementById("toastMsg");
    t.innerText = msg;
    t.className = "show";
    setTimeout(function(){ t.className = t.className.replace("show", ""); }, 5000);
}

// BULLET PROOF MOBILE MENU
function toggleMobileMenu() {
    var sidebar = document.getElementById("sidebar");
    var overlay = document.getElementById("sidebarOverlay");
    if(sidebar.className.includes("open")) {
        sidebar.className = sidebar.className.replace(" open", "");
        overlay.className = overlay.className.replace(" open", "");
    } else {
        sidebar.className += " open";
        overlay.className += " open";
    }
}
function toggleMenu() { toggleMobileMenu(); }

if ('serviceWorker' in navigator) { navigator.serviceWorker.register('./sw.js').catch(e=>{}); }

// APP INSTALL PROMPT
window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault(); 
    globalDeferredPrompt = e;
    document.getElementById('installBox').style.display = 'block';
    document.getElementById('topInstallBanner').style.display = 'block';
});

function installAppPrompt() {
    if(globalDeferredPrompt) {
        globalDeferredPrompt.prompt();
        globalDeferredPrompt.userChoice.then(function(res) { 
            document.getElementById('installBox').style.display = 'none'; 
            document.getElementById('topInstallBanner').style.display = 'none'; 
            globalDeferredPrompt = null; 
        });
    } else { 
        alert("To Install App:\n📱 Android Chrome: Tap Menu (3 dots) -> 'Add to Home Screen'\n🍎 iOS Safari: Tap Share Icon -> 'Add to Home Screen'"); 
    }
}

// ==========================================
// TALK BACK VOICE ENGINE
// ==========================================
if ('speechSynthesis' in window) { window.speechSynthesis.onvoiceschanged = function() { window.speechSynthesis.getVoices(); }; }

function speakArabic(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        var msg = new SpeechSynthesisUtterance();
        msg.text = text;
        msg.lang = 'ar-SA'; 
        msg.rate = 0.8; 
        msg.pitch = 1.0;
        
        var voices = window.speechSynthesis.getVoices();
        var arVoice = voices.find(v => v.lang.includes('ar'));
        if(arVoice) { msg.voice = arVoice; }

        window.speechSynthesis.speak(msg);
        showToast("🔊 Playing Arabic...");
    } else {
        showToast("TTS not supported on this browser.");
    }
}

// ==========================================
// FULL NOORANI QAIDA (3 STAGES)
// ==========================================
var qaidaStage1 = [{t:"أ", l:"Alif"},{t:"ب", l:"Baa"},{t:"ت", l:"Taa"},{t:"ث", l:"Saa"},{t:"ج", l:"Jeem"},{t:"ح", l:"Haa"},{t:"خ", l:"Khaa"},{t:"د", l:"Daal"},{t:"ذ", l:"Zaal"},{t:"ر", l:"Raa"},{t:"ز", l:"Zaa"},{t:"س", l:"Seen"},{t:"ش", l:"Sheen"},{t:"ص", l:"Swaad"},{t:"ض", l:"Zwaad"},{t:"ط", l:"Twaa"},{t:"ظ", l:"Zwaa"},{t:"ع", l:"Ain"},{t:"غ", l:"Ghayn"},{t:"ف", l:"Faa"},{t:"ق", l:"Qaaf"},{t:"ك", l:"Kaaf"},{t:"ل", l:"Laam"},{t:"م", l:"Meem"},{t:"ن", l:"Noon"},{t:"و", l:"Waaw"},{t:"هـ", l:"Haa"},{t:"ء", l:"Hamzah"},{t:"ي", l:"Yaa"}];
var qaidaStage2 = [{t:"بَ", l:"Baa Zabar Ba", v:"بَا فَتْحَة بَا"},{t:"بِ", l:"Baa Zer Bi", v:"بَا كَسْرَة بِي"},{t:"بُ", l:"Baa Pesh Bu", v:"بَا ضَمَّة بُو"}];
var qaidaStage3 = [{t:"بً", l:"Baa Do-Zabar Ban", v:"بَا فَتْحَتَيْنِ بَنْ"},{t:"بٍ", l:"Baa Do-Zer Bin", v:"بَا كَسْرَتَيْنِ بِنْ"},{t:"بٌ", l:"Baa Do-Pesh Bun", v:"بَا ضَمَّتَيْنِ بُنْ"}];

function renderKidsZone() {
    var html = "<h3 class='qaida-section-title'>1. Huroof Mufradaat (Alphabets)</h3><div class='qaida-grid'>";
    qaidaStage1.forEach(k => { html += `<div class="qaida-card" onclick="speakArabic('${k.t}')"><p class="qaida-letter glow-gold">${k.t}</p><p class="qaida-label">${k.l}</p></div>`; });
    html += "</div><h3 class='qaida-section-title'>2. Harakaat (Zabar, Zer, Pesh)</h3><div class='qaida-grid'>";
    qaidaStage2.forEach(k => { html += `<div class="qaida-card" onclick="speakArabic('${k.v}')"><p class="qaida-letter glow-gold">${k.t}</p><p class="qaida-label">${k.l}</p></div>`; });
    html += "</div><h3 class='qaida-section-title'>3. Tanween (Do-Zabar, Do-Zer, Do-Pesh)</h3><div class='qaida-grid'>";
    qaidaStage3.forEach(k => { html += `<div class="qaida-card" onclick="speakArabic('${k.v}')"><p class="qaida-letter glow-gold">${k.t}</p><p class="qaida-label">${k.l}</p></div>`; });
    html += "</div>";
    document.getElementById("kidsContainer").innerHTML = html;
}

// ==========================================
// 6 KALIMAS & MASSIVE DUAS
// ==========================================
var kalimaData = [
    {title: "1. Kalima Tayyibah", ar: "لَا إِلٰهَ إِلَّا اللهُ مُحَمَّدٌ رَسُولُ اللهِ", ur: "اللہ کے سوا کوئی معبود نہیں، محمد (صلی اللہ علیہ وسلم) اللہ کے رسول ہیں۔"},
    {title: "2. Kalima Shahadah", ar: "أَشْهَدُ أَنْ لَّا إِلٰهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ", ur: "میں گواہی دیتا ہوں کہ اللہ کے سوا کوئی عبادت کے لائق نہیں، اور میں گواہی دیتا ہوں کہ محمد ﷺ اس کے بندے اور رسول ہیں۔"},
    {title: "3. Kalima Tamjeed", ar: "سُبْحَانَ اللهِ وَالْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا اللهُ وَاللهُ أَكْبَرُ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ", ur: "اللہ پاک ہے اور سب تعریف اللہ ہی کے لیے ہے۔"},
    {title: "4. Kalima Tauheed", ar: "لَا إِلٰهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ حَىٌّ لَّا يَمُوْتُ اَبَدًا اَبَدًا", ur: "اللہ کے سوا کوئی معبود نہیں وہ اکیلا ہے، بادشاہی اسی کی ہے اور اسی کے لیے تعریف ہے۔"},
    {title: "5. Kalima Astaghfar", ar: "أَسْتَغْفِرُ اللهَ رَبِّي مِنْ كُلِّ ذَنْبٍ أَذْنَبْتُهُ عَمَدًا أَوْ خَطَأً", ur: "میں اللہ سے اپنے تمام گناہوں کی معافی مانگتا ہوں جو میں نے جان بوجھ کر یا بھول کر کیے۔"},
    {title: "6. Kalima Rad-e-Kufr", ar: "اَللّٰهُمَّ اِنِّيْ أَعُوْذُ بِكَ مِنْ أَنْ أُشْرِكَ بِكَ شَيْئًا وَأَنَا أَعْلَمُ بِهِ", ur: "اے اللہ! میں تیری پناہ مانگتا ہوں اس بات سے کہ میں جان بوجھ کر کسی کو تیرا شریک ٹھہراؤں۔"}
];

var dailyDuas = [
    {title:"⭐ Full Ayatul Kursi", ar:"اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ", ur:"اللہ، جس کے سوا کوئی معبود نہیں، جو زندہ اور سب کو قائم رکھنے والا ہے۔ نہ اسے اونگھ آتی ہے نہ نیند۔ جو کچھ آسمانوں اور زمین میں ہے سب اسی کا ہے۔ کون ہے جو اس کی اجازت کے بغیر اس کے سامنے سفارش کر سکے؟ وہ جانتا ہے جو ان کے آگے ہے اور جو ان کے پیچھے ہے، اور وہ اس کے علم میں سے کسی چیز کا احاطہ نہیں کر سکتے مگر جتنا وہ چاہے۔ اس کی کرسی نے آسمانوں اور زمین کو گھیر رکھا ہے، اور ان کی حفاظت اسے نہیں تھکاتی، اور وہ بہت بلند، بہت عظمت والا ہے۔"},
    {title:"⭐ Dua-e-Qunoot (Namaz-e-Witr)", ar:"اللَّهُمَّ إِنَّا نَسْتَعِينُكَ وَنَسْتَغْفِرُكَ وَنُؤْمِنُ بِكَ وَنَتَوَكَّلُ عَلَيْكَ وَنُثْنِي عَلَيْكَ الْخَيْرَ، وَنَشْكُرُكَ وَلَا نَكْفُرُكَ، وَنَخْلَعُ وَنَتْرُكُ مَنْ يَّفْجُرُكَ۔ اللَّهُمَّ إِيَّاكَ نَعْبُدُ وَلَكَ نُصَلِّي وَنَسْجُدُ وَإِلَيْكَ نَسْعَى وَنَحْفِدُ، وَنَرْجُو رَحْمَتَكَ وَنَخْشَى عَذَابَكَ، إِنَّ عَذَابَكَ بِالْكُفَّارِ مُلْحِقٌ", ur:"اے اللہ! ہم تجھ سے مدد مانگتے ہیں، اور تجھ سے بخشش طلب کرتے ہیں، تجھ پر ایمان لاتے ہیں، تجھ پر بھروسہ کرتے ہیں اور تیری بہترین تعریف کرتے ہیں، اور ہم تیرا شکر ادا کرتے ہیں اور تیری ناشکری نہیں کرتے، اور جو تیری نافرمانی کرے ہم اس سے الگ ہوتے ہیں اور اسے چھوڑتے ہیں۔ اے اللہ! ہم تیری ہی عبادت کرتے ہیں، اور تیرے ہی لیے نماز پڑھتے اور سجدہ کرتے ہیں، اور تیری ہی طرف دوڑتے ہیں، اور تیری رحمت کے امیدوار ہیں اور تیرے عذاب سے ڈرتے ہیں، بیشک تیرا عذاب کافروں کو پہنچنے والا ہے۔"},
    {title:"⭐ Qunoot-e-Nazila (Fajr/Museebat)", ar:"اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ، وَعَافِنِي فِيمَنْ عَافَيْتَ، وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ، وَبَارِكْ لِي فِيمَا أَعْطَيْتَ، وَقِنِي شَرَّ مَا قَضَيْتَ، إِنَّكَ تَقْضِي وَلَا يُقْضَى عَلَيْكَ، وَإِنَّهُ لَا يَذِلُّ مَنْ وَالَيْتَ، وَلَا يَعِزُّ مَنْ عَادَيْتَ، تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ", ur:"اے اللہ! مجھے ہدایت دے ان لوگوں میں جنہیں تو نے ہدایت دی ہے، اور مجھے عافیت دے ان میں جنہیں تو نے عافیت دی، اور میرا کارساز بن ان میں جن کا تو کارساز بنا، اور مجھے برکت دے اس میں جو تو نے عطا کیا، اور مجھے بچا اس برائی سے جو تو نے مقدر کی ہے، بے شک تو ہی فیصلہ کرتا ہے اور تیرے خلاف فیصلہ نہیں کیا جا سکتا۔ جس کا تو دوست بنے وہ ذلیل نہیں ہوتا، اور جس کا تو دشمن بنے وہ عزت نہیں پاتا۔ اے ہمارے رب! تو بابرکت اور بہت بلند ہے۔"},
    {title:"Namaz-e-Janaza (Baligh Mard/Aurat)", ar:"اللَّهُمَّ اغْفِرْ لِحَيِّنَا وَمَيِّتِنَا وَشَاهِدِنَا وَغَائِبِنَا وَصَغِيرِنَا وَكَبِيرِنَا وَذَكَرِنَا وَأُنْثَانَا. اللَّهُمَّ مَنْ أَحْيَيْتَهُ مِنَّا فَأَحْيِهِ عَلَى الْإِسْلَامِ، وَمَنْ تَوَفَّيْتَهُ مِنَّا فَتَوَفَّهُ عَلَى الْإِيمَانِ", ur:"اے اللہ! ہمارے زندوں، مردوں، حاضر، غائب، چھوٹوں، بڑوں، مردوں اور عورتوں کو بخش دے۔ اے اللہ! ہم میں سے جسے تو زندہ رکھے اسے اسلام پر زندہ رکھ اور جسے تو موت دے اسے ایمان پر موت دے۔"},
    {title:"Namaz-e-Janaza (Nabaligh Larka)", ar:"اللَّهُمَّ اجْعَلْهُ لَنَا فَرَطًا وَاجْعَلْهُ لَنَا أَجْرًا وَذُخْرًا وَاجْعَلْهُ لَنَا شَافِعًا وَمُشَفَّعًا", ur:"اے اللہ! اس لڑکے کو ہمارے لیے آگے پہنچ کر سامان کرنے والا بنا دے، اور اجر اور ذخیرہ بنا دے، اور اسے ہمارے لیے سفارش کرنے والا اور وہ جس کی سفارش قبول کی جائے، بنا دے۔"},
    {title:"Namaz-e-Janaza (Nabaligh Larki)", ar:"اللَّهُمَّ اجْعَلْهَا لَنَا فَرَطًا وَاجْعَلْهَا لَنَا أَجْرًا وَذُخْرًا وَاجْعَلْهَا لَنَا شَافِعَةً وَمُشَفَّعَةً", ur:"اے اللہ! اس لڑکی کو ہمارے لیے آگے پہنچ کر سامان کرنے والی بنا دے، اور اجر اور ذخیرہ بنا دے، اور اسے ہمارے لیے سفارش کرنے والی اور وہ جس کی سفارش قبول کی جائے، بنا دے۔"},
    {title:"Mayyat ko Qabar mein Utarne ki Dua", ar:"بِسْمِ اللَّهِ وَعَلَى مِلَّةِ رَسُولِ اللَّهِ", ur:"اللہ کے نام سے اور رسول اللہ ﷺ کے دین پر (دفن کرتا ہوں)۔"},
    {title:"Khana Khane se Pehle", ar:"بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ", ur:"اللہ کے نام اور اللہ کی برکت پر کھاتا ہوں۔"},
    {title:"Khana Khane ke Baad", ar:"الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ", ur:"سب تعریفیں اس اللہ کے لیے ہیں جس نے ہمیں کھلایا، پلایا اور مسلمان بنایا۔"},
    {title:"Masjid mein Dakhil hone ki Dua", ar:"اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", ur:"اے اللہ! میرے لیے اپنی رحمت کے دروازے کھول دے۔"},
    {title:"Bimari aur Takleef ki Dua", ar:"أَذْهِبِ الْبَاسَ رَبَّ النَّاسِ، اشْفِ وَأَنْتَ الشَّافِي", ur:"اے لوگوں کے رب! اس بیماری کو دور فرما، شفا دے تو ہی شفا دینے والا ہے۔"},
    {title:"So Kar Uthne ki Dua", ar:"الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", ur:"سب تعریف اللہ کے لیے ہے جس نے ہمیں مارنے کے بعد زندہ کیا اور اسی کی طرف اٹھ کر جانا ہے۔"},
    {title:"Sone se Pehle ki Dua", ar:"اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا", ur:"اے اللہ! میں تیرے ہی نام کے ساتھ مرتا (سوتا) اور جیتا (جاگتا) ہوں۔"}
];

function renderKalimaAndDuas() {
    var kHtml = "";
    kalimaData.forEach(k => { kHtml += `<div class="dua-card"><h4 style="color:#b33939; margin-top:0;">${k.title}</h4><p class="arabic-text glow-gold" style="font-size:28px;" onclick="speakArabic('${k.ar}')">${k.ar}</p><p class="urdu-font" style="color:var(--gold);">${k.ur}</p></div>`; });
    document.getElementById("kalimaContainer").innerHTML = kHtml;

    var dHtml = "";
    dailyDuas.forEach(d => { dHtml += `<div class="dua-card"><h4 style="color:#b33939; margin-top:0;">${d.title}</h4><p class="arabic-text glow-gold" style="cursor:pointer;" onclick="speakArabic('${d.ar}')">${d.ar}</p><p class="urdu-font" style="color:var(--gold);">${d.ur}</p></div>`; });
    document.getElementById("duasContainer").innerHTML = dHtml;
}

// ==========================================
// FULL 99 NAMES OF ALLAH & MUHAMMAD (PBUH)
// ==========================================
var allahNames = [
    {ar:"ٱلرَّحْمَـٰنُ", ur:"بڑا مہربان"},{ar:"ٱلرَّحِيمُ", ur:"نہایت رحم والا"},{ar:"ٱلْمَلِكُ", ur:"بادشاہ"},{ar:"ٱلْقُدُّوسُ", ur:"پاک ذات"},{ar:"ٱلسَّلَامُ", ur:"سلامتی دینے والا"},{ar:"ٱلْمُؤْمِنُ", ur:"امن دینے والا"},{ar:"ٱلْمُهَيْمِنُ", ur:"نگہبان"},{ar:"ٱلْعَزِيزُ", ur:"غالب"},{ar:"ٱلْجَبَّارُ", ur:"زبردست"},{ar:"ٱلْمُتَكَبِّرُ", ur:"بڑائی والا"},{ar:"ٱلْخَالِقُ", ur:"پیدا کرنے والا"},{ar:"ٱلْبَارِئُ", ur:"جان ڈالنے والا"},{ar:"ٱلْمُصَوِّرُ", ur:"صورت بنانے والا"},{ar:"ٱلْغَفَّارُ", ur:"بڑا بخشنے والا"},{ar:"ٱلْقَهَّارُ", ur:"سب پر غالب"},{ar:"ٱلْوَهَّابُ", ur:"سب کچھ دینے والا"},{ar:"ٱلرَّزَّاقُ", ur:"روزی دینے والا"},{ar:"ٱلْفَتَّاحُ", ur:"دروازے کھولنے والا"},{ar:"ٱلْعَلِيمُ", ur:"سب کچھ جاننے والا"},{ar:"ٱلْقَابِضُ", ur:"روزی تنگ کرنے والا"},{ar:"ٱلْبَاسِطُ", ur:"روزی کشادہ کرنے والا"},{ar:"ٱلْخَافِضُ", ur:"پست کرنے والا"},{ar:"ٱلرَّافِعُ", ur:"بلند کرنے والا"},{ar:"ٱلْمُعِزُّ", ur:"عزت دینے والا"},{ar:"ٱلْمُذِلُّ", ur:"ذلت دینے والا"},{ar:"ٱلسَّمِيعُ", ur:"سب کچھ سننے والا"},{ar:"ٱلْبَصِيرُ", ur:"سب کچھ دیکھنے والا"},{ar:"ٱلْحَكَمُ", ur:"فیصلہ کرنے والا"},{ar:"ٱلْعَدْلُ", ur:"انصاف کرنے والا"},{ar:"ٱللَّطِيفُ", ur:"لطف و کرم کرنے والا"},{ar:"ٱلْخَبِيرُ", ur:"باخبر"},{ar:"ٱلْحَلِيمُ", ur:"بردبار"},{ar:"ٱلْعَظِيمُ", ur:"بزرگی والا"},{ar:"ٱلْغَفُورُ", ur:"بخشنے والا"},{ar:"ٱلشَّكُورُ", ur:"قدردان"},{ar:"ٱلْعَلِيُّ", ur:"بلند و بالا"},{ar:"ٱلْكَبِيرُ", ur:"بہت بڑا"},{ar:"ٱلْحَفِيظُ", ur:"حفاظت کرنے والا"},{ar:"ٱلْمُقِيتُ", ur:"قوت دینے والا"},{ar:"ٱلْحَسِيبُ", ur:"حساب لینے والا"},{ar:"ٱلْجَلِيلُ", ur:"بزرگ"},{ar:"ٱلْكَرِيمُ", ur:"کرم کرنے والا"},{ar:"ٱلرَّقِيبُ", ur:"نگہبان"},{ar:"ٱلْمُجِيبُ", ur:"دعا قبول کرنے والا"},{ar:"ٱلْوَاسِعُ", ur:"وسعت والا"},{ar:"ٱلْحَكِيمُ", ur:"حکمت والا"},{ar:"ٱلْوَدُودُ", ur:"محبت کرنے والا"},{ar:"ٱلْمَجِيدُ", ur:"بزرگی والا"},{ar:"ٱلْبَاعِثُ", ur:"اٹھانے والا"},{ar:"ٱلشَّهِيدُ", ur:"حاضر"},{ar:"ٱلْحَقُّ", ur:"سچا"},{ar:"ٱلْوَكِيلُ", ur:"کارساز"},{ar:"ٱلْقَوِيُّ", ur:"طاقتور"},{ar:"ٱلْمَتِينُ", ur:"مضبوط"},{ar:"ٱلْوَلِيُّ", ur:"دوست"},{ar:"ٱلْحَمِيدُ", ur:"تعریف کے لائق"},{ar:"ٱلْمُحْصِي", ur:"شمار کرنے والا"},{ar:"ٱلْمُبْدِئُ", ur:"پہلی بار پیدا کرنے والا"},{ar:"ٱلْمُعِيدُ", ur:"دوبارہ پیدا کرنے والا"},{ar:"ٱلْمُحْيِي", ur:"زندہ کرنے والا"},{ar:"ٱلْمُمِيتُ", ur:"موت دینے والا"},{ar:"ٱلْحَيُّ", ur:"ہمیشہ زندہ رہنے والا"},{ar:"ٱلْقَيُّومُ", ur:"سب کو قائم رکھنے والا"},{ar:"ٱلْوَاجِدُ", ur:"پانے والا"},{ar:"ٱلْمَاجِدُ", ur:"بزرگی والا"},{ar:"ٱلْوَاحِدُ", ur:"ایک"},{ar:"ٱلْأَحَد", ur:"اکیلا"},{ar:"ٱلصَّمَدُ", ur:"بے نیاز"},{ar:"ٱلْقَادِرُ", ur:"قدرت والا"},{ar:"ٱلْمُقْتَدِرُ", ur:"کامل قدرت والا"},{ar:"ٱلْمُقَدِّمُ", ur:"آگے کرنے والا"},{ar:"ٱلْمُؤَخِّرُ", ur:"پیچھے کرنے والا"},{ar:"ٱلْأَوَّلُ", ur:"سب سے پہلا"},{ar:"ٱلْآخِرُ", ur:"سب سے آخری"},{ar:"ٱلظَّاهِرُ", ur:"ظاہر"},{ar:"ٱلْبَاطِنُ", ur:"پوشیدہ"},{ar:"ٱلْوَالِي", ur:"مالک"},{ar:"ٱلْمُتَعَالِي", ur:"بلند و برتر"},{ar:"ٱلْبَرُّ", ur:"بھلائی کرنے والا"},{ar:"ٱلتَّوَّابُ", ur:"توبہ قبول کرنے والا"},{ar:"ٱلْمُنْتَقِمُ", ur:"بدلہ لینے والا"},{ar:"ٱلْعَفُوُّ", ur:"معاف کرنے والا"},{ar:"ٱلرَّءُوفُ", ur:"بہت مہربان"},{ar:"مَالِكُ ٱلْمُلْكِ", ur:"تمام ملک کا مالک"},{ar:"ذُو ٱلْجَلَالِ وَٱلْإِكْرَامِ", ur:"جلال اور انعام والا"},{ar:"ٱلْمُقْسِطُ", ur:"انصاف کرنے والا"},{ar:"ٱلْجَامِعُ", ur:"جمع کرنے والا"},{ar:"ٱلْغَنِيُّ", ur:"بے نیاز"},{ar:"ٱلْمُغْنِي", ur:"غنی کرنے والا"},{ar:"ٱلْمَانِعُ", ur:"روکنے والا"},{ar:"ٱلضَّارُّ", ur:"نقصان پہنچانے والا"},{ar:"ٱلنَّافِعُ", ur:"نفع پہنچانے والا"},{ar:"ٱلنُّورُ", ur:"روشن کرنے والا"},{ar:"ٱلْهَادِي", ur:"ہدایت دینے والا"},{ar:"ٱلْبَدِيعُ", ur:"نئی طرح پیدا کرنے والا"},{ar:"ٱلْبَاقِي", ur:"باقی رہنے والا"},{ar:"ٱلْوَارِثُ", ur:"سب کا وارث"},{ar:"ٱلرَّشِيدُ", ur:"رہنمائی کرنے والا"},{ar:"ٱلصَّبُورُ", ur:"صبر کرنے والا"}
];

var prophetNames = [
    {ar:"مُحَمَّدٌ", ur:"بہت تعریف کیا گیا"}, {ar:"أَحْمَدُ", ur:"سب سے زیادہ تعریف کرنے والا"}, {ar:"حَامِدٌ", ur:"اللہ کی تعریف کرنے والا"}, {ar:"مَحْمُودٌ", ur:"جس کی تعریف کی گئی ہو"},
    {ar:"قَاسِمٌ", ur:"تقسیم کرنے والا"}, {ar:"عَاقِبٌ", ur:"سب سے آخر میں آنے والا"}, {ar:"فَاتِحٌ", ur:"فتح کرنے والا"}, {ar:"شَاهِدٌ", ur:"گواہی دینے والا"},
    {ar:"حَاشِرٌ", ur:"جمع کرنے والا"}, {ar:"رَشِيدٌ", ur:"ہدایت یافتہ"}, {ar:"مَشْهُودٌ", ur:"جس کی گواہی دی گئی"}, {ar:"بَشِيرٌ", ur:"خوشخبری دینے والا"},
    {ar:"نَذِيرٌ", ur:"ڈرانے والا"}, {ar:"دَاعٍ", ur:"بلانے والا"}, {ar:"شَافٍ", ur:"شفا دینے والا"}, {ar:"هَادٍ", ur:"ہدایت دینے والا"},
    {ar:"مَهْدِيٌّ", ur:"ہدایت یافتہ"}, {ar:"مَاحٍ", ur:"کفر مٹانے والا"}, {ar:"مُنْجٍ", ur:"نجات دلانے والا"}, {ar:"نَاهٍ", ur:"منع کرنے والا"},
    {ar:"رَسُولٌ", ur:"پیغام پہنچانے والا"}, {ar:"نَبِيٌّ", ur:"غیب کی خبر دینے والا"}, {ar:"أُمِّيٌّ", ur:"ان پڑھ"}, {ar:"تِهَامِيٌّ", ur:"تہامہ کا رہنے والا"},
    {ar:"هَاشِمِيٌّ", ur:"بنی ہاشم سے"}, {ar:"أَبْطَحِيٌّ", ur:"بطحاء والا"}, {ar:"عَزِيزٌ", ur:"عزت والا"}, {ar:"حَرِيصٌ", ur:"بھلائی چاہنے والا"},
    {ar:"رَءُوفٌ", ur:"بہت مہربان"}, {ar:"رَحِيمٌ", ur:"رحم کرنے والا"}, {ar:"طٰهٰ", ur:"طہٰ"}, {ar:"يٰسٓ", ur:"یس"},
    {ar:"مُزَّمِّلٌ", ur:"چادر اوڑھنے والا"}, {ar:"مُدَّثِّرٌ", ur:"کمبل اوڑھنے والا"}, {ar:"مُصْطَفَىٰ", ur:"چنا ہوا"}, {ar:"مُجْتَبَىٰ", ur:"منتخب کیا گیا"},
    {ar:"مُرْتَضَىٰ", ur:"پسندیدہ"}, {ar:"مُخْتَارٌ", ur:"چنا ہوا"}, {ar:"نَاصِرٌ", ur:"مددگار"}, {ar:"مَنْصُورٌ", ur:"جس کی مدد کی گئی ہو"},
    {ar:"قَائِمٌ", ur:"قائم رہنے والا"}, {ar:"مُطِيعٌ", ur:"فرمانبردار"}, {ar:"مُخْبِتٌ", ur:"عاجزی کرنے والا"}, {ar:"خَاتَمٌ", ur:"ختم کرنے والا"},
    {ar:"شَكُورٌ", ur:"شکر گزار"}, {ar:"قَرِيبٌ", ur:"قریب"}, {ar:"خَلِيلٌ", ur:"گہرا دوست"}, {ar:"صَفِيٌّ", ur:"خالص دوست"},
    {ar:"طَاهِرٌ", ur:"پاک"}, {ar:"مُطَهَّرٌ", ur:"پاک کیا گیا"}, {ar:"طَيِّبٌ", ur:"پاکیزہ"}, {ar:"سَيِّدٌ", ur:"سردار"}, {ar:"مُبِينٌ", ur:"واضح کرنے والا"},
    {ar:"بُرْهَانٌ", ur:"دلیل"}, {ar:"حُجَّةٌ", ur:"حجت"}, {ar:"صَادِقٌ", ur:"سچا"}, {ar:"مَصْدُوقٌ", ur:"سچا مانا گیا"}, {ar:"أَمِينٌ", ur:"امانت دار"},
    {ar:"صَاحِبٌ", ur:"ساتھی"}, {ar:"مَكِّيٌّ", ur:"مکہ کا رہنے والا"}, {ar:"مَدَنِيٌّ", ur:"مدینہ کا رہنے والا"}, {ar:"عَرَبِيٌّ", ur:"عرب"}, {ar:"قُرَشِيٌّ", ur:"قریشی"},
    {ar:"عَبْدُ اللَّهِ", ur:"اللہ کا بندہ"}, {ar:"خَيْرُ الْخَلْقِ", ur:"مخلوق میں سب سے بہتر"}, {ar:"سِرَاجٌ", ur:"چراغ"}, {ar:"مُنِيرٌ", ur:"روشن"}, {ar:"مُذَكِّرٌ", ur:"نصیحت کرنے والا"},
    {ar:"وَلِيٌّ", ur:"دوست"}, {ar:"حَبِيبٌ", ur:"پیارا"}, {ar:"مُتَوَكِّلٌ", ur:"بھروسہ کرنے والا"}, {ar:"شَفِيعٌ", ur:"سفارش کرنے والا"}, {ar:"مُشَفَّعٌ", ur:"جس کی سفارش قبول ہو"},
    {ar:"مُقَدَّمٌ", ur:"آگے کیا گیا"}, {ar:"مُؤَخَّرٌ", ur:"پیچھے کیا گیا"}, {ar:"فَاضِلٌ", ur:"فضیلت والا"}, {ar:"مُفَضَّلٌ", ur:"جسے فضیلت دی گئی"}, {ar:"كَرِيمٌ", ur:"کرم کرنے والا"},
    {ar:"مُكَرَّمٌ", ur:"جس کی تکریم کی گئی"}, {ar:"مُعَظَّمٌ", ur:"عظمت والا"}, {ar:"غُوثٌ", ur:"مدد کرنے والا"}, {ar:"غِيَاثٌ", ur:"فریاد رس"}, {ar:"مُقِيتٌ", ur:"قوت دینے والا"},
    {ar:"مُغِيثٌ", ur:"مدد کرنے والا"}, {ar:"عَفُوٌّ", ur:"معاف کرنے والا"}, {ar:"مُتَجَاوِزٌ", ur:"درگزر کرنے والا"}, {ar:"حَلِيمٌ", ur:"بردبار"}, {ar:"صَبُورٌ", ur:"صبر کرنے والا"},
    {ar:"شَكُورٌ", ur:"قدردان"}, {ar:"عَالِمٌ", ur:"جاننے والا"}, {ar:"عَلِيمٌ", ur:"بہت جاننے والا"}, {ar:"عَلَّامٌ", ur:"بہت زیادہ جاننے والا"}, {ar:"مُعَلِّمٌ", ur:"سکھانے والا"},
    {ar:"مُيَسِّرٌ", ur:"آسانی کرنے والا"}, {ar:"مُبَشِّرٌ", ur:"خوشخبری دینے والا"}
];

function renderNames(type) {
    document.getElementById("btnAllahNames").style.background = type === 'allah' ? "var(--gold)" : "transparent";
    document.getElementById("btnAllahNames").style.color = type === 'allah' ? "#000" : "var(--gold)";
    document.getElementById("btnProphetNames").style.background = type === 'prophet' ? "var(--gold)" : "transparent";
    document.getElementById("btnProphetNames").style.color = type === 'prophet' ? "#000" : "var(--gold)";

    var data = type === 'allah' ? allahNames : prophetNames;
    var html = "";
    data.forEach(n => {
        html += `<div class="widget-card" style="padding:15px;" onclick="speakArabic('${n.ar}')"><p class="arabic-text glow-gold" style="font-size:28px; margin:0;">${n.ar}</p><p class="urdu-font" style="margin:5px 0 0 0; font-size:14px; border:none; color:var(--gold);">${n.ur}</p></div>`;
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
        html += `<div class="widget-card" onclick="speakArabic('${z.ar}')"><h3 style="color:#b33939; margin-top:0;">${z.count}</h3><p class="arabic-text glow-gold" style="font-size:32px; margin:0;">${z.ar}</p><p class="urdu-font" style="border:none; color:var(--gold);">${z.ur}</p></div>`;
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
        renderKidsZone();
        fetchBayanatAPI(); 
        loadLocalNaats();

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
    } catch(e) { 
        document.getElementById("splashQuote").innerText = "Network Issue. Basic features will work."; 
        document.getElementById("enterBtn").style.display = "block"; 
    }
};

function startApp() {
    document.getElementById("splashScreen").style.display = "none";
    azanAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    azanAudio.play().catch(e=>{});
    
    if ('Notification' in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().catch(e=>{}); 
    }

    loadSettings();
    setInterval(checkAlarms, 60000); 
}

function switchTab(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    var sidebar = document.getElementById("sidebar");
    var overlay = document.getElementById("sidebarOverlay");
    if(sidebar) sidebar.className = sidebar.className.replace(" open", "");
    if(overlay) overlay.className = overlay.className.replace(" open", "");
}

var showLoad = function(show) { document.getElementById("loading").style.display = show ? "block" : "none"; };

// ==========================================
// ALARMS & HIJRI CALENDAR ADJUSTMENT
// ==========================================
function saveSettings() {
    localStorage.setItem("city", document.getElementById("cityName").value);
    localStorage.setItem("country", document.getElementById("countryName").value);
    localStorage.setItem("voice", document.getElementById("azanVoice").value);
    
    // SAVE HIJRI ADJUSTMENT
    if(document.getElementById("hijriAdjustment")) {
        localStorage.setItem("hijriAdj", document.getElementById("hijriAdjustment").value);
    }

    ["timeFajr", "timeDhuhr", "timeAsr", "timeMaghrib", "timeIsha", "timeJummah"].forEach(id => localStorage.setItem(id, document.getElementById(id).value));
    ["toggleFajr", "toggleDhuhr", "toggleAsr", "toggleMaghrib", "toggleIsha", "toggleJummah"].forEach(id => localStorage.setItem(id, document.getElementById(id).checked));
}

function loadSettings() {
    if(localStorage.getItem("appInstalledOnce") !== "true") {
        ["toggleFajr", "toggleDhuhr", "toggleAsr", "toggleMaghrib", "toggleIsha", "toggleJummah"].forEach(id => localStorage.setItem(id, "true"));
        localStorage.setItem("appInstalledOnce", "true");
    }

    // LOAD HIJRI ADJUSTMENT
    if(localStorage.getItem("hijriAdj") !== null && document.getElementById("hijriAdjustment")) {
        document.getElementById("hijriAdjustment").value = localStorage.getItem("hijriAdj");
    } else if(document.getElementById("hijriAdjustment")) {
        document.getElementById("hijriAdjustment").value = "-1"; // Default to -1 day for region
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
    var city = document.getElementById("cityName").value || "Srinagar";
    var country = document.getElementById("countryName").value || "India";
    var addressQuery = encodeURIComponent(city + ", " + country);
    var adj = document.getElementById("hijriAdjustment") ? document.getElementById("hijriAdjustment").value : "-1";

    try {
        // API FETCH WITH HIJRI ADJUSTMENT PARAMETER
        var res = await fetch(`https://api.aladhan.com/v1/timingsByAddress?address=${addressQuery}&method=1&adjustment=${adj}`);
        if(!res.ok) throw new Error("API Limit");
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
        var calRes = await fetch(`https://api.aladhan.com/v1/calendarByAddress?address=${addressQuery}&method=1&month=${d.getMonth()+1}&year=${d.getFullYear()}&adjustment=${adj}`);
        var calData = await calRes.json();
        var html = "<tr><th>Gregorian</th><th>Hijri Date</th><th>Day</th></tr>";
        var todayStr = String(d.getDate()).padStart(2, '0');
        calData.data.forEach(day => {
            var isToday = (day.date.gregorian.day === todayStr) ? "today-cell" : "";
            html += `<tr class="${isToday}"><td>${day.date.gregorian.date}</td><td>${day.date.hijri.date} ${day.date.hijri.month.en}</td><td>${day.date.gregorian.weekday.en}</td></tr>`;
        });
        document.getElementById("calendarTable").innerHTML = html;
    } catch(e) { 
        showToast("Using Saved/Backup Location."); 
    }
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

    if ('Notification' in window && Notification.permission === "granted") {
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
// NAAT LOCAL DB (NATIVE AUDIO)
// ==========================================
var localNaatDb = {
    "Junaid Jamshed": [{ title: "Mera Dil Badal De", url: "https://archive.org/download/AhnafMedia-Audios-Naat-Junaid-Jamshed/MeraDilBadalDe.mp3" }, { title: "Mohammad Ka Roza", url: "https://archive.org/download/AhnafMedia-Audios-Naat-Junaid-Jamshed/MohammadKaRoza.mp3" }, { title: "Ilahi Teri Chokhat Pe", url: "https://archive.org/download/AhnafMedia-Audios-Naat-Junaid-Jamshed/IlahiTeriChokhatPe.mp3" }],
    "Awais Raza Qadri": [{ title: "Tajdar E Haram", url: "https://archive.org/download/AbdallahKamelSura1AlFatiha_201906/Awais%20%28Owais%29%20Raza%20Qadri_%20Tajdar%20E%20Haram%20Ae%20Shehenshah%20E%20Deen.mp3" }, { title: "Mera Waliyon Ke Imam", url: "https://archive.org/download/AbdallahKamelSura1AlFatiha_201906/Awais%20%28Owais%29%20Raza%20Qadri_%20Mera%20Waliyon%20Ke%20Imam.mp3" }],
    "Sami Yusuf": [{ title: "Hasbi Rabbi", url: "https://archive.org/download/HasbiRabbiJallallahSamiYusuf_201708/Hasbi%20Rabbi%20Jallallah%20Sami%20Yusuf.mp3" }, { title: "Ya Mustafa", url: "https://archive.org/download/SamiYusuf/Ya_Mustafa.mp3" }],
    "Fasihuddin Soharwardi": [{ title: "Main Behak Sakun", url: "https://archive.org/download/Fasihuddin/Main_Behak.mp3" }],
    "Maher Zain": [{ title: "Ya Nabi Salam Alayka", url: "https://archive.org/download/MaherZain/Ya_Nabi.mp3" }],
    "General Famous Naats": [{ title: "Qaseeda Burda Shareef", url: "https://archive.org/download/QaseedaBurda/Qaseeda.mp3" }, { title: "Bhar Do Jholi", url: "https://archive.org/download/BharDoJholi/Bhar_Do.mp3" }]
};

function loadLocalNaats() {
    var khawan = document.getElementById("naatKhawanSelect").value;
    var nSelect = document.getElementById("naatSelect");
    nSelect.innerHTML = "";
    var naats = localNaatDb[khawan] || [];
    if(naats.length === 0) { nSelect.add(new Option("No Naats Found", "")); return; }
    naats.forEach(function(item, index) { nSelect.add(new Option(item.title, index)); });
}

function playNaat() {
    var khawan = document.getElementById("naatKhawanSelect").value;
    var index = document.getElementById("naatSelect").value;
    var item = localNaatDb[khawan][index];
    if(!item) return;
    document.getElementById("currentNaatTitle").innerText = item.title;
    var player = document.getElementById("naatPlayer");
    player.src = item.url;
    player.play().catch(e => showToast("Audio URL restricted."));
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
        if(!resAr.ok) throw new Error("API Limit"); 
        var dataAr = await resAr.json();

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
