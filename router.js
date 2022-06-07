const { Router } = require('express');
const path = require("path");
const ffmetadata = require("ffmetadata");
const youtubeDownloader = require('./youtubeMP3-config');

const router = Router();

const ffmpegPath = '/usr/local/bin/ffmpeg';
const outputPath = '/Users/scottrosen/Desktop/Music/Ripped/';
const YD = youtubeDownloader(ffmpegPath, outputPath);

const getVideoId = (youtubeLink) => {
    const splitArr = youtubeLink.split('=');
    return splitArr[1];
};

// Set path to ffmpeg - optional if in $PATH or $FFMPEG_PATH
ffmetadata.setFfmpegPath(ffmpegPath);

router.post('/convertYoutubeToMp3', (req, res) => {
    const songName = req.body.song + ' - (Ripped)';
    const fileName = songName + '.mp3';
    const fullPathName = path.join(outputPath, fileName);
    YD.download(getVideoId(req.body.youtubeLink), fileName);

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

router.put('/editFileMetaData', (req, res) => {
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

module.exports = router;