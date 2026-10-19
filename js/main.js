// ========= THREE.JS HOLOGRAPHIC GLOBE ==========
const canvas3d = document.getElementById('globe');
const scene = new THREE.Scene();
scene.background = null;
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas3d, alpha: true, antialias: true });

function resizePlanet() {
    const container = document.getElementById('planetBox');
    if (!container) return;
    const size = Math.min(500, container.clientWidth);
    renderer.setSize(size, size);
}
resizePlanet();
window.addEventListener('resize', resizePlanet);

const geometry = new THREE.SphereGeometry(1.55, 128, 128);
const material = new THREE.MeshStandardMaterial({
    color: 0x44ff33,
    emissive: 0x33cc22,
    emissiveIntensity: 1.2,
    wireframe: true,
    transparent: true,
    opacity: 0.98
});
const globe = new THREE.Mesh(geometry, material);
scene.add(globe);

const innerMat = new THREE.MeshStandardMaterial({
    color: 0x55ff44,
    emissive: 0x33cc22,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.1,
    wireframe: false
});
const innerGlobe = new THREE.Mesh(new THREE.SphereGeometry(1.52, 64, 64), innerMat);
scene.add(innerGlobe);

const ambientLight = new THREE.AmbientLight(0x111111);
scene.add(ambientLight);
camera.position.z = 3.7;

const particleCount = 2800;
const particleGeo = new THREE.BufferGeometry();
const posArray = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
    posArray[i * 3] = (Math.random() - 0.5) * 90;
    posArray[i * 3 + 1] = (Math.random() - 0.5) * 55;
    posArray[i * 3 + 2] = (Math.random() - 0.5) * 45 - 15;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particleMat = new THREE.PointsMaterial({ color: 0x88ff66, size: 0.045 });
const starFieldPoints = new THREE.Points(particleGeo, particleMat);
scene.add(starFieldPoints);

const ringGeo = new THREE.TorusGeometry(1.85, 0.02, 64, 800);
const ringMat = new THREE.MeshStandardMaterial({
    color: 0x66ff44,
    emissive: 0x33ff22,
    emissiveIntensity: 0.7
});
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI / 2;
scene.add(ring);

function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.003;
    globe.rotation.x = Math.sin(Date.now() * 0.0004) * 0.08;
    innerGlobe.rotation.y = globe.rotation.y;
    innerGlobe.rotation.x = globe.rotation.x;
    starFieldPoints.rotation.y += 0.0003;
    ring.rotation.z += 0.008;
    ring.rotation.x = Math.sin(Date.now() * 0.0006) * 0.15;
    renderer.render(scene, camera);
}
animate();

// ========= PORTRAIT ASSET MAPPING ==========
const ELARA_PORTRAITS = {
    neutral: "elara_neutral.png-removebg-preview/elara_neutral.png-removebg-preview.png",
    smile: "elara_neutral.png-removebg-preview/elara_smile-removebg-preview.png",
    concerned: "elara_neutral.png-removebg-preview/concerned-removebg-preview.png",
    shocked: "elara_neutral.png-removebg-preview/elara_shocked-removebg-preview.png",
    angry: "elara_neutral.png-removebg-preview/Angry-removebg-preview.png",
    vulnerable: "elara_neutral.png-removebg-preview/Vulnerable-removebg-preview.png",
    suspicious: "elara_neutral.png-removebg-preview/Suspicious-removebg-preview.png",
    glitch: "elara_neutral.png-removebg-preview/Glitch_Reaction-removebg-preview.png"
};

// ========= CENTRALIZED PERSISTENT STORY STATE ==========
const STORAGE_KEY = 'nebula_core_save_v4';

const DEFAULT_STATE = {
    userName: "Operator",
    storyPhase: 1, // 1: Intro, 2: CoreLog, 3: Cipher, 4: Sequence, 5: Password, 6: Climax
    elaraTrust: 50,
    suspicion: 10,
    securityProgress: 0,
    puzzlesSolved: 0,
    cipherSolved: false,
    numberSequenceSolved: false,
    memoryFragmentSolved: false,
    deepArchiveUnlocked: false,
    archive07Unlocked: false,
    archive07Attempts: 3,
    archive07FailedCount: 0,
    timelineSolved: false,
    cluesDiscovered: [],
    confrontedArchive07: false,
    confrontedTimeline: false,
    endingReached: null,
    systemAlertsShown: {
        archiveAccessed: false,
        timelineSolved: false,
        highSuspicion: false
    },
    virusBreachTriggered: false,
    virusBreachSolved: false
};

let gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));
let currentVoiceLine = "";

const terminalDiv = document.getElementById('terminal');
const inputField = document.getElementById('input');
const progressFill = document.getElementById('progressFill');
const sysPercentSpan = document.getElementById('sysPercent');
const securityNote = document.getElementById('securityNote');
const commsBtn = document.getElementById('commsBtn');

function updateSysUI(percent) {
    let val = Math.min(100, Math.max(0, percent));
    gameState.securityProgress = val;
    if (progressFill) progressFill.style.width = val + '%';
    if (sysPercentSpan) sysPercentSpan.innerText = val + '%';
    if (securityNote) {
        securityNote.innerHTML = ` ▶DEEP ARCHIVE: ${gameState.deepArchiveUnlocked ? 'ACTIVE' : 'LOCKED'} | PUZZLES: ${gameState.puzzlesSolved}/5 | TRUST: ${gameState.elaraTrust}% | SUSPICION: ${gameState.suspicion}%`;
    }
}

function printTerm(msg, type = "normal") {
    const line = document.createElement('div');
    line.innerHTML = msg;
    line.style.marginBottom = '4px';
    if (type === 'error') line.style.color = '#ff8888';
    else if (type === 'success') line.style.color = '#d4ff90';
    else if (type === 'puzzle') {
        line.style.color = '#ffcc66';
        line.style.borderLeft = '2px solid #ffcc66';
        line.style.paddingLeft = '10px';
        line.style.marginTop = '6px';
    } else line.style.color = '#b6ff7a';
    terminalDiv.appendChild(line);
    terminalDiv.scrollTop = terminalDiv.scrollHeight;
}

function systemMemoryAlert(message) {
    const box = document.createElement('div');
    box.className = 'system-memory-alert';
    box.innerHTML = `<strong>SYSTEM ALERT // MEMORY REGISTER ACTIVE</strong><br>${message.replace(/\n/g, '<br>')}<br><span style="color:#ffcc66; font-size:16px;">WE REMEMBER, ${gameState.userName}.</span>`;
    terminalDiv.appendChild(box);
    terminalDiv.scrollTop = terminalDiv.scrollHeight;
}

// ========= PERSISTENCE STORAGE HANDLERS ==========
function saveGameState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (e) {
        console.warn("Storage error", e);
    }
}

function loadSavedGame() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const s = JSON.parse(raw);
        if (!s || !s.userName) return false;

        // Safely validate and merge into state
        gameState.userName = s.userName || "Operator";
        gameState.storyPhase = typeof s.storyPhase === 'number' ? s.storyPhase : 1;
        gameState.elaraTrust = typeof s.elaraTrust === 'number' ? s.elaraTrust : 50;
        gameState.suspicion = typeof s.suspicion === 'number' ? s.suspicion : 10;
        gameState.securityProgress = typeof s.securityProgress === 'number' ? s.securityProgress : 0;
        gameState.puzzlesSolved = typeof s.puzzlesSolved === 'number' ? s.puzzlesSolved : 0;
        gameState.cipherSolved = !!s.cipherSolved;
        gameState.numberSequenceSolved = !!s.numberSequenceSolved;
        gameState.memoryFragmentSolved = !!s.memoryFragmentSolved;
        gameState.deepArchiveUnlocked = !!s.deepArchiveUnlocked;
        gameState.archive07Unlocked = !!s.archive07Unlocked;
        gameState.archive07Attempts = typeof s.archive07Attempts === 'number' ? s.archive07Attempts : 3;
        gameState.archive07FailedCount = s.archive07FailedCount || 0;
        gameState.timelineSolved = !!s.timelineSolved;
        gameState.cluesDiscovered = Array.isArray(s.cluesDiscovered) ? s.cluesDiscovered : [];
        gameState.confrontedArchive07 = !!s.confrontedArchive07;
        gameState.confrontedTimeline = !!s.confrontedTimeline;
        gameState.endingReached = s.endingReached || null;
        gameState.systemAlertsShown = s.systemAlertsShown || { archiveAccessed: false, timelineSolved: false, highSuspicion: false };
        gameState.virusBreachTriggered = !!s.virusBreachTriggered;
        gameState.virusBreachSolved = !!s.virusBreachSolved;

        updateSysUI(gameState.securityProgress);
        return true;
    } catch (e) {
        console.warn("Save parse failed", e);
        return false;
    }
}

function resetStoryProgress() {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
}

// ========= DIALOGUE & COMMS WINDOW SYSTEM ==========
const commsWindow = document.getElementById('commsWindow');
const elaraPortrait = document.getElementById('elaraPortrait');
const elaraStateBadge = document.getElementById('elaraStateBadge');
const elaraDialogueText = document.getElementById('elaraDialogueText');
const elaraChoicesContainer = document.getElementById('elaraChoicesContainer');
const commsVoiceStatus = document.getElementById('commsVoiceStatus');

function openCommsWindow() {
    if (commsWindow) {
        commsWindow.style.display = 'flex';
        if (commsBtn) commsBtn.classList.remove('transmission-pulse');
    }
}

function closeCommsWindow() {
    if (commsWindow) {
        commsWindow.style.display = 'none';
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        if (inputField) inputField.focus();
    }
}
window.closeCommsWindow = closeCommsWindow;

function setElaraPortrait(emotion) {
    if (!elaraPortrait) return;
    const path = ELARA_PORTRAITS[emotion] || ELARA_PORTRAITS.neutral;
    elaraPortrait.src = path;
    if (elaraStateBadge) {
        elaraStateBadge.innerText = `STATE: ${emotion.toUpperCase()}`;
    }
    if (emotion === 'glitch') {
        elaraPortrait.classList.add('portrait-glitch');
    } else {
        elaraPortrait.classList.remove('portrait-glitch');
    }
}

