import { getSkillTranslation, skillTranslations } from "./skill_translation.js";
import { getTranslation } from "./translate.js";
import { forest } from "./data.js";
import "particles.js";

const TREE_KEY = "skillForest:levels";
const LANG_KEY = "talent:lang";
const stageWidth = 2560;
const stageHeight = 1600;
const maxZoom = 2.0;
const maxMargin = 10;
let minZoom = 0.5;

const state = {
  activeTree: "t1",
  levels: { t1: {}, t2: {}, t3: {} }, // toggles 0/1
  zoom: minZoom,
  pan: { x: 0, y: 0 },
  filter: "",
  lang: "ENG",
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const stage = $("#stage");
const edgesSvg = $("#edges");
const viewport = $("#viewport");
const hoverCard = $("#hoverCard");
const particles = $("#particles-js");

function currentTree() {
  return forest.trees.find((t) => t.id === state.activeTree);
}
function getTree(id) {
  return forest.trees.find((t) => t.id === id);
}
function currentLevels() {
  return state.levels[state.activeTree];
}

function sumPointsByTree(tree) {
  let total = 0;
  for (const id in state.levels[tree])
    if (state.levels[tree][id] > 0) total += 1;
  return total;
}

function sumPointsGlobal() {
  let total = 0;
  for (const t of forest.trees)
    for (const id in state.levels[t.id]) {
      const s = t.skills.find((x) => x.id === id);
      if (!s) continue;
      if (state.levels[t.id][id] > 0 && !s?.isSpecial) total += 1;
    }
  return total;
}

function sumPointsSpecial() {
  let total = 0;
  for (const t of forest.trees) {
    for (const id in state.levels[t.id]) {
      const s = t.skills.find((x) => x.id === id);
      if (!s) continue;
      if (state.levels[t.id][id] > 0 && s?.isSpecial) total += 1;
    }
  }
  return total;
}

function hasSomePrereqs(skill) {
  const lvls = currentLevels();
  return (skill.prereqs || []).some((id) => (lvls[id] || 0) > 0);
}

function isLocked(skill) {
  if ((skill.prereqs || []).length === 0) return false;
  return !hasSomePrereqs(skill);
}

function canIncrease(skill) {
  if (isLocked(skill)) return false;
  if (skill.isSpecial)
    return (
      sumPointsSpecial() < forest.maxSpecialPoints &&
      sumPointsByTree(state.activeTree) >= forest.pointsRequiredForSpecial
    );
  return sumPointsGlobal() < forest.maxPoints;
}

function canDecrease(skill) {
  const tree = currentTree();
  const lvls = currentLevels();

  const dependents = tree.skills.filter((x) =>
    (x.prereqs || []).includes(skill.id)
  );
  const localOk = dependents.every((dep) => {
    if (!lvls[dep.id]) return true;
    const others = (dep.prereqs || []).filter((p) => p !== skill.id);
    return others.some((p) => lvls[p]);
  });

  if (!localOk) return false;

  return isGraphConnectedAfterToggle(skill.id, false);
}

function isGraphConnectedAfterToggle(nodeId, willActivate) {
  // Clone current tree
  const tree = currentTree();
  const activeClone = { ...currentLevels() };
  activeClone[nodeId] = willActivate ? 1 : 0;

  // Get root node
  const roots = tree.skills.filter((n) => (n.prereqs || []).length === 0);
  if (roots.length === 0) return true;

  const visited = new Set();
  const queue = [...roots.map((r) => r.id)];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!activeClone[currentId] > 0) continue;
    visited.add(currentId);

    for (const s of tree.skills) {
      if ((s.prereqs || []).includes(currentId)) {
        if (activeClone[s.id] > 0 && !visited.has(s.id)) {
          queue.push(s.id);
        }
      }
    }
  }

  const activeNodes = Object.entries(activeClone)
    .filter(([_, v]) => v)
    .map(([id]) => id);

  return activeNodes.every((id) => visited.has(id));
}

