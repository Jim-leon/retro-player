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
let analyser, style, audioSource, year, charDir, sliderKnob;
let trackPlaying = false;
let balance = false;
let volume = false;
let compilation = false;
let brightness = 0.25;

function bindUI() {
   document.getElementById("select-song")?.addEventListener("click", triggerFiles);
   fileInput?.addEventListener("change", handleFiles);
   document.getElementById("playPauseBtn")?.addEventListener("click", playTrack);
   document.getElementById("stopBtn")?.addEventListener("click", stopTrack);
   document.getElementById("nextBtn")?.addEventListener("click", nextTrack);
   document.getElementById("prevBtn")?.addEventListener("click", prevTrack);
   document.getElementById("ffBtn")?.addEventListener("click", fastForward);
   document.getElementById("rewBtn")?.addEventListener("click", rewind);
}

if (themeSelector) {
   themeSelector.addEventListener("change", updateTheme);
}

document.addEventListener("DOMContentLoaded", () => {
   style = getComputedStyle(document.body);
   getThemes();
   setTheme(theme);
   insertScrews();
   bindUI();
});

window.addEventListener("resize", insertScrews);

const triggerFiles = () => fileInput?.click();

function getThemes() {
   THEMES.forEach((themeName) => {
      const option = document.createElement("option");
      option.value = option.textContent = themeName;
      if (theme === themeName) option.selected = true;
      themeSelector.appendChild(option);
   });
}

function updateTheme(e) {
   theme = e.target.selectedOptions[0]?.value || theme;
   setTheme();
}

function setTheme() {
   charDir = `theme/${theme}/imgs/chars/medium/`;
   document.getElementById("theme").href = `theme/${theme}/styles.css`;

   setTimeout(() => {
      initSliders();
      initDisplay();
      insertScrews();
      setInterval(timertime, 1000);
   }, 150);
}

async function handleFiles(event) {
   tracks = Array.from(event.target.files).filter((file) => file.type === "audio/mpeg");
   if (!tracks.length) return;

   const multiDisk = tracks[0]?.webkitRelativePath?.split("/")?.length > 2;

   await Promise.all(tracks.map((track) => getId3Data(track)));

   compilation = isCompilation();
   processID3Data(tracks);

   tracks.sort((a, b) => {
      const albumA = a.id3data.album ?? "";
      const albumB = b.id3data.album ?? "";
      const trackA = parseInt(a.id3data.track, 10);
      const trackB = parseInt(b.id3data.track, 10);

      if (multiDisk && albumA !== albumB) {
         return albumA.localeCompare(albumB);
      }

      return trackA - trackB;
   });

   updatePlaylist();
}

function processID3Data(tracks) {
   tracks.forEach((track, index) => {
      const data = track.id3data;
      const fallback = (val, fallbackVal) => val || fallbackVal;

      const syncTag = (field, tag, generate) => {
         const value = data[field];
         const tagValue = data[tag]?.data;

         if (value && !tagValue) {
            data[tag] = { data: value };
         } else if (!value && tagValue) {
            data[field] = tagValue;
         } else if (!value && !tagValue) {
            const derived = generate();
            data[field] = derived;
            data[tag] = { data: derived };
         }
      };

      syncTag("track", "TRCK", () => zeroPad(index + 1));
      syncTag("artist", "TPE1", () => track.name.split(/[^ A-Za-z]/)[0]?.trim() || "Artist");
      syncTag("title", "TIT2", () => track.name.split(/[^ A-Za-z]/)[1]?.trim() || "Track");
      syncTag("album", "TALB", () => "Unknown");
      syncTag("year", "TYER", () => "1999");
      syncTag("genre", "TCON", () => "Music");
   });
}

function isCompilation() {
   if (tracks.length < 2) return false;

   const { artist: artist1, album: album1, genre, year: yr } = tracks[0]?.id3data || {};
   const { artist: artist2, album: album2 } = tracks[1]?.id3data || {};

   year = yr || "----"; // preserve global `year`

   return artist1 !== artist2 && album1 !== album2;
}