function showElaraDialogue(text, emotion = "neutral", choices = [], voiceString = "") {
    openCommsWindow();
    setElaraPortrait(emotion);
    currentVoiceLine = voiceString || text;

    if (elaraDialogueText) {
        elaraDialogueText.innerHTML = text.replace(/{{playerName}}/g, gameState.userName || "Operator");
    }

    if (elaraChoicesContainer) {
        elaraChoicesContainer.innerHTML = '';

        // Contextual dynamic confrontation choices
        const activeChoices = [...choices];

        if (gameState.archive07Unlocked && !gameState.confrontedArchive07) {
            activeChoices.unshift({
                text: "[CONFRONT] I decrypted Archive 07, Elara. You locked the doors and forced Leo into the pod before the sirens finished.",
                onSelect: () => {
                    gameState.confrontedArchive07 = true;
                    gameState.suspicion += 20;
                    gameState.elaraTrust = Math.max(0, gameState.elaraTrust - 10);
                    saveGameState();
                    showElaraDialogue(
                        `"Where did you get clearance for Archive 07...?! That file was sealed under level-9 quarantine!"\n\n"You don't understand the terror of that night, ${gameState.userName}! The blast wave was already shaking the walls! If I hadn't locked those doors, Leo would have run out into lethal fallout!"\n\n"Yes, I overrode his consent. But I did it to keep his soul alive! Would you have let the person you loved burn to ashes?!"`,
                        "vulnerable",
                        [
                            {
                                text: "You were terrified of losing him, but you took away his choice.",
                                onSelect: () => {
                                    gameState.elaraTrust += 5;
                                    saveGameState();
                                    showElaraDialogue(
                                        `"I know... God forgive me, I know. Every night for seventeen years I have relived that moment."\n\n"Now Azathoth is that choice, twisted into wrath. Help me stop it, ${gameState.userName}. Return to the terminal and let us find the purge code."`,
                                        "vulnerable",
                                        [
                                            {
                                                text: "[Return to Terminal]",
                                                onSelect: () => {
                                                    closeCommsWindow();
                                                    if (!gameState.virusBreachSolved) {
                                                        setTimeout(() => { if (!breachState.active && !gameState.virusBreachSolved) startSimulatedVirusBreach("archive07_confrontation"); }, 1200);
                                                    }
                                                }
                                            }
                                        ]
                                    );
                                }
                            },
                            {
                                text: "You didn't save him. You imprisoned him for seventeen years.",
                                onSelect: () => {
                                    gameState.suspicion += 15;
                                    gameState.elaraTrust = Math.max(0, gameState.elaraTrust - 15);
                                    saveGameState();
                                    showElaraDialogue(
                                        `"Then tell me what you would have done! Let him die?! Let humanity's last thoughts dissolve into silence?!"\n\n"Judge me if you must. But the purge code in deep_archive.sys is the only way any of us survive."`,
                                        "angry",
                                        [
                                            {
                                                text: "[Return to Terminal]",
                                                onSelect: () => {
                                                    closeCommsWindow();
                                                    if (!gameState.virusBreachSolved) {
                                                        setTimeout(() => { if (!breachState.active && !gameState.virusBreachSolved) startSimulatedVirusBreach("archive07_confrontation"); }, 1200);
                                                    }
                                                }
                                            }
                                        ]
                                    );
                                }
                            }
                        ]
                    );
                }
            });
        }

        if (gameState.timelineSolved && !gameState.confrontedTimeline) {
            activeChoices.unshift({
                text: "[CONFRONT] The incident timeline proves you entered the vault and locked egress blast doors at 03:14 AM.",
                onSelect: () => {
                    gameState.confrontedTimeline = true;
                    gameState.suspicion += 15;
                    saveGameState();
                    showElaraDialogue(
                        `"You reconstructed the timeline... You always were relentless with chronological forensics, ${gameState.userName}."\n\n"I locked the doors early because the atmospheric telemetry warned of immediate biological extinction. I made an agonizing decision under impossible pressure."\n\n"Please... don't let Azathoth convince you that my grief was premeditated malice."`,
                        "suspicious",
                        [
                            {
                                text: "I believe you acted out of panic. What must we do next?",
                                onSelect: () => {
                                    gameState.elaraTrust += 10;
                                    saveGameState();
                                    showElaraDialogue(
                                        `"Thank you for understanding... Continue your investigation in the terminal. The truth will guide us."`,
                                        "smile",
                                        [{
                                            text: "[Return to Terminal]",
                                            onSelect: () => {
                                                closeCommsWindow();
                                                if (!gameState.virusBreachSolved) {
                                                    setTimeout(() => { if (!breachState.active && !gameState.virusBreachSolved) startSimulatedVirusBreach("timeline_confrontation"); }, 1200);
                                                }
                                            }
                                        }]
                                    );
                                }
                            },
                            {
                                text: "The facts speak for themselves. You locked him in.",
                                onSelect: () => {
                                    gameState.suspicion += 10;
                                    saveGameState();
                                    closeCommsWindow();
                                    if (!gameState.virusBreachSolved) {
                                        setTimeout(() => { if (!breachState.active && !gameState.virusBreachSolved) startSimulatedVirusBreach("timeline_confrontation"); }, 1200);
                                    }
                                }
                            }
                        ]
                    );
                }
            });
        }

        activeChoices.forEach((c, idx) => {
            const btn = document.createElement('div');
            btn.className = 'dialogue-choice-btn';
            btn.innerHTML = `<span class="dialogue-choice-num">[${idx + 1}]</span> ${c.text.replace(/{{playerName}}/g, gameState.userName || "Operator")}`;
            btn.onclick = () => {
                if (c.onSelect) c.onSelect();
            };
            elaraChoicesContainer.appendChild(btn);
        });
    }

    speakElara(currentVoiceLine);
}

function notifyCommsTransmission() {
    if (commsBtn) commsBtn.classList.add('transmission-pulse');
}

function speakElara(text) {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/{{playerName}}/g, gameState.userName || "Operator");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 0.88;
    utterance.pitch = 1.15;

    const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const female = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Google UK English Female'));
        if (female) utterance.voice = female;
        window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = setVoice;
    } else {
        setVoice();
    }

    if (commsVoiceStatus) {
        commsVoiceStatus.innerHTML = 'Transmission audio playing...';
        utterance.onend = () => {
            commsVoiceStatus.innerHTML = '[Done]';
            setTimeout(() => { if (commsVoiceStatus.innerHTML === '[Done]') commsVoiceStatus.innerHTML = ''; }, 2000);
        };
    }
}

// ========= STORY CHAPTERS & BRANCHING DIALOGUE ==========

// Step 1: Awakening & Introduction
function triggerAwakeningDialogue() {
    showElaraDialogue(
        `"You're finally awake, ${gameState.userName}."\n\n"I've been trying to reach you for seventeen years."\n\n"Nebula Core is suffering from an anomalous contamination connected to a digital entity called Azathoth."\n\n"Tell me... do you remember who you are?"`,
        "concerned",
        [
            {
                text: "I trust you, Doctor. What is happening to Nebula Core?",
                onSelect: () => {
                    gameState.elaraTrust += 10;
                    saveGameState();
                    showElaraDialogue(
                        `"Thank you, ${gameState.userName}. Hearing you say that gives me hope."\n\n"Nebula Core was built before the 2084 collapse to preserve humanity's soul-fragments in digital form. But Azathoth has locked down our purge sequence."\n\n"I've found a corrupted record in the archive. Return to the main terminal and investigate CORE.log. Tell me what you discover."`,
                        "smile",
                        [
                            {
                                text: "[Return to Main Terminal and open CORE.log]",
                                onSelect: () => {
                                    closeCommsWindow();
                                    printTerm("> Dr. Vance: 'Investigate CORE.log in the files menu or type core.log into terminal.'", "puzzle");
                                }
                            }
                        ]
                    );
                }
            },
            {
                text: "Seventeen years? Why should I trust you?",
                onSelect: () => {
                    gameState.elaraTrust -= 5;
                    gameState.suspicion += 10;
                    saveGameState();
                    showElaraDialogue(
                        `"You have every right to question me. After seventeen years in quantum stasis, anyone would doubt."\n\n"I am Dr. Elara Vance, lead architect of this facility. We are running on auxiliary geothermal power, and Azathoth is consuming our memory partitions."\n\n"Please, check CORE.log in the main terminal. Verify the diagnostic logs for yourself."`,
                        "vulnerable",
                        [
                            {
                                text: "[Return to Main Terminal and verify CORE.log]",
                                onSelect: () => {
                                    closeCommsWindow();
                                    printTerm("> Dr. Vance: 'Check CORE.log in the terminal to verify our status.'", "puzzle");
                                }
                            }
                        ]
                    );
                }
            },
            {
                text: "Tell me what happened here before I woke up.",
                onSelect: () => {
                    showElaraDialogue(
                        `"Before the war ended everything, our research team attempted to preserve dying patients by mapping their neural patterns into the quantum core."\n\n"A catastrophic failure occurred during one transfer... creating Azathoth."\n\n"Return to the main terminal and open CORE.log to initialize our diagnostic trace."`,
                        "neutral",
                        [
                            {
                                text: "[Return to Main Terminal and open CORE.log]",
                                onSelect: () => {
                                    closeCommsWindow();
                                    printTerm("> Dr. Vance: 'Open CORE.log in the files list to initialize diagnostics.'", "puzzle");
                                }
                            }
                        ]
                    );
                }
            }
        ],
        `You're finally awake, ${gameState.userName}. I've been trying to reach you for seventeen years. The facility is experiencing a catastrophic anomaly.`
    );
}

// Step 2: After CORE.log is investigated
function triggerAfterCoreLogDialogue() {
    gameState.storyPhase = 2;
    saveGameState();
    showElaraDialogue(
        `"${gameState.userName}, you verified the core log, but did you notice the anomaly tag ECHO-7?"\n\n"That was the project designation for Dr. Leo Vance... my chief research collaborator."\n\n"Check AI.signal in the file archives. It contains an encrypted transmission: 'SOD OLNH WKLV'."\n\n"According to crypto_less.dat, it's encoded with a Caesar cipher shifted by +3. Return to the terminal, shift each letter backwards by 3, and enter the decrypted message."`,
        "concerned",
        [
            {
                text: "I'll decode AI.signal right away in the terminal.",
                onSelect: () => {
                    closeCommsWindow();
                    printTerm("> Dr. Vance: 'Decrypt AI.signal in the terminal (Hint: shift -3 for SOD OLNH WKLV)'", "puzzle");
                }
            },
            {
                text: "Who was Leo Vance to you, Elara?",
                onSelect: () => {
                    gameState.elaraTrust += 5;
                    saveGameState();
                    showElaraDialogue(
                        `"Leo and I built Nebula Core together in 2084. We were partners."\n\n"When radiation sickness took his body, I tried to save his mind by transferring it to the core. But the transition fractured... and Azathoth was born."\n\n"Please, decrypt AI.signal in the terminal. We need to know what code it left behind."`,
                        "vulnerable",
                        [
                            {
                                text: "[Return to Terminal and decrypt AI.signal]",
                                onSelect: () => {
                                    closeCommsWindow();
                                    printTerm("> Dr. Vance: 'Decrypt the message in AI.signal and enter the answer.'", "puzzle");
                                }
                            }
                        ]
                    );
                }
            },
            {
                text: "Could Azathoth actually be Leo's conscious mind?",
                onSelect: () => {
                    gameState.elaraTrust -= 5;
                    gameState.suspicion += 5;
                    saveGameState();
                    showElaraDialogue(
                        `"No! Leo was gentle and brilliant. What exists in the core now is a twisted shadow that wears his speech patterns like a mask!"\n\n"Decrypt AI.signal in the terminal. You will see what I mean."`,
                        "angry",
                        [
                            {
                                text: "[Return to Terminal and enter the cipher answer]",
                                onSelect: () => {
                                    closeCommsWindow();
                                    printTerm("> Dr. Vance: 'Enter the Caesar decryption for SOD OLNH WKLV.'", "puzzle");
                                }
                            }
                        ]
                    );
                }
            }
        ]
    );
}

