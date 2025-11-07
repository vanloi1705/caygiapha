let currentUser = null;
let currentTreeName = "Cây mặc định";
let members = [];
let tree = null;
let editingMemberId = null;
let searchTimeout = null;

// ======= QUẢN LÝ TÀI KHOẢN =======
if (!localStorage.getItem("users")) {
  localStorage.setItem("users", JSON.stringify([{ username: "admin", password: "123" }]));
}

const toggleRegister = (show) => {
  document.getElementById("loginForm").classList.toggle("hidden", show);
  document.getElementById("registerForm").classList.toggle("hidden", !show);
};

const register = () => {
  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const username = document.getElementById("newUser").value.trim();
  const password = document.getElementById("newPass").value.trim();
  const confirmPass = document.getElementById("confirmPass").value.trim();

  if (!fullName || !email || !username || !password || !confirmPass) {
    return alert("⚠️ Vui lòng nhập đầy đủ thông tin!");
  }

  if (password !== confirmPass) {
    return alert("❌ Mật khẩu xác nhận không khớp!");
  }

  const users = JSON.parse(localStorage.getItem("users")) || [];
  if (users.some(u => u.username === username)) {
    return alert("❌ Tên đăng nhập đã tồn tại!");
  }
  if (users.some(u => u.email === email)) {
    return alert("❌ Email đã được sử dụng!");
  }

  users.push({
    fullName,
    email,
    username,
    password,
  });
  localStorage.setItem("users", JSON.stringify(users));

  alert("✅ Đăng ký thành công! Hãy đăng nhập.");
  toggleRegister(false);

  // Xóa nội dung trong form
  ["fullName", "email", "newUser", "newPass", "confirmPass"].forEach(id => {
    document.getElementById(id).value = "";
  });
};


const login = () => {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const found = users.find(u => u.username === user && u.password === pass);

  if (!found) return alert("❌ Sai tài khoản hoặc mật khẩu!");

  currentUser = user;
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("sidebar").classList.remove("hidden");
  document.querySelector(".main-area").classList.remove("hidden");

  loadFamilyData();
  setTimeout(initTree, 300); 
};

const logout = () => {
  if (!confirm("Bạn có muốn đăng xuất?")) return;
  saveFamilyData();
  currentUser = null;
  members = [];
  tree = null;
  document.getElementById("loginPage").classList.remove("hidden");
  document.getElementById("sidebar").classList.add("hidden");
  document.querySelector(".main-area").classList.add("hidden");
};

// ======= LƯU & TẢI DỮ LIỆU =======
const getFamilyKey = () => `familyTreeData_${currentUser}_${currentTreeName}`;
const getAllFamilyNames = () => {
  const prefix = `familyTreeData_${currentUser}_`;
  return Object.keys(localStorage)
    .filter(k => k.startsWith(prefix))
    .map(k => k.replace(prefix, ""));
};

const saveFamilyData = () => {
  if (!currentUser) return;
  localStorage.setItem(getFamilyKey(), JSON.stringify(members));
};

