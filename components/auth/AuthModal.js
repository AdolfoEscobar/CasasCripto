"use client";

import { Suspense } from "react";
import { Dialog } from "@headlessui/react";
import { useAuthModal, AuthModalUrlTrigger } from "./AuthModalContext";
import SignInCard from "./SignInCard";

// Modal global de login — la única UI de login de la app. Se abre desde
// cualquier página sin navegar (ver useAuthModal / requestAuthModal, o con
// ?auth=signin en la URL para los redirects de servidor). Los casos borde
// de NextAuth (OAuth denegado, magic link vencido) caen en app/auth/error,
// que ofrece reintentar abriendo este modal.
//
// A propósito SIN animaciones ni desenfoques: sin Transition de entrada/
// salida, sin backdrop-blur en overlay ni tarjeta, sin glows. En iPhones
// con poca capacidad (11 Pro Max y similares) el compositor de WebKit se
// congela con blurs a pantalla completa + transiciones, y el modal abría
// trabado o dejaba la página muerta. Abre/cierra instantáneo.
const AuthModal = () => {
  const { isOpen, closeAuthModal, callbackUrl } = useAuthModal();

  return (
    <>
      <Suspense fallback={null}>
        <AuthModalUrlTrigger />
      </Suspense>
      {isOpen && (
        <Dialog
          as="div"
          className="relative z-[70]"
          open={isOpen}
          onClose={closeAuthModal}
        >
          <div
            aria-hidden="true"
            className="fixed inset-0 bg-black/60"
            onClick={closeAuthModal}
          />

          <div className="fixed inset-0 overflow-y-auto">
            {/* `m-auto` en el panel (no items/justify-center): con contenido
                más alto que el viewport (ej. iPhone en horizontal) el
                centrado flex recorta la parte superior sin forma de verla. */}
            <div className="flex min-h-full p-4">
              <Dialog.Panel className="relative m-auto w-full max-w-md">
                <Dialog.Title className="sr-only">
                  Iniciar sesión o crear cuenta
                </Dialog.Title>
                <Suspense fallback={null}>
                  <SignInCard
                    initialCallbackUrl={callbackUrl}
                    onClose={closeAuthModal}
                  />
                </Suspense>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
};

export default AuthModal;
