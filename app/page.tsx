"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Category = "urgent" | "important" | "routine" | "week" | "cases";
type Task = {
  id: string;
  title: string;
  note: string;
  category: Category;
  done: boolean;
  createdAt: string;
};

type TaskRow = {
  id: string;
  title: string;
  note: string;
  category: Category;
  done: boolean;
  created_at: string;
};

const rowToTask = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  note: row.note,
  category: row.category,
  done: row.done,
  createdAt: row.created_at,
});

const sampleTasks: Task[] = [
  { id:"u1", title:"Xử lý ca cấp cứu chó Mít", note:"Khó thở, theo dõi SpO₂ và đáp ứng oxy", category:"urgent", done:false, createdAt:"sample" },
  { id:"u2", title:"Duyệt phác đồ điều trị nội trú", note:"Hoàn tất trước 10:00", category:"urgent", done:true, createdAt:"sample" },
  { id:"u3", title:"Phản hồi chủ nuôi mèo Bông", note:"Kết quả xét nghiệm chức năng thận", category:"urgent", done:false, createdAt:"sample" },
  { id:"u4", title:"Kiểm tra lịch trực bác sĩ", note:"Điều chỉnh ca trực tối nay", category:"urgent", done:false, createdAt:"sample" },
  { id:"i1", title:"Hoàn thiện quy trình tiếp nhận", note:"Chuẩn hóa luồng khám và nhập viện", category:"important", done:false, createdAt:"sample" },
  { id:"i2", title:"Đánh giá năng lực kỹ thuật viên", note:"Ghi nhận kết quả thực hành tháng này", category:"important", done:false, createdAt:"sample" },
  { id:"i3", title:"Xây dựng danh mục thuốc thiết yếu", note:"Rà soát tồn kho và mức cảnh báo", category:"important", done:false, createdAt:"sample" },
  { id:"i4", title:"Chuẩn bị nội dung đào tạo nội bộ", note:"Chủ đề: xử trí phản vệ ở thú cưng", category:"important", done:false, createdAt:"sample" },
  { id:"r1", title:"Họp giao ban đầu ngày", note:"08:15 · cập nhật ca nội trú", category:"routine", done:true, createdAt:"sample" },
  { id:"r2", title:"Kiểm tra sổ bàn giao thuốc", note:"Đối chiếu số lượng và chữ ký", category:"routine", done:false, createdAt:"sample" },
  { id:"r3", title:"Duyệt hồ sơ bệnh án trong ngày", note:"Bổ sung các trường còn thiếu", category:"routine", done:false, createdAt:"sample" },
  { id:"r4", title:"Cập nhật nhóm vận hành PKC", note:"Tiến độ, khó khăn và đề xuất hỗ trợ", category:"routine", done:false, createdAt:"sample" },
  { id:"w1", title:"Chốt lịch đào tạo chuyên môn", note:"Thứ Sáu · toàn bộ đội ngũ y khoa", category:"week", done:false, createdAt:"sample" },
  { id:"w2", title:"Hoàn tất báo cáo thuốc và vật tư", note:"Hạn hoàn thành: Thứ Năm", category:"week", done:false, createdAt:"sample" },
  { id:"w3", title:"Rà soát chất lượng bệnh án", note:"Chọn ngẫu nhiên 10 hồ sơ", category:"week", done:false, createdAt:"sample" },
  { id:"w4", title:"Lập kế hoạch nhân sự tuần tới", note:"Ca trực, nghỉ phép và hỗ trợ chuyên môn", category:"week", done:false, createdAt:"sample" },
  { id:"c1", title:"Chó Mít · Poodle · 4 tuổi", note:"Viêm phổi · đo SpO₂ lúc 10:00 và 15:00", category:"cases", done:false, createdAt:"sample" },
  { id:"c2", title:"Mèo Bông · Anh lông ngắn · 7 tuổi", note:"Suy thận độ II · theo dõi ăn uống và nước tiểu", category:"cases", done:false, createdAt:"sample" },
  { id:"c3", title:"Chó Đậu · Corgi · 2 tuổi", note:"Hậu phẫu triệt sản · kiểm tra vết mổ lúc 14:00", category:"cases", done:true, createdAt:"sample" },
  { id:"c4", title:"Mèo Mun · Mèo ta · 3 tháng", note:"Giảm bạch cầu · theo dõi nhiệt độ mỗi 4 giờ", category:"cases", done:false, createdAt:"sample" },
  { id:"c5", title:"Chó Lucky · Golden · 8 tuổi", note:"Tim mạch · đánh giá đáp ứng thuốc lợi tiểu", category:"cases", done:false, createdAt:"sample" },
];

