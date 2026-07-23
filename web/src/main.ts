import './style.css';
import {
  Part,
  PartPayload,
  Product,
  ProductPayload,
  FieldValues,
  companyOrMachine,
  validateItem,
  partsApi,
  productsApi,
} from './model';

let allParts: Part[] = [];
let allProducts: Product[] = [];
let partsView: Part[] = [];
let productsView: Product[] = [];
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

async function refresh(): Promise<void> {
  try {
    [allParts, allProducts] = await Promise.all([partsApi.list(), productsApi.list()]);
    partsView = allParts;
    productsView = allProducts;
    render();
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Failed to load inventory.');
  }
}

function render(): void {
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
  const runSearch = async () => {
    const term = searchInput.value.trim();
    const result = await partsApi.list(term || undefined);
    if (term !== '' && result.length === 0) {
      alert('Nothing found.');
      partsView = allParts;
    } else {
      partsView = result;
    }
    selectedPartId = null;
    render();
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
      render();
    });
    body.append(tr);
  }
  return body;
}

async function modifyPart(): Promise<void> {
  if (selectedPartId == null) { alert('Nothing Selected! Please make a selection.'); return; }
  try {
    const part = await partsApi.get(selectedPartId);
    openPartModal('modify', part);
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Failed to load part.');
  }
}

async function deletePart(): Promise<void> {
  if (selectedPartId == null) { alert('Nothing Selected! Please make a selection.'); return; }
  try {
    const part = await partsApi.get(selectedPartId);
    if (confirm('Are You Sure?')) {
      await partsApi.remove(part.partId);
      selectedPartId = null;
      await refresh();
    }
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Failed to delete part.');
  }
}

// ---- Products panel -------------------------------------------------------
function productsPanel(): HTMLElement {
  const searchInput = el('input', { type: 'text', placeholder: 'Search products…' });
  const runSearch = async () => {
    const term = searchInput.value.trim();
    const result = await productsApi.list(term || undefined);
    if (term !== '' && result.length === 0) {
      alert('Nothing found.');
      productsView = allProducts;
    } else {
      productsView = result;
    }
    selectedProductId = null;
    render();
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
      render();
    });
    body.append(tr);
  }
  return body;
}

async function modifyProduct(): Promise<void> {
  if (selectedProductId == null) { alert('Nothing Selected! Please make a selection.'); return; }
  try {
    const product = await productsApi.get(selectedProductId);
    openProductModal('modify', product);
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Failed to load product.');
  }
}

