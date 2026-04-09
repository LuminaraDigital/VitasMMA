import { Address, beginCell, toNano } from '@ton/core';
import { TonClient } from '@ton/ton';

const USDT_MASTER = Address.parse('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs');
export const DESTINATION_ADDRESS = import.meta.env.VITE_TON_DESTINATION_ADDRESS || 'UQC2rrXgl2W5GhkSJ7lpoUAUXsBsDLNI4CXXUDqEdtCZ176T';

const client = new TonClient({
  endpoint: 'https://toncenter.com/api/v2/jsonRPC',
});

export async function getUsdtTransaction(userAddressStr: string, usdtAmount: number) {
  const userAddress = Address.parse(userAddressStr);
  
  const response = await client.runMethod(USDT_MASTER, 'get_wallet_address', [
    { type: 'slice', cell: beginCell().storeAddress(userAddress).endCell() }
  ]);
  const userUsdtWallet = response.stack.readAddress();

  const usdtAmountNano = Math.floor(usdtAmount * 1_000_000); // 6 decimals
  const destAddress = Address.parse(DESTINATION_ADDRESS);
  
  const payload = beginCell()
    .storeUint(0xf8a7ea5, 32) // op
    .storeUint(0, 64) // query_id
    .storeCoins(usdtAmountNano) // amount
    .storeAddress(destAddress) // destination
    .storeAddress(userAddress) // response_destination
    .storeBit(0) // custom_payload (null)
    .storeCoins(0) // forward_ton_amount
    .storeBit(0) // forward_payload (empty)
    .endCell();

  return {
    validUntil: Math.floor(Date.now() / 1000) + 600,
    messages: [
      {
        address: userUsdtWallet.toString(),
        amount: toNano('0.05').toString(), // 0.05 TON for gas
        payload: payload.toBoc().toString('base64'),
      }
    ]
  };
}
