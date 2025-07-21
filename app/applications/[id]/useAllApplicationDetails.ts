import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Application {
  name: string;
  owner_email: string;
  created_at: string;
  criticality: string;
  cloud_provider?: string;
  overall_score?: number;
  url?: string;
}

export interface CCMDetails {
  created_at: string;
  "4.1": string;
  "2.2": string;
  "10.1": string;
  "16.13": string;
  "7.5": string;
  "7.3": string;
}
export interface CrowdstrikeDetails {
  control_id: string;
  particulars: string;
  score: number;
}
export interface WizDetails {
  cloud_risk?: string;
  misconfigurations?: number;
  last_scan?: string;
  vulnerabilities?: number;
}

export function useAllApplicationDetails(appId: string | undefined) {
  const [application, setApplication] = useState<Application | null>(null);
  const [ccm, setCCM] = useState<CCMDetails | null>(null);
  const [crowdstrike, setCrowdstrike] = useState<CrowdstrikeDetails | null>(null);
  const [wiz, setWiz] = useState<WizDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appId) return;
    setLoading(true);
    Promise.all([
      supabase.from("applications").select("*").eq("id", appId).single(),
      supabase.from("CCM").select("*").eq("application id", appId),
      supabase.from("crowdstrike").select("*").eq("application_id", appId),
      supabase.from("wiz").select("*").eq("application_id", appId),
    ]).then(([appRes, ccmRes, csRes, wizRes]) => {
      if (appRes.error) setError(appRes.error.message);
      setApplication(appRes.data || null);
      setCCM(ccmRes.data || null);
      setCrowdstrike(csRes.data || null);
      setWiz(wizRes.data || null);
      setLoading(false);
    });
  }, [appId]);

  return { application, ccm, crowdstrike, wiz, loading, error };
}
