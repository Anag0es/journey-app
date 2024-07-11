import { FastifyInstance } from "fastify";
import z from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import dayjs from "../lib/dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";

dayjs.locale('pt-br');
dayjs.extend(localizedFormat);

export async function createLink(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/links', {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            }),
            body: z.object({
                title: z.string().min(4),
                url: z.coerce.string().url(),
            })
        },
    }, async (request, reply) => {
        const { tripId } = request.params;
        const { title, url } = request.body;

        try {
            // Logging the received data
            request.log.info(`Creating link for trip ID: ${tripId}`);

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

            const link = await prisma.link.create({
                data: {
                    title,
                    url,
                    trip: {
                        connect: {
                            id: tripId,
                        },
                    },
                },
            });

            return {link: link};
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ message: 'Internal server error' });
        }
    }
)}
