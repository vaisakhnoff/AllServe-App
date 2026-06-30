import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env";
import { authService } from "../di";

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_SECRET,
        callbackURL: "/api/v1/auth/google/callback",
      },
      async (_, __, profile, done) => {
        try {
          const user = await authService.findOrCreateOAuthUser(
            profile.emails?.[0].value || "",
            profile.displayName
          );

          return done(null, (user ?? undefined) as unknown as Express.User | undefined);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

export default passport;
