/*********
 * WebGL Shader Editor - CSP Compliant Version
 * Based on original by Matthias Hurrle (@atzedent)
 */
let editMode = false; // Set to false to hide the code editor on load
let resolution = 0.5; // Set 1 for full resolution or 0.5 for half resolution
let renderDelay = 1000; // Delay before rendering after changes (ms)
let dpr = Math.max(1, resolution * window.devicePixelRatio);
let frm, source, editor, store, renderer, pointers;
const shaderId = 'StarTrek';

// Initialize when window loads
window.onload = init;

function resize() {
  const { innerWidth: width, innerHeight: height } = window;
  const canvas = document.getElementById('canvas');
  
  if (!canvas) return;
  
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  if (renderer) {
    renderer.updateScale(dpr);
  }
}

function toggleView() {
  const btnToggleView = document.getElementById('btnToggleView');
  if (btnToggleView && editor) {
    editor.hidden = btnToggleView.checked;
  }
}

function reset() {
  let shader = source;
  editor.text = shader ? shader.textContent : renderer.defaultSource;
  store.putShaderSource(shaderId, editor.text);
  renderThis();
}

function toggleResolution() {
  const btnToggleResolution = document.getElementById('btnToggleResolution');
  if (btnToggleResolution) {
    resolution = btnToggleResolution.checked ? 0.5 : 1;
    dpr = Math.max(1, resolution * window.devicePixelRatio);
    pointers.updateScale(dpr);
    resize();
  }
}

function loop(now) {
  if (!renderer) return;
  
  renderer.updateMouse(pointers.first);
  renderer.updatePointerCount(pointers.count);
  renderer.updatePointerCoords(pointers.coords);
  renderer.updateMove(pointers.move);
  renderer.render(now);
  frm = requestAnimationFrame(loop);
}

function renderThis() {
  if (!editor || !renderer) return;
  
  editor.clearError();
  store.putShaderSource(shaderId, editor.text);

  const result = renderer.test(editor.text);

  if (result) {
    editor.setError(result);
  } else {
    renderer.updateShader(editor.text);
  }
  
  cancelAnimationFrame(frm);
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
  // Check for required elements
  const canvas = document.getElementById('canvas');
  const codeEditor = document.getElementById('codeEditor');
  const error = document.getElementById('error');
  const indicator = document.getElementById('indicator');
  
  if (!canvas || !codeEditor || !error || !indicator) {
    console.error('Required elements not found!');
    return;
  }

  // Initialize components
  source = document.querySelector("script[type='x-shader/x-fragment']");
  document.title = "🎢 Shader Editor";

  try {
    renderer = new Renderer(canvas, dpr);
    pointers = new PointerHandler(canvas, dpr);
    store = new Store(window.location);
    editor = new Editor(codeEditor, error, indicator);
    
    editor.text = source ? source.textContent : renderer.defaultSource;
    renderer.setup();
    renderer.init();

    // Set initial UI states
    const btnToggleView = document.getElementById('btnToggleView');
    const btnToggleResolution = document.getElementById('btnToggleResolution');
    
    if (btnToggleView && !editMode) {
      btnToggleView.checked = true;
      toggleView();
    }
    
    if (btnToggleResolution && resolution === 0.5) {
      btnToggleResolution.checked = true;
      toggleResolution();
    }

    // Event listeners
    canvas.addEventListener('shader-error', e => editor.setError(e.detail));
    window.addEventListener('resize', resize);
    window.addEventListener("keydown", e => {
      if (e.key === "L" && e.ctrlKey) {
        e.preventDefault();
        const btn = document.getElementById('btnToggleView');
        if (btn) {
          btn.checked = !btn.checked;
          toggleView();
        }
      }
    });

    // Initial render
    resize();
    
    if (renderer.test(source.textContent) === null) {
      renderer.updateShader(source.textContent);
    }
    
    loop(0);
  } catch (error) {
    console.error('Initialization error:', error);
    document.body.innerHTML = `<div style="color:red;padding:20px;">
      <h2>Initialization Error</h2>
      <p>${error.message}</p>
      <p>Check console for details</p>
    </div>`;
  }
}

class Renderer {
  #vertexSrc = `#version 300 es
precision highp float;
in vec4 position;
void main() { gl_Position = position; }`;

  #fragmtSrc = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
void main() {
  vec2 uv = gl_FragCoord.xy/resolution;
  O = vec4(uv, sin(time)*0.5+0.5, 1);
}`;

  #vertices = [-1, 1, -1, -1, 1, 1, 1, -1];

