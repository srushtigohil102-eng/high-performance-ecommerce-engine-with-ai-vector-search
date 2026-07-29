import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Application } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Commerce AI Engine API",
      version: "1.0.0",
      description: "High-Performance E-Commerce Engine with AI Vector Search",
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
      contact: {
        name: "API Support",
        email: "support@ecommerce-ai.com",
        url: "http://localhost:5000",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development Server",
      },
      {
        url: "https://api.ecommerce-ai.com",
        description: "Production Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        // ===== USER SCHEMAS =====
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["admin", "user"] },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["firstName", "lastName", "email", "password"],
          properties: {
            firstName: { type: "string", example: "John" },
            lastName: { type: "string", example: "Doe" },
            email: { type: "string", example: "john@example.com" },
            password: { type: "string", example: "Password123" },
            role: { type: "string", enum: ["admin", "user"], example: "user" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "john@example.com" },
            password: { type: "string", example: "Password123" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                token: { type: "string" },
                user: { $ref: "#/components/schemas/User" },
              },
            },
          },
        },

        // ===== PRODUCT SCHEMAS =====
        Product: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            comparePrice: { type: "number" },
            category: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            images: { type: "array", items: { type: "string" } },
            stock: { type: "number" },
            sku: { type: "string" },
            ratings: { type: "number" },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        CreateProductRequest: {
          type: "object",
          required: ["name", "description", "price", "category", "sku", "stock"],
          properties: {
            name: { type: "string", example: "Smartphone X" },
            description: { type: "string", example: "Latest smartphone with AI features" },
            price: { type: "number", example: 599.99 },
            comparePrice: { type: "number", example: 699.99 },
            category: { type: "string", example: "Electronics" },
            tags: { type: "string", example: "phone,smart,5G" },
            stock: { type: "number", example: 50 },
            sku: { type: "string", example: "PHONE001" },
          },
        },
        ProductResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { $ref: "#/components/schemas/Product" },
          },
        },
        ProductsResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "array", items: { $ref: "#/components/schemas/Product" } },
            pagination: {
              type: "object",
              properties: {
                page: { type: "number" },
                limit: { type: "number" },
                total: { type: "number" },
                pages: { type: "number" },
              },
            },
          },
        },

        // ===== CART SCHEMAS =====
        CartItem: {
          type: "object",
          properties: {
            product: { $ref: "#/components/schemas/Product" },
            quantity: { type: "number" },
          },
        },
        Cart: {
          type: "object",
          properties: {
            items: { type: "array", items: { $ref: "#/components/schemas/CartItem" } },
            totalItems: { type: "number" },
            totalPrice: { type: "number" },
          },
        },
        AddToCartRequest: {
          type: "object",
          required: ["productId", "quantity"],
          properties: {
            productId: { type: "string" },
            quantity: { type: "number", minimum: 1, example: 2 },
          },
        },

        // ===== ORDER SCHEMAS =====
        ShippingAddress: {
          type: "object",
          required: ["fullName", "address", "city", "state", "pincode", "phone"],
          properties: {
            fullName: { type: "string", example: "John Doe" },
            address: { type: "string", example: "123 Main St" },
            city: { type: "string", example: "Mumbai" },
            state: { type: "string", example: "Maharashtra" },
            pincode: { type: "string", example: "400001" },
            country: { type: "string", example: "India" },
            phone: { type: "string", example: "9876543210" },
          },
        },
        Order: {
          type: "object",
          properties: {
            _id: { type: "string" },
            orderNumber: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
            items: { type: "array" },
            totalAmount: { type: "number" },
            status: { type: "string", enum: ["pending", "processing", "shipped", "delivered", "cancelled"] },
            paymentStatus: { type: "string", enum: ["pending", "paid", "failed", "refunded"] },
            shippingAddress: { $ref: "#/components/schemas/ShippingAddress" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        CreateOrderRequest: {
          type: "object",
          required: ["shippingAddress"],
          properties: {
            shippingAddress: { $ref: "#/components/schemas/ShippingAddress" },
            paymentMethod: { type: "string", example: "card" },
          },
        },

        // ===== SEARCH SCHEMAS =====
        SearchResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            searchType: { type: "string", enum: ["text", "vector", "hybrid"] },
            count: { type: "number" },
            data: { type: "array", items: { $ref: "#/components/schemas/Product" } },
          },
        },

        // ===== ERROR SCHEMAS =====
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            error: { type: "string" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Products", description: "Product management" },
      { name: "Cart", description: "Shopping cart" },
      { name: "Orders", description: "Order management" },
      { name: "Search", description: "AI-powered search" },
      { name: "Payments", description: "Payment processing" },
      { name: "Reports", description: "Report generation" },
      { name: "Dashboard", description: "Admin dashboard" },
      { name: "Health", description: "System health monitoring" },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("📚 Swagger Docs available at: http://localhost:5000/api-docs");
};