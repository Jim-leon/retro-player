const THEME = "70s";
const VU_METERS = "analogue";

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let audioElement = new Audio();
let currentTrackIndex = 0;
let tracks = [];
let analyser, audioLoadOffest, style, deflection, audioSource;
let trackPlaying = false;
let balance = false;
let volume = false;
let brightness = 0.25;

const leftLevelElement = document.getElementById("leftLevel");
const rightLevelElement = document.getElementById("rightLevel");
const stereoNode = new StereoPannerNode(audioContext, { pan: 0 });
const fileInput = document.getElementById("fileInput");
const themeLink = document.getElementById("theme");
const pointer1 = document.getElementById("pointer1");
const pointer2 = document.getElementById("pointer2");
const playlistElement = document.getElementById("playlist");
const displayTrkSong = document.querySelector(".display-container .trk-song");
const displayArtist = document.querySelector(".display-container .artist");
const displayAlbum = document.querySelector(".display-container .album");
const displayYearTimesVol = document.querySelector(".display-container .year-times-vol");
const screen = document.querySelector(".screen-wrapper");
const volumeSlider = $(".volume-slider");
const balanceSlider = $(".balance-slider");
const brightnessSlider = $(".brightness-slider");

themeLink.href = "theme/" + THEME + "/styles.css";

pointer1.src = pointer2.src = "theme/" + THEME + "/imgs/needle.png";
document.getElementById("logo").src = "theme/" + THEME + "/imgs/logo.png";
document.getElementById("select-song").addEventListener("click", triggerFiles);
document.getElementById("fileInput").addEventListener("change", handleFiles);
document.getElementById("playBtn").addEventListener("click", playTrack);
document.getElementById("pauseBtn").addEventListener("click", pauseTrack);
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
   tracks = Array.from(loadedFiles).filter((file) => file.type === "audio/mpeg");
   if (tracks.length) {
      updatePlaylist();
   }
}

function updatePlaylist() {
   playlistElement.innerHTML = "";
   showCoverArt();
   tracks.forEach((track, index) => {
      const trackElement = document.createElement("div");
      if (index == 0) trackElement.classList.add("selected");
      trackElement.textContent = track.name;
      trackElement.addEventListener("click", (event) => {
         selectTrack(index);
         updateCurrentTrack(event.target);
      });
      playlistElement.appendChild(trackElement);
   });
   // selectTrack(0);
}

function updateCurrentTrack(newTrack) {
   Array.from(playlistElement.children)
      .filter((child) => child != newTrack)
      .forEach((sibling) => {
         sibling.classList.remove("selected");
      });
   newTrack.classList.add("selected");
}

function selectTrack(index) {
   currentTrackIndex = index;
   loadTrack();
}

function loadTrack() {
   if (tracks.length === 0) return;
   const track = tracks[currentTrackIndex];

   audioElement.src = URL.createObjectURL(track);
   const audioLoadStart = new Date();
   audioElement.load();
   audioElement.addEventListener("loadedmetadata", () => {
      displayTrkSong.innerHTML = renderText(track.id3data.track + " " + track.id3data.title, 0, 30);
      displayArtist.innerHTML = renderText(track.id3data.artist, 0, 30);
      displayAlbum.innerHTML = renderText(track.id3data.album, 0, 30);
      audioElement.volume = volumeSlider.slider("value") / 100;
      trackPlaying = true;
      displayYearTimesVol.innerHTML = renderText(
         `${track.id3data.TDRC.data}    00:00/${formatTime(audioElement.duration)}   Vol: ` + ("00" + volumeSlider.slider("value").toString()).slice(-3),
         0,
         30
      );
   });

   audioElement.addEventListener("ended", nextTrack);
   audioLoadOffest = (new Date() - audioLoadStart) / 1000;
   playTrack();
}

function playTrack() {
   audioContext.resume().then(() => {
      audioElement.play();
      startAnalyser();
   });
}

function pauseTrack() {
   audioElement.pause();
}

function stopTrack() {
   audioElement.pause();
   audioElement.currentTime = 0;
}

function nextTrack() {
   currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
   updateCurrentTrack(tracks[currentTrackIndex]);
   loadTrack();
}

function prevTrack() {
   currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
   loadTrack();
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
   $(".mask").css("opacity", brightness);
   displayTrkSong.innerHTML = renderText("-- " + "-".repeat(songwidth), 0, 30);
   displayArtist.innerHTML = renderText("-".repeat(artistwidth), 0, 30);
   displayAlbum.innerHTML = renderText("-".repeat(albumwidth), 0, 30);
   displayYearTimesVol.innerHTML = renderText("---- -----------      " + "Vol:" + ("00" + volumeSlider.slider("value").toString()).slice(-3), 0, 30);
}

