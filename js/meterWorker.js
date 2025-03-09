(function () {
	'use strict';
    
    const $this=this;
	const URL = 'https://rulerandcompass.net/music/stereo-test.mp3';
   // const URL= "https://rulerandcompass.net/music/summertime.mp3";
	const context = new AudioContext();
    const playButton = document.querySelector('#play');
    
    let buffers;
    
    Promise.all([
        fetch(URL)
    ]).then(
        responses => Promise.all(responses.map(r => r.arrayBuffer())),
    ).then(
        buffers => Promise.all(buffers.map(b => context.decodeAudioData(b))),
    ).then(audioBuffers => {
        playButton.disabled = false;
        buffers = audioBuffers;
    });
    
    playButton.onclick = () => play(...buffers);
    
    //check volume
    
    var checkVolume=function(analyser, meter){
        
        let frequencyData = new Uint8Array(1);
        analyser.getByteFrequencyData(frequencyData);
        let volume=frequencyData[0];
        
        //min=20deg   max=160deg
        //.54 is conversion ration + minimum angle
        let rotation=(parseInt(volume*.54))+20; 
        let needles = document.getElementById(meter).getElementsByClassName('needle');
        let needle=needles[0];
        
        needle.style.transform="rotate("+rotation+"deg)";
        
    }
    
    var btnDisabled=function(){
        var btn=document.getElementById('play');
        if(btn.classList.contains('disabled')){
            return true;
        } else {
            btn.classList.add('disabled');
            return false;
        }
    }
    
	function play(a, b) {
        
        console.log(a,b);
        
        if(btnDisabled()==true){ return false;}
       
		const source = context.createBufferSource();
        
        /* Create two analyzers */
        let analyserLeft = context.createAnalyser();
        let analyserRight = context.createAnalyser();

		source.buffer = a;
                
        /* Add Stereo Splitter*/
         var splitter = context.createChannelSplitter(2);
         source.connect(splitter);
        
        /* Connect analyzers */
         splitter.connect(analyserLeft, 1);
         splitter.connect(analyserRight, 0)
        
		source.connect(context.destination);
		source.start();

        setInterval(function(){ 
            checkVolume(analyserLeft,"meterLeft");
            checkVolume(analyserRight, "meterRight") 
        }, 50);
	} 
    
}());