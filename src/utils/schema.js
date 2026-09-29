/**
 * Cloudflare D1 Table Schema & Column Metadata
 */

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS wholesale_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Identification & Supplier
    asin TEXT NOT NULL,
    parent_asin TEXT,
    product_id TEXT,
    favorite INTEGER DEFAULT 0,
    wholesaler_company_name TEXT NOT NULL,
    
    -- Product Metadata
    brand TEXT,
    brand_restriction TEXT,
    selling_restriction TEXT,
    selling_restriction_link TEXT,
    title TEXT,
    package_quantity INTEGER,
    amazon_link TEXT,
    about_this_item TEXT,
    
    -- Categorization & Hierarchy
    category TEXT,
    is_top_level_category TEXT,
    sales_rank INTEGER,
    sub_category TEXT,
    sub_category_sales_rank INTEGER,
    
    -- Pricing, Costs & Revenues
    cost REAL,
    sell_price REAL,
    break_even_sell_price REAL,
    buybox_landed REAL,
    lowest_fba REAL,
    lowest_fbm REAL,
    seller_proceeds REAL,
    current_est_sales INTEGER,
    estimated_monthly_revenue REAL,
    profit REAL,
    margin_pct REAL,
    roi_pct REAL,
    
    -- Fees Breakdown
    referral_fee_pct REAL,
    referral_fee REAL,
    fba_pick_pack_fee REAL,
    inbound_placement_fee REAL,
    fulfillment_subtotal REAL,
    cost_subtotal REAL,
    vat_pct REAL,
    vat_amount REAL,
    inbound_shipping_estimate REAL,
    
    -- Dimensions & Physical Attributes
    package_dimensions TEXT,
    package_weight_lb REAL,
    color TEXT,
    model TEXT,
    size TEXT,
    part_number TEXT,
    material TEXT,
    manufacturer TEXT,
    
    -- Competition & Ratings
    total_offers INTEGER,
    new_fba_offers INTEGER,
    new_fbm_offers INTEGER,
    buybox_contention INTEGER,
    customer_reviews TEXT,
    average_rating REAL,
    total_review_count INTEGER,
    
    -- External Tools & Notes
    is_hazmat TEXT,
    keepa TEXT,
    camelcc TEXT,
    custom_notes TEXT,
    
    -- Product Images
    product_image_link_1 TEXT,
    product_image_link_2 TEXT,
    product_image_link_3 TEXT,
    product_image_link_4 TEXT,
    product_image_link_5 TEXT,

    -- Execution Timestamps
    last_run TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(asin, wholesaler_company_name)
);