const columns: { key: Exclude<Category, "week">; title: string; subtitle: string; tone: string }[] = [
  { key: "urgent", title: "Gấp · Quan trọng", subtitle: "Ưu tiên hoàn thành sớm", tone: "coral" },
  { key: "important", title: "Quan trọng · Chưa gấp", subtitle: "Chủ động dành thời gian", tone: "amber" },
  { key: "routine", title: "Việc thường xuyên", subtitle: "Duy trì đều đặn mỗi ngày", tone: "sage" },
];

const todayLabel = () =>
  new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date());

function TaskCard({ task, onToggle, onDelete, onDragStart }: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
}) {
  return (
    <article className={`task-card ${task.done ? "is-done" : ""}`} draggable onDragStart={() => onDragStart(task.id)}>
      <button className="check" onClick={() => onToggle(task.id)} aria-label={task.done ? "Đánh dấu chưa hoàn thành" : "Đánh dấu hoàn thành"}>
        {task.done ? "✓" : ""}
      </button>
      <div className="task-copy">
        <p>{task.title}</p>
        {task.note && <span>{task.note}</span>}
      </div>
      <button className="delete" onClick={() => onDelete(task.id)} aria-label="Xóa công việc">×</button>
    </article>
  );
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<Category>("urgent");

  const loadTasks = useCallback(async () => {
    try {
      setError("");
      const { data, error: queryError } = await supabase
        .from("tasks")
        .select("id,title,note,category,done,created_at")
        .eq("status", "active")
        .order("created_at", { ascending: true });
      if (queryError) throw queryError;
      setTasks(((data || []) as TaskRow[]).map(rowToTask));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tải công việc.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
      if (data.session) void loadTasks();
      else setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
      if (nextSession) { setLoading(true); void loadTasks(); }
      else { setTasks([]); setLoading(false); }
    });
    return () => listener.subscription.unsubscribe();
  }, [loadTasks]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setSyncing(true); setError("");
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (authError) setError(authError.message); else setEmailSent(true);
    setSyncing(false);
  }

  const dailyTasks = tasks.filter((task) => task.category !== "week");
  const completed = dailyTasks.filter((task) => task.done).length;
  const progress = dailyTasks.length ? Math.round((completed / dailyTasks.length) * 100) : 0;

  const grouped = useMemo(() => Object.fromEntries(
    (["urgent", "important", "routine", "week", "cases"] as Category[]).map((key) => [key, tasks.filter((task) => task.category === key)])
  ) as Record<Category, Task[]>, [tasks]);

  async function addTask(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !session) return;
    setSyncing(true); setError("");
    const temporaryId = crypto.randomUUID();
    const optimistic: Task = { id: temporaryId, title: title.trim(), note: note.trim(), category, done: false, createdAt: new Date().toISOString() };
    setTasks((current) => [...current, optimistic]);
    setTitle(""); setNote(""); setShowForm(false);
    const { data, error: insertError } = await supabase.from("tasks").insert({ user_id: session.user.id, title: optimistic.title, note: optimistic.note, category, done: false, owner: "Bác sĩ Trang" }).select("id,title,note,category,done,created_at").single();
    if (insertError) { setTasks((current) => current.filter((task) => task.id !== temporaryId)); setError(insertError.message); }
    else setTasks((current) => current.map((task) => task.id === temporaryId ? rowToTask(data as TaskRow) : task));
    setSyncing(false);
  }

  async function toggleTask(id: string) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    const nextDone = !task.done;
    setTasks((current) => current.map((item) => item.id === id ? { ...item, done: nextDone } : item));
    const { error: updateError } = await supabase.from("tasks").update({ done: nextDone }).eq("id", id);
    if (updateError) { setTasks((current) => current.map((item) => item.id === id ? task : item)); setError(updateError.message); }
  }

  async function deleteTask(id: string) {
    if (!confirm("Xóa công việc này?")) return;
    const previous = tasks;
    setTasks((current) => current.filter((task) => task.id !== id));
    const { error: deleteError } = await supabase.from("tasks").update({ status: "archived", archived_at: new Date().toISOString() }).eq("id", id);
    if (deleteError) { setTasks(previous); setError(deleteError.message); }
  }

  async function moveTask(target: Category) {
    if (!draggedId) return;
    const id = draggedId;
    const previous = tasks;
    setDraggedId(null);
    setTasks((current) => current.map((task) => task.id === id ? { ...task, category: target } : task));
    const { error: moveError } = await supabase.from("tasks").update({ category: target }).eq("id", id);
    if (moveError) { setTasks(previous); setError(moveError.message); }
  }

  function closeDay() {
    if (!dailyTasks.length) return alert("Hôm nay chưa có công việc để lập báo cáo.");
    document.title = `Bao-cao-cong-viec-${new Date().toISOString().slice(0, 10)}`;
    window.print();
  }

  async function clearDay() {
    if (confirm("Chỉ thực hiện sau khi anh đã lưu PDF. Xóa toàn bộ công việc trong ngày? Các việc trong tuần vẫn được giữ lại.")) {
      setSyncing(true);
      const { error: archiveError } = await supabase.from("tasks").update({ status: "archived", archived_at: new Date().toISOString() }).eq("status", "active").neq("category", "week");
      if (archiveError) setError(archiveError.message); else setTasks((current) => current.filter((task) => task.category === "week"));
      setSyncing(false);
    }
  }

  async function loadSampleData() {
    if (!session || !confirm("Nạp lại toàn bộ dữ liệu mẫu? Dữ liệu hiện tại sẽ được thay thế.")) return;
    setSyncing(true); setError("");
    const now = new Date().toISOString();
    const { error: archiveError } = await supabase.from("tasks").update({ status: "archived", archived_at: now }).eq("status", "active");
    const rows = sampleTasks.map(({ title, note, category, done }) => ({ user_id: session.user.id, title, note, category, done, owner: "Bác sĩ Trang" }));
    const { error: insertError } = archiveError ? { error: archiveError } : await supabase.from("tasks").insert(rows);
    if (insertError) setError(insertError.message); else await loadTasks();
    setSyncing(false);
  }

  if (!authReady) return <main className="auth-page"><p>Đang khởi động…</p></main>;

  if (!session) return <main className="auth-page">
    <section className="auth-card">
      <Image src="/pkc-logo.png" alt="PKC Pet Center" width={110} height={72} priority />
      <p className="eyebrow">PKC PET CENTER</p>
      <h1>Quản lý công việc<br/>Bác sĩ – Leader Trang</h1>
      <p>Đăng nhập bằng email để sử dụng chung dữ liệu trên máy tính và điện thoại.</p>
      <form onSubmit={signIn}>
        <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" required /></label>
        <button className="primary" disabled={syncing}>{syncing ? "Đang gửi…" : "Gửi đường dẫn đăng nhập"}</button>
      </form>
      {emailSent && <div className="auth-success">Đã gửi. Hãy mở email và bấm đường dẫn đăng nhập.</div>}
      {error && <div className="auth-error">{error}</div>}
    </section>
  </main>;

  return (
    <main>
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><Image src="/pkc-logo.png" alt="PKC Pet Center" width={62} height={39} priority /></span><div><strong>PKC PET CENTER</strong><small>Quản lý công việc cá nhân</small></div></div>
        <div className="top-actions">
          <button className="ghost" onClick={() => void supabase.auth.signOut()}>Đăng xuất</button>
          <button className="ghost demo-button" onClick={loadSampleData}>Dữ liệu mẫu</button>
          <button className="ghost" onClick={closeDay}>Xuất báo cáo PDF</button>
          <button className="primary" onClick={() => setShowForm(true)}>＋ Tạo công việc</button>
        </div>
      </header>

      <section className="welcome">
        <div><p className="eyebrow">{todayLabel()}</p><h1>Chào Bác sĩ Trang,<br/><em>sẵn sàng cho một ngày hiệu quả.</em></h1><p className="role-line">Leader Trang · PKC Pet Center</p></div>
        <div className="progress-card"><div><span>Tiến độ hôm nay</span><strong>{completed}/{dailyTasks.length} việc</strong></div><div className="progress"><i style={{ width: `${progress}%` }} /></div><small>{progress}% hoàn thành</small></div>
      </section>

      {(loading || syncing || error) && <section className={`sync-status ${error ? "has-error" : ""}`}>
        <span>{loading ? "Đang tải dữ liệu từ Supabase…" : syncing ? "Đang đồng bộ Supabase…" : error}</span>
        {error && <button onClick={() => void loadTasks()}>Thử lại</button>}
      </section>}

      <section className="case-section" onDragOver={(e) => e.preventDefault()} onDrop={() => moveTask("cases")}>
        <header className="case-header">
          <div><p className="eyebrow">THEO DÕI CHUYÊN MÔN</p><h2>Các ca bệnh cần theo dõi hôm nay</h2><span>Thông tin giả lập phục vụ bản mẫu</span></div>
          <div className="case-actions"><strong>{grouped.cases.length} ca</strong><button onClick={() => { setCategory("cases"); setShowForm(true); }}>＋ Thêm ca bệnh</button></div>
        </header>
        <div className="case-grid">
          {grouped.cases.map((task, index) => <div className="case-wrap" key={task.id}><span className="case-number">{String(index + 1).padStart(2,"0")}</span><TaskCard task={task} onToggle={toggleTask} onDelete={deleteTask} onDragStart={setDraggedId}/></div>)}
        </div>
      </section>

      <section className="workspace">
        <div className="board">
          {columns.map((column) => (
            <section className={`column ${column.tone}`} key={column.key} onDragOver={(e) => e.preventDefault()} onDrop={() => moveTask(column.key)}>
              <header><div><h2>{column.title}</h2><p>{column.subtitle}</p></div><span>{grouped[column.key].length}</span></header>
              <div className="task-list">
                {grouped[column.key].map((task) => <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onDragStart={setDraggedId} />)}
                {!grouped[column.key].length && <div className="empty"><span>＋</span><p>Kéo công việc vào đây<br/>hoặc tạo việc mới</p></div>}
              </div>
            </section>
          ))}
        </div>

        <aside className="week" onDragOver={(e) => e.preventDefault()} onDrop={() => moveTask("week")}>
          <div className="week-head"><p>TRỌNG TÂM TUẦN</p><span>Tuần này</span></div>
          <h2>Việc cần hoàn thành</h2>
          <div className="week-list">
            {grouped.week.map((task) => <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onDragStart={setDraggedId} />)}
            {!grouped.week.length && <p className="week-empty">Chưa có việc nào.<br/>Kéo việc vào đây để lên kế hoạch tuần.</p>}
          </div>
          <button className="week-add" onClick={() => { setCategory("week"); setShowForm(true); }}>＋ Thêm việc trong tuần</button>
        </aside>
      </section>

      <footer><p>Tài khoản sử dụng: <strong>{session.user.email}</strong> · Dữ liệu đồng bộ với Supabase.</p><div><button onClick={closeDay}>Chốt ngày & xuất PDF</button><button className="danger" onClick={clearDay}>Xóa dữ liệu ngày</button></div></footer>

      {showForm && <div className="modal" onMouseDown={() => setShowForm(false)}>
        <form onSubmit={addTask} onMouseDown={(e) => e.stopPropagation()}>
          <div className="form-head"><div><p>VIỆC MỚI</p><h2>Thêm một công việc</h2></div><button type="button" onClick={() => setShowForm(false)}>×</button></div>
          <label>Tên công việc<input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Hoàn thiện kế hoạch tuần" required /></label>
          <label>Ghi chú<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Thông tin ngắn cần ghi nhớ" rows={3}/></label>
          <label>Phân loại<select value={category} onChange={(e) => setCategory(e.target.value as Category)}><option value="urgent">Gấp · Quan trọng</option><option value="important">Quan trọng · Chưa gấp</option><option value="routine">Việc thường xuyên</option><option value="cases">Ca bệnh cần theo dõi</option><option value="week">Cần hoàn thành trong tuần</option></select></label>
          <div className="form-actions"><button type="button" className="ghost" onClick={() => setShowForm(false)}>Hủy</button><button className="primary" type="submit">Thêm công việc</button></div>
        </form>
      </div>}

      <section className="print-report">
        <div className="print-brand"><Image src="/pkc-logo.png" alt="PKC Pet Center" width={80} height={52}/><p>PKC PET CENTER</p></div><p className="eyebrow">BÁO CÁO CÔNG VIỆC NGÀY · BÁC SĨ – LEADER TRANG</p><h1>{todayLabel()}</h1>
        <div className="print-stats"><span>Tổng số việc <strong>{dailyTasks.length}</strong></span><span>Hoàn thành <strong>{completed}</strong></span><span>Tỷ lệ <strong>{progress}%</strong></span></div>
        {columns.map((column) => <div className="print-group" key={column.key}><h2>{column.title}</h2>{grouped[column.key].length ? grouped[column.key].map((task) => <p key={task.id}><b>{task.done ? "✓" : "○"}</b> {task.title} {task.note && <small>— {task.note}</small>}</p>) : <p className="muted">Không có công việc</p>}</div>)}
        <div className="print-group"><h2>Các ca bệnh cần theo dõi</h2>{grouped.cases.map((task) => <p key={task.id}><b>{task.done ? "✓" : "○"}</b> {task.title} <small>— {task.note}</small></p>)}</div>
      </section>
    </main>
  );
}
