import Image from "next/image";
import fox from "@/app/MetaMask_Fox.svg.webp";

// Logotipo oficial de MetaMask (el zorro) para los botones de conexión e
// instalación. El asset vive en app/ con fondo negro de origen: se muestra
// con radio pequeño, no circular (el recorte circular le comería las
// orejas). Si se reemplaza por un PNG transparente con el mismo nombre,
// este componente sigue funcionando igual.
const MetaMaskIcon = ({ size = 20, className = "" }) => {
  return (
    <Image
      src={fox}
      alt="MetaMask"
      title="MetaMask"
      width={size}
      height={size}
      className={`shrink-0 rounded-[4px] ${className}`}
    />
  );
};

export default MetaMaskIcon;
