// PSP Token Provisioner Frontend

// Sample card object for testing
const sampleCardObject = {
  "data": {
    "id": "CRDecqZp3xRgXU3TFmtcDdzQs",
    "type": "cards",
    "attributes": {
      "pan_alias": "tok_abcdefghijklmnop",
      "cvc_alias": "tok_zbcdefgh",
      "cvc_status": "active",
      "bin": "411111",
      "first8": "41111111",
      "last4": "1111",
      "exp_month": 5,
      "exp_year": 28,
      "card_fingerprint": "6TeSCB16LtyifEAmY2goxYfSk5sALriXpefzzxh29xhu",
      "capabilities": [
        "network-tokens",
        "card-updates"
      ],
      "created_at": "2025-08-01T00:00:00Z",
      "updated_at": "2025-08-01T00:00:00Z"
    },
    "meta": {
      "token_type": "pan"
    }
  }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  checkConfiguration();
  displaySampleCardObject();
  setupEventListeners();
});

// Check server configuration
async function checkConfiguration() {
  const configStatus = document.getElementById('config-status');
  
  try {
    const response = await fetch('/config');
    const config = await response.json();
    
    let statusHtml = `
      <strong>Configuration Status:</strong><br>
      <strong>Vault ID:</strong> ${config.vault_id}<br>
      <strong>Environment:</strong> ${config.environment}<br>
      <strong>Outbound URL:</strong> ${config.outbound_url}<br>
      <strong>PSP Configured:</strong> ${config.psp_configured ? '✅ Yes' : '❌ No'}
    `;
    
    configStatus.innerHTML = statusHtml;
    configStatus.className = config.psp_configured ? 'alert alert-success' : 'alert alert-warning';
    
  } catch (error) {
    configStatus.innerHTML = `
      <strong>Configuration Status:</strong> ❌ Error connecting to server<br>
      <small>Error: ${error.message}</small>
    `;
    configStatus.className = 'alert alert-danger';
  }
}

// Display sample card object
function displaySampleCardObject() {
  const sampleElement = document.getElementById('sample-card-object');
  sampleElement.textContent = JSON.stringify(sampleCardObject, null, 2);
}

// Setup event listeners
function setupEventListeners() {
  // Load sample button
  document.getElementById('load-sample').addEventListener('click', function() {
    document.getElementById('card-object').value = JSON.stringify(sampleCardObject, null, 2);
  });
  
  // Provision button
  document.getElementById('provision-btn').addEventListener('click', provisionPSPToken);
}

// Provision PSP token
async function provisionPSPToken() {
  const provisionBtn = document.getElementById('provision-btn');
  const resultDiv = document.getElementById('result');
  const errorDiv = document.getElementById('error');
  const cardObjectText = document.getElementById('card-object').value;
  const pspProvider = document.getElementById('psp-provider').value;
  
  // Hide previous results
  resultDiv.style.display = 'none';
  errorDiv.style.display = 'none';
  
  // Validate input
  if (!cardObjectText.trim()) {
    showError('Please enter a card object');
    return;
  }
  
  let cardObject;
  try {
    cardObject = JSON.parse(cardObjectText);
  } catch (error) {
    showError('Invalid JSON format for card object');
    return;
  }
  
  // Validate card object structure
  if (!cardObject.data || !cardObject.data.attributes) {
    showError('Invalid card object structure. Missing data.attributes');
    return;
  }
  
  // Disable button and show loading
  provisionBtn.disabled = true;
  provisionBtn.textContent = 'Provisioning...';
  
  try {
    const response = await fetch('/provision-psp-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cardObject: cardObject,
        pspProvider: pspProvider
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showSuccess(result);
    } else {
      showError(result.error || 'Failed to provision PSP token');
    }
    
  } catch (error) {
    console.error('Error:', error);
    showError(`Network error: ${error.message}`);
  } finally {
    // Re-enable button
    provisionBtn.disabled = false;
    provisionBtn.textContent = 'Provision PSP Token';
  }
}

// Show success message
function showSuccess(result) {
  const resultDiv = document.getElementById('result');
  const pspDetails = document.getElementById('psp-details');
  
  pspDetails.innerHTML = `
    <p><strong>PSP Token:</strong> ${result.psp_token}</p>
    <p><strong>Card ID:</strong> ${result.card_id}</p>
    <p><strong>Payment Method ID:</strong> ${result.payment_method.id}</p>
    <p><strong>Card Type:</strong> ${result.payment_method.card.brand}</p>
    <p><strong>Last 4:</strong> ${result.payment_method.card.last4}</p>
    <p><strong>Expiration:</strong> ${result.payment_method.card.exp_month}/${result.payment_method.card.exp_year}</p>
    <details>
      <summary>Full Payment Method Response</summary>
      <pre class="mt-2">${JSON.stringify(result.payment_method, null, 2)}</pre>
    </details>
  `;
  
  resultDiv.style.display = 'block';
  document.getElementById('error').style.display = 'none';
}

// Show error message
function showError(message) {
  const errorDiv = document.getElementById('error');
  const errorDetails = document.getElementById('error-details');
  
  errorDetails.innerHTML = `<p>${message}</p>`;
  errorDiv.style.display = 'block';
  document.getElementById('result').style.display = 'none';
} 