function updatePlaylist() {
   if (!tracks.length) return;

   let { artist, album, genre, year } = tracks[0]?.id3data || {};
   const isMultiDisk = compilation;

   if (isMultiDisk) {
      artist = "Various";
      album = "Compilation";
      genre = "Assorted";
      year = "0000";
   }

   albumLoaded = true;
   playlist.innerHTML = "";

   let disk = 1;
   let lastTrackNumber = 0;
   let diskLabelAdded = false;

   const makeTrackElement = (track, index) => {
      const trackNum = zeroPad(track.id3data.track.split("/")[0]);
      const title = track.id3data.title;
      const trackArtist = track.id3data.artist;
      const text = `${trackNum} - ${title}${compilation ? " - " + trackArtist : ""}`;

      const el = document.createElement("div");
      el.dataset.track = index;
      el.textContent = text;
      if (index === currentTrackIndex) el.classList.add("selected");

      el.addEventListener("click", () => {
         selectTrack(index);
         updateCurrentTrack(index);
         trackPlaying = true;
      });

      return el;
   };

   tracks.forEach((track, index) => {
      const trackNumber = parseInt(track.id3data.track);
      if (trackNumber < lastTrackNumber) {
         if (!diskLabelAdded) {
            playlist.insertAdjacentHTML("afterbegin", `<div class="disk-label">Disk ${disk}</div>`);
            diskLabelAdded = true;
         }
         disk++;
         playlist.insertAdjacentHTML("beforeend", `<div class="disk-label">Disk ${disk}</div>`);
      }
      lastTrackNumber = trackNumber;
      playlist.appendChild(makeTrackElement(track, index));
   });

   const renderCentered = (text) => renderText(centreText(useCaps(text)));
   displayTrkSong.innerHTML = renderCentered(artist);
   displayArtist.innerHTML = renderCentered(album);
   displayAlbum.innerHTML = renderCentered(genre);
   displayMiscInfo.innerHTML = renderText(centreText(year || "----"));

   showCoverArt(tracks[0].id3data);
   audioElement.volume = volumeSlider.slider("value") / 100;
}

const useCaps = (text) => (style.getPropertyValue("--useCaps") === "true" ? text.toUpperCase() : text);

const centreText = (text) => {
   if (!text) return "";
   const pad = DISPLAY_WIDTH - text.length;
   const lpad = Math.floor(pad / 2);
   const rpad = pad - lpad;
   return `${" ".repeat(lpad)}${text}${" ".repeat(rpad)}`;
};

const updateCurrentTrack = (newTrack) => {
   showCoverArt(tracks[newTrack]?.id3data);
   [...playlist.children].forEach((sibling) => sibling.classList.toggle("selected", +sibling.dataset.track === newTrack));
};

const selectTrack = (index) => {
   currentTrackIndex = index;
   loadTrack();
};

function loadTrack() {
   if (!tracks?.length) return;

   const track = tracks[currentTrackIndex];
   const id3 = track?.id3data;

   audioElement.src = URL.createObjectURL(track);
   audioElement.load();

   const updateDisplay = () => {
      if (!id3) return;

      displayTrkSong.innerHTML = renderText(`${id3.track} ${useCaps(id3.title)}`);
      displayArtist.innerHTML = renderText(useCaps(id3.artist));
      displayAlbum.innerHTML = renderText(useCaps(id3.album));

      audioElement.volume = volumeSlider.slider("value") / 100;

      const metaInfo = `${year || "----"}    00:00/${formatTime(audioElement.duration)}    ${getVolume()}`;
      displayMiscInfo.innerHTML = renderText(metaInfo);
   };

   audioElement.addEventListener("loadedmetadata", updateDisplay, { once: true });
   audioElement.addEventListener("ended", nextTrack, { once: true });
}

function playTrack() {
   if (!audioElement.paused) return audioElement.pause();

   if (trackPlaying) {
      audioContext.resume().then(() => {
         audioElement.play();
         startAnalyser();
      });
   } else {
      selectTrack(currentTrackIndex);
      trackPlaying = true;
      audioElement.currentTime = 0;
      audioElement.play();
      startAnalyser();
   }
}

const stopTrack = () => {
   audioElement.pause();
   audioElement.currentTime = 0;
   trackPlaying = false;
};

const changeTrack = (direction) => {
   const total = tracks.length;
   currentTrackIndex = (currentTrackIndex + direction + total) % total;
   updateCurrentTrack(currentTrackIndex);
   loadTrack();
   audioElement.play();
};

const nextTrack = () => changeTrack(1);
const prevTrack = () => changeTrack(-1);

const fastForward = () => {
   audioElement.currentTime = Math.min(audioElement.currentTime + 10, audioElement.duration);
};

