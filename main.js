//load libraries 
const fetch = require('node-fetch')
const withQuery = require('with-query').default
const crypto = require('crypto');
const express = require('express')
const handlebars = require('express-handlebars')

//PORT
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

//create express instance
const app = express()

//configure handlebars
app.engine('hbs',
    handlebars({defaultLayout: 'default.hbs'})
)
app.set('view engine', 'hbs')

//setting API KEYS
const API_KEY = process.env.API_KEY || '81136b9bcdfedf77741c9c4cc454f169'
const PRIVATE_KEY = process.env.PRIVATE_KEY || ''

const BASE_URL = 'https://gateway.marvel.com/v1/public'

const ts = new Date().getTime()
const preHash = `${ts}${PRIVATE_KEY}${API_KEY}`
const hash = crypto.createHash('md5').update(preHash).digest('hex')

app.get('/',
    (req, resp) => {
        resp.status(200)
        resp.type('text/html')
        resp.render('index')
    }
)

app.get('/search/:search/:charId',
    async (req, resp) => {
        try {
            const search = req.params['search']
            const charId = req.params['charId']
            console.info('clicked on a link', charId)
            //construct the url
            let url = withQuery(BASE_URL + `/characters/${charId}`, {
                apikey: API_KEY,
                ts,
                hash
            })

            let result = await fetch(url)
            let marvels = await result.json()
            console.info('marvels',marvels)
            const names = marvels.data.results
            .map(
                d => {
                    return {name: d.name, thumbnail: d.thumbnail.path, noOfComics: d.comics.available, 
                            noOfSeries: d.series.available, noOfStories: d.stories.available,
                            noOfEvents: d.events.available}
                }
            )
            console.info('names: ', names)
            resp.status(200)
            resp.type('text/html')
            resp.render('detail',
                {
                    names:names[0], //key and value same name
                    search
                }
            )
        }
        catch(e) {
            console.error('Error: ', e)
            resp.status(500)
            resp.json(e)
        }

    }
)

app.get('/search',
    async (req, resp) => {
        try {
            const search = req.query['search']

            console.info(`search term is: ${search}`)

            //construct the url
            let url = withQuery(BASE_URL + '/characters', {
                apikey: API_KEY,
                ts,
                hash,
                nameStartsWith: search
            })

            let result = await fetch(url)
            let marvels = await result.json()
            const count = marvels.data.count
            const names = marvels.data.results
            .map(
                d => {
                    return {name: d.name, charId: d.id, thumbnail: d.thumbnail.path, search}
                }
            )
            console.info('names: ', names, 'count: ', count)
            resp.status(200)
            resp.type('text/html')
            resp.render('result',
                {
                    search,
                    names, //key and value same name
                    count,
                    hasContent: count > 0
                }
            )
        }
        catch(e) {
            resp.status(500)
            resp.json(e)
            console.error('Error: ', e)
        }

    }
)

if (API_KEY && PRIVATE_KEY){
    app.listen(PORT, () => {
    console.info(`Application started on port ${PORT} at ${new Date()}`)
    console.info(`With API_KEY ${API_KEY}, PRIVATE_KEY ${PRIVATE_KEY}`)
    })
}
else {
    console.error('API_KEY is not set')
}