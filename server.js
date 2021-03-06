// set up environment variables using .env file
require('dotenv').config();

const path = require('path');
const express = require('express');
const app = express();
const isImageUrl = require('is-image-url');
const passport = require('passport');

const checkIfAuthenticated = require('./server/utils/checkIfAuthenticated');
const port = process.env.PORT || 3000;
const Pin = require('./server/models/Pin');

// connect to MongoDB
require('./server/utils/connectDb')();

// configure passport object
require('./server/auth/passport')(passport);

const bodyParser = require('body-parser');
const session = require('express-session');
app.use(session({
  secret: 'secretword',
  resave: false,
  saveUninitialized: true,
  cookie: {}
}));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'client/assets')));

app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback',
  passport.authenticate('twitter', {
    successRedirect: '/',
    // failureRedirect: '/failure'
  }));

app.post('/api/logout', function (req, res) {
  req.logout();
  res.json({ message: 'logout successful' });
});

app.post('/api/submitpin', checkIfAuthenticated, (req, res) => {
  let url = req.body.imageUrl;
  const userTwitterId = req.user.twitter.id;
  const userImg = req.user.twitter.profileImageUrl;
  const twitterUserName = req.user.twitter.username;
  // check if link is an image
  // Note: this does not test for broken links
  if (isImageUrl(url)) {
      // create a new pin
      const newPin = Pin({
        imageUrl: url,
        uploadedBy: userTwitterId,
        userProfileImgUrl: userImg,
        twitterUserName
        });
      newPin.save((err, newPin) => {
        res.json(newPin);
      })
  } else {
    res.json({ message: 'Not a valid image link' });
  }
});

app.get('/api/allpins', (req, res) => {
  Pin.find({}, (err, pins) => {
    if (err) { return console.log(err) };
    
    res.json({ allPins: pins });
  })
});

app.delete('/api/deletepin/:pinId', checkIfAuthenticated, (req, res) => {
  const pinId = req.params.pinId;
  Pin.findById(pinId, (err, pin) => {
    if (err) { return console.log(err); }

    if (!pin) {
      res.json({ message: 'Error: pinId: ' + pinId + ' not found'});
    } else {
      Pin.findByIdAndRemove(pinId, (err, pin) => {
        res.json({ 
          message: 'Pin successfully deleted',
          id: pin._id
         })
      });
    }
  });
});

app.put('/api/likepin/:pinId/:userId', checkIfAuthenticated, (req, res) => {
  const pinId = req.params.pinId;
  const userId = req.params.userId;

  Pin.findById(pinId, (err, pin) => {
    if (err) { return console.log(err); }

    if (!pin) {
      res.json({ message: 'Error: pinId: ' + pinId + ' not found' });
    } else {
      // toggle user from array
      const index = pin.likes.indexOf(userId);
      // add user to likes array if that user has not already liked the pin
      if (index === -1) {
        pin.likes.push(userId);
      // remove user from likes array if already present
    } else {
        pin.likes.splice(index, 1);
      }
  
      pin.save((err, savedPin) => {
        if (err) { return console.log(err); }

        res.json({ updatedPin: savedPin });
      });
    }
  });
});

app.get('/api/getmyinfo', checkIfAuthenticated, (req, res) => {
  res.json({ 
    twitterId: req.user.twitter.id,
    twitterUsername: req.user.twitter.username,
    profileImageUrl: req.user.twitter.profileImageUrl
   });
});

app.get('/api/isuserauthenticated', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authStatus: true });
  } else {
    res.json({ authStatus: false });
  }
});

app.get('/*', (req, res) => {
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`App is listening on port: ${ port }`);
});