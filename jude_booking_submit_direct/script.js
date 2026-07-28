// Google Apps Script Web App URL
const APPS_SCRIPT_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzRogsbGomF7zD8UBWnauuYjFfMayGebzp75Zc0Z2eYcgPPPT6VvVKuYR8gwSkcJ9626Q/exec";

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
const merchQuantity = document.querySelector("#merchQuantity");
const merchPaymentMethod = document.querySelector("#merchPaymentMethod");
const merchPaymentReference = document.querySelector("#merchPaymentReference");
const merchPaymentDetails = document.querySelector("#merchPaymentDetails");
const merchPaymentDetailsTitle = document.querySelector("#merchPaymentDetailsTitle");
const merchPaymentInfoContent = document.querySelector("#merchPaymentInfoContent");
const merchPaymentAmountText = document.querySelector("#merchPaymentAmountText");
const merchTotalAmountLabel = document.querySelector("#merchTotalAmountLabel");
const merchTotalAmountDisplay = document.querySelector("#merchTotalAmountDisplay");
const merchTotalAmount = document.querySelector("#merchTotalAmount");
const merchTotalCurrency = document.querySelector("#merchTotalCurrency");
const merchTotalAmountJPY = document.querySelector("#merchTotalAmountJPY");
const merchTotalAmountPHP = document.querySelector("#merchTotalAmountPHP");
const merchPhpConversionRate = document.querySelector("#merchPhpConversionRate");
const merchSubmitButton = document.querySelector("#merchSubmitButton");
const merchFormMessage = document.querySelector("#merchFormMessage");
const merchOrderButton = document.querySelector("#openMerchOrder");
const merchOrderPanel = document.querySelector("#merchOrderPanel");
const merchCloseButton = document.querySelector("#closeMerchOrder");

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

function getPHPAmount(jpyTotal) {
  return Math.round((jpyTotal || 0) * PHP_CONVERSION_RATE);
}

function getAmountText(method, jpyTotal, phpTotal) {
  return method === "PNB / PHP" ? formatPeso(phpTotal) : formatYen(jpyTotal);
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
            <img src="assets/paypay-qr.png" alt="Kanto Sessions PayPay QR code" />
          </div>
          <div class="payment-copy">
            <h4>Pay via PayPay</h4>
            <p>Scan the QR code and send the exact amount shown above.</p>
            <ul>
              <li>Payee: Kanto Sessions</li>
              <li>Currency: JPY</li>
              <li>Reference: Enter your PayPay transaction/reference number below.</li>
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
              <div><dt>Account Holder</dt><dd>Pastor Jude Ephraim Rubillos</dd></div>
              <div><dt>Bank</dt><dd>Japan Post Bank (JP Bank)</dd></div>
              <div><dt>Account Symbol / 記号</dt><dd>12090</dd></div>
              <div><dt>Account Number / 番号</dt><dd>25952231</dd></div>
            </dl>
          </div>
          <div class="bank-card">
            <h4>Other Bank → Japan Post Bank</h4>
            <dl class="payment-list">
              <div><dt>Account Holder</dt><dd>Pastor Jude Ephraim Rubillos</dd></div>
              <div><dt>Bank</dt><dd>Japan Post Bank (JP Bank)</dd></div>
              <div><dt>Bank Code</dt><dd>9900</dd></div>
              <div><dt>Branch Name</dt><dd>二〇八 (Nizerohachi)</dd></div>
              <div><dt>Branch Code</dt><dd>208</dd></div>
              <div><dt>Account Number</dt><dd>2595223</dd></div>
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
            <img src="assets/pnb-qr.png" alt="PNB InstaPay QR code" />
          </div>
          <div class="payment-copy">
            <h4>Pay via PNB / InstaPay</h4>
            <p>This is the amount you will pay in pesos.</p>
            <ul>
              <li>PHP Amount: ${formatPeso(phpTotal)}</li>
              <li>Reference: Enter your PNB/InstaPay reference number below.</li>
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
  amountElement.textContent = getAmountText(method, jpyTotal, phpTotal);
}

function setMessage(element, message, type = "") {
  element.textContent = message;
  element.className = `form-message ${type}`.trim();
}

// -------------------- Ticket booking --------------------

function getTicketTotalJPY() {
  const selectedOption = ticketCategory.options[ticketCategory.selectedIndex];
  const price = Number(selectedOption?.dataset?.price || 0);
  const qty = Number(quantity.value || 0);

  return price * qty;
}

