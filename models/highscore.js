var mongoose = require('mongoose');

var scoreSchema = new mongoose.Schema({
        name: String,
        score: Number,
        seed: Number
    },
    {collection: 'high_scores'}
);

module.exports = mongoose.model('game_scores', scoreSchema);