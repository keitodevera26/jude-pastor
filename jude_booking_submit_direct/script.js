// Google Apps Script Web App URL
const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbylBC5qgvqPIqYh1W2cecsiExtV76BxBM7LZ7tBq2eGg8z70c7-SOo2uBGwjH7vG5hP/exec"; // AFTER deploying Osaka Apps Script, paste the /exec URL here. Keep empty before launch.

const PHP_CONVERSION_RATE = 0.4;
const MERCH_UNIT_PRICE_JPY = 5000;

// Ticket form elements
const form = document.querySelector("#bookingForm");
const ticketCategory = document.querySelector("#ticketCategory");
const quantity = document.querySelector("#quantity");
const paymentMethod = document.querySelector("#paymentMethod");
const paymentReference = document.querySelector("#paymentReference");
const paymentDetails = document.querySelector("#paymentDetails");
const paymentDetailsTitle = document.querySelector("#paymentDetailsTitle");
const paymentInfoContent = document.querySelector("#paymentInfoContent");
const paymentAmountText = document.querySelector("#paymentAmountText");
const totalAmountLabel = document.querySelector("#totalAmountLabel");
const totalAmountDisplay = document.querySelector("#totalAmountDisplay");
const totalAmount = document.querySelector("#totalAmount");
const totalCurrency = document.querySelector("#totalCurrency");
const totalAmountJPY = document.querySelector("#totalAmountJPY");
const totalAmountPHP = document.querySelector("#totalAmountPHP");
const phpConversionRate = document.querySelector("#phpConversionRate");
const submitButton = document.querySelector("#submitButton");
const formMessage = document.querySelector("#formMessage");
const tierLinks = document.querySelectorAll("[data-tier-link]");

// Separate merch form elements
const merchForm = document.querySelector("#merchForm");
const merchItemsList = document.querySelector("#merchItemsList");
const merchItemTemplate = document.querySelector("#merchItemTemplate");
const addMerchItemButton = document.querySelector("#addMerchItem");
const merchTotalQuantity = document.querySelector("#merchTotalQuantity");
const merchSummaryItems = document.querySelector("#merchSummaryItems");
const merchSummaryTotal = document.querySelector("#merchSummaryTotal");
const merchPaymentMethod = document.querySelector("#merchPaymentMethod");
const merchPaymentReference = document.querySelector("#merchPaymentReference");
const merchPaymentDetails = document.querySelector("#merchPaymentDetails");
const merchPaymentDetailsTitle = document.querySelector(
  "#merchPaymentDetailsTitle"
);
const merchPaymentInfoContent = document.querySelector(
  "#merchPaymentInfoContent"
);
const merchPaymentAmountText = document.querySelector(
  "#merchPaymentAmountText"
);
const merchTotalAmountLabel = document.querySelector(
  "#merchTotalAmountLabel"
);
const merchTotalAmountDisplay = document.querySelector(
  "#merchTotalAmountDisplay"
);
const merchTotalAmount = document.querySelector("#merchTotalAmount");
const merchTotalCurrency = document.querySelector("#merchTotalCurrency");
const merchTotalAmountJPY = document.querySelector("#merchTotalAmountJPY");
const merchTotalAmountPHP = document.querySelector("#merchTotalAmountPHP");
const merchPhpConversionRate = document.querySelector(
  "#merchPhpConversionRate"
);
const merchSubmitButton = document.querySelector("#merchSubmitButton");
const merchFormMessage = document.querySelector("#merchFormMessage");
const merchOrderButton = document.querySelector("#openMerchOrder");
const merchOrderPanel = document.querySelector("#merchOrderPanel");
const merchCloseButton = document.querySelector("#closeMerchOrder");

const fulfillmentOptions = Array.from(
  document.querySelectorAll('input[name="fulfillmentMethod"]')
);

const shipmentFields = document.querySelector("#shipmentFields");
const shippingRecipient = document.querySelector("#shippingRecipient");
const shippingCountry = document.querySelector("#shippingCountry");
const shippingPostalCode = document.querySelector("#shippingPostalCode");
const shippingRegion = document.querySelector("#shippingRegion");
const shippingCity = document.querySelector("#shippingCity");
const shippingAddressLine1 = document.querySelector(
  "#shippingAddressLine1"
);
const shippingAddressLine2 = document.querySelector(
  "#shippingAddressLine2"
);
const shippingNotes = document.querySelector("#shippingNotes");
const merchFulfillmentSummary = document.querySelector(
  "#merchFulfillmentSummary"
);
const merchBuyerFullName = merchForm.querySelector(
  'input[name="fullName"]'
);

