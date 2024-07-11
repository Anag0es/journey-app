import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod';

type FastifyErrorHandler = FastifyInstance['errorHandler'];

export const errorHandler : FastifyErrorHandler = (error, request, reply) => {

    if(error instanceof ZodError) {
        return reply.status(400).send({ message: 'Invalid Input',
            errors: error.flatten().fieldErrors });
    }
      
    if(error instanceof Error) {
        return reply.status(400).send({ message: error.message });
    }

}