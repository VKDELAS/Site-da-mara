import { getSupabase } from "@/lib/supabase-fix"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: "Image ID is required" },
        { status: 400 }
      )
    }

    const supabase = await getSupabase()

    // Busca a imagem no banco de dados
    const { data, error } = await supabase
      .from("uploaded_images")
      .select("data, mime_type")
      .eq("id", id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      )
    }

    // Converte base64 para Buffer
    const buffer = Buffer.from(data.data, "base64")

    // Retorna a imagem com o tipo MIME correto
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": data.mime_type || "image/jpeg",
        "Cache-Control": "public, max-age=31536000", // Cache por 1 ano
      },
    })
  } catch (error) {
    console.error("[Images API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
