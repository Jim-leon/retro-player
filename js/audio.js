var vaudio,
   currentSong = 0,
   files = null;

const SKIN = "70s";
const VU_METERS = "analogue";

let style;
let deflection;
let audioSource;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let audioElement = new Audio();
let currentTrackIndex = 0;
let tracks = [];
let analyser;
const leftLevelElement = document.getElementById("leftLevel");
const rightLevelElement = document.getElementById("rightLevel");
// const currentTimeElement = document.getElementById("currentTime");
const trackLengthElement = document.getElementById("trackLength");
const fileInput = document.getElementById("fileInput");

sliders();

document.getElementById("select-song").addEventListener("click", triggerFiles);
document.getElementById("fileInput").addEventListener("change", handleFiles);
document.getElementById("playBtn").addEventListener("click", playTrack);
document.getElementById("pauseBtn").addEventListener("click", pauseTrack);
document.getElementById("stopBtn").addEventListener("click", stopTrack);
document.getElementById("nextBtn").addEventListener("click", nextTrack);
document.getElementById("prevBtn").addEventListener("click", prevTrack);

function triggerFiles() {
   fileInput.click();
}

function handleFiles(event) {
   const files = event.target.files;
   tracks = Array.from(files).filter((file) => file.type === "audio/mpeg");
   // console.log(tracks);

   updatePlaylist();
}

function updatePlaylist() {
   const playlistElement = document.getElementById("playlist");
   playlistElement.innerHTML = "";
   tracks.forEach((track, index) => {
      getId3Data(index, tracks);
      const trackElement = document.createElement("div");
      trackElement.textContent = track.name;
      trackElement.addEventListener("click", () => selectTrack(index));
      playlistElement.appendChild(trackElement);
   });
   selectTrack(0);
}

function selectTrack(index) {
   currentTrackIndex = index;
   loadTrack();
}

function loadTrack() {
   if (tracks.length === 0) return;
   const track = tracks[currentTrackIndex];
   console.log(track);

   audioElement.src = URL.createObjectURL(track);
   audioElement.load();
   audioElement.addEventListener("loadedmetadata", () => {
      // trackLengthElement.textContent = formatTime(audioElement.duration);
   });
   // audioElement.addEventListener("timeupdate", updateCurrentTime);
   audioElement.addEventListener("ended", nextTrack);
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
   loadTrack();
}

function prevTrack() {
   currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
   loadTrack();
}

// function updateCurrentTime() {
//    currentTimeElement.textContent = formatTime(audioElement.currentTime);
// }

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
var sourceNode, splitter, analyser1, analyser2, padding, year, javascriptNode;
// var analyser = context.createAnalyser();

var Audio;

var balance = false;

var volume = false;

const skinLink = document.getElementById("skin");
skinLink.href = "skins/" + SKIN + "/styles.css";

const pointer1 = document.getElementById("pointer1");
const pointer2 = document.getElementById("pointer2");

pointer1.src = pointer2.src = "skins/" + SKIN + "/imgs/needle.png";

$(document).ready(function () {
   style = window.getComputedStyle(document.body);
   deflection = parseInt(style.getPropertyValue("--deflection").replace("deg", ""));

   vaudio = document.getElementById("audio");

   setInterval(timertime, 1e2);

   $(".screen-wrapper").css("background-image", "url(data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=)");

   sliders();

   brightness = 0.25;

   $(".mask").css("opacity", brightness);

   initDisplay();

   insertScrews();
});

$(window).resize(function () {
   insertScrews();
});

function initDisplay() {
   (padding = 15), (columns = 30), (songwidth = columns), (albumwidth = columns), (artistwidth = columns);
   $(".display-container .trk-song").html(renderText("-- " + "-".repeat(songwidth), 0, columns)),
      $(".display-container .artist").html(renderText("-".repeat(artistwidth), 0, artistwidth)),
      $(".display-container .album").html(renderText("-".repeat(albumwidth), 0, albumwidth)),
      $(".display-container .year-times-vol").html(
         renderText("---- -----------      " + "Vol:" + ("00" + $(".volume-slider").slider("value").toString()).slice(-3), 0, 30)
      );
}

