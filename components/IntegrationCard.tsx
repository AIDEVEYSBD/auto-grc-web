"use client"

import { memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Integration } from "@/types"
import QualysSSLIntegrationCard from "./QualysSSLIntegrationCard"

interface IntegrationCardProps {
  integration: Integration
  onConnect?: (integration: Integration) => void
}

const QUALYS_ID = "b3f4ff74-56c1-4321-b137-690b939e454a"

function IntegrationCard({ integration, onConnect }: IntegrationCardProps) {
  if (integration.id === QUALYS_ID && integration["is-connected"]) {
    return <QualysSSLIntegrationCard integration={integration} />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{integration.name}</CardTitle>
          {integration["is-connected"] && <Badge variant="secondary">Connected</Badge>}
        </div>
        <CardDescription>{integration.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!integration["is-connected"] && onConnect && <Button onClick={() => onConnect(integration)}>Connect</Button>}
        {integration["is-connected"] && <p className="text-sm text-muted-foreground">This integration is connected.</p>}
      </CardContent>
    </Card>
  )
}

export default memo(IntegrationCard)
