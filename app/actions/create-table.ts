"use server"

import { createClient } from "@supabase/supabase-js"

// Server-side Supabase client with service role key for admin operations
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

function inferSqlType(values: any[]): string {
  let hasDecimal = false
  let hasInteger = false
  let hasBoolean = false
  let hasTimestamp = false

  for (const v of values) {
    if (v === null || v === undefined) continue

    // native booleans
    if (typeof v === "boolean") {
      hasBoolean = true
      continue
    }

    // numbers
    if (typeof v === "number") {
      if (Number.isInteger(v)) hasInteger = true
      else hasDecimal = true
      continue
    }

    // strings that look like numbers
    if (typeof v === "string") {
      const num = Number(v)
      if (!Number.isNaN(num)) {
        if (v.includes(".")) hasDecimal = true
        else hasInteger = true
        continue
      }

      // date-ish strings
      const ts = Date.parse(v)
      if (!Number.isNaN(ts)) hasTimestamp = true
    }
  }

  if (hasBoolean && !hasDecimal && !hasInteger && !hasTimestamp) return "BOOLEAN"
  if (hasDecimal) return "DECIMAL"
  if (hasInteger) return "INTEGER"
  if (hasTimestamp) return "TIMESTAMP"
  return "TEXT"
}

export async function createTableWithData(tableName: string, data: any[]) {
  try {
    if (!data || data.length === 0) {
      return { success: false, error: "No data provided" }
    }

    // Sanitize table name - only allow letters, numbers, and underscores
    const sanitizedTableName = tableName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/^[0-9]/, "_$&") // Ensure it doesn't start with a number
      .substring(0, 63) // PostgreSQL table name limit

    if (!sanitizedTableName) {
      return { success: false, error: "Invalid table name" }
    }

    console.log(`[SERVER] Creating table: ${sanitizedTableName}`)

    // Get column information from the first row
    const sampleRow = data[0]
    const columns = Object.keys(sampleRow)

    if (columns.length === 0) {
      return { success: false, error: "No columns found in data" }
    }

    // Reserved column names that conflict with our table structure
    const reservedColumns = ["id", "created_at", "updated_at"]

    // Build column definitions with proper types, excluding reserved names
    const columnDefinitions = columns
      .filter((col) => {
        const sanitizedCol = col.toLowerCase().replace(/[^a-z0-9_]/g, "_")
        return !reservedColumns.includes(sanitizedCol)
      })
      .map((col) => {
        const sanitizedCol = col.toLowerCase().replace(/[^a-z0-9_]/g, "_")
        const values = data.map((row) => row[col])
        const sqlType = inferSqlType(values)
        return `${sanitizedCol} ${sqlType}`
      })
      .join(", ")

    if (!columnDefinitions) {
      return { success: false, error: "No valid columns found after filtering reserved names" }
    }

    // Try to create the table using raw SQL
    const createTableSQL = `
      CREATE TABLE ${sanitizedTableName} (
        id SERIAL PRIMARY KEY,
        ${columnDefinitions},
        created_at TIMESTAMP DEFAULT NOW()
      );
    `

    console.log("[SERVER] SQL:", createTableSQL)

    // Try direct SQL execution
    const { data: sqlResult, error: sqlError } = await supabaseAdmin.rpc("exec_sql", {
      sql: createTableSQL,
    })

    let tableCreated = false

    if (sqlError) {
      console.log("[SERVER] Direct SQL execution failed:", sqlError)
    } else {
      console.log("[SERVER] Table created successfully via SQL")
      tableCreated = true
    }

    // Fallback: Save to automation_results table
    if (!tableCreated) {
      console.log("[SERVER] Using fallback: saving to automation_results table")

      // Ensure automation_results table exists
      const ensure = await ensureAutomationResultsTable()
      if (!ensure.success) {
        return ensure
      }

      // Prepare data for automation_results table
      const dataWithMetadata = data.map((row, index) => ({
        table_name: sanitizedTableName,
        row_index: index + 1,
        data: row, // Store as JSONB
        created_at: new Date().toISOString(),
      }))

      console.log(`[SERVER] Inserting ${dataWithMetadata.length} rows into automation_results`)

      // Insert into automation_results
      const { error: insertError } = await supabaseAdmin.from("automation_results").insert(dataWithMetadata)

      if (insertError) {
        console.error("[SERVER] Failed to insert into automation_results:", insertError)
        return {
          success: false,
          error: `Failed to save results: ${insertError.message || "Unknown insert error"}`,
        }
      }

      return {
        success: true,
        message: `Results saved to automation_results table with identifier: ${sanitizedTableName} (${data.length} rows)`,
        tableName: "automation_results",
        recordCount: data.length,
        fallback: true,
      }
    }

    // If table creation succeeded, insert the data
    console.log("[SERVER] Inserting data into new table...")

    // Prepare data for insertion (remove any undefined values and reserved columns)
    const cleanData = data.map((row) => {
      const cleanRow: any = {}
      Object.keys(row).forEach((key) => {
        const sanitizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, "_")
        // Skip reserved columns
        if (!reservedColumns.includes(sanitizedKey)) {
          cleanRow[sanitizedKey] = row[key] === undefined ? null : row[key]
        }
      })
      return cleanRow
    })

    const { error: insertError } = await supabaseAdmin.from(sanitizedTableName).insert(cleanData)

    if (insertError) {
      console.error("[SERVER] Failed to insert data into new table:", insertError)
      return {
        success: false,
        error: `Table created but failed to insert data: ${insertError.message}`,
      }
    }

    console.log(`[SERVER] Successfully inserted ${data.length} rows into ${sanitizedTableName}`)

    return {
      success: true,
      message: `Successfully created table "${sanitizedTableName}" with ${data.length} rows`,
      tableName: sanitizedTableName,
      recordCount: data.length,
      fallback: false,
    }
  } catch (error) {
    console.error("[SERVER] Error in createTableWithData:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function saveResultsToExistingTable(tableName: string, data: any[]) {
  try {
    if (!data || data.length === 0) {
      return { success: false, error: "No data provided" }
    }

    console.log(`[SERVER] Saving to existing table: ${tableName}`)

    // Check if table exists by trying to select from it
    const { error: checkError } = await supabaseAdmin.from(tableName).select("*").limit(1)

    if (checkError) {
      console.error(`[SERVER] Table check error:`, checkError)
      return {
        success: false,
        error: `Table "${tableName}" does not exist or is not accessible: ${checkError.message}`,
      }
    }

    // Clean the data (remove undefined values)
    const cleanData = data.map((row) => {
      const cleanRow: any = {}
      Object.keys(row).forEach((key) => {
        cleanRow[key] = row[key] === undefined ? null : row[key]
      })
      return cleanRow
    })

    console.log(`[SERVER] Inserting ${cleanData.length} rows into ${tableName}`)

    // Insert the data
    const { error: insertError } = await supabaseAdmin.from(tableName).insert(cleanData)

    if (insertError) {
      console.error(`[SERVER] Insert error:`, insertError)
      return {
        success: false,
        error: `Failed to insert data: ${insertError.message}`,
      }
    }

    return {
      success: true,
      message: `Successfully inserted ${data.length} rows into "${tableName}"`,
      tableName,
      recordCount: data.length,
    }
  } catch (error) {
    console.error("[SERVER] Error in saveResultsToExistingTable:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Helper function to create the automation_results table if it doesn't exist
export async function ensureAutomationResultsTable() {
  try {
    console.log("[SERVER] Ensuring automation_results table exists...")

    // First, try to query the table to see if it exists
    const { error: testError } = await supabaseAdmin.from("automation_results").select("*").limit(1)

    if (testError && testError.code === "42P01") {
      // Table doesn't exist, try to create it
      console.log("[SERVER] automation_results table doesn't exist, creating...")

      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS automation_results (
          id SERIAL PRIMARY KEY,
          table_name VARCHAR(255) NOT NULL,
          row_index INTEGER NOT NULL,
          data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_automation_results_table_name ON automation_results(table_name);
        CREATE INDEX IF NOT EXISTS idx_automation_results_created_at ON automation_results(created_at);
      `

      const { error: createError } = await supabaseAdmin.rpc("exec_sql", { sql: createTableSQL })

      if (createError) {
        console.error("[SERVER] Could not create automation_results table:", createError)
        return {
          success: false,
          error:
            "automation_results table does not exist and cannot be created automatically. Please run the SQL script manually.",
        }
      }

      console.log("[SERVER] automation_results table created successfully")
    } else if (testError) {
      console.error("[SERVER] Error checking automation_results table:", testError)
      return {
        success: false,
        error: `Error accessing automation_results table: ${testError.message}`,
      }
    } else {
      console.log("[SERVER] automation_results table already exists")
    }

    return { success: true, message: "automation_results table is ready" }
  } catch (error) {
    console.error("[SERVER] Error ensuring automation_results table:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