const MAX_MERCH_ROWS = 10;

function formatYen(value) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getPHPAmount(jpyTotal) {
  return Math.round((jpyTotal || 0) * PHP_CONVERSION_RATE);
}

function getAmountText(method, jpyTotal, phpTotal) {
  return method === "PNB / PHP"
    ? formatPeso(phpTotal)
    : formatYen(jpyTotal);
}

function getPaymentReferencePlaceholder(method) {
  const placeholders = {
    PayPay: "PayPay transaction/reference number",
    "Bank Transfer": "Transfer name/reference number",
    "PNB / PHP": "PNB/InstaPay reference number",
  };

  return placeholders[method] || "Select payment method first";
}

function getPaymentMarkup(method, phpTotal) {
  if (method === "PayPay") {
    return {
      title: "PayPay QR Payment",
      markup: `
        <div class="payment-layout single-qr">
          <div class="qr-card">
            <img
              src="assets/osaka-paypay-qr.png"
              alt="Updated PayPay QR code for Jude Pastor Solo Osaka"
            />
          </div>

          <div class="payment-copy">
            <h4>Pay via PayPay</h4>
            <p>Scan the QR code and send the exact amount shown above.</p>

            <ul>
              <li>Use the displayed QR code and verify the recipient in PayPay before sending.</li>
              <li>Currency: JPY</li>
              <li>
                Reference: Enter your PayPay transaction/reference
                number below.
              </li>
            </ul>
          </div>
        </div>
      `,
    };
  }

  if (method === "Bank Transfer") {
    return {
      title: "Japan Post Bank Transfer",
      markup: `
        <div class="bank-grid">
          <div class="bank-card">
            <h4>Japan Post Bank → Japan Post Bank</h4>

            <dl class="payment-list">
              <div>
                <dt>Account Holder</dt>
                <dd>Pastor Jude Ephraim Rubillos</dd>
              </div>

              <div>
                <dt>Bank</dt>
                <dd>Japan Post Bank (JP Bank)</dd>
              </div>

              <div>
                <dt>Account Symbol / 記号</dt>
                <dd>12090</dd>
              </div>

              <div>
                <dt>Account Number / 番号</dt>
                <dd>25952231</dd>
              </div>
            </dl>
          </div>

          <div class="bank-card">
            <h4>Other Bank → Japan Post Bank</h4>

            <dl class="payment-list">
              <div>
                <dt>Account Holder</dt>
                <dd>Pastor Jude Ephraim Rubillos</dd>
              </div>

              <div>
                <dt>Bank</dt>
                <dd>Japan Post Bank (JP Bank)</dd>
              </div>

              <div>
                <dt>Bank Code</dt>
                <dd>9900</dd>
              </div>

              <div>
                <dt>Branch Name</dt>
                <dd>二〇八 (Nizerohachi)</dd>
              </div>

              <div>
                <dt>Branch Code</dt>
                <dd>208</dd>
              </div>

              <div>
                <dt>Account Number</dt>
                <dd>2595223</dd>
              </div>
            </dl>
          </div>
        </div>
      `,
    };
  }

  if (method === "PNB / PHP") {
    return {
      title: "PNB / PHP Payment",
      markup: `
        <div class="payment-layout">
          <div class="qr-card pnb-qr">
            <img
              src="assets/pnb-qr.png"
              alt="PNB InstaPay QR code"
            />
          </div>

          <div class="payment-copy">
            <h4>Pay via PNB / InstaPay</h4>
            <p>This is the amount you will pay in pesos.</p>

            <ul>
              <li>PHP Amount: ${formatPeso(phpTotal)}</li>
              <li>
                Reference: Enter your PNB/InstaPay reference number below.
              </li>
            </ul>
          </div>
        </div>
      `,
    };
  }

  return {
    title: "Select a payment method",
    markup: "",
  };
}

