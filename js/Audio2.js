const ctx = new AudioContext(); 
let audio; 

fetch("./mp3/Snowblind.mp3") 
    .then(data => data.arrayBuffer()) 
    .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer)) 
    .then(decodedAudio => { 
        audio = decodedAudio; 
    });

function playback() {
    const playSound = ctx.createBufferSource(); 
    playSound.buffer = audio; 
    playSound.connect(ctx.destination); 
    playSound.start(ctx.currentTime); 
}

window.addEventListener("mousedown", playback); 