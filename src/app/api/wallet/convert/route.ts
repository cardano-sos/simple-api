// File: src/app/api/wallet/convert/route.ts

import { NextResponse } from "next/server";
import {
  processCardanoAddresses,
  convertHexToBech32,
} from "@/actions/meshWalletConvert";

// Helper function to add CORS headers only when needed
function addCorsHeadersIfNeeded(
  response: NextResponse,
  request: Request
): NextResponse {
  // Check if the request is from a browser (has Origin header)
  const origin = request.headers.get("origin");

  // Only add CORS headers if the request has an Origin header
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Accept, Authorization"
    );
  }

  return response;
}

/**
 * Main API endpoint for converting both payment and reward addresses
 */
export async function POST(request: Request) {
  // Handle preflight requests (browser will send these before actual requests)
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
      },
    });
  }

  try {
    // Parse the JSON body from the request
    const body = await request.json();
    const {
      paymentHexAddress,
      rewardHexAddress,
      networkId = 1, // Default to mainnet
    } = body;

    // Validate that at least one address is provided
    if (!paymentHexAddress && !rewardHexAddress) {
      const errorResponse = NextResponse.json(
        {
          error: "At least one address (payment or reward) is required",
          success: false,
        },
        { status: 400 }
      );
      return addCorsHeadersIfNeeded(errorResponse, request);
    }

    // Validate network ID
    const validNetworkId = networkId === 0 || networkId === 1 ? networkId : 1;

    // Process the addresses
    const result = await processCardanoAddresses(
      paymentHexAddress,
      rewardHexAddress,
      validNetworkId as 0 | 1
    );

    // Return the result with conditional CORS headers
    const successResponse = NextResponse.json(result);
    return addCorsHeadersIfNeeded(successResponse, request);
  } catch (error: any) {
    console.error("Address conversion error:", error);

    const errorResponse = NextResponse.json(
      {
        error: "Failed to convert address",
        message: error.message,
        success: false,
      },
      { status: 500 }
    );

    return addCorsHeadersIfNeeded(errorResponse, request);
  }
}

/**
 * Simplified API endpoint for converting a single address
 */
export async function GET(request: Request) {
  try {
    // Get parameters from the URL
    const { searchParams } = new URL(request.url);
    const hexAddress = searchParams.get("address");
    const type = searchParams.get("type") === "reward" ? "reward" : "payment";
    const networkId = searchParams.get("network") === "0" ? 0 : 1;

    if (!hexAddress) {
      const errorResponse = NextResponse.json(
        { error: "Address parameter is required", success: false },
        { status: 400 }
      );
      return addCorsHeadersIfNeeded(errorResponse, request);
    }

    // Convert the address
    const bech32Address = await convertHexToBech32(
      hexAddress,
      type as "payment" | "reward",
      networkId as 0 | 1
    );

    const successResponse = NextResponse.json({
      original: hexAddress,
      bech32: bech32Address,
      type,
      network: networkId === 0 ? "testnet" : "mainnet",
      success: true,
    });

    return addCorsHeadersIfNeeded(successResponse, request);
  } catch (error: any) {
    console.error("Address conversion error:", error);

    const errorResponse = NextResponse.json(
      {
        error: "Failed to convert address",
        message: error.message,
        success: false,
      },
      { status: 500 }
    );

    return addCorsHeadersIfNeeded(errorResponse, request);
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
    },
  });
}
