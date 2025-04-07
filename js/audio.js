let theme = "Retro";

const THEMES = ["Retro", "70s", "90s"];

const DISPLAY_WIDTH = 30;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const leftLevelElement = document.getElementById("leftLevel");
const rightLevelElement = document.getElementById("rightLevel");
const stereoNode = new StereoPannerNode(audioContext, { pan: 0 });
const fileInput = document.getElementById("fileInput");
const playlist = document.getElementById("playlist");
const displayTrkSong = document.querySelector(".display-container .trk-song");
const displayArtist = document.querySelector(".display-container .artist");
const displayAlbum = document.querySelector(".display-container .album");
const displayMiscInfo = document.querySelector(".display-container .year-times-vol");
const themeSelector = document.querySelector(".themes-container #themes");
const screen = document.querySelector(".screen-wrapper");
const volumeSlider = $(".volume-slider");
const balanceSlider = $(".balance-slider");
const brightnessSlider = $(".brightness-slider");

let audioElement = new Audio();
let currentTrackIndex = 0;
let tracks = [];
let analyser, style, audioSource, year, charDir, screw, sliderKnob;
let trackPlaying = false;
let balance = false;
let volume = false;
let compilation = false;
let brightness = 0.25;

document.getElementById("select-song").addEventListener("click", triggerFiles);
document.getElementById("fileInput").addEventListener("change", handleFiles);
document.getElementById("playPauseBtn").addEventListener("click", playTrack);
document.getElementById("stopBtn").addEventListener("click", stopTrack);
document.getElementById("nextBtn").addEventListener("click", nextTrack);
document.getElementById("prevBtn").addEventListener("click", prevTrack);
document.getElementById("ffBtn").addEventListener("click", fastForward);
document.getElementById("rewBtn").addEventListener("click", rewind);
themeSelector.addEventListener("change", updateTheme);

document.addEventListener("DOMContentLoaded", () => {
   style = window.getComputedStyle(document.body);
   getThemes();
   setTheme(theme);

   insertScrews();
});

window.onresize = function () {
   insertScrews();
};

function triggerFiles() {
   fileInput.click();
}

function getThemes() {
   THEMES.forEach((newTheme) => {
      const option = document.createElement("option");
      option.value = newTheme;
      option.innerHTML = newTheme;
      if (theme == newTheme) option.setAttribute("selected", true);
      themeSelector.append(option);
   });
}

function updateTheme(e) {
   theme = e.target.selectedOptions[0].value;
   setTheme();
}

function setTheme() {
   charDir = `theme/${theme}/imgs/chars/medium/`;
   document.getElementById("pointer1").src = document.getElementById("pointer2").src = `theme/${theme}/imgs/needle.png`;
   document.getElementById("theme").href = `theme/${theme}/styles.css`;
   document.getElementById("logo").src = `theme/${theme}/imgs/logo.png`;
   screw = `<img src="theme/${theme}/imgs/screw.png" style="`;

   setTimeout(() => {
      initSliders();
      initDisplay();
      setInterval(timertime, 1000);
   }, 150);
}

function handleFiles(event) {
   const loadedFiles = event.target.files;
   // console.log(loadedFiles);

   tracks = [];
   tracks = Array.from(loadedFiles).filter((file) => file.type === "audio/mpeg");
   // console.log(tracks);

   // If path like artist/cd 1/song.mp3 its multidisk
   const multiDisk = tracks[0].webkitRelativePath.split("/").length > 2;
   tracks.forEach((track) => {
      getId3Data(track);
   });

   setTimeout(() => {
      compilation = isCompilation();
      processID3Data(tracks);
      tracks.sort(function (a, b) {
         // If multi disk sort by disk name first
         if (multiDisk) {
            if (a.id3data.album < b.id3data.album) return -1;
            if (a.id3data.album > b.id3data.album) return 1;
         }
         // Sort tracks by song id
         if (a.id3data.track > b.id3data.track) return 1;
         if (a.id3data.track < b.id3data.track) return -1;
      });
      if (tracks.length) updatePlaylist();
   }, 500);
}

