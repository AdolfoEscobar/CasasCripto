import NextAuth from "next-auth"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import config from "@/config"
import connectMongo from "./mongo"
import connectMongoose from "./mongoose"
import { deriveNameFromEmail } from "./deriveNameFromEmail.mjs"
import User from "@/models/User"

export const { handlers, auth, signIn, signOut } = NextAuth({
  
  // Set any random key in .env.local
  secret: process.env.NEXTAUTH_SECRET,
  
  // Add EmailProvider only for server-side usage (not edge-compatible)
  providers: [
    // Follow the "Login with Email" tutorial to set up your email server
    // Requires a MongoDB database. Set MONGODB_URI env variable.
    ...(connectMongo
      ? [
          EmailProvider({
            server: {
              host: "smtp.resend.com",
              port: 465,
              auth: {
                user: "resend",
                pass: process.env.RESEND_API_KEY,
              },
            },
            from: config.resend.fromNoReply,
            // Vincula automáticamente el magic link a una cuenta existente
            // con el mismo correo (ej. creada antes con Google) en vez de
            // fallar con OAuthAccountNotLinked. Es seguro: hacer clic en el
            // enlace demuestra que el usuario es dueño del buzón.
            allowDangerousEmailAccountLinking: true,
            // Usa la plantilla corporativa de libs/resend.js en vez del
            // correo genérico "Sign in" por defecto de NextAuth. Import
            // dinámico para no cambiar el comportamiento de importación
            // de este módulo (resend.js exige RESEND_API_KEY al cargar).
            async sendVerificationRequest({ identifier, url }) {
              const { sendMagicLinkEmail } = await import("./resend");
              await sendMagicLinkEmail({ to: identifier, url });
            },
          }),
          GoogleProvider({
            // Follow the "Login with Google" tutorial to get your credentials
            clientId: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET,
            // Igual que en Email: vincula automáticamente si el correo ya
            // existe (ej. cuenta creada antes con magic link). Es seguro
            // porque Google solo entrega correos verificados.
            allowDangerousEmailAccountLinking: true,
            // Force Google to always show the account chooser, so users with
            // several Google accounts can pick one instead of being silently
            // signed in with the active Google session.
            authorization: {
              params: {
                prompt: "select_account",
              },
            },
            async profile(profile) {
              return {
                id: profile.sub,
                name: profile.given_name ? profile.given_name : profile.name,
                email: profile.email,
                image: profile.picture,
                role: "user",
                createdAt: new Date(),
              };
            },
          }),
        ]
      : []),
  ],
  
  // New users will be saved in Database (MongoDB Atlas). Each user (model) has some fields like name, email, image, etc..
  // Requires a MongoDB database. Set MONGODB_URI env variable.
  // Learn more about the model type: https://authjs.dev/concepts/database-models
  ...(connectMongo && { adapter: MongoDBAdapter(connectMongo) }),

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Include user role in JWT token
      if (user) {
        token.role = user.role || "user";
      }

      // Refresh user data if session is updated
      if (trigger === "update" && session?.user) {
        try {
          await connectMongoose();
          const dbUser = await User.findById(token.sub);
          if (dbUser) {
            token.role = dbUser.role || "user";
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session?.user && token.sub) {
        session.user.id = token.sub;

        // Always fetch fresh role from database
        try {
          await connectMongoose();
          const dbUser = await User.findById(token.sub);
          session.user.role = dbUser?.role || "user";
          // La BD es canónica para el nombre: respeta ediciones del admin
          // y cubre el primer login con magic link (el token aún no trae
          // nombre porque se derivó al crear el usuario).
          session.user.name = dbUser?.name || session.user?.name || null;
        } catch (error) {
          console.error("Error fetching user role:", error);
          session.user.role = token.role || "user";
        }
      }
      return session;
    },
    async signIn({ user }) {
      // Backfill: normaliza usuarios existentes sin rol o sin nombre (ej. los
      // creados con magic link antes de que existiera deriveNameFromEmail).
      // Mutar `user` propaga los valores a la sesión de este mismo login.
      if (user.id && (!user.role || !user.name)) {
        try {
          await connectMongoose();
          const dbUser = await User.findById(user.id);
          if (dbUser) {
            const updates = {};
            if (!dbUser.role) updates.role = "user";
            const email = dbUser.email || user.email;
            if (!dbUser.name && email) {
              updates.name = deriveNameFromEmail(email);
            }
            if (Object.keys(updates).length > 0) {
              await User.findByIdAndUpdate(user.id, updates);
              Object.assign(user, updates);
            }
          }
        } catch (error) {
          console.error("Error backfilling user defaults:", error);
        }
      }
      return true;
    },
  },
  
  events: {
    async createUser({ user }) {
      // Defaults para usuarios nuevos: rol "user" y nombre derivado del
      // correo cuando el proveedor no lo trae (magic link). Mutar `user`
      // propaga los valores al token/sesión de este mismo registro.
      if (!user.role || !user.name) {
        try {
          const updates = {};
          if (!user.role) updates.role = "user";
          if (!user.name && user.email) {
            updates.name = deriveNameFromEmail(user.email);
          }
          if (Object.keys(updates).length > 0) {
            await connectMongoose();
            await User.findByIdAndUpdate(user.id, updates);
            Object.assign(user, updates);
          }
        } catch (error) {
          console.error("Error setting defaults for new user:", error);
        }
      }
    },
  },
  
  session: {
    strategy: "jwt",
  },
  theme: {
    brandColor: config.colors.main,
    // Add you own logo below. Recommended size is rectangle (i.e. 200x50px) and show your logo + name.
    // It will be used in the login flow to display your logo. If you don't add it, it will look faded.
    logo: `https://${config.domainName}/logoAndName.png`,
  },
  // El login normal vive en el modal global (<AuthModal/>) y nunca toca
  // estas URLs. Ambas apuntan a la página mínima de errores de marca
  // (app/auth/error): ahí caen los casos borde — OAuth denegado, magic link
  // vencido/reusado, o una llamada a signIn() sin proveedor — con un botón
  // para reintentar abriendo el modal.
  pages: {
    signIn: "/auth/error",
    error: "/auth/error",
  },
}); 