async function deleteProduct(): Promise<void> {
  if (selectedProductId == null) { alert('Nothing Selected! Please make a selection.'); return; }
  try {
    const product = await productsApi.get(selectedProductId);
    if (product.associatedParts.length !== 0) {
      alert('Sorry! Unable to delete product with any parts associated to it. Please modify the product and remove all associated parts to delete this product.');
      return;
    }
    if (confirm('Are You Sure?')) {
      await productsApi.remove(product.productId);
      selectedProductId = null;
      await refresh();
    }
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Failed to delete product.');
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
    value: existing ? String(existing.partId) : '',
    placeholder: 'Auto',
    readOnly: true,
  });
  const name = { label: 'Name', input: el('input', { type: 'text', value: existing?.name ?? '' }) };
  const inventory = { label: 'Inventory (In Stock)', input: el('input', { type: 'text', value: existing ? String(existing.inStock) : '' }) };
  const price = { label: 'Price / Cost', input: el('input', { type: 'text', value: existing ? String(existing.price) : '' }) };
  const max = { label: 'Max', input: el('input', { type: 'text', value: existing ? String(existing.max) : '' }) };
  const min = { label: 'Min', input: el('input', { type: 'text', value: existing ? String(existing.min) : '' }) };

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
  const inputs = [name.input, inventory.input, price.input, max.input, min.input, variableInput];

  const validate = (): string | null => {
    inputs.forEach((i) => i.classList.remove('invalid'));
    let firstError: string | null = null;
    const mark = (input: HTMLInputElement, msg: string) => {
      input.classList.add('invalid');
      firstError ??= msg;
    };

    if (name.input.value.trim() === '') mark(name.input, 'Name is required.');

    const priceVal = price.input.value.trim();
    if (priceVal === '') mark(price.input, 'Price is required.');
    else {
      const p = Number(priceVal);
      if (Number.isNaN(p) || p < 0) mark(price.input, 'Price must be a non-negative number.');
    }

    const invVal = inventory.input.value.trim();
    if (invVal === '') mark(inventory.input, 'Inventory is required.');
    else if (!Number.isInteger(Number(invVal))) mark(inventory.input, 'Inventory must be an integer.');

    const maxVal = max.input.value.trim();
    if (maxVal === '') mark(max.input, 'Max is required.');
    else if (!Number.isInteger(Number(maxVal))) mark(max.input, 'Max must be an integer.');

    const minVal = min.input.value.trim();
    if (minVal === '') mark(min.input, 'Min is required.');
    else if (!Number.isInteger(Number(minVal))) mark(min.input, 'Min must be an integer.');

    const values: FieldValues = {
      name: name.input.value,
      inventory: inventory.input.value,
      price: price.input.value,
      max: max.input.value,
      min: min.input.value,
    };
    const itemErr = validateItem(values);
    if (itemErr) {
      if (itemErr.includes('Minimum')) { min.input.classList.add('invalid'); max.input.classList.add('invalid'); }
      if (itemErr.includes('Inventory')) inventory.input.classList.add('invalid');
      firstError ??= itemErr;
    }

    if (inhouseRadio.checked) {
      const mVal = variableInput.value.trim();
      if (mVal === '') mark(variableInput, 'Machine ID is required.');
      else if (!Number.isInteger(Number(mVal))) mark(variableInput, 'Machine ID must be an integer.');
    } else {
      if (variableInput.value.trim() === '') mark(variableInput, 'Company Name is required.');
    }

    saveBtn.disabled = !!firstError;
    return firstError;
  };

  inputs.forEach((i) => i.addEventListener('input', validate));
  inhouseRadio.addEventListener('change', validate);
  outsourcedRadio.addEventListener('change', validate);
  validate();

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

  saveBtn.onclick = async () => {
    const err = validate();
    if (err) { errorBox.textContent = err; errorBox.classList.remove('hidden'); return; }

    const base = {
      name: name.input.value.trim(),
      price: Number(price.input.value.trim()),
      inStock: parseInt(inventory.input.value.trim(), 10),
      max: parseInt(max.input.value.trim(), 10),
      min: parseInt(min.input.value.trim(), 10),
    };
    try {
      const payload: PartPayload = inhouseRadio.checked
        ? { ...base, kind: 'inhouse' as const, machineId: parseInt(variableInput.value.trim(), 10) }
        : { ...base, kind: 'outsourced' as const, companyName: variableInput.value.trim() };

      if (mode === 'add') await partsApi.create(payload);
      else if (existing) await partsApi.update(existing.partId, payload);
      close();
      await refresh();
    } catch (e) {
      errorBox.textContent = e instanceof Error ? e.message : 'Save failed.';
      errorBox.classList.remove('hidden');
    }
  };
}

