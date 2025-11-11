import { sequelize } from '../config/db.js';
import { DataTypes } from 'sequelize';
import UserModel from './user.model.js';
import EventModel from './event.model.js';
import RegistrationModel from './registration.model.js';
import ReportModel from './report.model.js';

// Model initialization
const User = UserModel(sequelize, DataTypes);
const Event = EventModel(sequelize, DataTypes);
const Registration = RegistrationModel(sequelize, DataTypes);
const Report = ReportModel(sequelize, DataTypes);

// Model associations

Registration.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });
User.hasMany(Event, { foreignKey: 'creator_id', as: 'events' });
Event.belongsTo(User, { foreignKey: 'creator_id', as: 'creator' });

User.belongsToMany(Event, {
  through: Registration,
  foreignKey: 'user_id',
  as: 'registeredEvents', 
});
Event.belongsToMany(User, {
  through: Registration,
  foreignKey: 'event_id',
  as: 'participants',
});

User.hasMany(Report, { foreignKey: 'reporter_id', as: 'reports' });
User.hasMany(Report, { foreignKey: 'reported_user_id', as: 'receivedReports' });
Event.hasMany(Report, { foreignKey: 'reported_event_id', as: 'eventReports' });

Report.belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter' });
Report.belongsTo(User, { foreignKey: 'reported_user_id', as: 'reportedUser' });
Report.belongsTo(Event, { foreignKey: 'reported_event_id', as: 'reportedEvent' });

// Database authentication
await sequelize.authenticate();
console.log('Models initialized and connected to DB.');

export { sequelize, User, Event, Registration, Report };