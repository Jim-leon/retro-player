window.AudioContext = window.AudioContext ||
                      window.webkitAudioContext;
$(function () {
	$('#container').highcharts({
	    chart: {
	        type: 'gauge',
	        plotBorderWidth: 1,
	        plotBackgroundColor: {
	        	linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
	        	stops: [
	        		[0, '#FFF4C6'],
	        		[0.3, '#FFFFFF'],
	        		[1, '#FFF4C6']
	        	]
	        },
	        plotBackgroundImage: null,
	        height: 200
	    },
	
	    title: {
	        text: 'VU meter'
	    },
	    
	    pane: [{
	        startAngle: -45,
	        endAngle: 45,
	        background: null,
	        center: ['25%', '145%'],
	        size: 300
	    }, {
	    	startAngle: -45,
	    	endAngle: 45,
	    	background: null,
	        center: ['75%', '145%'],
	        size: 300
	    }],	    		        
	
	    yAxis: [{
	        min: -20,
	        max: 6,
	        minorTickPosition: 'outside',
	        tickPosition: 'outside',
	        labels: {
	        	rotation: 'auto',
	        	distance: 20
	        },
	        plotBands: [{
	        	from: 0,
	        	to: 6,
	        	color: '#C02316',
	        	innerRadius: '100%',
	        	outerRadius: '105%'
	        }],
	        pane: 0,
	        title: {
	        	text: 'VU<br/><span style="font-size:8px">Channel A</span>',
	        	y: -40
	        }
	    }, {
	        min: -20,
	        max: 6,
	        minorTickPosition: 'outside',
	        tickPosition: 'outside',
	        labels: {
	        	rotation: 'auto',
	        	distance: 20
	        },
	        plotBands: [{
	        	from: 0,
	        	to: 6,
	        	color: '#C02316',
	        	innerRadius: '100%',
	        	outerRadius: '105%'
	        }],
	        pane: 1,
	        title: {
	        	text: 'VU<br/><span style="font-size:8px">Channel B</span>',
	        	y: -40
	        }
	    }],
	    
	    plotOptions: {
	    	gauge: {
	    		dataLabels: {
	    			enabled: false
	    		},
	    		dial: {
	    			radius: '100%'
	    		}
	    	}
	    },
	    	
	
	    series: [{
	        data: [-20],
	        yAxis: 0
	    }, {
	        data: [-20],
	        yAxis: 1
	    }]
	
	},

	// Let the music play
	function(chart) {
    
    //var audioCtx = new AudioContext();
    //var buffer = audioCtx.createBuffer(11025,100,0.2,2);
        
	    setInterval(function() {
	        var left = chart.series[0].points[0],
	            right = chart.series[1].points[0];
		        var leftVal = 0;//buffer.getChannelData(0)[0];
        var rightVal = 0;//buffer.getChannelData(1)[0];

	        left.update(leftVal, false);
	        right.update(rightVal, false);
	        chart.redraw();
	
	    }, 50);
		});
});
navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia || navigator.msGetUserMedia;
if (navigator.getUserMedia) 
{
  var context = new AudioContext();
  navigator.getUserMedia({audio: true}, function(stream) {                          
    var microphone = context.createMediaStreamSource(stream);
    var buffer = context.createAudioBuffer(11025,100,0.2);
    microphone.connect(context.destination);
  },
  function(err) {
      console.log("The following error occured: " + err);
  });
}