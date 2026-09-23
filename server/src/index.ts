import express from 'express';
import cors from 'cors';
import { attachUser } from './middleware/auth';
import { authRouter } from './routes/auth';
import { profilesRouter } from './routes/profiles';
import { directoryRouter } from './routes/directory';
import { opportunitiesRouter } from './routes/opportunities';
import { mentorshipRouter } from './routes/mentorship';
import { messagesRouter } from './routes/messages';
import { adminRouter } from './routes/admin';

const app = express();
app.use(cors());
app.use(express.json());
app.use(attachUser);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/directory', directoryRouter);
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/mentorship', mentorshipRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/admin', adminRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`REF Network API listening on http://localhost:${PORT}`);
});
