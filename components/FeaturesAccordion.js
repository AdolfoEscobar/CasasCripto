"use client";

import { useState, useRef } from "react";
import Image from "next/image";

// Características reales de Casas Cripto. Las marcadas con "(roadmap)" en la
// descripción todavía no están construidas — ver claude-instructions.md /
// .cursorrules para el estado exacto de implementación de cada una.
const features = [
  {
    title: "Pagos en criptomonedas",
    description:
      "Acepta USDC, USDT, BTC y ETH directamente en el checkout, con conversión opcional a fiat y liquidación en menos de 48 horas (vía Stripe hoy; wallets on-chain en roadmap).",
    type: "image",
    path: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=1200&q=80",
    alt: "Pagos en criptomonedas",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25"
        />
      </svg>
    ),
  },
  {
    title: "Marketplace global de propiedades",
    description:
      "Publica y descubre propiedades filtrando por país, moneda aceptada y tipo de inmueble. Pensado para compradores que invierten desde cualquier parte del mundo.",
    type: "image",
    path: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    alt: "Marketplace global de propiedades",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18"
        />
      </svg>
    ),
  },
  {
    title: "Verificación y cumplimiento",
    description:
      "Autenticación segura (Google / magic link), roles y permisos (usuario, agente, admin) y preparación para flujos de KYC/AML antes de cerrar una operación.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    title: "Panel para propietarios, agentes y admins",
    description:
      "Gestiona listados, suscripción y leads desde un dashboard; el equipo de Casas Cripto administra usuarios y roles desde un panel admin con control de acceso (RBAC).",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
        />
      </svg>
    ),
  },
  {
    title: "Custodia & smart contracts",
    description:
      "(Roadmap) Depósitos en garantía (escrow) respaldados por contratos inteligentes auditados, para proteger a comprador y vendedor hasta que la operación se cierra.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 1.5c-3.6 2.1-6 2.1-7.5 2.1v8.1c0 5.1 3.6 8.4 7.5 10.8 3.9-2.4 7.5-5.7 7.5-10.8V3.6c-1.5 0-3.9 0-7.5-2.1z"
        />
      </svg>
    ),
  },
  {
    title: "Token $CASA",
    description:
      "(Roadmap) Utilidad futura dentro del ecosistema: descuentos en comisiones, gobernanza y recompensas. Su lanzamiento depende de validación legal — ver sección Token.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

// Accordion accesible y SEO-friendly con el título y descripción (al abrir).
const Item = ({ feature, isOpen, setFeatureSelected }) => {
  const accordion = useRef(null);
  const { title, description, svg } = feature;

  return (
    <li>
      <button
        className="relative flex gap-2 items-center w-full py-5 text-base font-medium text-left md:text-lg"
        onClick={(e) => {
          e.preventDefault();
          setFeatureSelected();
        }}
        aria-expanded={isOpen}
      >
        <span className={`duration-100 ${isOpen ? "text-primary" : ""}`}>
          {svg}
        </span>
        <span
          className={`flex-1 text-base-content ${
            isOpen ? "text-primary font-semibold" : ""
          }`}
        >
          <h3 className="inline">{title}</h3>
        </span>
      </button>

      <div
        ref={accordion}
        className={`transition-all duration-300 ease-in-out text-base-content-secondary overflow-hidden`}
        style={
          isOpen
            ? { maxHeight: accordion?.current?.scrollHeight, opacity: 1 }
            : { maxHeight: 0, opacity: 0 }
        }
      >
        <div className="pb-5 leading-relaxed">{description}</div>
      </div>
    </li>
  );
};

// Muestra la imagen de la característica seleccionada (si tiene).
const Media = ({ feature }) => {
  const { type, path, alt } = feature;
  const style = "rounded-2xl aspect-square w-full sm:w-[26rem]";
  const size = {
    width: 500,
    height: 500,
  };

  if (type === "image") {
    return (
      <Image
        src={path}
        alt={alt}
        className={`${style} object-cover object-center glow-primary`}
        width={size.width}
        height={size.height}
      />
    );
  } else {
    return (
      <div
        className={`${style} glass-card flex items-center justify-center text-5xl`}
      >
        {feature.title === "Custodia & smart contracts"
          ? "🔐"
          : feature.title === "Token $CASA"
          ? "🪙"
          : feature.title.includes("Verificación")
          ? "✅"
          : "📊"}
      </div>
    );
  }
};

// Acordeón de 2 a 6 características. Por defecto, la primera está abierta.
const FeaturesAccordion = () => {
  const [featureSelected, setFeatureSelected] = useState(0);

  return (
    // Sin bg propio: toma el fondo ambiental único de la landing (app/page.js).
    <section
      className="py-24 md:py-32 space-y-24 md:space-y-32 max-w-7xl mx-auto"
      id="features"
    >
      <div className="px-8">
        <h2 className="font-extrabold text-3xl sm:text-4xl lg:text-6xl tracking-tight mb-12 md:mb-24">
          Todo lo que necesitas para operar{" "}
          <span className="inline bg-neutral text-neutral-content px-2 md:px-4 ml-1 md:ml-1.5 leading-relaxed box-decoration-break-clone">
            real estate con cripto
          </span>
        </h2>
        <div className=" flex flex-col md:flex-row gap-12 md:gap-24">
          <div className="grid grid-cols-1 items-stretch gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-20">
            <ul className="w-full">
              {features.map((feature, i) => (
                <Item
                  key={feature.title}
                  index={i}
                  feature={feature}
                  isOpen={featureSelected === i}
                  setFeatureSelected={() => setFeatureSelected(i)}
                />
              ))}
            </ul>

            <Media feature={features[featureSelected]} key={featureSelected} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesAccordion;
