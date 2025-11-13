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
      reported_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      reported_event_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: 'PENDING',
        validate: {
          isIn: [['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED']],
        },
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      resolved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      resolved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      admin_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
      validate: {
        // Constraint: deve essere segnalato O un utente O un evento
        checkTarget() {
          if (
            (this.reported_user_id && this.reported_event_id) ||
            (!this.reported_user_id && !this.reported_event_id)
          ) {
            throw new Error('Report must target either a user or an event, not both or neither');
          }
        },
      },
    }
  );

  return Report;
};