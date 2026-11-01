// Acordeón de FAQs 100% server-rendered (<details>/<summary>, sin JS): el
// contenido queda en el HTML que ve Google. Gemelo obligatorio del schema
// FAQPage (libs/seo.js `renderFaqSchema`) — las FAQs solo generan rich
// results si también están visibles en la página.
const FaqAccordion = ({ faqs, heading = "Preguntas frecuentes" }) => {
  if (!faqs?.length) return null;
  return (
    <section className="max-w-3xl mx-auto mt-16 md:mt-20">
      <h2 className="font-extrabold text-2xl sm:text-3xl tracking-tight text-center mb-6">
        {heading}
      </h2>
      <div className="flex flex-col gap-3">
        {faqs.map((faq, i) => (
          <details
            key={i}
            className="collapse collapse-arrow glass-card rounded-xl"
            {...(i === 0 ? { open: true } : {})}
          >
            <summary className="collapse-title font-semibold text-left">
              {faq.q}
            </summary>
            <div className="collapse-content text-left">
              <p className="opacity-80 leading-relaxed">{faq.a}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
};

export default FaqAccordion;
