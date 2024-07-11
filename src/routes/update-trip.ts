import { FastifyInstance } from "fastify";
import z from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import dayjs from "../lib/dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";


dayjs.locale('pt-br');
dayjs.extend(localizedFormat);

export async function updateTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().put('/trips/:tripId', {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            }),
            body: z.object({
                destination: z.string().min(4),
                starts_At: z.coerce.date(),
                ends_At: z.coerce.date(),
            })
        },
    }, async (request, reply) => {
        try {
            const { tripId } = request.params;
            const { destination, starts_At, ends_At } = request.body;

            if (dayjs(starts_At).isBefore(new Date())) {
               throw new ClientError('The start date must be in the future');
            }
            
            if (dayjs(ends_At).isBefore(starts_At)) {
                throw new ClientError('The end date must be after the start date');
            }

            const trip = await prisma.trip.findUnique({
                where: {
                    id: tripId,
                },
            });

            if (!trip) {
                request.log.warn(`Trip not found: ${tripId}`);
                return new ClientError('Trip not found');
            }

            
            await prisma.trip.update({
                where: {
                    id: tripId,
                },
                data: {
                    destination,
                    starts_At,
                    ends_At,
                },
            });

            reply.send({ message: 'Trip updated',
                trip: {
                    destination,
                    starts_At,
                    ends_At,
                }
             });

        } catch (error) {
            request.log.error(error);
            reply.status(500).send({ message: 'Internal server error' });
        }
    });
}