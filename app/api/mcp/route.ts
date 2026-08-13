import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRpcId = string | number | null;
type JsonRpcRequest = { jsonrpc?: string; id?: JsonRpcId; method?: string; params?: Record<string, unknown> };
type Category = "urgent" | "important" | "routine" | "week";
const categories: Category[] = ["urgent", "important", "routine", "week"];
const categoryLabels: Record<Category, string> = {
  urgent: "Gấp · Quan trọng", important: "Quan trọng · Chưa gấp", routine: "Việc thường xuyên",
  week: "Cần hoàn thành trong tuần",
};

const toolDefinitions = [
  { name: "list_tasks", title: "Xem danh sách công việc PKC", description: "Đọc các công việc của Bác sĩ Trang, có thể lọc theo nhóm, trạng thái hoàn thành và ngày.", inputSchema: { type: "object", properties: { category: { type: "string", enum: categories }, done: { type: "boolean" }, taskDate: { type: "string", format: "date" }, includeArchived: { type: "boolean", default: false } }, additionalProperties: false }, annotations: { readOnlyHint: true, openWorldHint: false } },
  { name: "get_daily_summary", title: "Tóm tắt công việc PKC", description: "Tổng hợp số việc đã hoàn thành, còn lại và tiến độ theo từng nhóm trong ngày.", inputSchema: { type: "object", properties: { taskDate: { type: "string", format: "date", description: "Ngày dạng YYYY-MM-DD; mặc định hôm nay." } }, additionalProperties: false }, annotations: { readOnlyHint: true, openWorldHint: false } },
  { name: "create_task", title: "Tạo công việc PKC", description: "Tạo một công việc hoặc ca bệnh mới cho Bác sĩ Trang.", inputSchema: { type: "object", properties: { title: { type: "string", minLength: 1 }, note: { type: "string" }, category: { type: "string", enum: categories }, taskDate: { type: "string", format: "date" } }, required: ["title", "category"], additionalProperties: false }, annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false } },
  { name: "update_task", title: "Sửa công việc PKC", description: "Sửa tên, ghi chú, nhóm, ngày hoặc trạng thái hoàn thành của một công việc.", inputSchema: { type: "object", properties: { id: { type: "string", format: "uuid" }, title: { type: "string", minLength: 1 }, note: { type: "string" }, category: { type: "string", enum: categories }, done: { type: "boolean" }, taskDate: { type: "string", format: "date" } }, required: ["id"], additionalProperties: false }, annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } },
  { name: "complete_task", title: "Hoàn thành công việc PKC", description: "Đánh dấu một công việc là đã hoàn thành hoặc chưa hoàn thành.", inputSchema: { type: "object", properties: { id: { type: "string", format: "uuid" }, done: { type: "boolean", default: true } }, required: ["id"], additionalProperties: false }, annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } },
  { name: "move_task", title: "Di chuyển công việc PKC", description: "Di chuyển một công việc sang cột phân loại khác.", inputSchema: { type: "object", properties: { id: { type: "string", format: "uuid" }, category: { type: "string", enum: categories } }, required: ["id", "category"], additionalProperties: false }, annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } },
  { name: "archive_task", title: "Xoá công việc PKC", description: "Đưa một công việc vào lưu trữ; công việc sẽ biến mất khỏi bảng chính.", inputSchema: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"], additionalProperties: false }, annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false } },
  { name: "archive_day", title: "Kết thúc ngày làm việc PKC", description: "Lưu trữ toàn bộ công việc trong ngày, ngoại trừ nhóm công việc trong tuần.", inputSchema: { type: "object", properties: { taskDate: { type: "string", format: "date", description: "Ngày dạng YYYY-MM-DD; mặc định hôm nay." } }, additionalProperties: false }, annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false } },
  { name: "list_medical_cases", title: "Xem ca bệnh PKC", description: "Liệt kê ca bệnh, có thể lọc theo cơ sở và Nội trú/Ngoại trú.", inputSchema: { type:"object", properties:{ facility:{type:"string"}, caseType:{type:"string",enum:["Nội trú","Ngoại trú"]}, includeArchived:{type:"boolean",default:false} }, additionalProperties:false }, annotations:{readOnlyHint:true,openWorldHint:false} },
  { name: "create_medical_case", title: "Tạo ca bệnh PKC", description: "Tạo ca bệnh mới tại một cơ sở.", inputSchema:{type:"object",properties:{petName:{type:"string"},species:{type:"string"},breed:{type:"string"},ageText:{type:"string"},caseType:{type:"string",enum:["Nội trú","Ngoại trú"]},facility:{type:"string"},diagnosis:{type:"string"},monitoringNote:{type:"string"},ownerName:{type:"string"},ownerPhone:{type:"string"}},required:["petName","caseType","facility"],additionalProperties:false}, annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:false} },
  { name: "update_medical_case", title: "Sửa ca bệnh PKC", description: "Cập nhật thông tin hoặc trạng thái hoàn thành của ca bệnh.", inputSchema:{type:"object",properties:{id:{type:"string",format:"uuid"},diagnosis:{type:"string"},monitoringNote:{type:"string"},treatmentNote:{type:"string"},status:{type:"string"},isCompleted:{type:"boolean"},facility:{type:"string"},caseType:{type:"string",enum:["Nội trú","Ngoại trú"]}},required:["id"],additionalProperties:false}, annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:true,openWorldHint:false} },
  { name: "archive_medical_case", title: "Xóa ca bệnh PKC", description: "Đưa ca bệnh vào lưu trữ.", inputSchema:{type:"object",properties:{id:{type:"string",format:"uuid"}},required:["id"],additionalProperties:false}, annotations:{readOnlyHint:false,destructiveHint:true,idempotentHint:true,openWorldHint:false} },
];

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, MCP-Protocol-Version", "Access-Control-Expose-Headers": "MCP-Protocol-Version" };

