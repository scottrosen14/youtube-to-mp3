const { Router } = require('express');
const path = require("path");
const axios = require('axios');
const ffmetadata = require("ffmetadata");
const youtubeDownloader = require('./youtubeMP3-config');
const { readFile, writeMetaData } = require('./tools/processFiles');

axios.defaults.baseURL = 'http://localhost:3000';
const router = Router();

const ffmpegPath = '/usr/local/bin/ffmpeg';
const basePath = path.resolve(__dirname, `../../../Music/Ripped`)

const getVideoId = (youtubeLink) => {
    const splitArr = youtubeLink.split('=');
    return splitArr[1];
};

// Set path to ffmpeg - optional if in $PATH or $FFMPEG_PATH
ffmetadata.setFfmpegPath(ffmpegPath);

router.post('/convertYoutubeToMp3', async (req, res) => {
    try {
        const outputPath = path.join(basePath, req.body.genre);
        const YD = youtubeDownloader(ffmpegPath, outputPath);
        const videoId = getVideoId(req.body.youtubeLink);
        const songName = req.body.song + ' - (Ripped) - ' + videoId;
        const fileName = songName + '.mp3';
        const fullPathName = path.join(outputPath, fileName);
        const metaData = await readFile(fullPathName)
        if (metaData) {
            const errMsg = 'Duplicate file';
            console.error(errMsg);
            throw new Error(errMsg);
        }

        YD.download(videoId, fileName);
        YD.on("progress", function (progress) {
            console.log(JSON.stringify(progress));
        });
        YD.on("finished", async function (err, data) {
            try {
                const params = {
                    ...data,
                    title: songName,
                    artist: req.body.artist
                };
                const editedData = await writeMetaData(fullPathName, params);
                const combinedData = {
                    ...data,
                    ...editedData
                }
                return res.send(combinedData);
            } catch (error) {
                return res.status(500).send(JSON.stringify(error));
            }
        });
    } catch(error) {
        const err = 'Error with Youtube Downloader: ' + error;
        console.error(err);
        res.status(500).send(err);
    }
});

router.put('/editFileMetaData', (req, res) => {
    const editedData = {
        title: req.body.song,
        artist: req.body.artist,
    };
    const outputPath = path.join(basePath, req.body.genre);
    const fileName = path.join(outputPath, `${req.body.song}.mp3`);
    writeMetaData(fileName, editedData)
        .then(data => {
            const successMsg = 'Edited data written to file: ' + fileName
            return res.send(successMsg);
        })
        .catch(err => {
            return res.status(500).send(err);
        });
})

module.exports = router;