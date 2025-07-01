"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Lock, FileJson, Type, Hash, ToggleLeft } from "lucide-react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { extractFields, type ExtractedField } from "@/lib/qualys"
import type { Integration } from "@/types"

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  workEmail: z.string().email("Invalid email address"),
  organization: z.string().min(1, "Organization is required"),
  targetHostname: z.string().min(1, "Target hostname is required"),
})

type FormValues = z.infer<typeof formSchema>

interface QualysRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  tool: Integration
  onSuccess: () => void
}

export default function QualysRegistrationModal({ isOpen, onClose, tool, onSuccess }: QualysRegistrationModalProps) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([])
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())
  const [userInfo, setUserInfo] = useState<FormValues | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetHostname: "autogrc.cloud",
    },
  })

  const handleUserInfoSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true)
    setError(null)
    setUserInfo(data)

    try {
      const response = await fetch(`/api/ssllabs?host=${data.targetHostname}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to analyze hostname.")
      }
      const apiData = await response.json()
      const fields = extractFields(apiData)
      setExtractedFields(fields)

      // Pre-select non-sensitive fields
      const initialSelected = new Set(fields.filter((f) => !f.sensitive).map((f) => f.path))
      setSelectedFields(initialSelected)
      setStep(2)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveConfiguration = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const config = {
        userInfo,
        selectedFields: Array.from(selectedFields),
      }
      const response = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId: tool.id, config }),
      })

      if (!response.ok) {
        throw new Error("Failed to save configuration.")
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const categorizedFields = useMemo(() => {
    const categories: Record<string, ExtractedField[]> = {}
    extractedFields
      .filter((field) => !field.path.includes("."))
      .forEach((categoryField) => {
        categories[categoryField.path] = extractedFields.filter(
          (field) => field.path.startsWith(`${categoryField.path}.`) || field.path.startsWith(`${categoryField.path}[`),
        )
      })
    return categories
  }, [extractedFields])

  const handleFieldToggle = (path: string) => {
    setSelectedFields((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleSubmit(handleUserInfoSubmit)}>
            <DialogHeader>
              <DialogTitle>Connect to Qualys SSL Labs</DialogTitle>
              <DialogDescription>
                Enter your information to begin the integration process. We'll perform a one-time scan to configure data
                fields.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...register("firstName")} className="col-span-3" />
                {errors.firstName && <p className="col-span-4 text-red-500 text-sm">{errors.firstName.message}</p>}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...register("lastName")} className="col-span-3" />
                {errors.lastName && <p className="col-span-4 text-red-500 text-sm">{errors.lastName.message}</p>}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="workEmail">Work Email</Label>
                <Input id="workEmail" {...register("workEmail")} className="col-span-3" />
                {errors.workEmail && <p className="col-span-4 text-red-500 text-sm">{errors.workEmail.message}</p>}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="organization">Organization</Label>
                <Input id="organization" {...register("organization")} className="col-span-3" />
                {errors.organization && (
                  <p className="col-span-4 text-red-500 text-sm">{errors.organization.message}</p>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetHostname">Target Hostname</Label>
                <Input id="targetHostname" {...register("targetHostname")} className="col-span-3" />
                {errors.targetHostname && (
                  <p className="col-span-4 text-red-500 text-sm">{errors.targetHostname.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              {error && <p className="text-red-500 text-sm mr-auto">{error}</p>}
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Analyze & Continue
              </Button>
            </DialogFooter>
          </form>
        )
      case 2:
        return (
          <div>
            <DialogHeader>
              <DialogTitle>Configure Data Fields</DialogTitle>
              <DialogDescription>
                Select the data fields you want to capture from SSL Labs analysis. Unselected fields will be obfuscated.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center text-sm">
              {extractedFields.length} fields available, {selectedFields.size} selected
            </div>
            <div className="h-[40vh] overflow-y-auto pr-2">
              <Accordion type="multiple" className="w-full" defaultValue={Object.keys(categorizedFields)}>
                {Object.entries(categorizedFields).map(([category, fields]) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="text-base font-semibold capitalize">{category}</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {fields.map((field) => (
                          <div
                            key={field.path}
                            className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Checkbox
                              id={field.path}
                              checked={selectedFields.has(field.path)}
                              onCheckedChange={() => handleFieldToggle(field.path)}
                            />
                            <label htmlFor={field.path} className="flex-1 text-sm font-mono cursor-pointer">
                              {field.path}
                            </label>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {field.sensitive && <Lock className="h-3 w-3 text-yellow-500" title="Sensitive" />}
                              {
                                {
                                  string: <Type className="h-3 w-3" />,
                                  number: <Hash className="h-3 w-3" />,
                                  boolean: <ToggleLeft className="h-3 w-3" />,
                                  array: <FileJson className="h-3 w-3" />,
                                  object: <FileJson className="h-3 w-3" />,
                                }[field.type]
                              }
                              <span>{field.type}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
            <DialogFooter className="mt-4">
              {error && <p className="text-red-500 text-sm mr-auto">{error}</p>}
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleSaveConfiguration} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Configuration
              </Button>
            </DialogFooter>
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">{renderStep()}</DialogContent>
    </Dialog>
  )
}
