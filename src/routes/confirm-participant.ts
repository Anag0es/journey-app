import { FastifyInstance } from "fastify";
import z from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";
import { env } from "../env";



export async function confirmParticipants(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/participants/:participantId/confirm', {
        schema: {
            params: z.object({
                participantId: z.string().uuid(),
            })
        },
    }, async (request, reply) => {
        const { participantId } = request.params;

        const participant = await prisma.participant.findUnique({
            where: {
                id: participantId,
            },
        });

        if(!participant){
            throw new ClientError('Participant not found');
        }

        if(participant.is_confirmed){
            return reply.redirect(`${env.API_BASE_URL}/trips/${participant.tripId}`);
        }

        await prisma.participant.update({
            where: {
                id: participantId,
            },
            data: {
                is_confirmed: true,
            },
        });


        return reply.redirect(`${env.API_BASE_URL}/trips/${participant.tripId}`)
    })
}