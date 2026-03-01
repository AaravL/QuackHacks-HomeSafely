import { NextResponse } from "next/server"

const FALLBACK_TIPS = [
  { tip: "Stay on well-lit streets and main roads whenever possible." },
  { tip: "Share your live location with a trusted friend or family member." },
  { tip: "Keep your phone fully charged before heading out." },
  { tip: "Be aware of your surroundings and avoid wearing headphones in both ears." },
  { tip: "Have a backup plan - know nearby safe spaces like 24-hour stores." },
]

export async function POST(request: Request) {
  try {
    const { from, to, mode } = await request.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ tips: FALLBACK_TIPS })
    }

    const prompt = `You are a personal safety assistant. A user is traveling from "${from}" to "${to}" using ${mode}. 
Give exactly 5 short, actionable safety tips specific to this route and transport mode. 
Each tip should be 1-2 sentences max. Focus on practical safety advice.
Return ONLY a JSON array of objects with a "tip" field, no other text.
Example: [{"tip": "Stay on main streets."}]`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    )

    if (!res.ok) {
      return NextResponse.json({ tips: FALLBACK_TIPS })
    }

    const data = await res.json()
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""

    // Extract JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const tips = JSON.parse(jsonMatch[0])
      return NextResponse.json({ tips })
    }

    return NextResponse.json({ tips: FALLBACK_TIPS })
  } catch {
    return NextResponse.json({ tips: FALLBACK_TIPS })
  }
}