function renderPaymentDetails({
  method,
  jpyTotal,
  phpTotal,
  detailsElement,
  titleElement,
  contentElement,
  amountElement,
}) {
  if (!method) {
    detailsElement.hidden = true;
    contentElement.innerHTML = "";
    titleElement.textContent = "Select a payment method";
    amountElement.textContent = formatYen(jpyTotal);
    return;
  }

  const payment = getPaymentMarkup(method, phpTotal);

  detailsElement.hidden = false;
  titleElement.textContent = payment.title;
  contentElement.innerHTML = payment.markup;
  amountElement.textContent = getAmountText(
    method,
    jpyTotal,
    phpTotal
  );
}

function setMessage(element, message, type = "") {
  element.textContent = message;
  element.className = `form-message ${type}`.trim();
}

// -------------------- Ticket booking --------------------

function getTicketTotalJPY() {
  const selectedOption =
    ticketCategory.options[ticketCategory.selectedIndex];

  const price = Number(selectedOption?.dataset?.price || 0);
  const qty = Number(quantity.value || 0);

  return price * qty;
}

function updateTicketPaymentReferencePlaceholder() {
  paymentReference.placeholder =
    getPaymentReferencePlaceholder(paymentMethod.value);
}

function updateTicketTotal() {
  const jpyTotal = getTicketTotalJPY();
  const phpTotal = getPHPAmount(jpyTotal);
  const isPNB = paymentMethod.value === "PNB / PHP";

  totalAmountJPY.value = String(jpyTotal);
  totalAmountPHP.value = String(phpTotal);
  phpConversionRate.value = String(PHP_CONVERSION_RATE);
  totalCurrency.value = isPNB ? "PHP" : "JPY";
  totalAmount.value = String(isPNB ? phpTotal : jpyTotal);

  totalAmountDisplay.value = isPNB
    ? formatPeso(phpTotal)
    : formatYen(jpyTotal);

  totalAmountLabel.textContent = isPNB
    ? "Total Amount (PHP)"
    : "Total Amount";

  renderPaymentDetails({
    method: paymentMethod.value,
    jpyTotal,
    phpTotal,
    detailsElement: paymentDetails,
    titleElement: paymentDetailsTitle,
    contentElement: paymentInfoContent,
    amountElement: paymentAmountText,
  });
}

function buildTicketPayload() {
  const formData = new FormData(form);

  return {
    eventName: "JUDE PASTOR SOLO | Osaka",
    orderType: "TICKET",

    fullName: formData.get("fullName")?.trim(),
    email: formData.get("email")?.trim(),
    contactNumber: formData.get("contactNumber")?.trim(),
    socialMedia: formData.get("socialHandle")?.trim(),

    ticketCategory: formData.get("ticketCategory"),
    quantity: Number(formData.get("quantity")),
    attendeeNames: formData.get("attendeeNames")?.trim(),

    paymentMethod: formData.get("paymentMethod"),
    paymentReferenceNumber:
      formData.get("paymentReference")?.trim(),

    proofOfPaymentUrl: "",

    totalAmount: Number(formData.get("totalAmount")),
    totalCurrency: formData.get("totalCurrency"),
    totalAmountJPY: Number(formData.get("totalAmountJPY")),
    totalAmountPHP: Number(formData.get("totalAmountPHP")),
    phpConversionRate: Number(
      formData.get("phpConversionRate")
    ),

    agreement: formData.get("agreement") === "on",
    submittedAt: new Date().toISOString(),
    clientRequestId: createOsakaRequestId(),
  };
}

function validateTicketPayload(payload) {
  if (
    !payload.fullName ||
    !payload.email ||
    !payload.contactNumber
  ) {
    return "Please complete your buyer information.";
  }

  if (
    !payload.ticketCategory ||
    !payload.quantity ||
    payload.quantity < 1
  ) {
    return "Please select your ticket category and quantity.";
  }

  if (!payload.attendeeNames) {
    return "Please enter the attendee name/s.";
  }

  if (
    !payload.paymentMethod ||
    !payload.paymentReferenceNumber
  ) {
    return "Please select your payment method and enter your payment reference number.";
  }

  if (!payload.agreement) {
    return "Please agree to the ticket policy before submitting.";
  }

  if (
    !APPS_SCRIPT_WEB_APP_URL ||
    APPS_SCRIPT_WEB_APP_URL.includes("PASTE_YOUR")
  ) {
    return "Osaka online booking is not yet connected. Please contact the organizer.";
  }

  return "";
}