function processID3Data(tracks) {
   tracks.forEach((track, index) => {
      if (!track.id3data.TRCK?.data && !track.id3data.track) {
         if (!track.id3data.TRCK?.data && track.id3data.track) {
            track.id3data.TRCK = {};
            track.id3data.TRCK.data = zeroPad(track.id3data.track.split("/")[0]);
         } else if (track.id3data.TRCK?.data && !track.id3data.track) {
            track.id3data.track = zeroPad(track.id3data.TRCK.data.split("/")[0]);
         } else {
            track.id3data.TRCK = {};
            track.id3data.TRCK.data = zeroPad(index + 1);
            track.id3data.track = zeroPad(index + 1);
         }
      }

      if (!track.id3data.artist && !track.id3data.TPE1?.data) {
         if (track.id3data.artist && !track.id3data.TPE1?.data) {
            track.id3data.TPE1 = {};
            track.id3data.TPE1.data = track.id3data.artist;
         } else if (!track.id3data.artist && track.id3data.TPE1?.data) {
            track.id3data.artist = track.id3data.TPE1.data;
         } else if (!track.id3data.artist && !track.id3data.TPE1?.data) {
            const tempData = track.name.split(/[^ A-Za-z]/);
            track.id3data.TPE1 = {};
            track.id3data.TPE1.data = track.id3data.artist;
            track.id3data.artist = tempData[0].trim();
         }
      }
      if (!track.id3data.title && !track.id3data.TIT2?.data) {
         if (track.id3data.title && !track.id3data.TIT2?.data) {
            track.id3data.TIT2 = {};
            track.id3data.TIT2.data = track.id3data.title;
         } else if (!track.id3data.title && track.id3data.TIT2?.data) {
            track.id3data.title = track.id3data.TIT2.data;
         } else if (!track.id3data.title && !track.id3data.TIT2?.data) {
            const tempData = track.name.split(/[^ A-Za-z]/);
            track.id3data.title = tempData[1].trim();
         }
      }
      if (!track.id3data.album && !track.id3data.TALB?.data) {
         if (track.id3data.album && !track.id3data.TALB?.data) {
            track.id3data.TALB = {};
            track.id3data.TALB.data = track.id3data.album;
         } else if (!track.id3data.album && track.id3data.TALB?.data) {
            track.id3data.album = track.id3data.TALB.data;
         } else if (!track.id3data.album && !track.id3data.TALB?.data) {
            track.id3data.album = "Unknown";
            track.id3data.TALB = {};
            track.id3data.TALB.data = 1;
         }
      }
      if (!track.id3data.year && !track.id3data.TYER?.data) {
         if (track.id3data.year && !track.id3data.TYER?.data) {
            track.id3data.TYER = {};
            track.id3data.TYER.data = track.id3data.year;
         } else if (!track.id3data.year && track.id3data.TYER?.data) {
            track.id3data.year = track.id3data.TYER.data;
         } else if (!track.id3data.year && !track.id3data.TYER?.data) {
            track.id3data.year = "1999";
            track.id3data.TYER = {};
            track.id3data.TYER.data = "1999";
         }
      }
      if (!track.id3data.genre && !track.id3data.TCON?.data) {
         if (track.id3data.genre && !track.id3data.TCON?.data) {
            track.id3data.TCON = {};
            track.id3data.TCON.data = track.id3data.year;
         } else if (!track.id3data.genre && track.id3data.TCON?.data) {
            track.id3data.year = track.id3data.TCON.data;
         } else if (!track.id3data.genre && !track.id3data.TCON?.data) {
            track.id3data.genre = "Music";
            track.id3data.TCON = {};
            track.id3data.TYER.data = "Music";
         }
      }
   });
}

function isCompilation() {
   const trackData = tracks[0].id3data;
   let artist = trackData.artist;
   let album = trackData?.album;
   let genre = trackData?.genre;
   year = trackData?.year;

   const trackData2 = tracks[1].id3data;
   let artist2 = trackData2.artist;
   let album2 = trackData2?.album;

   return artist !== artist2 && album !== album2;
}

function updatePlaylist() {
   const trackData = tracks[0].id3data;
   let artist = trackData.artist;
   let album = trackData?.album;
   let genre = trackData?.genre;
   year = trackData?.year;

   const trackData2 = tracks[1].id3data;
   let artist2 = trackData2.artist;
   let album2 = trackData2?.album;

   if (compilation) {
      artist = "Various";
      album = "Compilation";
      genre = "Assorted";
      year = "0000";
   }

   let disk = 1;
   let lastTrack = 0;
   let diskLabel = `<div class="disk-label">Disk 1</div>`;
   let diskLabelAdded = false;
   albumLoaded = true;
   playlist.innerHTML = "";
   tracks.forEach((track, index) => {
      const trackElement = document.createElement("div");
      trackElement.dataset.track = index;
      trackElement.textContent = zeroPad(track.id3data.track.split("/")[0]) + " - " + track.id3data.title + (compilation ? " - " + track.id3data.artist : "");
      trackElement.addEventListener("click", (event) => {
         selectTrack(event.target.dataset.track);
         updateCurrentTrack(event.target.dataset.track);
         trackPlaying = true;
      });
      if (index == currentTrackIndex) trackElement.classList.add("selected");
      if (lastTrack > parseInt(track.id3data.track)) {
         if (!diskLabelAdded) {
            playlist.insertAdjacentHTML("afterbegin", diskLabel);
            diskLabelAdded = true;
         }
         disk++;
         playlist.insertAdjacentHTML("beforeend", diskLabel.replace("1", disk));
      }
      lastTrack = parseInt(track.id3data.track);
      playlist.appendChild(trackElement);
   });

   displayTrkSong.innerHTML = renderText(centreText(useCaps(artist)));
   displayArtist.innerHTML = renderText(centreText(useCaps(album)));
   displayAlbum.innerHTML = renderText(centreText(useCaps(genre)));
   displayMiscInfo.innerHTML = renderText(centreText(year));

   showCoverArt(trackData);
   audioElement.volume = volumeSlider.slider("value") / 100;
}

