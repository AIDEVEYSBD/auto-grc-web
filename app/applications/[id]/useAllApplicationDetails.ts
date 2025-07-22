
// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";
// import type { Application, ComplianceSummary } from "@/types"; // Adjust import

// export function useApplicationComplianceDetails(appId: string | undefined) {
//   const [application, setApplication] = useState<Application | null>(null);
//   const [complianceSummary, setComplianceSummary] = useState<ComplianceSummary | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!appId) return;

//     setLoading(true);
//     setError(null);

//     Promise.all([
//       supabase.from("applications").select("*").eq("id", appId).single(),
//       supabase.from("compliance_assessment").select("status, score, assessed_at").eq("application_id", appId),
//     ])
//       .then(([appRes, complianceRes]) => {
//         if (appRes.error) return setError(appRes.error.message);
//         if (complianceRes.error) return setError(complianceRes.error.message);

//         setApplication(appRes.data || null);

//         if (complianceRes.data && Array.isArray(complianceRes.data)) {
//           const totalControls = complianceRes.data.length;
//           let partiallyMet = 0,
//             fullyMet = 0,
//             notMet = 0,
//             latestAssessed: string | null = null,
//             scoreSum = 0;
//           let latestDate = 0;

//           complianceRes.data.forEach((row: any) => {
//             if (row.status === "Partially Met") partiallyMet++;
//             else if (row.status === "Fully Met") fullyMet++;
//             else if (row.status === "Not Met") notMet++;

//             if (typeof row.score === "number") scoreSum += row.score;

//             if (row.assessed_at) {
//               const ts = new Date(row.assessed_at).getTime();
//               if (ts > latestDate) {
//                 latestDate = ts;
//                 latestAssessed = row.assessed_at;
//               }
//             }
//           });

//           const avgScore = totalControls > 0 ? Math.round((scoreSum / totalControls) * 100) / 100 : 0;

//           setComplianceSummary({
//             totalControls,
//             partiallyMet,
//             fullyMet,
//             notMet,
//             latestAssessed,
//             avgScore,
//           });
//         } else {
//           setComplianceSummary(null);
//         }
//       })
//       .catch((err) => {
//         setError(err.message || "Unknown error occurred");
//       })
//       .finally(() => setLoading(false));
//   }, [appId]);

//   return {
//     application,
//     complianceSummary,
//     loading,
//     error,
//   };
// }


import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Application, ComplianceSummary, ComplianceDetails } from "@/types";

export function useApplicationComplianceDetails(appId: string | undefined) {
  const [application, setApplication] = useState<Application | null>(null);
  const [complianceSummary, setComplianceSummary] = useState<ComplianceSummary | null>(null);
  const [complianceDetails, setComplianceDetails] = useState<ComplianceDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appId) return;

    setLoading(true);
    setError(null);

    Promise.all([
      supabase.from("applications").select("*").eq("id", appId).single(),
      supabase.from("compliance_assessment").select("status, score, assessed_at").eq("application_id", appId),
      supabase
        .from("compliance_assessment")
        .select(`
          control_id,
          score,
          status,
          source,
          assessed_at,
          controls:control_id ( ID, Controls, Domain )
        `)
        .eq("application_id", appId),
    ])
      .then(([appRes, complianceRes, complianceDetailsRes]) => {
        if (appRes.error) return setError(appRes.error.message);
        if (complianceRes.error) return setError(complianceRes.error.message);
        if (complianceDetailsRes.error) return setError(complianceDetailsRes.error.message);

        setApplication(appRes.data || null);

        // Summary Calculation
        if (complianceRes.data && Array.isArray(complianceRes.data)) {
          const totalControls = complianceRes.data.length;
          let partiallyMet = 0,
            fullyMet = 0,
            notMet = 0,
            latestAssessed: string | null = null,
            scoreSum = 0;
          let latestDate = 0;

          complianceRes.data.forEach((row: any) => {
            if (row.status === "Partially Met") partiallyMet++;
            else if (row.status === "Fully Met") fullyMet++;
            else if (row.status === "Not Met") notMet++;

            if (typeof row.score === "number") scoreSum += row.score;

            if (row.assessed_at) {
              const ts = new Date(row.assessed_at).getTime();
              if (ts > latestDate) {
                latestDate = ts;
                latestAssessed = row.assessed_at;
              }
            }
          });

          const avgScore = totalControls > 0 ? Math.round((scoreSum / totalControls) * 100) / 100 : 0;

          setComplianceSummary({
            totalControls,
            partiallyMet,
            fullyMet,
            notMet,
            latestAssessed,
            avgScore,
          });
        } else {
          setComplianceSummary(null);
        }

        // Compliance Details Mapping
        const details = (complianceDetailsRes.data || []).map((row: any) => ({
          control_id: row.controls?.ID || "",
          domain: row.controls?.Domain || "",
          control: row.controls?.Controls || "",
          score: row.score,
          status: row.status,
          source: row.source,
          assessed_at: row.assessed_at,
        }));

        setComplianceDetails(details);
      })
      .catch((err) => {
        setError(err.message || "Unknown error occurred");
      })
      .finally(() => setLoading(false));
  }, [appId]);

  return {
    application,
    complianceSummary,
    complianceDetails,
    loading,
    error,
  };
}
