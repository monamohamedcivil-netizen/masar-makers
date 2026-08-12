import { NextResponse } from "next/server";

import { getHomeTestimonials } from "@/lib/queries/home/testimonials";

export async function GET() {
  try {
    const testimonials =
      await getHomeTestimonials();

    return NextResponse.json(testimonials);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown testimonials error.";

    console.error(
      "Testimonials API error:",
      message
    );

    return NextResponse.json(
      {
        message:
          "Failed to load testimonials.",
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}