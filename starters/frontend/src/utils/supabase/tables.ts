import type { SupabaseClient } from "@supabase/supabase-js";
import registry from "./table-registry.json";

type Operation = "read" | "insert" | "update" | "delete";
export type TableDefinition = {
  schema: string;
  columns: string[] | null;
  writableColumns: string[] | null;
  rowKey: string[];
  operations: Operation[];
};
type Values = Record<string, unknown>;
export type TableRegistry = Record<string, TableDefinition>;
export const registeredTables = registry as TableRegistry;

export class TableRequestError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message);
  }
}

export function getTableDefinition(name: string, definitions = registeredTables) {
  if (!Object.hasOwn(definitions, name)) {
    throw new TableRequestError("UNKNOWN_TABLE", 404, "Table is not registered in the registered schema.");
  }
  return definitions[name];
}

function object(value: unknown): asserts value is Values {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TableRequestError("INVALID_INPUT", 400, "Expected a JSON object.");
  }
}

/** Node/server functions for registered tables. Supabase enforces column types and caller RLS. */
export function createTableFunctions(client: SupabaseClient, definitions = registeredTables) {
  return Object.fromEntries(Object.entries(definitions).map(([name, definition]) => {
    function allow(operation: Operation) {
      if (!definition.operations.includes(operation)) {
        throw new TableRequestError("OPERATION_NOT_ALLOWED", 405, "Operation is not available for this table.");
      }
    }

    function fields(values: unknown, writable: boolean): Values {
      object(values);
      const allowed = writable ? definition.writableColumns : definition.columns;
      if (!Object.keys(values).length || Object.keys(values).some((key) => (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || (allowed !== null && !allowed.includes(key))))) {
        throw new TableRequestError("INVALID_COLUMNS", 400, "Use nonempty, registered columns.");
      }
      return values;
    }

    function keyValues(value: unknown) {
      const values = fields(value, false);
      if (!definition.rowKey.length || Object.keys(values).length !== definition.rowKey.length ||
          definition.rowKey.some((key) => !Object.hasOwn(values, key) ||
            !["string", "number", "boolean"].includes(typeof values[key]))) {
        throw new TableRequestError("ROW_KEY_REQUIRED", 400, "Provide the complete row key for a single row.");
      }
      return values;
    }

    async function result(query: PromiseLike<{ data: unknown; error: { code?: string } | null }>) {
      const { data, error } = await query;
      if (error) {
        const status = error.code === "42501" ? 403 : ["23505", "23503"].includes(error.code ?? "") ? 409 :
          ["22P02", "23502", "23514"].includes(error.code ?? "") ? 400 : 503;
        throw new TableRequestError("DATABASE_REQUEST_FAILED", status, "Database request could not be completed.");
      }
      return data;
    }

    return [name, {
      async read(options: { columns?: string[]; limit?: number; where?: Values } = {}) {
        allow("read");
        const columns = options.columns ?? definition.columns ?? ["*"];
        const limit = options.limit ?? 100;
        if (!Array.isArray(columns) || !columns.length || columns.some((column) => (column !== "*" || options.columns !== undefined) && (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(column) || (definition.columns !== null && !definition.columns.includes(column)))) ||
            !Number.isInteger(limit) || limit < 1 || limit > 100) {
          throw new TableRequestError("INVALID_INPUT", 400, "Use registered columns and a limit between 1 and 100.");
        }
        let query = client.schema(definition.schema).from(name).select(columns.join(",")).limit(limit);
        if (options.where !== undefined) {
          const where = fields(options.where, false);
          for (const [column, value] of Object.entries(where)) {
            if (value !== null && !["string", "number", "boolean"].includes(typeof value)) {
              throw new TableRequestError("INVALID_INPUT", 400, "Filters require scalar values or null.");
            }
            query = value === null ? query.is(column, null) : query.eq(column, value);
          }
        }
        if (definition.rowKey.length) {
          for (const key of definition.rowKey) query = query.order(key);
        }
        return result(query);
      },
      async insert(values: Values) {
        allow("insert");
        return result(client.schema(definition.schema).from(name).insert(fields(values, true)).select());
      },
      async update(key: Values, values: Values) {
        allow("update");
        const where = keyValues(key);
        const updates = fields(values, true);
        if (definition.rowKey.some((column) => Object.hasOwn(updates, column))) {
          throw new TableRequestError("INVALID_COLUMNS", 400, "Row keys cannot be changed.");
        }
        let query = client.schema(definition.schema).from(name).update(updates);
        for (const [column, value] of Object.entries(where)) query = query.eq(column, value);
        return result(query.select());
      },
      async delete(key: Values) {
        allow("delete");
        const where = keyValues(key);
        let query = client.schema(definition.schema).from(name).delete();
        for (const [column, value] of Object.entries(where)) query = query.eq(column, value);
        return result(query.select());
      },
    }];
  }));
}
