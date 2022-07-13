const fs = require('fs');
const ffmetadata = require("ffmetadata");

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

module.exports = {
    readFile,
    writeMetaData
}