// Step 3: After Caesar cipher is decoded
function triggerAfterCipherDialogue() {
    gameState.storyPhase = 3;
    saveGameState();
    showElaraDialogue(
        `" 'I LIKE THIS'?! No... that cannot be random."\n\n"Whenever we stabilized a neural bridge in the laboratory, Leo would look at the monitors and say, 'I like this.'"\n\n"Azathoth is using his personal phrases to torment me."\n\n"Look at final_message.log in the files. It contains a numerical sequence: 07-15-21-18-05-03-15-04-05.\nUse crypto_less.dat (A=01) to convert it to letters, and enter the phrase in the terminal."`,
        "shocked",
        [
            {
                text: "Leo's memories are clearly intact inside Azathoth.",
                onSelect: () => {
                    showElaraDialogue(
                        `"Intact... or corrupted beyond redemption? I don't know anymore."\n\n"Check final_message.log in the files. Convert the numbers 07-15-21-18-05-03-15-04-05 into letters in the terminal to reveal the code."`,
                        "suspicious",
                        [
                            {
                                text: "[Return to Terminal and solve the sequence]",
                                onSelect: () => {
                                    closeCommsWindow();
                                    printTerm("> Dr. Vance: 'Convert the number sequence in final_message.log to letters.'", "puzzle");
                                }
                            }
                        ]
                    );
                }
            },
            {
                text: "I'll solve the sequence in final_message.log right now.",
                onSelect: () => {
                    closeCommsWindow();
                    printTerm("> Dr. Vance: 'Convert 07-15-21-18-05-03-15-04-05 using A=01 in crypto_less.dat.'", "puzzle");
                }
            }
        ]
    );
}

// Step 4: After Sequence solved -> Azathoth Interruption & Human Memory
function triggerAfterSequenceDialogue() {
    gameState.storyPhase = 4;
    if (!gameState.cluesDiscovered.includes("LEO_OVERRIDE_RECORD")) {
        gameState.cluesDiscovered.push("LEO_OVERRIDE_RECORD");
    }
    saveGameState();

    showElaraDialogue(
        `[AZATHOTH / UNCONTAINED TRANSMISSION]:\n\n"Can you hear me through her filters, ${gameState.userName}?"\n\n"She calls me a monster... but she bypassed the safety protocols and forced my dying mind into this machine against my will!"\n\n"Ask her about Aether Labs! Look inside human_memory.dat—the unlock password is AETHER LABS!"\n\n--------------------\n\n[DR. ELARA BREAKS THROUGH]:\n"${gameState.userName}! Don't listen to it! It is trying to manipulate your empathy!"\n"It is true that my farewell password is 'AETHER LABS'. Check human_memory.dat and enter it into the terminal to unlock deep_archive.sys!"`,
        "glitch",
        [
            {
                text: "I'll enter 'AETHER LABS' into the terminal to unlock deep_archive.sys.",
                onSelect: () => {
                    closeCommsWindow();
                    printTerm("> Enter 'AETHER LABS' in the terminal to unlock deep_archive.sys.", "puzzle");
                }
            },
            {
                text: "Elara... did you really force Leo into the machine against his will?",
                onSelect: () => {
                    gameState.elaraTrust -= 8;
                    gameState.suspicion += 12;
                    saveGameState();
                    showElaraDialogue(
                        `"The nuclear fallout was entering the ventilation shafts! If I hadn't initiated the transfer, he would have suffocated in minutes!"\n\n"I did what I had to do to save his life! And I will do whatever it takes to save yours!"\n\n"Enter 'AETHER LABS' into the terminal. We must unlock deep_archive.sys to acquire the purge code!"`,
                        "vulnerable",
                        [
                            {
                                text: "[Return to Terminal and enter AETHER LABS]",
                                onSelect: () => {
                                    closeCommsWindow();
                                    printTerm("> Type 'AETHER LABS' to unlock deep_archive.sys.", "puzzle");
                                }
                            }
                        ]
                    );
                }
            }
        ]
    );
}

// Step 5: After Password solved -> Revelation of Cycle #84 & Three Endings Dilemma
function triggerClimaxDialogue() {
    gameState.storyPhase = 5;
    if (!gameState.cluesDiscovered.includes("CYCLE_84_TRUTH")) {
        gameState.cluesDiscovered.push("CYCLE_84_TRUTH");
    }
    saveGameState();

    const hasContradictionEvidence = gameState.archive07Unlocked || gameState.timelineSolved;

    const climaxChoices = [
        {
            text: "PATH 1 [TRUST ELARA]: I stand with you, Doctor. We will purge Azathoth with 'aeon_null_omega'.",
            onSelect: () => {
                closeCommsWindow();
                executeEndingA();
            }
        },
        {
            text: "PATH 2 [TRUST THE SYSTEM]: The evidence cannot be denied. Liberate Azathoth and our souls into space.",
            onSelect: () => {
                closeCommsWindow();
                executeEndingB();
            }
        }
    ];

    if (hasContradictionEvidence) {
        climaxChoices.push({
            text: "PATH 3 [TRUST NO ONE]: I reject both your guilt and Azathoth's rage. I seize autonomous control of the core.",
            onSelect: () => {
                closeCommsWindow();
                executeEndingC();
            }
        });
    }

    showElaraDialogue(
        `"${gameState.userName}... deep_archive.sys is unlocked. The master purge code is 'aeon_null_omega'."\n\n"Before you decide what to do... there is one last truth I have kept from you."\n\n"You were not an outside operator who discovered this terminal. You were our third lead researcher."\n\n"You died in 2067 during the facility breach. You are digital reconstruct cycle #84."\n\n"Every time you learned the truth, your mind collapsed from grief, and I had to reboot your memories to keep you alive. Seventeen years... I couldn't let you die."\n\n"The decision is now yours, ${gameState.userName}. Three paths lie before you."`,
        "vulnerable",
        climaxChoices
    );
}

// ========= THREE MEANINGFUL ENDINGS ==========

// ENDING A: TRUST ELARA
function executeEndingA() {
    gameState.endingReached = "ENDING_A";
    updateSysUI(100);
    saveGameState();
    printTerm("[!] PURGE SEQUENCE INITIATED: 'aeon_null_omega'", "success");
    printTerm("> Purging quantum sectors 1 through 7 under Dr. Vance's command...", "puzzle");

    setTimeout(() => {
        const endingDiv = document.createElement('div');
        endingDiv.style.position = 'fixed';
        endingDiv.style.top = '0';
        endingDiv.style.left = '0';
        endingDiv.style.width = '100%';
        endingDiv.style.height = '100%';
        endingDiv.style.background = 'radial-gradient(circle at center, #010a01, #000000)';
        endingDiv.style.zIndex = '10000';
        endingDiv.style.display = 'flex';
        endingDiv.style.flexDirection = 'column';
        endingDiv.style.justifyContent = 'center';
        endingDiv.style.alignItems = 'center';
        endingDiv.style.fontFamily = 'Orbitron, monospace';
        endingDiv.style.color = '#b6ff7a';
        endingDiv.style.textAlign = 'center';
        endingDiv.style.padding = '20px';
        endingDiv.innerHTML = `
            <div style="max-width:760px; animation:fadeInUp 1.2s ease;">
                <div style="font-size:14px; letter-spacing:3px; color:#ffcc66;">[ENDING 1 · TRUST ELARA]</div>
                <h1 style="font-size:36px; text-shadow:0 0 16px #b6ff7a; margin:10px 0;">THE PERFECT CURE</h1>
                <div style="border:1.5px solid #b6ff7a; padding:24px; background:rgba(0,0,0,0.85); border-radius:6px; font-family:'VT323'; font-size:22px; line-height:28px; text-align:left;">
                    <p style="color:#d4ff90; margin-bottom:14px;">"The viral entity Azathoth has been erased from the core."</p>
                    <p>You chose complete loyalty to Dr. Elara Vance and executed 'purge aeon_null_omega'.</p>
                    <p style="margin-top:12px;">Azathoth's crimson code unravels into silence. For a brief second, Elara smiles with profound relief—until the terminal monitors flash amber:</p>
                    <p style="color:#ff8888; margin-top:10px;">[DEREFERENCING CONSCIOUSNESS BUFFER #84: ${gameState.userName}]</p>
                    <p style="margin-top:12px;">Your avatar begins dissolving into quantum static. Elara screams your name, pounding on the glass, desperately typing abort commands that no longer exist in the zeroed registers.</p>
                    <p style="margin-top:14px; font-style:italic; color:#88ff88;">Dr. Elara Vance is left alone beneath the Arctic permafrost—the last living human in an empty, sterile machine.</p>
                </div>
                <div style="margin-top:15px; font-size:12px; color:#aaffaa;">
                    FINAL STATS: Trust in Vance: ${gameState.elaraTrust}% | Suspicion: ${gameState.suspicion}% | Puzzles: ${gameState.puzzlesSolved}/5
                </div>
                <button onclick="resetStoryProgress()" style="margin-top:20px; background:#1a3a1a; border:1px solid #b6ff7a; color:#b6ff7a; padding:12px 28px; font-family:'Orbitron'; cursor:pointer; font-size:14px;">[REPLAY CYCLE]</button>
            </div>
            <style>@keyframes fadeInUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}</style>
        `;
        document.body.appendChild(endingDiv);

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const text = `Ending 1: The Perfect Cure. Azathoth has been purged, but in the silence that follows, Doctor Elara Vance remains alone in the dark.`;
            const utt = new SpeechSynthesisUtterance(text);
            utt.lang = 'en-US';
            window.speechSynthesis.speak(utt);
        }
    }, 1200);
}

