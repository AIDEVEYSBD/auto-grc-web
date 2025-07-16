"use client"

import { useState } from "react"
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Loader2, AlertTriangle } from "lucide-react"
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion"

export default function SSLCard() {
    const [url, setUrl] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState("")

    const clearScan = () => {
        setUrl("")
        setResult(null)
        setError("")
        setLoading(false)
    }

    const handleScan = async () => {
        if (!url) return
        setLoading(true)
        setResult(null)
        setError("")

        try {
            const response = await fetch("/api/ssllabs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ host: url }),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Scan failed")

            setResult({
                host: data.host,
                status: data.status,
                engineVersion: data.engineVersion,
                criteriaVersion: data.criteriaVersion,
                startTime: new Date(data.startTime).toLocaleString(),
                testTime: new Date(data.testTime).toLocaleString(),
                endpoints: data.endpoints || [],
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full shadow-sm bg-white dark:bg-gray-900">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    SSL Test
                </CardTitle>
                <CardDescription>Enter a URL to analyze SSL configuration</CardDescription>
            </CardHeader>

            <CardContent>
                <div className="flex gap-2">
                    <Input
                        placeholder="google.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleScan()}
                    />
                    <Button onClick={handleScan}   disabled={loading} >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Scanning..." : "Scan"}
                    </Button>
                    <Button
                        onClick={clearScan}

                    >Clear</Button>
                </div>

                {loading && (
                    <div className="mt-4">
                        <Progress value={33} className="h-2" />
                        <p className="text-sm text-muted-foreground mt-2">
                            Scan in progress. Please wait...
                        </p>
                    </div>
                )}

                {result && (
                    <div className="mt-4 space-y-4 text-sm text-gray-800 dark:text-gray-200">
                        <div>
                            <p><strong>Host:</strong> {result.host}</p>
                            <p><strong>Status:</strong> {result.status}</p>
                            <p><strong>Engine Version:</strong> {result.engineVersion}</p>
                            <p><strong>Criteria Version:</strong> {result.criteriaVersion}</p>
                            <p><strong>Start Time:</strong> {result.startTime}</p>
                            <p><strong>Test Time:</strong> {result.testTime}</p>
                        </div>

                        <div className="mt-6">
                            <p className="font-semibold text-base mb-2">Endpoints</p>
                            <Accordion type="multiple" className="w-full space-y-2">
                                {result.endpoints.map((ep: any, idx: number) => (
                                    <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-md">
                                        <AccordionTrigger className="px-4 py-2 text-left">
                                            IP: {ep.ipAddress} | Grade: {ep.grade || "N/A"}
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-b-md">
                                            <p><strong>Status Message:</strong> {ep.statusMessage}</p>
                                            <p><strong>Grade:</strong> {ep.grade || "N/A"}</p>
                                            <p><strong>Trust Ignored Grade:</strong> {ep.gradeTrustIgnored}</p>
                                            <p><strong>Warnings:</strong> {ep.hasWarnings ? "Yes" : "No"}</p>
                                            <p><strong>Exceptional:</strong> {ep.isExceptional ? "Yes" : "No"}</p>
                                            <p><strong>Progress:</strong> {ep.progress}%</p>
                                            <p><strong>Duration:</strong> {ep.duration} ms</p>
                                            <p><strong>Delegation:</strong> {ep.delegation}</p>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </div>
                )}

                {error && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    )
}
