-- =============================================================================
-- AMZ Tools - Cloudflare D1 Database Schema
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. User Table Definition
-- Columns: Full name, Email (unique), password, role
-- Role types: 'Super admin', 'admin', 'customer'
--   - Super admin: Access everything
--   - admin: Restrict only create new user, permit everything else
--   - customer: Like guest user, only read data
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Super admin', 'admin', 'customer')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email ON user(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON user(role);

-- -----------------------------------------------------------------------------
-- 2. Seed Initial Users (3 types of users)
-- -----------------------------------------------------------------------------


-- -----------------------------------------------------------------------------
-- 3. Wholesale Products Catalog Table Definition
-- -----------------------------------------------------------------------------
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
