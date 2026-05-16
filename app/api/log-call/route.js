import { NextResponse } from "next/server";

const NOTION_DB = "900959b87a5241609e9f641359311e23";

const PROMPT = `You are a CRM field extractor for Utopia Advanced Composites, an Ethiopian UHPC and GFRC manufacturer.

Given a sales call note, return ONLY valid JSON — no markdown, no backticks, no explanation.

{
  "clientName": "person name, or 'Unknown' if not mentioned",
  "clientType": "one of: Residential | Contractor | Architect | Real Estate Developer | Government | Other",
  "qualificationScore": "one of: ⭐⭐⭐⭐ Hot | ⭐⭐⭐ Warm | ⭐⭐ Cool | ⭐ Cold",
  "notes": "2-3 sentence call summary",
  "projectTypes": ["array using: Stairs | Cladding | Planters | Benches | Facade | Custom | Other"],
  "estimatedValue": null or number,
  "timeline": "one of: Immediate (0-4 weeks) | Short (1-3 months) | Long (3-6 months) | Unknown",
  "budgetConfirmed": true or false,
  "decisionMaker": true or false,
  "specificProject": true or false,
  "location": null or "city/area string",
  "nextFollowUp": null or "YYYY-MM-DD",
  "nextStep": "one short action sentence"
}

Scoring:
- Hot = specific project + timeline + budget mentioned
- Warm = specific project mentioned
- Cool = general interest
- Cold = vague / just browsing`;

export async function POST(request) {
  try {
    const { direction, name, phone, note } = await request.json();

    if (!note?.trim()) {
      return NextResponse.json({ error: "Note is required" }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const notionKey = process.env.NOTION_API_KEY;

    if (!geminiKey || !notionKey) {
      return NextResponse.json(
        { error: "Missing API keys. Check your Vercel environment variables." },
        { status: 500 }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    // ── 1. Parse with Gemini (free) ──────────────────────────────────────────
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${PROMPT}\n\nCall direction: ${direction === "incoming" ? "INCOMING (they called us)" : "OUTGOING (we called them)"}\nContact name: ${name || "Unknown"}\nPhone: ${phone || "not provided"}\nDate: ${today}\n\nCall note: ${note}`,
            }],
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 600 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      return NextResponse.json({ error: `Gemini error: ${err}` }, { status: 500 });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed;
    try {
      parsed = JSON.parse(rawText.replace(/```json|```/g, "").trim());
    } catch {
      return NextResponse.json({ error: "AI response could not be parsed. Try again." }, { status: 500 });
    }

    // ── 2. Build Notion properties ───────────────────────────────────────────
    const props = {
      "Client Name":      { title:    [{ text: { content: parsed.clientName || name || "Unknown" } }] },
      "Status":           { select:   { name: "🆕 New Lead" } },
      "Lead Source":      { select:   { name: "Other" } },
      "Decision Maker?":  { checkbox: Boolean(parsed.decisionMaker) },
      "Specific Project?":{ checkbox: Boolean(parsed.specificProject) },
      "Budget Confirmed?":{ checkbox: Boolean(parsed.budgetConfirmed) },
      "Last Contacted":   { date:     { start: today } },
    };

    if (parsed.clientType)
      props["Client Type"] = { select: { name: parsed.clientType } };

    if (parsed.qualificationScore)
      props["Qualification Score"] = { select: { name: parsed.qualificationScore } };

    if (parsed.notes)
      props["Notes"] = { rich_text: [{ text: { content: parsed.notes } }] };

    if (parsed.projectTypes?.length)
      props["Project Type"] = { multi_select: parsed.projectTypes.map(t => ({ name: t })) };

    if (parsed.estimatedValue != null)
      props["Estimated Value (ETB)"] = { number: parsed.estimatedValue };

    if (parsed.timeline)
      props["Timeline"] = { select: { name: parsed.timeline } };

    if (parsed.location)
      props["Location"] = { rich_text: [{ text: { content: parsed.location } }] };

    if (phone)
      props["Phone Number"] = { phone_number: phone };

    if (parsed.nextFollowUp)
      props["Next Follow-Up"] = { date: { start: parsed.nextFollowUp } };

    // ── 3. Create Notion page ────────────────────────────────────────────────
    const notionRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${notionKey}`,
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DB },
        properties: props,
        children: [{
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{
              type: "text",
              text: {
                content: `${direction === "incoming" ? "📲 Incoming" : "📞 Outgoing"} call logged ${today}${phone ? " · " + phone : ""}\n\nOriginal note: "${note}"`,
              },
              annotations: { color: "gray" },
            }],
          },
        }],
      }),
    });

    if (!notionRes.ok) {
      const err = await notionRes.text();
      return NextResponse.json({ error: `Notion error: ${err}` }, { status: 500 });
    }

    // ── 4. Respond ───────────────────────────────────────────────────────────
    return NextResponse.json({
      clientName:          parsed.clientName || name || "Unknown",
      clientType:          parsed.clientType,
      qualificationScore:  parsed.qualificationScore,
      projectTypes:        parsed.projectTypes,
      timeline:            parsed.timeline,
      nextFollowUp:        parsed.nextFollowUp,
      nextStep:            parsed.nextStep,
      notionDone:          true,
    });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
