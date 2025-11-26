const { Model, DataTypes } = require('sequelize');

class MessageReceipt extends Model {
  static initModel(sequelize) {
    MessageReceipt.init({
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      message_id: { type: DataTypes.BIGINT, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      status: { type: DataTypes.ENUM('delivered','read'), allowNull: false },
      updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
      sequelize,
      tableName: 'message_receipts',
      timestamps: false,
      indexes: [{ fields: ['message_id','user_id'] }]
    });
  }
}

module.exports = MessageReceipt;
