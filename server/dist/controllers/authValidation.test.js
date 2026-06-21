"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters long'),
    role: zod_1.z.enum(['USER', 'ADMIN']).optional().default('USER'),
});
describe('Zod Validation - Auth Registration Schema', () => {
    it('passes validation for correct input schema parameters', () => {
        const validInput = {
            email: 'valid-user@environment.org',
            password: 'strongPassword123!',
            role: 'USER'
        };
        const parsed = registerSchema.safeParse(validInput);
        expect(parsed.success).toBe(true);
        if (parsed.success) {
            expect(parsed.data.email).toBe('valid-user@environment.org');
            expect(parsed.data.role).toBe('USER');
        }
    });
    it('fails validation for invalid email formatting', () => {
        const invalidEmail = {
            email: 'invalid-email-address',
            password: 'strongPassword123!',
        };
        const parsed = registerSchema.safeParse(invalidEmail);
        expect(parsed.success).toBe(false);
    });
    it('fails validation for passwords under 8 characters', () => {
        const weakPassword = {
            email: 'valid-user@environment.org',
            password: 'short',
        };
        const parsed = registerSchema.safeParse(weakPassword);
        expect(parsed.success).toBe(false);
        if (!parsed.success) {
            expect(parsed.error.errors[0].message).toBe('Password must be at least 8 characters long');
        }
    });
    it('fails validation for unsupported role types (least privilege control)', () => {
        const badRole = {
            email: 'valid-user@environment.org',
            password: 'strongPassword123!',
            role: 'SUPER_ADMIN' // Unsupported role
        };
        const parsed = registerSchema.safeParse(badRole);
        expect(parsed.success).toBe(false);
    });
});
