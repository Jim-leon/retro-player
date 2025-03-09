
if (!isset($_GET['callback']) || !isset($_GET['directory'])) exit;

$dirContents = glob($_GET['directory'].'/*.{jpg,gif,png}', GLOB_BRACE);

echo $_GET['callback'] . JSON_ENCODE($dirContents);