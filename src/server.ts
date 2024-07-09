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

createTrip(app);
confirmTrip(app);
confirmParticipants(app);
createActivity(app);
getActivities(app);
createLink(app);
getLink(app);


app.listen({port: 3000}).then(() => {
  console.log('Server is running on port 3000');
});