function insertScrews() {
   if (SKIN != "retro") return;
   $("div.screws").remove(),
      $('div[class*="-container"]').each(function () {
         var padd = 7;
         $(this).append(
            '<div class="screws"><img src="skins/' +
               SKIN +
               '/imgs/screw.png" style="left:' +
               padd +
               "px; top:" +
               padd +
               "px;" +
               angle() +
               ');" /><img src="skins/' +
               SKIN +
               '/imgs/screw.png" style="right:' +
               padd +
               "px; top:" +
               padd +
               "px;" +
               angle() +
               ');" /><img src="skins/' +
               SKIN +
               '/imgs/screw.png" style="right:' +
               padd +
               "px; bottom:" +
               padd +
               "px;" +
               angle() +
               ');" /><img src="skins/' +
               SKIN +
               '/imgs/screw.png" style="left:' +
               padd +
               "px; bottom:" +
               padd +
               "px;" +
               angle() +
               '); /"></div>'
         );
      });
}

function angle() {
   return "transform: rotate(" + (Math.round(180 * Math.random()) + 1) + "deg";
}

function outputPerformanceTime(contextTime) {
   var timestamp = context.getOutputTimestamp();
   var elapsedTime = contextTime - timestamp.contextTime;
   return timestamp.performanceTime + elapsedTime * 1000;
}

function movement(meter, value) {
   if (!deflection) {
      style = window.getComputedStyle(document.body);
      deflection = parseInt(style.getPropertyValue("--deflection").replace("deg", ""));
   }

   $("#pointer" + meter).css({
      WebkitTransform: "rotate(" + ((value / 255) * (Math.abs(deflection) * 2) + deflection) + "deg)",
   });
}

function getAverageVolume(array) {
   var values = 0,
      average;
   for (var i = 0; i < array.length; i++) {
      values += array[i];
   }
   return values / length;
}

function sliders() {
   var a = '<div class="my-handle ui-slider-handle"><img src="skins/' + SKIN + '/imgs/slider-knob.png" alt="slider_knob" border="0"></div>';
   $(".volume-slider").append(a);
   $(".volume-slider").slider({
      range: "min",
      min: 0,
      max: 100,
      value: 5,
      slide: function (a, b) {
         volume = true;
         // console.log(b);

         if (audioElement) {
            audioElement.volume = b.value / 100;
         }
         a = Math.ceil(b.value * 0.26);
         a = a > 26 ? 26 : a;
         var volStr = "Vol:" + (a != Math.round(b.value * 0.26) ? "^".repeat(a - 1) + "|" + " ".repeat(26 - a) : "^".repeat(a) + " ".repeat(26 - a));
         $(".display-container .year-times-vol").html(renderText(volStr, 0, 30));
      },
      stop: function (event, ui) {
         volume = false;
      },
   });

   $(".balance-slider").append(a);

   $(".balance-slider").slider({
      range: "min",
      min: 1,
      max: 100,
      value: 50,
      slide: function (a, b) {
         balance = true;
         a = Math.ceil(parseInt(b.value * 0.28));
         a = a > 27 ? 27 : a;
         var balStr = "L" + "-".repeat(a) + "I" + "-".repeat(27 - a) + "R";
         $(".display-container .year-times-vol").html(renderText(balStr, 0, 30));
      },
      stop: function (event, ui) {
         balance = false;
      },
   });

   $(".brightness-slider").append(a);

   $(".brightness-slider").slider({
      range: "max",
      min: 50,
      max: 100,
      value: 75,
      slide: function (a, b) {
         $(".mask").css("opacity", 1 - b.value / 100);
         // $(".mask.space").css("opacity", 1 - b.value / 200);
         brightness = 1 - b.value / 100;
      },
   });
}

