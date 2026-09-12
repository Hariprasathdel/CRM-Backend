
const express = require('express');
const router = express.Router();

// Define your activity routes here
router.get('/', (req, res) => {
    res.send('Activity route is working');
});

module.exports = router;