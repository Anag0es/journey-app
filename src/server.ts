import fastify from 'fastify';
import { createTrip } from './routes/create-trip';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { confirmTrip } from './routes/confirm-trip';
import { confirmParticipants } from './routes/confirm-participant';
import cors from '@fastify/cors';
import { createActivity } from './routes/create-activity';
import { getActivities } from './routes/get-activities';
import { createLink } from './routes/create-link';
import { getLink } from './routes/get-links';
import { getParticipants } from './routes/get-participants';
import { createInvite } from './routes/create-invite';
import { updateTrip } from './routes/update-trip';
import { getTripDetails } from './routes/get-trip-details';
import { getParticipant } from './routes/get-participant';
import { errorHandler } from './error-handler';
import { env } from './env';

const app = fastify();

app.register(cors, {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    }
);

// Add schema validator and serializer
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.setErrorHandler(errorHandler);

createTrip(app);
confirmTrip(app);

getActivities(app);
getTripDetails(app);
createActivity(app);
updateTrip(app);

createInvite(app);

getLink(app);
createLink(app);

getParticipants(app);
getParticipant(app);
confirmParticipants(app);




app.listen({ port: env.PORT }).then(() => {
  console.log('Server is running on port 3000');
});
