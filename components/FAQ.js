"use client";

import { useRef, useState } from "react";
import config from "@/config";

// <FAQ> es una lista de <Item>. Agrega o edita preguntas aquí.
const faqList = [
  {
    question: "¿Casas Cripto ya tiene propiedades reales listadas?",
    answer: (
      <p>
        Hoy estamos en fase MVP: la plataforma de autenticación, suscripciones
        y panel administrativo ya funciona, pero el marketplace de
        propiedades (publicar, buscar y comprar un inmueble) está en
        construcción activa. Únete a la lista de espera para ser de los
        primeros en usarlo.
      </p>
    ),
  },
  {
    question: "¿Cómo funciona el pago en criptomonedas?",
    answer: (
      <p>
        El checkout acepta USDC, USDT, BTC y ETH. Hoy el procesamiento de
        pagos de suscripción y donaciones corre sobre Stripe; la integración
        de wallets on-chain para el cierre completo de operaciones
        inmobiliarias forma parte de nuestro roadmap de producto.
      </p>
    ),
  },
  {
    question: "¿Esto es una oferta de inversión o de valores?",
    answer: (
      <p>
        No. Las suscripciones y donaciones de este sitio son pagos de
        producto o apoyo voluntario, no instrumentos financieros. Cualquier
        futura ronda de inversión formal se comunicará y ejecutará conforme a
        la regulación aplicable, con la documentación legal correspondiente.
      </p>
    ),
  },
  {
    question: `¿Qué es el token ${config.token.ticker} y cuándo lanza?`,
    answer: (
      <p>
        {config.token.ticker} es un token de utilidad en diseño (
        {config.token.status.toLowerCase()}). No existe hoy, no se vende ni se
        pre-vende en este sitio. Puedes ver el roadmap completo en la sección{" "}
        <a href="#token" className="link link-primary">
          Token
        </a>
        .
      </p>
    ),
  },
  {
    question: "¿Cómo puedo invertir en Casas Cripto como fondo o ángel?",
    answer: (
      <p>
        Escríbenos a{" "}
        <a
          href={`mailto:${config.investors.contactEmail}`}
          className="link link-primary"
        >
          {config.investors.contactEmail}
        </a>{" "}
        o déjanos tu email en la sección{" "}
        <a href="#invertir" className="link link-primary">
          Invierte
        </a>
        . Te compartiremos el pitch deck y nuestras métricas.
      </p>
    ),
  },
  {
    question: "¿Cómo protegen mis fondos y mis datos?",
    answer: (
      <p>
        La autenticación corre sobre NextAuth con proveedores verificados
        (Google / magic link), los pagos sobre Stripe (PCI-DSS) y los datos en
        MongoDB con acceso restringido por roles. La custodia on-chain con
        contratos inteligentes y escrow forma parte del roadmap de seguridad.
      </p>
    ),
  },
];

const Item = ({ item }) => {
  const accordion = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li>
      <button
        className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
      >
        <span
          className={`flex-1 text-base-content ${isOpen ? "text-primary" : ""}`}
        >
          {item?.question}
        </span>
        <svg
          className={`flex-shrink-0 w-4 h-4 ml-auto fill-current`}
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center transition duration-200 ease-out ${
              isOpen && "rotate-180"
            }`}
          />
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center rotate-90 transition duration-200 ease-out ${
              isOpen && "rotate-180 hidden"
            }`}
          />
        </svg>
      </button>

      <div
        ref={accordion}
        className={`transition-all duration-300 ease-in-out opacity-80 overflow-hidden`}
        style={
          isOpen
            ? { maxHeight: accordion?.current?.scrollHeight, opacity: 1 }
            : { maxHeight: 0, opacity: 0 }
        }
      >
        <div className="pb-5 leading-relaxed">{item?.answer}</div>
      </div>
    </li>
  );
};

const FAQ = () => {
  return (
    // Sin bg propio: toma el fondo ambiental único de la landing (app/page.js).
    <section id="faq" className="scroll-mt-20">
      <div className="py-24 px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
        <div className="flex flex-col text-left basis-1/2">
          <p className="inline-block font-semibold text-primary mb-4">FAQ</p>
          <p className="sm:text-4xl text-3xl font-extrabold text-base-content">
            Preguntas frecuentes
          </p>
        </div>

        <ul className="basis-1/2">
          {faqList.map((item, i) => (
            <Item key={i} item={item} />
          ))}
        </ul>
      </div>
    </section>
  );
};

export default FAQ;
