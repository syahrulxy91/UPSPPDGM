import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ProgramRecord } from "../../institusi-portal/services/portalService";

const BULAN_MAP: Record<string, string> = {
  "01": "Januari",
  "02": "Februari",
  "03": "Mac",
  "04": "April",
  "05": "Mei",
  "06": "Jun",
  "07": "Julai",
  "08": "Ogos",
  "09": "September",
  "10": "Oktober",
  "11": "November",
  "12": "Disember"
};

function formatMalayDate(dateString?: string): string {
  if (!dateString) return "-";
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  const year = parts[0];
  const monthCode = parts[1];
  const day = parseInt(parts[2], 10);
  
  const monthName = BULAN_MAP[monthCode] || monthCode;
  return `${day} ${monthName} ${year}`;
}

export function exportProgramPdf(params: {
  institusiNama: string;
  programs: ProgramRecord[];
  filters: { bulan?: string; status?: string };
  stats: {
    jumlah: number;
    selesai: number;
    dirancang: number;
  };
}) {
  const { institusiNama, programs, filters, stats } = params;
  
  // Create jsPDF instance
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const logoColor = [30, 58, 138]; // Deep blue (rgb)
  const textColor = [51, 65, 85]; // Slate-700
  const titleColor = [15, 23, 42]; // Slate-900

  // Total pages calculation can be done in autoTable footers dynamically
  // 1. TOP BORDER ACCENT
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.rect(0, 0, 210, 4, "F");

  // 2. HEADER TITLE
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(logoColor[0], logoColor[1], logoColor[2]);
  doc.text("LAPORAN PROGRAM / AKTIVITI INSTITUSI", 15, 18);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text("SISTEM PORTAL INSTITUSI SWASTA (SPS) KPM", 15, 24);

  // Draw divider line below header
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.5);
  doc.line(15, 27, 195, 27);

  // 3. METADATA SECTION (Two-column layout)
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  // Column 1
  doc.setFont("Helvetica", "bold");
  doc.text("Institusi:", 15, 33);
  doc.setFont("Helvetica", "normal");
  doc.text(institusiNama || "-", 38, 33);

  doc.setFont("Helvetica", "bold");
  doc.text("Tarikh Dijana:", 15, 39);
  doc.setFont("Helvetica", "normal");
  // Get current date formatted in Malay: e.g. 9 Jun 2026
  const today = new Date();
  const todayFormatted = `${today.getDate()} ${BULAN_MAP[String(today.getMonth() + 1).padStart(2, "0")] || ""} ${today.getFullYear()}`;
  doc.text(todayFormatted, 38, 39);

  // Column 2
  const monthFilterLabel = filters.bulan ? (BULAN_MAP[filters.bulan] || filters.bulan) : "Semua Bulan";
  doc.setFont("Helvetica", "bold");
  doc.text("Tapisan Bulan:", 115, 33);
  doc.setFont("Helvetica", "normal");
  doc.text(monthFilterLabel, 142, 33);

  const statusFilterLabel = filters.status ? filters.status : "Semua Status";
  doc.setFont("Helvetica", "bold");
  doc.text("Tapisan Status:", 115, 39);
  doc.setFont("Helvetica", "normal");
  doc.text(statusFilterLabel, 142, 39);

  // 4. STATISTICAL WIDGETS (Drawn via beautiful light colored single-row autoTable to ensure alignment and paging stability)
  autoTable(doc, {
    startY: 45,
    margin: { left: 15, right: 15 },
    theme: "plain",
    styles: {
      fontSize: 8,
      font: "Helvetica",
      cellPadding: 4,
    },
    head: [[]], // empty head
    body: [
      [
        {
          content: `JUMLAH PROGRAM\n\n${stats.jumlah}`,
          styles: {
            halign: "center",
            fontStyle: "bold",
            fillColor: [238, 242, 255], // Indigo-50
            textColor: [67, 56, 202], // Indigo-700
          }
        },
        {
          content: `PROGRAM SELESAI\n\n${stats.selesai}`,
          styles: {
            halign: "center",
            fontStyle: "bold",
            fillColor: [240, 253, 250], // Emerald-50
            textColor: [4, 120, 87], // Emerald-700
          }
        },
        {
          content: `DALAM PERANCANGAN\n\n${stats.dirancang}`,
          styles: {
            halign: "center",
            fontStyle: "bold",
            fillColor: [239, 246, 255], // Blue-50
            textColor: [29, 78, 216], // Blue-700
          }
        }
      ]
    ],
    columnStyles: {
      0: { cellWidth: 59 },
      1: { cellWidth: 59 },
      2: { cellWidth: 60 }
    }
  });

  // 5. JADUAL SENARAI PROGRAM
  const tableData = programs.map((p, idx) => [
    (idx + 1).toString(),
    p.nama || "-",
    formatMalayDate(p.tarikh),
    p.status || "-",
    (p.bilPeserta || 0).toString() + " orang",
    p.penerangan || "-"
  ]);

  // Retrieve end of previous autotable to append the new table
  const finalYOfStats = (doc as any).lastAutoTable?.finalY || 65;

  autoTable(doc, {
    startY: finalYOfStats + 7,
    margin: { left: 15, right: 15 },
    head: [["Bil.", "Nama Program / Aktiviti", "Tarikh", "Status", "Bil. Peserta", "Penerangan Ringkas"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [30, 58, 138], // Deep navy blue
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "left"
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      valign: "middle"
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 40, fontStyle: "bold" },
      2: { cellWidth: 28 },
      3: { cellWidth: 22 },
      4: { cellWidth: 20, halign: "center" },
      5: { cellWidth: "auto" }
    },
    didDrawPage: (data) => {
      // Dynamic footer on every page
      const pageCount = (doc as any).internal.getNumberOfPages();
      
      doc.setDrawColor(241, 245, 249); // Slate-100
      doc.setLineWidth(0.3);
      doc.line(15, 280, 195, 280);

      doc.setFont("Helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // Slate-400
      
      const footerMsg = "Laporan ini dijana secara automatik oleh Sistem SPS PPD Gua Musang";
      doc.text(footerMsg, 15, 284);
      
      const pageInfo = `Halaman ${data.pageNumber} daripada ${pageCount}`;
      doc.text(pageInfo, 195 - doc.getTextWidth(pageInfo), 284);
    }
  });

  // 6. SUMMARY FOOTER (After table ends)
  const finalYOfTable = (doc as any).lastAutoTable?.finalY || 150;
  
  // Checking page space to write total summary safely
  let summaryY = finalYOfTable + 10;
  if (summaryY > 265) {
    doc.addPage();
    summaryY = 20;
  }

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(`Jumlah rekod dieksport: ${programs.length} unit program`, 15, summaryY);

  // Build perfect file name
  const nameClean = (institusiNama || "institusi")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const fileMonthPart = filters.bulan ? `-${BULAN_MAP[filters.bulan].toLowerCase()}` : "";
  const filename = `laporan-program-${nameClean}${fileMonthPart}-2026.pdf`;

  // Save Document
  doc.save(filename);
}
