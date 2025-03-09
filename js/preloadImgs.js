preloadImagesFromDirectory('imgs');

preloadImagesFromDirectory('imgs/nixie/medium');

function preloadImagesFromDirectory(dir){
	if(!dir) return;
    // Get that JSON data:
    getJSON('/retro-player/scanImageDirectory.json.php?directory=' + encodeURIComponent(dir) + '&callback=?', function(data){
        // console.log(data);
        return data.images ? preload(data.images) : false;
    });
}

function getJSON(URL,success){
    // console.log(URL)
    // Create new function (within global namespace) (With unique name):
    var uniqueID = 'json'+(+(new Date()));
    window[uniqueID] = function(data){
        success && success(data);
    };
    // Append new SCRIPT element to DOM:
    document.getElementsByTagName('body')[0].appendChild((function(){
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = URL.replace('callback=?','callback=' + uniqueID);
        return script;
    })());
}

function preload(srcArray){
    for(var i = 0; i < srcArray.length; i++){
        (new Image()).src = decodeURIComponent(srcArray[i]);
    }
}