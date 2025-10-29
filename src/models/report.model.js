export default (sequelize, DataTypes) => {
  const Report = sequelize.define(
    'reports',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      reporter_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
    }
  );

  return Report;
};