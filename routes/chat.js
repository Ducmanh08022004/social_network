const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');

const {
  createPrivateConversation,
  createGroupConversation,
  getMessages
} = require('../controllers/chatController');

router.post('/private', auth, createPrivateConversation);
router.post('/group', auth, createGroupConversation);
router.get('/:conversationId/messages', auth, getMessages);

module.exports = router;
