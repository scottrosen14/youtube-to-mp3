const app = require('express')();
const path = require('path');
const bodyParser = require('body-parser');
const YoutubeMp3Downloader = require("youtube-mp3-downloader");
const ffmetadata = require("ffmetadata");

// parse application/json
app.use(bodyParser.json())

const ffmpegPath = path.join(__dirname, 'ffmpeg');
const outputPath = '/Users/scott/Desktop/Music/Ripped/';
//Configure YoutubeMp3Downloader with your settings
const YD = new YoutubeMp3Downloader({
    ffmpegPath,        // FFmpeg binary location
    outputPath,    // Output file location (default: the home directory)
    "youtubeVideoQuality": "highestaudio",  // Desired video quality (default: highestaudio)
    "queueParallelism": 2,                  // Download parallelism (default: 1)
    "progressTimeout": 2000,                // Interval in ms for the progress reports (default: 1000)
    "allowWebm": false                      // Enable download from WebM sources (default: false)
});

const getVideoId = (youtubeLink) => {
    const splitArr = youtubeLink.split('=');
    return splitArr[1];
};

// Set path to ffmpeg - optional if in $PATH or $FFMPEG_PATH
ffmetadata.setFfmpegPath(ffmpegPath);

app.post('/convertYoutubeToMp3', (req, res) => {
    //Download video and save as MP3 file
    const songName = req.body.fileName + ' (Ripped)';
    const fileName = songName + '.mp3';
    const fullPathName = path.join(outputPath, fileName);
    YD.download(getVideoId(req.body.videoId), fileName);

    YD.on("progress", function(progress) {
        console.log(JSON.stringify(progress));
    });
    YD.on("finished", function(err, data) {
        const editedData = {
            ...data,
            title: songName,
            artist: req.body.artist
        }
        ffmetadata.write(fullPathName, editedData, function(err) {
            if (err) {
                console.error("Error writing metadata", err);
                res.status(500).send(JSON.stringify(err));
            } else {
                console.log("Edited data written to file" + fileName);
                res.send(editedData)
            }
        });
    });
    YD.on("error", function(error) {
        console.log(error);
        res.status(500).send(JSON.stringify(error));
    });
})

app.put('/editFileMetaData', (req, res) => {
    const editedData = {
        title: req.body.songName,
        artist: req.body.artist,
        path: req.body.path
    };
    const fileName = path.join(req.body.path, `${req.body.songName}.mp3`);
    ffmetadata.write(fileName, editedData, function(err) {
        if (err) {
            console.error("Error writing metadata", err);
            res.send(JSON.stringify(err));
        } else {
            console.log("Edited data written to file");
            res.send(editedData)
        }
    });
})

const PORT = 3000;
app.listen(PORT, () => {
    console.log('listening on PORT ' + PORT);
})
