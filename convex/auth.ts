import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { internal } from "./_generated/api";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId }) {
      // Get user's email
      const user = await ctx.db.get(userId);
      if (user?.email) {
        // Process any pending invites for this email
        await ctx.runMutation(internal.tripMembers.processInvitesForUser, {
          userId,
          email: user.email,
        });
      }
    },
  },
});
