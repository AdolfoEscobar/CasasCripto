"use client";

import { useRef, useState } from "react";
import config from "@/config";

// <FAQ> es una lista de <Item>. Agrega o edita preguntas aquí.
const faqList = [
  {
    question: "¿Ya puedo publicar o buscar propiedades?",
    answer: (
      <p>
        Sí. El directorio está en vivo: puedes{" "}
        <a href="/propiedades" className="link link-primary">
          buscar propiedades
        </a>{" "}
        y publicar la tuya gratis desde tu panel. Cada ficha pasa por
        revisión manual antes de publicarse.
      </p>
    ),
  },
  {
    question: "¿Cómo funciona el pago en criptomonedas?",
    answer: (
      <p>
        Cada ficha indica qué criptomonedas acepta el propietario (USDC,
        USDT, BTC o ETH). Casas Cripto conecta a ambas partes y acompaña el
        cierre; los pagos de suscripción y donaciones se procesan con
        Stripe. La liquidación on-chain automatizada forma parte del
        roadmap.
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
        La autenticación usa proveedores verificados (Google / magic link),
        los pagos corren sobre Stripe (PCI-DSS) y los datos tienen acceso
        restringido por roles. En el MVP no custodiamos fondos: el cierre en
        cripto se acompaña caso por caso, y la custodia on-chain con
        contratos auditados forma parte del roadmap.
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
    // Sin bg propio: toma el fondo ambiental único de la landing.
    <section id="faq" className="scroll-mt-20 border-t border-base-content/10">
      <div className="py-20 md:py-28 px-5 sm:px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-10 md:gap-12">
        <div className="flex flex-col text-left basis-1/2">
          <p className="inline-block text-sm font-semibold text-primary mb-3">
            FAQ
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-base-content tracking-tight">
            Preguntas frecuentes
          </h2>
          <p className="opacity-70 leading-relaxed mt-4 max-w-md">
            ¿Otra duda? Escríbenos a{" "}
            <a
              href={`mailto:${config.resend.supportEmail}`}
              className="link link-primary"
            >
              {config.resend.supportEmail}
            </a>
            .
          </p>
        </div>

        <ul className="basis-1/2 border-b border-base-content/10">
          {faqList.map((item, i) => (
            <Item key={i} item={item} />
          ))}
        </ul>
      </div>
    </section>
  );
};

export default FAQ;
