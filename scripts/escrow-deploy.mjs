// scripts/escrow-deploy.mjs — despliega CasasEscrow (+ mocks USDC/USDT en
// testnet) con viem. Uso:
//
//   SEPOLIA_RPC_URL=... DEPLOYER_PRIVATE_KEY=0x... \
//   ARBITER_ADDRESS=0x... FEE_RECIPIENT=0x... \
//   node scripts/escrow-deploy.mjs sepolia
//
// Requiere haber compilado antes: `cd contracts && forge build` (los
// artefactos salen a contracts/out). Imprime las direcciones para ponerlas
// en .env.local / Vercel. NUNCA commitees llaves: solo env vars.
//
// Solo testnet en v1: mainnet exige ESCROW_MAINNET_LIVE=true + auditoría +
// legal (ver contracts/README.md).
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, mainnet } from "viem/chains";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../contracts/out");

const network = process.argv[2] || "sepolia";
if (!["sepolia", "mainnet"].includes(network)) {
  console.error("Uso: node scripts/escrow-deploy.mjs <sepolia|mainnet>");
  process.exit(1);
}
if (network === "mainnet" && process.env.ESCROW_MAINNET_LIVE !== "true") {
  console.error(
    "Mainnet bloqueado: completa auditoría + legal y pon ESCROW_MAINNET_LIVE=true."
  );
  process.exit(1);
}

const chain = network === "mainnet" ? mainnet : sepolia;
const rpcUrl =
  network === "mainnet"
    ? process.env.ETH_RPC_URL
    : process.env.SEPOLIA_RPC_URL;
const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
const arbiter = process.env.ARBITER_ADDRESS;
const feeRecipient = process.env.FEE_RECIPIENT || arbiter;

if (!rpcUrl || !deployerKey || !arbiter || !feeRecipient) {
  console.error(
    "Faltan env vars: SEPOLIA_RPC_URL|ETH_RPC_URL, DEPLOYER_PRIVATE_KEY, ARBITER_ADDRESS, FEE_RECIPIENT(opcional)."
  );
  process.exit(1);
}

function artifact(contractFile, contractName) {
  const path = resolve(outDir, contractFile, `${contractName}.json`);
  if (!existsSync(path)) {
    console.error(`Falta artefacto ${path}. Corre antes: cd contracts && forge build`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

const account = privateKeyToAccount(deployerKey);
const wallet = createWalletClient({ account, chain, transport: http(rpcUrl) });
const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });

console.log(`Deployer: ${account.address} · red: ${chain.name}`);

// 1. CasasEscrow(admin=deployer, arbiter, feeRecipient). El deployer conserva
// DEFAULT_ADMIN_ROLE para rotar árbitro/feeRecipient; considera transferirlo
// a un multisig antes de mainnet.
const escrowArtifact = artifact("CasasEscrow.sol", "CasasEscrow");
const escrowHash = await wallet.deployContract({
  abi: escrowArtifact.abi,
  bytecode: escrowArtifact.bytecode.object,
  args: [account.address, arbiter, feeRecipient],
});
const escrowReceipt = await publicClient.waitForTransactionReceipt({
  hash: escrowHash,
});
console.log(`CasasEscrow: ${escrowReceipt.contractAddress}`);

// 2. En testnet, mocks de USDC/USDT (6 decimales) para probar depositToken.
// En mainnet se usan los reales (ver libs/chains.js) y este paso se omite.
if (network === "sepolia") {
  const mockArtifact = artifact("MockToken.sol", "MockToken");
  for (const symbol of ["mUSDC", "mUSDT"]) {
    const hash = await wallet.deployContract({
      abi: mockArtifact.abi,
      bytecode: mockArtifact.bytecode.object,
      args: [symbol === "mUSDC" ? "Mock USD Coin" : "Mock Tether", symbol],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`${symbol}: ${receipt.contractAddress}`);
  }
  console.log(
    "\nPon en env: NEXT_PUBLIC_ESCROW_SEPOLIA=<escrow> NEXT_PUBLIC_SEPOLIA_USDC=<mUSDC> NEXT_PUBLIC_SEPOLIA_USDT=<mUSDT> NEXT_PUBLIC_ARBITER_ADDRESS=<arbiter>"
  );
} else {
  console.log("\nPon en env: NEXT_PUBLIC_ESCROW_MAINNET=<escrow>");
}
