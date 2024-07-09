import { FastifyInstance } from "fastify";
import z from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma";
import { prependListener } from "process";
import { getMailClient } from "../lib/mail";
import dayjs from "../lib/dayjs";
import nodemailer from "nodemailer";



export async function confirmTrip(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/confirm', {
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            })
        },
    }, async (request, reply) => {
        const { tripId } = request.params;

        const trip = await prisma.trip.findUnique({
            where: {
                id: tripId,
            },
            include: {
                participants:{
                    where: {
                        is_owner: false,
            
                    }    
                },
            },
        });

        if(!trip){
            return {
                statusCode: 404,
                error: 'Not Found',
                message: 'Trip not found',
            }
        }

        if(trip.is_confirmed){
            return {
                statusCode: 400,
                error: 'Bad Request',
                message: 'Trip already confirmed',
            }
        }
        
        await prisma.trip.update({
            where: {
                id: tripId,
            },
            data: {
                is_confirmed: true,
            },
        });


        const formattedStartDate = dayjs(trip.starts_At).format('LL');
        const formattedEndDate = dayjs(trip.ends_At).format('LL');


        // Send confirmation email
        const mail = await getMailClient();

        await Promise.all([
            trip.participants.map(async (participants) => {
                const confirmationLink = `http://localhost:3000/participants/${participants.id}/confirm`;
                
                // Send confirmation email 
                const mail = await getMailClient();

                const message = await mail.sendMail({
                        from: {
                            name: 'Equipe Trip Organize',
                            address: 'trip@organize.com',
                        },
                        to: participants.email,
                        subject: 'Você foi convidado para uma viagem!',
                        html: `<p>Olá ${participants.name}, você foi convidado para uma viagem para ${trip.destination}!</p>
                        <br>
                        <p>Data: ${formattedStartDate} - ${formattedEndDate}</p>
                        <br>
                        <p>Confirme sua presença <a href="${confirmationLink}">clicando aqui</a>!</p>`
                        .trim(),
                    })
                    console.log('Message sent: %s', message.messageId);
                    console.log(nodemailer.getTestMessageUrl(message));
                }),
        ]);


        return reply.redirect('http://localhost:3000/trips/${tripId}')
    })
}
