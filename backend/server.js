require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`MADLAXUE API running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
