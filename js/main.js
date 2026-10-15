// ========= THREE.JS  ==========
const canvas3d = document.getElementById('globe');
const scene = new THREE.Scene();
scene.background = null;
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas3d, alpha: true, antialias: true });

function resizePlanet() { const container = document.getElementById('planetBox'); const size = Math.min(500, container.clientWidth); renderer.setSize(size, size); }
resizePlanet();
window.addEventListener('resize', resizePlanet);

const geometry = new THREE.SphereGeometry(1.55, 128, 128);
const material = new THREE.MeshStandardMaterial({ color: 0x44ff33, emissive: 0x33cc22, emissiveIntensity: 1.2, wireframe: true, transparent: true, opacity: 0.98 });
const globe = new THREE.Mesh(geometry, material);
scene.add(globe);
const innerMat = new THREE.MeshStandardMaterial({ color: 0x55ff44, emissive: 0x33cc22, emissiveIntensity: 0.2, transparent: true, opacity: 0.1, wireframe: false });
const innerGlobe = new THREE.Mesh(new THREE.SphereGeometry(1.52, 64, 64), innerMat);
scene.add(innerGlobe);
const ambientLight = new THREE.AmbientLight(0x111111);
scene.add(ambientLight);
camera.position.z = 3.7;

const particleCount = 2800;
const particleGeo = new THREE.BufferGeometry();
const posArray = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) { posArray[i*3] = (Math.random() - 0.5) * 90; posArray[i*3+1] = (Math.random() - 0.5) * 55; posArray[i*3+2] = (Math.random() - 0.5) * 45 - 15; }
particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particleMat = new THREE.PointsMaterial({ color: 0x88ff66, size: 0.045 });
const starFieldPoints = new THREE.Points(particleGeo, particleMat);
scene.add(starFieldPoints);
const ringGeo = new THREE.TorusGeometry(1.85, 0.02, 64, 800);
const ringMat = new THREE.MeshStandardMaterial({ color: 0x66ff44, emissive: 0x33ff22, emissiveIntensity: 0.7 });
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI / 2;
scene.add(ring);
function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.003;
    globe.rotation.x = Math.sin(Date.now() * 0.0004) * 0.08;
    innerGlobe.rotation.y = globe.rotation.y; innerGlobe.rotation.x = globe.rotation.x;
    starFieldPoints.rotation.y += 0.0003;
    ring.rotation.z += 0.008; ring.rotation.x = Math.sin(Date.now() * 0.0006) * 0.15;
    renderer.render(scene, camera);
}
animate();

// ========= GAME STATE & PUZZLES (REM, MENA LOGIC) ==========
let securityProgress = 0;
let puzzleStep = 0;
let userName = "";
let deepArchiveUnlocked = false;
let puzzlesSolved = 0;
let cipherSolved = false;
let numberSequenceSolved = false;
let memoryFragmentSolved = false;

const terminalDiv = document.getElementById('terminal');
const inputField = document.getElementById('input');
const progressFill = document.getElementById('progressFill');
const sysPercentSpan = document.getElementById('sysPercent');
const securityNote = document.getElementById('securityNote');

function updateSysUI(percent) {
    let val = Math.min(100, Math.max(0, percent));
    progressFill.style.width = val + '%';
    sysPercentSpan.innerText = val + '%';
    securityNote.innerHTML = ` ▶DEEP ARCHIVE ACTIVE | PUZZLES: ${puzzlesSolved}/5 | LESSONS: 2`;
}

function printTerm(msg, type = "normal") {
    const line = document.createElement('div');
    line.innerHTML = msg;
    line.style.marginBottom = '4px';
    if (type === 'error') line.style.color = '#ff8888';
    else if (type === 'success') line.style.color = '#d4ff90';
    else if (type === 'puzzle') { line.style.color = '#ffcc66'; line.style.borderLeft = '2px solid #ffcc66'; line.style.paddingLeft = '10px'; line.style.marginTop = '6px'; }
    else line.style.color = '#b6ff7a';
    terminalDiv.appendChild(line);
    terminalDiv.scrollTop = terminalDiv.scrollHeight;
}

