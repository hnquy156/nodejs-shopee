const mongoose = require('mongoose');
const { Schema } = mongoose;

const databaseConfigs = require(__path_configs + 'database');

const items = new Schema({
	name: String,
    status: String,
    rss_link: String,
    ordering: Number,
    created: {
        user_id: String,
        user_name: String,
        time: Date,
    },
    modified: {
        user_id: String,
        user_name: String,
        time: Date,
    },
});

module.exports = mongoose.model(databaseConfigs.col_rss, items);