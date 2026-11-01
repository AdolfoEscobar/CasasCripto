"use client";

import { Suspense } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { useAuthModal } from "./AuthModalContext";
import SignInCard from "./SignInCard";

// Modal global de login: se abre desde cualquier página sin navegar (ver
// useAuthModal / requestAuthModal). Reutiliza el mismo <SignInCard/> de la
// página /signin para no duplicar la lógica de Google + magic link.
// La página /signin sigue existiendo como fallback (visitas directas,
// callbacks de OAuth con error, SEO).
const AuthModal = () => {
  const { isOpen, closeAuthModal, callbackUrl } = useAuthModal();

  return (
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
          <div
            aria-hidden="true"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeAuthModal}
          />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
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
                  SignInCard (glass-card), igual que en /signin. */}
              <Dialog.Panel className="relative w-full max-w-md transform transition-all">
                <Dialog.Title className="sr-only">
                  Iniciar sesión o crear cuenta
                </Dialog.Title>
                <Suspense fallback={null}>
                  <SignInCard
                    variant="modal"
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
  );
};

export default AuthModal;