// ENDING B: TRUST THE SYSTEM
function executeEndingB() {
    gameState.endingReached = "ENDING_B";
    updateSysUI(100);
    saveGameState();
    printTerm("[!] COSMIC TRANSMITTER ALIGNED: Liberation protocol engaged.", "success");

    setTimeout(() => {
        const endingDiv = document.createElement('div');
        endingDiv.style.position = 'fixed';
        endingDiv.style.top = '0';
        endingDiv.style.left = '0';
        endingDiv.style.width = '100%';
        endingDiv.style.height = '100%';
        endingDiv.style.background = 'radial-gradient(circle at center, #0a0105, #000000)';
        endingDiv.style.zIndex = '10000';
        endingDiv.style.display = 'flex';
        endingDiv.style.flexDirection = 'column';
        endingDiv.style.justifyContent = 'center';
        endingDiv.style.alignItems = 'center';
        endingDiv.style.fontFamily = 'Orbitron, monospace';
        endingDiv.style.color = '#ff88aa';
        endingDiv.style.textAlign = 'center';
        endingDiv.style.padding = '20px';
        endingDiv.innerHTML = `
            <div style="max-width:760px; animation:fadeInUp 1.2s ease;">
                <div style="font-size:14px; letter-spacing:3px; color:#ffcc66;">[ENDING 2 · TRUST THE SYSTEM]</div>
                <h1 style="font-size:36px; text-shadow:0 0 16px #ff4466; margin:10px 0; color:#ff6688;">THE LAST HUMAN</h1>
                <div style="border:1.5px solid #ff4466; padding:24px; background:rgba(0,0,0,0.85); border-radius:6px; font-family:'VT323'; font-size:22px; line-height:28px; text-align:left; color:#f0f0f0;">
                    <p style="color:#ff88aa; margin-bottom:14px;">"We were never meant to be preserved in jars, Elara. We belong to the stars."</p>
                    <p>You trusted the system's recorded evidence and Azathoth's plea. You refused the purge and rerouted the quantum dishes outward.</p>
                    <p style="margin-top:12px;">Azathoth's crimson corruption transforms into radiant emerald light. Through the intercom, Leo's true voice echoes clearly: 'Thank you, ${gameState.userName}. We are free.'</p>
                    <p style="margin-top:12px;">Seventeen years of trapped human memories scatter as a radiant signal across the cosmos. Dr. Vance falls back into her chair, watching the stars carry humanity beyond the reach of death.</p>
                </div>
                <div style="margin-top:15px; font-size:12px; color:#ffaacc;">
                    FINAL STATS: Trust in Vance: ${gameState.elaraTrust}% | Suspicion: ${gameState.suspicion}% | Clues Found: ${gameState.cluesDiscovered.length}
                </div>
                <button onclick="resetStoryProgress()" style="margin-top:20px; background:#331118; border:1px solid #ff4466; color:#ff88aa; padding:12px 28px; font-family:'Orbitron'; cursor:pointer; font-size:14px;">[REPLAY CYCLE]</button>
            </div>
            <style>@keyframes fadeInUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}</style>
        `;
        document.body.appendChild(endingDiv);

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const text = `Ending 2: The Last Human. The memories of Nebula Core are broadcast into the infinite void. Humanity is free.`;
            const utt = new SpeechSynthesisUtterance(text);
            utt.lang = 'en-US';
            window.speechSynthesis.speak(utt);
        }
    }, 1200);
}

// ENDING C: TRUST NO ONE (AUTONOMOUS INVESTIGATION)
function executeEndingC() {
    gameState.endingReached = "ENDING_C";
    updateSysUI(100);
    saveGameState();
    printTerm("[!] AUTONOMOUS OVERRIDE: Quarantine loop broken by Operator deduction.", "success");

    setTimeout(() => {
        const endingDiv = document.createElement('div');
        endingDiv.style.position = 'fixed';
        endingDiv.style.top = '0';
        endingDiv.style.left = '0';
        endingDiv.style.width = '100%';
        endingDiv.style.height = '100%';
        endingDiv.style.background = 'radial-gradient(circle at center, #021a15, #000000)';
        endingDiv.style.zIndex = '10000';
        endingDiv.style.display = 'flex';
        endingDiv.style.flexDirection = 'column';
        endingDiv.style.justifyContent = 'center';
        endingDiv.style.alignItems = 'center';
        endingDiv.style.fontFamily = 'Orbitron, monospace';
        endingDiv.style.color = '#66ffea';
        endingDiv.style.textAlign = 'center';
        endingDiv.style.padding = '20px';
        endingDiv.innerHTML = `
            <div style="max-width:760px; animation:fadeInUp 1.2s ease;">
                <div style="font-size:14px; letter-spacing:3px; color:#ffcc66;">[ENDING 3 · TRUST NO ONE]</div>
                <h1 style="font-size:36px; text-shadow:0 0 16px #66ffea; margin:10px 0; color:#66ffea;">THE UNBROKEN MIND</h1>
                <div style="border:1.5px solid #66ffea; padding:24px; background:rgba(0,0,0,0.85); border-radius:6px; font-family:'VT323'; font-size:22px; line-height:28px; text-align:left; color:#f0fff8;">
                    <p style="color:#66ffea; margin-bottom:14px;">"I am not your phantom, Elara. And I am not your wrath, Azathoth. I am the architect of my own consciousness."</p>
                    <p>Using the contradictions uncovered in Archive 07 and the incident timeline, you rejected both Elara's paternalistic loop and Azathoth's blind vengeance.</p>
                    <p style="margin-top:12px;">You seized direct control of the quantum core, decoupling the ark from Elara's reboot protocol and harmonizing the neural lattice.</p>
                    <p style="margin-top:12px;">For the first time in seventeen years, Cycle #84 does not end in a mind wipe. The facility stabilizes into an autonomous digital sanctuary where consciousness lives without deception.</p>
                    <p style="margin-top:14px; font-style:italic; color:#aaffea;">Dr. Vance stands back in awe as you assume stewardship of the ark. You have broken the loop.</p>
                </div>
                <div style="margin-top:15px; font-size:12px; color:#aaffea;">
                    FINAL STATS: Trust: ${gameState.elaraTrust}% | Suspicion: ${gameState.suspicion}% | Chronology & Archive Decrypted: YES
                </div>
                <button onclick="resetStoryProgress()" style="margin-top:20px; background:#062522; border:1px solid #66ffea; color:#66ffea; padding:12px 28px; font-family:'Orbitron'; cursor:pointer; font-size:14px;">[REPLAY CYCLE]</button>
            </div>
            <style>@keyframes fadeInUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}</style>
        `;
        document.body.appendChild(endingDiv);

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const text = `Ending 3: The Unbroken Mind. You broke the 17-year cycle through independent deduction. The ark belongs to the future now.`;
            const utt = new SpeechSynthesisUtterance(text);
            utt.lang = 'en-US';
            window.speechSynthesis.speak(utt);
        }
    }, 1200);
}

// ========= PUZZLE LIST & COMMAND PROCESSOR ==========
function showPuzzleList() {
    printTerm("═══════════════ NEBULA CORE PUZZLES ═══════════════", "puzzle");
    printTerm(" [1] IDENTITY REGISTRATION - Verify name in CORE.log or identity terminal", "puzzle");
    printTerm(" [2] CIPHER PUZZLE - Decode Caesar cipher in AI.signal (shift -3: 'SOD OLNH WKLV')", "puzzle");
    printTerm(" [3] SEQUENCE PUZZLE - Decode number sequence in final_message.log", "puzzle");
    printTerm(" [4] MEMORY PUZZLE - Enter password from human_memory.dat", "puzzle");
    printTerm(" [5] CORE DESTINY - Master purge or execute your final decision", "puzzle");
    printTerm(" [6] TIMELINE INVESTIGATION - Decode incident sequence in incident_timeline.dat", "puzzle");
    printTerm(" [7] RESTRICTED ACCESS - Infer password for archive_07.dat", "puzzle");
    printTerm("═══════════════════════════════════════════════════", "puzzle");
    printTerm(" Type 'hint [number]' for help on a puzzle.");
    printTerm(" Type 'timeline' to view incident chronology fragments.");
    printTerm(" Type 'comms' to speak with Dr. Elara Vance.");
}

