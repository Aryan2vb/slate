import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Allow all origins for dev. 
// NOTE: Restrict this in production to your frontend domains.
app.use(cors());
app.use(express.json());

app.use(routes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Basic error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
