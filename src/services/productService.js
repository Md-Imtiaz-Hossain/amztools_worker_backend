import { ALL_COLUMNS, NUMERIC_COLUMNS, TABLE_NAME } from '../config.js';
import { SCHEMA_SQL, COLUMN_DEFINITIONS } from '../utils/schema.js';
import { getDemoProducts, getDemoProductsResponse } from '../utils/demoData.js';

export class ProductService {
  /**
   * Get all column definitions metadata
   */
  static getColumns() {
    return COLUMN_DEFINITIONS;
  }

  /**
   * Get all products with pagination and keyword search for large-scale datasets (10M+ records)
   *
   * @param {D1Database} db - D1 Database binding
   * @param {Object} [queryParams={}] - Query options
   * @param {number|string} [queryParams.page=1] - Page number (default: 1)
   * @param {number|string} [queryParams.limit=20] - Page size (default: 20, max: 100)
   * @param {string} [queryParams.search] - Search keyword filtering by product name (title) or description (about_this_item)
   */
  static async getAll(db, queryParams = {}) {
    const rawPage = parseInt(queryParams.page);
    const page = !isNaN(rawPage) && rawPage >= 1 ? rawPage : 1;

    const rawLimit = parseInt(queryParams.limit);
    let limit = 20;
    if (!isNaN(rawLimit) && rawLimit >= 1) {
      limit = Math.min(100, rawLimit);
    }

    const offset = (page - 1) * limit;

    let sortBy = queryParams.sortBy || 'id';
    if (!ALL_COLUMNS.includes(sortBy)) {
      sortBy = 'id';
    }

    let sortOrder = (queryParams.sortOrder || 'DESC').toUpperCase();
    if (sortOrder !== 'ASC' && sortOrder !== 'DESC') {
      sortOrder = 'DESC';
    }

    const whereConditions = [];
    const bindings = [];

    // Keyword search: filter by product name (title) or description (about_this_item) using SQL LIKE
    const searchTerm = queryParams.search || queryParams.q;
    if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim()) {
      const term = `%${searchTerm.trim()}%`;
      whereConditions.push(`(title LIKE ? OR about_this_item LIKE ?)`);
      bindings.push(term, term);
    }

    // Support additional column filters if provided (for fine-grained queries)
    for (const col of ALL_COLUMNS) {
      if (['page', 'limit', 'search', 'q', 'sortBy', 'sortOrder'].includes(col)) {
        continue;
      }
      if (queryParams[col] !== undefined && queryParams[col] !== null && String(queryParams[col]).trim() !== '') {
        const val = String(queryParams[col]).trim();
        if (NUMERIC_COLUMNS.includes(col)) {
          const num = Number(val);
          if (!isNaN(num)) {
            whereConditions.push(`${col} = ?`);
            bindings.push(num);
          }
        } else {
          whereConditions.push(`LOWER(${col}) LIKE LOWER(?)`);
          bindings.push(`%${val}%`);
        }
      }

      if (NUMERIC_COLUMNS.includes(col)) {
        const minVal = queryParams[`${col}_min`];
        if (minVal !== undefined && minVal !== null && String(minVal).trim() !== '') {
          const numMin = Number(minVal);
          if (!isNaN(numMin)) {
            whereConditions.push(`${col} >= ?`);
            bindings.push(numMin);
          }
        }

        const maxVal = queryParams[`${col}_max`];
        if (maxVal !== undefined && maxVal !== null && String(maxVal).trim() !== '') {
          const numMax = Number(maxVal);
          if (!isNaN(numMax)) {
            whereConditions.push(`${col} <= ?`);
            bindings.push(numMax);
          }
        }
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    try {
      // Execute separate COUNT(*) query matching search criteria to return total number of records
      const countSql = `SELECT COUNT(*) as total FROM ${TABLE_NAME} ${whereClause};`;
      const countStmt = db.prepare(countSql);
      const countResult = bindings.length > 0 ? await countStmt.bind(...bindings).first() : await countStmt.first();
      let totalItems = countResult ? countResult.total : 0;

      const totalPages = Math.ceil(totalItems / limit) || 1;

      // Data query with parameterized LIMIT and OFFSET
      const dataSql = `SELECT * FROM ${TABLE_NAME} ${whereClause} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?;`;
      const dataBindings = [...bindings, limit, offset];
      const dataStmt = db.prepare(dataSql);
      const result = await dataStmt.bind(...dataBindings).all();

      return {
        products: result.results || [],
        pagination: {
          page,
          limit,
          totalItems,
          total: totalItems,
          totalPages,
          hasPrev: page > 1,
          hasNext: page < totalPages
        }
      };
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('no such table')) {
        console.log('Table wholesale_products not found. Auto-initializing D1 schema...');
        await this.initTable(db);

        const countSql = `SELECT COUNT(*) as total FROM ${TABLE_NAME} ${whereClause};`;
        const countStmt = db.prepare(countSql);
        const countResult = bindings.length > 0 ? await countStmt.bind(...bindings).first() : await countStmt.first();
        const totalItems = countResult ? countResult.total : 0;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        const dataSql = `SELECT * FROM ${TABLE_NAME} ${whereClause} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?;`;
        const dataBindings = [...bindings, limit, offset];
        const dataStmt = db.prepare(dataSql);
        const result = await dataStmt.bind(...dataBindings).all();

        return {
          products: result.results || [],
          pagination: {
            page,
            limit,
            totalItems,
            total: totalItems,
            totalPages,
            hasPrev: page > 1,
            hasNext: page < totalPages
          }
        };
      }
      throw err;
    }
  }

