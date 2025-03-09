<?php

/* PHP file, XXXXXX e.g. scanImageDirectory.json.php */
// echo print_r($_GET, true);
 
// Check that a callback function has been specified:
if (!isset($_GET['callback']) || !isset($_GET['directory'])) exit;
 
// Use PHP5's scandir function to scan all
// of images directory:
$dirContents = scandir($_GET['directory']);
 
// echo print_r($dirContents, true);

// die();

// Define function to confirm each
// filename is a valid image name/extension:
function isImageFile($src) {
    return preg_match('/^.+.(gif|png|jpe?g|bmp|tif)$/i', $src);
}
 
// Loop through directory files and add to
// $arrayContents on each iteration:
$arrayContents = '';
foreach($dirContents as $image) {
    if (isImageFile($image)) {
        $arrayContents[] = 'imgs/' . $image;
    }
}

var_dump($arrayContents);
 
// Prepate JSON(P) output
$output = $_GET['callback'] . json_enode('images':[' . $arrayContents . ']});';
 
// Output the output:
echo $output;