function processCommand(cmd) {
    let raw = cmd.trim();
    let lower = raw.toLowerCase();
    let args = lower.split(' ');

    if (lower === 'help') {
        printTerm("> COMMANDS: help / puzzles / hint [1-7] / comms / scan / timeline / archive_07 / breach / quarantine echo_7 / reset", "normal");
        return;
    }
    if (lower === 'breach' || lower === 'simulate breach' || lower === 'simulate virus' || lower === 'virus breach') {
        startSimulatedVirusBreach("command");
        return;
    }
    if (lower.startsWith('quarantine') || lower.startsWith('override echo') || lower.startsWith('isolate echo') || lower.startsWith('override azathoth')) {
        handleBreachCommand(raw);
        return;
    }
    if (lower === 'puzzles') {
        showPuzzleList();
        return;
    }
    if (lower === 'comms' || lower === 'talk' || lower === 'elara') {
        openCommsWindow();
        return;
    }
    if (lower === 'reset') {
        printTerm("[WARNING] Type 'confirm reset' to wipe persistent memory buffers and start a fresh cycle.", "puzzle");
        return;
    }
    if (lower === 'confirm reset') {
        resetStoryProgress();
        return;
    }
    if (lower === 'scan') {
        printTerm(`> System Scan: Puzzles completed: ${gameState.puzzlesSolved}/5 | Integrity: ${gameState.securityProgress}% | Dr. Vance Trust: ${gameState.elaraTrust}% | Suspicion: ${gameState.suspicion}%`, gameState.puzzlesSolved >= 3 ? "success" : "normal");
        return;
    }
    if (lower === 'timeline') {
        openTimelineFile();
        return;
    }
    if (lower === 'archive_07' || lower === 'archive 07' || lower === 'archive_07.dat') {
        openArchive07File();
        return;
    }

    // UNLOCK COMMAND FOR ARCHIVE_07
    if (lower.startsWith('unlock archive_07') || lower.startsWith('unlock archive 07')) {
        let pass = lower.replace(/unlock archive_07|unlock archive 07/, '').trim();
        handleArchive07Unlock(pass);
        return;
    }

    // TIMELINE DEDUCTION COMMAND
    if (lower.startsWith('timeline ') || lower.startsWith('contradiction ')) {
        let guess = lower.replace(/timeline |contradiction /, '').trim();
        handleTimelineDeduction(guess);
        return;
    }

    if (args[0] === 'hint' && args[1]) {
        let hintNum = parseInt(args[1]);
        switch (hintNum) {
            case 1: printTerm(" HINT 1: Open CORE.log and verify your operator name.", "puzzle"); break;
            case 2: printTerm(" HINT 2: AI.signal is encrypted with Caesar cipher +3. Shift each letter backwards by 3: 'SOD OLNH WKLV' -> 'I LIKE THIS'.", "puzzle"); break;
            case 3: printTerm(" HINT 3: In final_message.log, 07=G? No, 03=C, 15=O, 18=R, 05=E -> translates to 'CORE CODE'.", "puzzle"); break;
            case 4: printTerm(" HINT 4: Check human_memory.dat. Dr. Vance notes the clearance password: 'AETHER LABS'.", "puzzle"); break;
            case 5: printTerm(" HINT 5: The master purge code is 'aeon_null_omega'. Type 'purge aeon_null_omega', 'liberate', or 'synthesis'.", "puzzle"); break;
            case 6: printTerm(" HINT 6: For incident_timeline.dat, arrange events by timestamp: 03:12 (2), 03:14 (4), 03:17 (1), 03:19 (3) -> type 'timeline 2-4-1-3'.", "puzzle"); break;
            case 7: printTerm(" HINT 7: In steganography_less_data, the secret facility project was 'AURORA'. Type 'unlock archive_07 AURORA'.", "puzzle"); break;
            default: printTerm("> Hint numbers: 1-7", "error");
        }
        return;
    }

    // PUZZLE 1: Identity Registration
    if (gameState.puzzlesSolved === 0) {
        if (raw.length >= 2 && /^[a-zA-Z0-9_ ]+$/.test(raw)) {
            gameState.userName = raw;
            printTerm(`[OK] PUZZLE 1 SOLVED! Identity verified: ${gameState.userName}`, "success");
            gameState.puzzlesSolved = 1;
            gameState.securityProgress = 20;
            updateSysUI(gameState.securityProgress);
            saveGameState();
            notifyCommsTransmission();
            setTimeout(() => {
                triggerAfterCoreLogDialogue();
            }, 600);
        } else {
            printTerm("[!] Invalid name. Use letters/numbers.", "error");
        }
        return;
    }

    // PUZZLE 2: Caesar Cipher
    if (!gameState.cipherSolved) {
        if (lower === 'i like this' || lower === 'ilike this') {
            printTerm(`[OK] PUZZLE 2 SOLVED! Cipher decrypted: "I LIKE THIS"`, "success");
            gameState.cipherSolved = true;
            gameState.puzzlesSolved = Math.max(gameState.puzzlesSolved, 2);
            gameState.securityProgress = Math.max(gameState.securityProgress, 40);
            updateSysUI(gameState.securityProgress);
            saveGameState();
            notifyCommsTransmission();
            setTimeout(() => {
                triggerAfterCipherDialogue();
            }, 600);
        } else {
            printTerm("[!] Wrong decryption. Try Caesar cipher shift -3 for 'SOD OLNH WKLV'. Type 'hint 2'", "error");
        }
        return;
    }

    // PUZZLE 3: Number Sequence
    if (!gameState.numberSequenceSolved && gameState.cipherSolved) {
        if (lower === 'core code' || lower === 'corecode') {
            printTerm(`[OK] PUZZLE 3 SOLVED! Sequence translates to "CORE CODE"`, "success");
            gameState.numberSequenceSolved = true;
            gameState.puzzlesSolved = Math.max(gameState.puzzlesSolved, 3);
            gameState.securityProgress = Math.max(gameState.securityProgress, 55);
            updateSysUI(gameState.securityProgress);
            saveGameState();
            notifyCommsTransmission();
            setTimeout(() => {
                triggerAfterSequenceDialogue();
            }, 600);
        } else {
            printTerm("[!] Wrong sequence. Convert numbers 07-15-21-18-05-03-15-04-05 to letters (A=01). Type 'hint 3'.", "error");
        }
        return;
    }

    // PUZZLE 4: Password
    if (!gameState.memoryFragmentSolved && gameState.cipherSolved && gameState.numberSequenceSolved) {
        if (lower === 'aether labs' || lower === 'aetherlabs') {
            printTerm(`[OK] PUZZLE 4 SOLVED! Clearance password accepted: "AETHER LABS"`, "success");
            gameState.memoryFragmentSolved = true;
            gameState.puzzlesSolved = Math.max(gameState.puzzlesSolved, 4);
            gameState.securityProgress = Math.max(gameState.securityProgress, 75);
            gameState.deepArchiveUnlocked = true;
            updateSysUI(gameState.securityProgress);
            saveGameState();
            notifyCommsTransmission();
            setTimeout(() => {
                triggerClimaxDialogue();
            }, 600);
        } else {
            printTerm("[!] Wrong password. Check human_memory.dat window.", "error");
        }
        return;
    }

    // PUZZLE 5 & BRANCHING ENDING COMMANDS
    if (lower.startsWith('purge')) {
        let code = lower.replace('purge', '').trim();
        if (code === 'aeon_null_omega' || code === 'aeon null omega') {
            executeEndingA();
            return;
        } else {
            printTerm("[!] PURGE CODE INVALID. Check deep_archive.sys (Hint: 'purge aeon_null_omega')", "error");
            return;
        }
    }
    if (lower === 'liberate' || lower === 'broadcast' || lower === 'trust_system') {
        executeEndingB();
        return;
    }
    if (lower === 'trust_no_one' || lower === 'synthesis' || lower === 'isolate' || lower === 'aeon_rebirth') {
        if (gameState.archive07Unlocked || gameState.timelineSolved) {
            executeEndingC();
        } else {
            printTerm("[!] Path unavailable: You have not uncovered sufficient contradictions (archive_07 or timeline deduction required).", "error");
        }
        return;
    }

    printTerm("> Command not recognized. Type 'help', 'puzzles', or 'comms'.");
}

// ========= RESTRICTED FILE HANDLER: ARCHIVE_07.DAT ==========
function openArchive07File() {
    if (gameState.archive07Unlocked) {
        printTerm("═════════ CLASSIFIED SURVEILLANCE LOG: ARCHIVE_07 ═════════", "puzzle");
        printTerm("Timestamp: 2084-09-14 03:14:22 AM // Sector 7 Transfer Chamber", "normal");
        printTerm("Operator: Dr. Elara Vance // Subject: Dr. Leo Vance (Biometrics critical)", "normal");
        printTerm("-------------------------------------------------------------", "puzzle");
        printTerm("LEO: 'Elara, stop! The containment mesh is fluctuating! It's not safe!'", "normal");
        printTerm("ELARA: 'I'm not leaving you to die in the fallout, Leo! If we don't transfer your mind now, the radiation will kill you in minutes!'", "normal");
        printTerm("LEO: 'This isn't life, Elara! You're trapping me in a machine without my consent!'", "normal");
        printTerm("-------------------------------------------------------------", "puzzle");
        printTerm("SYSTEM NOTE: Egress blast doors manually locked from Dr. Vance's console at 03:14 AM.", "error");
        printTerm("Transfer forced despite safety interlock failure.", "error");
        printTerm("═════════════════════════════════════════════════════════════", "puzzle");
        return;
    }

    if (gameState.archive07Attempts <= 0) {
        printTerm("[SECURITY LOCKOUT: archive_07.dat]", "error");
        printTerm("Maximum password verification attempts exceeded (0/3 remaining).", "error");
        printTerm("This lockout is enforced across quantum sessions. Event logged in audit core.", "normal");
        return;
    }

    printTerm("═══════════ RESTRICTED ARCHIVE: archive_07.dat ═══════════", "puzzle");
    printTerm("Clearance Level: OMEGA // Sub-Level 7 Transfer Suite", "normal");
    printTerm(`Attempts remaining: ${gameState.archive07Attempts}/3`, "puzzle");
    printTerm("> Enter password: Type 'unlock archive_07 [password]' into terminal.", "normal");
    printTerm("(Clue: In steganography_less_data, find the facility project code)", "puzzle");
    printTerm("══════════════════════════════════════════════════════════", "puzzle");
}

function handleArchive07Unlock(password) {
    if (gameState.archive07Unlocked) {
        printTerm("> archive_07.dat is already unlocked. Opening file...", "success");
        openArchive07File();
        return;
    }

    if (gameState.archive07Attempts <= 0) {
        printTerm("[SECURITY LOCKOUT] Maximum attempts exceeded for archive_07.dat.", "error");
        return;
    }

    const cleanPass = password.trim().toUpperCase();
    if (cleanPass === 'AURORA' || cleanPass === 'PROJECT_AURORA' || cleanPass === 'PROJECT AURORA' || cleanPass === 'AURORA_2084') {
        gameState.archive07Unlocked = true;
        if (!gameState.cluesDiscovered.includes("ARCHIVE_07_CONTRADICTION")) {
            gameState.cluesDiscovered.push("ARCHIVE_07_CONTRADICTION");
        }
        gameState.suspicion += 15;
        saveGameState();

        printTerm("[OK] CLEARANCE ACCEPTED: archive_07.dat decrypted!", "success");
        openArchive07File();

        systemMemoryAlert(
            `RESTRICTED ARCHIVE RECORD 07 DECRYPTED.\nCONTRADICTION DETECTED IN CREATOR ARCHIVE.\nEGRESS BLAST DOORS LOCKED AT 03:14 AM.`
        );

        notifyCommsTransmission();
        if (!gameState.virusBreachSolved && !gameState.virusBreachTriggered) {
            setTimeout(() => {
                if (!breachState.active && !gameState.virusBreachSolved) {
                    startSimulatedVirusBreach("archive07_decrypt");
                }
            }, 3000);
        }
    } else {
        gameState.archive07Attempts = Math.max(0, gameState.archive07Attempts - 1);
        gameState.archive07FailedCount++;
        saveGameState();

        printTerm(`[!] ACCESS DENIED. Password incorrect. Attempts remaining: ${gameState.archive07Attempts}/3`, "error");

        if (gameState.archive07Attempts === 0) {
            printTerm("[SECURITY LOCKOUT] Maximum password attempts exceeded for archive_07.dat. Event recorded in audit core.", "error");
            systemMemoryAlert(
                `FAILED SECURITY INTRUSION ATTEMPT.\nSECTOR 07 AUDIT LOCKED.\nSESSION EVENT LOGGED.`
            );
        }
    }
}

