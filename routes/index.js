let express = require('express');
let router = express.Router();

let port = process.env.PORT || 5000;

router.get('/', function(req, res) {
     res.render('index', { title: "Bull Rush" });
});

module.exports = router;