  constructor(canvas, scale) {
    if (!canvas) throw new Error('Canvas element required');
    
    this.canvas = canvas;
    this.scale = scale;
    this.gl = canvas.getContext("webgl2");
    
    if (!this.gl) {
      throw new Error('WebGL2 not supported in your browser');
    }
    
    this.gl.viewport(0, 0, canvas.width * scale, canvas.height * scale);
    this.shaderSource = this.#fragmtSrc;
    this.mouseMove = [0, 0];
    this.mouseCoords = [0, 0];
    this.pointerCoords = [0, 0];
    this.nbrOfPointers = 0;
  }

  get defaultSource() { return this.#fragmtSrc; }

  updateShader(source) {
    if (typeof source !== 'string') {
      console.error('Shader source must be a string');
      return;
    }
    
    this.reset();
    this.shaderSource = source;
    this.setup();
    this.init();
  }

  updateMove(deltas) {
    this.mouseMove = deltas;
  }

  updateMouse(coords) {
    this.mouseCoords = coords;
  }

  updatePointerCoords(coords) {
    this.pointerCoords = coords;
  }

  updatePointerCount(nbr) {
    this.nbrOfPointers = nbr;
  }

  updateScale(scale) {
    this.scale = scale;
    this.gl.viewport(0, 0, this.canvas.width * scale, this.canvas.height * scale);
  }

  compile(shader, source) {
    const gl = this.gl;
    
    // Basic CSP-compliant shader source validation
    const cleanSource = source
      .replace(/\/\/.*?\n/g, '\n') // Remove comments
      .replace(/\b(eval|Function)\s*\(/g, ''); // Remove eval-like patterns
    
    gl.shaderSource(shader, cleanSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader);
      console.error('Shader compile error:', error);
      this.canvas.dispatchEvent(new CustomEvent('shader-error', { 
        detail: error 
      }));
    }
  }

  test(source) {
    if (typeof source !== 'string') return 'Shader source must be a string';
    
    const gl = this.gl;
    const shader = gl.createShader(gl.FRAGMENT_SHADER);
    let result = null;
    
    try {
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        result = gl.getShaderInfoLog(shader);
      }
    } finally {
      if (gl.getShaderParameter(shader, gl.DELETE_STATUS)) {
        gl.deleteShader(shader);
      }
    }
    
    return result;
  }

  reset() {
    const { gl, program, vs, fs } = this;
    if (!program || gl.getProgramParameter(program, gl.DELETE_STATUS)) return;
    
    if (vs && !gl.getShaderParameter(vs, gl.DELETE_STATUS)) {
      gl.detachShader(program, vs);
      gl.deleteShader(vs);
    }
    
    if (fs && !gl.getShaderParameter(fs, gl.DELETE_STATUS)) {
      gl.detachShader(program, fs);
      gl.deleteShader(fs);
    }
    
    gl.deleteProgram(program);
  }

  setup() {
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
      const error = gl.getProgramInfoLog(this.program);
      console.error('Program link error:', error);
      throw new Error('Shader program failed to link');
    }
  }

  init() {
    const { gl, program } = this;
    
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.#vertices), gl.STATIC_DRAW);

    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    // Cache uniform locations
    this.uniforms = {
      resolution: gl.getUniformLocation(program, "resolution"),
      time: gl.getUniformLocation(program, "time"),
      move: gl.getUniformLocation(program, "move"),
      touch: gl.getUniformLocation(program, "touch"),
      pointerCount: gl.getUniformLocation(program, "pointerCount"),
      pointers: gl.getUniformLocation(program, "pointers")
    };
  }

  render(now = 0) {
    const { gl, program, buffer, canvas, uniforms } = this;
    const {
      mouseMove,
      mouseCoords,
      pointerCoords,
      nbrOfPointers
    } = this;
    
    if (!program || gl.getProgramParameter(program, gl.DELETE_STATUS)) return;

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    
    // Set uniforms
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.time, now * 1e-3);
    gl.uniform2f(uniforms.move, ...mouseMove);
    gl.uniform2f(uniforms.touch, ...mouseCoords);
    gl.uniform1i(uniforms.pointerCount, nbrOfPointers);
    gl.uniform2fv(uniforms.pointers, pointerCoords);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

class Store {
  constructor(key) {
    this.key = key;
    this.store = window.localStorage;
  }