function renderText(a, b, c) {
   b < 0 && (b = 0);
   var d = "";
   (a = a.replace(/\, /g, ",")), (a = a.slice(b));
   for (var e = 0; e < c; e++) {
      if (e < a.length)
         if (((text = a.charAt(e)), (textCase = text === text.toUpperCase() ? "upper" : "lower"), $.isNumeric(text)))
            (textCase = text % 2 == 0 ? "upper" : "lower"), (text = 2 * parseInt(text / 2)), (text = text.toString() + (text + 1).toString());
         else {
            var f = !1;
            // console.log(text.charCodeAt(0))
            switch (text.charCodeAt(0)) {
               case 0:
               case 32:
                  (text = "space-comma"), (textCase = "upper"), (f = !0);
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
      else (text = "space-comma"), (textCase = "upper"), (f = !0);
      if (text && textCase) {
         var g = f ? "space" : "";
         d +=
            '<div style="background:url(skins/' +
            SKIN +
            "/imgs/chars/medium/" +
            text.toLowerCase() +
            '.jpg)" class="' +
            textCase +
            '"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" class="mask ' +
            g +
            '" /></div>';
      }
   }
   return d;
}

function timertime() {
   if (balance || volume) return true;
   if (files == null) {
      var a = new Date(),
         b = ("0" + a.getHours()).slice(-2) + ":" + ("0" + a.getMinutes()).slice(-2) + ":" + ("0" + a.getSeconds()).slice(-2);
      $(".display-container .year-times-vol").html(
         renderText("----     " + b + "     Vol: " + ("00" + $(".volume-slider").slider("value").toString()).slice(-3), 0, 30)
      );
   } else {
      $(".display-container .year-times-vol").html(
         renderText(
            year +
               "    " +
               secondsToMS(vaudio.currentTime) +
               "/" +
               secondsToMS(vaudio.duration) +
               "   Vol: " +
               ("00" + $(".volume-slider").slider("value").toString()).slice(-3),
            0,
            30
         )
      );
   }
   $(".mask").css("opacity", brightness);
}

function cleanTxt(a) {
   for (var b = "", c = 0; c < 30; c++) {
      var d = a.charAt(c);
      d.charCodeAt(0) > 0 && (b += d);
   }
   return b.trim();
}

function getId3Data(index, files) {
   jsmediatags.read(files[index], {
      onSuccess: function (tag) {
         files[index].id3data = tag.tags;
      },
      onError: function (error) {
         files[index].id3data = false;
      },
   });
}

function showTags(a) {
   function u() {
      t ? ++s > p && (t = !1) : --s < 0 && (t = !0), $(".display-container .song").html(renderText(l, s, h)), $(".mask").css("opacity", brightness);
   }
   function x() {
      w ? ++v >= q && (w = !1) : --v < 0 && (w = !0), $(".display-container .artist").html(renderText(m, v, j)), $(".mask").css("opacity", brightness);
   }
   function A() {
      z ? ++y >= r && (z = !1) : --y < 0 && (z = !0), $(".display-container .album").html(renderText(n, y, i)), $(".mask").css("opacity", brightness);
   }
   var f = ID3.getAllTags(a);
   // console.log(f)
   var g = 30,
      h = g - 3,
      i = g,
      j = g,
      l = f.title,
      m = f.artist ? f.artist : "",
      n = f.album,
      o = f.year ? f.year.split("-")[0] : "0000",
      p = l.length > h ? l.length - h : 0,
      q = m.length > j ? m.length - j : 0,
      r = n.length > i ? n.length - i : 0;
   track = f.track.replace(/\D/g, "#").split("#")[0];
   year = o;
   if (
      ($(".display-container .trk-song").html(renderText(("0" + track).slice(-2) + " " + l, 0, g)),
      $(".display-container .year-times-vol").html(
         renderText(o + " 00:00/" + secondsToMS(vaudio.duration) + "   " + "Vol: " + ("00" + $(".volume-slider").slider("value").toString()).slice(-3), 0, 30)
      ),
      $(".display-container .artist").html(renderText(m, 0, g)),
      $(".display-container .album").html(renderText(n, 0, i)),
      $(".mask").css("opacity", brightness),
      p)
   ) {
      l += " ";
      var s = -1,
         t = !0;
      setInterval(u, 600);
   }
   if (q) {
      var v = -1,
         w = !0;
      intervalId = setInterval(x, 600);
   }
   if (r) {
      var y = -1,
         z = !0;
      setInterval(A, 600);
   }
   var B = f.picture;
   if (B) {
      for (var C = "", D = 0; D < B.data.length; D++) C += String.fromCharCode(B.data[D]);
      var E = "data:" + B.format + ";base64," + window.btoa(C);
      $(".screen-wrapper").css("background-image", "url(" + E + ")");
   } else $(".screen-wrapper").css("background-image", "url(data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=)");
}

function secondsToMS(s) {
   var m = Math.floor(s / 60);
   s -= m * 60;
   return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + parseInt(s) : parseInt(s));
}
