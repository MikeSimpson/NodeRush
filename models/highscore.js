var mongoose = require('mongoose');

var scoreSchema = new mongoose.Schema({
        name: String,
        score: Number,
        seed: String,
        moves: String
    },
    {collection: 'highScore'}
);

module.exports = mongoose.model('highScore', scoreSchema);