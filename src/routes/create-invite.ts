import { FastifyInstance } from "fastify";
import z from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import dayjs from "../lib/dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { prisma } from "../lib/prisma";
import nodemailer from "nodemailer";
import { getMailClient } from "../lib/mail";
import { ClientError } from "../errors/client-error";

dayjs.locale('pt-br');
dayjs.extend(localizedFormat);

export async function createInvite(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/invites', {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            }),
            body: z.object({
                email: z.coerce.string().email()
            })
        },
    }, async (request, reply) => {
        const { tripId } = request.params;
        const { email } = request.body;

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

            const participant = await prisma.participant.create({
                data: {
                    email,
                    trip: {
                        connect: {
                            id: tripId,
                        },
                    },
                },
            });

        const formattedStartDate = dayjs(trip.starts_At).format('LL');
        const formattedEndDate = dayjs(trip.ends_At).format('LL');


       
                const confirmationLink = `http://localhost:3000/participants/${participant.id}/confirm`;
                
                // Send confirmation email 
                const mail = await getMailClient();

                const message = await mail.sendMail({
                        from: {
                            name: 'Equipe Trip Organize',
                            address: 'trip@organize.com',
                        },
                        to: participant.email,
                        subject: 'Você foi convidado para uma viagem!',
                        html: `<p>Olá ${participant.name}, você foi convidado para uma viagem para ${trip.destination}!</p>
                        <br>
                        <p>Data: ${formattedStartDate} - ${formattedEndDate}</p>
                        <br>
                        <p>Confirme sua presença <a href="${confirmationLink}">clicando aqui</a>!</p>`
                        .trim(),
                    })
                    console.log('Message sent: %s', message.messageId);
                    console.log(nodemailer.getTestMessageUrl(message));

                    return { participantId: participant.id }
                
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ message: 'Internal server error' });
        }
    }
)}
