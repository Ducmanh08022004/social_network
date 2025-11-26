const { Model, DataTypes } = require('sequelize');

class message extends Model {
  static initModel(sequelize) {
    message.init({
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      conversation_id: { type: DataTypes.INTEGER, allowNull: false },
      sender_id: { type: DataTypes.INTEGER, allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: true }, // text or URL
      type: { type: DataTypes.ENUM('text','image','video'), defaultValue: 'text' },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
      sequelize,
      tableName: 'messages',
      timestamps: false,
      indexes: [{ fields: ['conversation_id', 'created_at'] }]
    });
  }
}

module.exports = message;