function useCaps(text) {
   return style.getPropertyValue("--useCaps") == "true" ? text.toUpperCase() : text;
}

function centreText(text) {
   if (!text) return;
   const lpad = DISPLAY_WIDTH / 2 - text.length / 2;
   const rpad = DISPLAY_WIDTH - lpad + text.length;
   return `${" ".repeat(lpad)}${text}${" ".repeat(rpad)}`;
}

function updateCurrentTrack(newTrack) {
   showCoverArt(tracks[newTrack].id3data);
   Array.from(playlist.children).forEach((sibling) => {
      if (newTrack == sibling.dataset.track) sibling.classList.add("selected");
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
      displayTrkSong.innerHTML = renderText(`${track.id3data.track} ${useCaps(track.id3data.title)}`);
      displayArtist.innerHTML = renderText(useCaps(track.id3data.artist));
      displayAlbum.innerHTML = renderText(useCaps(track.id3data.album));
      audioElement.volume = volumeSlider.slider("value") / 100;
      displayMiscInfo.innerHTML = renderText(`${year}    00:00/${formatTime(audioElement.duration)}    ${getVolume()}`);
   });
   audioElement.addEventListener("ended", nextTrack);
}

function playTrack() {
   if (!audioElement.paused) {
      audioElement.pause();
   } else if (trackPlaying) {
      audioContext.resume().then(() => {
         audioElement.play();
         startAnalyser();
      });
   } else {
      selectTrack(currentTrackIndex);
      trackPlaying = true;
      audioElement.play();
      audioElement.currentTime = 0;
      startAnalyser();
   }
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

function fastForward() {
   audioElement.currentTime += 10;
   if (audioElement.currentTime >= audioElement.duration) {
      audioElement.currentTime = audioElement.duration; // Prevent going beyond the end
   }
}

function rewind() {
   audioElement.currentTime -= 10;
   if (audioElement.currentTime < 0) {
      audioElement.currentTime = 0; // Prevent going before the start
   }
}

function formatTime(seconds) {
   const minutes = Math.floor(seconds / 60);
   const secs = Math.floor(seconds % 60);
   return `${zeroPad(minutes)}:${zeroPad(secs)}`;
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
      const vuMetersType = style.getPropertyValue("--vuMetersType");
      if (vuMetersType == "analogue") {
         movement(1, leftLevel);
         movement(2, rightLevel);
      }
      if (vuMetersType == "bargraph") {
         leftLevelElement.style.width = 100 - Math.round((leftLevel * (100 / 255)) / 8) * 8 + "%";
         rightLevelElement.style.width = 100 - Math.round((rightLevel * (100 / 255)) / 8) * 8 + "%";
      }
      requestAnimationFrame(updateVU);
   }
   updateVU();
}

function initDisplay() {
   screen.style.backgroundImage = "url(data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=)";
   mask();
   displayTrkSong.innerHTML = renderText("-".repeat(DISPLAY_WIDTH));
   displayArtist.innerHTML = renderText("-".repeat(DISPLAY_WIDTH));
   displayAlbum.innerHTML = renderText("-".repeat(DISPLAY_WIDTH));
   displayMiscInfo.innerHTML = renderText(`---- -----------      ${getVolume()}`);
}