function drawEdges() {
  while (edgesSvg.firstChild) edgesSvg.firstChild.remove();
  const tree = currentTree();
  const lvls = currentLevels();
  const drew = [];
  for (const s of tree.skills) {
    const prereqs = s.prereqs || [];
    const locked = isLocked(s);
    for (const p of prereqs) {
      const from = tree.skills.find((x) => x.id === p);
      if (!from) continue;
      if (
        drew.some(
          ([x, y]) =>
            (x === from.id && y === s.id) || (y === from.id && x === s.id)
        )
      )
        continue;
      drew.push([from.id, s.id]);

      const edgeLocked = locked || isLocked(from);

      const active = (lvls[p] || 0) > 0 && (lvls[s.id] || 0) > 0;
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path.setAttribute("d", `M ${from.x} ${from.y} L ${s.x} ${s.y}`);
      path.setAttribute(
        "class",
        "edge" + (edgeLocked ? " locked" : active ? " active" : "")
      );
      path.setAttribute("fill", "none");
      edgesSvg.appendChild(path);

      if (!edgeLocked) {
        const sparkPath = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );

        sparkPath.setAttribute("d", `M ${from.x} ${from.y} L ${s.x} ${s.y}`);
        sparkPath.setAttribute("fill", "none");
        sparkPath.setAttribute("stroke", active ? "#407fe6" : "#e1e2e3");
        sparkPath.setAttribute("stroke-width", active ? "4" : "3");
        sparkPath.setAttribute("stroke-linecap", "butt");
        sparkPath.setAttribute("filter", "url(#glow)");
        sparkPath.setAttribute("pathLength", "1");

        sparkPath.style.strokeDasharray = "0.25 1";
        sparkPath.style.strokeDashoffset = "0";
        sparkPath.style.animation =
          "pulse-move 1.2s ease-in-out infinite, delay-animation 2.4s ease-in-out infinite";

        edgesSvg.appendChild(sparkPath);
      }
    }
  }
}

function getNodeType(skill) {
  return skill.isSpecial ? "special" : skill.isStart ? "start" : "common";
}

function renderNodes() {
  $$(".node").forEach((n) => n.remove());
  const tree = currentTree();
  const lvls = currentLevels();
  for (const s of tree.skills) {
    if (state.filter) {
      const str = (s.name || "").toLowerCase();
      if (!str.includes(state.filter.toLowerCase())) continue;
    }
    const active = (lvls[s.id] || 0) > 0;
    const locked = isLocked(s);

    const wrapper = document.createElement("div");
    wrapper.className = "node";
    wrapper.style.left = s.x + "px";
    wrapper.style.top = s.y + "px";

    const dot = document.createElement("div");
    dot.className = "dot-node";
    dot.dataset.type = getNodeType(s, active);
    dot.dataset.state = active ? "active" : locked ? "locked" : "idle";
    dot.dataset.locked = locked ? "true" : "false";
    dot.setAttribute("role", "button");
    dot.setAttribute("tabindex", "0");

    dot.addEventListener("click", () => {
      toggleNode(s.id);
    });

    dot.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleNode(s.id);
      }
    });

    dot.addEventListener("mouseenter", (e) => showHoverCard(e, s));
    dot.addEventListener("mousemove", (e) => moveHoverCard(e));
    dot.addEventListener("mouseleave", hideHoverCard);

    wrapper.appendChild(dot);
    stage.appendChild(wrapper);
  }
}

function saveState() {
  localStorage.setItem(TREE_KEY, JSON.stringify(state.levels));
}

function toggleNode(id) {
  const tree = currentTree();
  const lvls = currentLevels();
  const s = tree.skills.find((x) => x.id === id);
  if (!s) return;
  const isActive = (lvls[id] || 0) > 0;
  if (isActive) {
    if (!canDecrease(s)) {
      pulse(
        "#buildStatus",
        getTranslation("dependent_talents_locked", state.lang)
      );
      return;
    }
    lvls[id] = 0;
  } else {
    if (!canIncrease(s)) {
      pulse("#buildStatus", getTranslation("talent_locked", state.lang));
      return;
    }
    lvls[id] = 1;
  }
  saveState();
  render();
}

