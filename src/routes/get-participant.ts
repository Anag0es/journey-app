import { FastifyInstance } from "fastify";
import z from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import dayjs from "../lib/dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { prisma } from "../lib/prisma";

dayjs.locale('pt-br');
dayjs.extend(localizedFormat);

export async function getParticipant(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/participants/:participantId', {  // Corrigido aqui
        schema: {
            params: z.object({
                participantId: z.string().uuid(),
            }),
        },
    }, async (request) => {
        const { participantId } = request.params;

        const participant = await prisma.participant.findUnique({
            select:{
                id: true,
                name: true,
                email: true,
                is_confirmed: true,
            },
            where: {
                id: participantId,
            },
        });

        return { participants: participant }

    });
}
