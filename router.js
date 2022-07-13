const { Router } = require('express');
const path = require("path");
const axios = require('axios');
const fs = require('fs');
const ffmetadata = require("ffmetadata");
const shell = require('shelljs');
const youtubeDownloader = require('./youtubeMP3-config');
const {resolve} = require("path");
axios.defaults.baseURL = 'http://localhost:3000';

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

const readFile = async (filePath) => {
    return new Promise((resolve, reject) => {
        fs.stat(filePath, (err, data) => {
            // Don't reject the error since we want the file to not exist yet
            resolve(data);
        })
    })
}

const writeMetaData = (fileName, editedData) => {
    return new Promise((resolve, reject) => {
        ffmetadata.write(fileName, editedData, function (err, data) {
            if (err) {
                console.error("Error writing metadata: ", err);
                reject(err);
                return;
            }
            console.log("Edited data written to file: " + fileName);
            resolve(data);
        })
    })
};

router.post('/convertYoutubeToMp3', async (req, res) => {
    try {
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
                    title: songName,
                    artist: req.body.artist
                };
                const editedData = await writeMetaData(fullPathName, params);
                return res.send(editedData);
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
        title: req.body.songName,
        artist: req.body.artist,
        path: req.body.path
    };
    const fileName = path.join(req.body.path, `${req.body.songName}.mp3`);
    writeMetaData(fileName, editedData)
        .then(data => {
            console.log("Edited data written to file: " + fileName);
            return res.send(data);
        })
        .catch(err => {
            console.error("Error writing metadata: ", err);
            return res.status(500).send(err);
        });
})

module.exports = router;