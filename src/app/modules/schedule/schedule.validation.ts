import { z } from "zod";

const create = z.object({
    body: z.object({
        startDate: z.string(),
        endDate: z.string(),
        startTime: z.string(),
        endTime: z.string(),
    }),
});

export const ScheduleValidation = {
    create,
};
