import { ethers } from "ethers";

const RPC_URL = "https://dream-rpc.somnia.network";
const CONTRACT_ADDRESS = "0xDB4e0A5E7b0d03aA41cBB7940c5e9Bab06cc7157";
const CONTRACT_ABI = [
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "reverseLookup",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  }
];

const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

export async function getPrimarySomName(walletAddress: string): Promise<string | null> {
  try {
    const name = await contract.reverseLookup(walletAddress);
    return name;
  } catch (err) {
    console.error("Somnia name lookup failed:", err);
    return null;
  }
}