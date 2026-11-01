// Fondo ambiental ÚNICO para TODO el sitio (grid + glows dorado / cian /
// violeta — los 3 colores de marca, a la misma intensidad que el logo).
// `fixed` = no se repite ni se corta por sección o por página: es una sola
// imagen continua detrás de absolutamente todo el contenido.
//
// Se monta UNA sola vez en app/layout.js (detrás de <AppShell/>, que va en
// `relative z-10`), así cada página lo hereda automáticamente sin repetir
// este markup.
//
// ⚠️ A propósito SIN `z-index` negativo: con `position: fixed` +
// `z-index` negativo, Chrome pinta este div por DEBAJO del propio fondo de
// <html>/<body> (un caso límite real del "canvas background" del
// navegador) — eso es lo que causaba un fondo negro tapándolo todo. En vez
// de eso, este div va sin z-index (nivel 0) y el contenido de la app va en
// `relative z-10`: stacking garantizado por CSS normal.
//
// Rendimiento: los glows son radial-gradients (ver `.ambient-blob` en
// globals.css), NO divs sólidos con `blur-[100px]`. Un blur gigante obliga
// al navegador a re-desenfocar toda la capa en cada frame de la animación,
// y eso causaba el parpadeo al recargar + GPU alta en scroll. El gradiente
// se pinta una sola vez y `animate-float` (solo translateY, capa del
// compositor) lo mueve sin repintar: mismo look, costo ~cero.
export default function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden bg-base-100"
    >
      {/* tinte base con los 3 colores de marca, para que SIEMPRE haya algo
          de color visible aunque los blobs queden fuera de un viewport
          muy ancho o muy angosto */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-secondary/12" />
      <div className="absolute inset-0 bg-grid-fade" />

      {/* oro — eco del techo/acento del logo */}
      <div className="ambient-blob ambient-blob-gold -top-52 -left-52 h-[52rem] w-[52rem] animate-float" />
      {/* cian/azul — eco de la casa hexagonal del logo */}
      <div
        className="ambient-blob ambient-blob-cyan -top-18 -right-4 h-[48rem] w-[48rem] animate-float"
        style={{ animationDelay: "1.5s" }}
      />
      {/* violeta — toque Web3/neón */}
      <div
        className="ambient-blob ambient-blob-violet top-[calc(50%-7rem)] -left-44 h-[44rem] w-[44rem] animate-float"
        style={{ animationDelay: "3s" }}
      />
      {/* oro extra a media altura, lado derecho, para que el color no se "acabe" en la mitad de la página */}
      <div
        className="ambient-blob ambient-blob-gold-soft top-[calc(75%-7rem)] -right-8 h-[44rem] w-[44rem] animate-float"
        style={{ animationDelay: "4.5s" }}
      />
    </div>
  );
}
