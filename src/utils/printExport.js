/**
 * Print and PDF export utilities for monthly attendance reports.
 * Accepts plain data objects; no Firestore logic inside.
 */

/**
 * Generate a comprehensive monthly attendance report HTML.
 * Returns HTML string ready for printing or PDF conversion.
 *
 * Data shape:
 * {
 *   className: 'YSA Young Adults',
 *   instructorName: 'John Smith',
 *   month: 'January 2026',
 *   sessions: [
 *     {
 *       sessionId: 'x1',
 *       sessionDate: '2026-01-15',
 *       records: [
 *         { participantName: 'Jane Doe', status: 'present', markedBy: 'John Smith', markedAt: timestamp }
 *       ]
 *     }
 *   ],
 *   totalMembers: 45,
 *   totalNonMembers: 12,
 *   byuPathwayIndicator: '5 enrolled',
 * }
 */
export function generateMonthlyAttendanceHTML({
  className = 'Class',
  instructorName = 'Instructor',
  month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
  sessions = [],
  totalMembers = 0,
  totalNonMembers = 0,
  byuPathwayIndicator = 'N/A',
} = {}) {
  // Flatten all records from all sessions
  const allRecords = sessions.flatMap((s) =>
    (s.records || []).map((r) => ({
      ...r,
      sessionDate: s.sessionDate,
      sessionId: s.sessionId,
    }))
  );

  // Calculate total attendance summary
  const totalSummary = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
  };
  allRecords.forEach((r) => {
    if (totalSummary.hasOwnProperty(r.status)) {
      totalSummary[r.status]++;
    }
  });

  const totalYSA = totalMembers + totalNonMembers;
  const classesHeld = sessions.length;

  // Generate rows for attendance table
  const recordRows = allRecords
    .map(
      (r) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${r.participantName || 'Unknown'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">
          <span style="padding: 3px 6px; background: ${getStatusColor(r.status)}; color: white; border-radius: 3px; font-size: 11px;">
            ${r.status}
          </span>
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; font-size: 12px;">${r.markedBy || '—'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; font-size: 12px; color: #666;">
          ${r.markedAt ? new Date(r.markedAt).toLocaleString() : '—'}
        </td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Monthly Attendance Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 15px;
          border-bottom: 3px solid #333;
          padding-bottom: 10px;
        }
        .header h1 {
          margin: 0 0 5px 0;
          font-size: 22px;
          font-weight: bold;
        }
        .header-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-top: 5px;
          color: #666;
        }
        .summary-section {
          margin: 15px 0;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 12px;
          background: #f9f9f9;
        }
        .summary-title {
          font-weight: bold;
          margin-bottom: 8px;
          border-bottom: 1px solid #ccc;
          padding-bottom: 5px;
          font-size: 13px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          font-size: 12px;
        }
        .summary-item {
          padding: 6px 0;
        }
        .summary-item strong {
          display: inline-block;
          min-width: 140px;
        }
        .summary-item .value {
          font-weight: bold;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          border: 1px solid #ddd;
        }
        thead {
          background-color: #333;
          color: white;
        }
        th {
          padding: 10px 8px;
          text-align: left;
          font-weight: bold;
          font-size: 12px;
          border-right: 1px solid #ddd;
        }
        th:last-child {
          border-right: none;
        }
        td {
          padding: 8px;
          font-size: 12px;
          border-right: 1px solid #f0f0f0;
        }
        td:last-child {
          border-right: none;
        }
        .status-badge {
          padding: 3px 6px;
          border-radius: 3px;
          color: white;
          font-size: 11px;
          font-weight: bold;
        }
        .summary-totals {
          margin-top: 15px;
          padding: 12px;
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .summary-totals-title {
          font-weight: bold;
          margin-bottom: 8px;
          font-size: 13px;
        }
        .totals-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          font-size: 12px;
        }
        .total-item {
          text-align: center;
          padding: 8px;
          background: white;
          border-radius: 3px;
          border: 1px solid #ddd;
        }
        .total-item .label {
          font-size: 11px;
          color: #666;
        }
        .total-item .number {
          font-size: 16px;
          font-weight: bold;
          color: #333;
          margin-top: 4px;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 11px;
          color: #999;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        .signature-section {
          margin-top: 30px;
          display: flex;
          gap: 80px;
        }
        .signature-line {
          border-top: 1px solid #333;
          min-width: 140px;
          text-align: center;
          font-size: 11px;
          padding-top: 5px;
          color: #666;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <h1>Monthly Attendance Report</h1>
        <div class="header-meta">
          <div><strong>${className}</strong></div>
          <div><strong>${month}</strong></div>
          <div>Generated: ${new Date().toLocaleString()}</div>
        </div>
      </div>

      <!-- Summary Section -->
      <div class="summary-section">
        <div class="summary-title">Summary</div>
        <div class="summary-grid">
          <div class="summary-item">
            <strong>Instructor:</strong>
            <span class="value">${instructorName}</span>
          </div>
          <div class="summary-item">
            <strong>Classes Held:</strong>
            <span class="value">${classesHeld}</span>
          </div>
          <div class="summary-item">
            <strong>YSA Total:</strong>
            <span class="value">${totalYSA} ${totalMembers > 0 ? `(${totalMembers} Members + ${totalNonMembers} Non-Members)` : ''}</span>
          </div>
          <div class="summary-item">
            <strong>BYU Pathway:</strong>
            <span class="value">${byuPathwayIndicator}</span>
          </div>
        </div>
      </div>

      <!-- Attendance Table -->
      <div style="margin-top: 15px;">
        <div style="font-weight: bold; margin-bottom: 8px; font-size: 13px;">Attendance Records</div>
        <table>
          <thead>
            <tr>
              <th>Participant Name</th>
              <th>Status</th>
              <th>Marked By</th>
              <th>Marked Time</th>
            </tr>
          </thead>
          <tbody>
            ${recordRows || '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #999;">No attendance records</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- Summary Totals -->
      <div class="summary-totals">
        <div class="summary-totals-title">Month Summary - Attendance Totals</div>
        <div class="totals-grid">
          <div class="total-item">
            <div class="label">Present</div>
            <div class="number" style="color: #28a745;">${totalSummary.present}</div>
          </div>
          <div class="total-item">
            <div class="label">Late</div>
            <div class="number" style="color: #ffc107;">${totalSummary.late}</div>
          </div>
          <div class="total-item">
            <div class="label">Excused</div>
            <div class="number" style="color: #17a2b8;">${totalSummary.excused}</div>
          </div>
          <div class="total-item">
            <div class="label">Absent</div>
            <div class="number" style="color: #dc3545;">${totalSummary.absent}</div>
          </div>
        </div>
      </div>

      <!-- Signature Section -->
      <div class="signature-section">
        <div class="signature-line">Instructor Signature</div>
        <div class="signature-line">Date</div>
      </div>

      <div class="footer">
        <p>YSA GP Attendance System | ${month}</p>
      </div>
    </body>
    </html>
  `;
}

function getStatusColor(status) {
  const colors = {
    present: '#28a745',
    late: '#ffc107',
    excused: '#17a2b8',
    absent: '#dc3545',
  };
  return colors[status] || '#999';
}

/**
 * Export monthly attendance report as PDF using html2canvas + jsPDF.
 * Requires: npm install html2canvas jspdf
 */
export async function exportMonthlyToPDF({
  className = 'Class',
  instructorName = 'Instructor',
  month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
  sessions = [],
  totalMembers = 0,
  totalNonMembers = 0,
  byuPathwayIndicator = 'N/A',
  filename = 'monthly-attendance-report.pdf',
} = {}) {
  try {
    // Dynamic import to avoid requiring jspdf/html2canvas at parse time
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).jsPDF;

    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = generateMonthlyAttendanceHTML({
      className,
      instructorName,
      month,
      sessions,
      totalMembers,
      totalNonMembers,
      byuPathwayIndicator,
    });
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm';
    document.body.appendChild(container);

    // Convert HTML to canvas
    const canvas = await html2canvas(container, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297; // A4 height in mm

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }

    pdf.save(filename);
    document.body.removeChild(container);
  } catch (err) {
    console.error('PDF export failed:', err);
    throw err;
  }
}

/**
 * Open print dialog for monthly attendance report.
 * Accepts plain data and opens browser print dialog.
 */
export function printMonthlyAttendance({
  className = 'Class',
  instructorName = 'Instructor',
  month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
  sessions = [],
  totalMembers = 0,
  totalNonMembers = 0,
  byuPathwayIndicator = 'N/A',
} = {}) {
  const html = generateMonthlyAttendanceHTML({
    className,
    instructorName,
    month,
    sessions,
    totalMembers,
    totalNonMembers,
    byuPathwayIndicator,
  });

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for styles to load then trigger print
  printWindow.onload = () => {
    printWindow.print();
  };
}

export default {
  generateMonthlyAttendanceHTML,
  exportMonthlyToPDF,
  printMonthlyAttendance,
};
