export const orderConfirmationTemplate = (data: any) => {
  const itemsHtml = data.items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
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
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .header h1 { margin: 0; font-size: 28px; }
        .content {
          background: #fff;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-top: none;
          border-radius: 0 0 10px 10px;
        }
        .order-details {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background: #1a237e;
          color: white;
          padding: 12px;
          text-align: left;
        }
        td { padding: 10px; }
        .total-row { font-weight: bold; font-size: 18px; }
        .total-row td { border-top: 2px solid #1a237e; padding-top: 15px; }
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
        .status-badge {
          display: inline-block;
          padding: 5px 15px;
          border-radius: 20px;
          background: #4caf50;
          color: white;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Order Confirmed!</h1>
        <p>Thank you for your order</p>
      </div>

      <div class="content">
        <h2>Hi ${data.customerName},</h2>
        <p>Your order has been confirmed and is being processed.</p>

        <div class="order-details">
          <p><strong>Order Number:</strong> #${data.orderNumber}</p>
          <p><strong>Order Date:</strong> ${data.orderDate}</p>
          <p><strong>Payment Method:</strong> ${data.paymentMethod || 'Card'}</p>
          <p><strong>Status:</strong> <span class="status-badge">${data.status}</span></p>
        </div>

        <h3>Order Items</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr class="total-row">
              <td colspan="3" style="text-align: right;">Total</td>
              <td style="text-align: right;">$${data.totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 5px;">
          <h4>📦 Shipping Address</h4>
          <p>
            ${data.shippingAddress.fullName}<br>
            ${data.shippingAddress.address}<br>
            ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.pincode}<br>
            ${data.shippingAddress.country}<br>
            Phone: ${data.shippingAddress.phone}
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.CLIENT_URL}/orders/${data.orderId}" class="button">View Order</a>
        </div>

        <p style="margin-top: 30px; color: #666;">
          We'll notify you when your order ships. If you have any questions, please contact our support team.
        </p>
      </div>

      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} E-Commerce AI Engine. All rights reserved.</p>
        <p>This email was sent to ${data.customerEmail}</p>
      </div>
    </body>
    </html>
  `;
};