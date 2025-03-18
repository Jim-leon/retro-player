const THEME = "retro";
const VU_METERS = "analogue";
const CHAR_DIR = `theme/${THEME}/imgs/chars/medium/`;
const DISPLAY_LENGTH = 30;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let audioElement = new Audio();
let currentTrackIndex = 0;
let tracks = [];
let analyser, style, deflection, audioSource, year;
let trackPlaying = false;
let balance = false;
let volume = false;
let brightness = 0.25;

const leftLevelElement = document.getElementById("leftLevel");
const rightLevelElement = document.getElementById("rightLevel");
const stereoNode = new StereoPannerNode(audioContext, { pan: 0 });
const fileInput = document.getElementById("fileInput");
const playlist = document.getElementById("playlist");
const displayTrkSong = document.querySelector(".display-container .trk-song");
const displayArtist = document.querySelector(".display-container .artist");
const displayAlbum = document.querySelector(".display-container .album");
const displayMiscInfo = document.querySelector(".display-container .year-times-vol");
const screen = document.querySelector(".screen-wrapper");
const volumeSlider = $(".volume-slider");
const balanceSlider = $(".balance-slider");
const brightnessSlider = $(".brightness-slider");

document.getElementById("pointer1").src = document.getElementById("pointer2").src = `theme/${THEME}/imgs/needle.png`;
document.getElementById("theme").href = `theme/${THEME}/styles.css`;
document.getElementById("logo").src = `theme/${THEME}/imgs/logo.png`;
document.getElementById("select-song").addEventListener("click", triggerFiles);
document.getElementById("fileInput").addEventListener("change", handleFiles);
document.getElementById("pauseBtn").addEventListener("click", pauseTrack);
document.getElementById("playBtn").addEventListener("click", playTrack);
document.getElementById("stopBtn").addEventListener("click", stopTrack);
document.getElementById("nextBtn").addEventListener("click", nextTrack);
document.getElementById("prevBtn").addEventListener("click", prevTrack);

document.addEventListener("DOMContentLoaded", () => {
   style = window.getComputedStyle(document.body);
   deflection = parseInt(style.getPropertyValue("--deflection").replace("deg", ""));
   setInterval(timertime, 1e2);
   initSliders();
   initDisplay();
   insertScrews();
});

window.onresize = function () {
   insertScrews();
};

function triggerFiles() {
   fileInput.click();
}

function handleFiles(event) {
   const loadedFiles = event.target.files;
   console.log(loadedFiles);

   tracks = [];
   tracks = Array.from(loadedFiles).filter((file) => file.type === "audio/mpeg");
   if (tracks.length) updatePlaylist();
}

function updatePlaylist() {
   playlist.innerHTML = "";
   let lastTrack = 0;
   tracks.forEach((track, index) => {
      getId3Data(track);
      setTimeout(() => {
         const trackElement = document.createElement("div");
         if (index == currentTrackIndex) trackElement.classList.add("selected");
         if (lastTrack > parseInt(track.id3data.track)) playlist.append("-".repeat(30));
         trackElement.textContent = track.name.replace(".mp3", "");
         trackElement.addEventListener("click", (event) => {
            selectTrack(index);
            updateCurrentTrack(index);
            trackPlaying = true;
         });
         lastTrack = parseInt(track.id3data.track);
         playlist.appendChild(trackElement);
      }, 100);
   });
   // selectTrack(0);
   setTimeout(() => {
      const trackData = tracks[0].id3data;
      showCoverArt(trackData);
      const artist = trackData.artist;
      const album = trackData.album;
      const genre = trackData.genre;
      year = trackData.year || trackData.TDRC.data;
      displayTrkSong.innerHTML = renderText(centreText(artist));
      displayArtist.innerHTML = renderText(centreText(album));
      displayAlbum.innerHTML = renderText(centreText(genre));
      displayMiscInfo.innerHTML = renderText(centreText(year));
   }, 500);

   audioElement.volume = volumeSlider.slider("value") / 100;
}