function insertScrews() {
   if (THEME != "retro") return;
   $("div.screws").remove();
   $('div[class*="-container"]').each(function () {
      const padd = "7px;";
      const screw = `<img src="theme/${THEME}/imgs/screw.png" style="`;
      $(this).append(
         `<div class="screws">${screw}left:${padd}top:${padd}${angle()}"/>${screw}right:${padd}top:${padd}${angle()}"/>${screw}right:${padd}bottom:${padd}${angle()}"/>${screw}left:${padd}bottom:${padd}${angle()}"/></div>`
      );
   });

   function angle() {
      return "transform:rotate(" + (Math.round(180 * Math.random()) + 1) + "deg);";
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
   document.querySelector("#pointer" + meter).style.WebkitTransform = "rotate(" + ((value / 255) * (Math.abs(deflection) * 2) + deflection) + "deg)";
}

function initSliders() {
   const knob = `<div class="my-handle ui-slider-handle"><img src="theme/${THEME}/imgs/slider-knob.png" alt="slider_knob" border="0"></div>`;
   volumeSlider.append(knob);
   volumeSlider.slider({
      range: "min",
      min: 0,
      max: 100,
      value: 5,
      slide: function (a, b) {
         volume = true;
         if (audioElement) {
            audioElement.volume = b.value / 100;
         }
         a = Math.ceil(b.value * 0.26);
         a = a > 26 ? 26 : a;
         const volStr = "Vol:" + (a != Math.round(b.value * 0.26) ? "^".repeat(a - 1) + "|" + " ".repeat(26 - a) : "^".repeat(a) + " ".repeat(26 - a));
         displayYearTimesVol.innerHTML = renderText(volStr, 0, 30);
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
         let balStr = "L" + "-".repeat(a) + "I" + "-".repeat(27 - a) + "R";
         displayYearTimesVol.innerHTML = renderText(balStr, 0, 30);
         stereoNode.pan.value = b.value;
         console.log(b.value);
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
         $(".mask").css("opacity", 1 - b.value / 100);
         brightness = 1 - b.value / 100;
      },
   });
}

function renderText(msg, start, len) {
   start < 0 && (start = 0);
   let d = "";
   msg = msg.replace(/\, /g, ",");
   msg = msg.slice(start);
   for (let e = 0; e < len; e++) {
      if (e < msg.length)
         if (((text = msg.charAt(e)), (textCase = text === text.toUpperCase() ? "upper" : "lower"), $.isNumeric(text)))
            (textCase = text % 2 == 0 ? "upper" : "lower"), (text = 2 * parseInt(text / 2)), (text = text.toString() + (text + 1).toString());
         else {
            f = false;
            switch (text.charCodeAt(0)) {
               case 0:
               case 32:
                  (text = "space-comma"), (textCase = "upper"), (f = true);
                  break;
               case 44:
                  (text = "space-comma"), (textCase = "lower");
                  break;
               case 63:
                  (text = "question-exclamation"), (textCase = "upper");
                  break;
               case 33:
                  (text = "question-exclamation"), (textCase = "lower");
                  break;
               case 42:
                  (text = "hash-star"), (textCase = "lower");
                  break;
               case 35:
                  (text = "hash-star"), (textCase = "upper");
                  break;
               case 38:
                  (text = "amp-period"), (textCase = "upper");
                  break;
               case 46:
                  (text = "amp-period"), (textCase = "lower");
                  break;
               case 64:
                  (text = "at-dollar"), (textCase = "upper");
                  break;
               case 36:
                  (text = "at-dollar"), (textCase = "lower");
                  break;
               case 163:
                  (text = "yen-pound"), (textCase = "lower");
                  break;
               case 34:
                  (text = "quote-apost"), (textCase = "upper");
                  break;
               case 39:
                  (text = "quote-apost"), (textCase = "lower");
                  break;
               case 58:
                  (text = "colon-semicolon"), (textCase = "upper");
                  break;
               case 59:
                  (text = "colon-semicolon"), (textCase = "lower");
                  break;
               case 45:
                  (text = "dash-slash"), (textCase = "upper");
                  break;
               case 47:
                  (text = "dash-slash"), (textCase = "lower");
                  break;
               case 124:
                  (text = "bar-dblbar"), (textCase = "upper");
                  break;
               case 94:
                  (text = "bar-dblbar"), (textCase = "lower");
                  break;
               case 40:
               case 60:
               case 91:
               case 123:
                  (text = "bracket"), (textCase = "upper");
                  break;
               case 41:
               case 62:
               case 93:
               case 125:
                  (text = "bracket"), (textCase = "lower");
                  break;
               case 194:
                  (text = ""), (textCase = "");
            }
         }
      else (text = "space-comma"), (textCase = "upper"), (f = true);
      if (text && textCase) {
         const g = f ? "space" : "";
         d += `<div style="background:url(theme/${THEME}/imgs/chars/medium/${text.toLowerCase()}.jpg)" class="${textCase}"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" class="mask ${g}" /></div>`;
      }
   }
   return d;
}

function timertime() {
   if (balance || volume) return true;
   if (!trackPlaying) {
      let date = new Date();
      const b = ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":" + ("0" + date.getSeconds()).slice(-2);
      displayYearTimesVol.innerHTML = renderText("----     " + b + "     Vol: " + ("00" + volumeSlider.slider("value").toString()).slice(-3), 0, 30);
   } else {
      displayYearTimesVol.innerHTML = renderText(
         `${tracks[currentTrackIndex].id3data.TDRC.data}    ${secondsToMS(audioContext.currentTime)}/${secondsToMS(audioElement.duration)}   Vol: ` +
            ("00" + volumeSlider.slider("value").toString()).slice(-3),
         0,
         30
      );
   }
   $(".mask").css("opacity", brightness);
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

function showCoverArt() {
   const track = tracks[0];
   getId3Data(track);
   setTimeout(() => {
      if (track.id3data?.picture) {
         coverArt = track.id3data.picture;
         for (let C = "", D = 0; D < coverArt.data.length; D++) C += String.fromCharCode(coverArt.data[D]);
         screen.style.backgroundImage = "url(" + "data:" + coverArt.format + ";base64," + window.btoa(C) + ")";
      } else {
         screen.style.backgroundImage = "url(data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=)";
      }
   }, 50);
}

function secondsToMS(s) {
   const m = Math.floor(s / 60);
   s -= m * 60;
   return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + parseInt(s) : parseInt(s));
}
