import { FastifyInstance } from "fastify";
import z from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import nodemailer from "nodemailer";
import { getMailClient } from "../lib/mail";
import dayjs from "../lib/dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { prisma } from "../lib/prisma";


dayjs.locale('pt-br');
dayjs.extend(localizedFormat);

export async function createTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/trips', {
        schema: {
            body: z.object({
                destination: z.string().min(4),
                starts_At: z.coerce.date(),
                ends_At: z.coerce.date(),
                owner_name: z.string(),
                owner_email: z.string().email(),
                emails_to_invite: z.array(z.string().email()),
            })
        },
    }, async (request, reply) => {
        try {
            const { destination, starts_At, ends_At, owner_name, owner_email, emails_to_invite } = request.body;

            if (dayjs(starts_At).isBefore(new Date())) {
               throw new Error('The start date must be in the future');
            }
            
            if (dayjs(ends_At).isBefore(starts_At)) {
                throw new Error('The end date must be after the start date');
            }

            // Validate unique emails
            const uniqueEmails = new Set([owner_email, ...emails_to_invite]);
            if (uniqueEmails.size !== emails_to_invite.length + 1) {
                return reply.code(400).send({
                    statusCode: 400,
                    error: 'Bad Request',
                    message: 'Duplicate emails found in the request',
                });
            }

            // Save the trip and participants to the database
            const trip = await prisma.trip.create({
                data: {
                    destination,
                    starts_At,
                    ends_At,
                    participants: {
                            create: [
                                {
                                    name: owner_name,
                                    email: owner_email,
                                    is_owner: true,
                                    is_confirmed: true,
                                },
                                ...emails_to_invite.map(email => {
                                    return { email,
                                        is_confirmed: false,
                                     };
                                }),
                            ],
                    },
                },
                include: {
                    participants: true,
                },
            });

            const formattedStartDate = dayjs(trip.starts_At).format('LL');
            const formattedEndDate = dayjs(trip.ends_At).format('LL');

            const confirmationLink = 'http://localhost:3000/trips/${trip.id}/confirm'

            // Send confirmation email
            const mail = await getMailClient();

            const messagePromises = [
                mail.sendMail({
                    from: {
                        name: 'Equipe Trip Organize',
                        address: 'trip@organize.com',
                    },
                    to: {
                        name: owner_name,
                        address: owner_email,
                    },
                    subject: 'Viagem criada com sucesso!',
                    html: `<p>Olá ${owner_name}, sua viagem para ${destination} foi criada com sucesso!</p>
                    Data: ${formattedStartDate} - ${formattedEndDate}
                    <p> A viagem será enviada para os convidados. Pelo link ${confirmationLink} </p>`,
                }),
                console.log('Owner email sent'),
            ];

            await Promise.all(messagePromises);

            // Respond with the trip ID and participants
            reply.code(201).send({
                tripId: trip.id,
                participants: trip.participants,
            });
        } catch (error) {
            reply.code(500).send({
                statusCode: 500,
                error: 'Internal Server Error',
                message: (error as Error).message,
            });
        }
    });
}