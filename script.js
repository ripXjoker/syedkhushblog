// Original JavaScript provided by the user, with minor adjustments for robustness.
// Key settings for landing page:
// - `editMode = false` (already default)
// - `resolution = .5` (already default)
// UI elements like editor and controls will be hidden by CSS.

/*********
 * made by Matthias Hurrle (@atzedent)
 */
let editMode = false;
let resolution = 0.5;
let renderDelay = 1000;
let dpr = Math.max(1, resolution * window.devicePixelRatio);
let frm, source, editor, store, renderer, pointers;
const shaderId = 'Star Treck'; // Using the ID from your provided code

window.onload = init;

function resize() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  const { innerWidth: width, innerHeight: height } = window;
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  if (renderer) {
    renderer.updateScale(dpr);
  }
}

function toggleView() {
  const btnToggleViewEl = document.getElementById('btnToggleView');
  if (editor && btnToggleViewEl) {
    editor.hidden = btnToggleViewEl.checked;
  } else if (editor) {
    editor.hidden = true; // Default to hidden if button not found
  }
}

function reset() {
  const btnResetEl = document.getElementById('btnReset'); // Get the button
  if (!editor || !source || !renderer || !store || !btnResetEl) return;
  
  // Uncheck the reset button visually after action (it's a momentary action)
  // This assumes the button is a checkbox used as a momentary trigger
  if (btnResetEl.type === "checkbox") {
      btnResetEl.checked = false;
  }

  let shader = source;
  editor.text = shader ? shader.textContent : renderer.defaultSource;
  store.putShaderSource(shaderId, editor.text);
  renderThis();
}

function toggleResolution() {
  const btnToggleResolutionEl = document.getElementById('btnToggleResolution');
  if (!btnToggleResolutionEl || !pointers) return;

  resolution = btnToggleResolutionEl.checked ? 0.5 : 1;
  dpr = Math.max(1, resolution * window.devicePixelRatio);
  pointers.updateScale(dpr);
  resize();
}

function loop(now) {
  if (!renderer || !pointers) {
    // If essential components are missing, stop the loop.
    if (frm) cancelAnimationFrame(frm);
    return;
  }
  renderer.updateMouse(pointers.first);
  renderer.updatePointerCount(pointers.count);
  renderer.updatePointerCoords(pointers.coords);
  renderer.updateMove(pointers.move);
  renderer.render(now);
  frm = requestAnimationFrame(loop);
}

function renderThis() {
  if (!editor || !store || !renderer) return;

  editor.clearError();
  store.putShaderSource(shaderId, editor.text);
  const result = renderer.test(editor.text);

  if (result) {
    editor.setError(result);
  } else {
    renderer.updateShader(editor.text);
  }
  if (frm) cancelAnimationFrame(frm);
  loop(0);
}

const debounce = (fn, delay) => {
  let timerId;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn.apply(this, args), delay);
  };
};
const render = debounce(renderThis, renderDelay);

