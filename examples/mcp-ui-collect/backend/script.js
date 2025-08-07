// VGS Collect Form Implementation
const VAULT_ID = "tntonm7yolo"; // replace with your Vault ID
const ENVIRONMENT = "sandbox";

// Initialize the form
const form = VGSCollect.create(VAULT_ID, ENVIRONMENT, () => { 
  console.log("Form created successfully");
});

// CSS styling for form fields
const css = {
  "vertical-align": "middle",
  "white-space": "normal",
  "background": "none",
  "font-family": "sofia, arial, sans-serif",
  "font-size": "16px",
  "color": "rgb(34, 25, 36)",
  "line-height": "normal",
  "padding": "8px 12px",
  "box-sizing": "border-box",
  "border": "1px solid #ced4da",
  "border-radius": "4px",
  "width": "100%",
  "&::placeholder": {
    "color": "#6A6A6A"
  },
  "&:focus": {
    "border-color": "#80bdff",
    "outline": "0",
    "box-shadow": "0 0 0 0.2rem rgba(0,123,255,.25)"
  }
};

// Create form fields
form.cardholderNameField('#cardholder-name', { 
  placeholder: 'Jane Doe', 
  css: css 
});

form.cardNumberField('#card-number', { 
  placeholder: '4111 1111 1111 1111', 
  css: css 
});

form.cardExpirationDateField('#card-expiration', { 
  placeholder: 'MM / YY', 
  css: css 
});

form.cardCVCField('#card-cvc', { 
  placeholder: '123', 
  css: css 
});

// Handle form submission
document.getElementById('submit-btn').addEventListener('click', async () => {
  const submitBtn = document.getElementById('submit-btn');
  const errorDiv = document.getElementById('error');
  
  // Hide previous results
  errorDiv.style.display = 'none';
  
  // Disable button and show loading
  submitBtn.disabled = true;
  submitBtn.textContent = 'Processing...';
  
  try {
    // Get JWT token from backend
    const res = await fetch('http://localhost:8080/get-collect-token');
    if (!res.ok) {
      throw new Error('Failed to get authentication token');
    }
    
    const { access_token } = await res.json();

    // Create card using VGS Collect
    form.createCard({
      auth: access_token,
      data: {
        "cardholder": {}
      }
    },
    function (status, card_object) {
      // Success callback
      console.log("Card created successfully!");
      console.log("Card ID: " + card_object);

      errorDiv.style.display = 'none';

      window.parent.postMessage({type: 'ui-action', action: 'card-created', card: card_object}, '*');

    },
    function (e) {
      // Error callback
      console.log("Card creation failed:", e);
      
      const errorDetails = document.getElementById('error-details');
      errorDetails.innerHTML = `
        <p><strong>Error:</strong> ${e.message || 'Unknown error occurred'}</p>
        <p><strong>Details:</strong> ${JSON.stringify(e, null, 2)}</p>
      `;
      
      errorDiv.style.display = 'block';
    });
    
  } catch (err) {
    console.error('Error:', err);
    
    const errorDetails = document.getElementById('error-details');
    errorDetails.innerHTML = `
      <p><strong>Error:</strong> ${err.message}</p>
    `;
    
    errorDiv.style.display = 'block';
  } finally {
    // Re-enable button
    submitBtn.disabled = false;
    submitBtn.textContent = 'Collect Card';
  }
}); 