// Read-only JSONP bridge: Google Apps Script ContentService does not offer
// browser-readable cross-origin POST responses for a static hosted website.
function createOsakaRequestId() {
  return 'WEB-' + (globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`);
}
function osakaApiRead(action, params = {}, timeoutMs = 9000) {
  return new Promise((resolve, reject) => {
    if (!APPS_SCRIPT_WEB_APP_URL) return reject(new Error('Backend not deployed'));
    const callback = '__osakaReply_' + Math.random().toString(36).slice(2);
    const script = document.createElement('script');
    let done = false;
    const cleanup = () => { delete window[callback]; script.remove(); clearTimeout(timer); };
    window[callback] = (payload) => { if (done) return; done = true; cleanup(); resolve(payload); };
    const timer = setTimeout(() => { if (done) return; done = true; cleanup(); reject(new Error('Backend check timed out')); }, timeoutMs);
    script.onerror = () => { if (done) return; done = true; cleanup(); reject(new Error('Cannot reach booking backend')); };
    const url = new URL(APPS_SCRIPT_WEB_APP_URL);
    url.searchParams.set('action', action);
    url.searchParams.set('callback', callback);
    url.searchParams.set('_', String(Date.now()));
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    script.src = url.toString(); document.head.appendChild(script);
  });
}
async function sendOsakaOrder(payload) {
  // The write request is sent via no-cors; the receipt MUST be confirmed through
  // a separate READ-only lookup. Never treat fetch resolution as booking success.
  await fetch(APPS_SCRIPT_WEB_APP_URL, {
    method: 'POST', mode: 'no-cors',
    headers: {'Content-Type': 'text/plain;charset=utf-8'},
    body: JSON.stringify(payload)
  });
  for (let attempt = 0; attempt < 5; attempt++) {
    await new Promise(resolve => setTimeout(resolve, attempt ? 1800 : 1000));
    try {
      const result = await osakaApiRead('receipt', {requestId: payload.clientRequestId}, 5000);
      if (result.success && result.found) return result;
    } catch (error) { console.warn('Receipt check pending:', error.message); }
  }
  throw new Error('We could not verify this submission. Please check for an email or contact the organizer with reference ' + payload.clientRequestId + '. Do NOT submit or pay twice.');
}

async function submitTicketBooking(payload) {
  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  setMessage(
    formMessage,
    "Sending your booking..."
  );

  try {
    const receipt = await sendOsakaOrder(payload);
    setMessage(formMessage, `Booking received! Reference: ${receipt.orderId}. Payment verification is still pending.`, 'success');

    form.reset();
    updateTicketPaymentReferencePlaceholder();
    updateTicketTotal();
  } catch (fetchError) {
    console.error(fetchError);

    setMessage(
      formMessage,
      "Something went wrong. Please try again or contact the organizer.",
      "error"
    );
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Booking";
  }
}

// -------------------- Merch form reveal --------------------

function openMerchOrderForm() {
  merchOrderPanel.hidden = false;
  merchOrderButton.setAttribute("aria-expanded", "true");

  requestAnimationFrame(() => {
    merchOrderPanel.classList.add("is-open");
  });

  window.setTimeout(() => {
    merchOrderPanel.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    merchForm
      .querySelector("input, select, textarea")
      ?.focus({ preventScroll: true });
  }, 220);
}

function closeMerchOrderForm() {
  merchOrderPanel.classList.remove("is-open");
  merchOrderButton.setAttribute("aria-expanded", "false");

  window.setTimeout(() => {
    merchOrderPanel.hidden = true;
    merchOrderButton.focus({ preventScroll: true });
  }, 320);
}

// -------------------- Multiple-shirt merch order --------------------

function getMerchRows() {
  return Array.from(
    merchItemsList.querySelectorAll(".merch-item-row")
  );
}

function readMerchItems() {
  return getMerchRows().map((row) => {
    const color =
      row.querySelector(".merch-color")?.value || "";

    const size =
      row.querySelector(".merch-size")?.value || "";

    const quantity = Number(
      row.querySelector(".merch-item-quantity")?.value || 0
    );

    return {
      color,
      size,
      quantity,
      unitPriceJPY: MERCH_UNIT_PRICE_JPY,
      lineTotalJPY: MERCH_UNIT_PRICE_JPY * quantity,
    };
  });
}

function updateMerchRowLabels() {
  const rows = getMerchRows();

  rows.forEach((row, index) => {
    row.dataset.merchRow = String(index + 1);

    row.querySelector(
      ".merch-item-number"
    ).textContent = `Shirt ${index + 1}`;

    const removeButton = row.querySelector(
      ".remove-merch-item"
    );

    if (removeButton) {
      removeButton.hidden = rows.length === 1;
    }
  });

  addMerchItemButton.disabled =
    rows.length >= MAX_MERCH_ROWS;

  addMerchItemButton.textContent =
    rows.length >= MAX_MERCH_ROWS
      ? "Maximum of 10 shirt rows"
      : "+ Add Another Shirt";
}

function addMerchItemRow() {
  if (getMerchRows().length >= MAX_MERCH_ROWS) {
    return;
  }

  const fragment =
    merchItemTemplate.content.cloneNode(true);

  merchItemsList.appendChild(fragment);

  updateMerchRowLabels();
  updateMerchSummary();

  const newestRow = getMerchRows().at(-1);
  newestRow?.querySelector("select")?.focus();
}

function removeMerchItemRow(row) {
  if (getMerchRows().length <= 1) {
    return;
  }

  row.remove();

  updateMerchRowLabels();
  updateMerchSummary();
}

function getSelectedFulfillmentMethod() {
  return (
    fulfillmentOptions.find(
      (option) => option.checked
    )?.value || "Concert pickup"
  );
}

function updateFulfillmentFields() {
  const method = getSelectedFulfillmentMethod();
  const isShipment = method === "Shipment";

  shipmentFields.hidden = !isShipment;

  [
    shippingRecipient,
    shippingCountry,
    shippingPostalCode,
    shippingRegion,
    shippingCity,
    shippingAddressLine1,
  ].forEach((field) => {
    field.required = isShipment;
  });

  if (
    isShipment &&
    !shippingRecipient.value.trim()
  ) {
    shippingRecipient.value =
      merchBuyerFullName.value.trim();
  }

  merchFulfillmentSummary.textContent = isShipment
    ? "Shipment selected. Limited slots are available. Shipping, packaging, and other applicable fees are not included in the merch total."
    : "Concert pickup at Naniwa GROWUP on December 5, 2026.";
}

function updateMerchPaymentReferencePlaceholder() {
  merchPaymentReference.placeholder =
    getPaymentReferencePlaceholder(
      merchPaymentMethod.value
    );
}

function updateMerchSummary() {
  const items = readMerchItems();

  let totalQuantity = 0;
  let jpyTotal = 0;

  const completedItems = [];

  getMerchRows().forEach((row, index) => {
    const item = items[index];
    const lineTotal = item.lineTotalJPY;

    row.querySelector(
      ".merch-line-total strong"
    ).textContent = formatYen(lineTotal);

    if (item.quantity > 0) {
      totalQuantity += item.quantity;
      jpyTotal += lineTotal;
    }

    if (
      item.color &&
      item.size &&
      item.quantity > 0
    ) {
      completedItems.push(item);
    }
  });

  const phpTotal = getPHPAmount(jpyTotal);
  const isPNB =
    merchPaymentMethod.value === "PNB / PHP";

  merchTotalQuantity.textContent =
    String(totalQuantity);

  merchSummaryTotal.textContent = isPNB
    ? formatPeso(phpTotal)
    : formatYen(jpyTotal);

  if (completedItems.length === 0) {
    merchSummaryItems.innerHTML =
      '<p class="empty-merch-summary">Your selected shirts will appear here.</p>';
  } else {
    merchSummaryItems.innerHTML = completedItems
      .map(
        (item) => `
          <div class="merch-summary-line">
            <div>
              <strong>
                ${escapeHTML(item.color)} /
                ${escapeHTML(item.size)}
              </strong>

              <span>
                ${item.quantity}
                shirt${item.quantity === 1 ? "" : "s"}
                × ${formatYen(MERCH_UNIT_PRICE_JPY)}
              </span>
            </div>

            <strong>
              ${formatYen(item.lineTotalJPY)}
            </strong>
          </div>
        `
      )
      .join("");
  }

  merchTotalAmountJPY.value = String(jpyTotal);
  merchTotalAmountPHP.value = String(phpTotal);
  merchPhpConversionRate.value =
    String(PHP_CONVERSION_RATE);

  merchTotalCurrency.value =
    isPNB ? "PHP" : "JPY";

  merchTotalAmount.value = String(
    isPNB ? phpTotal : jpyTotal
  );

  merchTotalAmountDisplay.value = isPNB
    ? formatPeso(phpTotal)
    : formatYen(jpyTotal);

  merchTotalAmountLabel.textContent = isPNB
    ? "Merch Total (PHP)"
    : "Merch Total";

  renderPaymentDetails({
    method: merchPaymentMethod.value,
    jpyTotal,
    phpTotal,
    detailsElement: merchPaymentDetails,
    titleElement: merchPaymentDetailsTitle,
    contentElement: merchPaymentInfoContent,
    amountElement: merchPaymentAmountText,
  });
}

function buildMerchPayload() {
  const formData = new FormData(merchForm);

  const items = readMerchItems().filter(
    (item) =>
      item.color &&
      item.size &&
      item.quantity > 0
  );

  const totalQty = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const buyerName =
    formData.get("fullName")?.trim();

  const firstItem = items[0] || {};

  const fulfillmentMethod =
    formData.get("fulfillmentMethod") ||
    "Concert pickup";

  return {
    eventName: "JUDE PASTOR SOLO | Osaka",
    orderType: "MERCH",
    orderLabel: "Official Merch Pre-order",

    fullName: buyerName,
    email: formData.get("email")?.trim(),
    contactNumber:
      formData.get("contactNumber")?.trim(),
    socialMedia: "",

    merchItem:
      "Jude Pastor Solo – Official T-Shirt",

    merchItems: items,
    merchColor: firstItem.color || "",
    merchSize: firstItem.size || "",
    merchUnitPriceJPY: MERCH_UNIT_PRICE_JPY,
    quantity: totalQty,

    fulfillmentMethod,

    pickupDate:
      fulfillmentMethod === "Shipment"
        ? ""
        : "2026-12-05",

    pickupVenue:
      fulfillmentMethod === "Shipment"
        ? ""
        : "Naniwa GROWUP",

    shippingRecipient:
      formData.get("shippingRecipient")?.trim() || "",

    shippingCountry:
      formData.get("shippingCountry")?.trim() || "",

    shippingPostalCode:
      formData.get("shippingPostalCode")?.trim() || "",

    shippingRegion:
      formData.get("shippingRegion")?.trim() || "",

    shippingCity:
      formData.get("shippingCity")?.trim() || "",

    shippingAddressLine1:
      formData.get("shippingAddressLine1")?.trim() || "",

    shippingAddressLine2:
      formData.get("shippingAddressLine2")?.trim() || "",

    shippingNotes:
      formData.get("shippingNotes")?.trim() || "",

    shippingFeeStatus:
      fulfillmentMethod === "Shipment"
        ? "To be confirmed separately"
        : "Not applicable",

    paymentMethod:
      formData.get("paymentMethod"),

    paymentReferenceNumber:
      formData.get("paymentReference")?.trim(),

    proofOfPaymentUrl: "",

    totalAmount:
      Number(formData.get("totalAmount")),

    totalCurrency:
      formData.get("totalCurrency"),

    totalAmountJPY:
      Number(formData.get("totalAmountJPY")),

    totalAmountPHP:
      Number(formData.get("totalAmountPHP")),

    phpConversionRate:
      Number(formData.get("phpConversionRate")),

    agreement:
      formData.get("agreement") === "on",

    submittedAt:
      new Date().toISOString(),
    clientRequestId: createOsakaRequestId(),

    ticketCategory:
      "Merch — Multiple shirt combinations",

    attendeeNames: buyerName,
  };
}

function validateMerchPayload(payload) {
  if (
    !payload.fullName ||
    !payload.email ||
    !payload.contactNumber
  ) {
    return "Please complete your contact information.";
  }

  const rawRows = readMerchItems();

  const hasIncompleteRow = rawRows.some(
    (item) =>
      !item.color ||
      !item.size ||
      !item.quantity
  );

  if (hasIncompleteRow) {
    return "Please complete the color, size, and quantity for every shirt row.";
  }

  if (
    !payload.merchItems.length ||
    payload.quantity < 1
  ) {
    return "Please add at least one shirt to your order.";
  }

  if (!payload.fulfillmentMethod) {
    return "Please choose concert pickup or shipment.";
  }

  if (payload.fulfillmentMethod === "Shipment") {
    const requiredShippingFields = [
      payload.shippingRecipient,
      payload.shippingCountry,
      payload.shippingPostalCode,
      payload.shippingRegion,
      payload.shippingCity,
      payload.shippingAddressLine1,
    ];

    if (
      requiredShippingFields.some(
        (value) => !value
      )
    ) {
      return "Please complete all required shipping address fields.";
    }
  }

  if (
    !payload.paymentMethod ||
    !payload.paymentReferenceNumber
  ) {
    return "Please select your payment method and enter your payment reference number.";
  }

  if (!payload.agreement) {
    return "Please agree to the merchandise fulfillment terms before submitting.";
  }

  if (
    !APPS_SCRIPT_WEB_APP_URL ||
    APPS_SCRIPT_WEB_APP_URL.includes("PASTE_YOUR")
  ) {
    return "Osaka online booking is not yet connected. Please contact the organizer.";
  }

  return "";
}

function resetMerchOrderForm() {
  merchForm.reset();

  getMerchRows()
    .slice(1)
    .forEach((row) => row.remove());

  updateMerchRowLabels();
  updateMerchPaymentReferencePlaceholder();
  updateFulfillmentFields();
  updateMerchSummary();
}

async function submitMerchOrder(payload) {
  merchSubmitButton.disabled = true;
  merchSubmitButton.textContent = "Submitting...";

  setMessage(
    merchFormMessage,
    "Sending your merch pre-order..."
  );

  try {
    const receipt = await sendOsakaOrder(payload);
    setMessage(merchFormMessage, `T-shirt pre-order received! Reference: ${receipt.orderId}. Payment verification is pending.`, 'success');

    resetMerchOrderForm();
  } catch (fetchError) {
    console.error(fetchError);

    setMessage(
      merchFormMessage,
      "Something went wrong. Please try again or contact the organizer.",
      "error"
    );
  } finally {
    merchSubmitButton.disabled = false;
    merchSubmitButton.textContent =
      "Submit Merch Pre-order";
  }
}

// -------------------- Ticket event listeners --------------------

ticketCategory.addEventListener(
  "change",
  updateTicketTotal
);

quantity.addEventListener(
  "change",
  updateTicketTotal
);

paymentMethod.addEventListener("change", () => {
  updateTicketPaymentReferencePlaceholder();
  updateTicketTotal();
});

tierLinks.forEach((link) => {
  link.addEventListener("click", () => {
    ticketCategory.value =
      link.dataset.tierLink;

    updateTicketTotal();

    form.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
});

form.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const payload = buildTicketPayload();
    const error =
      validateTicketPayload(payload);

    if (error) {
      setMessage(
        formMessage,
        error,
        "error"
      );

      return;
    }

    try {
      const inventory = await osakaApiRead('availability');
      onOsakaInventory(inventory);
      const item = inventory.inventory?.find(x => x.category === payload.ticketCategory);
      if (!item || Number(item.left) < payload.quantity) {
        setMessage(formMessage, 'Sorry, there are not enough available tickets in this category.', 'error');
        return;
      }
    } catch (err) {
      setMessage(formMessage, 'Cannot verify current ticket availability. Please try again later.', 'error');
      return;
    }
    await submitTicketBooking(payload);
  }
);

// -------------------- Merch event listeners --------------------

merchOrderButton.addEventListener(
  "click",
  openMerchOrderForm
);

merchCloseButton.addEventListener(
  "click",
  closeMerchOrderForm
);

addMerchItemButton.addEventListener(
  "click",
  addMerchItemRow
);

merchItemsList.addEventListener(
  "change",
  (event) => {
    if (
      event.target.matches(
        ".merch-color, .merch-size, .merch-item-quantity"
      )
    ) {
      updateMerchSummary();
    }
  }
);

merchItemsList.addEventListener(
  "input",
  (event) => {
    if (
      event.target.matches(
        ".merch-color, .merch-size, .merch-item-quantity"
      )
    ) {
      updateMerchSummary();
    }
  }
);

merchItemsList.addEventListener(
  "click",
  (event) => {
    const removeButton = event.target.closest(
      ".remove-merch-item"
    );

    if (!removeButton) {
      return;
    }

    const row = removeButton.closest(
      ".merch-item-row"
    );

    if (row) {
      removeMerchItemRow(row);
    }
  }
);

fulfillmentOptions.forEach((option) => {
  option.addEventListener(
    "change",
    updateFulfillmentFields
  );
});

merchBuyerFullName.addEventListener(
  "input",
  () => {
    if (
      getSelectedFulfillmentMethod() ===
        "Shipment" &&
      !shippingRecipient.value.trim()
    ) {
      shippingRecipient.value =
        merchBuyerFullName.value.trim();
    }
  }
);

merchPaymentMethod.addEventListener(
  "change",
  () => {
    updateMerchPaymentReferencePlaceholder();
    updateMerchSummary();
  }
);

merchForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const payload = buildMerchPayload();
    const error =
      validateMerchPayload(payload);

    if (error) {
      setMessage(
        merchFormMessage,
        error,
        "error"
      );

      return;
    }

    await submitMerchOrder(payload);
  }
);

// -------------------- Initial state --------------------

updateTicketPaymentReferencePlaceholder();
updateTicketTotal();

updateMerchRowLabels();
updateMerchPaymentReferencePlaceholder();
updateFulfillmentFields();
updateMerchSummary();

// -------------------- Small scroll animations --------------------

const animatedItems = document.querySelectorAll(
  ".section-heading, .two-column > div, .ticket-card, .merch-feature, .booking-form, .policy-box, .site-footer"
);

if ("IntersectionObserver" in window) {
  animatedItems.forEach((item) => {
    item.classList.add("reveal-on-scroll");
  });

  const revealObserver =
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(
              "is-visible"
            );

            revealObserver.unobserve(
              entry.target
            );
          }
        });
      },
      {
        threshold: 0.12,
      }
    );

  animatedItems.forEach((item) => {
    revealObserver.observe(item);
  });
} else {
  animatedItems.forEach((item) => {
    item.classList.add("is-visible");
  });
}



// Osaka live inventory from backend (confirmed only; pending shown separately).
let osakaInventorySnapshot = null;
function onOsakaInventory(payload) {
  if (!payload?.success || !Array.isArray(payload.inventory)) return;
  osakaInventorySnapshot = payload.inventory;
  for (const item of payload.inventory) {
    const tier = item.category;
    const remaining = Number(item.left);
    if (!Number.isFinite(remaining)) continue;
    const el = document.querySelector(`[data-availability="${tier}"]`);
    const opt = [...ticketCategory.options].find(x => x.value === tier);
    const link = [...document.querySelectorAll('[data-tier-link]')].find(x => x.dataset.tierLink === tier);
     if (el) el.textContent = '';
    if (opt) opt.disabled = remaining <= 0;
    if (link) {
      link.setAttribute('aria-disabled', String(remaining <= 0));
      link.textContent = remaining <= 0 ? 'SOLD OUT' : `Select ${tier}`;
      link.classList.toggle('is-sold-out', remaining <= 0);
    }
    if (remaining <= 0 && ticketCategory.value === tier) {
      ticketCategory.value = '';
      updateTicketTotal();
    }
  }
}
async function refreshOsakaInventory() {
  if (!APPS_SCRIPT_WEB_APP_URL) return;
  try { onOsakaInventory(await osakaApiRead('availability')); }
  catch (err) { console.warn('Inventory not available:', err.message); }
}
refreshOsakaInventory();
setInterval(refreshOsakaInventory, 60000);

// TOKYO HIGHLIGHTS: editorial collage lightbox
(() => {
  const lightbox = document.getElementById('tokyoLightbox');
  if (!lightbox) return;
  const lightboxImage = document.getElementById('tokyoLightboxImage');
  const lightboxCaption = document.getElementById('tokyoLightboxCaption');
  const closeButton = document.getElementById('tokyoLightboxClose');
  const collageItems = Array.from(document.querySelectorAll('.tokyo-collage-item'));

  collageItems.forEach((item) => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      lightboxImage.src = item.dataset.lightboxSrc || img.src;
      lightboxImage.alt = img.alt;
      lightboxCaption.textContent = item.dataset.lightboxCaption || img.alt;
      lightbox.showModal();
    });
  });

  closeButton?.addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) lightbox.close();
  });
})();
