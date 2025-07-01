interface FieldInfo {
  path: string
  type: string
  sensitive: boolean
  value: any
}

const SENSITIVE_KEYS = ["key", "secret", "password", "email", "token", "ipaddress"]

export const extractFields = (obj: any, prefix = ""): FieldInfo[] => {
  if (typeof obj !== "object" || obj === null) {
    return []
  }

  return Object.entries(obj).flatMap(([key, value]) => {
    const currentPath = prefix ? `${prefix}.${key}` : key
    const isSensitive = SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return extractFields(value, currentPath)
    } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
      // Handle array of objects by inspecting the first item
      return extractFields(value[0], `${currentPath}[0]`)
    } else {
      return [
        {
          path: currentPath,
          type: Array.isArray(value) ? "array" : typeof value,
          sensitive: isSensitive,
          value: value,
        },
      ]
    }
  })
}
