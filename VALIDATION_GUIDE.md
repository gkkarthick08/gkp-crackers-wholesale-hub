# Input Validation with Zod & React-Hook-Form

This guide shows how to use Zod schemas for validation across the application.

## Installation (Already in dependencies)

```bash
npm install react-hook-form zod @hookform/resolvers
```

## Validation Schemas

All schemas are defined in `src/lib/validations.ts`:

### Authentication Schemas

#### 1. Login Schema
```typescript
import { loginSchema } from "@/lib/validations";

// Validates: email (valid format) + password (non-empty)
const data = {
  email: "user@example.com",
  password: "MyPassword@123"
};
```

#### 2. Signup Schema
```typescript
import { signupSchema } from "@/lib/validations";

// Validates:
// - name: 2-100 chars, letters only
// - email: valid format
// - phone: 10-digit Indian number (6-9XXXXXXXXX)
// - password: STRONG (8+ chars, uppercase, number, special char)
// - businessName: optional, max 100 chars
// - gstNumber: optional, valid GST format
// - referralCode: optional

const data = {
  name: "John Doe",
  email: "john@example.com",
  phone: "9123456789",
  password: "SecurePass@123",
  businessName: "ABC Trading",
  gstNumber: "22AAABR5055K2Z0", // Example
  referralCode: "REF123"
};
```

#### 3. Password Change Schema
```typescript
import { passwordChangeSchema } from "@/lib/validations";

// Validates:
// - currentPassword: required
// - newPassword: STRONG requirements
// - confirmPassword: must match newPassword

const data = {
  currentPassword: "OldPass@123",
  newPassword: "NewPass@456",
  confirmPassword: "NewPass@456"
};
```

### Checkout Schemas

#### 1. Customer Details Schema
```typescript
import { customerDetailsSchema } from "@/lib/validations";

// Validates:
// - name: 2-100 chars, no special chars
// - phone: 10-digit format
// - address: 10-500 chars required
// - notes: optional, max 1000 chars

const data = {
  name: "Jane Smith",
  phone: "9876543210",
  address: "123 Main St, Block A, City, State 400001",
  notes: "Deliver after 6 PM"
};
```

#### 2. Address Schema (Detailed)
```typescript
import { addressSchema } from "@/lib/validations";

// Validates individual address components
const data = {
  street: "123 Market Street, Block A",
  city: "Mumbai",
  state: "Maharashtra",
  postalCode: "400001",
  country: "India"
};
```

## Integration Methods

### Method 1: React-Hook-Form (Recommended)

Best for forms with complex logic and real-time validation.

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "@/lib/validations";

function SignupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch
  } = useForm({
    resolver: zodResolver(signupSchema),
    mode: "onBlur" // Validate on blur
  });

  const password = watch("password"); // Watch for password strength display

  const onSubmit = async (data) => {
    // Data is automatically validated and typed
    console.log("Valid form data:", data);
    // Send to API
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Email */}
      <div>
        <label>Email *</label>
        <input
          type="email"
          {...register("email")}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && <p className="text-red-500">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div>
        <label>Password *</label>
        <input
          type="password"
          {...register("password")}
          className={errors.password ? "border-red-500" : ""}
        />
        {errors.password && <p className="text-red-500">{errors.password.message}</p>}

        {/* Show password requirements */}
        {password && (
          <div className="mt-2 text-sm space-y-1">
            <p className={password.length >= 8 ? "text-green-600" : "text-gray-500"}>
              ✓ At least 8 characters
            </p>
            <p className={/[A-Z]/.test(password) ? "text-green-600" : "text-gray-500"}>
              ✓ One uppercase letter
            </p>
            <p className={/\d/.test(password) ? "text-green-600" : "text-gray-500"}>
              ✓ One number
            </p>
            <p className={/@$!%*?&/.test(password) ? "text-green-600" : "text-gray-500"}>
              ✓ One special character (@$!%*?&)
            </p>
          </div>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Account"}
      </button>
    </form>
  );
}
```

### Method 2: Manual Validation (Current Implementation)

Used in current codebase for simpler state management.

```typescript
import { z } from "zod";
import { customerDetailsSchema } from "@/lib/validations";
import type { CustomerDetails } from "@/lib/validations";

