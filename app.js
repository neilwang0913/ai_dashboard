// Edit this config to drive the whole dashboard.
const CONFIG = {
  stats: [["PRs reviewed", 128, "#5aa0f0"], ["Fix branches", 41, "#4cc9b0"], ["Real findings", 9, "#e0556a"], ["SDK runs", 3283, "#f5d98a"]],
  groups: [
    ["skills", 152, "#f08a5d"], ["pull requests", 154, "#5aa0f0"], ["issues", 155, "#f5e08a"],
    ["security", 157, "#e0556a"], ["sdk app", 158, "#4cc9b0"], ["cookbooks", 160, "#a78bfa"]
  ],
  tree: ["my-skill/", " ├ SKILL.md", " ├ scripts/", "   ├ fill_form.py", "   ├ check.py", " ├ references/", "   ├ api.md", "   ├ schema.md", " ├ assets/", "   ├ template.docx", " └ LICENSE.txt"],
  skillmd: "SKILL.md\n\nname: my-skill\ndescription: Fill + check\n  PDF forms. Use when...",
  prompt: "@agent fix the flaky checkout test",
  steps: ["tests", "lint", "build", "signature"],
  diff: [["", "def charge(cart, amount):"], ["del", "- q = f\"SELECT * FROM cards WHERE id={id}\""], ["add", "+ q = \"SELECT * FROM cards WHERE id=%s\""],
    ["", "token = request.args['token']"], ["add flag", "+ log.info(f'token {token}')"], ["", "if amount > LIMIT:"], ["add flag", "+   return redirect(request.args['next'])"]],
  findings: [["token written to logs", "HIGH"], ["open redirect via next=", "MED"]],
  code: `<b>triage.py</b>
from agent_sdk import query, AgentOptions

opts = AgentOptions(
    allowed_tools=["Read", "Grep"],
    hooks=my_hooks)

async for msg in query(
    prompt="triage open issues",
    options=opts):
    print(msg)`,
  stream: ["Bug on #482", "Billing issue #91", "Label: billing", "Grep 'log'", "Done: 41"],
  cards: [["Run", "#5aa0f0"], ["Tool use", "#f08a5d"], ["Classification", "#f5d98a"], ["Structured output", "#a78bfa"]],
  ticker: "pick one, add it to your repos tonight • bookmark it before it gets buried • skills • actions • security • sdk • cookbooks • "
};

const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Header stats, legend, tree, etc.
$("stats").innerHTML = CONFIG.stats.map(([l, v, c]) => `<div class="stat"><small>${l}</small><b style="color:${c}">${v.toLocaleString()}</b></div>`).join("");
$("legend").innerHTML = CONFIG.groups.map(([n, v, c]) => `<div><i style="background:${c}"></i>${n}<b>${v}</b></div>`).join("") + '<canvas id="spark"></canvas>';
$("tree").innerHTML = CONFIG.tree.map((t, i) => `<li${i === 2 ? ' class="sel"' : ""}>${t.replace(/ /g, "&nbsp;")}</li>`).join("");
$("skillmd").textContent = CONFIG.skillmd;
$("steps").innerHTML = CONFIG.steps.map(s => `<li><span>${s}</span><span>queued</span></li>`).join("");
$("line").innerHTML = "<i></i>".repeat(6).replace(/<i>/g, (_, i) => `<i style="left:${(i % 1)}"></i>`);
[...$("line").children].forEach((e, i) => e.style.left = i * 20 + "%");
$("diff").innerHTML = CONFIG.diff.map(([c, t]) => `<div class="${c}">${t.replace(/</g, "&lt;")}</div>`).join("");
$("code").innerHTML = CONFIG.code;
$("cards").innerHTML = CONFIG.cards.map(([n, c]) => `<div class="card" style="--cc:${c}">${n}${[0, 1, 2].map(() => '<div class="r"><i style="width:0"></i></div>').join("")}</div>`).join("");
$("ticker").textContent = CONFIG.ticker.repeat(4);

// Sparkline
(function spark() {
  const c = $("spark"), d = c.getContext("2d");
  c.width = c.clientWidth * 2; c.height = 80;
  for (let i = 0; i < 40; i++) {
    const h = 10 + Math.random() * 60;
    d.fillStyle = CONFIG.groups[i % 6][2];
    d.fillRect(i * (c.width / 40), 80 - h, c.width / 40 - 2, h);
  }
})();