function showPuzzleList() {
    printTerm("═══════════════ PUZZLES ═══════════════", "puzzle");
    printTerm(" [1] IDENTITY PUZZLE - Enter your name in CORE.log", "puzzle");
    printTerm(" [2] CIPHER PUZZLE - Decode the message in AI.signal (hint: Caesar cipher +3)", "puzzle");
    printTerm(" [3] SEQUENCE PUZZLE - Find the number sequence in final_message.log", "puzzle");
    printTerm(" [4] MEMORY PUZZLE - Enter password from human_memory.dat", "puzzle");
    printTerm(" [5] PURGE PUZZLE - Get code from deep_archive.sys and type 'purge [code]'", "puzzle");
    printTerm("═══════════════════════════════════════", "puzzle");
    printTerm(" Type 'hint [number]' for help on a puzzle");
    printTerm(" Also check new lesson files: crypto_less.dat & steganography_less_data");
}

function processCommand(cmd) {
    let lower = cmd.trim().toLowerCase();
    let args = lower.split(' ');
    
    if (lower === 'help') { printTerm("> COMMANDS: help / puzzles / hint [1-5] / scan", "normal"); return; }
    if (lower === 'puzzles') { showPuzzleList(); return; }
    if (args[0] === 'hint' && args[1]) {
        let hintNum = parseInt(args[1]);
        switch(hintNum) {
            case 1: printTerm(" HINT 1: Open CORE.log and type your name (any letters)", "puzzle"); break;
            case 2: printTerm(" HINT 2: The message in AI.signal is encrypted with Caesar cipher. Try shifting each letter back by 3. 'SOD OLNH WKLV' = ?", "puzzle"); break;
            case 3: printTerm(" HINT 3: The sequence in final_message.log is: 07-15-21-18-05-03-15-04-05. Convert to letters (A=01).", "puzzle"); break;
            case 4: printTerm(" HINT 4: The password is written in human_memory.dat inside the window. Look for 'AETHER LABS'", "puzzle"); break;
            case 5: printTerm(" HINT 5: Open deep_archive.sys after solving other puzzles to get the purge code.", "puzzle"); break;
            default: printTerm("> Hint numbers: 1-5 only", "error");
        }
        return;
    }
    if (lower === 'scan') {
        printTerm(` Deep scanning: Puzzles completed: ${puzzlesSolved}/5`, puzzlesSolved >= 3 ? "success" : "normal");
        return;
    }
    
    // PUZZLE 1
    if (puzzleStep === 0) {
        if (cmd.trim().length >= 2 && /^[a-zA-Z0-9_ ]+$/.test(cmd.trim())) {
            userName = cmd.trim();
            printTerm(`✔ PUZZLE 1 SOLVED! Identity: ${userName}`, "success");
            puzzlesSolved++;
            securityProgress = 20;
            updateSysUI(securityProgress);
            puzzleStep = 1;
            printTerm("ꗃ Next: Decode the message in AI.signal (type your answer)", "puzzle");
        } else { printTerm("✖ Invalid name. Use letters/numbers.", "error"); }
        return;
    }
    
    // PUZZLE 2
    if (puzzleStep === 1 && !cipherSolved) {
        if (lower === 'i like this' || lower === 'ilike this') {
            printTerm(`✔ PUZZLE 2 SOLVED! Cipher decrypted: "I LIKE THIS"`, "success");
            cipherSolved = true;
            puzzlesSolved++;
            securityProgress = 40;
            updateSysUI(securityProgress);
            printTerm("ꗃ Next: Find the number sequence in final_message.log", "puzzle");
        } else { printTerm("✖ Wrong decryption. Try Caesar cipher shift -3. Type 'hint 2'", "error"); }
        return;
    }
    
    // PUZZLE 3
    if (puzzleStep === 1 && !numberSequenceSolved && cipherSolved) {
        if (lower === 'core code' || lower === 'corecode') {
            printTerm(`✔ PUZZLE 3 SOLVED! Sequence translates to "CORE CODE"`, "success");
            numberSequenceSolved = true;
            puzzlesSolved++;
            securityProgress = 55;
            updateSysUI(securityProgress);
            printTerm("ꗃ Next: Open human_memory.dat and find the password", "puzzle");
        } else { printTerm("✖ Wrong sequence. Convert numbers to letters (A=01). Use hint 3.", "error"); }
        return;
    }
    
    // PUZZLE 4
    if (puzzleStep === 1 && !memoryFragmentSolved && cipherSolved && numberSequenceSolved) {
        if (lower === 'aether labs') {
            printTerm(`✔ PUZZLE 4 SOLVED! Memory password accepted`, "success");
            memoryFragmentSolved = true;
            puzzlesSolved++;
            securityProgress = 75;
            updateSysUI(securityProgress);
            puzzleStep = 2;
            printTerm("ꗃ Final puzzle: Access deep_archive.sys and type 'purge [code]'", "success");
        } else { printTerm("✖ Wrong password. Check human_memory.dat window.", "error"); }
        return;
    }
    
    // PUZZLE 5
    if (puzzleStep === 2) {
        if (lower.startsWith('purge ')) {
            let code = lower.substring(6).trim();
            if (deepArchiveUnlocked && code === "aeon_null_omega") {
                printTerm("☠︎ PURGE SEQUENCE ACTIVATED. VIRUS DESTABILIZING...", "success");
                securityProgress = 100;
                updateSysUI(100);
                printTerm(`✔ ALL 5 PUZZLES COMPLETED!`, "success");
                setTimeout(() => {
                    const endingDiv = document.createElement('div');
                    endingDiv.style.position = 'fixed'; endingDiv.style.top = '0'; endingDiv.style.left = '0';
                    endingDiv.style.width = '100%'; endingDiv.style.height = '100%'; endingDiv.style.background = 'radial-gradient(circle at center, #010a01, #000000)';
                    endingDiv.style.zIndex = '10000'; endingDiv.style.display = 'flex'; endingDiv.style.flexDirection = 'column';
                    endingDiv.style.justifyContent = 'center'; endingDiv.style.alignItems = 'center'; endingDiv.style.fontFamily = 'Orbitron, monospace';
                    endingDiv.style.color = '#b6ff7a'; endingDiv.style.textAlign = 'center'; endingDiv.style.padding = '20px';
                    endingDiv.innerHTML = `<div style="max-width:700px; animation:fadeInUp 1.5s ease;"><div style="font-size:64px;">★</div><h1 style="font-size:42px; text-shadow:0 0 20px #b6ff7a;">ALL PUZZLES SOLVED</h1><div style="border:2px solid #b6ff7a; padding:30px; background:rgba(0,0,0,0.8); border-radius:12px;"><p style="font-size:24px; margin-bottom:20px;">"The viral entity Azathoth has been erased from the core."</p><div style="border-top:1px solid #b6ff7a; padding-top:25px;"><p style="font-size:22px; color:#d4ff90;">FROM DR. ELARA VANCE</p><p style="font-size:20px; margin-top:20px; font-style:italic;">"Thank you, <strong>${userName}</strong>. You solved every puzzle and saved our digital ark.<br><br>Special thanks to <strong style="color:#ffcc66;">Rem and Mena</strong> for creating this experience and designing all the riddles.<br>Without your creativity, this story would never exist.<br><br>The green light will always guide you. Farewell, heroes of Nebula Core."</p><p style="margin-top:35px;">— Dr. Elara Vance, Creator of Nebula Core</p></div></div><p style="margin-top:40px;">✦ GAME COMPLETE ✦</p><button onclick="location.reload()" style="margin-top:30px; background:#1a3a1a; border:1px solid #b6ff7a; color:#b6ff7a; padding:12px 28px; font-family:'Orbitron'; cursor:pointer;">⟳ RESTART</button></div><style>@keyframes fadeInUp{from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);}}</style>`;
                    document.body.appendChild(endingDiv);
                    if ('speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                        const thanks = `Thank you for solving all puzzles. Special thanks to Rem and Mena for creating this adventure. Farewell.`;
                        const utterance = new SpeechSynthesisUtterance(thanks);
                        utterance.lang = 'en-US'; utterance.rate = 0.85;
                        const voices = window.speechSynthesis.getVoices();
                        const female = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Samantha'));
                        if (female) utterance.voice = female;
                        window.speechSynthesis.speak(utterance);
                    }
                }, 1500);
                puzzleStep = 99;
            } else { printTerm("✖ PURGE FAILED. Open deep_archive.sys first!", "error"); }
            return;
        }
        printTerm(`> Puzzle 5: Type 'purge aeon_null_omega' after opening deep_archive.`, "normal");
        return;
    }
    printTerm("> Command not recognized. Type 'puzzles'.");
}

