/**
 * Demo Data Loader & Parser for demo_data.xlsx
 * Used EXCLUSIVELY for frontend test / development.
 * This demo data is NEVER saved to the database.
 */

// Embedded base64 representation of demo_data.xlsx for Cloudflare Worker runtime
const DEMO_XLSX_BASE64 = "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";

const TARGET_TO_SQL_MAP = {
  "ASIN": "asin",
  "Parent ASIN": "parent_asin",
  "Favorite": "favorite",
  "Product ID": "product_id",
  "Brand": "brand",
  "Brand Restriction": "brand_restriction",
  "Selling Restriction": "selling_restriction",
  "Selling Restriction Link": "selling_restriction_link",
  "Title": "title",
  "Package Quantity": "package_quantity",
  "Amazon Link": "amazon_link",
  "Current Est Sales": "current_est_sales",
  "Estimated Monthly Revenue ($)": "estimated_monthly_revenue",
  "Profit ($)": "profit",
  "Margin (%)": "margin_pct",
  "ROI (%)": "roi_pct",
  "Is Top Level Category": "is_top_level_category",
  "Category": "category",
  "Sales Rank": "sales_rank",
  "Sub Category": "sub_category",
  "Sub Category Sales Rank": "sub_category_sales_rank",
  "Cost": "cost",
  "Break Even Sell Price": "break_even_sell_price",
  "Sell Price": "sell_price",
  "Buybox Landed": "buybox_landed",
  "Lowest FBA": "lowest_fba",
  "Lowest FBM": "lowest_fbm",
  "Referral Fee %": "referral_fee_pct",
  "Referral Fee": "referral_fee",
  "FBA Pick & Pack Fee ($)": "fba_pick_pack_fee",
  "Inbound Placement Fee": "inbound_placement_fee",
  "Fulfillment Subtotal": "fulfillment_subtotal",
  "Cost Subtotal": "cost_subtotal",
  "Seller Proceeds": "seller_proceeds",
  "VAT %": "vat_pct",
  "VAT $": "vat_amount",
  "Inbound Shipping Estimate": "inbound_shipping_estimate",
  "Package Dimensions (in)": "package_dimensions",
  "Package Weight (lb)": "package_weight_lb",
  "Total Offers": "total_offers",
  "New FBA Offers": "new_fba_offers",
  "New FBM Offers": "new_fbm_offers",
  "BuyBox Contention": "buybox_contention",
  "Manufacturer": "manufacturer",
  "Color": "color",
  "Model": "model",
  "Part Number": "part_number",
  "Is Hazmat": "is_hazmat",
  "Keepa": "keepa",
  "CamelCC": "camelcc",
  "Custom Notes": "custom_notes",
  "Last Run": "last_run",
  "Product Image link 1": "product_image_link_1",
  "Product Image link 2": "product_image_link_2",
  "Product Image link 3": "product_image_link_3",
  "Product Image link 4": "product_image_link_4",
  "Product Image link 5": "product_image_link_5",
  "Average Rating": "average_rating",
  "Total Review Count": "total_review_count",
  "Customer Reviews": "customer_reviews",
  "About this item": "about_this_item",
  "Wholesaller Company Name": "wholesaler_company_name",
  "Wholesaler Company Name": "wholesaler_company_name"
};

const NUMERIC_COLUMNS = [
  "package_quantity", "current_est_sales", "estimated_monthly_revenue", "profit",
  "margin_pct", "roi_pct", "sales_rank", "sub_category_sales_rank", "cost",
  "break_even_sell_price", "sell_price", "buybox_landed", "lowest_fba", "lowest_fbm",
  "referral_fee_pct", "referral_fee", "fba_pick_pack_fee", "inbound_placement_fee",
  "fulfillment_subtotal", "cost_subtotal", "seller_proceeds", "vat_pct", "vat_amount",
  "inbound_shipping_estimate", "package_weight_lb", "total_offers", "new_fba_offers",
  "new_fbm_offers", "buybox_contention", "average_rating", "total_review_count"
];

let cachedDemoProducts = null;

/**
 * Get raw byte buffer for demo_data.xlsx
 */
