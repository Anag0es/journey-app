import { FastifyInstance } from "fastify";
import z from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import dayjs from "../lib/dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { prisma } from "../lib/prisma";

dayjs.locale('pt-br');
dayjs.extend(localizedFormat);

export async function getLink(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/links', {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            }),
        },
    }, async (request, reply) => {
        const { tripId } = request.params;

        const trip = await prisma.trip.findUnique({
            where: {
                id: tripId,
            },
            include: {
                links: true
            },
        });

        if(!trip) {
            return reply.status(404).send({ message: 'Trip not found' });
        }


        return { links : trip.links};
    });
}
