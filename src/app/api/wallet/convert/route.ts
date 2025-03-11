// app/api/wallet/convert/route.ts
import { NextRequest, NextResponse } from "next/server";
import { addressToBech32, deserializeAddress } from "@meshsdk/core-cst";

// Improved CORS headers - more permissive for local development
// Simple CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function POST(request: NextRequest) {
  // Check for preflight request and handle it immediately
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Always return CORS headers for POST requests
  const headers = {
    "Content-Type": "application/json",
    ...corsHeaders,
  };

  try {
    // Parse the JSON body
    const body = await request.json();
    const { paymentHexAddress, rewardHexAddress, networkId } = body;

    console.log("Received conversion request:", {
      paymentHexAddress: paymentHexAddress
        ? `${paymentHexAddress.substring(0, 10)}...`
        : undefined,
      rewardHexAddress: rewardHexAddress
        ? `${rewardHexAddress.substring(0, 10)}...`
        : undefined,
      networkId,
    });

    // Validate input
    if (!paymentHexAddress && !rewardHexAddress) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid input. Expected at least one of paymentHexAddress or rewardHexAddress.",
        },
        { status: 400, headers }
      );
    }

    // Convert networkId (0 or 1) to network string ('testnet' or 'mainnet')
    // Default to mainnet (1) if not specified
    const numericNetworkId = networkId !== undefined ? Number(networkId) : 1;
    const addressNetwork = numericNetworkId === 0 ? "testnet" : "mainnet";

    // Process results object
    const results: any = {
      success: true,
      networkId: numericNetworkId,
      network: addressNetwork,
    };

    // Process payment address if provided
    if (paymentHexAddress) {
      try {
        const deserializedAddress = deserializeAddress(paymentHexAddress);
        results.paymentAddress = addressToBech32(
          deserializedAddress,
          addressNetwork
        );
        console.log("Converted payment address successfully");
      } catch (err) {
        console.error(
          `Error processing payment address ${paymentHexAddress.substring(
            0,
            10
          )}...:`,
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
        console.log("Converted reward address successfully");
      } catch (err) {
        console.error(
          `Error processing reward address ${rewardHexAddress.substring(
            0,
            10
          )}...:`,
          err
        );
        results.rewardAddressError =
          err instanceof Error ? err.message : "Unknown error";
      }
    }

    return NextResponse.json(results, { status: 200, headers });
  } catch (error) {
    console.error("Error processing addresses:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process addresses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers }
    );
  }
}

// Handle OPTIONS requests (preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
