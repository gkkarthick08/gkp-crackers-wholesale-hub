/* ===============================================
   REACT-HOOK-FORM + ZOD INTEGRATION GUIDE
=============================================== */

// Installation (already in dependencies):
// npm install react-hook-form zod @hookform/resolvers

/* ===============================================
   EXAMPLE 1: AUTH FORM WITH REACT-HOOK-FORM
=============================================== */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "@/lib/validations";

export function AuthFormExample() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(signupSchema),
    mode: "onBlur", // Validate on blur for better UX
  });

  const password = watch("password");

  const onSubmit = async (data) => {
    // Data is automatically validated by Zod
    console.log("Form data:", data);
    // Send to API
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Email Field */}
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          placeholder="your@email.com"
          {...register("email")}
          className={`w-full px-3 py-2 border rounded ${errors.email ? "border-red-500" : ""}`}
        />
        {errors.email && (
          <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          placeholder="Min 8 chars, uppercase, number, special char"
          {...register("password")}
          className={`w-full px-3 py-2 border rounded ${errors.password ? "border-red-500" : ""}`}
        />
        {errors.password && (
          <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
        )}

        {/* Password Requirements Checklist */}
        {password && (
          <div className="mt-2 p-3 bg-gray-50 rounded text-sm space-y-1">
            <p className={`flex gap-2 ${password.length >= 8 ? "text-green-600" : "text-gray-500"}`}>
              ✓ At least 8 characters
            </p>
            <p className={`flex gap-2 ${/[A-Z]/.test(password) ? "text-green-600" : "text-gray-500"}`}>
              ✓ One uppercase letter (A-Z)
            </p>
            <p className={`flex gap-2 ${/\d/.test(password) ? "text-green-600" : "text-gray-500"}`}>
              ✓ One number (0-9)
            </p>
            <p className={`flex gap-2 ${/@$!%*?&/.test(password) ? "text-green-600" : "text-gray-500"}`}>
              ✓ One special character (@$!%*?&)
            </p>
          </div>
        )}
      </div>

      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
        Sign Up
      </button>
    </form>
  );
}

/* ===============================================
   EXAMPLE 2: CHECKOUT FORM WITH REACT-HOOK-FORM
=============================================== */

import { customerDetailsSchema } from "@/lib/validations";

export function CheckoutFormExample() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(customerDetailsSchema),
    mode: "onChange", // Real-time validation
  });

  const onSubmit = async (data) => {
    console.log("Checkout data:", data);
    // Validated form data ready to send
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name Field */}
      <div>
        <label className="block text-sm font-medium mb-1">Full Name *</label>
        <input
          type="text"
          placeholder="Enter your name"
          {...register("name")}
          className={`w-full px-3 py-2 border rounded ${errors.name ? "border-red-500" : ""}`}
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Phone Field */}
      <div>
        <label className="block text-sm font-medium mb-1">Phone Number *</label>
        <input
          type="tel"
          placeholder="XXXXXXXXXX (10 digits)"
          {...register("phone")}
          className={`w-full px-3 py-2 border rounded ${errors.phone ? "border-red-500" : ""}`}
        />
        {errors.phone && (
          <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">Enter 10-digit mobile number starting with 6-9</p>
      </div>

      {/* Address Field */}
      <div>
        <label className="block text-sm font-medium mb-1">Delivery Address *</label>
        <textarea
          placeholder="Enter complete address"
          rows={3}
          {...register("address")}
          className={`w-full px-3 py-2 border rounded ${errors.address ? "border-red-500" : ""}`}
        />
        {errors.address && (
          <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
        )}
      </div>

      {/* Notes Field */}
      <div>
        <label className="block text-sm font-medium mb-1">Order Notes (Optional)</label>
        <textarea
          placeholder="Any special instructions..."
          rows={2}
          {...register("notes")}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:bg-gray-400"
      >
        {isSubmitting ? "Submitting..." : "Submit Order"}
      </button>
    </form>
  );
}

/* ===============================================
   EXAMPLE 3: MANUAL VALIDATION (NO REACT-HOOK-FORM)
=============================================== */

import { signupSchema } from "@/lib/validations";
import type { SignupFormData } from "@/lib/validations";

export function ManualValidationExample() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (formData: SignupFormData) => {
    // Manual validation without react-hook-form
    try {
      signupSchema.parse(formData);
      setErrors({}); // Clear errors
      // Submit form
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          newErrors[err.path[0] as string] = err.message;
        });
        setErrors(newErrors);
      }
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(formData);
      }}
    >
      {/* Form fields with error display */}
    </form>
  );
}

/* ===============================================
   KEY FEATURES OF VALIDATION SCHEMAS
=============================================== */

// 1. LOGIN SCHEMA
// - Requires valid email format
// - Requires password (minimum validation)
// - Usage: Authentication forms

// 2. SIGNUP SCHEMA
// - Strong password: 8+ chars, uppercase, number, special char
// - Valid 10-digit Indian phone number
// - Optional business info for dealers
// - Optional GST number validation (15-char format)
// - Usage: New account registration

// 3. PASSWORD CHANGE SCHEMA
// - Same strong password requirements as signup
// - Ensures new password differs from current
// - Confirms password match
// - Usage: Password reset/change forms

// 4. CUSTOMER DETAILS SCHEMA
// - Validates delivery address (10-500 chars)
// - 10-digit Indian phone validation
// - Name validation (letters, hyphens, apostrophes only)
// - Optional notes/instructions
// - Usage: Checkout forms

// 5. ADDRESS SCHEMA (DETAILED)
// - Street, city, state, postal code validation
// - 6-digit postal code check
// - Usage: Detailed address forms

/* ===============================================
   VALIDATION RULES SUMMARY
=============================================== */

const validationRules = {
  password: {
    minLength: 8,
    requirements: [
      "At least one uppercase letter (A-Z)",
      "At least one number (0-9)",
      "At least one special character (@$!%*?&)",
    ],
  },
  phone: {
    format: "10-digit Indian mobile",
    pattern: "6XXXXXXXXX to 9XXXXXXXXX",
    example: "9123456789",
  },
  email: {
    format: "standard@email.format",
    example: "user@example.com",
  },
  address: {
    minLength: 10,
    maxLength: 500,
    required: true,
  },
  name: {
    minLength: 2,
    maxLength: 100,
    allowedChars: "Letters, spaces, hyphens, apostrophes",
  },
  postalCode: {
    format: "6-digit",
    pattern: "1XXXXX to 9XXXXX",
    example: "400001",
  },
};