const loadFamilyData = () => {
  const select = document.getElementById("familySelect");
  select.innerHTML = "";

  const trees = getAllFamilyNames();
  if (!trees.includes(currentTreeName)) {
    currentTreeName = trees.length ? trees[0] : "Cây mặc định";
  }

  [currentTreeName, ...trees.filter(t => t !== currentTreeName)].forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });

  const raw = localStorage.getItem(getFamilyKey());
  members = raw ? JSON.parse(raw) : [];

  if (!members.length) {
    members = [
      // 1. THẾ HỆ ÔNG BÀ (Generation 1)
      { id: 1, pids: [2], name: "Nguyễn Văn A", gender: "male", dob: "1955", marital: "Đã kết hôn", phone: "0901234567", img: "https://cdn-icons-png.flaticon.com/512/4140/4140048.png" },
      { id: 2, pids: [1], name: "Trần Thị B", gender: "female", dob: "1960", marital: "Đã kết hôn", phone: "0907654321", img: "https://cdn-icons-png.flaticon.com/512/4140/4140051.png" },

      // 2. THẾ HỆ CON CÁI (Generation 2 - Con của A và B)
      { id: 3, mid: 2, fid: 1, pids: [4], name: "Nguyễn Văn C", gender: "male", dob: "1980", marital: "Đã kết hôn", img: "https://cdn-icons-png.flaticon.com/512/4140/4140048.png" }, // Con trai
      { id: 4, pids: [3], name: "Phạm Thị D", gender: "female", dob: "1985", marital: "Đã kết hôn", img: "https://cdn-icons-png.flaticon.com/512/4140/4140051.png" }, // Vợ của C
      { id: 5, mid: 2, fid: 1, pids: [6], name: "Nguyễn Thị E", gender: "female", dob: "1988", marital: "Đã kết hôn", img: "https://cdn-icons-png.flaticon.com/512/4140/4140051.png" }, // Con gái
      { id: 6, pids: [5], name: "Lê Văn F", gender: "male", dob: "1983", marital: "Đã kết hôn", img: "https://cdn-icons-png.flaticon.com/512/4140/4140048.png" }, // Chồng của E

      // 3. THẾ HỆ CHÁU (Generation 3 - Con của C và D)
      { id: 7, mid: 4, fid: 3, name: "Nguyễn Văn G", gender: "male", dob: "2010", marital: "Độc thân", img: "https://cdn-icons-png.flaticon.com/512/4140/4140048.png" },
      { id: 8, mid: 4, fid: 3, name: "Nguyễn Thị H", gender: "female", dob: "2012", marital: "Độc thân", img: "https://cdn-icons-png.flaticon.com/512/4140/4140051.png" },

      // 4. THẾ HỆ CHÁU (Generation 3 - Con của E và F)
      { id: 9, mid: 5, fid: 6, name: "Lê Văn I", gender: "male", dob: "2015", marital: "Độc thân", img: "https://cdn-icons-png.flaticon.com/512/4140/4140048.png" },
      { id: 10, mid: 5, fid: 6, name: "Lê Thị K", gender: "female", dob: "2017", marital: "Độc thân", img: "https://cdn-icons-png.flaticon.com/512/4140/4140051.png" },
    ];
  }
};

// ======= GIAO DIỆN CHÍNH =======
const showSection = (id) => {
  document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");

  document.querySelectorAll(".menu-btn").forEach(b => b.classList.remove("active"));
  if (id === "treeArea") document.querySelector(".menu-btn:nth-child(1)").classList.add("active");
  if (id === "infoPanel") document.querySelector(".menu-btn:nth-child(2)").classList.add("active");
};

const openAddModal = () => {
  updateRelationOptions();
  document.getElementById("addModal").classList.add("active");
};
const closeAddModal = () => document.getElementById("addModal").classList.remove("active");

const createNewTree = () => {
  const name = prompt("Nhập tên cây gia phả mới:");
  if (!name) return;
  currentTreeName = name;
  members = [];
  saveFamilyData();
  loadFamilyData();
  initTree();
  alert(`🌱 Đã tạo cây mới: ${name}`);
};

const switchFamilyTree = (name) => {
  if (!name) return;
  currentTreeName = name;
  loadFamilyData();
  initTree();
};

// ======= THÊM, SỬA, XÓA =======
const nextId = () => (members.length ? Math.max(...members.map(m => m.id)) + 1 : 1);

const updateRelationOptions = () => {
  const select = document.getElementById("relationSelect");
  select.innerHTML = `<option value="">-- Chưa chọn --</option>`;
  members.forEach(m => {
    select.innerHTML += `<option value="child_${m.id}">Con của ${m.name}</option>`;
    select.innerHTML += `<option value="spouse_${m.id}">Vợ/Chồng của ${m.name}</option>`;
  });
};

const addMember = () => {
  const name = document.getElementById("nameInput").value.trim();
  if (!name) return alert("⚠️ Vui lòng nhập tên!");

  const gender = document.getElementById("genderInput").value;
  const dob = document.getElementById("dobInput").value.trim();
  const marital = document.getElementById("maritalInput").value;
  const phone = document.getElementById("phoneInput").value.trim();
  const relation = document.getElementById("relationSelect").value;
  const img = document.getElementById("imgInput").value.trim() ||
    (gender === "female"
      ? "https://cdn-icons-png.flaticon.com/512/4140/4140051.png"
      : "https://cdn-icons-png.flaticon.com/512/4140/4140048.png");

  const newMember = { id: nextId(), name, gender, dob, marital, phone, img };

  if (relation.startsWith("child_")) {
    const pid = +relation.split("_")[1];
    const parent = members.find(x => x.id === pid);
    if (parent) {
      if (parent.gender === "male") newMember.fid = parent.id;
      else newMember.mid = parent.id;
    }
  } else if (relation.startsWith("spouse_")) {
    const pid = +relation.split("_")[1];
    const partner = members.find(x => x.id === pid);
    if (partner) {
      newMember.pids = [pid];
      partner.pids = [...new Set([...(partner.pids || []), newMember.id])];
    }
  }

  members.push(newMember);
  saveFamilyData();
  tree ? tree.load(members) : initTree();
  closeAddModal();
  document.querySelectorAll("#addModal input").forEach(i => i.value = "");
};

