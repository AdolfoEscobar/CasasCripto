// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Escrow no-custodial de Casas Cripto: el comprador deposita ETH o ERC-20
// (USDC/USDT) y los fondos se liberan al vendedor por aprobación mutua, por
// decisión del árbitro, o vuelven al comprador por timeout/reembolso.
// Decisiones de producto: árbitro = wallet admin, comisión 1.5 % al vendedor
// (descontada al liberar), depósito con deadline y reembolso permissionless
// tras vencer. La plataforma NUNCA custodia fondos fuera de este contrato.
//
// Beta: desplegar en Sepolia hasta pasar auditoría externa + revisión legal
// (ver contracts/README.md). Mainnet solo con dirección configurada.
contract CasasEscrow is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ARBITER_ROLE = keccak256("ARBITER_ROLE");

    // Comisión de la plataforma sobre cada liberación: 1.5 % al vendedor.
    uint256 public constant FEE_BPS = 150;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    address public feeRecipient;

    enum State {
        None, // no existe
        Created, // aceptado off-chain, esperando depósito
        Funded, // depositado, esperando liberación
        Released, // liberado al vendedor (terminal)
        Refunded, // devuelto al comprador (terminal)
        Cancelled // cancelado sin fondos (terminal)

    }

    struct Deal {
        address buyer;
        address seller;
        // address(0) = ETH nativo; otro valor = contrato ERC-20.
        address token;
        uint256 amount;
        uint256 deadline;
        State state;
        bool buyerApproved;
        bool sellerApproved;
    }

    mapping(bytes32 => Deal) private _deals;

    event DealCreated(
        bytes32 indexed id,
        address indexed buyer,
        address indexed seller,
        address token,
        uint256 amount,
        uint256 deadline
    );
    event Funded(bytes32 indexed id, address indexed buyer);
    event ReleaseApproved(bytes32 indexed id, address indexed approver);
    event Released(
        bytes32 indexed id,
        address indexed seller,
        uint256 net,
        uint256 fee
    );
    event Refunded(bytes32 indexed id, address indexed buyer, uint256 amount);
    event Cancelled(bytes32 indexed id);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed recipient);

    constructor(address admin, address arbiter, address feeRecipient_) {
        require(admin != address(0), "admin=0");
        require(arbiter != address(0), "arbiter=0");
        require(feeRecipient_ != address(0), "feeRecipient=0");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ARBITER_ROLE, arbiter);
        feeRecipient = feeRecipient_;
    }

    // --- Administración ---

    function setFeeRecipient(
        address recipient
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(recipient != address(0), "feeRecipient=0");
        address old = feeRecipient;
        feeRecipient = recipient;
        emit FeeRecipientUpdated(old, recipient);
    }

    function pause() external onlyRole(ARBITER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ARBITER_ROLE) {
        _unpause();
    }

    // --- Ciclo del deal ---

    // El backend (llave del árbitro, testnet) espeja el deal aceptado
    // off-chain. id = keccak256(dealId de Mongo), único por deal.
    function createDeal(
        bytes32 id,
        address buyer,
        address seller,
        address token,
        uint256 amount,
        uint256 deadline
    ) external onlyRole(ARBITER_ROLE) whenNotPaused {
        require(id != bytes32(0), "id=0");
        require(buyer != address(0) && seller != address(0), "party=0");
        require(buyer != seller, "self-deal");
        require(amount > 0, "amount=0");
        require(deadline > block.timestamp, "deadline past");
        require(_deals[id].state == State.None, "exists");

        _deals[id] = Deal({
            buyer: buyer,
            seller: seller,
            token: token,
            amount: amount,
            deadline: deadline,
            state: State.Created,
            buyerApproved: false,
            sellerApproved: false
        });
        emit DealCreated(id, buyer, seller, token, amount, deadline);
    }

    // Depósito exacto en ETH. Solo el comprador, solo antes del deadline.
    function depositETH(bytes32 id) external payable nonReentrant whenNotPaused {
        Deal storage d = _deals[id];
        require(d.state == State.Created, "not open");
        require(msg.sender == d.buyer, "not buyer");
        require(d.token == address(0), "not ETH deal");
        require(block.timestamp <= d.deadline, "expired");
        require(msg.value == d.amount, "wrong amount");
        d.state = State.Funded;
        emit Funded(id, msg.sender);
    }

    // Depósito exacto en ERC-20. El comprador debe aprobar al escrow antes
    // (approve). Solo antes del deadline.
    function depositToken(bytes32 id) external nonReentrant whenNotPaused {
        Deal storage d = _deals[id];
        require(d.state == State.Created, "not open");
        require(msg.sender == d.buyer, "not buyer");
        require(d.token != address(0), "not token deal");
        require(block.timestamp <= d.deadline, "expired");
        require(
            IERC20(d.token).transferFrom(msg.sender, address(this), d.amount),
            "transferFrom failed"
        );
        d.state = State.Funded;
        emit Funded(id, msg.sender);
    }

    // Aprobación de liberación por comprador o vendedor. Con las dos, libera.
    function approveRelease(bytes32 id) external nonReentrant whenNotPaused {
        Deal storage d = _deals[id];
        require(d.state == State.Funded, "not funded");
        require(
            msg.sender == d.buyer || msg.sender == d.seller,
            "not a party"
        );
        if (msg.sender == d.buyer) d.buyerApproved = true;
        else d.sellerApproved = true;
        emit ReleaseApproved(id, msg.sender);
        if (d.buyerApproved && d.sellerApproved) _release(id, d);
    }

    // El árbitro libera al vendedor (resuelve a su favor).
    function arbiterRelease(
        bytes32 id
    ) external onlyRole(ARBITER_ROLE) nonReentrant whenNotPaused {
        Deal storage d = _deals[id];
        require(d.state == State.Funded, "not funded");
        _release(id, d);
    }

    // El árbitro devuelve al comprador. Funciona aun en pausa: es salida.
    function arbiterRefund(
        bytes32 id
    ) external onlyRole(ARBITER_ROLE) nonReentrant {
        Deal storage d = _deals[id];
        require(d.state == State.Funded, "not funded");
        _refund(id, d);
    }

    // Reembolso permissionless tras vencer el deadline. Sin gate de pausa:
    // nadie debe poder atrapar fondos pausando.
    function refund(bytes32 id) external nonReentrant {
        Deal storage d = _deals[id];
        require(d.state == State.Funded, "not funded");
        require(block.timestamp > d.deadline, "not expired");
        _refund(id, d);
    }

    // Cancela un deal creado pero nunca fondeado (no mueve fondos).
    function cancel(bytes32 id) external {
        Deal storage d = _deals[id];
        require(d.state == State.Created, "not open");
        require(
            msg.sender == d.buyer ||
                msg.sender == d.seller ||
                hasRole(ARBITER_ROLE, msg.sender),
            "not allowed"
        );
        d.state = State.Cancelled;
        emit Cancelled(id);
    }

    // --- Internos (checks-effects-interactions + nonReentrant) ---

    function _release(bytes32 id, Deal storage d) internal {
        d.state = State.Released;
        uint256 fee = (d.amount * FEE_BPS) / BPS_DENOMINATOR;
        uint256 net = d.amount - fee;
        _payout(d.token, feeRecipient, fee);
        _payout(d.token, d.seller, net);
        emit Released(id, d.seller, net, fee);
    }

    function _refund(bytes32 id, Deal storage d) internal {
        d.state = State.Refunded;
        _payout(d.token, d.buyer, d.amount);
        emit Refunded(id, d.buyer, d.amount);
    }

    function _payout(address token, address to, uint256 value) internal {
        if (value == 0) return;
        if (token == address(0)) {
            (bool ok, ) = to.call{value: value}("");
            require(ok, "ETH payout failed");
        } else {
            require(IERC20(token).transfer(to, value), "token payout failed");
        }
    }

    function getDeal(bytes32 id) external view returns (Deal memory) {
        return _deals[id];
    }
}