function render() {
  $("#talent-points").textContent = `${sumPointsGlobal()}/${forest.maxPoints}`;
  $("#special-points").textContent = `${sumPointsSpecial()}/${
    forest.maxSpecialPoints
  }`;

  // Background + foreground
  const tree = currentTree();
  if (tree.background && tree.background.src) {
    stage.style.backgroundImage = `url(${tree.background.src})`;
    viewport.style.backgroundImage = `url(${tree.foreground?.src || ""})`;
  }

  // Edge + Nodes
  drawEdges();
  renderNodes();

  // Update stats + skills panel
  updateSkillsPanel();
  updateStatisticsPanel();

  // Tree Buttons
  $$("#tree1, #tree2, #tree3").forEach((b) => b.classList.remove("btn-active"));
  if (state.activeTree === "t1") $("#tree1").classList.add("btn-active");
  if (state.activeTree === "t2") $("#tree2").classList.add("btn-active");
  if (state.activeTree === "t3") $("#tree3").classList.add("btn-active");

  // LANG Buttons
  $$("#langESP, #langENG, #langBR").forEach((b) =>
    b.classList.remove("btn-active")
  );
  if (state.lang === "ESP") $("#langESP").classList.add("btn-active");
  if (state.lang === "ENG") $("#langENG").classList.add("btn-active");
  if (state.lang === "BR") $("#langBR").classList.add("btn-active");
}

function updateStatisticsPanel() {
  const tree = currentTree();
  const lvls = currentLevels();
  const panel = $("#statistics");
  panel.innerHTML = "";

  const activeSkills = tree.skills.filter((s) => (lvls[s.id] || 0) > 0);
  if (activeSkills.length === 0) {
    panel.innerHTML = `<p>${getTranslation("empty_tree", state.lang)}</p>`;
    return;
  }

  const stats = activeSkills.reduce((acc, skill) => {
    const key = skill.type;
    if (!acc[key]) {
      acc[key] = { ...skill, totalValue: 0 };
    }
    const val = parseFloat(skill.value) || 0;
    acc[key].totalValue += val;
    return acc;
  }, {});

  Object.values(stats).forEach((item) => {
    const translated = getSkillTranslation(item.type, state.lang);
    const statDiv = document.createElement("div");
    statDiv.className = "stat-entry";
    statDiv.innerHTML = `
            <div class="stat-info">
                <p class="stat-name">${translated.name || "Nodo"}</p>
                <p class="stat-desc">${translated.desc || "Desc"}</p>
            </div>
            <div class="stat-amount-badge">+${item.totalValue || "N/A"} ${
      item.unit
    }</div>
        `;
    panel.appendChild(statDiv);
  });
}

function updateSkillsPanel() {
  const panel = $("#skills");
  panel.innerHTML = "";

  const levels = state.levels;

  const tree = getTree("t1");
  const activeSkillsT1 = tree.skills
    .filter((s) => (levels["t1"][s.id] || 0) > 0)
    .map((s) => ({ ...s, tree: tree.name }));
  const tree2 = getTree("t2");
  const activeSkillsT2 = tree2.skills
    .filter((s) => (levels["t2"][s.id] || 0) > 0)
    .map((s) => ({ ...s, tree: tree2.name }));
  const tree3 = getTree("t3");
  const activeSkillsT3 = tree3.skills
    .filter((s) => (levels["t3"][s.id] || 0) > 0)
    .map((s) => ({ ...s, tree: tree3.name }));

  const activeSkills = activeSkillsT1
    .concat(activeSkillsT2)
    .concat(activeSkillsT3);
  if (activeSkills.length === 0) {
    panel.innerHTML = `<p>${getTranslation("empty_tree", state.lang)}</p>`;
    return;
  }

  const grouped = activeSkills.reduce((acc, skill) => {
    const key = skill.type;
    if (!acc[key]) acc[key] = { ...skill, count: 0 };

    acc[key].count += 1;

    if (acc[key].trees === undefined) acc[key].trees = [];

    if (!acc[key].trees.includes(skill.tree)) acc[key].trees.push(skill.tree);

    return acc;
  }, {});

  Object.entries(grouped).forEach(([_, item]) => {
    const translated = getSkillTranslation(item.type, state.lang);
    const skillDiv = document.createElement("div");
    skillDiv.className = "skill-entry";
    skillDiv.innerHTML = `
            <div class="inner-skill-info">
                <span class="skill-name">${translated.name || "Nodo"}</span>
                <div class="skill-count-badge">${item.count || 0} points</div>
            </div>
            <div class="skill-tree-badge ${
              item.trees.length > 2 ? "font-small" : "font-regular"
            } ">${item.trees.join(", ")}</div>
        `;
    panel.appendChild(skillDiv);
  });
}

// ---- Hover card
function showHoverCard(e, s) {
  const translated = getSkillTranslation(s.type, state.lang);
  hoverCard.innerHTML = `<div class="stat-amount-hover-badge">+${
    s.value || "N/A"
  } ${s.unit || ""}</div>
        <div class="hover-conteiner"><h4>${translated.name || "Nodo"}</h4>
        <div class="gradient-hover-bar"></div>
       <h6>${translated.desc || "Nodo"}</h6></div>`;
  hoverCard.style.display = "flex";
  moveHoverCard(e);
}