  /**
   * Alias listProducts to getAll for backwards compatibility
   */
  static async listProducts(db, queryParams = {}) {
    return await this.getAll(db, queryParams);
  }

  /**
   * Get product by ID
   */
  static async getProductById(db, id) {
    const sql = `SELECT * FROM ${TABLE_NAME} WHERE id = ? LIMIT 1;`;
    const stmt = db.prepare(sql);
    return await stmt.bind(id).first();
  }

  /**
   * Create a new product
   */
  static async createProduct(db, data) {
    if (!data.asin || !String(data.asin).trim()) {
      throw new Error('Field "asin" is required');
    }
    if (!data.wholesaler_company_name || !String(data.wholesaler_company_name).trim()) {
      throw new Error('Field "wholesaler_company_name" is required');
    }

    const now = new Date().toISOString();
    const allowedFields = ALL_COLUMNS.filter(col => col !== 'id');

    const insertFields = [];
    const placeholders = [];
    const values = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        insertFields.push(field);
        placeholders.push('?');
        let val = data[field];
        if (NUMERIC_COLUMNS.includes(field) && val !== null && val !== '') {
          val = Number(val);
        }
        values.push(val);
      }
    }

    // Auto add created_at and updated_at if not present
    if (!insertFields.includes('created_at')) {
      insertFields.push('created_at');
      placeholders.push('?');
      values.push(now);
    }
    if (!insertFields.includes('updated_at')) {
      insertFields.push('updated_at');
      placeholders.push('?');
      values.push(now);
    }

    const sql = `INSERT INTO ${TABLE_NAME} (${insertFields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *;`;
    const stmt = db.prepare(sql);
    const result = await stmt.bind(...values).first();
    return result;
  }

  /**
   * Update an existing product
   */
  static async updateProduct(db, id, data) {
    const existing = await this.getProductById(db, id);
    if (!existing) {
      return null;
    }

    const allowedFields = ALL_COLUMNS.filter(col => col !== 'id' && col !== 'created_at');
    const updateClauses = [];
    const values = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateClauses.push(`${field} = ?`);
        let val = data[field];
        if (NUMERIC_COLUMNS.includes(field) && val !== null && val !== '') {
          val = Number(val);
        }
        values.push(val);
      }
    }

    // Always update updated_at
    updateClauses.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    const sql = `UPDATE ${TABLE_NAME} SET ${updateClauses.join(', ')} WHERE id = ? RETURNING *;`;
    const stmt = db.prepare(sql);
    return await stmt.bind(...values).first();
  }

  /**
   * Delete a product by ID
   */
  static async deleteProduct(db, id) {
    const existing = await this.getProductById(db, id);
    if (!existing) {
      return false;
    }

    const sql = `DELETE FROM ${TABLE_NAME} WHERE id = ?;`;
    const stmt = db.prepare(sql);
    await stmt.bind(id).run();
    return true;
  }

  /**
   * Batch delete products by an array of IDs
   */
  static async batchDelete(db, ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return 0;
    }

    const validIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id) && id > 0);
    if (validIds.length === 0) return 0;

    const placeholders = validIds.map(() => '?').join(', ');
    const sql = `DELETE FROM ${TABLE_NAME} WHERE id IN (${placeholders});`;
    const stmt = db.prepare(sql);
    const result = await stmt.bind(...validIds).run();
    return result.meta && result.meta.changes !== undefined ? result.meta.changes : validIds.length;
  }

  /**
   * Get demo products loaded from utils/demo_data.xlsx for frontend testing.
   * NEVER saves or writes anything to D1 or any actual database.
   */
  static async getDemo(options = {}) {
    return await getDemoProductsResponse(options);
  }

  /**
   * Get raw demo products list from utils/demo_data.xlsx
   */
  static async getDemoProductsList() {
    return await getDemoProducts();
  }

  /**
   * Initialize table and indexes on Cloudflare D1
   * Note: This strictly creates the schema and indexes; test data is never saved to the database.
   */
  static async initTable(db) {
    const statements = SCHEMA_SQL.split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => db.prepare(s));

    if (statements.length > 0) {
      await db.batch(statements);
    }
    return true;
  }
}
