const { Model, DataTypes } = require('sequelize');

class conversationMember extends Model {
  static initModel(sequelize) {
    conversationMember.init({
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      conversation_id: DataTypes.INTEGER,
      user_id: DataTypes.INTEGER
    }, {
      sequelize,
      tableName: 'conversation_members',
      timestamps: false
    });
  }
}

module.exports = conversationMember;