async function getXlsxBuffer() {
  try {
    // In Node.js or local dev environment, read fresh from disk
    const fs = await import("node:fs");
    const path = await import("node:path");
    const url = await import("node:url");
    const currentDir = path.dirname(url.fileURLToPath(import.meta.url));
    const filePath = path.join(currentDir, "demo_data.xlsx");
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
  } catch (e) {
    // Ignore and fallback to embedded base64 in Cloudflare Worker runtime
  }

  // Fallback to embedded base64 string
  const binaryStr = atob(DEMO_XLSX_BASE64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

/**
 * Unzips an OpenXML / ZIP archive using Web Streams DecompressionStream
 */
async function unzipZipArchive(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  const files = {};

  while (offset < bytes.byteLength - 4) {
    const sig = view.getUint32(offset, true);
    if (sig === 0x04034b50) { // Local file header signature
      const compMethod = view.getUint16(offset + 8, true);
      const compSize = view.getUint32(offset + 18, true);
      const nameLen = view.getUint16(offset + 26, true);
      const extraLen = view.getUint16(offset + 28, true);
      const name = new TextDecoder().decode(bytes.subarray(offset + 30, offset + 30 + nameLen));
      const dataStart = offset + 30 + nameLen + extraLen;
      const compData = bytes.subarray(dataStart, dataStart + compSize);

      if (compMethod === 0) {
        files[name] = compData;
      } else if (compMethod === 8) {
        const ds = new DecompressionStream("deflate-raw");
        const writer = ds.writable.getWriter();
        writer.write(compData);
        writer.close();

        const reader = ds.readable.getReader();
        const chunks = [];
        let done = false;
        while (!done) {
          const res = await reader.read();
          if (res.done) done = true;
          else chunks.push(res.value);
        }
        const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
        const uncomp = new Uint8Array(totalLen);
        let pos = 0;
        for (const c of chunks) {
          uncomp.set(c, pos);
          pos += c.length;
        }
        files[name] = uncomp;
      }
      offset = dataStart + compSize;
    } else {
      offset++;
    }
  }

  return files;
}

function colLettersToNumber(letters) {
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return col;
}

function formatExcelDate(serial) {
  if (!serial) return null;
  const num = Number(serial);
  if (isNaN(num)) return String(serial);
  const ms = Math.round((num - 25569) * 86400 * 1000);
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

/**
 * Parse demo_data.xlsx into structured product records
 */
export async function parseDemoXlsx() {
  const buffer = await getXlsxBuffer();
  const files = await unzipZipArchive(buffer);

  // 1. Parse shared strings table (xl/sharedStrings.xml)
  const sharedStrings = [];
  if (files["xl/sharedStrings.xml"]) {
    const xml = new TextDecoder().decode(files["xl/sharedStrings.xml"]);
    const siMatches = xml.match(/<si>[\s\S]*?<\/si>/g) || [];
    for (const si of siMatches) {
      const tMatches = si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [];
      const text = tMatches.map(m => m.replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&apos;/g, "'")).join("");
      sharedStrings.push(text);
    }
  }

  // 2. Parse sheet1.xml
  const sheetXml = files["xl/worksheets/sheet1.xml"]
    ? new TextDecoder().decode(files["xl/worksheets/sheet1.xml"])
    : "";
  const rowMatches = sheetXml.match(/<row\b[^>]*>[\s\S]*?<\/row>/g) || [];

  const parsedRows = [];
  for (const rowXml of rowMatches) {
    const cellMatches = rowXml.match(/<c\b[^>]*\/>|<c\b[^>]*>[\s\S]*?<\/c>/g) || [];
    const rowCells = {};
    for (const cellXml of cellMatches) {
      const rMatch = cellXml.match(/r="([A-Z]+)(\d+)"/);
      if (!rMatch) continue;
      const colLetter = rMatch[1];
      const colNum = colLettersToNumber(colLetter);
      const isString = cellXml.includes('t="s"');
      const fMatch = cellXml.match(/<f[^>]*>([\s\S]*?)<\/f>/);
      const vMatch = cellXml.match(/<v>([\s\S]*?)<\/v>/);
      let val = null;
      if (fMatch) {
        val = `=${fMatch[1]}`;
      } else if (isString && vMatch) {
        val = sharedStrings[parseInt(vMatch[1], 10)] ?? vMatch[1];
      } else if (vMatch) {
        val = vMatch[1];
      }
      rowCells[colNum] = val;
    }
    parsedRows.push(rowCells);
  }

  if (parsedRows.length === 0) return [];
  const headerRow = parsedRows[0];
  const maxCol = Math.max(...Object.keys(headerRow).map(Number));
  const headers = [];
  for (let c = 1; c <= maxCol; c++) {
    headers.push(headerRow[c] || `Col_${c}`);
  }

  const products = [];
  for (let r = 1; r < parsedRows.length; r++) {
    const row = parsedRows[r];
    const item = { id: r };
    for (let c = 1; c <= maxCol; c++) {
      const header = headers[c - 1];
      const key = TARGET_TO_SQL_MAP[header] || header.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      let val = row[c] ?? null;
      if (val === "None" || val === "" || val === undefined) {
        val = null;
      } else if (key === "last_run" && val) {
        val = formatExcelDate(val);
      } else if (NUMERIC_COLUMNS.includes(key) && val !== null) {
        const num = Number(val);
        if (!isNaN(num)) val = num;
      } else if (key === "favorite") {
        val = val === "True" || val === "true" || val === 1 || val === "1" ? 1 : 0;
      }
      item[key] = val;
    }
    products.push(item);
  }
  return products;
}

/**
 * Returns cached demo products parsed from demo_data.xlsx
 */
export async function getDemoProducts() {
  if (!cachedDemoProducts) {
    cachedDemoProducts = await parseDemoXlsx();
  }
  return cachedDemoProducts;
}

/**
 * Handles query options (search, sort, pagination, filters) on in-memory demo products
 * for frontend testing without contacting or mutating any real database.
 */
export async function getDemoProductsResponse(options = {}) {
  const allProds = await getDemoProducts();
  let filtered = [...allProds];

  const search = (options.search || options.q || "").trim().toLowerCase();
  if (search) {
    filtered = filtered.filter(p => {
      const title = (p.title || "").toLowerCase();
      const about = (p.about_this_item || "").toLowerCase();
      const asin = (p.asin || "").toLowerCase();
      const brand = (p.brand || "").toLowerCase();
      const wholesaler = (p.wholesaler_company_name || "").toLowerCase();
      const cat = (p.category || "").toLowerCase();
      return title.includes(search) || about.includes(search) || asin.includes(search) || brand.includes(search) || wholesaler.includes(search) || cat.includes(search);
    });
  }

  // Apply per-column filters
  for (const [key, val] of Object.entries(options)) {
    if (["page", "limit", "search", "q", "sortBy", "sortOrder", "demo"].includes(key)) continue;
    if (val === undefined || val === null || val === "") continue;

    if (key.endsWith("_min")) {
      const col = key.slice(0, -4);
      const minVal = Number(val);
      if (!isNaN(minVal)) {
        filtered = filtered.filter(p => p[col] !== null && p[col] !== undefined && Number(p[col]) >= minVal);
      }
    } else if (key.endsWith("_max")) {
      const col = key.slice(0, -4);
      const maxVal = Number(val);
      if (!isNaN(maxVal)) {
        filtered = filtered.filter(p => p[col] !== null && p[col] !== undefined && Number(p[col]) <= maxVal);
      }
    } else {
      const strVal = String(val).toLowerCase();
      filtered = filtered.filter(p => {
        if (p[key] === null || p[key] === undefined) return false;
        return String(p[key]).toLowerCase().includes(strVal);
      });
    }
  }

  // Sorting
  const sortBy = options.sortBy || "id";
  const sortOrder = (options.sortOrder || "DESC").toUpperCase();
  filtered.sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortOrder === "ASC" ? aVal - bVal : bVal - aVal;
    }
    const cmp = String(aVal).localeCompare(String(bVal));
    return sortOrder === "ASC" ? cmp : -cmp;
  });

  // Pagination
  let page = parseInt(options.page, 10);
  if (isNaN(page) || page < 1) page = 1;

  let limit = parseInt(options.limit, 10);
  if (isNaN(limit) || limit < 1) limit = 20;
  if (limit > 100) limit = 100;

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    products: paginated,
    pagination: {
      page,
      limit,
      totalItems,
      total: totalItems,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages
    },
    isDemo: true
  };
}
