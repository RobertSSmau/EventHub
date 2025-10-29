import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import dotenv from 'dotenv-safe';
import { User } from './src/models/index.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
})();

(async () => {
  try {
    const users = await User.findAll({ limit: 3 });
    console.log('Sample users:', users.map(u => u.username));
  } catch (err) {
    console.error('Error reading users:', err.message);
  }
})();