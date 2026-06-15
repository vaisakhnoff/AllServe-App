import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import crypto from "crypto";
import { env } from "./env";
import { AuthRepository } from "../repositories/auth.repository";

const repo = new AuthRepository();

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
          let user = await repo.findByEmail(profile.emails?.[0].value || "");

          if (!user) {
            user = await repo.create({
              name: profile.displayName,
              email: profile.emails?.[0].value || "",
              password: crypto.randomBytes(16).toString("hex"),
              isVerified: true,
            });
          }

          return done(null, (user ?? undefined) as unknown as Express.User | undefined);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

export default passport;
