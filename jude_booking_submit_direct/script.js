// Google Apps Script Web App URL
const APPS_SCRIPT_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzRogsbGomF7zD8UBWnauuYjFfMayGebzp75Zc0Z2eYcgPPPT6VvVKuYR8gwSkcJ9626Q/exec";

const PHP_CONVERSION_RATE = 0.4;

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

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMultiline(value = "") {
  return escapeHTML(value).replace(/\n/g, "<br />");
}

function getTicketTotalJPY() {
  const selectedOption = ticketCategory.options[ticketCategory.selectedIndex];
  const price = Number(selectedOption?.dataset?.price || 0);
  const qty = Number(quantity.value || 0);

  return price * qty;
}

function getTicketTotalPHP(jpyTotal) {
  return Math.round((jpyTotal || 0) * PHP_CONVERSION_RATE);
}

function getAmountText(jpyTotal, phpTotal) {
  if (paymentMethod.value === "PNB / PHP") {
    return formatPeso(phpTotal);
  }

  return formatYen(jpyTotal);
}

function updatePaymentReferencePlaceholder() {
  const placeholders = {
    PayPay: "PayPay transaction/reference number",
    "Bank Transfer": "Transfer name/reference number",
    "PNB / PHP": "PNB/InstaPay reference number",
  };

  paymentReference.placeholder = placeholders[paymentMethod.value] || "Select payment method first";
}

function updatePaymentDetails(jpyTotal, phpTotal) {
  const method = paymentMethod.value;

  if (!method) {
    paymentDetails.hidden = true;
    paymentInfoContent.innerHTML = "";
    paymentDetailsTitle.textContent = "Select a payment method";
    paymentAmountText.textContent = getAmountText(jpyTotal, phpTotal);
    return;
  }

  paymentDetails.hidden = false;
  paymentAmountText.textContent = getAmountText(jpyTotal, phpTotal);

  if (method === "PayPay") {
    paymentDetailsTitle.textContent = "PayPay QR Payment";
    paymentInfoContent.innerHTML = `
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
    `;
    return;
  }

  if (method === "Bank Transfer") {
    paymentDetailsTitle.textContent = "Japan Post Bank Transfer";
    paymentInfoContent.innerHTML = `
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
    `;
    return;
  }

  if (method === "PNB / PHP") {
    paymentDetailsTitle.textContent = "PNB / PHP Payment";
    paymentInfoContent.innerHTML = `
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
    `;
  }
}

function updateTotal() {
  const jpyTotal = getTicketTotalJPY();
  const phpTotal = getTicketTotalPHP(jpyTotal);
  const isPNB = paymentMethod.value === "PNB / PHP";

  totalAmountJPY.value = String(jpyTotal);
  totalAmountPHP.value = String(phpTotal);
  phpConversionRate.value = String(PHP_CONVERSION_RATE);
  totalCurrency.value = isPNB ? "PHP" : "JPY";

  totalAmount.value = String(isPNB ? phpTotal : jpyTotal);
  totalAmountDisplay.value = isPNB ? formatPeso(phpTotal) : formatYen(jpyTotal);
  totalAmountLabel.textContent = isPNB ? "Total Amount (PHP)" : "Total Amount";

  updatePaymentDetails(jpyTotal, phpTotal);
}

function setMessage(message, type = "") {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`.trim();
}

function getDisplayAmount(payload) {
  if (payload.totalCurrency === "PHP") {
    return formatPeso(payload.totalAmountPHP || payload.totalAmount);
  }

  return formatYen(payload.totalAmountJPY || payload.totalAmount);
}

function buildPayload() {
  const formData = new FormData(form);

  return {
    eventName: "JUDE PASTOR SOLO | Tokyo",

    // Buyer information
    fullName: formData.get("fullName")?.trim(),
    email: formData.get("email")?.trim(),
    contactNumber: formData.get("contactNumber")?.trim(),

    // Apps Script expects this name: socialMedia
    socialMedia: formData.get("socialHandle")?.trim(),

    // Ticket information
    ticketCategory: formData.get("ticketCategory"),
    quantity: Number(formData.get("quantity")),
    attendeeNames: formData.get("attendeeNames")?.trim(),

    // Payment information
    paymentMethod: formData.get("paymentMethod"),

    // Apps Script expects this name: paymentReferenceNumber
    paymentReferenceNumber: formData.get("paymentReference")?.trim(),

    // Optional for now
    proofOfPaymentUrl: "",

    // Amount selected for the chosen payment method
    totalAmount: Number(formData.get("totalAmount")),
    totalCurrency: formData.get("totalCurrency"),
    totalAmountJPY: Number(formData.get("totalAmountJPY")),
    totalAmountPHP: Number(formData.get("totalAmountPHP")),
    phpConversionRate: Number(formData.get("phpConversionRate")),

    agreement: formData.get("agreement") === "on",
    submittedAt: new Date().toISOString(),
  };
}

function validatePayload(payload) {
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

async function submitBooking(payload) {
  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
  setMessage("Sending your booking...", "");

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
      "Booking submitted! Please check your email for the pending verification message.",
      "success"
    );

    form.reset();
    updatePaymentReferencePlaceholder();
    updateTotal();
  } catch (fetchError) {
    console.error(fetchError);
    setMessage(
      "Something went wrong. Please try again or contact the organizer.",
      "error"
    );
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Booking";
  }
}

ticketCategory.addEventListener("change", updateTotal);
quantity.addEventListener("change", updateTotal);
paymentMethod.addEventListener("change", () => {
  updatePaymentReferencePlaceholder();
  updateTotal();
});

tierLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const tier = link.dataset.tierLink;
    ticketCategory.value = tier;
    updateTotal();

    const formSection = document.querySelector("#bookingForm");
    formSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = buildPayload();
  const error = validatePayload(payload);

  if (error) {
    setMessage(error, "error");
    return;
  }

  await submitBooking(payload);
});

updatePaymentReferencePlaceholder();
updateTotal();

// Small scroll animations
const animatedItems = document.querySelectorAll(
  ".section-heading, .two-column > div, .ticket-card, .booking-form, .policy-box, .site-footer"
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
