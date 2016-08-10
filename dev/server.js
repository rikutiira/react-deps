import express  from 'express'
import React from 'react'
import { renderToString } from '../src/'
import App from './App'
import { resetStore } from './store'

const app = express()
const publicDir = __dirname + '/../lib/'

//set static directory
app.use(express.static(publicDir))

app.get('/', function(req, res) {
  resetStore()

  renderToString(<App />).then((reactApp) => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>React Deps</title>
          <script>
            window.__INITIAL_STATE__ = ${JSON.stringify(store)}
          </script>
        </head>
        <body>
          <div id="app">${reactApp}</div>
          <script type="application/javascript" src="client.js"></script>
        </body>
      </html>
    `

    res.send(html)
  })
})

app.listen(9000, function() {
  console.log('*** Started development server ***')
})