function updateTicketPaymentReferencePlaceholder() {
  paymentReference.placeholder = getPaymentReferencePlaceholder(paymentMethod.value);
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
  totalAmountDisplay.value = isPNB ? formatPeso(phpTotal) : formatYen(jpyTotal);
  totalAmountLabel.textContent = isPNB ? "Total Amount (PHP)" : "Total Amount";

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
    eventName: "JUDE PASTOR SOLO | Tokyo",
    orderType: "TICKET",

    fullName: formData.get("fullName")?.trim(),
    email: formData.get("email")?.trim(),
    contactNumber: formData.get("contactNumber")?.trim(),
    socialMedia: formData.get("socialHandle")?.trim(),

    ticketCategory: formData.get("ticketCategory"),
    quantity: Number(formData.get("quantity")),
    attendeeNames: formData.get("attendeeNames")?.trim(),

    paymentMethod: formData.get("paymentMethod"),
    paymentReferenceNumber: formData.get("paymentReference")?.trim(),
    proofOfPaymentUrl: "",

    totalAmount: Number(formData.get("totalAmount")),
    totalCurrency: formData.get("totalCurrency"),
    totalAmountJPY: Number(formData.get("totalAmountJPY")),
    totalAmountPHP: Number(formData.get("totalAmountPHP")),
    phpConversionRate: Number(formData.get("phpConversionRate")),

    agreement: formData.get("agreement") === "on",
    submittedAt: new Date().toISOString(),
  };
}

function validateTicketPayload(payload) {
  if (!payload.fullName || !payload.email || !payload.contactNumber) {
    return "Please complete your buyer information.";
  }

  if (!payload.ticketCategory || !payload.quantity || payload.quantity < 1) {
    return "Please select your ticket category and quantity.";
  }

  if (!payload.attendeeNames) {
    return "Please enter the attendee name/s.";
  }

  if (!payload.paymentMethod || !payload.paymentReferenceNumber) {
    return "Please select your payment method and enter your payment reference number.";
  }

  if (!payload.agreement) {
    return "Please agree to the ticket policy before submitting.";
  }

  if (!APPS_SCRIPT_WEB_APP_URL || APPS_SCRIPT_WEB_APP_URL.includes("PASTE_YOUR")) {
    return "Please add your Google Apps Script Web App URL in script.js first.";
  }

  return "";
}