function isAuthorized(request: NextRequest) {
  const expected = process.env.PKC_MCP_TOKEN;
  if (!expected) return false;
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return bearer === expected || request.nextUrl.searchParams.get("token") === expected;
}
function jsonRpc(id: JsonRpcId | undefined, result: unknown, status = 200) { return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, result }, { status, headers: corsHeaders }); }
function rpcError(id: JsonRpcId | undefined, code: number, message: string, status = 200) { return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, { status, headers: corsHeaders }); }
function today() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date()); }
function textResult(data: unknown) { return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data }; }
function assertCategory(value: unknown): Category | undefined { if (value === undefined) return undefined; if (!categories.includes(value as Category)) throw new Error("Nhóm công việc không hợp lệ."); return value as Category; }

async function runTool(name: string, args: Record<string, unknown>) {
  const supabase = getSupabaseAdmin();
  if (name === "list_medical_cases") {
    let query = supabase.from("medical_cases").select("*");
    if (!args.includeArchived) query = query.eq("record_status", "active");
    if (args.facility) query = query.eq("facility", String(args.facility));
    if (args.caseType) query = query.eq("case_type", String(args.caseType));
    const { data, error } = await query.order("created_at").limit(200); if (error) throw error;
    return textResult({ success:true, count:data.length, medicalCases:data });
  }
  if (name === "create_medical_case") {
    const payload = { pet_name:String(args.petName||"").trim(), species:String(args.species||"").trim(), breed:String(args.breed||"").trim(), age_text:String(args.ageText||"").trim(), case_type:String(args.caseType), facility:String(args.facility), diagnosis:String(args.diagnosis||"").trim(), monitoring_note:String(args.monitoringNote||"").trim(), owner_name:String(args.ownerName||"").trim(), owner_phone:String(args.ownerPhone||"").trim(), doctor_name:"Bác sĩ Trang", case_date:today() };
    if (!payload.pet_name) throw new Error("Tên thú cưng không được để trống.");
    const {data,error}=await supabase.from("medical_cases").insert(payload).select().single();if(error)throw error;return textResult({success:true,message:"Đã tạo ca bệnh.",medicalCase:data});
  }
  if (name === "update_medical_case") {
    const map:Record<string,string>={diagnosis:"diagnosis",monitoringNote:"monitoring_note",treatmentNote:"treatment_note",status:"status",isCompleted:"is_completed",facility:"facility",caseType:"case_type"}, update:Record<string,unknown>={};
    Object.entries(map).forEach(([a,b])=>{if(args[a]!==undefined)update[b]=args[a]}); if(!Object.keys(update).length)throw new Error("Chưa có nội dung cần cập nhật.");
    const {data,error}=await supabase.from("medical_cases").update(update).eq("id",String(args.id)).eq("record_status","active").select().maybeSingle();if(error)throw error;if(!data)throw new Error("Không tìm thấy ca bệnh.");return textResult({success:true,message:"Đã cập nhật ca bệnh.",medicalCase:data});
  }
  if (name === "archive_medical_case") {
    const {data,error}=await supabase.from("medical_cases").update({record_status:"archived",archived_at:new Date().toISOString()}).eq("id",String(args.id)).eq("record_status","active").select().maybeSingle();if(error)throw error;if(!data)throw new Error("Không tìm thấy ca bệnh.");return textResult({success:true,message:"Đã lưu trữ ca bệnh.",medicalCase:data});
  }
  if (name === "list_tasks") {
    let query = supabase.from("tasks").select("id,title,note,category,done,task_date,status,owner,created_at,updated_at,archived_at");
    if (!args.includeArchived) query = query.eq("status", "active");
    if (args.category) {
      const category = assertCategory(args.category);
      if (category) query = query.eq("category", category);
    }
    if (typeof args.done === "boolean") query = query.eq("done", args.done);
    if (args.taskDate) query = query.eq("task_date", String(args.taskDate));
    const { data, error } = await query.order("created_at", { ascending: true }).limit(200);
    if (error) throw error;
    return textResult({ success: true, count: data.length, tasks: data });
  }
  if (name === "get_daily_summary") {
    const taskDate = String(args.taskDate || today());
    const { data, error } = await supabase.from("tasks").select("id,category,done").eq("status", "active").eq("task_date", taskDate);
    if (error) throw error;
    const summaryRows = (data || []) as unknown as { id: string; category: Category; done: boolean }[];
    const daily = summaryRows.filter((task) => task.category !== "week");
    const completed = daily.filter((task) => task.done).length;
    const byCategory = Object.fromEntries(categories.map((category) => { const rows = summaryRows.filter((task) => task.category === category); return [category, { label: categoryLabels[category], total: rows.length, completed: rows.filter((task) => task.done).length, remaining: rows.filter((task) => !task.done).length }]; }));
    return textResult({ success: true, taskDate, total: daily.length, completed, remaining: daily.length - completed, progressPercent: daily.length ? Math.round((completed / daily.length) * 100) : 0, byCategory });
  }
  if (name === "create_task") {
    const title = String(args.title || "").trim(); if (!title) throw new Error("Tên công việc không được để trống.");
    const category = assertCategory(args.category); if (!category) throw new Error("Cần chọn nhóm công việc.");
    const { data, error } = await supabase.from("tasks").insert({ title, note: String(args.note || "").trim(), category, task_date: String(args.taskDate || today()), owner: "Bác sĩ Trang", done: false, status: "active" }).select().single();
    if (error) throw error; return textResult({ success: true, message: "Đã tạo công việc.", task: data });
  }
  if (name === "update_task") {
    const id = String(args.id || ""); if (!id) throw new Error("Thiếu ID công việc.");
    const update: Record<string, unknown> = {};
    if (args.title !== undefined) { const title = String(args.title).trim(); if (!title) throw new Error("Tên công việc không được để trống."); update.title = title; }
    if (args.note !== undefined) update.note = String(args.note).trim();
    if (args.category !== undefined) update.category = assertCategory(args.category);
    if (typeof args.done === "boolean") update.done = args.done;
    if (args.taskDate !== undefined) update.task_date = String(args.taskDate);
    if (!Object.keys(update).length) throw new Error("Chưa có nội dung nào cần cập nhật.");
    const { data, error } = await supabase.from("tasks").update(update).eq("id", id).eq("status", "active").select().maybeSingle();
    if (error) throw error; if (!data) throw new Error("Không tìm thấy công việc đang hoạt động."); return textResult({ success: true, message: "Đã cập nhật công việc.", task: data });
  }
  if (name === "complete_task") {
    const id = String(args.id || ""); const done = args.done === undefined ? true : Boolean(args.done);
    const { data, error } = await supabase.from("tasks").update({ done }).eq("id", id).eq("status", "active").select().maybeSingle();
    if (error) throw error; if (!data) throw new Error("Không tìm thấy công việc đang hoạt động."); return textResult({ success: true, message: done ? "Đã hoàn thành công việc." : "Đã mở lại công việc.", task: data });
  }
  if (name === "move_task") {
    const id = String(args.id || ""); const category = assertCategory(args.category); if (!category) throw new Error("Thiếu nhóm đích.");
    const { data, error } = await supabase.from("tasks").update({ category }).eq("id", id).eq("status", "active").select().maybeSingle();
    if (error) throw error; if (!data) throw new Error("Không tìm thấy công việc đang hoạt động."); return textResult({ success: true, message: `Đã chuyển sang ${categoryLabels[category]}.`, task: data });
  }
  if (name === "archive_task") {
    const id = String(args.id || ""); const { data, error } = await supabase.from("tasks").update({ status: "archived", archived_at: new Date().toISOString() }).eq("id", id).eq("status", "active").select().maybeSingle();
    if (error) throw error; if (!data) throw new Error("Không tìm thấy công việc đang hoạt động."); return textResult({ success: true, message: "Đã lưu trữ công việc.", task: data });
  }
  if (name === "archive_day") {
    const taskDate = String(args.taskDate || today()); const { data, error } = await supabase.from("tasks").update({ status: "archived", archived_at: new Date().toISOString() }).eq("status", "active").eq("task_date", taskDate).neq("category", "week").select("id");
    if (error) throw error; return textResult({ success: true, message: `Đã kết thúc ngày ${taskDate}.`, archivedCount: data.length });
  }
  throw new Error(`Không có công cụ ${name}.`);
}

