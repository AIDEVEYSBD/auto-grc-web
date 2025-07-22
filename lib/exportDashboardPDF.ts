import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportDashboardPDF({ app, complianceSummary, complianceDetails }) {
  const doc = new jsPDF();
  let y = 18;
  doc.setFontSize(20);
  doc.text("Application Report", 14, y);
  y += 10;
  doc.setFontSize(14);
  // Service Information Card
  doc.text("Service Information", 14, y);
  y += 8;
  doc.setFontSize(12);
  if (app) {
    doc.text(`Name: ${app.name || "-"}`, 14, y);
    doc.text(`Owner: ${app.owner_email || "-"}`, 80, y);
    y += 6;
    doc.text(`Created: ${app.created_at ? new Date(app.created_at).toLocaleDateString() : "-"}`, 14, y);
    doc.text(`Cloud Provider: ${app.cloud_provider || "-"}`, 80, y);
    y += 6;
    doc.text(`Overall Score: ${app.overall_score || 0}%`, 14, y);
    doc.text(`Criticality: ${app.criticality || "-"}`, 80, y);
    y += 6;
    doc.text(`URL: ${app.url || "-"}`, 14, y);
    y += 10;
  }

  // Compliance Summary Card
  doc.setFontSize(14);
  doc.text("Compliance Summary", 14, y);
  y += 8;
  doc.setFontSize(12);
  if (complianceSummary) {
    doc.text(`Total Controls: ${complianceSummary.totalControls}`, 14, y);
    doc.text(`Fully Met: ${complianceSummary.fullyMet}`, 80, y);
    y += 6;
    doc.text(`Partially Met: ${complianceSummary.partiallyMet}`, 14, y);
    doc.text(`Not Met: ${complianceSummary.notMet}`, 80, y);
    y += 6;
    doc.text(`Average Score: ${complianceSummary.avgScore}%`, 14, y);
    doc.text(`Last Assessed: ${complianceSummary.latestAssessed ? new Date(complianceSummary.latestAssessed).toLocaleDateString() : "N/A"}`, 80, y);
    y += 10;
  }

  // Compliance Trend Card (just show the latest score and months)
  doc.setFontSize(12);
  doc.text("Compliance Trend", 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(`Months: Jan 2023, Apr 2023, Jul 2023, Oct 2023, Jan 2024`, 14, y);
  y += 6;
  doc.text(`Latest Compliance %: ${app && app.overall_score ? app.overall_score : 0}%`, 14, y);
  y += 10;

  // Compliance Details Table
  doc.setFontSize(14);
  doc.text("Compliance Details", 14, y);
  y += 8;
  doc.setFontSize(12);
  const headers = [
    ["Control ID", "Domain", "Control", "Status", "Score", "Source", "Assessed At"]
  ];
  const data = complianceDetails.map(detail => [
    detail.control_id,
    detail.domain,
    detail.control,
    detail.status,
    detail.score,
    detail.source,
    detail.assessed_at ? new Date(detail.assessed_at).toLocaleDateString() : ""
  ]);
  autoTable(doc, { head: headers, body: data, startY: y });
  doc.save(`${app.name}.pdf`);
}