function insertScrews() {
   if (theme != "retro") return;
   const screws = document.querySelectorAll(".screws");
   screws.forEach((screw) => {
      screw.remove();
   });

   document.querySelectorAll('div[class*="-container"]').forEach((div) => {
      const padd = "7px;";
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
   const deflection = parseInt(style.getPropertyValue("--deflection").replace("deg", ""));
   document.querySelector("#pol" + meter).style.opacity = value > 180 ? 1 : 0;
   document.querySelector("#pointer" + meter).style.WebkitTransform = `rotate(${(value / 255) * (Math.abs(deflection) * 2) + deflection}deg)`;
}

function initSliders() {
   const sliderOrientation = style.getPropertyValue("--deflection");

   sliderKnob = `<div class="my-handle ui-slider-handle">
                    <img alt="slider_knob" class="slider-knob" border="0">
                 </div>`;

   const volumeSliderOrientation = style.getPropertyValue("--volumeSliderStyle");
   volumeSlider.parent().addClass(volumeSliderOrientation);
   volumeSlider.append(sliderKnob);
   volumeSlider.slider({
      orientation: volumeSliderOrientation,
      range: "min",
      min: 0,
      max: 100,
      value: 5,
      slide: function (a, b) {
         volume = true;
         const volWidth = DISPLAY_WIDTH - 3;
         if (audioElement) audioElement.volume = b.value / 100;
         a = Math.ceil((b.value * volWidth) / 100);
         a = a > volWidth ? volWidth : a;
         const volStr = `VOL${
            a != Math.round((b.value * volWidth) / 100) ? "^".repeat(a - 1) + "|" + " ".repeat(27 - a) : "^".repeat(a) + " ".repeat(volWidth - a)
         }`;
         displayMiscInfo.innerHTML = renderText(volStr);
         mask();
      },
      stop: function (event, ui) {
         volume = false;
      },
   });

   const balanceSliderOrientation = style.getPropertyValue("--volumeSliderStyle");
   balanceSlider.parent().addClass(balanceSliderOrientation);
   balanceSlider.append(sliderKnob);
   balanceSlider.slider({
      orientation: balanceSliderOrientation,
      range: "min",
      min: -1,
      max: 1,
      value: -0.015,
      step: 0.01,
      slide: function (a, b) {
         balance = true;
         const balWidth = DISPLAY_WIDTH - 3;
         a = Math.ceil(parseInt(b.value * (parseInt(balWidth / 2) + 1)) + (parseInt(balWidth / 2) + 1));
         const balStr = "L" + "-".repeat(a) + "i" + "-".repeat(balWidth - a) + "R";
         displayMiscInfo.innerHTML = renderText(balStr);
         stereoNode.pan.value = b.value;
         mask();
      },
      stop: function (event, ui) {
         balance = false;
      },
   });

   const brightnessSliderOrientation = style.getPropertyValue("--brightnessSliderStyle");
   brightnessSlider.parent().addClass(brightnessSliderOrientation + " small");
   brightnessSlider.append(sliderKnob);
   brightnessSlider.slider({
      orientation: brightnessSliderOrientation,
      range: "min",
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
   if (!msg) msg = "-".repeat(DISPLAY_WIDTH);

   let disp = "";

   for (let charPos = 0; charPos < DISPLAY_WIDTH; charPos++) {
      let text = "";
      let textCase = "";
      let isSpace = false;

      text = msg.charAt(charPos);

      textCase = text === text.toUpperCase() ? "upper" : "lower";

      if ($.isNumeric(text)) {
         textCase = text % 2 === 0 ? "upper" : "lower";
         text = 2 * parseInt(text / 2);
         text = text.toString() + (text + 1).toString();
      } else {
         const charCode = text.charCodeAt(0);
         if (charCode > 31 && charCode < 256) {
            switch (charCode) {
               case 32:
                  text = "space-comma";
                  textCase = "upper";
                  isSpace = true;
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
            }
         } else {
            text = "space-comma";
            textCase = "upper";
            isSpace = true;
         }
      }

      if (text && textCase) {
         const maskClass = isSpace ? " space" : ""; // Determine if we need a space class
         disp += `<div style="background:url(${charDir}${text.toLowerCase()}.jpg)" class="${textCase}">
                       <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" class="mask${maskClass}" />
                    </div>`;
      }
   }

   return disp; // Return the final display string
}

function timertime() {
   if (balance || volume) return true;
   const yr = year ? year : "----";
   if (trackPlaying)
      displayMiscInfo.innerHTML = renderText(`${yr}    ${formatTime(audioElement.currentTime)}/${formatTime(audioElement.duration)}    ${getVolume()}`);
   else {
      const date = new Date();
      const hours = zeroPad(date.getHours());
      const mins = zeroPad(date.getMinutes());
      const secs = zeroPad(date.getSeconds());
      const blink = secs % 2 ? " " : ":";
      const time = `${hours}${blink}${mins}${blink}${secs}`;
      displayMiscInfo.innerHTML = renderText(`${yr}      ${time}     ${getVolume()}`);
   }
   mask();
}

function zeroPad(num, pad = 2) {
   return String(num).padStart(pad, "0");
}

function mask() {
   const masks = document.querySelectorAll(".mask:not(.space)");
   masks.forEach((mask) => {
      mask.style.opacity = brightness;
   });
}

function getVolume() {
   return `VOL ${zeroPad(volumeSlider.slider("value"), 3)}`;
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

function showCoverArt(track) {
   if (track.picture) {
      const coverData = track.picture;
      let coverArt = "";
      for (dataBlock = 0; dataBlock < coverData.data.length; dataBlock++) coverArt += String.fromCharCode(coverData.data[dataBlock]);
      screen.style.backgroundImage = `url(data:${coverData.format};base64,${window.btoa(coverArt)})`;
   } else screen.style.backgroundImage = "url(data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=)";
}
