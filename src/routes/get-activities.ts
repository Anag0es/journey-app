import { FastifyInstance } from "fastify";
import z from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import dayjs from "../lib/dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { prisma } from "../lib/prisma";

dayjs.locale('pt-br');
dayjs.extend(localizedFormat);

export async function getActivities(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/activities', {
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
                activities: {
                    orderBy: {
                        occurs_at: 'asc',
                    }
                },
            },
        });

        if(!trip) {
            return reply.status(404).send({ message: 'Trip not found' });
        }

        const differenceInDaysBetweenTripStartAndEnd = dayjs(trip.ends_At).diff(dayjs(trip.starts_At), 'day');
        const activitiesWithDates = Array.from({ length: differenceInDaysBetweenTripStartAndEnd + 1 }).map((_, index) => {
            const date = dayjs(trip.starts_At).add(index, 'day');

            const filteredActivities = trip.activities.filter((activity) => {
                const activityDate = dayjs(activity.occurs_at).toDate();
                return dayjs(activityDate).isSame(date, 'day');
            });

            return {
                date: date.toDate(),
                activities: filteredActivities,
            };
        });

        return { activities: activitiesWithDates };
    });
}
