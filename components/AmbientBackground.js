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
export default function AmbientBackground() {
  return (
    <div aria-hidden="true" className="fixed inset-0 bg-base-100">
      {/* tinte base con los 3 colores de marca, para que SIEMPRE haya algo
          de color visible aunque los blobs queden fuera de un viewport
          muy ancho o muy angosto */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-secondary/12" />
      <div className="absolute inset-0 bg-grid-fade" />

      {/* oro — eco del techo/acento del logo */}
      <div className="absolute -top-20 -left-20 w-[36rem] h-[36rem] rounded-full bg-primary/45 blur-[100px] animate-float" />
      {/* cian/azul — eco de la casa hexagonal del logo */}
      <div
        className="absolute top-10 -right-24 w-[34rem] h-[34rem] rounded-full bg-secondary/40 blur-[100px] animate-float"
        style={{ animationDelay: "1.5s" }}
      />
      {/* violeta — toque Web3/neón */}
      <div
        className="absolute top-[50%] -left-16 w-[30rem] h-[30rem] rounded-full bg-accent/35 blur-[100px] animate-float"
        style={{ animationDelay: "3s" }}
      />
      {/* oro extra a media altura, lado derecho, para que el color no se "acabe" en la mitad de la página */}
      <div
        className="absolute top-[75%] -right-20 w-[30rem] h-[30rem] rounded-full bg-primary/35 blur-[100px] animate-float"
        style={{ animationDelay: "4.5s" }}
      />
    </div>
  );
}