function openProductModal(mode: 'add' | 'modify', existing?: Product): void {
  const idInput = el('input', {
    type: 'text',
    value: existing ? String(existing.productId) : '',
    placeholder: 'Auto',
    readOnly: true,
  });
  const name = { label: 'Name', input: el('input', { type: 'text', value: existing?.name ?? '' }) };
  const inventory = { label: 'Inventory (In Stock)', input: el('input', { type: 'text', value: existing ? String(existing.inStock) : '' }) };
  const price = { label: 'Price', input: el('input', { type: 'text', value: existing ? String(existing.price) : '' }) };
  const max = { label: 'Max', input: el('input', { type: 'text', value: existing ? String(existing.max) : '' }) };
  const min = { label: 'Min', input: el('input', { type: 'text', value: existing ? String(existing.min) : '' }) };

  // Working copy of associated parts (committed only on Save).
  const assoc: Part[] = existing ? [...existing.associatedParts] : [];
  let candidateView: Part[] = allParts;
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
  const runCandSearch = async () => {
    const term = candSearch.value.trim();
    const result = await partsApi.list(term || undefined);
    if (term !== '' && result.length === 0) {
      alert('Nothing found.');
      candidateView = allParts;
    } else {
      candidateView = result;
    }
    selCandidate = null;
    renderAssocTables();
  };
  candSearch.addEventListener('keydown', (e) => { if (e.key === 'Enter') runCandSearch(); });

  const addAssoc = () => {
    if (selCandidate == null) { alert('Please select a row.'); return; }
    const part = candidateView.find((p) => p.partId === selCandidate);
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
  const inputs = [name.input, inventory.input, price.input, max.input, min.input];

  const validate = (): string | null => {
    inputs.forEach((i) => i.classList.remove('invalid'));
    let firstError: string | null = null;
    const mark = (input: HTMLInputElement, msg: string) => {
      input.classList.add('invalid');
      firstError ??= msg;
    };

    if (name.input.value.trim() === '') mark(name.input, 'Name is required.');

    const priceVal = price.input.value.trim();
    if (priceVal === '') mark(price.input, 'Price is required.');
    else {
      const p = Number(priceVal);
      if (Number.isNaN(p) || p < 0) mark(price.input, 'Price must be a non-negative number.');
    }

    const invVal = inventory.input.value.trim();
    if (invVal === '') mark(inventory.input, 'Inventory is required.');
    else if (!Number.isInteger(Number(invVal))) mark(inventory.input, 'Inventory must be an integer.');

    const maxVal = max.input.value.trim();
    if (maxVal === '') mark(max.input, 'Max is required.');
    else if (!Number.isInteger(Number(maxVal))) mark(max.input, 'Max must be an integer.');

    const minVal = min.input.value.trim();
    if (minVal === '') mark(min.input, 'Min is required.');
    else if (!Number.isInteger(Number(minVal))) mark(min.input, 'Min must be an integer.');

    const values: FieldValues = {
      name: name.input.value,
      inventory: inventory.input.value,
      price: price.input.value,
      max: max.input.value,
      min: min.input.value,
    };
    const itemErr = validateItem(values);
    if (itemErr) {
      if (itemErr.includes('Minimum')) { min.input.classList.add('invalid'); max.input.classList.add('invalid'); }
      if (itemErr.includes('Inventory')) inventory.input.classList.add('invalid');
      firstError ??= itemErr;
    }

    saveBtn.disabled = !!firstError;
    return firstError;
  };

  inputs.forEach((i) => i.addEventListener('input', validate));
  validate();

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

  saveBtn.onclick = async () => {
    const err = validate();
    if (err) { errorBox.textContent = err; errorBox.classList.remove('hidden'); return; }

    const payload: ProductPayload = {
      name: name.input.value.trim(),
      price: Number(price.input.value.trim()),
      inStock: parseInt(inventory.input.value.trim(), 10),
      max: parseInt(max.input.value.trim(), 10),
      min: parseInt(min.input.value.trim(), 10),
      associatedPartIds: assoc.map((p) => p.partId),
    };
    try {
      if (mode === 'add') await productsApi.create(payload);
      else if (existing) await productsApi.update(existing.productId, payload);
      close();
      await refresh();
    } catch (e) {
      errorBox.textContent = e instanceof Error ? e.message : 'Save failed.';
      errorBox.classList.remove('hidden');
    }
  };
}

refresh();
