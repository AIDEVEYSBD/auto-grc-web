const SENSITIVE_KEYWORDS = ["key", "secret", "password", "email", "token", "address", "name", "subject"]

export interface ExtractedField {
  path: string
  type: string
  sensitive: boolean
  value: any
}

export const getFieldType = (value: any): string => {
  if (Array.isArray(value)) return "array"
  if (typeof value === "object" && value !== null) return "object"
  return typeof value
}

export const isSensitive = (path: string): boolean => {
  const lowerPath = path.toLowerCase()
  return SENSITIVE_KEYWORDS.some((keyword) => lowerPath.includes(keyword))
}

export const extractFields = (obj: any, prefix = ""): ExtractedField[] => {
  let fields: ExtractedField[] = []

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newPrefix = prefix ? `${prefix}.${key}` : key
      const value = obj[key]
      const type = getFieldType(value)

      fields.push({
        path: newPrefix,
        type,
        sensitive: isSensitive(newPrefix),
        value,
      })

      if (type === "object") {
        fields = fields.concat(extractFields(value, newPrefix))
      } else if (type === "array" && value.length > 0 && typeof value[0] === "object") {
        // For arrays of objects, extract fields from the first object as a template
        fields = fields.concat(extractFields(value[0], `${newPrefix}[0]`))
      }
    }
  }
  return fields
}