function moveHoverCard(e) {
  const offset = 14;
  hoverCard.style.left = `${e.clientX + offset + window.scrollX}px`;
  hoverCard.style.top = `${e.clientY + offset + window.scrollY}px`;
}

function hideHoverCard() {
  hoverCard.style.display = "none";
}

// ===== Cambiar idioma
function setLanguage(lang) {
  state.lang = lang;
  localStorage.setItem(LANG_KEY, lang);

  $("#reset").textContent = getTranslation("reset", lang);
  $("#start").textContent = getTranslation("start", lang);
  $("#special").textContent = getTranslation("special", lang);
  $("#active").textContent = getTranslation("active", lang);
  $("#inactive").textContent = getTranslation("inactive", lang);
  $("#points").textContent = getTranslation("points", lang);
  $("#talents-used").textContent = getTranslation("talents_used", lang);
  $("#stats").textContent = getTranslation("stats", lang);

  render();
}

function pulse(sel, text) {
  const el = $(sel);
  const prev = el.textContent;
  el.textContent = text;
  el.style.transition = "color .2s ease";
  el.style.color = "var(--text)";
  setTimeout(() => {
    el.style.color = "";
    el.textContent = prev;
  }, 2000);
}

// ---- Zoom & Pan
let isPanning = false;
let panStart = { x: 0, y: 0 };
let scrollStart = { x: 0, y: 0 };
let spaceHeld = false;

let initialDistance = 0;
let initialZoom = state.zoom;

viewport.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialDistance = Math.sqrt(dx * dx + dy * dy);
      initialZoom = state.zoom;
    }
  },
  { passive: false }
);

viewport.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);

      const scaleChange = currentDistance / initialDistance;
      const newZoom = Math.min(
        maxZoom,
        Math.max(minZoom, initialZoom * scaleChange)
      );

      // aplicar la misma lógica que ya tienes
      state.zoom = newZoom;
      stage.style.transform = `scale(${state.zoom})`;
      stage.style.transformOrigin = "0 0";

      const newVerticalMargin =
        state.zoom < 1 ? (stageHeight - stageHeight * state.zoom) / 2 : 0;
      const newHorizontalMargin =
        state.zoom < 1 ? (stageWidth - stageWidth * state.zoom) / 2 : 0;

      stage.style.marginLeft = `${newHorizontalMargin}px`;
      stage.style.marginTop = `${newVerticalMargin}px`;

      viewport.scrollLeft = lx * scale + newHorizontalMargin - vx;
      viewport.scrollTop = ly * scale + newVerticalMargin - vy;

      viewport.scrollLeft = Math.max(
        0,
        Math.min(
          viewport.scrollLeft,
          viewport.scrollWidth - viewport.clientWidth
        )
      );
      viewport.scrollTop = Math.max(
        0,
        Math.min(
          viewport.scrollTop,
          viewport.scrollHeight - viewport.clientHeight
        )
      );
    }
  },
  { passive: false }
);

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    spaceHeld = true;
    viewport.style.cursor = "grab";
  }
});
window.addEventListener("keyup", (e) => {
  if (e.code === "Space") {
    spaceHeld = false;
    viewport.style.cursor = "";
  }
});
viewport.addEventListener("mousedown", (e) => {
  if (!e.target.closest(".dot-node") && e.button === 0) {
    isPanning = true;
    panStart = { x: e.clientX, y: e.clientY };
    scrollStart = { x: viewport.scrollLeft, y: viewport.scrollTop };
    viewport.style.cursor = "grabbing";
    e.preventDefault();
  }
});

window.addEventListener("mouseup", () => {
  isPanning = false;
  viewport.style.cursor = "";
});
window.addEventListener("mousemove", (e) => {
  if (!isPanning) return;
  const dx = e.clientX - panStart.x;
  const dy = e.clientY - panStart.y;
  viewport.scrollLeft = scrollStart.x - dx;
  viewport.scrollTop = scrollStart.y - dy;
});

