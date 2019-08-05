const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const passport = require('passport');
const cookieSession = require('cookie-session')
const LocalStrategy = require('passport-local').Strategy;

const User = require('./User');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/cookie-auth');

app.use(cookieSession({
  name: 'session',
  keys: ['helloworld'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((userID, done) => {
  done(null, userID);
});

app.get('/current_user', (req, res) => {
  res.send(req.user);
});

passport.use('login', new LocalStrategy((username, password, done) => {
  User.findOne({ username: username }).then(existingUser => {
    console.log(existingUser)
    if (existingUser) {
      // we already have a record with the given profile ID
      if (existingUser.validPassword(password)) {
        return done(null, existingUser);
      } else {
        return done(false);
      }
    } else {
        // we don't have a user record with this ID, make a new record!
        const myNewUser = new User({ username: username })

        myNewUser.setPassword(password);

        console.log(myNewUser)

        myNewUser.save(function (user) {
          console.log(user)
          done(null, user);
        });
    }
  })
}));

app.post('/register', passport.authenticate('login', {
  successRedirect: '/success',
  failureRedirect: '/login'
}));

app.post('/login', passport.authenticate('login', {
  successRedirect: '/success',
  failureRedirect: '/login'
}));

app.get('/logout', (req, res) => {
  req.logout();
  res.send('Logged out!');
});

app.get('/success', (req, res) => {
  if (req.isAuthenticated()) {
    res.send("Hey, hello from the server!");
  } else {
    res.send("Nope!");
  }
})

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/register.html');
});

app.listen(8000)