const rewind = () => {
   audioElement.currentTime = Math.max(audioElement.currentTime - 10, 0);
};

const formatTime = (seconds) => {
   const mins = Math.floor(seconds / 60);
   const secs = Math.floor(seconds % 60);
   return `${zeroPad(mins)}:${zeroPad(secs)}`;
};

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
   displayMiscInfo.innerHTML = renderText(`---- -----------       ${getVolume()}`);
}

function insertScrews() {
   document.querySelectorAll(".screws").forEach((el) => el.remove());
   if (theme !== "Retro") return;
   const positions = ["left:7px;top:7px;", "right:7px;top:7px;", "right:7px;bottom:7px;", "left:7px;bottom:7px;"];
   const createScrew = () => `<img alt="screw" style="${randomRotation()}" />`;
   const randomRotation = () => `transform:rotate(${Math.floor(Math.random() * 180) + 1}deg);`;
   document.querySelectorAll('div[class*="-container"]').forEach((div) => {
      const screwImgs = positions.map((pos) => `${createScrew().replace('style="', `style="${pos}${randomRotation()}`)}`).join("");
      div.insertAdjacentHTML("beforeend", `<div class="screws">${screwImgs}</div>`);
   });
}

const outputPerformanceTime = (contextTime) => {
   const { contextTime: baseContext, performanceTime } = context.getOutputTimestamp();
   const elapsedMs = (contextTime - baseContext) * 1000;
   return performanceTime + elapsedMs;
};

const movement = (meter, value) => {
   const deflectionDeg = parseInt(style.getPropertyValue("--deflection"), 10) || 0;
   const opacity = value > 180 ? 1 : 0;
   const rotation = (value / 255) * (Math.abs(deflectionDeg) * 2) + deflectionDeg;
   const polEl = document.querySelector(`#pol${meter}`);
   const pointerEl = document.querySelector(`#pointer${meter}`);
   if (polEl) polEl.style.opacity = opacity;
   if (pointerEl) pointerEl.style.WebkitTransform = `rotate(${rotation.toFixed(2)}deg)`;
};

function initSliders() {
   const sliderKnobHTML = `
      <div class="my-handle ui-slider-handle">
         <img alt="slider_knob" class="slider-knob" border="0" />
      </div>`;

   const setupSlider = (slider, orientationVar, options, extraClass = "") => {
      const orientation = style.getPropertyValue(orientationVar);
      slider.parent().removeClass("horizontal vertical");
      if (extraClass) slider.parent().addClass(`${orientation} ${extraClass}`);
      else slider.parent().addClass(orientation);
      slider.append(sliderKnobHTML);
      slider.slider({ orientation, ...options });
   };

   setupSlider(volumeSlider, "--volumeSliderStyle", {
      range: "min",
      min: 0,
      max: 100,
      value: 5,
      slide: (_, ui) => {
         volume = true;
         const volWidth = DISPLAY_WIDTH - 3;
         if (audioElement) audioElement.volume = ui.value / 100;
         const bars = Math.ceil((ui.value * volWidth) / 100);
         const volStr = `VOL${
            bars !== Math.round((ui.value * volWidth) / 100)
               ? "^".repeat(bars - 1) + "|" + " ".repeat(27 - bars)
               : "^".repeat(bars) + " ".repeat(volWidth - bars)
         }`;
         displayMiscInfo.innerHTML = renderText(volStr);
         mask();
      },
      stop: () => {
         volume = false;
      },
   });

   setupSlider(balanceSlider, "--balanceSliderStyle", {
      range: "min",
      min: -1,
      max: 1,
      value: 0,
      step: 0.01,
      slide: (_, ui) => {
         balance = true;
         const balWidth = DISPLAY_WIDTH - 3;
         const offset = Math.ceil(ui.value * (balWidth / 2 + 1) + (balWidth / 2 + 1));
         const balStr = `L${"-".repeat(offset)}i${"-".repeat(balWidth - offset)}R`;
         displayMiscInfo.innerHTML = renderText(balStr);
         stereoNode.pan.value = ui.value;
         mask();
      },
      stop: () => {
         balance = false;
      },
   });

   setupSlider(
      brightnessSlider,
      "--brightnessSliderStyle",
      {
         range: "min",
         min: 50,
         max: 100,
         value: 75,
         slide: (_, ui) => {
            brightness = 1 - ui.value / 100;
            mask();
         },
      },
      "small"
   );
}

function renderText(msg = "-".repeat(DISPLAY_WIDTH)) {
   msg = msg.padEnd(DISPLAY_WIDTH, " ");
   console.log(msg);

   const SYMBOL_MAP = {
      32: ["space-comma", "upper", true],
      44: ["space-comma", "lower", false],
      63: ["question-exclamation", "upper", false],
      33: ["question-exclamation", "lower", false],
      42: ["hash-star", "lower", false],
      35: ["hash-star", "upper", false],
      38: ["amp-period", "upper", false],
      46: ["amp-period", "lower", false],
      64: ["at-dollar", "upper", false],
      36: ["at-dollar", "lower", false],
      163: ["yen-pound", "lower", false],
      34: ["quote-apost", "upper", false],
      39: ["quote-apost", "lower", false],
      58: ["colon-semicolon", "upper", false],
      59: ["colon-semicolon", "lower", false],
      45: ["dash-slash", "upper", false],
      47: ["dash-slash", "lower", false],
      124: ["bar-dblbar", "upper", false],
      94: ["bar-dblbar", "lower", false],
      40: ["bracket", "upper", false],
      60: ["bracket", "upper", false],
      91: ["bracket", "upper", false],
      123: ["bracket", "upper", false],
      41: ["bracket", "lower", false],
      62: ["bracket", "lower", false],
      93: ["bracket", "lower", false],
      125: ["bracket", "lower", false],
   };

   let disp = "";

   for (let i = 0; i < DISPLAY_WIDTH; i++) {
      let char = msg.charAt(i);
      let text = char;
      let textCase = char === char.toUpperCase() ? "upper" : "lower";
      let isSpace = false;

      if ($.isNumeric(char)) {
         const base = 2 * Math.floor(parseInt(char, 10) / 2);
         text = `${base}${base + 1}`;
         textCase = parseInt(char, 10) % 2 === 0 ? "upper" : "lower";
      } else {
         const code = char.charCodeAt(0);
         if (SYMBOL_MAP[code]) {
            [text, textCase, isSpace] = SYMBOL_MAP[code];
         } else if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
            text = char;
            isSpace = false;
         } else {
            text = "space-comma";
            textCase = "upper";
            isSpace = true;
         }
      }

      const maskClass = isSpace ? " space" : "";
      disp += `
         <div style="background:url(${charDir}${text.toLowerCase()}.webp)" class="${textCase}">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAgCAYAAAASYli2AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAKElEQVRIx+3MMREAAAgEoNf+nbWE5wQBqCSTQ32ZCYVCoVAoFAq/wwVgqQE/K1AduAAAAABJRU5ErkJggg==" 
            width="20" height="32" class="mask${maskClass}" alt="mask" />
         </div>
      `;
   }

   return disp;
}

