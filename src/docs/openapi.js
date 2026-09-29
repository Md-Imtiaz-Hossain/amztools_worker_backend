/**
 * OpenAPI 3.0 Specification for Product CRUD API
 */

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "AMZ Tools - Product Worker API",
    version: "1.0.0",
    description: "Cloudflare Worker REST API for wholesale Amazon product catalog data and analytics on Cloudflare D1."
  },
  servers: [
    {
      url: "/",
      description: "Current Cloudflare Worker Host"
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your session token obtained from /api/auth/login"
      }
    },
    schemas: {
      LoginRequest: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string", example: "admin" },
          password: { type: "string", example: "password123" }
        }
      },
      LoginResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          expiresAt: { type: "string", format: "date-time" },
          expiresInSeconds: { type: "integer", example: 604800 },
          user: {
            type: "object",
            properties: {
              username: { type: "string", example: "admin" }
            }
          }
        }
      },
      Product: {
        type: "object",
        required: ["asin", "wholesaler_company_name"],
        properties: {
          id: { type: "integer", example: 1 },
          asin: { type: "string", example: "B08N5WRWNW" },
          parent_asin: { type: "string", example: "B08N5WRWNW" },
          product_id: { type: "string", example: "0194252056883" },
          favorite: { type: "integer", example: 0 },
          wholesaler_company_name: { type: "string", example: "ABC Wholesale LLC" },
          brand: { type: "string", example: "Sony" },
          brand_restriction: { type: "string", example: "None" },
          selling_restriction: { type: "string", example: "None" },
          selling_restriction_link: { type: "string", example: "https://sellercentral.amazon.com" },
          title: { type: "string", example: "Wireless Noise-Canceling Headphones" },
          package_quantity: { type: "integer", example: 1 },
          amazon_link: { type: "string", example: "https://www.amazon.com/dp/B08N5WRWNW" },
          about_this_item: { type: "string", example: "Industry leading noise cancellation..." },
          category: { type: "string", example: "Electronics" },
          is_top_level_category: { type: "string", example: "Yes" },
          sales_rank: { type: "integer", example: 450 },
          sub_category: { type: "string", example: "Over-Ear Headphones" },
          sub_category_sales_rank: { type: "integer", example: 12 },
          cost: { type: "number", example: 140.00 },
          sell_price: { type: "number", example: 248.00 },
          break_even_sell_price: { type: "number", example: 185.50 },
          buybox_landed: { type: "number", example: 248.00 },
          lowest_fba: { type: "number", example: 248.00 },
          lowest_fbm: { type: "number", example: 245.00 },
          seller_proceeds: { type: "number", example: 202.30 },
          current_est_sales: { type: "integer", example: 850 },
          estimated_monthly_revenue: { type: "number", example: 210800.00 },
          profit: { type: "number", example: 62.30 },
          margin_pct: { type: "number", example: 25.12 },
          roi_pct: { type: "number", example: 44.50 },
          referral_fee_pct: { type: "number", example: 15.0 },
          referral_fee: { type: "number", example: 37.20 },
          fba_pick_pack_fee: { type: "number", example: 6.50 },
          inbound_placement_fee: { type: "number", example: 1.00 },
          fulfillment_subtotal: { type: "number", example: 7.50 },
          cost_subtotal: { type: "number", example: 147.50 },
          vat_pct: { type: "number", example: 0.0 },
          vat_amount: { type: "number", example: 0.0 },
          inbound_shipping_estimate: { type: "number", example: 1.00 },
          package_dimensions: { type: "string", example: "8.5 x 6.2 x 3.1 inches" },
          package_weight_lb: { type: "number", example: 1.25 },
          color: { type: "string", example: "Black" },
          model: { type: "string", example: "WH-1000XM4" },
          size: { type: "string", example: "Standard" },
          part_number: { type: "string", example: "WH1000XM4/B" },
          material: { type: "string", example: "Plastic/Leather" },
          manufacturer: { type: "string", example: "Sony" },
          total_offers: { type: "integer", example: 14 },
          new_fba_offers: { type: "integer", example: 6 },
          new_fbm_offers: { type: "integer", example: 8 },
          buybox_contention: { type: "integer", example: 3 },
          customer_reviews: { type: "string", example: "Great sound and battery life" },
          average_rating: { type: "number", example: 4.6 },
          total_review_count: { type: "integer", example: 48920 },
          is_hazmat: { type: "string", example: "No" },
          keepa: { type: "string", example: "https://keepa.com/#!product/1-B08N5WRWNW" },
          camelcc: { type: "string", example: "https://camelcamelcamel.com/product/B08N5WRWNW" },
          custom_notes: { type: "string", example: "High demand seasonal product" },
          product_image_link_1: { type: "string", example: "https://m.media-amazon.com/images/I/71o8OR--t9L._AC_SL1500_.jpg" },
          product_image_link_2: { type: "string", example: "" },
          product_image_link_3: { type: "string", example: "" },
          product_image_link_4: { type: "string", example: "" },
          product_image_link_5: { type: "string", example: "" },
          last_run: { type: "string", example: "2026-09-28 20:00:00" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      }
    }
  },
  paths: {
    "/api/auth/login": {
      post: {
        summary: "User Login",
        description: "Authenticates with username and password. Returns a 1-week valid session JWT token.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" }
              }
            }
          },
          401: { description: "Invalid credentials" }
        }
      }
    },
    "/api/auth/logout": {
      post: {
        summary: "User Logout",
        description: "Logs out the user and clears session.",
        responses: {
          200: { description: "Logged out successfully" }
        }
      }
    },
    "/api/auth/me": {
      get: {
        summary: "Verify Session",
        description: "Checks if the provided Bearer token is valid and active.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Active session" },
          401: { description: "Invalid or expired token" }
        }
      }
    },
    "/api/products": {
      get: {
        summary: "List Products",
        description: "Fetch paginated products with multi-column filtering, global search, and sorting.",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number" },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 }, description: "Items per page (default: 20, max: 100)" },
          { name: "search", in: "query", schema: { type: "string" }, description: "Filter by product name (title) or description (about_this_item)" },
          { name: "q", in: "query", schema: { type: "string" }, description: "Global search keyword" },
          { name: "sortBy", in: "query", schema: { type: "string", default: "id" }, description: "Sort column name" },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["ASC", "DESC"], default: "DESC" }, description: "Sort direction" },
          { name: "asin", in: "query", schema: { type: "string" }, description: "Filter by ASIN" },
          { name: "brand", in: "query", schema: { type: "string" }, description: "Filter by Brand" },
          { name: "wholesaler_company_name", in: "query", schema: { type: "string" }, description: "Filter by Wholesaler" },
          { name: "category", in: "query", schema: { type: "string" }, description: "Filter by Category" },
          { name: "sales_rank_min", in: "query", schema: { type: "integer" }, description: "Minimum sales rank" },
          { name: "sales_rank_max", in: "query", schema: { type: "integer" }, description: "Maximum sales rank" },
          { name: "profit_min", in: "query", schema: { type: "number" }, description: "Minimum profit ($)" },
          { name: "roi_pct_min", in: "query", schema: { type: "number" }, description: "Minimum ROI (%)" }
        ],
        responses: {
          200: {
            description: "Paginated product list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Product" }
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        totalItems: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" },
                        hasPrev: { type: "boolean" },
                        hasNext: { type: "boolean" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: "Create Product",
        description: "Create a new wholesale product record (Requires Bearer token).",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Product" }
            }
          }
        },
        responses: {
          201: { description: "Product created successfully" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/api/products/columns": {
      get: {
        summary: "Get Columns Metadata",
        description: "Returns metadata for all available database columns for table configuration and search.",
        responses: {
          200: { description: "Column definitions" }
        }
      }
    },
    "/api/products/{id}": {
      get: {
        summary: "Get Product by ID",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, description: "Product ID" }
        ],
        responses: {
          200: { description: "Product found" },
          404: { description: "Product not found" }
        }
      },
      put: {
        summary: "Update Product",
        description: "Update an existing product (Requires Bearer token).",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, description: "Product ID" }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Product" }
            }
          }
        },
        responses: {
          200: { description: "Product updated successfully" },
          401: { description: "Unauthorized" },
          404: { description: "Product not found" }
        }
      },
      delete: {
        summary: "Delete Product",
        description: "Delete a product by ID (Requires Bearer token).",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, description: "Product ID" }
        ],
        responses: {
          200: { description: "Product deleted successfully" },
          401: { description: "Unauthorized" },
          404: { description: "Product not found" }
        }
      }
    },
    "/api/products/batch-delete": {
      post: {
        summary: "Batch Delete Products",
        description: "Delete multiple products by an array of IDs (Requires Bearer token).",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  ids: {
                    type: "array",
                    items: { type: "integer" }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Batch delete completed" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/api/products/init-table": {
      post: {
        summary: "Initialize Table Schema",
        description: "Executes DDL statements to create wholesale_products table and indexes on D1 if not existing.",
        responses: {
          200: { description: "Table and indexes initialized" }
        }
      }
    }
  }
};

/**
 * Returns standalone Swagger UI HTML page
 */
export function getSwaggerHtml(specUrl = "/openapi.json") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AMZ Tools API Documentation - Swagger UI</title>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/favicon-32x32.png" sizes="32x32" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .topbar { background-color: #1a202c !important; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;
}
