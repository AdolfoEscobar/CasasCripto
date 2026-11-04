import Image from "next/image";

// Ícono oficial de criptomoneda (BTC, ETH, USDT, USDC). SVGs en
// /public/icons con colores de marca — en dinero, el color oficial
// transmite confianza, no se monocromatizan. Símbolos desconocidos no
// renderizan nada (nunca un placeholder inventado).
const ICONS = {
  BTC: { src: "/icons/btc.svg", name: "Bitcoin" },
  ETH: { src: "/icons/eth.svg", name: "Ethereum" },
  USDT: { src: "/icons/usdt.svg", name: "Tether" },
  USDC: { src: "/icons/usdc.svg", name: "USD Coin" },
};

const CryptoIcon = ({ symbol, size = 16, className = "" }) => {
  const icon = ICONS[(symbol || "").toUpperCase()];
  if (!icon) return null;
  return (
    <Image
      src={icon.src}
      alt={icon.name}
      title={icon.name}
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
    />
  );
};

export default CryptoIcon;
