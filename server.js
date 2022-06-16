const app = require('express')();
const bodyParser = require('body-parser');

const router = require('./router');

const PROXY = '/api';
const PORT = 3000;
const HOST = 'http://localhost';

app.use(bodyParser.json())
app.use(PROXY, router);

process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', reason.stack || reason)
})

app.listen(PORT, () => {
    console.log('listening on PORT ' + PORT);
})

module.exports = {
    PROXY,
    PORT,
    HOST
}