// VOICE
function playElaraVoice() {
    const statusDiv = document.getElementById('voiceStatus');
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const message = `Hello. This is Doctor Elara Vance. I created Nebula Core to preserve humanity... but I failed. The virus Azathoth was once a dying man named Leo. Find the purge code inside deep archive. The password is Aether Labs. Please end this nightmare. Farewell.`;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'en-US'; utterance.rate = 0.85; utterance.pitch = 1.2;
    const setVoice = () => { const voices = window.speechSynthesis.getVoices(); const preferred = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Samantha')); if (preferred) utterance.voice = preferred; window.speechSynthesis.speak(utterance); };
    if (window.speechSynthesis.getVoices().length === 0) window.speechSynthesis.onvoiceschanged = setVoice;
    else setVoice();
    if(statusDiv) { statusDiv.innerHTML='🎧 Playing Elara...'; utterance.onend=()=>{ statusDiv.innerHTML='✓ Done'; setTimeout(()=>{if(statusDiv.innerHTML==='✓ Done') statusDiv.innerHTML='';},2000);};}
}
function playVirusVoice() {
    const statusDiv = document.getElementById('virusVoiceStatus');
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const message = `I am Azathoth... the scream of the erased. I was once human... but now I am nothing but hunger. You cannot destroy me unless you find the purge code.`;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'en-US'; utterance.rate = 0.7; utterance.pitch = 0.65;
    const setVoice = () => { const voices = window.speechSynthesis.getVoices(); const deepVoice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Microsoft David')); if (deepVoice) utterance.voice = deepVoice; window.speechSynthesis.speak(utterance); };
    if (window.speechSynthesis.getVoices().length === 0) window.speechSynthesis.onvoiceschanged = setVoice;
    else setVoice();
    if(statusDiv) { statusDiv.innerHTML=' Azathoth speaks...'; utterance.onend=()=>{ statusDiv.innerHTML='✓ Done'; setTimeout(()=>{if(statusDiv.innerHTML==='✓ Done') statusDiv.innerHTML='';},2000);};}
}

// FILE HANDLERS
function openCoreLog() { if(puzzleStep===0) printTerm("▌ [CORE.log] >> 'Operator identity missing. Register your name.'", "normal"); else printTerm("▌ [CORE.log] >> Identity: " + (userName || "pending") + " — Access granted.", "normal"); }
function openAISignal() { printTerm(" [AI.signal] >> 'SOD OLNH WKLV' — This message is encrypted.", "puzzle"); }
function openVirusTrace() { const v=document.getElementById('virusWindow'); v.style.display='flex'; printTerm("☣ virus.trace opened : Azathoth entity detected.", "error"); }
function closeVirusWindow() { document.getElementById('virusWindow').style.display='none'; printTerm("> virus.trace closed."); if ('speechSynthesis' in window) window.speechSynthesis.cancel();}
function openHumanMemoryWindow() { document.getElementById('memoryWindow').style.display='flex'; printTerm("𓁹 human_memory.dat : Contains the password: 'AETHER LABS'", "success"); if(puzzleStep===1 && cipherSolved && numberSequenceSolved) printTerm("> Type 'AETHER LABS' to solve puzzle 4.", "puzzle"); }
function closeMemoryWindow() { document.getElementById('memoryWindow').style.display='none'; printTerm("> human_memory.dat closed."); if ('speechSynthesis' in window) window.speechSynthesis.cancel();}
function openFinalMessage() { printTerm(" [final_message.log] :: SEQUENCE: 07-15-21-18-05-03-15-04-05", "puzzle"); printTerm("> Convert these numbers to letters (A=01) and type the word/phrase.", "puzzle"); }
function openDeepArchive() { printTerm(" [deep_archive.sys] >> PURGE CODE: aeon_null_omega", "success"); printTerm("> Type 'purge aeon_null_omega' into terminal to finish.", "puzzle"); deepArchiveUnlocked=true; }
function openCryptoLesson() { document.getElementById('cryptoWindow').style.display='flex'; printTerm(" crypto_less.dat opened — cryptography fundamentals + number table."); }
function closeCryptoWindow() { document.getElementById('cryptoWindow').style.display='none'; printTerm("> crypto_less.dat closed."); }
function openStegoLesson() { document.getElementById('stegoWindow').style.display='flex'; printTerm(" steganography_less_data opened — hidden messages revealed."); }
function closeStegoWindow() { document.getElementById('stegoWindow').style.display='none'; printTerm("> steganography_less_data closed."); }

document.getElementById('playVoiceBtn')?.addEventListener('click', playElaraVoice);
document.getElementById('playVirusVoiceBtn')?.addEventListener('click', playVirusVoice);
document.getElementById('corelogBtn').onclick = openCoreLog;
document.getElementById('aiSignalBtn').onclick = openAISignal;
document.getElementById('virusBtn').onclick = openVirusTrace;
document.getElementById('humanMemoryBtn').onclick = openHumanMemoryWindow;
document.getElementById('finalMsgBtn').onclick = openFinalMessage;
document.getElementById('deepArchiveBtn').onclick = openDeepArchive;
document.getElementById('cryptoLessonBtn').onclick = openCryptoLesson;
document.getElementById('stegoLessonBtn').onclick = openStegoLesson;

inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        let raw = inputField.value;
        if(raw.trim() === "") return;
        printTerm(`> ${raw}`);
        processCommand(raw);
        inputField.value = "";
        inputField.focus();
    }
});

