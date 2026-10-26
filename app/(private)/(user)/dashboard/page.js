import Link from "next/link";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import config from "@/config";
import ButtonAccount from "@/components/ButtonAccount";
import PropertyManager from "./PropertyManager";

export const dynamic = "force-dynamic";

// Dashboard real del propietario/agente: antes era una "Private Page"
// genérica que no entregaba nada a cambio de la suscripción. Ahora muestra
// el panel para publicar y gestionar propiedades directamente — sin pedir
// que "actives" ningún plan primero. Publicar es gratis por defecto (plan
// Básico, ver config.js); si el usuario tiene una suscripción Premium paga
// y confirmada, usa el límite más alto de ese plan en su lugar.
export default async function Dashboard() {
  const session = await auth();
  await connectMongo();

  const dbUser = await User.findById(session.user.id).lean();
  const paidPlan = dbUser?.hasAccess
    ? config.stripe.plans.find(
        (p) => !p.isFree && p.priceId === dbUser.priceId
      )
    : null;
  const freePlan = config.stripe.plans.find((p) => p.isFree);
  const plan = paidPlan || freePlan;

  return (
    <main className="min-h-screen p-6 sm:p-8 pb-24 bg-base-100">
      <section className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Mi panel de propietario
          </h1>
          <ButtonAccount />
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm opacity-60">Plan actual</p>
            <p className="font-bold text-lg">
              {plan?.name || "Básico"}{" "}
              <span className="opacity-60 font-normal text-sm">
                · hasta {plan?.maxProperties ?? 20} propiedades
              </span>
            </p>
          </div>
          {paidPlan ? (
            <span className="badge badge-success badge-outline">
              Suscripción activa
            </span>
          ) : (
            <Link href="/#pricing" className="btn btn-outline btn-sm">
              Subir a Premium
            </Link>
          )}
        </div>

        <PropertyManager
          maxProperties={plan?.maxProperties ?? 20}
          featuredListing={config.featuredListing}
        />
      </section>
    </main>
  );
}