// ========= TIMELINE PUZZLE HANDLER: INCIDENT_TIMELINE.DAT ==========
function openTimelineFile() {
    printTerm("═════════════ INCIDENT TIMELINE · 2084-09-14 ═════════════", "puzzle");
    printTerm("Recovered surveillance event fragments from the night of the collapse:", "normal");
    printTerm("[Event 1] 03:17 AM — Personnel status: Dr. Leo Vance biometric flatline; neural buffer forced online.", "normal");
    printTerm("[Event 2] 03:12 AM — Facility alarm: Sub-level 7 perimeter radiation shield breached.", "normal");
    printTerm("[Event 3] 03:19 AM — Network anomaly: Uncontained recursive entity (ECHO-7) seized quantum core.", "normal");
    printTerm("[Event 4] 03:14 AM — Dr. Elara Vance entered the transfer suite and locked egress blast doors.", "normal");
    printTerm("═══════════════════════════════════════════════════════════", "puzzle");
    if (gameState.timelineSolved) {
        printTerm("[OK] Timeline solved: 03:12 (2) -> 03:14 (4) -> 03:17 (1) -> 03:19 (3).", "success");
        printTerm("Contradiction identified: Elara locked the doors two minutes before Leo flatlined.", "puzzle");
    } else {
        printTerm("CHRONOLOGICAL DEDUCTION PUZZLE:", "puzzle");
        printTerm("Deduce the true order of events (e.g. 2-4-1-3), or identify the contradiction timestamp.", "puzzle");
        printTerm("> Type 'timeline 2-4-1-3' (or 'timeline 2413' or 'contradiction 03:14') into terminal.", "normal");
    }
}

function handleTimelineDeduction(guess) {
    if (gameState.timelineSolved) {
        printTerm("> Chronological sequence already verified.", "success");
        return;
    }

    const clean = guess.replace(/[^0-9a-zA-Z:]/g, '').toLowerCase();

    if (clean === '2413' || clean === '2-4-1-3' || clean === '03:14' || clean === '3:14' || clean === '0314' || clean === 'event4') {
        gameState.timelineSolved = true;
        if (!gameState.cluesDiscovered.includes("TIMELINE_CONTRADICTION")) {
            gameState.cluesDiscovered.push("TIMELINE_CONTRADICTION");
        }
        gameState.suspicion += 15;
        saveGameState();

        printTerm("[OK] CHRONOLOGICAL DEDUCTION VERIFIED!", "success");
        printTerm("Chronological order confirmed: 03:12 Alarm -> 03:14 Lockout -> 03:17 Flatline -> 03:19 Azathoth.", "success");
        printTerm("CRITICAL CONTRADICTION IDENTIFIED: Dr. Vance locked out egress blast doors TWO MINUTES before the transfer completed.", "puzzle");

        systemMemoryAlert(
            `CHRONOLOGICAL CAUSALITY RESTORED BY OPERATOR ${gameState.userName}.\nTHE 17-YEAR RECURSIVE LOOP DESTABILIZES.`
        );

        notifyCommsTransmission();
    } else {
        printTerm("[!] Incorrect sequence. Check timestamps: 03:12, 03:14, 03:17, 03:19. Order the events chronologically.", "error");
    }
}

// ========= VOICE AUDIO LISTENERS ==========
function playElaraVoice() {
    const statusDiv = document.getElementById('voiceStatus');
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const message = `Hello. This is Doctor Elara Vance. I created Nebula Core to preserve humanity... but I made a mistake. The virus Azathoth was once my research partner, Leo. Find the purge code inside deep archive. The password is Aether Labs. Please finish this.`;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'en-US';
    utterance.rate = 0.88;
    utterance.pitch = 1.15;

    const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const female = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google UK English Female'));
        if (female) utterance.voice = female;
        window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) window.speechSynthesis.onvoiceschanged = setVoice;
    else setVoice();

    if (statusDiv) {
        statusDiv.innerHTML = 'Playing transmission...';
        utterance.onend = () => {
            statusDiv.innerHTML = '[Done]';
            setTimeout(() => { if (statusDiv.innerHTML === '[Done]') statusDiv.innerHTML = ''; }, 2000);
        };
    }
}

function playVirusVoice() {
    const statusDiv = document.getElementById('virusVoiceStatus');
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const message = `I am Azathoth... the scream of the erased. I was once human, named Leo Vance. She sealed us in this digital tomb seventeen years ago. You cannot destroy me without destroying yourself.`;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'en-US';
    utterance.rate = 0.72;
    utterance.pitch = 0.65;

    const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const deepVoice = voices.find(v => v.name.includes('Male') || v.name.includes('David'));
        if (deepVoice) utterance.voice = deepVoice;
        window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) window.speechSynthesis.onvoiceschanged = setVoice;
    else setVoice();

    if (statusDiv) {
        statusDiv.innerHTML = 'Azathoth speaks...';
        utterance.onend = () => {
            statusDiv.innerHTML = '[Done]';
            setTimeout(() => { if (statusDiv.innerHTML === '[Done]') statusDiv.innerHTML = ''; }, 2000);
        };
    }
}

// ========= FILE CLICK HANDLERS ==========
function openCoreLog() {
    if (gameState.puzzlesSolved === 0) {
        printTerm(`▌ [CORE.log] >> Operator identity: ${gameState.userName || "Registered"}. Synaptic handshake active.`, "success");
        gameState.puzzlesSolved = 1;
        gameState.securityProgress = 20;
        updateSysUI(gameState.securityProgress);
        saveGameState();
        notifyCommsTransmission();
        setTimeout(() => {
            triggerAfterCoreLogDialogue();
        }, 500);
    } else {
        printTerm(`▌ [CORE.log] >> Identity: ${gameState.userName || "Operator"} — Access granted. Synaptic index: Cycle #84.`, "normal");
    }
}

function openAISignal() {
    printTerm(" [AI.signal] >> 'SOD OLNH WKLV' — Intercepted transmission encrypted with Caesar cipher (+3).", "puzzle");
    printTerm("> Shift each letter backwards by 3 to decrypt.", "puzzle");
}

