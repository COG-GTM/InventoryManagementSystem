import './style.css';
import {
  Inventory,
  Part,
  Product,
  companyOrMachine,
  searchParts,
  searchProducts,
  validateItem,
  FieldValues,
} from './model';

const inv = new Inventory();

// Currently displayed (possibly filtered) rows + selection, mirroring the
// two DataGridViews on MainScreen.
let partsView: Part[] = inv.allParts;
let productsView: Product[] = inv.products;
let selectedPartId: number | null = null;
let selectedProductId: number | null = null;

const app = document.getElementById('app')!;

const money = (n: number): string =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node, props);
  for (const c of children) node.append(typeof c === 'string' ? document.createTextNode(c) : c);
  return node;
}

function render(): void {
  partsView = inv.allParts;
  productsView = inv.products;
  app.replaceChildren(header(), panels());
}

function header(): HTMLElement {
  return el('header', { className: 'app-header' }, [
    el('div', { className: 'logo', textContent: 'IM' }),
    el('div', {}, [
      el('h1', { textContent: 'Inventory Management System' }),
      el('p', { textContent: 'Parts & products manager — migrated from the legacy Windows desktop app' }),
    ]),
  ]);
}

function panels(): HTMLElement {
  return el('div', { className: 'panels' }, [partsPanel(), productsPanel()]);
}

// ---- Parts panel ----------------------------------------------------------
function partsPanel(): HTMLElement {
  const searchInput = el('input', { type: 'text', placeholder: 'Search parts…' });
  const runSearch = () => {
    const result = searchParts(inv.allParts, searchInput.value);
    if (searchInput.value.trim() !== '' && result.length === 0) {
      alert('Nothing found.');
      partsView = inv.allParts;
    } else {
      partsView = result;
    }
    selectedPartId = null;
    app.replaceChildren(header(), panels());
    (document.querySelector('.panels .panel input') as HTMLInputElement)?.focus();
  };
  searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') runSearch(); });

  const table = el('table', {}, [
    el('thead', {}, [
      row(['ID', 'Name', 'Type', 'Company / Machine ID', 'In Stock', 'Price'], true),
    ]),
    partsBody(),
  ]);

  return el('section', { className: 'panel' }, [
    el('div', { className: 'panel-head' }, [
      el('h2', { textContent: 'Parts' }),
      el('div', { className: 'search' }, [
        searchInput,
        el('button', { className: 'btn-secondary', textContent: 'Search', onclick: runSearch }),
      ]),
    ]),
    table,
    el('div', { className: 'panel-actions' }, [
      el('button', { className: 'btn-primary', textContent: 'Add', onclick: () => openPartModal('add') }),
      el('button', { className: 'btn-secondary', textContent: 'Modify', onclick: modifyPart }),
      el('button', { className: 'btn-danger', textContent: 'Delete', onclick: deletePart }),
    ]),
  ]);
}

function partsBody(): HTMLElement {
  const body = el('tbody');
  if (partsView.length === 0) {
    body.append(el('tr', { className: 'empty-row' }, [el('td', { colSpan: 6, textContent: 'No parts' })]));
    return body;
  }
  for (const p of partsView) {
    const tr = el('tr', { className: p.partId === selectedPartId ? 'selected' : '' }, [
      td(String(p.partId), 'num'),
      td(p.name),
      td('', '', [el('span', { className: `tag ${p.kind}`, textContent: p.kind === 'inhouse' ? 'In-House' : 'Outsourced' })]),
      td(companyOrMachine(p)),
      td(String(p.inStock), 'num'),
      td(money(p.price), 'num'),
    ]);
    tr.addEventListener('click', () => {
      selectedPartId = p.partId;
      app.replaceChildren(header(), panels());
    });
    body.append(tr);
  }
  return body;
}

function modifyPart(): void {
  const part = selectedPartId != null ? inv.lookupPart(selectedPartId) : null;
  if (!part) { alert('Nothing Selected! Please make a selection.'); return; }
  openPartModal('modify', part);
}

function deletePart(): void {
  const part = selectedPartId != null ? inv.lookupPart(selectedPartId) : null;
  if (!part) { alert('Nothing Selected! Please make a selection.'); return; }
  if (confirm('Are You Sure?')) {
    inv.deletePart(part);
    selectedPartId = null;
    render();
  }
}

