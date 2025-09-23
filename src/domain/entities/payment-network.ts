import { z } from 'zod';

export const PaymentNetworkSchema = z.object({
  networkId: z.string(),
  networkName: z.string(),
  accountNumber: z.string(),
  routingNumber: z.string().optional(),
});

export const PaymentNetworksResponseSchema = z.object({
  paymentNetworks: z.array(PaymentNetworkSchema),
});

export type PaymentNetwork = z.infer<typeof PaymentNetworkSchema>;
export type PaymentNetworksResponse = z.infer<typeof PaymentNetworksResponseSchema>;