// Force-directed graph
(function graph() {
  const cv = $("graph"), g = cv.getContext("2d");
  let W, H; const dpr = devicePixelRatio || 1;
  const resize = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  addEventListener("resize", resize); resize();
  const hubs = CONFIG.groups.map(([n, , c], i) => ({ n, c, x: W * (0.15 + 0.14 * i), y: H * (0.3 + 0.4 * ((i * 37) % 5) / 4), vx: 0, vy: 0, hub: 1, r: 5, g: i }));
  const core = { n: "@agent", c: "#f08a5d", x: W / 2, y: H / 2, vx: 0, vy: 0, core: 1, r: 9, g: 0 };
  const nodes = [core, ...hubs], links = hubs.map(h => [core, h]);
  hubs.forEach(h => { for (let i = 0; i < 45; i++) { const n = { c: h.c, x: h.x + (Math.random() - .5) * 150, y: h.y + (Math.random() - .5) * 150, vx: 0, vy: 0, r: 1.5 + Math.random() * 2.5, g: h.g }; nodes.push(n); links.push([h, n]); if (Math.random() < .3) links.push([n, nodes[1 + Math.floor(Math.random() * 6)]]); } });
  for (let i = 0; i < 120; i++) links.push([nodes[7 + Math.floor(Math.random() * (nodes.length - 7))], nodes[7 + Math.floor(Math.random() * (nodes.length - 7))]]);
  $("graphCount").textContent = `${nodes.length} NODES · ${links.length} LINKS`;
  let drag = null;
  cv.onmousemove = e => { const r = cv.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top; if (drag) { drag.x = x; drag.y = y; } };
  cv.onmousedown = e => { const r = cv.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top; drag = nodes.find(n => (n.hub || n.core) && Math.hypot(n.x - x, n.y - y) < 14) || null; };
  addEventListener("mouseup", () => drag = null);
  function step() {
    for (let i = 0; i < nodes.length; i++) { const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j += 3) { const b = nodes[j]; let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy + 30; if (d2 < 6000) { const f = 18 / d2; a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f; } }
      a.vx += (W / 2 - a.x) * 0.0004; a.vy += (H / 2 - a.y) * 0.0004; }
    for (const [a, b] of links) { const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - (a.hub || b.hub ? 70 : 110)) * 0.004; a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f; }
    for (const n of nodes) { if (n === drag) continue; n.vx *= .85; n.vy *= .85; n.x += n.vx; n.y += n.vy; }
  }
  function draw(t) {
    step(); g.clearRect(0, 0, W, H);
    g.lineWidth = .6;
    for (const [a, b] of links) { g.strokeStyle = a.c + "33"; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
    for (const n of nodes) { g.fillStyle = n.c; g.globalAlpha = n.hub || n.core ? 1 : .55 + .4 * Math.sin(t / 700 + n.x); g.beginPath(); g.arc(n.x, n.y, n.r, 0, 7); g.fill(); }
    g.globalAlpha = 1; g.font = "10px monospace"; g.textAlign = "center";
    for (const h of hubs) { const w = g.measureText(h.n).width + 16; g.fillStyle = "#0b0d13"; g.strokeStyle = h.c; g.beginPath(); g.roundRect(h.x - w / 2, h.y - 24, w, 16, 8); g.fill(); g.stroke(); g.fillStyle = h.c; g.fillText(h.n, h.x, h.y - 13); }
    g.strokeStyle = core.c; g.lineWidth = 2; g.beginPath(); g.arc(core.x, core.y, 12, 0, 7); g.stroke(); g.fillStyle = "#fff"; g.fillText("@agent", core.x, core.y + 28);
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();

// Animated panels (loop forever)
(async function loops() {
  setTimeout(() => { $("b1").style.width = "30%"; $("b2").style.width = "60%"; }, 300);
  document.querySelectorAll(".card .r i").forEach(i => setInterval(() => i.style.width = 20 + Math.random() * 80 + "px", 1800));
  const ft = $("findings"), st = $("stream"), li = [...$("steps").children], dots = [...$("line").children];
  const stream = $("stream");
  while (true) {
    ft.innerHTML = ""; stream.innerHTML = ""; $("msg").textContent = ""; li.forEach((l, i) => { l.className = ""; l.lastChild.textContent = "queued"; }); dots.forEach(d => d.className = "");
    for (const ch of CONFIG.prompt) { $("msg").textContent += ch; await sleep(40); }
    for (let i = 0; i < li.length; i++) { li[i].className = "run"; li[i].lastChild.textContent = "running"; dots[i]?.classList.add("on"); await sleep(900); li[i].className = "done"; li[i].lastChild.textContent = "passed"; }
    dots.forEach(d => d.classList.add("on"));
    for (const [t, s] of CONFIG.findings) { ft.insertAdjacentHTML("beforeend", `<div class="finding">${t}<small>${s}</small></div>`); await sleep(700); }
    for (const s of CONFIG.stream) { stream.insertAdjacentHTML("beforeend", `<div><span>text</span><span>${s}</span></div>`); await sleep(500); }
    await sleep(3000);
  }
})();
