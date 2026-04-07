import { z } from 'zod';

// Customer order details validation schema
export const customerDetailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be less than 100 characters" })
    .regex(/^[a-zA-Z\s\-'.]+$/, { message: "Name contains invalid characters" }),
  phone: z
    .string()
    .trim()
    .min(10, { message: "Phone number must be at least 10 digits" })
    .max(15, { message: "Phone number is too long" })
    .regex(/^[+]?[0-9\s-]+$/, { message: "Invalid phone number format" }),
  address: z
    .string()
    .trim()
    .min(10, { message: "Address must be at least 10 characters" })
    .max(500, { message: "Address must be less than 500 characters" }),
  notes: z
    .string()
    .max(1000, { message: "Notes must be less than 1000 characters" })
    .optional()
    .default("")
});

export type CustomerDetails = z.infer<typeof customerDetailsSchema>;

// Validate customer details and return errors
export function validateCustomerDetails(details: CustomerDetails): { 
  success: boolean; 
  errors: Record<string, string>;
  data?: CustomerDetails;
} {
  const result = customerDetailsSchema.safeParse(details);
  
  if (result.success) {
    return { success: true, errors: {}, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const field = error.path[0] as string;
    if (!errors[field]) {
      errors[field] = error.message;
    }
  });
  
  return { success: false, errors };
}
