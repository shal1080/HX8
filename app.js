const $ = s => document.querySelector(s);
const pages = ["home","games","promotions","dashboard","profile","admin"];
let currentUser = null;
let authMode = "register";
const modal = $("#authModal");

function showToast(message) {
  const t = $("#toast"); t.textContent = message; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2600);
}
function showPage(name) {
  if (!pages.includes(name)) name = "home";
  if (["dashboard","profile","admin"].includes(name) && !currentUser) { openAuth("login"); return; }
  pages.forEach(p => $("#page-"+p)?.classList.toggle("active", p === name));
  document.querySelectorAll(".nav a").forEach(a => a.classList.toggle("active", a.dataset.page === name));
  if (name === "dashboard" || name === "profile") renderUser();
  if (name === "admin") loadAdmin();
  window.scrollTo({top:0, behavior:"smooth"});
}
function renderHeader() {
  const box = $("#headerActions");
  if (!currentUser) {
    box.innerHTML = '<button class="btn btn-ghost" data-open="login">Log in</button><button class="btn btn-primary" data-open="register">Join now</button>';
  } else {
    box.innerHTML = '<button class="btn btn-ghost" data-page="dashboard">My account</button><button class="btn btn-primary" data-page="profile">Profile</button>';
    if (currentUser.role === "admin") box.innerHTML += '<button class="btn btn-ghost" data-page="admin">Admin</button>';
  }
}
function renderUser() {
  if (!currentUser) return;
  $("#welcomeName").textContent = currentUser.username;
  $("#accountEmail").textContent = currentUser.email;
  $("#accountDate").textContent = currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : "Recently joined";
  $("#profileName").textContent = currentUser.username;
  $("#profileEmail").textContent = currentUser.email;
  $("#profileAvatar").textContent = currentUser.username.charAt(0).toUpperCase();
}
function openAuth(mode) {
  authMode = mode; $("#authForm").reset(); $("#formMessage").textContent = "";
  const registering = mode === "register";
  $("#modalTitle").textContent = registering ? "Create your account" : "Welcome back";
  $("#modalSub").textContent = registering ? "Join the HX8 member lounge." : "Log in to your HX8 account.";
  $("#usernameField").style.display = registering ? "block" : "none";
  $("#username").required = registering;
  $("#password").autocomplete = registering ? "new-password" : "current-password";
  $("#submitAuth").innerHTML = registering ? 'Create account <span>↗</span>' : 'Log in <span>↗</span>';
  $("#switchAuth").innerHTML = registering ? 'Already a member? <button type="button" data-switch="login">Log in</button>' : 'New to HX8? <button type="button" data-switch="register">Create account</button>';
  modal.classList.add("open"); modal.setAttribute("aria-hidden","false");
}
function closeAuth(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true")}
async function api(url, options={}) {
  const res = await fetch(url,{credentials:"same-origin",headers:{"Content-Type":"application/json"},...options});
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
async function loadAdmin() {
  const target = $("#userTable"); target.textContent = "Loading…";
  try {
    const {users} = await api("/api/admin/users");
    target.innerHTML = `<table><thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead><tbody>${users.map(u=>`<tr><td>${u.id}</td><td>${escapeHtml(u.username)}</td><td>${escapeHtml(u.email)}</td><td>${u.role}</td><td>${new Date(u.created_at).toLocaleDateString()}</td></tr>`).join("")}</tbody></table>`;
  } catch(e) { target.textContent = e.message; }
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

document.addEventListener("click", async e => {
  const pageLink = e.target.closest("[data-page]");
  const openLink = e.target.closest("[data-open]");
  const switchLink = e.target.closest("[data-switch]");
  const noticeLink = e.target.closest("[data-notice]");
  if (pageLink) { e.preventDefault(); showPage(pageLink.dataset.page); }
  if (openLink) openAuth(openLink.dataset.open);
  if (switchLink) openAuth(switchLink.dataset.switch);
  if (noticeLink) showToast(noticeLink.dataset.notice);
});
$("#closeModal").addEventListener("click",closeAuth);
modal.addEventListener("click",e=>{if(e.target===modal)closeAuth()});
$("#authForm").addEventListener("submit",async e=>{
  e.preventDefault(); const button=$("#submitAuth"); button.disabled=true; $("#formMessage").textContent="Please wait…";
  const payload={email:$("#email").value,password:$("#password").value};
  if(authMode==="register") payload.username=$("#username").value;
  try {
    const result=await api(authMode==="register"?"/api/register":"/api/login",{method:"POST",body:JSON.stringify(payload)});
    currentUser=result.user; renderHeader(); renderUser(); closeAuth(); showPage("dashboard"); showToast("You are now logged in.");
  } catch(err) { $("#formMessage").textContent=err.message; }
  finally {button.disabled=false;}
});
$("#logoutBtn").addEventListener("click",async()=>{try{await api("/api/logout",{method:"POST",body:"{}"});currentUser=null;renderHeader();showPage("home");showToast("You have logged out.");}catch(e){showToast(e.message)}});
(async()=>{
  $("#year").textContent=new Date().getFullYear();
  try { const data=await api("/api/me"); currentUser=data.user; } catch(e) {}
  renderHeader();
  if(currentUser) renderUser();
})();