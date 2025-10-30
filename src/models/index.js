import { sequelize } from '../config/db.js';
import { DataTypes } from 'sequelize';
import UserModel from './user.model.js';
import EventModel from './event.model.js';
import RegistrationModel from './registration.model.js';
import ReportModel from './report.model.js';

// initialization
const User = UserModel(sequelize, DataTypes);
const Event = EventModel(sequelize, DataTypes);
const Registration = RegistrationModel(sequelize, DataTypes);
const Report = ReportModel(sequelize, DataTypes);

//relations

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
Event.hasMany(Report, { foreignKey: 'event_id', as: 'eventReports' });
Report.belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter' });
Report.belongsTo(Event, { foreignKey: 'event_id', as: 'reportedEvent' });

// autentication
await sequelize.authenticate();
console.log('Models initialized and connected to DB.');

export { sequelize, User, Event, Registration, Report };