function centreText(text) {
   if (!text) return;
   const lpad = DISPLAY_LENGTH / 2 - text.length / 2;
   const rpad = DISPLAY_LENGTH - lpad + text.length;
   return `${" ".repeat(lpad)}${text}${" ".repeat(rpad)}`;
}

function updateCurrentTrack(newTrack) {
   Array.from(playlist.children).forEach((sibling, index) => {
      if (newTrack == index) sibling.classList.add("selected");
      else sibling.classList.remove("selected");
   });
}

function selectTrack(index) {
   currentTrackIndex = index;
   loadTrack();
}

function loadTrack() {
   if (tracks.length === 0) return;
   const track = tracks[currentTrackIndex];
   audioElement.src = URL.createObjectURL(track);

   audioElement.load();
   audioElement.addEventListener("loadedmetadata", () => {
      displayTrkSong.innerHTML = renderText(`${track.id3data.track} ${track.id3data.title}`);
      displayArtist.innerHTML = renderText(track.id3data.artist);
      displayAlbum.innerHTML = renderText(track.id3data.album);
      audioElement.volume = volumeSlider.slider("value") / 100;
      displayMiscInfo.innerHTML = renderText(`${year}    00:00/${formatTime(audioElement.duration)}    ${getVolume()}`);
   });
   audioElement.addEventListener("ended", nextTrack);
}

function playTrack() {
   if (trackPlaying) {
      audioContext.resume().then(() => {
         audioElement.play();
      });
   } else {
      selectTrack(currentTrackIndex);
      trackPlaying = true;
      audioElement.play();
      audioElement.currentTime = 0;
      startAnalyser();
   }
}

function pauseTrack() {
   audioElement.pause();
}

function stopTrack() {
   audioElement.pause();
   audioElement.currentTime = 0;
   trackPlaying = false;
}

function nextTrack() {
   currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
   updateCurrentTrack(currentTrackIndex);
   loadTrack();
   audioElement.play();
}

function prevTrack() {
   currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
   updateCurrentTrack(currentTrackIndex);
   loadTrack();
   audioElement.play();
}