CREATE INDEX IF NOT EXISTS idx_wholesale_asin ON wholesale_products(asin);
CREATE INDEX IF NOT EXISTS idx_wholesale_product_id ON wholesale_products(product_id);
CREATE INDEX IF NOT EXISTS idx_wholesale_wholesaler ON wholesale_products(wholesaler_company_name);
CREATE INDEX IF NOT EXISTS idx_wholesale_category ON wholesale_products(category);
CREATE INDEX IF NOT EXISTS idx_wholesale_sales_rank ON wholesale_products(sales_rank);
CREATE INDEX IF NOT EXISTS idx_wholesale_profit ON wholesale_products(profit);
CREATE INDEX IF NOT EXISTS idx_wholesale_roi ON wholesale_products(roi_pct);
CREATE INDEX IF NOT EXISTS idx_wholesale_last_run ON wholesale_products(last_run);
`;

// Detailed column definitions for UI and API validation
export const COLUMN_DEFINITIONS = [
  { key: "id", label: "ID", type: "number", category: "System", defaultVisible: true },
  { key: "asin", label: "ASIN", type: "text", category: "Basic", defaultVisible: true },
  { key: "title", label: "Title", type: "text", category: "Basic", defaultVisible: true },
  { key: "brand", label: "Brand", type: "text", category: "Basic", defaultVisible: true },
  { key: "wholesaler_company_name", label: "Wholesaler", type: "text", category: "Basic", defaultVisible: true },
  { key: "category", label: "Category", type: "text", category: "Basic", defaultVisible: true },
  { key: "sales_rank", label: "Sales Rank", type: "number", category: "Metrics", defaultVisible: true },
  { key: "cost", label: "Cost ($)", type: "currency", category: "Financials", defaultVisible: true },
  { key: "sell_price", label: "Sell Price ($)", type: "currency", category: "Financials", defaultVisible: true },
  { key: "profit", label: "Profit ($)", type: "currency", category: "Financials", defaultVisible: true },
  { key: "margin_pct", label: "Margin %", type: "percent", category: "Financials", defaultVisible: true },
  { key: "roi_pct", label: "ROI %", type: "percent", category: "Financials", defaultVisible: true },
  { key: "current_est_sales", label: "Est Sales", type: "number", category: "Metrics", defaultVisible: true },
  { key: "buybox_landed", label: "Buy Box ($)", type: "currency", category: "Financials", defaultVisible: false },
  { key: "favorite", label: "Favorite", type: "boolean", category: "Basic", defaultVisible: false },
  { key: "parent_asin", label: "Parent ASIN", type: "text", category: "Basic", defaultVisible: false },
  { key: "product_id", label: "Product ID (UPC)", type: "text", category: "Basic", defaultVisible: false },
  { key: "package_quantity", label: "Pack Qty", type: "number", category: "Basic", defaultVisible: false },
  { key: "amazon_link", label: "Amazon Link", type: "link", category: "Links", defaultVisible: false },
  { key: "is_top_level_category", label: "Top Level Cat", type: "text", category: "Categorization", defaultVisible: false },
  { key: "sub_category", label: "Sub Category", type: "text", category: "Categorization", defaultVisible: false },
  { key: "sub_category_sales_rank", label: "Sub Cat Rank", type: "number", category: "Categorization", defaultVisible: false },
  { key: "break_even_sell_price", label: "Break-even ($)", type: "currency", category: "Financials", defaultVisible: false },
  { key: "lowest_fba", label: "Lowest FBA ($)", type: "currency", category: "Financials", defaultVisible: false },
  { key: "lowest_fbm", label: "Lowest FBM ($)", type: "currency", category: "Financials", defaultVisible: false },
  { key: "seller_proceeds", label: "Proceeds ($)", type: "currency", category: "Financials", defaultVisible: false },
  { key: "estimated_monthly_revenue", label: "Est Mo Rev ($)", type: "currency", category: "Financials", defaultVisible: false },
  { key: "referral_fee_pct", label: "Referral Fee %", type: "percent", category: "Fees", defaultVisible: false },
  { key: "referral_fee", label: "Referral Fee ($)", type: "currency", category: "Fees", defaultVisible: false },
  { key: "fba_pick_pack_fee", label: "FBA Pick/Pack ($)", type: "currency", category: "Fees", defaultVisible: false },
  { key: "inbound_placement_fee", label: "Inbound Placement ($)", type: "currency", category: "Fees", defaultVisible: false },
  { key: "fulfillment_subtotal", label: "Fulfillment Subtotal ($)", type: "currency", category: "Fees", defaultVisible: false },
  { key: "cost_subtotal", label: "Cost Subtotal ($)", type: "currency", category: "Fees", defaultVisible: false },
  { key: "vat_pct", label: "VAT %", type: "percent", category: "Fees", defaultVisible: false },
  { key: "vat_amount", label: "VAT ($)", type: "currency", category: "Fees", defaultVisible: false },
  { key: "inbound_shipping_estimate", label: "Inbound Shipping ($)", type: "currency", category: "Fees", defaultVisible: false },
  { key: "package_dimensions", label: "Dimensions", type: "text", category: "Dimensions", defaultVisible: false },
  { key: "package_weight_lb", label: "Weight (lb)", type: "number", category: "Dimensions", defaultVisible: false },
  { key: "color", label: "Color", type: "text", category: "Attributes", defaultVisible: false },
  { key: "model", label: "Model", type: "text", category: "Attributes", defaultVisible: false },
  { key: "size", label: "Size", type: "text", category: "Attributes", defaultVisible: false },
  { key: "part_number", label: "Part Number", type: "text", category: "Attributes", defaultVisible: false },
  { key: "material", label: "Material", type: "text", category: "Attributes", defaultVisible: false },
  { key: "manufacturer", label: "Manufacturer", type: "text", category: "Attributes", defaultVisible: false },
  { key: "total_offers", label: "Total Offers", type: "number", category: "Competition", defaultVisible: false },
  { key: "new_fba_offers", label: "New FBA Offers", type: "number", category: "Competition", defaultVisible: false },
  { key: "new_fbm_offers", label: "New FBM Offers", type: "number", category: "Competition", defaultVisible: false },
  { key: "buybox_contention", label: "Buy Box Contention", type: "number", category: "Competition", defaultVisible: false },
  { key: "average_rating", label: "Rating", type: "number", category: "Ratings", defaultVisible: false },
  { key: "total_review_count", label: "Review Count", type: "number", category: "Ratings", defaultVisible: false },
  { key: "customer_reviews", label: "Reviews Text", type: "text", category: "Ratings", defaultVisible: false },
  { key: "brand_restriction", label: "Brand Restriction", type: "text", category: "Restrictions", defaultVisible: false },
  { key: "selling_restriction", label: "Selling Restriction", type: "text", category: "Restrictions", defaultVisible: false },
  { key: "selling_restriction_link", label: "Restriction Link", type: "link", category: "Restrictions", defaultVisible: false },
  { key: "is_hazmat", label: "Hazmat", type: "text", category: "Restrictions", defaultVisible: false },
  { key: "keepa", label: "Keepa Link", type: "link", category: "External Tools", defaultVisible: false },
  { key: "camelcc", label: "Camel Link", type: "link", category: "External Tools", defaultVisible: false },
  { key: "custom_notes", label: "Custom Notes", type: "text", category: "Notes", defaultVisible: false },
  { key: "about_this_item", label: "About This Item", type: "text", category: "Details", defaultVisible: false },
  { key: "product_image_link_1", label: "Image 1", type: "image", category: "Images", defaultVisible: false },
  { key: "product_image_link_2", label: "Image 2", type: "image", category: "Images", defaultVisible: false },
  { key: "product_image_link_3", label: "Image 3", type: "image", category: "Images", defaultVisible: false },
  { key: "product_image_link_4", label: "Image 4", type: "image", category: "Images", defaultVisible: false },
  { key: "product_image_link_5", label: "Image 5", type: "image", category: "Images", defaultVisible: false },
  { key: "last_run", label: "Last Run", type: "text", category: "System", defaultVisible: false },
  { key: "created_at", label: "Created At", type: "date", category: "System", defaultVisible: false },
  { key: "updated_at", label: "Updated At", type: "date", category: "System", defaultVisible: false }
];
