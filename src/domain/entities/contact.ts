import { z } from 'zod';

export const AddressSchema = z.object({
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

export const ContactSchema = z.object({
  name: z.string(),
  emailAddress: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  address: AddressSchema.optional(),
});

export type Address = z.infer<typeof AddressSchema>;
export type Contact = z.infer<typeof ContactSchema>;