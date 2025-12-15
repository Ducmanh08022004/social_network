const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const aiController = require('../controllers/ai.controller');

router.post('/suggest-reply', auth, aiController.suggestReply);
router.post('/summary', auth, aiController.summarizeMessages);
router.post('/caption', auth, aiController.suggestCaption);

module.exports = router;