// ---- Products panel -------------------------------------------------------
function productsPanel(): HTMLElement {
  const searchInput = el('input', { type: 'text', placeholder: 'Search products…' });
  const runSearch = () => {
    const result = searchProducts(inv.products, searchInput.value);
    if (searchInput.value.trim() !== '' && result.length === 0) {
      alert('Nothing found.');
      productsView = inv.products;
    } else {
      productsView = result;
    }
    selectedProductId = null;
    app.replaceChildren(header(), panels());
  };
  searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') runSearch(); });

  const table = el('table', {}, [
    el('thead', {}, [row(['ID', 'Name', 'Parts', 'In Stock', 'Price'], true)]),
    productsBody(),
  ]);

  return el('section', { className: 'panel' }, [
    el('div', { className: 'panel-head' }, [
      el('h2', { textContent: 'Products' }),
      el('div', { className: 'search' }, [
        searchInput,
        el('button', { className: 'btn-secondary', textContent: 'Search', onclick: runSearch }),
      ]),
    ]),
    table,
    el('div', { className: 'panel-actions' }, [
      el('button', { className: 'btn-primary', textContent: 'Add', onclick: () => openProductModal('add') }),
      el('button', { className: 'btn-secondary', textContent: 'Modify', onclick: modifyProduct }),
      el('button', { className: 'btn-danger', textContent: 'Delete', onclick: deleteProduct }),
    ]),
  ]);
}

function productsBody(): HTMLElement {
  const body = el('tbody');
  if (productsView.length === 0) {
    body.append(el('tr', { className: 'empty-row' }, [el('td', { colSpan: 5, textContent: 'No products' })]));
    return body;
  }
  for (const p of productsView) {
    const tr = el('tr', { className: p.productId === selectedProductId ? 'selected' : '' }, [
      td(String(p.productId), 'num'),
      td(p.name),
      td(String(p.associatedParts.length), 'num'),
      td(String(p.inStock), 'num'),
      td(money(p.price), 'num'),
    ]);
    tr.addEventListener('click', () => {
      selectedProductId = p.productId;
      app.replaceChildren(header(), panels());
    });
    body.append(tr);
  }
  return body;
}

function modifyProduct(): void {
  const product = selectedProductId != null ? inv.lookupProduct(selectedProductId) : null;
  if (!product) { alert('Nothing Selected! Please make a selection.'); return; }
  openProductModal('modify', product);
}

function deleteProduct(): void {
  const product = selectedProductId != null ? inv.lookupProduct(selectedProductId) : null;
  if (!product) { alert('Nothing Selected! Please make a selection.'); return; }
  if (product.associatedParts.length !== 0) {
    alert('Sorry! Unable to delete product with any parts associated to it. Please modify the product and remove all associated parts to delete this product.');
    return;
  }
  if (confirm('Are You Sure?')) {
    inv.removeProduct(product);
    selectedProductId = null;
    render();
  }
}

// ---- Small DOM helpers ----------------------------------------------------
function row(cells: string[], head = false): HTMLElement {
  const tr = el('tr');
  for (let i = 0; i < cells.length; i++) {
    const numeric = head && (i === 0 || i >= cells.length - 2);
    tr.append(el(head ? 'th' : 'td', { className: numeric ? 'num' : '', textContent: cells[i] }));
  }
  return tr;
}

function td(text: string, className = '', children?: Node[]): HTMLElement {
  const cell = el('td', { className, textContent: children ? '' : text });
  if (children) children.forEach((c) => cell.append(c));
  return cell;
}

// ---- Modals ---------------------------------------------------------------
function openModal(node: HTMLElement): () => void {
  const backdrop = el('div', { className: 'modal-backdrop' }, [node]);
  document.body.append(backdrop);
  const close = () => backdrop.remove();
  backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(); });
  return close;
}

interface Field { label: string; input: HTMLInputElement; }

function fieldWrap(f: Field, full = false): HTMLElement {
  return el('div', { className: `field${full ? ' full' : ''}` }, [
    el('label', { textContent: f.label }),
    f.input,
  ]);
}

