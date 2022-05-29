const app = require('express')();
const path = require('path');
const bodyParser = require('body-parser');
const YoutubeMp3Downloader = require("youtube-mp3-downloader");
const ffmetadata = require("ffmetadata");

const router = require('router');

app.use(bodyParser.json())
app.use('/api', router);

const PORT = 3000;
app.listen(PORT, () => {
    console.log('listening on PORT ' + PORT);
})
