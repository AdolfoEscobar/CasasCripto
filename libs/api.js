import axios from "axios";
import { toast } from "react-hot-toast";
import { signIn } from "next-auth/react";
import config from "@/config";

// use this to interact with our own API (/app/api folder) from the front-end side
// See https://shipfa.st/docs/tutorials/api-call
const apiClient = axios.create({
  baseURL: "/api",
});

apiClient.interceptors.response.use(
  function (response) {
    return response.data;
  },
  function (error) {
    let message = "";

    if (error.response?.status === 401) {
      // User not auth, ask to re login
      toast.error("Inicia sesión para continuar");
      // automatically redirect to /dashboard page after login
      return signIn(undefined, { callbackUrl: config.auth.callbackUrl });
    } else if (error.response?.status === 403) {
      // User not authorized, must subscribe/purchase/pick a plan
      message = "Elige un plan para usar esta función";
    } else {
      message =
        error?.response?.data?.error || error.message || error.toString();
    }

    error.message =
      typeof message === "string" ? message : JSON.stringify(message);

    // Solo los fallos inesperados (500s o sin respuesta del servidor) van a
    // console.error: Next 16 convierte cada uno en un "issue" del dev
    // overlay. Los errores de negocio esperados (400/403/404/409/422/429)
    // ya se informan con el toast — registrarlos como error solo entierra
    // los bugs reales entre ruido.
    const status = error.response?.status;
    if (!error.response || status >= 500) {
      console.error(error.message);
    }

    // Automatically display errors to the user
    if (error.message) {
      toast.error(error.message, { duration: 4500 });
    } else {
      toast.error("Algo salió mal...", { duration: 4500 });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
