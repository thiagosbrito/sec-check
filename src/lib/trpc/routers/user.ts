import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const userRouter = createTRPCRouter({
  // Get user profile
  getProfile: publicProcedure
    .input(z.object({ 
      userId: z.string().uuid() 
    }))
    .output(z.object({
      id: z.string(),
      email: z.string(),
      name: z.string().nullable(),
      plan: z.enum(['free', 'pro', 'enterprise']),
      scanLimit: z.number(),
      createdAt: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          plan: users.plan,
          scanLimit: users.scanLimit,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user[0]) {
        throw new Error('User not found');
      }

      return user[0];
    }),

  // Update user profile
  updateProfile: publicProcedure
    .input(z.object({
      userId: z.string().uuid(),
      name: z.string().min(1).optional(),
    }))
    .output(z.object({
      success: z.boolean(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, ...updateData } = input;
      
      await ctx.db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return {
        success: true,
        message: 'Profile updated successfully',
      };
    }),
});