function init() {
  const canvas = document.getElementById('canvas');
  if (!canvas) {
    console.error("Canvas element not found! Aborting initialization.");
    document.body.innerHTML = "<p style='color:white; text-align:center; padding-top: 20px;'>Error: Canvas element is missing. Cannot render animation.</p>";
    return;
  }

  source = document.querySelector("script[type='x-shader/x-fragment']");
  if (!source || !source.textContent) {
    console.error("Shader script not found or is empty! Aborting initialization.");
    // Provide a fallback message on the page itself
    canvas.outerHTML = "<p style='color:white; text-align:center; padding-top: 20px;'>Error: Shader script is missing. Cannot render animation.</p>";
    return;
  }
  
  document.title = "SyedKhush";

  // Get handles to UI elements (even if hidden, JS might interact with their state)
  const codeEditorEl = document.getElementById('codeEditor');
  const errorEl = document.getElementById('error');
  const indicatorEl = document.getElementById('indicator');
  const btnToggleViewEl = document.getElementById('btnToggleView');
  const btnToggleResolutionEl = document.getElementById('btnToggleResolution');
  // btnReset is handled in its own function

  // Initialize core components
  try {
    renderer = new Renderer(canvas, dpr);
    if (!renderer.gl) { // Renderer constructor handles WebGL2 check
        // If renderer.gl is null, it means WebGL2 init failed. Message already shown by Renderer.
        return;
    }
    pointers = new PointerHandler(canvas, dpr);
    store = new Store(window.location); // Original uses window.location for Store key
    editor = new Editor(codeEditorEl, errorEl, indicatorEl); // Needs elements, even if hidden
  } catch (e) {
    console.error("Error initializing core components:", e);
    // Fallback message on the page
    canvas.outerHTML = `<p style='color:white; text-align:center; padding-top: 20px;'>An error occurred during initialization: ${e.message}. Cannot render animation.</p>`;
    return;
  }
  
  editor.text = source.textContent; // Load shader into editor object

  renderer.setup();
  renderer.init();

  // Set initial states for (hidden) controls
  if (btnToggleViewEl) {
    btnToggleViewEl.checked = !editMode; // If editMode is false, check the button (which means view mode, editor hidden)
    toggleView(); // Apply this state
  }

  if (btnToggleResolutionEl) {
    btnToggleResolutionEl.checked = (resolution === 0.5); // If resolution is 0.5, check the button
    toggleResolution(); // Apply this state
  }
  
  canvas.addEventListener('shader-error', e => {
    if (editor) editor.setError(e.detail);
  });

  resize(); // Initial resize

  // Test and load the main shader
  if (renderer.test(source.textContent) === null) {
    renderer.updateShader(source.textContent);
  } else {
    console.error("Initial shader test failed. Check shader code.");
    // Fallback message on the page
    canvas.outerHTML = "<p style='color:white; text-align:center; padding-top: 20px;'>Error: Shader compilation failed. Cannot render animation.</p>";
    return; // Stop if shader is bad
  }

  loop(0); // Start animation loop
  window.onresize = resize;

  // Optional: Developer shortcut to toggle editor view (Ctrl+L can be problematic in browsers)
  // window.addEventListener("keydown", e => {
  //   if (e.key === "D" && e.ctrlKey && e.altKey) { // Example: Ctrl+Alt+D
  //     e.preventDefault();
  //     if (btnToggleViewEl) {
  //       btnToggleViewEl.checked = !btnToggleViewEl.checked;
  //       toggleView();
  //       // Also toggle visibility of controls and other UI if unhiding editor
  //       const uiElements = [codeEditorEl, errorEl, indicatorEl, document.getElementById('controls')];
  //       uiElements.forEach(el => {
  //           if (el) el.style.display = btnToggleViewEl.checked ? 'none' : ''; // crude toggle
  //       });
  //     }
  //   }
  // });
}

