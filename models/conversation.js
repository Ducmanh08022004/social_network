const { Model, DataTypes } = require('sequelize');

class conversation extends Model {
  static initModel(sequelize) {
    conversation.init({
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      type: { type: DataTypes.ENUM('private','group'), allowNull: false, defaultValue: 'private' },
      name: { type: DataTypes.STRING(255), allowNull: true }, // tên nhóm
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
      sequelize,
      tableName: 'conversations',
      timestamps: false
    });
  }
}

module.exports = conversation;
