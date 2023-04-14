const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const path = require('path')
const OktaJwtVerifier = require('@okta/jwt-verifier')
const { OktaAuth } = require('@okta/okta-auth-js')
require('dotenv').config()

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

const MemoryStore = require('memorystore')(session)

const sessionConfig = {
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { "maxAge": 86400000 },
  store: new MemoryStore({
    checkPeriod: 86400000
  })
}
app.use(session(sessionConfig))

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: `${process.env.ORG_URL}/oauth2/default`
})

const oktaAuthRequired = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/Bearer (.+)/);

  if (!match) {
    res.status(401);
    return next('Unauthorized');
  }

  const accessToken = match[1];
  const audience = 'api://default';

  return (
    oktaJwtVerifier
      .verifyAccessToken(accessToken, audience)
      .then((jwt) => {
        req.jwt = jwt;
        next();
      })
      .catch((err) => {
        res.status(401).send(err.message);
      })
  )
}

app.get('/', (req, res) => {
  const oktaAuth = new OktaAuth({
    issuer: `${process.env.ORG_URL}/oauth2/default`,
    clientId: process.env.CLIENT_ID,
    redirectUri: `${process.env.BASE_URL}/authorization-code/callback`
  })

  if (req.userContext) {
    const token = oktaAuth.tokenManager.get('idToken')
    const accessToken = oktaAuth.tokenManager.get('accessToken')
    console.log('idToken:', token)
    console.log('accessToken:', accessToken)
    res.render('index', {
      userContext: req.userContext,
      oktaAuth
    })
  } else {
    res.render('index', {
      userContext: req.userContext,
      oktaAuth
    })
  }
})

app.get('/authorization-code/callback', oktaAuthRequired, (req, res) => {
    res.render('profile', {
      userContext: req.userContext
    })
})


app.get('/api/messages', oktaAuthRequired, (req, res) => {
  oktaJwtVerifier.verifyAccessToken(req.userContext.tokens.access_token)
    .then(jwt => {
      res.json({
        message: 'Hello, world!'
      })
    })
    .catch(err => {
      console.log(err)
      res.status(401).send(err.message)
    })
})

app.listen(process.env.PORT, () => {
  console.log(`Server started at http://localhost:${process.env.PORT}`)
})