async function submitTicketBooking(payload) {
  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
  setMessage(formMessage, "Sending your booking...");

  try {
    await fetch(APPS_SCRIPT_WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    setMessage(
      formMessage,
      "Booking submitted! Please check your email for the pending verification message.",
      "success"
    );

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
    merchOrderPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    const firstField = merchForm.querySelector("input, select, textarea");
    firstField?.focus({ preventScroll: true });
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

// -------------------- Separate merch order --------------------

function getMerchTotalJPY() {
  const qty = Number(merchQuantity.value || 0);
  return MERCH_UNIT_PRICE_JPY * qty;
}

function updateMerchPaymentReferencePlaceholder() {
  merchPaymentReference.placeholder = getPaymentReferencePlaceholder(merchPaymentMethod.value);
}

function updateMerchTotal() {
  const jpyTotal = getMerchTotalJPY();
  const phpTotal = getPHPAmount(jpyTotal);
  const isPNB = merchPaymentMethod.value === "PNB / PHP";

  merchTotalAmountJPY.value = String(jpyTotal);
  merchTotalAmountPHP.value = String(phpTotal);
  merchPhpConversionRate.value = String(PHP_CONVERSION_RATE);
  merchTotalCurrency.value = isPNB ? "PHP" : "JPY";
  merchTotalAmount.value = String(isPNB ? phpTotal : jpyTotal);
  merchTotalAmountDisplay.value = isPNB ? formatPeso(phpTotal) : formatYen(jpyTotal);
  merchTotalAmountLabel.textContent = isPNB ? "Merch Total (PHP)" : "Merch Total";

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
  const color = formData.get("merchColor");
  const size = formData.get("merchSize");
  const buyerName = formData.get("fullName")?.trim();

  return {
    eventName: "JUDE PASTOR SOLO | Tokyo",
    orderType: "MERCH",
    orderLabel: "Official Merch Pre-order",

    fullName: buyerName,
    email: formData.get("email")?.trim(),
    contactNumber: formData.get("contactNumber")?.trim(),
    socialMedia: "",

    merchItem: "Official JUDE PASTOR SOLO | Tokyo T-shirt",
    merchColor: color,
    merchSize: size,
    merchUnitPriceJPY: MERCH_UNIT_PRICE_JPY,
    quantity: Number(formData.get("quantity")),

    fulfillmentMethod: "Venue pickup",
    pickupDate: "2026-09-27",
    pickupVenue: "Cafe & Diner Offza",

    paymentMethod: formData.get("paymentMethod"),
    paymentReferenceNumber: formData.get("paymentReference")?.trim(),
    proofOfPaymentUrl: "",

    totalAmount: Number(formData.get("totalAmount")),
    totalCurrency: formData.get("totalCurrency"),
    totalAmountJPY: Number(formData.get("totalAmountJPY")),
    totalAmountPHP: Number(formData.get("totalAmountPHP")),
    phpConversionRate: Number(formData.get("phpConversionRate")),

    agreement: formData.get("agreement") === "on",
    submittedAt: new Date().toISOString(),

    // Compatibility fields for an existing ticket-oriented Apps Script.
    // Your backend can use orderType to route this to a separate "Merch Orders" sheet.
    ticketCategory: `Merch — ${color || ""} / ${size || ""}`.trim(),
    attendeeNames: buyerName,
  };
}

function validateMerchPayload(payload) {
  if (!payload.fullName || !payload.email || !payload.contactNumber) {
    return "Please complete your contact information.";
  }

  if (!payload.merchColor || !payload.merchSize) {
    return "Please select your shirt color and size.";
  }

  if (!payload.quantity || payload.quantity < 1) {
    return "Please select the merch quantity.";
  }

  if (!payload.paymentMethod || !payload.paymentReferenceNumber) {
    return "Please select your payment method and enter your payment reference number.";
  }

  if (!payload.agreement) {
    return "Please agree to the merchandise pickup terms before submitting.";
  }

  if (!APPS_SCRIPT_WEB_APP_URL || APPS_SCRIPT_WEB_APP_URL.includes("PASTE_YOUR")) {
    return "Please add your Google Apps Script Web App URL in script.js first.";
  }

  return "";
}

async function submitMerchOrder(payload) {
  merchSubmitButton.disabled = true;
  merchSubmitButton.textContent = "Submitting...";
  setMessage(merchFormMessage, "Sending your merch pre-order...");

  try {
    await fetch(APPS_SCRIPT_WEB_APP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    setMessage(
      merchFormMessage,
      "Merch pre-order submitted! Please check your email for the pending verification message.",
      "success"
    );

    merchForm.reset();
    updateMerchPaymentReferencePlaceholder();
    updateMerchTotal();
  } catch (fetchError) {
    console.error(fetchError);
    setMessage(
      merchFormMessage,
      "Something went wrong. Please try again or contact the organizer.",
      "error"
    );
  } finally {
    merchSubmitButton.disabled = false;
    merchSubmitButton.textContent = "Submit Merch Pre-order";
  }
}

// Ticket event listeners
ticketCategory.addEventListener("change", updateTicketTotal);
quantity.addEventListener("change", updateTicketTotal);
paymentMethod.addEventListener("change", () => {
  updateTicketPaymentReferencePlaceholder();
  updateTicketTotal();
});

tierLinks.forEach((link) => {
  link.addEventListener("click", () => {
    ticketCategory.value = link.dataset.tierLink;
    updateTicketTotal();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = buildTicketPayload();
  const error = validateTicketPayload(payload);

  if (error) {
    setMessage(formMessage, error, "error");
    return;
  }

  await submitTicketBooking(payload);
});

// Featured merch CTA
merchOrderButton.addEventListener("click", openMerchOrderForm);
merchCloseButton.addEventListener("click", closeMerchOrderForm);

// Merch event listeners
merchQuantity.addEventListener("change", updateMerchTotal);
merchPaymentMethod.addEventListener("change", () => {
  updateMerchPaymentReferencePlaceholder();
  updateMerchTotal();
});

merchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = buildMerchPayload();
  const error = validateMerchPayload(payload);

  if (error) {
    setMessage(merchFormMessage, error, "error");
    return;
  }

  await submitMerchOrder(payload);
});

// Initial state
updateTicketPaymentReferencePlaceholder();
updateTicketTotal();
updateMerchPaymentReferencePlaceholder();
updateMerchTotal();

// Small scroll animations
const animatedItems = document.querySelectorAll(
  ".section-heading, .two-column > div, .ticket-card, .merch-feature, .booking-form, .policy-box, .site-footer"
);

if ("IntersectionObserver" in window) {
  animatedItems.forEach((item) => item.classList.add("reveal-on-scroll"));

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  animatedItems.forEach((item) => revealObserver.observe(item));
} else {
  animatedItems.forEach((item) => item.classList.add("is-visible"));
}
