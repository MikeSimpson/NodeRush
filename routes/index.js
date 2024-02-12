let express = require('express');
let router = express.Router();

let port = process.env.PORT || 5000;

//mongo setup
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var app = express();

//Set up and connect to mongo database
mongoose.connect(
     'mongodb+srv://mikesimpson93:iTJszVCsYjtCFIy6@bullrush.geshm2k.mongodb.net/?retryWrites=true&w=majority'
);

let highscore = require('../models/highscore.js');

router.get('/', function(req, res) {
     Promise.all([
          highscore
              .find({})
              .sort({ score: -1 })
              .limit(50)
              .exec()
     ]).then(result => {
          res.render('index', { title: "Bull Rush", scores: result[0] });
     });
});

//post handler
router.post('/highscore', function(req, res) {
     var post = new highscore();
     post.name = req.body.name;
     post.score = req.body.score;
     post.seed = req.body.seed;
     post.moves = req.body.moves;
 
     post.save(function(err) {
         if (err) res.send(err);
         // res.send('Thanks ' + req.body.name + ', your laps has been submitted');
     });
});

module.exports = router;
