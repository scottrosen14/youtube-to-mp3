const { Router } = require('express');
const path = require("path");
const axios = require('axios');
const ffmetadata = require("ffmetadata");
const youtubeDownloader = require('./youtubeMP3-config');
const {HOST, PORT, PROXY} = require("./server");

const router = Router();

const ffmpegPath = '/usr/local/bin/ffmpeg';
const outputPath = path.resolve(__dirname, '../../../Music/Ripped');
const YD = youtubeDownloader(ffmpegPath, outputPath);

const getVideoId = (youtubeLink) => {
    const splitArr = youtubeLink.split('=');
    return splitArr[1];
};

// Set path to ffmpeg - optional if in $PATH or $FFMPEG_PATH
ffmetadata.setFfmpegPath(ffmpegPath);

router.post('/convertYoutubeToMp3', (req, res) => {
    try {
        const songName = req.body.song + ' - (Ripped)';
        const fileName = songName + '.mp3';
        const fullPathName = path.join(outputPath, fileName);
        YD.download(getVideoId(req.body.youtubeLink), fileName);

        YD.on("progress", function (progress) {
            console.log(JSON.stringify(progress));
        });
        YD.on("finished", async function (err, data) {
            try {
                const editedData = await axios.put(`${HOST}:${PORT}/${PROXY}/editFileMetaData`, {
                    songName,
                    artist: req.body.artist,
                    path: outputPath,
                    comment: JSON.stringify(req.body.data)
                })
                const combinedData = {
                    ...data,
                    title: editedData.data.songName,
                    artist: editedData.data.artist
                };
                return res.send(combinedData);
            } catch (error) {
                console.log('Error: ' + error);
                return res.status(500).send(JSON.stringify(error));
            }
        });
    } catch(error) {
        const err = 'Error with Youtube Downloader: ' + error;
        console.log(err);
        res.status(500).send(err);
    }
})

router.put('/editFileMetaData', async (req, res) => {
    const editedData = {
        title: req.body.songName,
        artist: req.body.artist,
        path: req.body.path,
        comment: req.body.comment
    };
    const fileName = path.join(req.body.path, `${req.body.songName}.mp3`);
    await ffmetadata.write(fileName, editedData, function(err) {
        if (err) {
            console.error("Error writing metadata", err);
            return res.status(500).send(JSON.stringify(err));
        } else {
            console.log("Edited data written to file: " + fileName);
            return res.send(editedData);
        }
    });
})

module.exports = router;