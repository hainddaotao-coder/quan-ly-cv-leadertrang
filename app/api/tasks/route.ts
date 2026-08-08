const GOOGLE_SCRIPT_URL =
  process.env.GOOGLE_SCRIPT_URL ||
  process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbxllsMXq0mMMgPNiuQY7uKh6AHJ8wo6czU7cOrMNiyIuT1HSUwNeCdEXv7rlrOZz39XVw/exec";

export const dynamic = "force-dynamic";

async function parseGoogleResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Apps Script không trả về JSON. Hãy kiểm tra quyền truy cập Web App.");
  }
}

export async function GET() {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, { cache: "no-store", redirect: "follow" });
    if (!response.ok) throw new Error(`Google trả về lỗi ${response.status}`);
    const data = await parseGoogleResponse(response);
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ success: false, error: error instanceof Error ? error.message : "Không thể đọc Google Sheet." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      cache: "no-store",
      redirect: "follow",
    });
    if (!response.ok) throw new Error(`Google trả về lỗi ${response.status}`);
    const data = await parseGoogleResponse(response);
    return Response.json(data, { status: data.success === false ? 400 : 200 });
  } catch (error) {
    return Response.json({ success: false, error: error instanceof Error ? error.message : "Không thể cập nhật Google Sheet." }, { status: 502 });
  }
}
