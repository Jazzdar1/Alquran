var playlist = [], currentTrackIndex = 0, isPlaying = false;
var audioEngine = document.getElementById("audioEngine") || new Audio();
var preloader = new Audio(); // THE MAGIC FIX FOR BACKGROUND PLAYBACK
var azanAudio = document.getElementById("azanAudio");
var lastPlayedMinute = ""; 

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

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(function() { console.log("PWA Ready"); });
}

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

var dailyDuas = [
    {title:"So Kar Uthne Ki Dua", ar:"الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", ur:"سب تعریف اللہ کے لیے ہے جس نے ہمیں مارنے کے بعد زندہ کیا اور اسی کی طرف اٹھ کر جانا ہے۔", audio:"https://www.hisnulmuslim.com/audio/ar/ar_01_02.mp3"},
    {title:"Ghar Se Nikalne Ki Dua", ar:"بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", ur:"اللہ کے نام سے، میں نے اللہ پر بھروسہ کیا، اور گناہوں سے بچنے کی طاقت اور نیکی کرنے کی قوت اللہ ہی کی توفیق سے ہے۔", audio:"https://www.hisnulmuslim.com/audio/ar/ar_01_03.mp3"},
    {title:"Safar Ki Dua", ar:"سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ", ur:"پاک ہے وہ ذات جس نے اس (سواری) کو ہمارے تابع کر دیا حالانکہ ہم اسے قابو میں لانے والے نہ تھے۔", audio:"https://www.hisnulmuslim.com/audio/ar/ar_01_04.mp3"}
];

function renderDuas() {
    var html = "";
    dailyDuas.forEach(d => {
        html += `<div class="dua-card">
                    <h4 style="color:#b33939; margin-top:0; border-bottom:1px solid #eee; padding-bottom:5px;">${d.title}</h4>
                    <p class="arabic-text" style="color:#000;">${d.ar}</p>
                    <p class="urdu-font" style="border:none;">${d.ur}</p>
                    <audio controls style="width: 100%; outline: none; border-radius: 5px; margin-top:10px;">
                        <source src="${d.audio}" type="audio/mpeg">
                    </audio>
                 </div>`;
    });
    document.getElementById("duasContainer").innerHTML = html;
}

setInterval(() => { document.getElementById("liveClock").innerText = new Date().toLocaleTimeString('en-US', { hour12: false }); }, 1000);