async function handleRpc(body: JsonRpcRequest) {
  const { id, method, params = {} } = body;
  if (body.jsonrpc !== "2.0" || !method) return rpcError(id, -32600, "Yêu cầu JSON-RPC không hợp lệ.", 400);
  if (method === "initialize") {
    const requestedVersion = typeof params.protocolVersion === "string" ? params.protocolVersion : "2025-06-18";
    return jsonRpc(id, { protocolVersion: requestedVersion, capabilities: { tools: { listChanged: false } }, serverInfo: { name: "pkc-task-manager", title: "PKC Pet Center · Quản lý công việc", version: "1.0.0" }, instructions: "Quản lý công việc và ca bệnh của Bác sĩ Trang. Luôn hỏi xác nhận rõ ràng trước khi gọi archive_task hoặc archive_day." });
  }
  if (method === "ping") return jsonRpc(id, {});
  if (method === "tools/list") return jsonRpc(id, { tools: toolDefinitions });
  if (method === "tools/call") {
    const toolName = String(params.name || ""); const toolArgs = params.arguments && typeof params.arguments === "object" ? params.arguments as Record<string, unknown> : {};
    try { return jsonRpc(id, await runTool(toolName, toolArgs)); }
    catch (error) { return jsonRpc(id, { content: [{ type: "text", text: error instanceof Error ? error.message : "Không thể thực hiện thao tác." }], isError: true }); }
  }
  if (method.startsWith("notifications/")) return new NextResponse(null, { status: 202, headers: corsHeaders });
  return rpcError(id, -32601, `Không hỗ trợ phương thức ${method}.`);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Không được phép. Kiểm tra PKC_MCP_TOKEN." }, { status: 401, headers: { ...corsHeaders, "WWW-Authenticate": "Bearer" } });
  try { return handleRpc(await request.json() as JsonRpcRequest); }
  catch { return rpcError(null, -32700, "JSON không hợp lệ.", 400); }
}
export function GET() { return NextResponse.json({ name: "PKC Task Manager MCP", status: "ready", transport: "Streamable HTTP", endpoint: "/api/mcp" }, { status: 405, headers: { ...corsHeaders, Allow: "POST, OPTIONS" } }); }
export function OPTIONS() { return new NextResponse(null, { status: 204, headers: corsHeaders }); }
