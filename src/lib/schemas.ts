import { z } from "zod";

/** What the AI must return. Deadline is local time "YYYY-MM-DDTHH:mm". */
export const ExtractedTaskSchema = z.object({
  title: z.string().min(1).max(200),
  course: z.string().max(100).nullable().describe("Course name or code, null if unknown"),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    .nullable()
    .describe("Local datetime YYYY-MM-DDTHH:mm. Use 23:59 if no time is stated. null if no date is given."),
  estimatedMinutes: z.number().int().min(15).max(1200).describe("Realistic total study/work minutes needed"),
  weight: z.number().int().min(1).max(100).describe("Importance 1-100, e.g. share of final grade"),
  notes: z.string().max(500).nullable(),
});
export type ExtractedTask = z.infer<typeof ExtractedTaskSchema>;

export const ExtractionSchema = z.object({
  tasks: z.array(ExtractedTaskSchema).max(60),
});

/** What the browser sends when saving confirmed tasks. */
export const CreateTasksSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        course: z.string().max(100).nullable().optional(),
        deadline: z.string().datetime(),
        estimatedMinutes: z.number().int().min(15).max(1200),
        weight: z.number().int().min(1).max(100),
        notes: z.string().max(500).nullable().optional(),
        source: z.string().max(30).default("manual"),
      }),
    )
    .min(1)
    .max(100),
});

export const UpdateTaskSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  title: z.string().min(1).max(200).optional(),
  deadline: z.string().datetime().optional(),
  estimatedMinutes: z.number().int().min(15).max(1200).optional(),
  weight: z.number().int().min(1).max(100).optional(),
});