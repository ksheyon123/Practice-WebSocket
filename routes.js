const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render.apply('index');
});

module.exports = router;