import { FastifyInstance } from "fastify";
import z from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import dayjs from "../lib/dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";

dayjs.locale('pt-br');
dayjs.extend(localizedFormat);

export async function getTripDetails(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId', {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            }),
        },
    }, async (request) => {
        const { tripId } = request.params;

        const trip = await prisma.trip.findUnique({
            select:{
                id: true,
                destination: true,
                starts_At: true,
                ends_At: true,
                is_confirmed: true,
            },
            where: {
                id: tripId,
            }
        });

        if(!trip) {
            return new ClientError('Trip not found');
        }


        return { trip : trip};
    });
}
