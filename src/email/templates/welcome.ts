export const welcomeTemplate = (data: any) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to E-Commerce AI Engine</title>
    <style>
      body {
        font-family: 'Segoe UI', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background: linear-gradient(135deg, #1a237e, #283593);
        color: white;
        padding: 40px 30px;
        text-align: center;
        border-radius: 10px 10px 0 0;
      }
      .header h1 { margin: 0; font-size: 32px; }
      .content {
        background: #fff;
        padding: 30px;
        border: 1px solid #e0e0e0;
        border-top: none;
        border-radius: 0 0 10px 10px;
      }
      .features {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin: 20px 0;
      }
      .feature-box {
        padding: 15px;
        background: #f5f5f5;
        border-radius: 5px;
        text-align: center;
      }
      .feature-box h4 { margin: 10px 0 0; color: #1a237e; }
      .button {
        display: inline-block;
        padding: 12px 30px;
        background: #1a237e;
        color: white;
        text-decoration: none;
        border-radius: 5px;
        margin-top: 20px;
      }
      .footer {
        text-align: center;
        padding: 20px;
        color: #888;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>🚀 Welcome!</h1>
      <p>Start exploring the future of e-commerce</p>
    </div>

    <div class="content">
      <h2>Hi ${data.name},</h2>
      <p>We're thrilled to have you on board! Your account has been successfully created.</p>

      <div class="features">
        <div class="feature-box">
          <span style="font-size: 30px;">🛍️</span>
          <h4>Smart Shopping</h4>
          <p style="font-size: 12px;">AI-powered product recommendations</p>
        </div>
        <div class="feature-box">
          <span style="font-size: 30px;">🔍</span>
          <h4>Visual Search</h4>
          <p style="font-size: 12px;">Find products using images</p>
        </div>
        <div class="feature-box">
          <span style="font-size: 30px;">📦</span>
          <h4>Fast Delivery</h4>
          <p style="font-size: 12px;">Track your orders in real-time</p>
        </div>
        <div class="feature-box">
          <span style="font-size: 30px;">💳</span>
          <h4>Secure Payments</h4>
          <p style="font-size: 12px;">Multiple payment options</p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.CLIENT_URL}" class="button">Start Shopping</a>
      </div>

      <p style="margin-top: 30px; color: #666;">
        If you have any questions, feel free to reply to this email or visit our help center.
      </p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} E-Commerce AI Engine. All rights reserved.</p>
    </div>
  </body>
  </html>
`;