
const config = require('./utils/config')
const express = require('express')
require('express-async-errors')
const app = express()
const cors = require('cors')
const middleware = require('./utils/middleware')
const logger = require('./utils/logger')
const mongoose = require('mongoose')
const userRouter = require('./controllers/user')
const noteRouter = require('./controllers/note')
const loginRouter = require('./controllers/login')

logger.info('Connecting to ',config.MONGODB_URI)

mongoose
.connect(config.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true  })
.then( result => {
    console.log('Connected to mongoDB')
})
.catch( error => {
console.log('=== ',error);
})

app.use(cors())
app.use(express.static('build'))
app.use(express.json())
app.use('/api/users',userRouter)
app.use('/api/notes',noteRouter)
app.use('/api/login',loginRouter)

if (process.env.NODE_ENV === 'test') {
    const testingRouter = require('./controllers/testing')
    app.use('/api/testing', testingRouter)
  }

app.use(middleware.requestLogger)
app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app



