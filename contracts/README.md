# CasasEscrow — contrato de escrow no-custodial

`src/CasasEscrow.sol`: el comprador deposita ETH o ERC-20 (USDC/USDT) y los
fondos se liberan al vendedor por **aprobación mutua** o **decisión del
árbitro** (wallet admin), con **comisión 1.5 %** descontada al liberar.
Vencido el deadline, **cualquiera** puede disparar el reembolso al comprador.
Construido sobre OpenZeppelin Contracts 5.x (`AccessControl`,
`ReentrancyGuard`, `Pausable`).

`src/MockToken.sol`: stablecoin falsa de 6 decimales con faucet, **solo
testnet**, para probar `depositToken` en Sepolia.

## Comandos

```bash
cd contracts
forge build        # compila (solc 0.8.24, ver foundry.toml)
forge test         # suite de tests (test/CasasEscrow.t.sol)
forge test -vvv    # con trazas si algo falla
```

Primera vez: `forge install` (clona OZ + forge-std a `lib/`).

## Deploy a Sepolia

```bash
# 1. Compila
cd contracts && forge build

# 2. Despliega (deployer con ETH de Sepolia en la llave)
SEPOLIA_RPC_URL=... DEPLOYER_PRIVATE_KEY=0x... \
ARBITER_ADDRESS=0x... FEE_RECIPIENT=0x... \
node scripts/escrow-deploy.mjs sepolia

# 3. Pon las direcciones impresas en .env.local / Vercel:
# NEXT_PUBLIC_ESCROW_SEPOLIA, NEXT_PUBLIC_SEPOLIA_USDC,
# NEXT_PUBLIC_SEPOLIA_USDT, NEXT_PUBLIC_ARBITER_ADDRESS
# y en servidor: SEPOLIA_RPC_URL, ARBITER_PRIVATE_KEY
```

El deployer conserva `DEFAULT_ADMIN_ROLE` (rotar árbitro/feeRecipient).
Antes de mainnet, transfiérelo a un multisig.

## Gates humanos antes de mainnet (NO omitir)

1. **Auditoría externa** del contrato sin hallazgos críticos abiertos.
2. **Revisión legal**: intermediación de fondos, KYC/AML, términos del escrow.
3. **Signer seguro**: la llave del árbitro NO vive en env plano (KMS/multisig).
4. Verificar direcciones de USDC/USDT en Etherscan y `forge test` en verde.
5. Deploy con `ESCROW_MAINNET_LIVE=true` + `NEXT_PUBLIC_ESCROW_MAINNET`, con
   monto tope inicial y `pause()` probada.

El backend bloquea mainnet sin `ESCROW_MAINNET_LIVE=true` (libs/escrowServer.js)
y el deploy script exige el mismo flag.
