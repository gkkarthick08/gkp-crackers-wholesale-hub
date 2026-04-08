import { z } from 'zod';

/* ===============================================
   AUTHENTICATION SCHEMAS
=============================================== */

// Strong password: min 8 chars, uppercase, number, special char
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter (A-Z)")
  .regex(/\d/, "Must contain at least one number (0-9)")
  .regex(/[@$!%*?&]/, "Must contain at least one special character (@$!%*?&)");

export const loginSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  password: z.string()
    .min(1, "Password is required"),
});

export const signupSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s\-'.]+$/, "Name contains invalid characters"),
  email: z.string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  phone: z.string()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number")
    .or(z.string().regex(/^\+91[6-9]\d{9}$/, "Please enter a valid Indian phone number")),
  password: passwordSchema,
  businessName: z.string()
    .max(100, "Business name must not exceed 100 characters")
    .optional()
    .or(z.literal("")),
  gstNumber: z.string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST number format")
    .optional()
    .or(z.literal("")),
  referralCode: z.string()
    .max(50, "Referral code must not exceed 50 characters")
    .optional()
    .or(z.literal("")),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string()
    .min(1, "Current password is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string()
    .min(1, "Password confirmation is required"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

/* ===============================================
   CHECKOUT & ADDRESS SCHEMAS
=============================================== */

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
    .regex(/^[6-9]\d{9}$/, { message: "Please enter a valid 10-digit Indian phone number" }),
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

export const addressSchema = z.object({
  street: z.string()
    .min(5, "Street address must be at least 5 characters")
    .max(150, "Street must not exceed 150 characters"),
  city: z.string()
    .min(2, "City is required")
    .max(50, "City name must not exceed 50 characters"),
  state: z.string()
    .min(2, "State is required")
    .max(50, "State name must not exceed 50 characters"),
  postalCode: z.string()
    .regex(/^[1-9]{1}[0-9]{5}$/, "Please enter a valid 6-digit postal code"),
  country: z.string()
    .default("India"),
});

export const phoneSchema = z.string()
  .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number");

export const emailSchema = z.string()
  .email("Please enter a valid email address");

/* ===============================================
   TYPE EXPORTS & UTILITY FUNCTIONS
=============================================== */

export type CustomerDetails = z.infer<typeof customerDetailsSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;

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
