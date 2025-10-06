
import { optional, z } from "zod";
import { socialMediaSchema } from "./social_media";
import { businessAccountSchema } from "./business_account";


export enum UserType {
    individual = "individual",
    agency = "agency",
    developer = "developer",
    admin = "admin",
    employee = "employee"
}


export interface User {
    id: number;
    full_name: string;
    email: string;
    picture_url?: string | null;
    phone_number?: string | null;
    password_hash?: string;
    user_type: UserType; // adjust to your enum values
    created_at?: Date | null;
    updated_at?: Date | null;

}

export interface AuthPayload {
    user: User,
    token: string
}

export interface OAuth {
    token: string
}



const signUpSchema = z.object({
    full_name: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(4, "Password must be at least 4 characters"),
    confirm_password: z.string().min(4, "Confirm password must be at least 4 characters"),
    user_type: z.enum(["individual", "agency", "developer"]).default("individual"),
})

    .refine((data) => data.password === data.confirm_password, {
        path: ["confirmPassword"],
        message: "Passwords do not match",
    });


const signInSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(4, "Password must be at least 4 characters"),
});



const editUserSchema = z.object({
    full_name: z.string().optional(),
    email: z.string().optional(),
    picture_url: z.string().optional().nullable(),
    phone_number: z.string().optional(),
    birthday: z.date().optional(),
    gender: z.boolean().optional(),
    social_media: socialMediaSchema.optional(),
    business_accounts: businessAccountSchema.optional(),
})



const resetPasswordSchema = z.object({
    old_password: z.string().min(4, "Old Password must be at least 4 characters"),
    new_password: z.string().min(4, "New Password must be at least 4 characters"),
    confirm_password: z.string().min(4, "Confirm Password must be at least 4 characters"),
})

    .refine((data) => data.new_password === data.confirm_password, {
        path: ["confirmPassword"],
        message: "Passwords do not match",
    });


export type UserSignUpInput = z.infer<typeof signUpSchema>;
export type UserSignInInput = z.infer<typeof signInSchema>;
export type EditUserInput = z.infer<typeof editUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export { signUpSchema, signInSchema, editUserSchema , resetPasswordSchema};

