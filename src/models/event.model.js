export default (sequelize, DataTypes) => {
  const Event = sequelize.define(
    'events',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      capacity: {
        type: DataTypes.INTEGER,
        validate: { min: 1 },
      },
      image_url: {
        type: DataTypes.STRING(255),
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        defaultValue: 'PENDING',
      },
      creator_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
    }
  );

  return Event;
};