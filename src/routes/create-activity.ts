import { FastifyInstance } from "fastify";
import z from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import dayjs from "../lib/dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";

dayjs.locale('pt-br');
dayjs.extend(localizedFormat);

export async function createActivity(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/activities', {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            }),
            body: z.object({
                title: z.string().min(4),
                occurs_at: z.coerce.date(),
            })
        },
    }, async (request, reply) => {
        const { tripId } = request.params;
        const { title, occurs_at } = request.body;

        try {
            // Logging the received data
            request.log.info(`Creating activity for trip ID: ${tripId}`);
            request.log.info(`Activity title: ${title}, occurs at: ${occurs_at}`);

            const trip = await prisma.trip.findUnique({
                where: {
                    id: tripId,
                },
            });

            if (!trip) {
                request.log.warn(`Trip not found: ${tripId}`);
                return new ClientError('Trip not found');
            }

            // Logging trip details
            request.log.info(`Trip details: ${JSON.stringify(trip)}`);

            const occursAtDate = dayjs(occurs_at);
            const tripStartsAt = dayjs(trip.starts_At);
            const tripEndsAt = dayjs(trip.ends_At);

            if (occursAtDate.isBefore(tripStartsAt)) {
                request.log.warn(`Activity date is before trip start date: ${occurs_at} < ${trip.starts_At}`);
                return new ClientError('Cannot create activity before the trip starts');
            }

            if (occursAtDate.isAfter(tripEndsAt)) {
                request.log.warn(`Activity date is after trip end date: ${occurs_at} > ${trip.ends_At}`);
                return new ClientError('Cannot create activity after the trip ends');
            }

            const activity = await prisma.activity.create({
                data: {
                    title,
                    occurs_at: occursAtDate.toDate(),
                    trip: {
                        connect: {
                            id: tripId,
                        },
                    },
                },
            });

            request.log.info(`Activity created with ID: ${activity.id}`);
            return reply.send({ activityId: activity.id });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ message: 'Internal Server Error' });
        }
    });
}
