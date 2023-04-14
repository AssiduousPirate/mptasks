const PORT = 3222
const axios = require('axios')
const cheerio = require('cheerio')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const cors = require('cors')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
	extended: false
}))
app.use(cors({
	origin: "*"
}))
app.get('/', function (req, res) {
    res.json('This is my webscraper')
})
app.get('/results', (req, res) => {
    const url = req.query.url
    axios(url)
        .then(response => {
            const html = response.data
            const $ = cheerio.load(html)
            const articles = []
            $('.fc-item__title', html).each(function () {
                const title = $(this).text()
                const url = $(this).find('a').attr('href')
                articles.push({
                    title,
                    url
                })
            })
            res.json(articles)
        }).catch(err => console.log(err))

})
app.listen(PORT, () => console.log(`server running on PORT ${PORT}`))
