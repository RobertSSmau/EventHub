export default (sequelize, DataTypes) => {
  const Registration = sequelize.define(
    'registrations',
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      registered_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
    }
  );

  return Registration;
};