/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { Popover, Transition } from "@headlessui/react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import apiClient from "@/libs/api";
import Link from "next/link";
import config from "@/config";

// Ítem de navegación del menú de cuenta. Si es la página actual, no se
// renderiza como link (ir a donde ya estás es ruido) sino como estado
// activo con insignia "Estás aquí" — el menú nunca cambia de forma.
const MenuLink = ({ href, isActive, children }) => {
	if (isActive) {
		return (
			<span
				aria-current="page"
				className="flex items-center gap-2 py-2.5 px-4 w-full rounded-lg font-medium cursor-default bg-primary/15 text-primary ring-1 ring-primary/25"
			>
				{children}
				<span className="badge badge-primary badge-xs ml-auto font-semibold">
					Estás aquí
				</span>
			</span>
		);
	}

	return (
		<Link
			href={href}
			className="flex items-center gap-2 hover:bg-base-300 duration-200 py-2.5 px-4 w-full rounded-lg font-medium cursor-pointer"
		>
			{children}
		</Link>
	);
};

// A button to show user some account actions
//  1. Inicio / Mi panel / Propiedades: navegación rápida dentro del menú.
//     Vive en el header global (desktop) y al fondo del drawer (mobile),
//     así que está disponible en todas las páginas sin duplicarlo en cada
//     vista privada.
//  2. Billing: open a Stripe Customer Portal to manage their billing (cancel subscription, update payment method, etc.).
//     You have to manually activate the Customer Portal in your Stripe Dashboard (https://dashboard.stripe.com/test/settings/billing/portal)
//     This is only available if the customer has a customerId (they made a purchase previously)
//  3. Admin Panel: link to admin dashboard (only for admin users)
//  4. Logout: sign out and go back to homepage
// See more at https://shipfa.st/docs/components/buttonAccount
// `direction`: hacia dónde abre el menú — "down" (default) para botones en
// la parte superior (Topbar, dashboard) y "up" para botones al fondo del
// viewport, donde abrir hacia abajo quedaría fuera de la pantalla.
// `compact`: disparador solo-avatar (circular, 40px) para barras angostas
// como el topbar móvil. El panel del menú es idéntico en ambas variantes.
const ButtonAccount = ({ direction = "down", compact = false }) => {
	const { data: session, status } = useSession();
	const pathname = usePathname();
	const [isLoading, setIsLoading] = useState(false);

	// Página actual: se marca con "Estás aquí" (ver <MenuLink/>) en vez de
	// ocultarse, para que el menú no cambie de forma entre páginas.
	const isHome = pathname === "/";
	const isPanel = pathname === config.auth.callbackUrl;
	const isPropiedades =
		pathname === "/propiedades" || pathname.startsWith("/propiedades/");
	const isAdmin = pathname.startsWith("/admin");

	const handleSignOut = () => {
		signOut({ callbackUrl: "/" });
	};
	const handleBilling = async () => {
		setIsLoading(true);

		try {
			const { url } = await apiClient.post("/stripe/create-portal", {
				returnUrl: window.location.href,
			});

			window.location.href = url;
		} catch (e) {
			console.error(e);
		}

		setIsLoading(false);
	};

	// Don't show anything if not authenticated (we don't have any info about the user)
	if (status === "unauthenticated") return null;

	const avatar = session?.user?.image ? (
		<img
			src={session?.user?.image}
			alt={session?.user?.name || "Account"}
			className={compact ? "w-full h-full object-cover" : "w-6 h-6 rounded-full shrink-0"}
			referrerPolicy="no-referrer"
			width={compact ? 40 : 24}
			height={compact ? 40 : 24}
		/>
	) : (
		<span
			className={
				compact
					? "w-full h-full bg-base-300 flex justify-center items-center font-bold"
					: "w-6 h-6 bg-base-300 flex justify-center items-center rounded-full shrink-0"
			}
		>
			{session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0)}
		</span>
	);

	return (
		<Popover className="relative z-50">
			{({ open }) => (
				<>
					<Popover.Button
						className={
							compact
								? "flex items-center justify-center w-10 h-10 rounded-full ring-1 ring-primary/30 bg-base-200 overflow-hidden hover:ring-primary/60 transition-shadow"
								: "btn"
						}
						aria-label="Abrir menú de cuenta"
					>
						{avatar}

						{!compact && (
							<>
								{session?.user?.name || "Account"}

								{isLoading ? (
									<span className="loading loading-spinner loading-xs"></span>
								) : (
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
										className={`w-5 h-5 duration-200 opacity-50 ${
											open ? "transform rotate-180 " : ""
										}`}
									>
										<path
											fillRule="evenodd"
											d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
											clipRule="evenodd"
										/>
									</svg>
								)}
							</>
						)}
					</Popover.Button>
					<Transition
						enter="transition duration-100 ease-out"
						enterFrom="transform scale-95 opacity-0"
						enterTo="transform scale-100 opacity-100"
						leave="transition duration-75 ease-out"
						leaveFrom="transform scale-100 opacity-100"
						leaveTo="transform scale-95 opacity-0"
					>
						{/* `right-0` (no `left-0`): el botón vive en la esquina derecha del
					header. Con `left-0` el panel abría ANCLADO a la izquierda del
					botón y, al ser `w-screen`, se extendía hacia la derecha mucho
					más allá del borde de la ventana — por eso se veía "cortado"/
					sobrepuesto fuera de la página. Con `right-0` el panel crece
					hacia la izquierda desde el borde derecho del botón, quedando
					siempre dentro del viewport. */}
					<Popover.Panel
						className={`absolute right-0 z-10 w-screen max-w-[16rem] transform ${
							direction === "up" ? "bottom-full mb-3" : "mt-3"
						}`}
					>
							<div className="overflow-hidden rounded-xl shadow-xl ring-1 ring-base-content/10 bg-base-100 p-1">
								<div className="space-y-0.5 text-sm">
									<MenuLink href="/" isActive={isHome}>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
											className="w-5 h-5"
										>
											<path d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3H9v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" />
										</svg>
										Inicio
									</MenuLink>

									<MenuLink href={config.auth.callbackUrl} isActive={isPanel}>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
											className="w-5 h-5"
										>
											<path
												fillRule="evenodd"
												d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z"
												clipRule="evenodd"
											/>
										</svg>
										Mi panel
									</MenuLink>

									<MenuLink href="/propiedades" isActive={isPropiedades}>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
											className="w-5 h-5"
										>
											<path
												fillRule="evenodd"
												d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75v-2.5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2.5a.75.75 0 01-.75.75h-3.5a.75.75 0 010-1.5H4zm2-10.75A.75.75 0 016.75 5h.5a.75.75 0 010 1.5h-.5A.75.75 0 016 6.25zm.75 2.75a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5zM6 12.25a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zM12.75 5a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5zm-.75 3.75A.75.75 0 0112.75 8h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zm.75 2.75a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5z"
												clipRule="evenodd"
											/>
										</svg>
										Propiedades
									</MenuLink>

									<div className="divider my-0.5"></div>

									<button
										className="flex items-center gap-2 hover:bg-base-300 duration-200 py-2.5 px-4 w-full rounded-lg font-medium cursor-pointer"
										onClick={handleBilling}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
											className="w-5 h-5"
										>
											<path
												fillRule="evenodd"
												d="M2.5 4A1.5 1.5 0 001 5.5V6h18v-.5A1.5 1.5 0 0017.5 4h-15zM19 8.5H1v6A1.5 1.5 0 002.5 16h15a1.5 1.5 0 001.5-1.5v-6zM3 13.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm4.75-.75a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z"
												clipRule="evenodd"
											/>
										</svg>
										Facturación
									</button>

									{/* Admin Panel link - only show if user is admin */}
									{session?.user?.role === "admin" && (
										<MenuLink href="/admin/dashboard" isActive={isAdmin}>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 20 20"
												fill="currentColor"
												className="w-5 h-5"
											>
												<path
													fillRule="evenodd"
													d="M8.34 1.804A1 1 0 019.32 1h1.36a1 1 0 01.98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 011.262.125l.962.962a1 1 0 01.125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.294a1 1 0 01.804.98v1.361a1 1 0 01-.804.98l-1.473.295a6.95 6.95 0 01-.587 1.416l.834 1.25a1 1 0 01-.125 1.262l-.962.962a1 1 0 01-1.262.125l-1.25-.834a6.953 6.953 0 01-1.416.587l-.294 1.473a1 1 0 01-.98.804H9.32a1 1 0 01-.98-.804l-.295-1.473a6.957 6.957 0 01-1.416-.587l-1.25.834a1 1 0 01-1.262-.125l-.962-.962a1 1 0 01-.125-1.262l.834-1.25a6.957 6.957 0 01-.587-1.416l-1.473-.294A1 1 0 011 10.68V9.32a1 1 0 01.804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 01.125-1.262l.962-.962A1 1 0 015.38 3.03l1.25.834a6.957 6.957 0 011.416-.587l.294-1.473zM13 10a3 3 0 11-6 0 3 3 0 016 0z"
													clipRule="evenodd"
												/>
											</svg>
											Admin Panel
										</MenuLink>
									)}

									<button
										className="flex items-center gap-2 hover:bg-error/20 hover:text-error duration-200 py-2.5 px-4 w-full rounded-lg font-medium cursor-pointer"
										onClick={handleSignOut}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
											className="w-5 h-5"
										>
											<path
												fillRule="evenodd"
												d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
												clipRule="evenodd"
											/>
											<path
												fillRule="evenodd"
												d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z"
												clipRule="evenodd"
											/>
										</svg>
										Cerrar sesión
									</button>
								</div>
							</div>
						</Popover.Panel>
					</Transition>
				</>
			)}
		</Popover>
	);
};

export default ButtonAccount;
