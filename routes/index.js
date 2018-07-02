var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'NodeRush' });
});

var highscore = require('../public/model/highscore.js');

var port = process.env.PORT || 5000;

//mongo setup
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

//Set up and connect to mongo database
mongoose.connect(
    'mongodb://bullrush:bulladmin123@ds125041.mlab.com:25041/heroku_79r1hk2j',
    function(err) {
        if (err) return console.log(err);
        else {
            console.log('Connection Succesful');
        }
        //connect to server
        app.listen(port, function() {
            console.log('listening on port ' + port);
        });
    }
);

var highScoresToPopulate = {};

router.get('/', function(req, res) {
    Promise.all([
        highscore
            .find({})
            .sort({ score: 1 })
            .limit(10)
            .exec()
    ]).then(results => {
        highScoresToPopulate.game_scores = results[0];
        res.render('./index.ejs', { scores: highScoresToPopulate });
    });
});

//post handler
router.post('/highscore', function(req, res) {
    var post = new highscore();
    post.name = req.body.name;
    post.score = req.body.score;

    post.save(function(err) {
        if (err) res.send(err);
        res.send('Thanks ' + req.body.name + ', your score has been submitted');
    });
});

module.exports = router;