viewport.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const prevZoom = state.zoom;
    const delta = -Math.sign(e.deltaY) * 0.1;
    const newZoom = Math.min(maxZoom, Math.max(minZoom, state.zoom + delta));
    const rect = viewport.getBoundingClientRect();
    const scale = newZoom / prevZoom;

    const prevVerticalMargin =
      prevZoom < 1 ? (stageHeight - stageHeight * prevZoom) / 2 : 0;
    const prevHorizontalMargin =
      prevZoom < 1 ? (stageWidth - stageWidth * prevZoom) / 2 : 0;

    const vx = e.clientX - rect.left;
    const vy = e.clientY - rect.top;

    const lx = viewport.scrollLeft + vx - prevHorizontalMargin;
    const ly = viewport.scrollTop + vy - prevVerticalMargin;

    state.zoom = newZoom;
    stage.style.transform = `scale(${state.zoom})`;
    stage.style.transformOrigin = "0 0";

    const newVerticalMargin =
      state.zoom < 1 ? (stageHeight - stageHeight * state.zoom) / 2 : 0;
    const newHorizontalMargin =
      state.zoom < 1 ? (stageWidth - stageWidth * state.zoom) / 2 : 0;

    stage.style.marginLeft = `${newHorizontalMargin}px`;
    stage.style.marginTop = `${newVerticalMargin}px`;

    viewport.scrollLeft = lx * scale + newHorizontalMargin - vx;
    viewport.scrollTop = ly * scale + newVerticalMargin - vy;

    viewport.scrollLeft = Math.max(
      0,
      Math.min(viewport.scrollLeft, viewport.scrollWidth - viewport.clientWidth)
    );
    viewport.scrollTop = Math.max(
      0,
      Math.min(
        viewport.scrollTop,
        viewport.scrollHeight - viewport.clientHeight
      )
    );
  },
  { passive: false }
);

const observer = new ResizeObserver(() => {
  renderParticles();
});

observer.observe(viewport);

let last_width = 0;

const canvas_observer = new ResizeObserver(() => {
  const el = $("#canvasWrap");
  const aspectRatio = window.getComputedStyle(el).aspectRatio;
  console.log(`aspect: ` + aspectRatio);

  if (
    (aspectRatio !== undefined || aspectRatio !== "") &&
    aspectRatio !== "auto"
  ) {
    el.style.height = "auto";
    return;
  }

  console.log(`entro`);

  const width = el.offsetWidth;
  if (width === last_width) return;

  last_width = width;
  el.style.height = `${width}px`;
});

canvas_observer.observe($("#canvasWrap"));

function updateZoom() {
  stage.style.transform = `scale(${state.zoom})`;
  stage.style.transformOrigin = "0 0";

  const verticalLeft =
    state.zoom < 1 && screen.width > 768
      ? (stageHeight - stageHeight * state.zoom) / 2
      : 0;
  const horizontalLeft =
    state.zoom < 1 && screen.width > 768
      ? (stageWidth - stageWidth * state.zoom) / 2
      : 0;

  stage.style.marginLeft = `${horizontalLeft}px`;
  stage.style.marginTop = `${verticalLeft}px`;

  viewport.scrollLeft = horizontalLeft;
  viewport.scrollTop = verticalLeft;
}

function renderParticles() {
  particles.style.position = "";
  particles.style.pointerEvents = "";
  particlesJS.load("particles-js", "particles.json", function () {
    particles.style.position = "absolute";
    particles.style.pointerEvents = "none";
  });
}

$("#reset").addEventListener("click", () => {
  state.levels = { t1: {}, t2: {}, t3: {} };
  saveState();
  render();
});

// ---- Switch de árbol
$("#tree1").addEventListener("click", () => {
  state.activeTree = "t1";
  render();
});
$("#tree2").addEventListener("click", () => {
  state.activeTree = "t2";
  render();
});
$("#tree3").addEventListener("click", () => {
  state.activeTree = "t3";
  render();
});

$("#langESP").onclick = () => setLanguage("ESP");
$("#langENG").onclick = () => setLanguage("ENG");
$("#langBR").onclick = () => setLanguage("BR");

// ---- Inicio
(function init() {
  const saved = localStorage.getItem(TREE_KEY);
  if (saved) {
    try {
      state.levels = JSON.parse(saved) || state.levels;
    } catch (err) {}
  }

  const langSaved = localStorage.getItem(LANG_KEY);
  if (langSaved) {
    state.lang = langSaved;
  }
  setLanguage(state.lang);

  if (screen.width < 768) {
    state.zoom = 0.3;
    minZoom = 0.3;
  }

  render();
  updateZoom();
})();
