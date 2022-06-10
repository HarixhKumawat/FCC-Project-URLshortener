require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const dns = require('dns');
var validUrl = require('valid-url');
const app = express();

const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useFindAndModify', false);
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});
const urlModel = mongoose.model('urlModel', urlSchema);

urlBasement = [
  {original_url: "https://www.google.com", short_url: 2},
  {original_url: "https://www.freecodecamp.org", short_url: 1},
  {original_url: "https://www.reddit.com", short_url: 3}
];



let requestedUrl = [];
let original_url;

app.use(bodyParser.urlencoded({extended: false}));

app.use(cors());

(urlBasement, done) => {
  urlModel.create(urlBasement, (err, data) => {
    if(err){
      return done(err);
    };
    return done(null, data);
})};

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res, next) => {
  original_url = req.body.url;

  if (!validUrl.isWebUri(original_url)) {
    res.json({ error: 'invalid url' });
  }
  else {
    urlFinderOriginal(original_url, req, res);
  };
});

app.get('/api/shorturl/:short_url', (req, res) => {
  
  short_url = req.params.short_url;
  urlFinderShort(short_url, req, res);
  
});

const urlFinderOriginal = (url, req, res) => {

  urlModel.find({"original_url" : url}, (err, doc) => {
    if (doc[0])
    {
      requestedUrl = { 'original_url': doc[0].original_url, 'short_url': doc[0].short_url };
      res.json(requestedUrl);
    }
    else{
      urlModel.find().sort('-short_url').exec((err, doc) => {
        console.log(doc[0].short_url);
        shUrl = parseInt(doc[0].short_url) + 1;

        let newUrl = new urlModel;
        newUrl.original_url = url;
        newUrl.short_url = shUrl;
        console.log(newUrl);
        newUrl.save((err, data) => {
        res.json({ 'original_url': data.original_url, 'short_url': data.short_url });
        });
      });
    };
  });
};
const urlFinderShort = (url, req, res) => {
  urlModel.find( {"short_url": url}, (err, doc) => {
    if (err){
      return handleError(err);
    };
    res.redirect(doc[0].original_url);
  });
};

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
