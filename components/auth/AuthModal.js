"use client";

import { Suspense } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { useAuthModal, AuthModalUrlTrigger } from "./AuthModalContext";
import SignInCard from "./SignInCard";

// Modal global de login — la única UI de login de la app. Se abre desde
// cualquier página sin navegar (ver useAuthModal / requestAuthModal, o con
// ?auth=signin en la URL para los redirects de servidor). Los casos borde
// de NextAuth (OAuth denegado, magic link vencido) caen en app/auth/error,
// que ofrece reintentar abriendo este modal.
const AuthModal = () => {
  const { isOpen, closeAuthModal, callbackUrl } = useAuthModal();

  return (
    <>
    <Suspense fallback={null}>
      <AuthModalUrlTrigger />
    </Suspense>
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-[70]"
        onClose={closeAuthModal}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {/* Sin desenfoque en el overlay en móvil: uno a pantalla completa
              sobre una página ya pesada (blobs gigantes + barras sticky con
              desenfoque) congela el compositor de iOS WebKit a mitad de la
              transición y la página queda muerta. En sm+ se mantiene. */}
          <div
            aria-hidden="true"
            className="fixed inset-0 bg-black/60 sm:backdrop-blur-sm"
            onClick={closeAuthModal}
          />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          {/* `m-auto` en el panel (no items/justify-center): con contenido
              más alto que el viewport (ej. iPhone en horizontal) el
              centrado flex recorta la parte superior sin forma de verla. */}
          <div className="flex min-h-full p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              {/* Panel transparente: la tarjeta visual la pinta el propio
                  SignInCard (sólida en móvil, glass en sm+). */}
              <Dialog.Panel className="relative m-auto w-full max-w-md transform transition-all">
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
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
    </>
  );
};

export default AuthModal;