function openPartModal(mode: 'add' | 'modify', existing?: Part): void {
  const isInhouse = existing ? existing.kind === 'inhouse' : true;

  const idInput = el('input', {
    type: 'text',
    value: existing ? String(existing.partId) : String(inv.nextPartId()),
    readOnly: true,
  });
  const name = { key: 'name' as const, label: 'Name', input: el('input', { type: 'text', value: existing?.name ?? '' }) };
  const inventory = { key: 'inventory' as const, label: 'Inventory (In Stock)', input: el('input', { type: 'text', value: existing ? String(existing.inStock) : '' }) };
  const price = { key: 'price' as const, label: 'Price / Cost', input: el('input', { type: 'text', value: existing ? String(existing.price) : '' }) };
  const max = { key: 'max' as const, label: 'Max', input: el('input', { type: 'text', value: existing ? String(existing.max) : '' }) };
  const min = { key: 'min' as const, label: 'Min', input: el('input', { type: 'text', value: existing ? String(existing.min) : '' }) };

  const variableInput = el('input', {
    type: 'text',
    value: existing ? companyOrMachine(existing) : '',
  });
  const variableLabel = el('label', { textContent: isInhouse ? 'Machine ID' : 'Company Name' });

  const inhouseRadio = el('input', { type: 'radio', name: 'partkind', checked: isInhouse });
  const outsourcedRadio = el('input', { type: 'radio', name: 'partkind', checked: !isInhouse });
  const updateVarLabel = () => {
    variableLabel.textContent = inhouseRadio.checked ? 'Machine ID' : 'Company Name';
  };
  inhouseRadio.addEventListener('change', updateVarLabel);
  outsourcedRadio.addEventListener('change', updateVarLabel);

  const errorBox = el('p', { className: 'form-error hidden' });
  const saveBtn = el('button', { className: 'btn-primary', textContent: 'Save' });

  const required = [name.input, inventory.input, price.input, max.input, min.input, variableInput];
  const refreshSaveEnabled = () => {
    saveBtn.disabled = required.some((i) => i.value.trim() === '');
  };
  required.forEach((i) => i.addEventListener('input', refreshSaveEnabled));
  refreshSaveEnabled();

  const close = openModal(
    el('div', { className: 'modal' }, [
      el('div', { className: 'modal-head' }, [
        el('h2', { textContent: mode === 'add' ? 'Add Part' : 'Modify Part' }),
      ]),
      el('div', { className: 'modal-body' }, [
        errorBox,
        el('div', { className: 'radios' }, [
          el('label', {}, [inhouseRadio, document.createTextNode('In-House')]),
          el('label', {}, [outsourcedRadio, document.createTextNode('Outsourced')]),
        ]),
        el('div', { className: 'form-grid mt16' }, [
          el('div', { className: 'field' }, [el('label', { textContent: 'ID (auto)' }), idInput]),
          fieldWrap(name),
          fieldWrap(inventory),
          fieldWrap(price),
          fieldWrap(min),
          fieldWrap(max),
          el('div', { className: 'field' }, [variableLabel, variableInput]),
        ]),
      ]),
      el('div', { className: 'modal-foot' }, [
        el('button', { className: 'btn-secondary', textContent: 'Cancel', onclick: () => close() }),
        saveBtn,
      ]),
    ]),
  );

  saveBtn.onclick = () => {
    const values: FieldValues = {
      name: name.input.value,
      inventory: inventory.input.value,
      price: price.input.value,
      max: max.input.value,
      min: min.input.value,
    };
    const err = validateItem(values);
    if (err) { errorBox.textContent = err; errorBox.classList.remove('hidden'); return; }

    const base = {
      partId: parseInt(idInput.value, 10),
      name: values.name,
      inStock: parseInt(values.inventory, 10),
      price: parseFloat(values.price),
      max: parseInt(values.max, 10),
      min: parseInt(values.min, 10),
    };
    const part: Part = inhouseRadio.checked
      ? { ...base, kind: 'inhouse', machineId: parseInt(variableInput.value, 10) }
      : { ...base, kind: 'outsourced', companyName: variableInput.value };

    if (mode === 'add') inv.addPart(part);
    else inv.updatePart(part.partId, part);
    close();
    render();
  };
}