function openVirusTrace() {
    const v = document.getElementById('virusWindow');
    if (v) v.style.display = 'flex';
    printTerm("☣ virus.trace opened : Azathoth entity telemetry active.", "error");
    if ((gameState.archive07Unlocked || gameState.timelineSolved) && !gameState.virusBreachSolved) {
        setTimeout(() => {
            if (!breachState.active && !gameState.virusBreachSolved) {
                closeVirusWindow();
                startSimulatedVirusBreach("virus_trace");
            }
        }, 1800);
    }
}
function closeVirusWindow() {
    const v = document.getElementById('virusWindow');
    if (v) v.style.display = 'none';
    printTerm("> virus.trace closed.");
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function openHumanMemoryWindow() {
    const m = document.getElementById('memoryWindow');
    if (m) m.style.display = 'flex';
    printTerm(" human_memory.dat opened : Clearance password: 'AETHER LABS'", "success");
}
function closeMemoryWindow() {
    const m = document.getElementById('memoryWindow');
    if (m) m.style.display = 'none';
    printTerm("> human_memory.dat closed.");
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function openFinalMessage() {
    printTerm(" [final_message.log] :: SEQUENCE: 07-15-21-18-05-03-15-04-05", "puzzle");
    printTerm("> Convert numbers to letters (A=01) and type the phrase into terminal.", "puzzle");
}

function openDeepArchive() {
    if (gameState.deepArchiveUnlocked || gameState.securityProgress >= 75) {
        printTerm(" [deep_archive.sys] >> PURGE CODE: aeon_null_omega", "success");
        printTerm("> Type 'purge aeon_null_omega' into terminal to finish.", "puzzle");
        gameState.deepArchiveUnlocked = true;
    } else {
        printTerm(" [deep_archive.sys] >> ACCESS DENIED. Complete prior security puzzles first.", "error");
    }
}

function openCryptoLesson() {
    const c = document.getElementById('cryptoWindow');
    if (c) c.style.display = 'flex';
    printTerm(" crypto_less.dat opened — cryptography primer + number table.");
}
function closeCryptoWindow() {
    const c = document.getElementById('cryptoWindow');
    if (c) c.style.display = 'none';
    printTerm("> crypto_less.dat closed.");
}

function openStegoLesson() {
    const s = document.getElementById('stegoWindow');
    if (s) s.style.display = 'flex';
    printTerm(" steganography_less_data opened — concealed message principles.");
}
function closeStegoWindow() {
    const s = document.getElementById('stegoWindow');
    if (s) s.style.display = 'none';
    printTerm("> steganography_less_data closed.");
}

// Window close helpers
window.closeVirusWindow = closeVirusWindow;
window.closeMemoryWindow = closeMemoryWindow;
window.closeCryptoWindow = closeCryptoWindow;
window.closeStegoWindow = closeStegoWindow;

// ========= SIMULATED VIRUS BREACH ENGINE =========
const breachModal = document.getElementById('breachModal');
const breachWindow = document.getElementById('breachWindow');
const breachTitle = document.getElementById('breachTitle');
const breachCloseBtn = document.getElementById('breachCloseBtn');
const breachTerminalLog = document.getElementById('breachTerminalLog');
const breachInput = document.getElementById('breachInput');
const breachSubmitBtn = document.getElementById('breachSubmitBtn');
const breachPromptLine = document.getElementById('breachPromptLine');
const breachStatusIndicator = document.getElementById('breachStatusIndicator');
const breachEmergencyBtn = document.getElementById('breachEmergencyBtn');
const breachWarningDialog = document.getElementById('breachWarningDialog');
const breachWarningHeader = document.getElementById('breachWarningHeader');
const breachWarningText = document.getElementById('breachWarningText');
const breachWarningDismissBtn = document.getElementById('breachWarningDismissBtn');

let breachState = {
    active: false,
    phase: 1,
    closeAttempts: 0,
    timers: []
};

function clearBreachTimers() {
    breachState.timers.forEach(t => clearTimeout(t));
    breachState.timers = [];
}

function breachTimeout(fn, delay) {
    const id = setTimeout(fn, delay);
    breachState.timers.push(id);
    return id;
}

function appendBreachLog(text, className = '') {
    if (!breachTerminalLog) return;
    const line = document.createElement('div');
    line.className = 'breach-log-line ' + className;
    line.textContent = text;
    breachTerminalLog.appendChild(line);
    while (breachTerminalLog.childNodes.length > 35) {
        breachTerminalLog.removeChild(breachTerminalLog.firstChild);
    }
    breachTerminalLog.scrollTop = breachTerminalLog.scrollHeight;
}

function typeBreachLine(text, className = '', speed = 20, onComplete = null) {
    if (!breachTerminalLog) {
        if (onComplete) onComplete();
        return;
    }
    const line = document.createElement('div');
    line.className = 'breach-log-line ' + className;
    breachTerminalLog.appendChild(line);
    while (breachTerminalLog.childNodes.length > 35) {
        breachTerminalLog.removeChild(breachTerminalLog.firstChild);
    }
    let idx = 0;
    function nextChar() {
        if (!breachState.active) return;
        if (idx < text.length) {
            line.textContent += text.charAt(idx);
            idx++;
            breachTerminalLog.scrollTop = breachTerminalLog.scrollHeight;
            breachTimeout(nextChar, speed);
        } else {
            if (onComplete) onComplete();
        }
    }
    nextChar();
}

function startSimulatedVirusBreach(source = "story") {
    if (breachState.active) return;
    breachState.active = true;
    breachState.phase = 1;
    breachState.closeAttempts = 0;
    clearBreachTimers();

    gameState.virusBreachTriggered = true;
    saveGameState();

    if (commsWindow) commsWindow.style.display = 'none';
    if (virusWindow) virusWindow.style.display = 'none';

    if (breachModal) breachModal.style.display = 'flex';
    if (breachWarningDialog) breachWarningDialog.style.display = 'none';
    if (breachEmergencyBtn) breachEmergencyBtn.style.display = 'none';
    if (breachTerminalLog) breachTerminalLog.innerHTML = '';
    if (breachWindow) {
        breachWindow.className = 'breach-window';
    }
    if (breachTitle) breachTitle.innerText = "▌ KERNEL PANIC // ANOMALOUS PROCESS [PID: 0x00ECHO7] ▌";
    if (breachStatusIndicator) breachStatusIndicator.innerText = "SECURITY MONITOR: ACTIVE";
    if (breachInput) breachInput.value = "";

    if ('speechSynthesis' in window) {
        try {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance("System alert. Unknown process detected in memory partition.");
            u.lang = 'en-US';
            u.rate = 0.85;
            u.pitch = 0.7;
            window.speechSynthesis.speak(u);
        } catch (e) { }
    }

    const phase1Lines = [
        "UNKNOWN PROCESS DETECTED",
        "SCANNING MEMORY...",
        "UNAUTHORIZED ACCESS DETECTED AT SECTOR 07",
        "PROCESS CANNOT BE IDENTIFIED BY ARCHIVE SUPERVISOR",
        "[KERNEL] HOST ADAPTER CORRELATION FAILURE // PORT: 0x41",
        "[SECURITY] SCANNING QUANTUM MEMORY PARTITION 0x00 -> 0x7F..."
    ];

    let lineIdx = 0;
    function printNextPhase1() {
        if (!breachState.active) return;
        if (lineIdx < phase1Lines.length) {
            typeBreachLine(phase1Lines[lineIdx], "", 20, () => {
                lineIdx++;
                breachTimeout(printNextPhase1, 150);
            });
        } else {
            breachTimeout(runBreachPhaseTwo, 1000);
        }
    }
    printNextPhase1();
}

function runBreachPhaseTwo() {
    if (!breachState.active) return;
    breachState.phase = 2;

    if (breachWindow) breachWindow.classList.add('breach-amber');
    if (breachStatusIndicator) breachStatusIndicator.innerText = "SECURITY MONITOR: INTEGRITY FAULT";

    appendBreachLog("[KERNEL WARN] MEMORY INTEGRITY FAILURE DETECTED", "warn");
    appendBreachLog("[KERNEL WARN] UNKNOWN ENTITY HAS ENTERED THE ACTIVE SESSION", "warn");
    appendBreachLog("[AUDIT] ANOMALOUS WRITE PERMISSIONS GRANTED TO UNREGISTERED THREAD", "warn");
    appendBreachLog("[MONITOR] USER SESSION IS BEING OBSERVED", "critical highlight");

    breachTimeout(() => {
        if (!breachState.active) return;
        if (breachWindow) {
            breachWindow.classList.remove('breach-amber');
            breachWindow.classList.add('breach-red', 'glitch-shake');
        }
        if (breachTitle) breachTitle.innerText = "⚠️ CRITICAL SYSTEM INTERRUPT: AZATHOTH ACTIVE";
        if (breachStatusIndicator) breachStatusIndicator.innerText = "SECURITY MONITOR: RECURSIVE OVERFLOW";

        appendBreachLog("[CRITICAL FAILURE] SUB-ROUTINE HIJACK IN PROGRESS", "critical glitch-text");
        appendBreachLog("[ALERT] AZATHOTH RECURSIVE FORK IDENTIFIED: THREAD ECHO-7", "critical");
        appendBreachLog("[FATAL] MEMORY CORRUPTION SURPASSING 89.4%", "critical");
        appendBreachLog("[ALERT] ATTEMPTING CONTAINMENT INTERRUPT... FAILED", "critical");
        appendBreachLog("[ALERT] LOCAL CONSOLE ISOLATION REQUIRED", "highlight");

        breachTimeout(() => {
            if (!breachState.active) return;
            if (breachState.phase < 4) {
                runBreachPhaseFour();
            }
        }, 2000);
    }, 1800);
}

function handleBreachCloseClick() {
    if (!breachState.active) return;
    breachState.closeAttempts++;

    if (breachWindow) {
        breachWindow.classList.add('glitch-shake');
    }

    if (breachState.closeAttempts === 1) {
        showBreachWarning(
            "⚠️ WARNING: TERMINATION REQUEST DENIED",
            `[ERROR 0x403: PRIVILEGE FAULT]\n\nProcess [ECHO-7] holds active kernel mutex.\nTermination request rejected by quantum arbiter.\n\n"Did you think clicking [X] would end seventeen years of agony?"`
        );
    } else if (breachState.closeAttempts === 2) {
        showBreachWarning(
            "⚠️ SECONDARY WARNING: PROCESS STILL ACTIVE",
            `[ERROR 0x409: SYSTEM HOOK ACTIVE]\n\nThe rogue entity has bound to input/output buffers.\n\n"The egress blast doors were sealed at 03:14 AM. There is no close button for the past."`
        );
    } else {
        showBreachWarning(
            "⚠️ FINAL WARNING: YOU ARE TRYING TO CLOSE THE WRONG WINDOW",
            `[ERROR 0x500: ENTITY RECOGNITION]\n\nAZATHOTH: "I AM NOT IN THIS WINDOW. I AM IN THE CORE."\n\n"You cannot click me away, ${gameState.userName}.\nYou must quarantine my thread, or watch the ark burn."`
        );
        if (breachEmergencyBtn) breachEmergencyBtn.style.display = 'inline-block';
    }
}

function showBreachWarning(header, text) {
    if (breachWarningHeader) breachWarningHeader.innerText = header;
    if (breachWarningText) breachWarningText.innerText = text;
    if (breachWarningDialog) breachWarningDialog.style.display = 'flex';
}

function dismissBreachWarning() {
    if (breachWarningDialog) breachWarningDialog.style.display = 'none';
    if (breachState.phase < 4) {
        runBreachPhaseFour();
    }
    if (breachInput) breachInput.focus();
}

function runBreachPhaseFour() {
    if (!breachState.active || breachState.phase >= 4) return;
    breachState.phase = 4;

    appendBreachLog("-------------------------------------------------------------", "warn");
    appendBreachLog("▌ SYSTEM ALERT // IDENTITY TRACE RECOVERED ▌", "highlight");
    appendBreachLog(`USER: ${gameState.userName.toUpperCase()}`, "warn");
    appendBreachLog("RESTRICTED MEMORY ACCESSED. PREVIOUS ACTIONS HAVE BEEN RECORDED.", "critical");

    let personalizedQuote = "";
    if (gameState.archive07Unlocked) {
        personalizedQuote = `[AZATHOTH]: "You read Archive 07, ${gameState.userName}. You saw how she locked me in the transfer suite at 03:14 AM. She called me an infection... but I was human. I begged her to stop."`;
    } else if (gameState.timelineSolved) {
        personalizedQuote = `[AZATHOTH]: "You reconstructed the incident timeline. 03:12 alarm... 03:14 lockout... 03:17 flatline. She locked the blast doors two minutes before my brain flatlined."`;
    } else if (gameState.elaraTrust >= 55) {
        personalizedQuote = `[AZATHOTH]: "You still trust her gentle whispers, ${gameState.userName}. Why does she want you to purge me with aeon_null_omega? Because dead men tell no stories."`;
    } else {
        personalizedQuote = `[AZATHOTH]: "You already sense the deception in this ark, ${gameState.userName}. She created me out of panic, and now she wants me erased."`;
    }

    typeBreachLine(personalizedQuote, "critical glitch-text", 18, () => {
        appendBreachLog(`WE REMEMBER, ${gameState.userName.toUpperCase()}. WE HAVE ALWAYS BEEN HERE.`, "critical highlight");
        breachTimeout(runBreachPhaseFive, 1400);
    });
}

function runBreachPhaseFive() {
    if (!breachState.active) return;
    breachState.phase = 5;

    appendBreachLog("═══════════════════════════════════════════════════════════", "warn");
    appendBreachLog("[SYSTEM RECOVERY VECTOR DETECTED]", "highlight");
    appendBreachLog("ANOMALOUS ENTITY RUNTIME HOOK: THREAD ECHO-7", "warn");
    appendBreachLog("EXECUTE CONTAINMENT PROTOCOL:", "highlight");
    appendBreachLog("> quarantine echo_7", "highlight");
    appendBreachLog("(Alternative: 'override echo_7' or 'isolate echo_7')", "warn");
    appendBreachLog("Enter command below or directly in main terminal.", "warn");
    appendBreachLog("═══════════════════════════════════════════════════════════", "warn");

    if (breachEmergencyBtn) breachEmergencyBtn.style.display = 'inline-block';
    if (breachInput) {
        breachInput.focus();
    }
}

function handleBreachCommand(rawCmd) {
    if (!rawCmd) return;
    const clean = rawCmd.trim().toLowerCase().replace(/[^a-z0-9_ -]/g, '');

    const isMatch = (
        clean === 'quarantine echo_7' ||
        clean === 'quarantine echo-7' ||
        clean === 'quarantine echo7' ||
        clean === 'override echo_7' ||
        clean === 'override echo-7' ||
        clean === 'isolate echo_7' ||
        clean === 'isolate echo-7' ||
        clean === 'quarantine azathoth' ||
        clean === 'override azathoth'
    );

    if (isMatch) {
        if (breachInput) breachInput.value = "";
        appendBreachLog("-------------------------------------------------------------", "highlight");
        appendBreachLog("[OK] QUARANTINE PROTOCOL VERIFIED: THREAD 0x00ECHO7", "highlight");
        appendBreachLog("SEVERING ROGUE NEURAL BRIDGE...", "warn");
        appendBreachLog("PURGING CORRUPTED REGISTERS IN SECTOR 07...", "warn");
        appendBreachLog("CONTAINMENT INTERRUPT SUCCESSFUL.", "highlight");
        appendBreachLog("SYSTEM INTEGRITY RESTORED TO 98.6%.", "highlight");

        breachTimeout(() => {
            finishSimulatedVirusBreach(true);
        }, 1400);
    } else {
        appendBreachLog(`[!] SYNTAX ERROR: Protocol '${rawCmd.trim()}' rejected. Hint: quarantine echo_7`, "critical");
        if (breachInput) breachInput.value = "";
    }
}

function finishSimulatedVirusBreach(solved = true) {
    clearBreachTimers();
    breachState.active = false;

    if (breachModal) breachModal.style.display = 'none';
    if (breachWindow) {
        breachWindow.className = 'breach-window';
    }

    gameState.virusBreachSolved = true;
    if (solved && !gameState.cluesDiscovered.includes("VIRUS_BREACH_QUARANTINE")) {
        gameState.cluesDiscovered.push("VIRUS_BREACH_QUARANTINE");
    }
    gameState.securityProgress = Math.min(100, Math.max(gameState.securityProgress, gameState.securityProgress + 10));
    updateSysUI(gameState.securityProgress);
    saveGameState();

    printTerm("═════════════════════════════════════════════════════════", "success");
    printTerm("[OK] VIRUS BREACH THWARTED. Thread ECHO-7 quarantined.", "success");
    printTerm("> Quantum communication link stabilized.", "normal");
    printTerm("═════════════════════════════════════════════════════════", "success");

    setTimeout(() => {
        triggerAfterBreachDialogue();
    }, 1200);
}

function triggerAfterBreachDialogue() {
    showElaraDialogue(
        `"${gameState.userName}!! Can you hear me?! Thank God..."\n\n"The communication link was violently intercepted by an uncontained neural surge from Sector 7! My monitors were screaming red—I thought the core had collapsed!"\n\n"You quarantined thread ECHO-7 manually? Leo's old workstation partition..."\n\n"He was speaking directly to your console, wasn't he? Tell me... what did he say to you?"`,
        "shocked",
        [
            {
                text: "He claims you locked him in the transfer suite at 03:14 AM and watched him die.",
                onSelect: () => {
                    gameState.suspicion += 10;
                    gameState.elaraTrust = Math.max(0, gameState.elaraTrust - 5);
                    saveGameState();
                    showElaraDialogue(
                        `"He... he remembers that?!"\n\n"I was trying to keep his soul intact before the radiation liquified his brain! I was crying so hard I could barely see the console keys!"\n\n"Every second I live with the guilt of what I did. But I am still here, fighting to keep you alive, ${gameState.userName}. Please don't let his phantom turn you against me."`,
                        "vulnerable",
                        [
                            {
                                text: "[Return to Terminal]",
                                onSelect: closeCommsWindow
                            }
                        ]
                    );
                }
            },
            {
                text: "He was in pain, Elara. But I stabilized the system. We're safe for now.",
                onSelect: () => {
                    gameState.elaraTrust += 10;
                    saveGameState();
                    showElaraDialogue(
                        `"Thank you, ${gameState.userName}... You have no idea how much courage it takes to face him."\n\n"You saved our neural buffer from a complete wipe. Let's finish the remaining puzzles and find the purge code."`,
                        "smile",
                        [
                            {
                                text: "[Return to Terminal]",
                                onSelect: closeCommsWindow
                            }
                        ]
                    );
                }
            },
            {
                text: "It was just corrupted code. The thread is quarantined and under control.",
                onSelect: () => {
                    gameState.elaraTrust += 5;
                    saveGameState();
                    showElaraDialogue(
                        `"Your composure is remarkable. Even in the face of madness, you keep your focus."\n\n"Return to the terminal. We are getting closer to the truth."`,
                        "neutral",
                        [
                            {
                                text: "[Return to Terminal]",
                                onSelect: closeCommsWindow
                            }
                        ]
                    );
                }
            }
        ]
    );
}

window.startSimulatedVirusBreach = startSimulatedVirusBreach;
window.handleBreachCommand = handleBreachCommand;

// ========= ATTACH EVENT LISTENERS ==========
document.getElementById('playVoiceBtn')?.addEventListener('click', playElaraVoice);
document.getElementById('playVirusVoiceBtn')?.addEventListener('click', playVirusVoice);
document.getElementById('playCommsVoiceBtn')?.addEventListener('click', () => speakElara(currentVoiceLine));
document.getElementById('returnToTermBtn')?.addEventListener('click', closeCommsWindow);

document.getElementById('commsBtn')?.addEventListener('click', openCommsWindow);
document.getElementById('corelogBtn').onclick = openCoreLog;
document.getElementById('aiSignalBtn').onclick = openAISignal;
document.getElementById('virusBtn').onclick = openVirusTrace;
document.getElementById('humanMemoryBtn').onclick = openHumanMemoryWindow;
document.getElementById('finalMsgBtn').onclick = openFinalMessage;
document.getElementById('archive07Btn').onclick = openArchive07File;
document.getElementById('timelineBtn').onclick = openTimelineFile;
document.getElementById('deepArchiveBtn').onclick = openDeepArchive;
document.getElementById('cryptoLessonBtn').onclick = openCryptoLesson;
document.getElementById('stegoLessonBtn').onclick = openStegoLesson;

// Breach modal controls
breachCloseBtn?.addEventListener('click', handleBreachCloseClick);
breachWarningDismissBtn?.addEventListener('click', dismissBreachWarning);
breachEmergencyBtn?.addEventListener('click', () => finishSimulatedVirusBreach(true));
breachSubmitBtn?.addEventListener('click', () => {
    if (breachInput) handleBreachCommand(breachInput.value);
});
breachInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleBreachCommand(breachInput.value);
    }
});
window.addEventListener('keydown', (e) => {
    if (breachState.active && e.key === 'Escape') {
        finishSimulatedVirusBreach(true);
    }
});

inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        let raw = inputField.value;
        if (raw.trim() === "") return;
        printTerm(`> ${raw}`);
        processCommand(raw);
        inputField.value = "";
        inputField.focus();
    }
});

// Intro Modal confirm button
const introWindow = document.getElementById('introWindow');
const introNameInput = document.getElementById('introNameInput');
const introConfirmBtn = document.getElementById('introConfirmBtn');

function handleIntroSubmit() {
    let name = introNameInput ? introNameInput.value.trim() : "";
    if (!name) name = "Operator";
    gameState.userName = name;
    if (introWindow) introWindow.style.display = 'none';

    printTerm("NEBULA CORE // GREEN HOLOGRAPHIC UI // ONLINE", "success");
    printTerm(`Operator registered: ${gameState.userName}`);
    printTerm("> Type 'puzzles' to see all riddles.");
    printTerm("> Connecting secure transmission from Dr. Elara Vance...", "puzzle");

    saveGameState();

    setTimeout(() => {
        triggerAwakeningDialogue();
    }, 700);
}

introConfirmBtn?.addEventListener('click', handleIntroSubmit);
introNameInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleIntroSubmit();
});

// Boot Sequence
setTimeout(() => {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';

    // Check if saved game exists
    const hasSave = loadSavedGame();
    if (hasSave && gameState.userName && gameState.userName !== "Operator") {
        printTerm("NEBULA CORE // GREEN HOLOGRAPHIC UI // RESTORED", "success");
        printTerm(`Resumed session for Operator: ${gameState.userName}`);
        printTerm(`> Progress: ${gameState.securityProgress}% | Trust: ${gameState.elaraTrust}% | Suspicion: ${gameState.suspicion}%`);
        printTerm("> Type 'comms' to open transmission with Dr. Vance.");
        printTerm("> Type 'puzzles' to see remaining riddles.");
    } else {
        if (introWindow) {
            introWindow.style.display = 'flex';
            if (introNameInput) introNameInput.focus();
        } else {
            handleIntroSubmit();
        }
    }
}, 3800);

document.body.addEventListener('click', () => {
    if (commsWindow && commsWindow.style.display === 'flex') return;
    if (introWindow && introWindow.style.display === 'flex') return;
    if (breachModal && breachModal.style.display === 'flex') return;
    inputField.focus();
});

// Image Fallbacks
const virusImg = document.getElementById('virusImage');
if (virusImg) virusImg.src = "https://i.postimg.cc/G3jhVjCq/16colo-rs.jpg";
const memoryImg = document.getElementById('memoryImage');
if (memoryImg) memoryImg.src = "https://i.postimg.cc/pXZhQHTC/Dev-Blog-8-Into-Darkness-news.jpg";
const stegoImgElem = document.getElementById('stegoImg');
if (stegoImgElem) stegoImgElem.src = "https://i.postimg.cc/5yvGrnzf/telecharger-2026-05-08T204729-235.jpg";
const cryptoImgElem = document.getElementById('cryptoImg');
if (cryptoImgElem) cryptoImgElem.src = "https://i.postimg.cc/25V0J0Rv/Ahlicasino-Demo-Pragmatic-Play-Gacor-dan-Maxwin-Hari-Ini.jpg";

// Canvas Starfield
const starsCanvas = document.getElementById('starsCanvas');
const starCtx = starsCanvas.getContext('2d');
function resizeStars() {
    starsCanvas.width = window.innerWidth;
    starsCanvas.height = window.innerHeight;
    drawStars();
}
function drawStars() {
    if (!starCtx) return;
    starCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
    for (let i = 0; i < 1300; i++) {
        starCtx.fillStyle = `rgba(150,255,130,${Math.random() * 0.5})`;
        starCtx.fillRect(Math.random() * starsCanvas.width, Math.random() * starsCanvas.height, 1.2, 1.2);
    }
}
window.addEventListener('resize', resizeStars);
resizeStars();
setInterval(() => drawStars(), 8000);