function CheckoutForm() {
  const [formData, setFormData] = useState<CustomerDetails>({...});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    try {
      customerDetailsSchema.parse(formData);
      setErrors({}); // Clear errors if valid
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          const field = err.path[0] as string;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Submit form
      console.log("Valid:", formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Phone *</label>
        <input
          type="tel"
          placeholder="9123456789"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          className={errors.phone ? "border-red-500" : ""}
        />
        {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
      </div>
      {/* More fields... */}
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Validation Rules Reference

### Password Strength
```
✓ Minimum 8 characters
✓ At least 1 uppercase letter (A-Z)
✓ At least 1 number (0-9)
✓ At least 1 special character (@$!%*?&)

Example: MyPassword@123
```

### Phone Number (India)
```
Format: 10-digit mobile starting with 6-9
Examples:
- 9123456789 ✓
- 8765432109 ✓
- 1234567890 ✗ (must start with 6-9)

With country code:
- +919123456789 ✓
```

### Email
```
Format: standard email format
Examples:
- user@example.com ✓
- name+tag@domain.co.uk ✓
- invalid.email@.com ✗
```

### Postal Code
```
Format: 6-digit Indian postal code
Examples:
- 400001 ✓
- 110001 ✓
- 00001 ✗ (must start with 1-9)
```

### GST Number (Optional)
```
Format: 15-character GST number
Example: 22AAABR5055K2Z0
Pattern: [2 digits][5 letters][4 digits][letter][alphanumeric]Z[alphanumeric]
```

## Error Display Examples

### Inline Errors (Current Implementation)
```typescript
{errors.email && (
  <p className="text-sm text-destructive mt-1">{errors.email}</p>
)}
```

### Toast Notifications
```typescript
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

if (!validation.success) {
  const firstError = Object.values(validation.errors)[0];
  toast({
    title: "Validation Error",
    description: firstError,
    variant: "destructive"
  });
}
```

### Form-Level Validation Messages
```typescript
<Alert variant="destructive" className="mb-4">
  <AlertDescription>
    Please fix {Object.keys(errors).length} error(s) before continuing.
  </AlertDescription>
</Alert>
```

## Type Safety

All schemas export TypeScript types:

```typescript
import type {
  LoginFormData,
  SignupFormData,
  PasswordChangeFormData,
  CustomerDetails,
  AddressFormData
} from "@/lib/validations";

// Usage in components
const handleSignup = async (data: SignupFormData) => {
  // data is fully typed and validated
  console.log(data.email, data.password, data.phone);
};
```

## Testing Validation

```typescript
import { signupSchema } from "@/lib/validations";

// Valid data
const goodData = {
  name: "John Doe",
  email: "john@example.com",
  phone: "9123456789",
  password: "SecurePass@123"
};
signupSchema.parse(goodData); // ✓ Success

// Invalid password
const badPassword = {
  ...goodData,
  password: "weak" // ✗ Fails validation
};
try {
  signupSchema.parse(badPassword);
} catch (error) {
  console.log(error.errors[0].message);
  // Output: "Password must be at least 8 characters"
}
```

## Best Practices

1. **Validate at boundaries**: Validate user input when it enters the system
2. **Show specific errors**: Display field-level error messages, not generic "form invalid"
3. **Progressive validation**: Use `onBlur` for less frequent validation during editing
4. **Real-time feedback**: Show password strength inline with requirements
5. **Type safety**: Use exported types for form data in functions
6. **Server-side validation**: Always validate on backend; client validation is UX only

## Files

- **Schemas**: `/src/lib/validations.ts`
- **Examples**: `/src/lib/validation-examples.ts`
- **Auth Implementation**: `/src/pages/Auth.tsx`
- **Cart Implementation**: `/src/pages/Cart.tsx`