function openProductModal(mode: 'add' | 'modify', existing?: Product): void {
  const idInput = el('input', {
    type: 'text',
    value: existing ? String(existing.productId) : String(inv.nextProductId()),
    readOnly: true,
  });
  const name = { label: 'Name', input: el('input', { type: 'text', value: existing?.name ?? '' }) };
  const inventory = { label: 'Inventory (In Stock)', input: el('input', { type: 'text', value: existing ? String(existing.inStock) : '' }) };
  const price = { label: 'Price', input: el('input', { type: 'text', value: existing ? String(existing.price) : '' }) };
  const max = { label: 'Max', input: el('input', { type: 'text', value: existing ? String(existing.max) : '' }) };
  const min = { label: 'Min', input: el('input', { type: 'text', value: existing ? String(existing.min) : '' }) };

  // Working copy of associated parts (committed only on Save).
  const assoc: Part[] = existing ? [...existing.associatedParts] : [];
  let candidateView: Part[] = inv.allParts;
  let selCandidate: number | null = null;
  let selAssoc: number | null = null;

  const candidateBody = el('tbody');
  const assocBody = el('tbody');

  const renderAssocTables = () => {
    candidateBody.replaceChildren();
    for (const p of candidateView) {
      const tr = el('tr', { className: p.partId === selCandidate ? 'selected' : '' }, [
        td(String(p.partId), 'num'), td(p.name), td(String(p.inStock), 'num'), td(money(p.price), 'num'),
      ]);
      tr.onclick = () => { selCandidate = p.partId; renderAssocTables(); };
      candidateBody.append(tr);
    }
    assocBody.replaceChildren();
    if (assoc.length === 0) {
      assocBody.append(el('tr', { className: 'empty-row' }, [el('td', { colSpan: 4, textContent: 'No associated parts' })]));
    }
    for (const p of assoc) {
      const tr = el('tr', { className: p.partId === selAssoc ? 'selected' : '' }, [
        td(String(p.partId), 'num'), td(p.name), td(String(p.inStock), 'num'), td(money(p.price), 'num'),
      ]);
      tr.onclick = () => { selAssoc = p.partId; renderAssocTables(); };
      assocBody.append(tr);
    }
  };

  const candSearch = el('input', { type: 'text', placeholder: 'Search parts…' });
  const runCandSearch = () => {
    const result = searchParts(inv.allParts, candSearch.value);
    if (candSearch.value.trim() !== '' && result.length === 0) {
      alert('Nothing found.');
      candidateView = inv.allParts;
    } else {
      candidateView = result;
    }
    selCandidate = null;
    renderAssocTables();
  };
  candSearch.addEventListener('keydown', (e) => { if (e.key === 'Enter') runCandSearch(); });

  const addAssoc = () => {
    if (selCandidate == null) { alert('Please select a row.'); return; }
    const part = inv.lookupPart(selCandidate);
    if (part) { assoc.push(part); renderAssocTables(); }
  };
  const removeAssoc = () => {
    if (selAssoc == null) { alert('Nothing Selected! Please make a selection.'); return; }
    if (confirm('Are You Sure?')) {
      const i = assoc.findIndex((p) => p.partId === selAssoc);
      if (i !== -1) assoc.splice(i, 1);
      selAssoc = null;
      renderAssocTables();
    }
  };

  const errorBox = el('p', { className: 'form-error hidden' });
  const saveBtn = el('button', { className: 'btn-primary', textContent: 'Save' });
  const required = [name.input, inventory.input, price.input, max.input, min.input];
  const refreshSaveEnabled = () => { saveBtn.disabled = required.some((i) => i.value.trim() === ''); };
  required.forEach((i) => i.addEventListener('input', refreshSaveEnabled));
  refreshSaveEnabled();

  const miniHead = (cols: string[]) => el('thead', {}, [row(cols, true)]);

  const close = openModal(
    el('div', { className: 'modal wide' }, [
      el('div', { className: 'modal-head' }, [
        el('h2', { textContent: mode === 'add' ? 'Add Product' : 'Modify Product' }),
      ]),
      el('div', { className: 'modal-body' }, [
        errorBox,
        el('div', { className: 'form-grid' }, [
          el('div', { className: 'field' }, [el('label', { textContent: 'ID (auto)' }), idInput]),
          fieldWrap(name),
          fieldWrap(inventory),
          fieldWrap(price),
          fieldWrap(min),
          fieldWrap(max),
        ]),
        el('div', { className: 'assoc' }, [
          el('h3', { textContent: 'Candidate parts' }),
          el('div', { className: 'search' }, [
            candSearch,
            el('button', { className: 'btn-secondary', textContent: 'Search', onclick: runCandSearch }),
          ]),
          el('div', { className: 'mini' }, [el('table', {}, [miniHead(['ID', 'Name', 'In Stock', 'Price']), candidateBody])]),
          el('div', { className: 'mini-actions' }, [
            el('button', { className: 'btn-secondary', textContent: 'Add ↓', onclick: addAssoc }),
          ]),
          el('h3', { textContent: 'Associated parts' }),
          el('div', { className: 'mini' }, [el('table', {}, [miniHead(['ID', 'Name', 'In Stock', 'Price']), assocBody])]),
          el('div', { className: 'mini-actions' }, [
            el('button', { className: 'btn-danger', textContent: 'Remove associated part', onclick: removeAssoc }),
          ]),
        ]),
      ]),
      el('div', { className: 'modal-foot' }, [
        el('button', { className: 'btn-secondary', textContent: 'Cancel', onclick: () => close() }),
        saveBtn,
      ]),
    ]),
  );

  renderAssocTables();

  saveBtn.onclick = () => {
    const values: FieldValues = {
      name: name.input.value,
      inventory: inventory.input.value,
      price: price.input.value,
      max: max.input.value,
      min: min.input.value,
    };
    const err = validateItem(values);
    if (err) { errorBox.textContent = err; errorBox.classList.remove('hidden'); return; }

    const product: Product = {
      productId: parseInt(idInput.value, 10),
      name: values.name,
      inStock: parseInt(values.inventory, 10),
      price: parseFloat(values.price),
      max: parseInt(values.max, 10),
      min: parseInt(values.min, 10),
      associatedParts: assoc,
    };
    if (mode === 'add') inv.addProduct(product);
    else inv.updateProduct(product.productId, product);
    close();
    render();
  };
}

render();