  #ownShadersKey = 'ownShaders';
  #StorageType = Object.freeze({
    shader: 'fragmentSource',
    config: 'config'
  });

  #getKeyPrefix(type) {
    return `${type}${btoa(this.key)}`;
  }

  #getKey(type, name) {
    return `${this.#getKeyPrefix(type)}${btoa(name)}`;
  }

  putShaderSource(name, source) {
    try {
      const storageType = this.#StorageType.shader;
      this.store.setItem(this.#getKey(storageType, name), source);
    } catch (error) {
      console.error('Failed to store shader:', error);
    }
  }

  getShaderSource(name) {
    try {
      const storageType = this.#StorageType.shader;
      return this.store.getItem(this.#getKey(storageType, name));
    } catch (error) {
      console.error('Failed to retrieve shader:', error);
      return null;
    }
  }

  deleteShaderSource(name) {
    try {
      const storageType = this.#StorageType.shader;
      this.store.removeItem(this.#getKey(storageType, name));
    } catch (error) {
      console.error('Failed to delete shader:', error);
    }
  }

  getOwnShaders() {
    try {
      const storageType = this.#StorageType.config;
      const result = this.store.getItem(this.#getKey(storageType, this.#ownShadersKey));
      return result ? JSON.parse(result) : [];
    } catch (error) {
      console.error('Failed to get shader list:', error);
      return [];
    }
  }

  putOwnShader(shader) {
    try {
      const ownShaders = this.getOwnShaders();
      const storageType = this.#StorageType.config;
      const index = ownShaders.findIndex((s) => s.uuid === shader.uuid);
      
      if (index === -1) {
        ownShaders.push(shader);
      } else {
        ownShaders[index] = shader;
      }
      
      this.store.setItem(
        this.#getKey(storageType, this.#ownShadersKey),
        JSON.stringify(ownShaders)
      );
    } catch (error) {
      console.error('Failed to store shader metadata:', error);
    }
  }

  deleteOwnShader(uuid) {
    try {
      const ownShaders = this.getOwnShaders();
      const storageType = this.#StorageType.config;
      
      this.store.setItem(
        this.#getKey(storageType, this.#ownShadersKey),
        JSON.stringify(ownShaders.filter((s) => s.uuid !== uuid))
      );
      
      this.deleteShaderSource(uuid);
    } catch (error) {
      console.error('Failed to delete shader:', error);
    }
  }

  cleanup(keep = []) {
    try {
      const storageType = this.#StorageType.shader;
      const ownShaders = this.getOwnShaders().map((s) => this.#getKey(storageType, s.uuid));
      const premadeShaders = keep.map((name) => this.#getKey(storageType, name));
      const keysToKeep = [...ownShaders, ...premadeShaders];
      const result = [];

      for (let i = 0; i < this.store.length; i++) {
        const key = this.store.key(i);

        if (key.startsWith(this.#getKeyPrefix(this.#StorageType.shader)) && !keysToKeep.includes(key)) {
          result.push(key);
        }
      }

      result.forEach((key) => this.store.removeItem(key));
    } catch (error) {
      console.error('Failed to clean up storage:', error);
    }
  }
}

class PointerHandler {
  constructor(element, scale) {
    if (!element) throw new Error('Element required for PointerHandler');
    
    this.scale = scale;
    this.active = false;
    this.pointers = new Map();
    this.lastCoords = [0, 0];
    this.moves = [0, 0];
    
    const map = (element, scale, x, y) => [x * scale, element.height - y * scale];
    
    element.addEventListener("pointerdown", (e) => {
      this.active = true;
      this.pointers.set(e.pointerId, map(element, this.getScale(), e.clientX, e.clientY));
    });
    
    element.addEventListener("pointerup", (e) => {
      if (this.count === 1) {
        this.lastCoords = this.first;
      }
      this.pointers.delete(e.pointerId);
      this.active = this.pointers.size > 0;
    });
    
    element.addEventListener("pointerleave", (e) => {
      if (this.count === 1) {
        this.lastCoords = this.first;
      }
      this.pointers.delete(e.pointerId);
      this.active = this.pointers.size > 0;
    });
    
    element.addEventListener("pointermove", (e) => {
      if (!this.active) return;
      this.lastCoords = [e.clientX, e.clientY];
      this.pointers.set(e.pointerId, map(element, this.getScale(), e.clientX, e.clientY));
      this.moves = [this.moves[0] + e.movementX, this.moves[1] + e.movementY];
    });
  }

  getScale() {
    return this.scale;
  }

  updateScale(scale) { 
    this.scale = scale; 
  }

  reset() {
    this.pointers.clear();
    this.active = false;
    this.moves = [0, 0];
  }

  get count() {
    return this.pointers.size;
  }

  get move() {
    return this.moves;
  }

  get coords() {
    return this.pointers.size > 0 ? 
      Array.from(this.pointers.values()).flat() : 
      [0, 0];
  }

  get first() {
    return this.pointers.values().next().value || this.lastCoords;
  }
}

class Editor {
  constructor(textarea, errorfield, errorindicator) {
    if (!textarea || !errorfield || !errorindicator) {
      throw new Error('Editor requires textarea, errorfield and errorindicator');
    }
    
    this.textarea = textarea;
    this.errorfield = errorfield;
    this.errorindicator = errorindicator;
    
    textarea.addEventListener('keydown', this.handleKeydown.bind(this));
    textarea.addEventListener('scroll', this.handleScroll.bind(this));
  }

  get hidden() { 
    return this.textarea.classList.contains('hidden'); 
  }
  
  set hidden(value) { 
    value ? this.#hide() : this.#show(); 
  }
  
  get text() { 
    return this.textarea.value; 
  }
  
  set text(value) { 
    this.textarea.value = value; 
  }
  
  get scrollTop() { 
    return this.textarea.scrollTop; 
  }
  
  set scrollTop(value) { 
    this.textarea.scrollTop = value; 
  }

  setError(message) {
    if (!message) return;
    
    this.errorfield.textContent = message;
    this.errorfield.classList.add('opaque');
    
    const lineNumber = this.#extractLineNumber(message);
    const overlay = document.createElement('pre');
    overlay.classList.add('overlay');
    overlay.textContent = '\n'.repeat(lineNumber);
    
    document.body.appendChild(overlay);
    const offsetTop = parseInt(getComputedStyle(overlay).height);
    
    this.errorindicator.style.setProperty('--top', `${offsetTop}px`);
    this.errorindicator.style.visibility = 'visible';
    
    document.body.removeChild(overlay);
  }

  #extractLineNumber(message) {
    const match = message.match(/ERROR: \d+:(\d+):/);
    return match ? parseInt(match[1]) : 0;
  }

  clearError() {
    this.errorfield.textContent = '';
    this.errorfield.classList.remove('opaque');
    this.errorfield.blur();
    this.errorindicator.style.visibility = 'hidden';
  }

  focus() {
    this.textarea.focus();
  }

  #hide() {
    [this.errorindicator, this.errorfield, this.textarea].forEach(el => {
      if (el) el.classList.add('hidden');
    });
  }

  #show() {
    [this.errorindicator, this.errorfield, this.textarea].forEach(el => {
      if (el) el.classList.remove('hidden');
    });
    this.focus();
  }

  handleScroll() {
    this.errorindicator.style.setProperty('--scroll-top', `${this.textarea.scrollTop}px`);
  }

  handleKeydown(event) {
    if (!event) return;
    
    if (event.key === "Tab") {
      event.preventDefault();
      this.handleTabKey(event.shiftKey);
    } else if (event.key === "Enter") {
      event.preventDefault();
      this.handleEnterKey();
    }
  }

  handleTabKey(shiftPressed) {
    if (this.#getSelectedText() !== "") {
      shiftPressed ? this.#unindentSelectedText() : this.#indentSelectedText();
    } else {
      this.#indentAtCursor();
    }
  }

  #getSelectedText() {
    return this.textarea.value.substring(
      this.textarea.selectionStart,
      this.textarea.selectionEnd
    );
  }

  #indentAtCursor() {
    const cursorPos = this.textarea.selectionStart;
    document.execCommand('insertText', false, '\t');
    this.textarea.selectionStart = this.textarea.selectionEnd = cursorPos + 1;
  }

  #indentSelectedText() {
    const cursorPos = this.textarea.selectionStart;
    const selectedText = this.#getSelectedText();
    const indentedText = selectedText.split('\n').map(line => '\t' + line).join('\n');
    
    document.execCommand('insertText', false, indentedText);
    this.textarea.selectionStart = cursorPos;
  }

  #unindentSelectedText() {
    const cursorPos = this.textarea.selectionStart;
    const selectedText = this.#getSelectedText();
    const unindentedText = selectedText.split('\n')
      .map(line => line.replace(/^[\t ]/, ''))
      .join('\n');
    
    document.execCommand('insertText', false, unindentedText);
    this.textarea.selectionStart = cursorPos;
  }

  handleEnterKey() {
    const editor = this.textarea;
    const visibleTop = editor.scrollTop;
    const cursorPosition = editor.selectionStart;
    let start = cursorPosition - 1;
    
    while (start >= 0 && editor.value[start] !== '\n') {
      start--;
    }
    
    let newLine = '';
    while (start < cursorPosition - 1 && 
          (editor.value[start + 1] === ' ' || editor.value[start + 1] === '\t')) {
      newLine += editor.value[start + 1];
      start++;
    }
    
    document.execCommand('insertText', false, '\n' + newLine);
    editor.selectionStart = editor.selectionEnd = cursorPosition + 1 + newLine.length;
    editor.scrollTop = visibleTop;
    
    // Calculate scroll position
    const lineHeight = editor.scrollHeight / editor.value.split('\n').length;
    const line = editor.value.substring(0, cursorPosition).split('\n').length;
    const visibleBottom = editor.scrollTop + editor.clientHeight;
    const lineTop = lineHeight * (line - 1);
    const lineBottom = lineHeight * (line + 2);
    
    if (lineTop < visibleTop) editor.scrollTop = lineTop;
    if (lineBottom > visibleBottom) editor.scrollTop = lineBottom - editor.clientHeight;
  }
}