function formatTime(seconds) {
   const minutes = Math.floor(seconds / 60);
   const secs = Math.floor(seconds % 60);
   return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function startAnalyser() {
   if (!audioSource) {
      audioSource = audioContext.createMediaElementSource(audioElement);
      analyser = audioContext.createAnalyser();
      audioSource.connect(analyser);
      analyser.connect(audioContext.destination);
      audioSource.connect(stereoNode).connect(audioContext.destination);
   }

   analyser.fftSize = 2048;
   const dataArray = new Uint8Array(analyser.frequencyBinCount);

   function updateVU() {
      analyser.getByteFrequencyData(dataArray);
      const leftLevel = dataArray[0];
      const rightLevel = dataArray[1];

      if (VU_METERS == "analogue") {
         movement(1, leftLevel);
         movement(2, rightLevel);
      }
      if (VU_METERS == "bargraph") {
         leftLevelElement.style.width = 100 - (leftLevel / 255) * 100 + "%";
         rightLevelElement.style.width = 100 - (rightLevel / 255) * 100 + "%";
      }
      requestAnimationFrame(updateVU);
   }
   updateVU();
}

function initDisplay() {
   screen.style.backgroundImage = "url(data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=)";
   mask();
   displayTrkSong.innerHTML = renderText("-".repeat(DISPLAY_LENGTH));
   displayArtist.innerHTML = renderText("-".repeat(DISPLAY_LENGTH));
   displayAlbum.innerHTML = renderText("-".repeat(DISPLAY_LENGTH));
   displayMiscInfo.innerHTML = renderText(`---- -----------      ${getVolume()}`);
}

function insertScrews() {
   if (THEME != "retro") return;
   const screws = document.querySelectorAll(".screws");
   screws.forEach((screw) => {
      screw.remove();
   });

   document.querySelectorAll('div[class*="-container"]').forEach((div) => {
      const padd = "7px;";
      const screw = `<img src="theme/${THEME}/imgs/screw.png" style="`;
      div.insertAdjacentHTML(
         "beforeend",
         `<div class="screws">
            ${screw}left:${padd}top:${padd}${angle()}"/>
            ${screw}right:${padd}top:${padd}${angle()}"/>
            ${screw}right:${padd}bottom:${padd}${angle()}"/>
            ${screw}left:${padd}bottom:${padd}${angle()}"/>
         </div>`
      );
   });

   function angle() {
      return `transform:rotate(${Math.round(180 * Math.random()) + 1}deg);`;
   }
}

function outputPerformanceTime(contextTime) {
   const timestamp = context.getOutputTimestamp();
   const elapsedTime = contextTime - timestamp.contextTime;
   return timestamp.performanceTime + elapsedTime * 1000;
}

function movement(meter, value) {
   if (!deflection) {
      style = window.getComputedStyle(document.body);
      deflection = parseInt(style.getPropertyValue("--deflection").replace("deg", ""));
   }
   document.querySelector("#pol" + meter).style.opacity = value > 180 ? 1 : 0;
   document.querySelector("#pointer" + meter).style.WebkitTransform = `rotate(${(value / 255) * (Math.abs(deflection) * 2) + deflection}deg)`;
}

function initSliders() {
   const knob = `<div class="my-handle ui-slider-handle">
                    <img src="theme/${THEME}/imgs/slider-knob.png" alt="slider_knob" border="0">
                 </div>`;

   volumeSlider.append(knob);
   volumeSlider.slider({
      range: "min",
      min: 0,
      max: 100,
      value: 5,
      slide: function (a, b) {
         volume = true;
         if (audioElement) audioElement.volume = b.value / 100;
         a = Math.ceil(b.value * 0.27);
         a = a > 27 ? 27 : a;
         const volStr = "Vol" + (a != Math.round(b.value * 0.27) ? "^".repeat(a - 1) + "|" + " ".repeat(27 - a) : "^".repeat(a) + " ".repeat(27 - a));
         displayMiscInfo.innerHTML = renderText(volStr);
      },
      stop: function (event, ui) {
         volume = false;
      },
   });

   balanceSlider.append(knob);
   balanceSlider.slider({
      range: "min",
      min: -1,
      max: 1,
      value: 0,
      step: 0.01,
      slide: function (a, b) {
         balance = true;
         a = Math.ceil(parseInt(b.value * 14) + 14);
         let balStr = "L" + "-".repeat(a) + "i" + "-".repeat(27 - a) + "R";
         displayMiscInfo.innerHTML = renderText(balStr);
         stereoNode.pan.value = b.value;
      },
      stop: function (event, ui) {
         balance = false;
      },
   });

   brightnessSlider.append(knob);
   brightnessSlider.slider({
      range: "max",
      min: 50,
      max: 100,
      value: 75,
      slide: function (a, b) {
         brightness = 1 - b.value / 100;
         mask();
      },
   });
}

function renderText(msg) {
   if (!msg) msg = "-".repeat(DISPLAY_LENGTH);
   let disp = "";
   msg = msg.replace(/\, /g, ",");
   for (let e = 0; e < DISPLAY_LENGTH; e++) {
      if (e < msg.length)
         if (((text = msg.charAt(e)), (textCase = text === text.toUpperCase() ? "upper" : "lower"), $.isNumeric(text)))
            (textCase = text % 2 == 0 ? "upper" : "lower"), (text = 2 * parseInt(text / 2)), (text = text.toString() + (text + 1).toString());
         else {
            f = false;
            switch (text.charCodeAt(0)) {
               case 0:
               case 32:
                  text = "space-comma";
                  textCase = "upper";
                  f = true;
                  break;
               case 44:
                  text = "space-comma";
                  textCase = "lower";
                  break;
               case 63:
                  text = "question-exclamation";
                  textCase = "upper";
                  break;
               case 33:
                  text = "question-exclamation";
                  textCase = "lower";
                  break;
               case 42:
                  text = "hash-star";
                  textCase = "lower";
                  break;
               case 35:
                  text = "hash-star";
                  textCase = "upper";
                  break;
               case 38:
                  text = "amp-period";
                  textCase = "upper";
                  break;
               case 46:
                  text = "amp-period";
                  textCase = "lower";
                  break;
               case 64:
                  text = "at-dollar";
                  textCase = "upper";
                  break;
               case 36:
                  text = "at-dollar";
                  textCase = "lower";
                  break;
               case 163:
                  text = "yen-pound";
                  textCase = "lower";
                  break;
               case 34:
                  text = "quote-apost";
                  textCase = "upper";
                  break;
               case 39:
                  text = "quote-apost";
                  textCase = "lower";
                  break;
               case 58:
                  text = "colon-semicolon";
                  textCase = "upper";
                  break;
               case 59:
                  text = "colon-semicolon";
                  textCase = "lower";
                  break;
               case 45:
                  text = "dash-slash";
                  textCase = "upper";
                  break;
               case 47:
                  text = "dash-slash";
                  textCase = "lower";
                  break;
               case 124:
                  text = "bar-dblbar";
                  textCase = "upper";
                  break;
               case 94:
                  text = "bar-dblbar";
                  textCase = "lower";
                  break;
               case 40:
               case 60:
               case 91:
               case 123:
                  text = "bracket";
                  textCase = "upper";
                  break;
               case 41:
               case 62:
               case 93:
               case 125:
                  text = "bracket";
                  textCase = "lower";
                  break;
               case 194:
                  text = "";
                  textCase = "";
            }
         }
      else {
         text = "space-comma";
         textCase = "upper";
         f = true;
      }
      if (text && textCase) {
         const g = f ? "space" : "";
         disp += `<div style="background:url(${CHAR_DIR}${text.toLowerCase()}.jpg)" class="${textCase}">
                  <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" class="mask ${g}" />
               </div>`;
      }
   }
   return disp;
}

function timertime() {
   if (balance || volume) return true;
   const yr = year ? year : "----";
   if (!trackPlaying) {
      const date = new Date();
      const hours = String(date.getHours()).padStart(2, "0");
      const mins = String(date.getMinutes()).padStart(2, "0");
      const secs = String(date.getSeconds()).padStart(2, "0");
      const blink = secs % 2 ? " " : "-";
      const time = `${hours}${blink}${mins}${blink}${secs}`;
      displayMiscInfo.innerHTML = renderText(`${yr}      ${time}     ${getVolume()}`);
   } else displayMiscInfo.innerHTML = renderText(`${yr}    ${formatTime(audioElement.currentTime)}/${formatTime(audioElement.duration)}    ${getVolume()}`);
   mask();
}

function mask() {
   const masks = document.querySelectorAll(".mask");
   masks.forEach((mask) => {
      mask.style.opacity = brightness;
   });
}

function getVolume() {
   return `Vol ${String(volumeSlider.slider("value")).padStart(3, "0")}`;
}

function getId3Data(track) {
   jsmediatags.read(track, {
      onSuccess: function (tag) {
         track.id3data = tag.tags;
      },
      onError: function (error) {
         track.id3data = false;
      },
   });
}

function showCoverArt(data) {
   if (data?.picture) {
      coverData = data.picture;
      let coverArt = "";
      for (dataBlock = 0; dataBlock < coverData.data.length; dataBlock++) {
         coverArt += String.fromCharCode(coverData.data[dataBlock]);
      }
      screen.style.backgroundImage = `url(data:${coverData.format};base64,${window.btoa(coverArt)})`;
   } else screen.style.backgroundImage = "url(data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=)";
}
