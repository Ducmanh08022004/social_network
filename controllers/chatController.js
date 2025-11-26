const { Conversation, ConversationMember, Message } = require('../models');
const { Op } = require('sequelize');

// Tạo hoặc lấy conversation private 1-1
exports.createPrivateConversation = async (req, res) => {
  try {
    const myId = req.user.id;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId required' });

    const existing = await Conversation.findOne({
      where: { type: 'private' },
      include: [{
        model: ConversationMember,
        where: { user_id: { [Op.in]: [myId, userId] } }
      }]
    });

    if (existing) {
      const members = await ConversationMember.findAll({
        where: { conversation_id: existing.id }
      });

      const ids = members.map(m => m.user_id);
      if (ids.includes(myId) && ids.includes(userId)) {
        return res.json({ conversation: existing });
      }
    }

    const conv = await Conversation.create({ type: 'private' });
    await ConversationMember.bulkCreate([
      { conversation_id: conv.id, user_id: myId },
      { conversation_id: conv.id, user_id: userId }
    ]);

    res.json({ conversation: conv });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Tạo nhóm
exports.createGroupConversation = async (req, res) => {
  try {
    const myId = req.user.id;
    const { name, users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: 'Users required' });
    }

    const conv = await Conversation.create({
      type: 'group',
      name: name || null
    });

    const members = users.map(u => ({
      conversation_id: conv.id,
      user_id: u
    }));

    members.push({
      conversation_id: conv.id,
      user_id: myId
    });

    await ConversationMember.bulkCreate(members);

    res.json({ conversation: conv });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lấy tin nhắn theo ConversationId
exports.getMessages = async (req, res) => {
  try {
    const convId = parseInt(req.params.conversationId);

    const member = await ConversationMember.findOne({
      where: {
        conversation_id: convId,
        user_id: req.user.id
      }
    });

    if (!member) return res.status(403).json({ message: 'No access' });

    const messages = await Message.findAll({
      where: { conversation_id: convId },
      order: [['created_at', 'ASC']],
      limit: 1000
    });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