window.onload = async function() {
    try {
        renderDuas();
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

function saveSettings() {
    localStorage.setItem("city", document.getElementById("cityName").value);
    localStorage.setItem("country", document.getElementById("countryName").value);
    localStorage.setItem("voice", document.getElementById("azanVoice").value);
    ["timeFajr", "timeDhuhr", "timeAsr", "timeMaghrib", "timeIsha", "timeJummah"].forEach(id => localStorage.setItem(id, document.getElementById(id).value));
    ["toggleFajr", "toggleDhuhr", "toggleAsr", "toggleMaghrib", "toggleIsha", "toggleJummah"].forEach(id => localStorage.setItem(id, document.getElementById(id).checked));
}

function loadSettings() {
    if(localStorage.getItem("city")) {
        document.getElementById("cityName").value = localStorage.getItem("city");
        document.getElementById("countryName").value = localStorage.getItem("country");
        document.getElementById("azanVoice").value = localStorage.getItem("voice");
        ["timeFajr", "timeDhuhr", "timeAsr", "timeMaghrib", "timeIsha", "timeJummah"].forEach(id => {
            if(localStorage.getItem(id)) document.getElementById(id).value = localStorage.getItem(id);
        });
        ["toggleFajr", "toggleDhuhr", "toggleAsr", "toggleMaghrib", "toggleIsha", "toggleJummah"].forEach(id => {
            if(localStorage.getItem(id) !== null) document.getElementById(id).checked = (localStorage.getItem(id) === "true");
        });
        fetchPrayerTimes(false); 
    } else { fetchPrayerTimes(true); } 
}

async function fetchPrayerTimes(forceOverwrite) {
    showLoad(true);
    var city = document.getElementById("cityName").value, country = document.getElementById("countryName").value;
    try {
        var res = await fetch(`https://api.aladhan.com/v1/timingsByAddress?address=${encodeURIComponent(city + ', ' + country)}&method=1`);
        var data = await res.json();
        document.getElementById("hijriDateDisplay").innerText = data.data.date.hijri.date + " " + data.data.date.hijri.month.en + " " + data.data.date.hijri.year + " AH";

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
    azanAudio.play().catch(e => showToast("Azan blocked by browser. Please tap anywhere.")); 
    showToast("🕌 Azan Time: " + name); 
}

// --- MUSHAF LOGIC (GROUPED PLAYBACK FIX) ---
var padNum = function(num) { return num.toString().padStart(3, '0'); };
var toArabicNum = function(num) { return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]); };

async function loadSurah() {
    var modeElement = document.getElementById("readMode");
    var numElement = document.getElementById("readNumber");
    var mode = modeElement ? modeElement.value : 'surah';
    var num = numElement ? numElement.value : 1;
    var r = document.getElementById("arReciter").value;
    var l = document.getElementById("textLang").value;
    var u = document.getElementById("urReciter").value;
    
    if(num < 1) return;
    
    showLoad(true); document.getElementById("quranContainer").style.display = "none";
    audioEngine.pause(); preloader.pause(); playlist = []; currentTrackIndex = 0; isPlaying = false;
    document.getElementById("playBtn").innerHTML = '<i class="fas fa-play-circle"></i>';

    try {
        var resAr = await fetch(`https://api.alquran.cloud/v1/${mode}/${num}/${r}`);
        var dataAr = await resAr.json();
        if(dataAr.code !== 200) throw new Error("API Limit Reached"); 

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
        var ayahsPerPage = 6; // User requested 6 Ayahs
        
        for (var i = 0; i < ayahsAr.length; i += ayahsPerPage) {
            var chunkAr = ayahsAr.slice(i, i + ayahsPerPage);
            html += `<div class="mushaf-frame"><div class="mushaf-inner">`;
            if(i === 0) { html += `<h2 class="surah-title">${titleText}</h2>`; }

            // 1. CREATE HTML FOR PAGE
            chunkAr.forEach((ayah, j) => {
                var globalIndex = i + j;
                var sNum = ayah.surah ? ayah.surah.number : (mode === 'surah' ? num : 1);
                var aNum = ayah.numberInSurah;
                
                html += `<div class="ayah-row" id="ayah-${sNum}-${aNum}">
                            <div class="arabic-text">${ayah.text} <span class="ayah-marker">۝${toArabicNum(aNum)}</span></div>
                            <div class="urdu-font" style="direction:${isRTL ? 'rtl' : 'ltr'}">${ayahsTr[globalIndex].text}</div>
                         </div>`;
            });
            html += `</div></div>`;

            // 2. PLAYLIST LOGIC: ALL 6 ARABIC FIRST
            chunkAr.forEach((ayah) => {
                var sNum = ayah.surah ? ayah.surah.number : (mode === 'surah' ? num : 1);
                playlist.push({ url: ayah.audio, num: ayah.numberInSurah, type: 'Arabic', id: `ayah-${sNum}-${ayah.numberInSurah}` });
            });

            // 3. PLAYLIST LOGIC: ALL 6 URDU SECOND
            if(u !== 'none') {
                chunkAr.forEach((ayah) => {
                    var sNum = ayah.surah ? ayah.surah.number : (mode === 'surah' ? num : 1);
                    playlist.push({ url: `https://everyayah.com/data/${u}/${padNum(sNum)}${padNum(ayah.numberInSurah)}.mp3`, num: ayah.numberInSurah, type: 'Translation', id: `ayah-${sNum}-${ayah.numberInSurah}` });
                });
            }
        }

        document.getElementById("quranContainer").innerHTML = html;
        document.getElementById("quranContainer").style.display = "block";
        document.getElementById("playerTitle").innerText = `${mode.toUpperCase()} Loaded successfully.`;
    } catch(e) { 
        showToast("Error! Check Number (Surah:1-114, Ruku:1-558, Ayah:1-6236)."); 
    }
    showLoad(false);
}

function togglePlay() {
    if(!playlist.length) return;
    if(isPlaying) { audioEngine.pause(); isPlaying = false; document.getElementById("playBtn").innerHTML = '<i class="fas fa-play-circle"></i>'; } 
    else { playTrack(); }
}

function playTrack() {
    if (currentTrackIndex >= playlist.length) { isPlaying = false; currentTrackIndex = 0; document.getElementById("playBtn").innerHTML = '<i class="fas fa-play-circle"></i>'; return; }
    
    var track = playlist[currentTrackIndex];
    audioEngine.src = track.url;
    var p = audioEngine.play();
    
    if(p !== undefined) {
        p.then(() => {
            isPlaying = true; 
            document.getElementById("playBtn").innerHTML = '<i class="fas fa-pause-circle"></i>';
            
            // PRELOADER: Background Play Fix (Downloads next track instantly)
            if (currentTrackIndex + 1 < playlist.length) {
                preloader.src = playlist[currentTrackIndex + 1].url;
                preloader.load(); 
            }
            
            // DOM manipulation only when screen is ON
            if (!document.hidden) {
                document.getElementById("playerTitle").innerText = `Playing: Ayah ${track.num} (${track.type})`;
                document.querySelectorAll('.ayah-row').forEach(el => el.classList.remove('playing-active'));
                var row = document.getElementById(track.id);
                if(row) { row.classList.add('playing-active'); row.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            }

            if ('mediaSession' in navigator) {
                var surahNameText = document.querySelector(".surah-title") ? document.querySelector(".surah-title").innerText : "Al-Hikmah Quran";
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: `Ayah ${track.num} (${track.type})`,
                    artist: 'Al-Hikmah Quran Player',
                    album: surahNameText,
                    artwork: [ { src: 'https://cdn-icons-png.flaticon.com/512/3073/3073860.png', sizes: '512x512', type: 'image/png' } ]
                });
            }
        }).catch(e => { 
            isPlaying = false; 
            if(!document.hidden) {
                document.getElementById("playBtn").innerHTML = '<i class="fas fa-play-circle"></i>';
            }
        });
    }
}

function skipTrack(dir) {
    if(!playlist.length) return; audioEngine.pause(); currentTrackIndex += dir;
    if(currentTrackIndex < 0) currentTrackIndex = 0;
    if(currentTrackIndex >= playlist.length) currentTrackIndex = playlist.length - 1;
    playTrack();
}

audioEngine.onerror = function() { 
    currentTrackIndex++; 
    if(currentTrackIndex < playlist.length) playTrack(); 
};

// When current audio finishes, it instantly plays the next pre-loaded one.
audioEngine.onended = function() { 
    currentTrackIndex++; 
    playTrack(); 
};

// Dictionary & Hadith
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
        var resUr = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${b}/${n}.json`); 
        if(resAr.ok && resUr.ok) {
            var arData = await resAr.json(); var urData = await resUr.json();
            div.innerHTML = `<div class="arabic-text" style="font-size:30px; margin-bottom:15px; border:none;">${arData.hadiths[0].text}</div><hr><div style="font-size:18px; line-height:1.6;">${urData.hadiths[0].text}</div>`;
        } else { div.innerHTML = 'Hadith not found in this book.'; }
    } catch(e) {} showLoad(false);
}
