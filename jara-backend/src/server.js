import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import accountsRouter from './routes/accounts.js';
import transfersRouter from './routes/transfers.js';
import beneficiariesRouter from './routes/beneficiaries.js';
import goalsRouter from './routes/goals.js';
import groupsRouter from './routes/groups.js';
import banksRouter from './routes/banks.js';
import servicesRouter from './routes/services.js';
import notificationsRouter from './routes/notifications.js';
import cardsRouter from './routes/cards.js';
import adminRouter from './routes/admin.js';
import supportRouter from './routes/support.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
if (!env.isProd) app.use(morgan('dev'));

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/transfers', transfersRouter);
app.use('/api/beneficiaries', beneficiariesRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/banks', banksRouter);
app.use('/api/services', servicesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/support', supportRouter);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`Jara API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

start();

export default app;