class Renderer {
  #vertexSrc = "#version 300 es\nprecision highp float;\nin vec4 position;\nvoid main(){gl_Position=position;}";
  #fragmtSrc = "#version 300 es\nprecision highp float;\nout vec4 O;\nuniform float time;\nuniform vec2 resolution;\nvoid main() {\n\tvec2 uv=gl_FragCoord.xy/resolution;\n\tO=vec4(uv,sin(time)*.5+.5,1);\n}";
  #vertices = [-1, 1, -1, -1, 1, 1, 1, -1];
  constructor(canvas, scale) {
    this.canvas = canvas;
    this.scale = scale;
    if (!this.canvas) {
        console.error("Renderer: Canvas element not provided.");
        this.gl = null; return;
    }
    this.gl = this.canvas.getContext("webgl2");
    if (!this.gl) {
        console.error("WebGL2 not supported or context creation failed.");
        this.canvas.outerHTML = "<p style='color:white; text-align:center; padding-top: 20px;'>This page requires WebGL2. Please enable it or use a compatible browser.</p>";
        return;
    }
    this.gl.viewport(0, 0, this.canvas.width * this.scale, this.canvas.height * this.scale);
    this.shaderSource = this.#fragmtSrc; // Default
    this.mouseMove = [0, 0];
    this.mouseCoords = [0, 0];
    this.pointerCoords = [0, 0];
    this.nbrOfPointers = 0;
  }
  get defaultSource() { return this.#fragmtSrc; }
  updateShader(source) {
    if (!this.gl) return;
    this.reset();
    this.shaderSource = source;
    this.setup();
    this.init();
  }
  updateMove(deltas) { this.mouseMove = deltas; }
  updateMouse(coords) { this.mouseCoords = coords; }
  updatePointerCoords(coords) { this.pointerCoords = coords; }
  updatePointerCount(nbr) { this.nbrOfPointers = nbr; }
  updateScale(scale) {
    if (!this.gl) return;
    this.scale = scale;
    if (this.canvas) { // Check canvas exists
        this.gl.viewport(0, 0, this.canvas.width * this.scale, this.canvas.height * this.scale);
    }
  }
  compile(shader, source) {
    if (!this.gl) return;
    const gl = this.gl;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
      if (this.canvas) this.canvas.dispatchEvent(new CustomEvent('shader-error', { detail: gl.getShaderInfoLog(shader) }));
    }
  }
  test(source) {
    if (!this.gl) return "WebGL context not available.";
    const gl = this.gl;
    const shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    let result = null;
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      result = gl.getShaderInfoLog(shader);
    }
    gl.deleteShader(shader); // Important: delete temporary shader
    return result;
  }
  reset() {
    if (!this.gl) return;
    const { gl, program, vs, fs } = this;
    if (program && gl.isProgram(program)) {
        if (vs && gl.isShader(vs)) { gl.detachShader(program, vs); gl.deleteShader(vs); }
        if (fs && gl.isShader(fs)) { gl.detachShader(program, fs); gl.deleteShader(fs); }
        gl.deleteProgram(program);
    }
    this.program = null; this.vs = null; this.fs = null;
  }
  setup() {
    if (!this.gl) return;
    const gl = this.gl;
    this.vs = gl.createShader(gl.VERTEX_SHADER);
    this.fs = gl.createShader(gl.FRAGMENT_SHADER);
    this.compile(this.vs, this.#vertexSrc);
    this.compile(this.fs, this.shaderSource);
    this.program = gl.createProgram();
    gl.attachShader(this.program, this.vs);
    gl.attachShader(this.program, this.fs);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error("Program linking error:", gl.getProgramInfoLog(this.program));
    }
  }
  init() {
    if (!this.gl || !this.program) return;
    const { gl, program } = this;
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.#vertices), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    program.resolution = gl.getUniformLocation(program, "resolution");
    program.time = gl.getUniformLocation(program, "time");
    program.move = gl.getUniformLocation(program, "move");
    program.touch = gl.getUniformLocation(program, "touch");
    program.pointerCount = gl.getUniformLocation(program, "pointerCount");
    program.pointers = gl.getUniformLocation(program, "pointers");
  }
  render(now = 0) {
    if (!this.gl || !this.program || !this.canvas || gl.getProgramParameter(this.program, gl.DELETE_STATUS)) return;
    const { gl, program, buffer, canvas, mouseMove, mouseCoords, pointerCoords, nbrOfPointers } = this;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.uniform2f(program.resolution, canvas.width, canvas.height);
    gl.uniform1f(program.time, now * 1e-3);
    gl.uniform2f(program.move, ...mouseMove);
    gl.uniform2f(program.touch, ...mouseCoords);
    gl.uniform1i(program.pointerCount, nbrOfPointers);
    gl.uniform2fv(program.pointers, pointerCoords);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

class Store {
  constructor(locationObj) {
    // Using a fixed key name for simplicity as this isn't a multi-shader platform anymore
    this.baseKey = `syedkhush_shader_store_`; 
    this.store = window.localStorage;
  }
  #ownShadersKey = 'ownShadersList'; // Unique key for the list of shaders
  #StorageType = Object.freeze({ shader: 'fragmentSource', config: 'config' });

  #getKey(type, name) {
    // Use a simple combination, btoa can be problematic with non-ASCII names
    return `${this.baseKey}${type}_${name.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  }
  putShaderSource(name, source) {
    try {
      this.store.setItem(this.#getKey(this.#StorageType.shader, name), source);
    } catch (e) { console.error("LocalStorage Error (putShaderSource):", e); }
  }
  getShaderSource(name) {
    try {
      return this.store.getItem(this.#getKey(this.#StorageType.shader, name));
    } catch (e) { console.error("LocalStorage Error (getShaderSource):", e); return null; }
  }
  // The following methods (deleteShaderSource, getOwnShaders, etc.) are part of the original
  // CodePen's shader management system. They are less relevant for a single landing page
  // but are kept to ensure the `Store` class behaves as expected by other parts of the code.
  deleteShaderSource(name) {
    try { this.store.removeItem(this.#getKey(this.#StorageType.shader, name)); }
    catch (e) { console.error("LocalStorage Error (deleteShaderSource):", e); }
  }
  getOwnShaders() {
    try {
      const result = this.store.getItem(this.#getKey(this.#StorageType.config, this.#ownShadersKey));
      return result ? JSON.parse(result) : [];
    } catch (e) { console.error("LocalStorage Error (getOwnShaders):", e); return []; }
  }
  putOwnShader(shader) { // shader is {title:string, uuid:string}
    const ownShaders = this.getOwnShaders();
    const index = ownShaders.findIndex((s) => s.uuid === shader.uuid);
    if (index === -1) ownShaders.push(shader);
    else ownShaders[index] = shader;
    try { this.store.setItem(this.#getKey(this.#StorageType.config, this.#ownShadersKey), JSON.stringify(ownShaders)); }
    catch (e) { console.error("LocalStorage Error (putOwnShader):", e); }
  }
  deleteOwnShader(uuid) {
    let ownShaders = this.getOwnShaders();
    ownShaders = ownShaders.filter((s) => s.uuid !== uuid);
    try {
      this.store.setItem(this.#getKey(this.#StorageType.config, this.#ownShadersKey), JSON.stringify(ownShaders));
      this.deleteShaderSource(uuid); // Also delete the shader source
    } catch (e) { console.error("LocalStorage Error (deleteOwnShader):", e); }
  }
  cleanup(keep = []) { // keep is array of shader names (uuids) to preserve
    const ownShaderKeysToKeep = this.getOwnShaders().map(s => this.#getKey(this.#StorageType.shader, s.uuid));
    const explicitlyKeptKeys = keep.map(name => this.#getKey(this.#StorageType.shader, name));
    const allKeysToKeep = new Set([...ownShaderKeysToKeep, ...explicitlyKeptKeys]);
    const keysToRemove = [];
    for (let i = 0; i < this.store.length; i++) {
      const key = this.store.key(i);
      // Check if key starts with our base shader prefix and is not in keysToKeep
      if (key && key.startsWith(this.baseKey + this.#StorageType.shader) && !allKeysToKeep.has(key)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => this.store.removeItem(key));
  }
}

class PointerHandler {
  constructor(element, scale) {
    this.scale = scale;
    this.active = false;
    this.pointers = new Map();
    this.lastCoords = [0, 0]; // Last known coordinate of a single pointer (already scaled)
    this.moves = [0, 0];      // Accumulated raw mouse/touch movement (movementX/Y)

    if (!element) { console.error("PointerHandler: element is null."); return; }

    const mapCoords = (clientX, clientY) => {
        const rect = element.getBoundingClientRect();
        // Map clientX/Y (viewport relative) to canvas texture coordinates (origin bottom-left for shader)
        // The shader typically expects (0,0) at bottom-left and (canvas.width, canvas.height) at top-right.
        // element.height is the physical pixel height.
        return [
            (clientX - rect.left) * this.scale, 
            (element.height - (clientY - rect.top) * this.scale) // Invert Y and scale
        ];
    };
    
    element.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.active = true;
      this.pointers.set(e.pointerId, mapCoords(e.clientX, e.clientY));
    });
    const onPointerEnd = (e) => { // Common handler for up, leave, cancel
      if (this.pointers.has(e.pointerId)) {
        if (this.pointers.size === 1) { // If this was the last pointer
            this.lastCoords = this.pointers.get(e.pointerId); // Capture its final (mapped) position
        }
        this.pointers.delete(e.pointerId);
      }
      this.active = this.pointers.size > 0;
    };
    element.addEventListener("pointerup", onPointerEnd);
    element.addEventListener("pointerleave", onPointerEnd);
    element.addEventListener("pointercancel", onPointerEnd); // Good practice to handle cancel

    element.addEventListener("pointermove", (e) => {
      if (!this.active || !this.pointers.has(e.pointerId)) return;
      this.pointers.set(e.pointerId, mapCoords(e.clientX, e.clientY));
      // Accumulate raw deltas; shader might use this for effects like camera drift
      this.moves = [this.moves[0] + e.movementX, this.moves[1] + e.movementY];
    });
  }
  getScale() { return this.scale; }
  updateScale(scale) { this.scale = scale; }
  reset() {
    this.pointers.clear();
    this.active = false;
    this.moves = [0, 0];
    this.lastCoords = [0, 0];
  }
  get count() { return this.pointers.size; }
  get move() {
    const currentMove = [...this.moves];
    // Optional: reset moves if shader expects per-frame delta. Original implies accumulation.
    // this.moves = [0,0]; 
    return currentMove;
  }
  get coords() { // Flat array of all active pointer coords [x1,y1,x2,y2,...]
    return this.pointers.size > 0 ? Array.from(this.pointers.values()).flat() : [0, 0];
  }
  get first() { // Coords of the first active pointer, or last known single pointer coord
    return this.pointers.size > 0 ? this.pointers.values().next().value : this.lastCoords;
  }
}

class Editor {
  constructor(textarea, errorfield, errorindicator) {
    this.textarea = textarea;
    this.errorfield = errorfield;
    this.errorindicator = errorindicator;
    // Only add listeners if elements exist (they are hidden, but JS needs them)
    if (this.textarea) {
        this.textarea.addEventListener('keydown', this.handleKeydown.bind(this));
        this.textarea.addEventListener('scroll', this.handleScroll.bind(this));
    }
  }
  get hidden() { return this.textarea ? this.textarea.classList.contains('hidden') : true; }
  set hidden(value) {
    // This controls the internal 'hidden' state of the editor object and its associated elements.
    // CSS `display:none !important` will ultimately control visibility for the landing page.
    if (value) this.#hide(); else this.#show();
  }
  get text() { return this.textarea ? this.textarea.value : ""; }
  set text(value) { if (this.textarea) this.textarea.value = value; }
  get scrollTop() { return this.textarea ? this.textarea.scrollTop : 0; }
  set scrollTop(value) { if (this.textarea) this.textarea.scrollTop = value; }

  setError(message) {
    if (!this.errorfield || !this.errorindicator) return;
    this.errorfield.innerHTML = message;
    this.errorfield.classList.add('opaque');
    const match = message.match(/ERROR: \d+:(\d+):/); // Extracts line number for error
    const lineNumber = match ? parseInt(match[1], 10) : 0;
    
    // The overlay logic is for placing an indicator next to the error line in the editor.
    // Since the editor is hidden, this visual cue is not seen, but the logic can remain.
    if (document.body && typeof getComputedStyle === 'function') {
        const overlay = document.createElement('pre');
        overlay.className = 'overlay'; // Ensure this class exists and is styled (hidden in our case)
        overlay.textContent = '\n'.repeat(Math.max(0, lineNumber -1 )); //lineNumber is 1-based
        document.body.appendChild(overlay);
        try { // getComputedStyle can throw if element is detached or in weird state
            const style = getComputedStyle(overlay);
            const offsetTop = parseInt(style.height, 10) || 0; // Use height for vertical offset
            this.errorindicator.style.setProperty('--top', offsetTop + 'px');
        } catch(e) { console.warn("Could not get computed style for error overlay:", e); }
        document.body.removeChild(overlay);
    }
    this.errorindicator.style.visibility = 'visible';
  }
  clearError() {
    if (!this.errorfield || !this.errorindicator) return;
    this.errorfield.textContent = '';
    this.errorfield.classList.remove('opaque');
    if (typeof this.errorfield.blur === 'function') this.errorfield.blur();
    this.errorindicator.style.visibility = 'hidden';
  }
  focus() { if (this.textarea && typeof this.textarea.focus === 'function') this.textarea.focus(); }
  #hide() {
    if (this.errorindicator) this.errorindicator.classList.add('hidden');
    if (this.errorfield) this.errorfield.classList.add('hidden');
    if (this.textarea) this.textarea.classList.add('hidden');
  }
  #show() { // For developer mode if one wants to unhide editor via console/shortcut
    if (this.errorindicator) this.errorindicator.classList.remove('hidden');
    if (this.errorfield) this.errorfield.classList.remove('hidden');
    if (this.textarea) this.textarea.classList.remove('hidden');
    this.focus();
  }
  handleScroll() {
    if (this.errorindicator && this.textarea) {
      this.errorindicator.style.setProperty('--scroll-top', `${this.textarea.scrollTop}px`);
    }
  }
  // Editor keydown handlers (Tab, Enter) - less relevant when editor is hidden
  handleKeydown(event) {
    if (!this.textarea || typeof document.execCommand !== 'function') return;
    if (event.key === "Tab") { event.preventDefault(); this.handleTabKey(event.shiftKey); }
    else if (event.key === "Enter") { event.preventDefault(); this.handleEnterKey(); }
  }
  handleTabKey(shiftPressed) {
    if (this.#getSelectedText() !== "") {
      if (shiftPressed) this.#unindentSelectedText(); else this.#indentSelectedText();
    } else this.#indentAtCursor();
  }
  #getSelectedText() {
    const editor = this.textarea;
    return editor ? editor.value.substring(editor.selectionStart, editor.selectionEnd) : "";
  }
  #indentAtCursor() {
    const editor = this.textarea; if (!editor) return;
    const cursorPos = editor.selectionStart;
    document.execCommand('insertText', false, '\t');
    editor.selectionStart = editor.selectionEnd = cursorPos + 1;
  }
  #indentSelectedText() {
    const editor = this.textarea; if (!editor) return;
    const cursorPos = editor.selectionStart;
    const selectedText = this.#getSelectedText();
    const lines = selectedText.split('\n');
    const indentedText = lines.map(line => '\t' + line).join('\n');
    document.execCommand('insertText', false, indentedText);
    editor.selectionStart = cursorPos;
  }
  #unindentSelectedText() {
    const editor = this.textarea; if (!editor) return;
    const cursorPos = editor.selectionStart;
    const selectedText = this.#getSelectedText();
    const lines = selectedText.split('\n');
    const unindentedText = lines.map(line => line.replace(/^\t/, '').replace(/^ /, '')).join('\n');
    document.execCommand('insertText', false, unindentedText);
    editor.selectionStart = cursorPos;
  }
  handleEnterKey() {
    const editor = this.textarea; if (!editor) return;
    const visibleTop = editor.scrollTop;
    const cursorPosition = editor.selectionStart;
    let lineStartPos = editor.value.lastIndexOf('\n', cursorPosition - 1) + 1;
    let currentLine = editor.value.substring(lineStartPos, cursorPosition);
    let matchIndent = currentLine.match(/^\s*/);
    let indent = matchIndent ? matchIndent[0] : "";
    document.execCommand('insertText', false, '\n' + indent);
    editor.selectionStart = editor.selectionEnd = cursorPosition + 1 + indent.length;
    editor.scrollTop = visibleTop; // Try to maintain scroll position
    // Auto-scroll logic (simplified)
    if (editor.value && editor.scrollHeight > 0 && editor.clientHeight > 0) {
        const numLines = (editor.value.match(/\n/g) || []).length + 1;
        const lineHeight = editor.scrollHeight / numLines;
        const currentLineNum = (editor.value.substring(0, editor.selectionStart).match(/\n/g) || []).length + 1;
        const cursorY = currentLineNum * lineHeight;
        if (cursorY < editor.scrollTop) editor.scrollTop = cursorY - lineHeight;
        if (cursorY > editor.scrollTop + editor.clientHeight - lineHeight) editor.scrollTop = cursorY - editor.clientHeight + lineHeight;
    }
  }
}