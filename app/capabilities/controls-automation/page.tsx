"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BoltIcon, PlayIcon, CircleStackIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { toast } from "sonner"
import { createTableWithData, saveResultsToExistingTable } from "@/app/actions/create-table"

interface TableData {
  [key: string]: any
}

interface LoadedTable {
  name: string
  data: TableData[]
  columns: string[]
}

interface FormulaConfig {
  leftOperand: string
  leftOperandType: "column" | "value"
  leftTable?: string
  operation: "+" | "-" | "×" | "÷" | "<" | ">" | "=" | "IF"
  rightOperand: string
  rightOperandType: "column" | "value"
  rightTable?: string
  ifTrueValue?: string
  ifFalseValue?: string
}

export default function ControlsAutomationPage() {
  const [tableNames, setTableNames] = useState<string[]>([])
  const [loadedTables, setLoadedTables] = useState<LoadedTable[]>([])
  const [loading, setLoading] = useState(false)
  const [formulaConfig, setFormulaConfig] = useState<FormulaConfig>({
    leftOperand: "",
    leftOperandType: "column",
    operation: "+",
    rightOperand: "",
    rightOperandType: "column",
  })
  const [computedResults, setComputedResults] = useState<any[]>([])
  const [newTableName, setNewTableName] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [selectedWorkingTable, setSelectedWorkingTable] = useState<string>("")
  const [saveMode, setSaveMode] = useState<"new" | "existing">("new")
  const [existingTableName, setExistingTableName] = useState("")
  const [saving, setSaving] = useState(false)

  // Tables to exclude from the dropdown
  const excludedTables = [
    "applicability_categories",
    "CCM",
    "compliance_assessment",
    "controls_applicability",
    "framework_mappings",
    "frameworks",
    "integrations",
  ]

  // Fetch table names on component mount
  useEffect(() => {
    fetchTableNames()
  }, [])

  const fetchTableNames = async () => {
    try {
      setLoading(true)

      // Method 1: Try a comprehensive list of potential table names and test which ones exist
      const potentialTables = [
        // Core business tables
        "applications",
        "controls",
        "capabilities",
        "users",
        "assessments",
        "reports",
        "policies",
        "risks",
        "assets",
        "vendors",
        "audit_logs",
        "findings",
        "remediation",
        "evidence",
        "documents",

        // Security tools
        "crowdstrike",
        "ccm",
        "qualys_vmdr",
        "tenable",
        "nessus",
        "rapid7",
        "wiz",
        "prisma",
        "aqua",
        "snyk",
        "checkmarx",
        "veracode",
        "sonarqube",
        "fortify",
        "blackduck",
        "whitesource",
        "twistlock",
        "sysdig",
        "falco",

        // Cloud platforms
        "aws_config",
        "aws_cloudtrail",
        "aws_guardduty",
        "aws_securityhub",
        "gcp_security_command_center",
        "azure_security_center",

        // Identity providers
        "okta",
        "auth0",
        "ping_identity",
        "active_directory",
        "ldap",

        // Monitoring tools
        "splunk",
        "elastic",
        "datadog",
        "newrelic",
        "dynatrace",
        "appdynamics",
        "sumologic",

        // SIEM tools
        "logrhythm",
        "qradar",
        "arcsight",
        "phantom",
        "demisto",
        "swimlane",
        "resilient",

        // Business tools
        "servicenow",
        "jira",
        "confluence",
        "sharepoint",
        "teams",
        "slack",
        "office365",
        "google_workspace",

        // Storage
        "box",
        "dropbox",
        "onedrive",
        "gdrive",
        "s3",
        "azure_blob",
        "gcs",

        // Container platforms
        "docker",
        "kubernetes",
        "openshift",
        "rancher",

        // Cloud functions
        "lambda",
        "azure_functions",
        "cloud_functions",
        "cloud_run",

        // CDN
        "cloudflare",
        "fastly",
        "akamai",
        "cloudfront",

        // Security scanners
        "shodan",
        "censys",
        "virustotal",
        "urlvoid",

        // Endpoint protection
        "crowdstrike_falcon",
        "sentinelone",
        "cylance",
        "carbon_black",
        "defender_atp",
        "kaspersky",
        "symantec",
        "mcafee",
        "trend_micro",
        "bitdefender",
        "sophos",

        // Network security
        "palo_alto",
        "fortinet",
        "checkpoint",
        "cisco_asa",
        "juniper",
        "sonicwall",
        "watchguard",
        "barracuda",

        // Databases
        "mysql",
        "postgresql",
        "mongodb",
        "redis",
        "elasticsearch",
        "cassandra",
        "dynamodb",
        "cosmosdb",

        // Generic table names
        "data",
        "logs",
        "events",
        "metrics",
        "alerts",
        "incidents",
        "tickets",
        "tasks",
        "projects",
        "customers",
        "products",
        "orders",
        "inventory",
        "employees",
        "departments",
        "locations",
        "configurations",
        "settings",
        "preferences",
        "notifications",
        "messages",
        "comments",
        "reviews",
        "ratings",
        "feedback",
        "surveys",
        "forms",
        "templates",
        "workflows",
        "processes",
        "procedures",
        "standards",
        "guidelines",
        "requirements",
        "specifications",
        "test_cases",
        "test_results",
        "bugs",
        "issues",
        "changes",
        "releases",
        "deployments",
        "environments",
        "servers",
        "services",
        "endpoints",
        "apis",
        "integrations_data",
        "connections",
        "sessions",
        "tokens",
        "keys",
        "certificates",
        "licenses",
        "subscriptions",
        "billing",
        "payments",
        "invoices",
        "transactions",
        "accounts",
        "profiles",
        "permissions",
        "roles",
        "groups",
        "teams",
        "organizations",
        "tenants",
        "workspaces",
        "dashboards",
        "widgets",
        "charts",
        "graphs",
        "tables_meta",
        "columns_meta",
        "indexes",
        "constraints",
        "triggers",
        "procedures_meta",
        "functions_meta",
        "views_meta",
        "schemas",
        "databases_meta",
        "backups",
        "snapshots",
        "archives",
        "exports",
        "imports",
        "migrations",
        "versions",
        "history",
        "changelog",
        "activity",
        "timeline",
        "calendar",
        "schedules",
        "jobs",
        "queues",
        "workers",
        "processes_running",
        "threads",
        "connections_active",
        "sessions_active",
        "cache",
        "temp",
        "staging",
        "production",
        "development",
        "testing",
        "sandbox",
        "automation_results",
      ]

      const existingTables: string[] = []

      // Test each potential table to see if it exists
      console.log("Testing potential tables...")
      for (const tableName of potentialTables) {
        try {
          const { error } = await supabase.from(tableName).select("*").limit(1)
          if (!error) {
            existingTables.push(tableName)
            console.log(`✓ Found table: ${tableName}`)
          }
        } catch (e) {
          // Table doesn't exist or isn't accessible
        }
      }

      // Method 2: Try to get schema information if available
      try {
        const { data: schemaData, error: schemaError } = await supabase
          .from("information_schema.tables")
          .select("table_name")
          .eq("table_schema", "public")

        if (schemaData && !schemaError) {
          const schemaTables = schemaData.map((row) => row.table_name)
          console.log("Schema tables found:", schemaTables)

          // Add any new tables from schema that we haven't found yet
          schemaTables.forEach((tableName) => {
            if (!existingTables.includes(tableName)) {
              existingTables.push(tableName)
            }
          })
        }
      } catch (e) {
        console.log("Schema query failed, using discovered tables only")
      }

      // Filter out excluded and system tables
      const filteredTables = existingTables.filter(
        (tableName) =>
          tableName &&
          typeof tableName === "string" &&
          !tableName.includes("internal_") &&
          !tableName.includes("auth_") &&
          !tableName.includes("system_") &&
          !tableName.startsWith("_") &&
          !tableName.includes("pg_") &&
          !tableName.includes("information_schema") &&
          !tableName.includes("sql_") &&
          !excludedTables.includes(tableName),
      )

      console.log("Final filtered tables:", filteredTables)
      setTableNames(filteredTables.sort())

      if (filteredTables.length === 0) {
        toast.error("No accessible tables found. Check your Supabase permissions.")
      } else {
        toast.success(`Found ${filteredTables.length} accessible tables`)
      }
    } catch (error) {
      console.error("Error fetching table names:", error)
      toast.error("Failed to fetch table names")
    } finally {
      setLoading(false)
    }
  }

  const loadTable = async (tableName: string) => {
    if (loadedTables.find((t) => t.name === tableName)) {
      toast.error(`Table "${tableName}" is already loaded`)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase.from(tableName).select("*").limit(100)

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      if (data && data.length > 0) {
        const newTable: LoadedTable = {
          name: tableName,
          data: data,
          columns: Object.keys(data[0]),
        }

        setLoadedTables((prev) => [...prev, newTable])

        // Set as working table if it's the first one loaded
        if (loadedTables.length === 0) {
          setSelectedWorkingTable(tableName)
        }

        toast.success(`Loaded ${data.length} rows from "${tableName}"`)
      } else {
        toast.error(`No data found in table "${tableName}"`)
      }
    } catch (error) {
      console.error("Error loading table:", error)
      toast.error(`Failed to load table "${tableName}": ${error.message || "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const removeTable = (tableName: string) => {
    setLoadedTables((prev) => prev.filter((t) => t.name !== tableName))
    if (selectedWorkingTable === tableName) {
      const remaining = loadedTables.filter((t) => t.name !== tableName)
      setSelectedWorkingTable(remaining.length > 0 ? remaining[0].name : "")
    }
    setShowResults(false)
    setComputedResults([])
  }

  const getWorkingTable = () => {
    return loadedTables.find((t) => t.name === selectedWorkingTable)
  }

  const runFormula = () => {
    const workingTable = getWorkingTable()
    if (!workingTable || !workingTable.data.length) {
      toast.error("No working table selected or no data to process")
      return
    }

    if (!formulaConfig.leftOperand || !formulaConfig.rightOperand) {
      toast.error("Please configure both operands")
      return
    }

    try {
      const results = workingTable.data.map((row, index) => {
        let leftValue: any
        let rightValue: any

        // Get left operand value
        if (formulaConfig.leftOperandType === "column") {
          if (formulaConfig.leftTable && formulaConfig.leftTable !== workingTable.name) {
            // Cross-table reference - for now, use first row of referenced table
            const refTable = loadedTables.find((t) => t.name === formulaConfig.leftTable)
            leftValue = refTable?.data[0]?.[formulaConfig.leftOperand] || 0
          } else {
            leftValue = row[formulaConfig.leftOperand]
          }
        } else {
          leftValue = isNaN(Number(formulaConfig.leftOperand))
            ? formulaConfig.leftOperand
            : Number(formulaConfig.leftOperand)
        }

        // Get right operand value
        if (formulaConfig.rightOperandType === "column") {
          if (formulaConfig.rightTable && formulaConfig.rightTable !== workingTable.name) {
            // Cross-table reference - for now, use first row of referenced table
            const refTable = loadedTables.find((t) => t.name === formulaConfig.rightTable)
            rightValue = refTable?.data[0]?.[formulaConfig.rightOperand] || 0
          } else {
            rightValue = row[formulaConfig.rightOperand]
          }
        } else {
          rightValue = isNaN(Number(formulaConfig.rightOperand))
            ? formulaConfig.rightOperand
            : Number(formulaConfig.rightOperand)
        }

        let result: any

        // Convert to numbers for mathematical operations
        const leftNum = Number(leftValue)
        const rightNum = Number(rightValue)

        switch (formulaConfig.operation) {
          case "+":
            result = (isNaN(leftNum) ? 0 : leftNum) + (isNaN(rightNum) ? 0 : rightNum)
            break
          case "-":
            result = (isNaN(leftNum) ? 0 : leftNum) - (isNaN(rightNum) ? 0 : rightNum)
            break
          case "×":
            result = (isNaN(leftNum) ? 0 : leftNum) * (isNaN(rightNum) ? 0 : rightNum)
            break
          case "÷":
            if (isNaN(rightNum) || rightNum === 0) {
              result = "Error: Division by zero"
            } else {
              result = (isNaN(leftNum) ? 0 : leftNum) / rightNum
            }
            break
          case "<":
            result = leftNum < rightNum
            break
          case ">":
            result = leftNum > rightNum
            break
          case "=":
            result = leftValue === rightValue
            break
          case "IF":
            const condition = leftNum < rightNum
            result = condition ? formulaConfig.ifTrueValue || "TRUE" : formulaConfig.ifFalseValue || "FALSE"
            break
          default:
            result = "Invalid operation"
        }

        return {
          ...row,
          computed_result: result,
          row_index: index + 1,
        }
      })

      setComputedResults(results)
      setShowResults(true)
      toast.success(`Formula applied to ${results.length} rows`)
    } catch (error) {
      console.error("Error running formula:", error)
      toast.error("Failed to run formula")
    }
  }

  const saveResults = async () => {
    if (!computedResults.length) {
      toast.error("No computed results to save")
      return
    }

    if (saveMode === "new" && !newTableName.trim()) {
      toast.error("Please enter a table name")
      return
    }

    if (saveMode === "existing" && !existingTableName) {
      toast.error("Please select an existing table")
      return
    }

    try {
      setSaving(true)

      let result
      if (saveMode === "new") {
        result = await createTableWithData(newTableName.trim(), computedResults)
      } else {
        result = await saveResultsToExistingTable(existingTableName, computedResults)
      }

      if (result.success) {
        toast.success(result.message)
        setNewTableName("")
        setExistingTableName("")

        // Refresh table list to include the new table
        if (saveMode === "new") {
          await fetchTableNames()
        }
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error("Error saving results:", error)
      toast.error("Failed to save results")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Controls Automation</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Create Excel-like logic on your data with automated processing
        </p>
      </div>

      {/* Table Loading */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleStackIcon className="h-5 w-5" />
            Load Data Tables
          </CardTitle>
          <CardDescription>Load multiple tables to work with ({tableNames.length} available)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500">Discovering tables...</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Table Loading Slots */}
            {[0, 1, 2].map((slotIndex) => {
              const loadedTable = loadedTables[slotIndex]
              return (
                <div key={slotIndex} className="space-y-2">
                  <label className="text-sm font-medium">Table {slotIndex + 1}</label>
                  {loadedTable ? (
                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{loadedTable.name}</div>
                        <div className="text-xs text-gray-500">
                          {loadedTable.data.length} rows, {loadedTable.columns.length} columns
                        </div>
                      </div>
                      <button
                        onClick={() => removeTable(loadedTable.name)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                      >
                        <XMarkIcon className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Select value="" onValueChange={(tableName) => tableName && loadTable(tableName)}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder={tableNames.length > 0 ? "Select table" : "No tables found"} />
                        </SelectTrigger>
                        <SelectContent>
                          {tableNames
                            .filter((name) => !loadedTables.find((t) => t.name === name))
                            .map((tableName) => (
                              <SelectItem key={tableName} value={tableName}>
                                {tableName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Additional tables beyond the first 3 */}
          {loadedTables.length > 3 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Additional Tables:</h4>
              <div className="flex flex-wrap gap-2">
                {loadedTables.slice(3).map((table) => (
                  <Badge key={table.name} variant="secondary" className="flex items-center gap-2">
                    {table.name} ({table.data.length} rows)
                    <button
                      onClick={() => removeTable(table.name)}
                      className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Load more tables option */}
          {loadedTables.length >= 3 &&
            tableNames.filter((name) => !loadedTables.find((t) => t.name === name)).length > 0 && (
              <div className="flex gap-4 pt-2 border-t">
                <div className="flex-1">
                  <Select value="" onValueChange={(tableName) => tableName && loadTable(tableName)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Load additional table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tableNames
                        .filter((name) => !loadedTables.find((t) => t.name === name))
                        .map((tableName) => (
                          <SelectItem key={tableName} value={tableName}>
                            {tableName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Working Table Selection */}
      {loadedTables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Working Table</CardTitle>
            <CardDescription>Choose which table to apply formulas to</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedWorkingTable} onValueChange={setSelectedWorkingTable}>
              <SelectTrigger>
                <SelectValue placeholder="Select working table" />
              </SelectTrigger>
              <SelectContent>
                {loadedTables.map((table) => (
                  <SelectItem key={table.name} value={table.name}>
                    {table.name} ({table.data.length} rows, {table.columns.length} columns)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {selectedWorkingTable && getWorkingTable() && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview - {selectedWorkingTable}</CardTitle>
            <CardDescription>Showing {getWorkingTable()?.data.length} rows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {getWorkingTable()?.columns.map((column) => (
                      <TableHead key={column}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getWorkingTable()
                    ?.data.slice(0, 10)
                    .map((row, index) => (
                      <TableRow key={index}>
                        {getWorkingTable()?.columns.map((column) => (
                          <TableCell key={column}>
                            {String(row[column] || "").substring(0, 50)}
                            {String(row[column] || "").length > 50 ? "..." : ""}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formula Builder */}
      {loadedTables.length > 0 && selectedWorkingTable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BoltIcon className="h-5 w-5" />
              Formula Builder
            </CardTitle>
            <CardDescription>Create logic to process your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Left Operand */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Left Operand</label>
                <Select
                  value={formulaConfig.leftOperandType}
                  onValueChange={(value: "column" | "value") =>
                    setFormulaConfig((prev) => ({ ...prev, leftOperandType: value, leftOperand: "" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="column">Column</SelectItem>
                    <SelectItem value="value">Static Value</SelectItem>
                  </SelectContent>
                </Select>

                {formulaConfig.leftOperandType === "column" ? (
                  <div className="space-y-2">
                    <Select
                      value={formulaConfig.leftTable || selectedWorkingTable}
                      onValueChange={(value) =>
                        setFormulaConfig((prev) => ({ ...prev, leftTable: value, leftOperand: "" }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadedTables.map((table) => (
                          <SelectItem key={table.name} value={table.name}>
                            {table.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={formulaConfig.leftOperand}
                      onValueChange={(value) => setFormulaConfig((prev) => ({ ...prev, leftOperand: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadedTables
                          .find((t) => t.name === (formulaConfig.leftTable || selectedWorkingTable))
                          ?.columns.map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <Input
                    placeholder="Enter value"
                    value={formulaConfig.leftOperand}
                    onChange={(e) => setFormulaConfig((prev) => ({ ...prev, leftOperand: e.target.value }))}
                  />
                )}
              </div>

              {/* Operation */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Operation</label>
                <Select
                  value={formulaConfig.operation}
                  onValueChange={(value: any) => setFormulaConfig((prev) => ({ ...prev, operation: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+">+ (Add)</SelectItem>
                    <SelectItem value="-">- (Subtract)</SelectItem>
                    <SelectItem value="×">× (Multiply)</SelectItem>
                    <SelectItem value="÷">÷ (Divide)</SelectItem>
                    <SelectItem value="<">{"<"} (Less than)</SelectItem>
                    <SelectItem value=">">{">"} (Greater than)</SelectItem>
                    <SelectItem value="=">= (Equal)</SelectItem>
                    <SelectItem value="IF">IF (Condition)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Right Operand */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Right Operand</label>
                <Select
                  value={formulaConfig.rightOperandType}
                  onValueChange={(value: "column" | "value") =>
                    setFormulaConfig((prev) => ({ ...prev, rightOperandType: value, rightOperand: "" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="column">Column</SelectItem>
                    <SelectItem value="value">Static Value</SelectItem>
                  </SelectContent>
                </Select>

                {formulaConfig.rightOperandType === "column" ? (
                  <div className="space-y-2">
                    <Select
                      value={formulaConfig.rightTable || selectedWorkingTable}
                      onValueChange={(value) =>
                        setFormulaConfig((prev) => ({ ...prev, rightTable: value, rightOperand: "" }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadedTables.map((table) => (
                          <SelectItem key={table.name} value={table.name}>
                            {table.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={formulaConfig.rightOperand}
                      onValueChange={(value) => setFormulaConfig((prev) => ({ ...prev, rightOperand: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadedTables
                          .find((t) => t.name === (formulaConfig.rightTable || selectedWorkingTable))
                          ?.columns.map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <Input
                    placeholder="Enter value"
                    value={formulaConfig.rightOperand}
                    onChange={(e) => setFormulaConfig((prev) => ({ ...prev, rightOperand: e.target.value }))}
                  />
                )}
              </div>

              {/* Run Formula Button */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Execute</label>
                <Button
                  onClick={runFormula}
                  disabled={!formulaConfig.leftOperand || !formulaConfig.rightOperand || loading}
                  className="w-full"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Run Formula
                </Button>
              </div>
            </div>

            {/* IF Statement Additional Fields */}
            {formulaConfig.operation === "IF" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <label className="text-sm font-medium">If True Value</label>
                  <Input
                    placeholder="Value when condition is true"
                    value={formulaConfig.ifTrueValue || ""}
                    onChange={(e) => setFormulaConfig((prev) => ({ ...prev, ifTrueValue: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">If False Value</label>
                  <Input
                    placeholder="Value when condition is false"
                    value={formulaConfig.ifFalseValue || ""}
                    onChange={(e) => setFormulaConfig((prev) => ({ ...prev, ifFalseValue: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {showResults && computedResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Computed Results</CardTitle>
            <CardDescription>Results with computed column added</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(computedResults[0]).map((column) => (
                      <TableHead
                        key={column}
                        className={column === "computed_result" ? "bg-green-50 dark:bg-green-900/20" : ""}
                      >
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {computedResults.slice(0, 10).map((row, index) => (
                    <TableRow key={index}>
                      {Object.keys(row).map((column) => (
                        <TableCell
                          key={column}
                          className={column === "computed_result" ? "bg-green-50 dark:bg-green-900/20 font-medium" : ""}
                        >
                          {String(row[column] || "").substring(0, 50)}
                          {String(row[column] || "").length > 50 ? "..." : ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Save Options */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="saveMode"
                    value="new"
                    checked={saveMode === "new"}
                    onChange={(e) => setSaveMode(e.target.value as "new" | "existing")}
                  />
                  Create New Table
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="saveMode"
                    value="existing"
                    checked={saveMode === "existing"}
                    onChange={(e) => setSaveMode(e.target.value as "new" | "existing")}
                  />
                  Save to Existing Table
                </label>
              </div>

              <div className="flex gap-4">
                {saveMode === "new" ? (
                  <Input
                    placeholder="Enter new table name"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    className="flex-1"
                  />
                ) : (
                  <Select value={existingTableName} onValueChange={setExistingTableName}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select existing table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tableNames.map((tableName) => (
                        <SelectItem key={tableName} value={tableName}>
                          {tableName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button onClick={saveResults} disabled={saving}>
                  {saving ? "Saving..." : "Save Results"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