const showMemberInfo = (m) => {
  const info = document.getElementById("memberInfo");
  info.innerHTML = `
    <div class="text-center">
      <img src="${m.img}" style="width:90px;height:90px;border-radius:50%;margin:auto">
      <p class="font-bold mt-2">${m.name}</p>
    </div>
    <p><b>Giới tính:</b> ${m.gender === "male" ? "Nam" : "Nữ"}</p>
    <p><b>Năm sinh:</b> ${m.dob || "Chưa rõ"}</p>
    <p><b>Hôn nhân:</b> ${m.marital || "Chưa rõ"}</p>
    <p><b>SĐT:</b> ${m.phone || "Chưa có"}</p>
    <div class="text-right mt-3">
      <button onclick="startEdit(${m.id})" class="btn-indigo mr-2">✏️ Sửa</button>
      <button onclick="deleteMember(${m.id})" class="btn-red">🗑️ Xóa</button>
    </div>`;
  document.getElementById("editMember").classList.add("hidden");
  showSection("infoPanel");
};

const startEdit = (id) => {
  const m = members.find(x => x.id === id);
  if (!m) return;
  editingMemberId = id;
  document.getElementById("editName").value = m.name;
  document.getElementById("editGender").value = m.gender;
  document.getElementById("editDob").value = m.dob || "";
  document.getElementById("editMarital").value = m.marital || "";
  document.getElementById("editPhone").value = m.phone || "";
  document.getElementById("editImg").value = m.img || "";
  document.getElementById("memberInfo").classList.add("hidden");
  document.getElementById("editMember").classList.remove("hidden");
};

const saveEdit = () => {
  const m = members.find(x => x.id === editingMemberId);
  if (!m) return;
  Object.assign(m, {
    name: document.getElementById("editName").value.trim(),
    gender: document.getElementById("editGender").value,
    dob: document.getElementById("editDob").value.trim(),
    marital: document.getElementById("editMarital").value.trim(),
    phone: document.getElementById("editPhone").value.trim(),
    img: document.getElementById("editImg").value.trim() || m.img
  });
  saveFamilyData();
  tree.load(members);
  showMemberInfo(m);
  alert("✅ Đã lưu thay đổi!");
};

const cancelEdit = () => {
  const m = members.find(x => x.id === editingMemberId);
  if (m) showMemberInfo(m);
  editingMemberId = null;
};

const deleteMember = (id) => {
  if (!confirm("❗ Xóa thành viên này?")) return;
  members = members.filter(x => x.id !== id);
  members.forEach(m => {
    if (m.fid === id) delete m.fid;
    if (m.mid === id) delete m.mid;
    if (Array.isArray(m.pids)) m.pids = m.pids.filter(pid => pid !== id);
  });
  saveFamilyData();
  tree.load(members);
  document.getElementById("memberInfo").innerHTML = "<p>🗑️ Đã xóa thành viên.</p>";
  document.getElementById("editMember").classList.add("hidden");
};

// ======= KHỞI TẠO CÂY =======
const initTree = () => {
  const el = document.getElementById("tree");
  if (!el) return;

  if (tree) return tree.load(members);

  tree = new FamilyTree(el, {
    template: "hugo",
    nodes: members,
    // Đảm bảo cây bắt đầu từ thành viên đầu tiên (Nguyễn Văn A - id: 1)
    roots: [members[0]?.id || 1], 
    nodeBinding: { field_0: "name", field_1: "dob", img_0: "img" }
  });

  tree.on("click", (sender, args) => {
    const m = members.find(x => x.id === args.node.id);
    if (m) showMemberInfo(m);
  });
};

// ==================== 🔍 TÌM KIẾM THÀNH VIÊN ====================
const searchMember = (keyword) => {
    // Nếu hàm được gọi từ onkeyup (không có tham số keyword), lấy giá trị từ input
    const finalValue = (keyword || document.getElementById("searchInput").value).trim().toLowerCase(); 

    if (!finalValue) {
        if (tree) tree.load(members);
        return;
    }
    const matched = members.filter(m => m.name.toLowerCase().includes(finalValue));
    if (!matched.length) {
        alert("❌ Không tìm thấy thành viên nào!");
        return;
    }
    // Tô sáng node đầu tiên khớp và hiển thị thông tin
    const found = matched[0];
    tree.center(found.id);
    showMemberInfo(found);
};