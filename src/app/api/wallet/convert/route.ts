// app/api/wallet/convert/route.ts
import { NextRequest, NextResponse } from "next/server";
import { addressToBech32, deserializeAddress } from "@meshsdk/core-cst";

export async function POST(request: NextRequest) {
  try {
    // Parse the JSON body
    const body = await request.json();
    const { paymentHexAddress, rewardHexAddress, networkId } = body;

    // Validate input
    if (!paymentHexAddress && !rewardHexAddress) {
      return NextResponse.json(
        {
          error:
            "Invalid input. Expected at least one of paymentHexAddress or rewardHexAddress.",
        },
        { status: 400 }
      );
    }

    // Convert networkId (0 or 1) to network string ('testnet' or 'mainnet')
    // Default to mainnet (1) if not specified
    const numericNetworkId = networkId !== undefined ? Number(networkId) : 1;
    const addressNetwork = numericNetworkId === 0 ? "testnet" : "mainnet";

    // Process results object
    const results = {};

    // Process payment address if provided
    if (paymentHexAddress) {
      try {
        const deserializedAddress = deserializeAddress(paymentHexAddress);
        results.paymentAddress = addressToBech32(
          deserializedAddress,
          addressNetwork
        );
      } catch (err) {
        console.error(
          `Error processing payment address ${paymentHexAddress}:`,
          err
        );
        results.paymentAddressError =
          err instanceof Error ? err.message : "Unknown error";
      }
    }

    // Process reward address if provided
    if (rewardHexAddress) {
      try {
        const deserializedAddress = deserializeAddress(rewardHexAddress);
        results.rewardAddress = addressToBech32(
          deserializedAddress,
          addressNetwork
        );
      } catch (err) {
        console.error(
          `Error processing reward address ${rewardHexAddress}:`,
          err
        );
        results.rewardAddressError =
          err instanceof Error ? err.message : "Unknown error";
      }
    }

    // Include network information in the response
    results.networkId = numericNetworkId;
    results.network = addressNetwork;

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error processing addresses:", error);
    return NextResponse.json(
      {
        error: "Failed to process addresses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