function timertime() {
   if (balance || volume) return true;

   const yr = year || "----";
   // console.log(audioElement.currentTime);

   const infoText = trackPlaying
      ? `${yr}    ${formatTime(audioElement.currentTime)}/${formatTime(audioElement.duration)}    ${getVolume()}`
      : (() => {
           const date = new Date();
           const blink = date.getSeconds() % 2 ? " " : ":";
           const time = [zeroPad(date.getHours()), zeroPad(date.getMinutes()), zeroPad(date.getSeconds())].join(blink);
           return `${yr}      ${time}     ${getVolume()}`;
        })();

   displayMiscInfo.innerHTML = renderText(infoText);
   mask();
}

const zeroPad = (num, pad = 2) => String(num).padStart(pad, "0");

const mask = () => {
   document.querySelectorAll(".mask:not(.space)").forEach((el) => {
      el.style.opacity = brightness;
   });
};

const getVolume = () => `VOL ${zeroPad(volumeSlider.slider("value"), 3)}`;

function getId3Data(track) {
   return new Promise((resolve) => {
      jsmediatags.read(track, {
         onSuccess: (tag) => {
            track.id3data = tag.tags;
            resolve();
         },
         onError: () => {
            track.id3data = {};
            resolve();
         },
      });
   });
}

const showCoverArt = (track) => {
   if (track.picture) {
      const { data, format } = track.picture;
      const binary = String.fromCharCode(...data);
      screen.style.backgroundImage = `url(data:${format};base64,${btoa(binary)})`;
   } else {
      screen.style.backgroundImage = "url(data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=)";
   }
};
