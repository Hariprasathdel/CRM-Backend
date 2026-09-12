
const express = require('express');

const router = express.Router();



// Define your deal routes here

router.get('/', (req, res) => {

    res.send('Deal route is working');

});



module.exports = router;