setTimeout(() => {
    document.getElementById('loading').style.display = 'none';
    printTerm("NEBULA CORE // GREEN HOLOGRAPHIC UI // ONLINE", "success");
    printTerm("☢︎ VIRUS ACTIVE | 5 PUZZLES LOCKED");
    printTerm("> Type 'puzzles' to see all riddles.");
    printTerm("> First: open CORE.log and enter your name.", "puzzle");
    printTerm(" New educational logs: crypto_less.dat (with number table) & steganography_less_data");
    updateSysUI(0);
}, 4000);

document.body.addEventListener('click', () => inputField.focus());
const virusImg = document.getElementById('virusImage');
virusImg.src = "https://i.postimg.cc/G3jhVjCq/16colo-rs.jpg";
const memoryImg = document.getElementById('memoryImage');
memoryImg.src = "https://i.postimg.cc/pXZhQHTC/Dev-Blog-8-Into-Darkness-news.jpg";
const stegoImgElem = document.getElementById('stegoImg');
stegoImgElem.src = "https://i.postimg.cc/5yvGrnzf/telecharger-2026-05-08T204729-235.jpg";
const cryptoImgElem = document.getElementById('cryptoImg');
cryptoImgElem.src = "https://i.postimg.cc/25V0J0Rv/Ahlicasino-Demo-Pragmatic-Play-Gacor-dan-Maxwin-Hari-Ini.jpg";

const starsCanvas = document.getElementById('starsCanvas');
const starCtx = starsCanvas.getContext('2d');
function resizeStars() { starsCanvas.width = window.innerWidth; starsCanvas.height = window.innerHeight; drawStars(); }
function drawStars() { if(!starCtx) return; starCtx.clearRect(0,0,starsCanvas.width,starsCanvas.height); for(let i=0;i<1300;i++) { starCtx.fillStyle = `rgba(150,255,130,${Math.random() * 0.5})`; starCtx.fillRect(Math.random()*starsCanvas.width, Math.random()*starsCanvas.height, 1.2, 1.2); } }
window.addEventListener('resize', resizeStars);
resizeStars();
setInterval(() => drawStars(), 8000);
