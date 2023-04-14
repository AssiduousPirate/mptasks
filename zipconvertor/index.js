const PORT = 3111
const express = require('express')
const fs = require('fs')
const bodyParser = require('body-parser')
const archiver = require('archiver')
const cors = require('cors')
const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
	extended: false
}))
app.use(cors({
	origin: "*"
}))
app.get('/', function (req, res) {
    res.json('This is my zip-convertor')
})
app.get('/zip-folder', (req, res) => {
    const folderPath = req.query.folderPath
    if (!folderPath) {
        res.status(400).send('Missing folderPath parameter')
        return
    }
    const archive = archiver('zip', {
        zlib: { level: 9 }
    })
    archive.on('end', function() {
        console.log('Done')
    })
    archive.pipe(res)
    archive.directory(folderPath, false)
    archive.finalize()
})
app.listen(PORT, () => console.log(`server running on PORT ${PORT}`))
