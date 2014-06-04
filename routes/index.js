var express = require('express');
var router = express.Router();
var redis = require('redis')
var client = redis.createClient();

/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', { title: 'Spare Tracker' });
});

/* Post New Spare */
router.post('/', function(req, res) {
    var user = req.param('user');
    var leave = JSON.stringify(req.param('leave'));
    var wasConverted = req.param('converted');

    // Save to running leave count.
    saveToHistory(user, leave, wasConverted == "true");
    // Save to recent history.
    saveToRecentList(user, leave, wasConverted == "true");
    // Return index with recent list.
    renderIndex(user, res);
});

/* Save pin-leave to users total history */
function saveToHistory(user, leave, wasConverted) {
    // Save to overall leave count.
    client.hincrby(user + ".history", leave, 1, function(err, resp) {
        if (err) console.error("Failed to add leave -- [" + user + ":" + leave + ": + " + wasConverted + "] -- " + err);
        console.log(resp);
    })
}

/* Save pin-leave to recent list */
function saveToRecentList(user, leave, wasConverted) {
    var data = JSON.stringify({leave: leave, wasConverted: wasConverted});
    client.lpush(user + ".recent", data, function(err, resp) {
        if (err) console.error("Failed to push to list -- [" + user + ":" + data + "] -- " + err);
        client.ltrim(user + ".recent", 0, 33, function(err, resp) {
            if (err) console.log("Failed to trim list -- " + err);
            console.log(resp);
        });
    });
}

function renderIndex(user, res) {
    return client.lrange(user + ".recent", 0, 33, function(err, resp) {
        if (err) console.err("Failed to retrieve pin-leave list -- [" + user + "] -- " + err);
        res.render('index', { title: 'Spare Tracker - Home', user: user, pinLeaves: resp});
    });
}

module.exports = router;
