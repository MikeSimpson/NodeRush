var mongoose = require('mongoose');

var scoreSchema = new mongoose.Schema({
        name: String,
        score: Number,
        seed: Number,
        moves: [String]
    },
    {collection: 'high_scores_donut'}
);

module.exports = mongoose.model('game_scores', scoreSchema);